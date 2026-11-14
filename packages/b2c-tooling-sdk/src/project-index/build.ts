/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import path from 'node:path';

import yaml from 'js-yaml';

import {
  type CartridgeFileSystemHost,
  type CartridgeLocation,
  CartridgeResolver,
  createNodeFileSystemHost,
  discoverCartridges,
  orderCartridges,
  toForwardSlashes,
} from '../cartridges/index.js';
import type {AstNode, ScriptRule, ScriptRuleContext, ScriptRuleListener} from '../security/rule.js';
import {
  type MiddlewareRef,
  type SfraRouteMethod,
  callsCsrfValidation,
  isCsrfValidator,
  isLoginValidator,
  sfraExtendTarget,
  sfraRouteCall,
  sgControllerExport,
} from '../security/script/routes.js';
import {runScriptRules} from '../security/script/runner.js';
import {analyzeModuleExports, type ModuleExports} from './exports.js';
import {droppedSecurityMiddleware} from './labels.js';
import type {
  EndpointMethod,
  IndexedCustomApiEndpoint,
  IndexedEndpoint,
  IndexedHook,
  IndexedJobStep,
  IndexedMiddleware,
  ProjectIndex,
  RouteStep,
} from './types.js';

/** Options for {@link buildProjectIndex}. */
export interface BuildProjectIndexOptions {
  /** Directory to search for cartridges when `cartridges` is not given. Defaults to the current directory. */
  root?: string;
  /** Additional directories to search for cartridges. */
  paths?: string[];
  /** Cartridges to index, in cartridge path order. Overrides discovery. */
  cartridges?: CartridgeLocation[];
  /** Cartridge path order (names), applied to discovered cartridges. */
  cartridgePath?: string[];
  host?: CartridgeFileSystemHost;
}

interface ParsedController {
  extend?: string;
  statements: Array<{method: SfraRouteMethod; name: string; line: number; chain: MiddlewareRef[]}>;
  sg: Array<{name: string; filters: string[]; line: number; validatesCsrf: boolean}>;
}

interface ComposedRoute {
  chain: IndexedMiddleware[];
  steps: RouteStep[];
}

const SCRIPT_EXT = ['.js', '.ds'];

/**
 * Builds a {@link ProjectIndex} from cartridges on disk: storefront endpoints
 * (SFRA routes composed along the cartridge path through server.extend,
 * append, prepend, and replace; SiteGenesis guard-based controllers;
 * pipeline start nodes), hook registrations, Custom API endpoints, and custom
 * job step types.
 *
 * @example
 * ```typescript
 * import {buildProjectIndex} from '@salesforce/b2c-tooling-sdk/project-index';
 *
 * const index = buildProjectIndex({root: '.', cartridgePath: ['app_custom', 'app_storefront_base', 'modules']});
 * const unprotected = index.endpoints.filter((e) => e.csrf === 'none');
 * ```
 */
export function buildProjectIndex(options: BuildProjectIndexOptions = {}): ProjectIndex {
  const host = options.host ?? createNodeFileSystemHost();
  const cartridges = options.cartridges ?? discoverAll(options, host);
  const resolver = new CartridgeResolver(cartridges, host);
  const index: ProjectIndex = {
    version: 1,
    cartridges: cartridges.map((c) => ({name: c.name, src: toForwardSlashes(path.resolve(c.src))})),
    endpoints: [],
    hooks: [],
    customApis: [],
    jobSteps: [],
    errors: [],
  };

  const parsedCache = new Map<string, ParsedController | undefined>();
  const parse = (file: string): ParsedController | undefined => {
    if (!parsedCache.has(file)) parsedCache.set(file, parseController(file, host, resolver, index));
    return parsedCache.get(file);
  };

  const composedCache = new Map<string, Map<string, ComposedRoute>>();
  const compose = (file: string, seen: Set<string>): Map<string, ComposedRoute> => {
    const cached = composedCache.get(file);
    if (cached) return cached;
    const routes = new Map<string, ComposedRoute>();
    const parsed = parse(file);
    if (parsed?.extend && !seen.has(file)) {
      const base =
        parsed.extend === 'superModule'
          ? resolver.resolveSuperModule(file)?.path
          : parsed.extend === 'unknown'
            ? undefined
            : resolver.resolveRequire(parsed.extend, file)?.path;
      if (base && base !== toForwardSlashes(file)) {
        for (const [name, route] of compose(base, new Set([...seen, file]))) {
          routes.set(name, {chain: [...route.chain], steps: [...route.steps]});
        }
      }
    }
    const owner = resolver.ownerOf(file);
    const relPath = resolver.relativePath(file) ?? path.basename(file);
    for (const s of parsed?.statements ?? []) {
      const entries = s.chain.map<IndexedMiddleware>((m) => {
        const {module, ...rest} = m;
        const resolved = module ? resolver.resolveRequire(module, file) : undefined;
        const source = resolved?.cartridge
          ? {cartridge: resolved.cartridge, relPath: resolver.relativePath(resolved.path)!}
          : undefined;
        return {...rest, cartridge: owner?.name ?? '', relPath, ...(source ? {source} : {})};
      });
      const step: RouteStep = {method: s.method, cartridge: owner?.name ?? '', relPath, line: s.line};
      const current = routes.get(s.name);
      if (s.method === 'get' || s.method === 'post' || s.method === 'use') {
        routes.set(s.name, {chain: entries, steps: [step]});
      } else if (s.method === 'replace') {
        const replaced = current?.chain ?? [];
        const dropped = droppedSecurityMiddleware(replaced, entries);
        routes.set(s.name, {
          chain: entries,
          steps: [...(current?.steps ?? []), {...step, replaced, ...(dropped.length > 0 ? {dropped} : {})}],
        });
      } else if (current && s.method === 'append') {
        current.chain = [...current.chain, ...entries.map((e) => ({...e, via: 'append' as const}))];
        current.steps.push(step);
      } else if (current && s.method === 'prepend') {
        current.chain = [...entries.map((e) => ({...e, via: 'prepend' as const})), ...current.chain];
        current.steps.push(step);
      }
    }
    composedCache.set(file, routes);
    return routes;
  };

  // Controllers: the leftmost cartridge with controllers/<Name> serves <Name>-*.
  const controllerFiles = new Map<string, string>();
  for (const cartridge of cartridges) {
    for (const file of listFiles(path.join(cartridge.src, 'cartridge', 'controllers'), SCRIPT_EXT)) {
      const name = path.basename(file).replace(/\.(js|ds)$/, '');
      if (!controllerFiles.has(name)) controllerFiles.set(name, file);
    }
  }
  for (const [controller, file] of [...controllerFiles].sort(([a], [b]) => a.localeCompare(b))) {
    const owner = resolver.ownerOf(file)!;
    for (const [action, route] of compose(file, new Set())) {
      index.endpoints.push(sfraEndpoint(controller, action, route, owner.name, resolver.relativePath(file)!));
    }
    for (const sg of parse(file)?.sg ?? []) {
      index.endpoints.push(sgEndpoint(controller, sg, owner.name, resolver.relativePath(file)!));
    }
  }

  // Pipelines, unless a controller of the same name exists (controllers take precedence).
  const seenPipelines = new Set<string>();
  for (const cartridge of cartridges) {
    for (const file of listFiles(path.join(cartridge.src, 'cartridge', 'pipelines'), ['.xml'])) {
      const pipeline = path.basename(file, '.xml');
      if (seenPipelines.has(pipeline) || controllerFiles.has(pipeline)) continue;
      seenPipelines.add(pipeline);
      index.endpoints.push(...pipelineEndpoints(pipeline, file, cartridge.name, resolver.relativePath(file) ?? ''));
    }
  }

  const exportsCache = new Map<string, ModuleExports | undefined>();
  const exportsOf = (file: string): ModuleExports | undefined => {
    if (!exportsCache.has(file)) {
      const text = host.readFile(file);
      exportsCache.set(file, text === undefined ? undefined : analyzeModuleExports(text, file));
    }
    return exportsCache.get(file);
  };
  for (const cartridge of cartridges) {
    index.hooks.push(...readHooks(cartridge, host, resolver, exportsOf));
    index.customApis.push(...readCustomApis(cartridge, host, resolver, exportsOf));
    index.jobSteps.push(...readJobSteps(cartridge));
  }
  return index;
}

function discoverAll(options: BuildProjectIndexOptions, host: CartridgeFileSystemHost): CartridgeLocation[] {
  const roots = [options.root ?? process.cwd(), ...(options.paths ?? [])].map((r) => path.resolve(r));
  const found = new Map<string, CartridgeLocation>();
  for (const root of roots) {
    const list = host.fileExists(path.join(root, '.project'))
      ? [{name: path.basename(root), src: root}]
      : discoverCartridges(root, host);
    for (const c of list) if (!found.has(c.src)) found.set(c.src, c);
  }
  return orderCartridges([...found.values()], options.cartridgePath);
}

function parseController(
  file: string,
  host: CartridgeFileSystemHost,
  resolver: CartridgeResolver,
  index: ProjectIndex,
): ParsedController | undefined {
  const text = host.readFile(file);
  if (text === undefined) return undefined;
  const parsed: ParsedController = {statements: [], sg: []};
  const collector = {
    meta: {b2c: {id: 'project-index'}},
    create(context: ScriptRuleContext): ScriptRuleListener {
      return {
        CallExpression(node: AstNode) {
          const extend = sfraExtendTarget(node, context.sourceCode);
          if (extend) {
            parsed.extend ??= extend;
            return;
          }
          const route = sfraRouteCall(node, context.sourceCode);
          if (route)
            parsed.statements.push({
              method: route.method,
              name: route.name,
              line: node.loc?.start.line ?? 0,
              chain: route.chain,
            });
        },
        AssignmentExpression(node: AstNode) {
          const sg = sgControllerExport(node, context.sourceCode);
          if (sg) {
            parsed.sg.push({
              name: sg.name,
              filters: sg.filters,
              line: node.loc?.start.line ?? 0,
              validatesCsrf: sg.action ? callsCsrfValidation(sg.action, context.sourceCode) : false,
            });
          }
        },
      };
    },
  } as unknown as ScriptRule;
  const result = runScriptRules(text, file, [collector]);
  if (result.parseError) {
    const owner = resolver.ownerOf(file);
    index.errors.push({
      cartridge: owner?.name ?? '',
      relPath: resolver.relativePath(file) ?? file,
      message: result.parseError.message,
    });
    return undefined;
  }
  return parsed;
}

function methodsOf(ids: string[]): EndpointMethod[] {
  const methods: EndpointMethod[] = [];
  if (ids.includes('server.middleware.get')) methods.push('GET');
  if (ids.includes('server.middleware.post')) methods.push('POST');
  return methods.length > 0 ? methods : ['ANY'];
}

function sfraEndpoint(
  controller: string,
  action: string,
  route: ComposedRoute,
  cartridge: string,
  relPath: string,
): IndexedEndpoint {
  const effective = route.chain.filter((m) => m.via !== 'append');
  const ids = effective.map((m) => m.id);
  const methods = methodsOf(ids);
  const definition =
    [...route.steps].reverse().find((s) => s.method !== 'append' && s.method !== 'prepend') ?? route.steps[0];
  const csrf = ids.some(isCsrfValidator)
    ? 'middleware'
    : route.chain.some((m) => m.validatesCsrf)
      ? 'in-handler'
      : methods.length === 1 && methods[0] === 'GET'
        ? 'not-applicable'
        : 'none';
  return {
    id: `${controller}-${action}`,
    controller,
    action,
    kind: 'sfra',
    cartridge: definition?.cartridge ?? cartridge,
    relPath: definition?.relPath ?? relPath,
    line: definition?.line ?? 0,
    methods,
    https: ids.includes('server.middleware.https'),
    loginRequired: ids.some(isLoginValidator),
    csrf,
    chain: route.chain,
    steps: route.steps,
  };
}

function sgEndpoint(
  controller: string,
  sg: ParsedController['sg'][number],
  cartridge: string,
  relPath: string,
): IndexedEndpoint {
  const methods: EndpointMethod[] = [];
  if (sg.filters.includes('get')) methods.push('GET');
  if (sg.filters.includes('post')) methods.push('POST');
  if (methods.length === 0) methods.push('ANY');
  const csrf = sg.filters.includes('csrf')
    ? 'middleware'
    : sg.validatesCsrf
      ? 'in-handler'
      : sg.filters.includes('include') || (methods.length === 1 && methods[0] === 'GET')
        ? 'not-applicable'
        : 'none';
  return {
    id: `${controller}-${sg.name}`,
    controller,
    action: sg.name,
    kind: 'sg-controller',
    cartridge,
    relPath,
    line: sg.line,
    methods,
    https: sg.filters.includes('https'),
    loginRequired: sg.filters.includes('loggedIn'),
    csrf,
    filters: sg.filters,
  };
}

function pipelineEndpoints(pipeline: string, file: string, cartridge: string, relPath: string): IndexedEndpoint[] {
  let xml: string;
  try {
    xml = fs.readFileSync(file, 'utf8');
  } catch {
    return [];
  }
  const endpoints: IndexedEndpoint[] = [];
  const startNode = /<start-node\b([^>]*?)\/?>/g;
  let match: RegExpExecArray | null;
  while ((match = startNode.exec(xml)) !== null) {
    const attrs = Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
    if (!attrs.name) continue;
    const line = xml.slice(0, match.index).split('\n').length;
    const isPublic = attrs['call-mode'] !== 'private';
    endpoints.push({
      id: `${pipeline}-${attrs.name}`,
      controller: pipeline,
      action: attrs.name,
      kind: 'pipeline',
      cartridge,
      relPath,
      line,
      methods: ['ANY'],
      https: attrs.secure === 'true',
      loginRequired: false,
      csrf: 'not-applicable',
      public: isPublic,
    });
  }
  return endpoints;
}

function readJson(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
}

function readHooks(
  cartridge: CartridgeLocation,
  host: CartridgeFileSystemHost,
  resolver: CartridgeResolver,
  exportsOf: (file: string) => ModuleExports | undefined,
): IndexedHook[] {
  const pkg = readJson(path.join(cartridge.src, 'package.json')) as {hooks?: unknown} | undefined;
  if (typeof pkg?.hooks !== 'string') return [];
  const hooksFile = path.resolve(cartridge.src, pkg.hooks);
  const data = readJson(hooksFile) as {hooks?: Array<{name?: unknown; script?: unknown}>} | undefined;
  const hooks: IndexedHook[] = [];
  for (const h of data?.hooks ?? []) {
    if (typeof h.name !== 'string' || typeof h.script !== 'string') continue;
    const base = path.resolve(path.dirname(hooksFile), h.script);
    const found = [base, ...SCRIPT_EXT.map((e) => base + e)].find((f) => host.fileExists(f));
    const kind = h.name.startsWith('dw.') ? 'system' : 'custom';
    const exported = found ? exportsOf(found) : undefined;
    const fn = kind === 'system' ? (h.name.split('.').at(-1) ?? h.name) : undefined;
    const info = fn ? exported?.get(fn) : undefined;
    hooks.push({
      name: h.name,
      kind,
      ...(fn ? {function: fn} : {}),
      ...(exported ? {exports: [...exported.keys()]} : {}),
      cartridge: cartridge.name,
      script: h.script,
      ...(found ? {relPath: resolver.relativePath(found)} : {}),
      ...(info?.line ? {line: info.line} : {}),
      returnsValue: info?.returnsValue ?? 'unknown',
    });
  }
  return hooks;
}

interface OpenApiOperation {
  operationId?: unknown;
  security?: Array<Record<string, unknown>>;
}

function readCustomApis(
  cartridge: CartridgeLocation,
  host: CartridgeFileSystemHost,
  resolver: CartridgeResolver,
  exportsOf: (file: string) => ModuleExports | undefined,
): IndexedCustomApiEndpoint[] {
  const dir = path.join(cartridge.src, 'cartridge', 'rest-apis');
  const apis: IndexedCustomApiEndpoint[] = [];
  let names: string[] = [];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return apis;
  }
  for (const api of names.sort()) {
    const apiDir = path.join(dir, api);
    const data = readJson(path.join(apiDir, 'api.json')) as
      | {endpoints?: Array<{endpoint?: unknown; schema?: unknown; implementation?: unknown}>}
      | undefined;
    for (const e of data?.endpoints ?? []) {
      if (typeof e.endpoint !== 'string') continue;
      const problems: string[] = [];
      const entry: IndexedCustomApiEndpoint = {
        api,
        endpoint: e.endpoint,
        cartridge: cartridge.name,
        apiType: 'unknown',
        problems,
      };
      if (typeof e.schema === 'string') {
        entry.schema = e.schema;
        const schema = readYaml(path.join(apiDir, e.schema), host) as
          | {paths?: Record<string, Record<string, OpenApiOperation>>; security?: Array<Record<string, unknown>>}
          | undefined;
        if (!schema) {
          problems.push(`Schema file ${e.schema} is missing or not valid YAML.`);
        } else {
          const match = findOperation(schema.paths, e.endpoint);
          if (match) {
            entry.method = match.method.toUpperCase();
            entry.path = match.path;
            const requirements = match.operation.security ?? schema.security ?? [];
            const security = requirements.flatMap((r) => Object.keys(r ?? {}));
            const scopes = requirements.flatMap((r) =>
              Object.values(r ?? {}).flatMap((v) => (Array.isArray(v) ? v : [])),
            );
            if (security.length > 0) entry.security = [...new Set(security)];
            if (scopes.length > 0) entry.scopes = [...new Set(scopes.map(String))];
            entry.apiType = security.includes('ShopperToken')
              ? 'shopper'
              : security.includes('AmOAuth2')
                ? 'admin'
                : 'unknown';
          } else {
            problems.push(`No operation with operationId "${e.endpoint}" in ${e.schema}.`);
          }
        }
      } else {
        problems.push('api.json entry has no schema.');
      }
      if (typeof e.implementation === 'string') {
        entry.implementation = e.implementation;
        const base = path.join(apiDir, e.implementation);
        const found = [base, ...SCRIPT_EXT.map((x) => base + x)].find((f) => host.fileExists(f));
        if (found) {
          const info = exportsOf(found)?.get(e.endpoint);
          entry.implementationFile = {relPath: resolver.relativePath(found)!, ...(info?.line ? {line: info.line} : {})};
          if (!info) problems.push(`${path.basename(found)} does not export a function named "${e.endpoint}".`);
          else {
            entry.public = info.public;
            if (!info.public)
              problems.push(`exports.${e.endpoint}.public = true is missing; the platform won't call it.`);
          }
        } else {
          problems.push(`Implementation script "${e.implementation}" not found.`);
        }
      } else {
        problems.push('api.json entry has no implementation.');
      }
      apis.push(entry);
    }
  }
  return apis;
}

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options'];

function findOperation(
  paths: Record<string, Record<string, OpenApiOperation>> | undefined,
  operationId: string,
): {path: string; method: string; operation: OpenApiOperation} | undefined {
  for (const [p, item] of Object.entries(paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const operation = item?.[method];
      if (operation && operation.operationId === operationId) return {path: p, method, operation};
    }
  }
  return undefined;
}

function readYaml(file: string, host: CartridgeFileSystemHost): unknown {
  const text = host.readFile(file);
  if (text === undefined) return undefined;
  try {
    return yaml.load(text);
  } catch {
    return undefined;
  }
}

function readJobSteps(cartridge: CartridgeLocation): IndexedJobStep[] {
  const data = (readJson(path.join(cartridge.src, 'steptypes.json')) ??
    readJson(path.join(cartridge.src, 'cartridge', 'steptypes.json'))) as
    | {'step-types'?: Record<string, unknown>}
    | undefined;
  const steps: IndexedJobStep[] = [];
  for (const [kind, value] of Object.entries(data?.['step-types'] ?? {})) {
    for (const s of (Array.isArray(value) ? value : [value]) as Array<Record<string, unknown>>) {
      if (typeof s?.['@type-id'] !== 'string') continue;
      steps.push({
        typeId: s['@type-id'],
        kind,
        cartridge: cartridge.name,
        ...(typeof s.module === 'string' ? {module: s.module} : {}),
      });
    }
  }
  return steps;
}

function listFiles(dir: string, extensions: string[]): string[] {
  try {
    return fs
      .readdirSync(dir, {withFileTypes: true})
      .filter((d) => d.isFile() && extensions.includes(path.extname(d.name)))
      .map((d) => path.join(dir, d.name))
      .sort();
  } catch {
    return [];
  }
}
