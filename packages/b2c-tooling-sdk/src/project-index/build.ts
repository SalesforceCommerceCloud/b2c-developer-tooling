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
  findSiteCartridgePaths,
  orderCartridges,
  selectSiteCartridgePath,
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
  CartridgeOrder,
  EndpointMethod,
  HookCaller,
  IndexedCustomApiEndpoint,
  IndexedEndpoint,
  IndexedHook,
  IndexedJobStep,
  IndexedJobStepParameter,
  IndexedMiddleware,
  RouteEventListener,
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
  /**
   * Index every cartridge in the project, not just those on the cartridge path: path cartridges first in path
   * order, then the rest in discovery order (as if the site ran them all). `notOnPath` is still reported.
   * Defaults to false.
   */
  includeAllCartridges?: boolean;
  /** With `cartridges`: cartridges in the project that aren't on the path, reported as {@link ProjectIndex.otherCartridges}. */
  otherCartridges?: CartridgeLocation[];
  /** Cartridge path order (names), applied to discovered cartridges. */
  cartridgePath?: string[];
  /**
   * Where `cartridgePath` came from, reported as {@link ProjectIndex.cartridgeOrder}. Defaults to
   * `{source: 'configured'}`; pass `{source: 'instance', siteId, hostname}` for a path read from an instance.
   */
  cartridgePathSource?: CartridgeOrder;
  /**
   * Without `cartridgePath` or `cartridges`, order by a site cartridge path found
   * in the project's site import files (`sites/<id>/site.xml`, the latest by
   * migration or import set timestamp). Defaults to true.
   */
  detectSitePath?: boolean;
  /** Site whose site.xml cartridge path to use; defaults to the best match. */
  siteId?: string;
  host?: CartridgeFileSystemHost;
}

interface ParsedController {
  extend?: string;
  /** Line of a call that passes `module` to another function (a delegating controller such as `helper(module, 'Show')`). */
  delegates?: number;
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
  const {
    cartridges,
    order,
    others = [],
  } = options.cartridges
    ? {cartridges: options.cartridges, order: {source: 'provided' as const}, others: options.otherCartridges}
    : discoverAll(options, host);
  const resolver = new CartridgeResolver(cartridges, host);
  const index: ProjectIndex = {
    version: 1,
    cartridges: cartridges.map((c) => ({name: c.name, src: toForwardSlashes(path.resolve(c.src))})),
    cartridgeOrder: order,
    ...(others.length > 0
      ? {otherCartridges: others.map((c) => ({name: c.name, src: toForwardSlashes(path.resolve(c.src))}))}
      : {}),
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

  const exportsCache = new Map<string, ModuleExports | undefined>();
  const exportsOf = (file: string): ModuleExports | undefined => {
    if (!exportsCache.has(file)) {
      const text = host.readFile(file);
      exportsCache.set(file, text === undefined ? undefined : analyzeModuleExports(text, file));
    }
    return exportsCache.get(file);
  };

  const composedCache = new Map<string, Map<string, ComposedRoute>>();
  const compose = (file: string, seen: Set<string>): Map<string, ComposedRoute> => {
    const cached = composedCache.get(file);
    if (cached) return cached;
    const routes = new Map<string, ComposedRoute>();
    const parsed = parse(file);
    // A controller that defines no routes itself but hands `module` to a helper
    // (`require('*/...').extendRoutes(module, 'Show')`) usually extends
    // `module.superModule` there. Keep the base routes instead of losing them.
    const delegated = parsed && !parsed.extend && parsed.statements.length === 0 && parsed.delegates !== undefined;
    const extend = parsed?.extend ?? (delegated ? 'superModule' : undefined);
    if (parsed && extend && !seen.has(file)) {
      const base =
        extend === 'superModule'
          ? resolver.resolveSuperModule(file)?.path
          : extend === 'unknown'
            ? undefined
            : resolver.resolveRequire(extend, file)?.path;
      if (base && base !== toForwardSlashes(file)) {
        const owner = resolver.ownerOf(file);
        const relPath = resolver.relativePath(file) ?? path.basename(file);
        for (const [name, route] of compose(base, new Set([...seen, file]))) {
          const steps = [...route.steps];
          if (delegated) {
            steps.push({method: 'delegate', cartridge: owner?.name ?? '', relPath, line: parsed.delegates ?? 0});
          }
          routes.set(name, {chain: [...route.chain], steps});
        }
      }
    }
    const owner = resolver.ownerOf(file);
    const relPath = resolver.relativePath(file) ?? path.basename(file);
    for (const s of parsed?.statements ?? []) {
      const entries = s.chain.map<IndexedMiddleware>((m) => {
        const {module, ...rest} = m;
        const resolved = module ? resolver.resolveRequire(module, file) : undefined;
        // The exported function's line: `csrfProtection.generateToken` -> `generateToken` in the resolved module.
        const exportName = rest.expression?.includes('.') ? rest.expression.split('.').at(-1) : undefined;
        const exportLine = resolved && exportName ? exportsOf(resolved.path)?.get(exportName)?.line : undefined;
        const source = resolved?.cartridge
          ? {
              cartridge: resolved.cartridge,
              relPath: resolver.relativePath(resolved.path)!,
              ...(exportLine ? {line: exportLine} : {}),
            }
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

  for (const cartridge of cartridges) {
    index.hooks.push(...readHooks(cartridge, host, resolver, exportsOf));
    index.customApis.push(...readCustomApis(cartridge, host, resolver, exportsOf));
    index.jobSteps.push(...readJobSteps(cartridge, host, resolver, exportsOf));
  }
  addCalledHookFunctions(index, cartridges, host, exportsOf);
  return index;
}

/**
 * Splits discovered cartridges into those on the cartridge path, in path order, and the rest. Only cartridges
 * on the path are composed: the site doesn't run the others, so they can't serve, extend, or register anything.
 */
function splitByPath(
  discovered: readonly CartridgeLocation[],
  cartridgePath: readonly string[],
  includeAll = false,
): {cartridges: CartridgeLocation[]; others: CartridgeLocation[]} {
  if (includeAll) return {cartridges: orderCartridges(discovered, cartridgePath), others: []};
  const onPath = new Set(cartridgePath);
  return {
    cartridges: orderCartridges(discovered, cartridgePath).filter((c) => onPath.has(c.name)),
    others: orderCartridges(discovered.filter((c) => !onPath.has(c.name))),
  };
}

/** Adds the names of local cartridges that `cartridgePath` doesn't name. */
function withNotOnPath(
  order: CartridgeOrder,
  discovered: readonly CartridgeLocation[],
  cartridgePath: readonly string[],
): CartridgeOrder {
  const onPath = new Set(cartridgePath);
  const notOnPath = [...new Set(discovered.map((c) => c.name).filter((n) => !onPath.has(n)))];
  return notOnPath.length > 0 ? {...order, notOnPath} : order;
}

function discoverAll(
  options: BuildProjectIndexOptions,
  host: CartridgeFileSystemHost,
): {cartridges: CartridgeLocation[]; order: CartridgeOrder; others?: CartridgeLocation[]} {
  const roots = [options.root ?? process.cwd(), ...(options.paths ?? [])].map((r) => path.resolve(r));
  const found = new Map<string, CartridgeLocation>();
  for (const root of roots) {
    const list = host.fileExists(path.join(root, '.project'))
      ? [{name: path.basename(root), src: root}]
      : discoverCartridges(root, host);
    for (const c of list) if (!found.has(c.src)) found.set(c.src, c);
  }
  const discovered = [...found.values()];
  if (options.cartridgePath && options.cartridgePath.length > 0) {
    return {
      ...splitByPath(discovered, options.cartridgePath, options.includeAllCartridges),
      order: withNotOnPath(
        {
          ...(options.cartridgePathSource ?? {source: 'configured'}),
          ...(options.includeAllCartridges ? {allCartridges: true} : {}),
        },
        discovered,
        options.cartridgePath,
      ),
    };
  }
  if (options.detectSitePath !== false) {
    const site = selectSiteCartridgePath(
      findSiteCartridgePaths(roots[0], host),
      discovered.map((c) => c.name),
      options.siteId,
    );
    if (site) {
      return {
        ...splitByPath(discovered, site.cartridges, options.includeAllCartridges),
        order: withNotOnPath(
          {
            source: 'site-file',
            siteId: site.siteId,
            file: toForwardSlashes(path.relative(roots[0], site.file)),
            ...(site.alternatives.length > 0 ? {otherSites: site.alternatives} : {}),
            ...(options.includeAllCartridges ? {allCartridges: true} : {}),
          },
          discovered,
          site.cartridges,
        ),
      };
    }
  }
  return {cartridges: orderCartridges(discovered), order: {source: 'discovery'}};
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
          const args = (node as {arguments?: Array<{type: string; name?: string}>}).arguments ?? [];
          if (parsed.delegates === undefined && args.some((a) => a.type === 'Identifier' && a.name === 'module')) {
            parsed.delegates = node.loc?.start.line ?? 0;
          }
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
  const events = routeEvents(route.chain);
  const ids = effective.map((m) => m.id);
  const methods = methodsOf(ids);
  const definition =
    [...route.steps]
      .reverse()
      .find((s) => s.method !== 'append' && s.method !== 'prepend' && s.method !== 'delegate') ?? route.steps[0];
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
    ...(events.length > 0 ? {events} : {}),
    steps: route.steps,
  };
}

const EVENT_ORDER = ['route:Start', 'route:Step', 'route:Redirect', 'route:BeforeComplete', 'route:Complete'];

/** Route event listeners in the order they run: by event, then by registration (chain order). */
function routeEvents(chain: IndexedMiddleware[]): RouteEventListener[] {
  const events = chain.flatMap((m, step) =>
    (m.listens ?? []).map<RouteEventListener>((l) => ({
      event: l.event,
      cartridge: m.cartridge,
      relPath: m.relPath,
      line: l.line,
      step,
      ...(l.conditional ? {conditional: true} : {}),
      ...(m.via ? {via: m.via} : {}),
    })),
  );
  const rank = (event: string) => {
    const i = EVENT_ORDER.indexOf(event);
    return i === -1 ? EVENT_ORDER.length : i;
  };
  return events
    .map((e, i) => ({e, i}))
    .sort((a, b) => rank(a.e.event) - rank(b.e.event) || a.i - b.i)
    .map(({e}) => e);
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

/**
 * The file a hooks.json `script` points to. `~/` (this cartridge) and `*\/`
 * (cartridge path) work as in `require()`; other paths are relative to hooks.json.
 */
function hookScriptPath(
  script: string,
  hooksFile: string,
  host: CartridgeFileSystemHost,
  resolver: CartridgeResolver,
): string | undefined {
  if (script.startsWith('~/') || script.startsWith('*/')) return resolver.resolveRequire(script, hooksFile)?.path;
  const base = path.resolve(path.dirname(hooksFile), script);
  return [base, ...SCRIPT_EXT.map((e) => base + e)].find((f) => host.fileExists(f));
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
  const hooksText = host.readFile(hooksFile);
  const data = (hooksText === undefined ? undefined : safeJson(hooksText)) as
    | {hooks?: Array<{name?: unknown; script?: unknown}>}
    | undefined;
  const hooksRel = resolver.relativePath(hooksFile) ?? path.relative(cartridge.src, hooksFile);
  const hooks: IndexedHook[] = [];
  let searchFrom = 0;
  for (const h of data?.hooks ?? []) {
    if (typeof h.name !== 'string' || typeof h.script !== 'string') continue;
    const found = hookScriptPath(h.script, hooksFile, host, resolver);
    const foundIn = found ? resolver.ownerOf(found)?.name : undefined;
    const kind = h.name.startsWith('dw.') ? 'system' : 'custom';
    const exported = found ? exportsOf(found) : undefined;
    const fn = kind === 'system' ? (h.name.split('.').at(-1) ?? h.name) : undefined;
    const info = fn ? exported?.get(fn) : undefined;
    const entryLine = hooksText === undefined ? undefined : lineOfName(hooksText, h.name, searchFrom);
    if (entryLine) searchFrom = entryLine.offset + 1;
    hooks.push({
      name: h.name,
      kind,
      ...(fn ? {function: fn} : {}),
      ...(exported ? {exports: [...exported.keys()]} : {}),
      cartridge: cartridge.name,
      script: h.script,
      ...(found ? {relPath: resolver.relativePath(found)} : {}),
      ...(foundIn && foundIn !== cartridge.name ? {scriptCartridge: foundIn} : {}),
      ...(info?.line ? {line: info.line} : {}),
      returnsValue: info?.returnsValue ?? 'unknown',
      registeredIn: {relPath: toForwardSlashes(hooksRel), ...(entryLine ? {line: entryLine.line} : {})},
    });
  }
  return hooks;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** The line of the first `"<name>"` string at or after `from` in a JSON document, and its offset. */
function lineOfName(text: string, name: string, from = 0): {line: number; offset: number} | undefined {
  let offset = text.indexOf(JSON.stringify(name), from);
  if (offset < 0) offset = text.indexOf(JSON.stringify(name));
  if (offset < 0) return undefined;
  let line = 1;
  for (let i = 0; i < offset; i++) if (text.charCodeAt(i) === 10) line++;
  return {line, offset};
}

const CALL_HOOK = /\bcallHook\(\s*(['"])([\w.-]+)\1\s*,\s*(['"])(\w+)\3/g;

/**
 * For custom hooks, the functions callers name in `HookMgr.callHook(name, fn, ...)`.
 * A text scan of scripts and templates; only string-literal arguments are read.
 */
function addCalledHookFunctions(
  index: ProjectIndex,
  cartridges: readonly CartridgeLocation[],
  host: CartridgeFileSystemHost,
  exportsOf: (file: string) => ModuleExports | undefined,
): void {
  const custom = index.hooks.filter((h) => h.kind === 'custom');
  if (custom.length === 0) return;
  const names = new Set(custom.map((h) => h.name));
  // hook name -> function name -> call sites
  const called = new Map<string, Map<string, HookCaller[]>>();
  for (const cartridge of cartridges) {
    for (const file of walkFiles(path.join(cartridge.src, 'cartridge'), ['.js', '.ds', '.isml'])) {
      const text = host.readFile(file);
      if (!text?.includes('callHook')) continue;
      for (const m of text.matchAll(CALL_HOOK)) {
        if (!names.has(m[2])) continue;
        const byFn = called.get(m[2]) ?? new Map<string, HookCaller[]>();
        called.set(m[2], byFn);
        const caller: HookCaller = {
          cartridge: cartridge.name,
          relPath: toForwardSlashes(path.relative(cartridge.src, file)),
          line: text.slice(0, m.index).split('\n').length,
        };
        byFn.set(m[4], [...(byFn.get(m[4]) ?? []), caller]);
      }
    }
  }
  for (const hook of custom) {
    const byFn = called.get(hook.name);
    if (!byFn) continue;
    const cartridge = hook.scriptCartridge ?? hook.cartridge;
    const root = index.cartridges.find((c) => c.name === cartridge)?.src;
    const exported = hook.relPath && root ? exportsOf(path.join(root, hook.relPath)) : undefined;
    hook.calledFunctions = [...byFn.keys()].sort().map((name) => {
      const line = exported?.get(name)?.line;
      return {name, ...(line ? {line} : {}), callers: byFn.get(name)!};
    });
  }
}

const SKIP_DIRS = new Set(['node_modules', 'static', 'client', '.git']);

function walkFiles(dir: string, extensions: string[]): string[] {
  const out: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, {withFileTypes: true});
  } catch {
    return out;
  }
  for (const d of entries) {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) {
      if (!SKIP_DIRS.has(d.name)) out.push(...walkFiles(full, extensions));
    } else if (d.isFile() && extensions.includes(path.extname(d.name))) {
      out.push(full);
    }
  }
  return out;
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

function readJobSteps(
  cartridge: CartridgeLocation,
  host: CartridgeFileSystemHost,
  resolver: CartridgeResolver,
  exportsOf: (file: string) => ModuleExports | undefined,
): IndexedJobStep[] {
  const rootFile = path.join(cartridge.src, 'steptypes.json');
  const files = [
    ...(host.fileExists(rootFile) ? [rootFile] : []),
    ...walkFiles(path.join(cartridge.src, 'cartridge'), ['.json']).filter((f) => path.basename(f) === 'steptypes.json'),
  ];
  return files.flatMap((file) => readStepTypesFile(file, cartridge, host, resolver, exportsOf));
}

/** Step type groups: `{script-module-step: [...], chunk-script-module-step: [...]}`, or a legacy flat array of task steps. */
function stepTypeGroups(stepTypes: unknown): Array<[string, Array<Record<string, unknown>>]> {
  if (Array.isArray(stepTypes)) return [['script-module-step', stepTypes]];
  if (!stepTypes || typeof stepTypes !== 'object') return [];
  return Object.entries(stepTypes as Record<string, unknown>).map(([kind, value]) => [
    kind,
    (Array.isArray(value) ? value : [value]) as Array<Record<string, unknown>>,
  ]);
}

function readStepTypesFile(
  file: string,
  cartridge: CartridgeLocation,
  host: CartridgeFileSystemHost,
  resolver: CartridgeResolver,
  exportsOf: (file: string) => ModuleExports | undefined,
): IndexedJobStep[] {
  const text = host.readFile(file);
  const data = (text === undefined ? undefined : safeJson(text)) as {'step-types'?: unknown} | undefined;
  const relPath = toForwardSlashes(path.relative(cartridge.src, file));
  const steps: IndexedJobStep[] = [];
  for (const [kind, entries] of stepTypeGroups(data?.['step-types'])) {
    for (const s of entries) {
      if (typeof s?.['@type-id'] !== 'string') continue;
      const typeId = s['@type-id'];
      const module = typeof s.module === 'string' ? s.module : undefined;
      const fn =
        kind === 'chunk-script-module-step' ? undefined : typeof s.function === 'string' ? s.function : 'execute';
      const problems: string[] = [];
      let implementationFile: IndexedJobStep['implementationFile'];
      if (module) {
        const spec = module.replace(/^\.\//, '');
        // `<cartridge>/cartridge/...` as in require(); older steptypes.json files omit the cartridge name.
        const resolved =
          resolver.resolveRequire(spec, file) ??
          (spec.startsWith('cartridge/') ? resolver.resolveRequire(`${cartridge.name}/${spec}`, file) : undefined);
        if (resolved?.cartridge) {
          const line = fn ? exportsOf(resolved.path)?.get(fn)?.line : undefined;
          implementationFile = {
            cartridge: resolved.cartridge,
            relPath: resolver.relativePath(resolved.path)!,
            ...(line ? {line} : {}),
          };
          if (fn && exportsOf(resolved.path) && !exportsOf(resolved.path)!.has(fn)) {
            problems.push(`Module doesn't export ${fn}().`);
          }
        } else {
          problems.push(`Module ${module} not found.`);
        }
      } else {
        problems.push('No module set.');
      }
      const params = (s.parameters as {parameter?: unknown} | undefined)?.parameter;
      const parameters = (Array.isArray(params) ? params : params ? [params] : []).flatMap(
        (p: Record<string, unknown>): IndexedJobStepParameter[] =>
          typeof p?.['@name'] === 'string'
            ? [
                {
                  name: p['@name'],
                  ...(typeof p['@type'] === 'string' ? {type: p['@type']} : {}),
                  required: p['@required'] === true || p['@required'] === 'true',
                  ...(typeof p.description === 'string' ? {description: p.description} : {}),
                  ...(typeof p['default-value'] === 'string' ? {defaultValue: p['default-value']} : {}),
                },
              ]
            : [],
      );
      const entry = text === undefined ? undefined : lineOfName(text, typeId);
      steps.push({
        typeId,
        kind,
        cartridge: cartridge.name,
        ...(module ? {module} : {}),
        ...(fn ? {function: fn} : {}),
        ...(typeof s.description === 'string' ? {description: s.description} : {}),
        registeredIn: {relPath, ...(entry ? {line: entry.line} : {})},
        ...(implementationFile ? {implementationFile} : {}),
        parameters,
        problems,
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
