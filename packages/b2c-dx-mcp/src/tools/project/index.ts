/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Project tools: inspect a project's storefront code from source (project
 * index) and scan it for security problems. Both read local files on the MCP
 * host. When SCAPI system credentials are configured, they also read the
 * site's cartridge path from the instance (see cartridge-path.ts).
 */
import fs from 'node:fs';
import path from 'node:path';
import {z} from 'zod';
import {
  HOOK_SEMANTICS,
  buildProjectIndex,
  controllerEndpoints,
  customApiGroups,
  endpointIssues,
  endpointSummaries,
  hookChains,
  hookRegistrationIssue,
  middlewareLabel,
  securityRole,
  type IndexedEndpoint,
  type ProjectIndex,
} from '@salesforce/b2c-tooling-sdk/project-index';
import {
  SECURITY_SEVERITIES,
  parseBaseline,
  scanSecurity,
  validateSecurityConfig,
  type SecurityBaseline,
  type SecuritySeverity,
} from '@salesforce/b2c-tooling-sdk/security';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {CartridgePathResolver, describeCartridgeOrder, type ResolvedCartridgePath} from './cartridge-path.js';
import type {Services} from '../../services.js';
import type {McpTool} from '../../utils/index.js';

/** Call sites listed per called hook function; `callers` has the full count. */
const MAX_CALLERS = 5;
const MAX_LIST = 300;
const DEFAULT_MAX_FINDINGS = 50;
const BASELINE_FILE = '.b2c-security-baseline.json';

type Aspect = 'customApis' | 'endpoint' | 'endpoints' | 'hooks' | 'jobSteps' | 'summary';

interface ProjectInspectInput {
  aspect?: Aspect;
  id?: string;
  filter?: string;
  cartridge?: string;
  uses?: string;
  issuesOnly?: boolean;
  siteId?: string;
  allCartridges?: boolean;
  projectDirectory?: string;
}

/** What each aspect returns, so an agent can pick the next call from the summary. */
const ASPECTS: Record<Exclude<Aspect, 'summary'>, string> = {
  endpoints:
    'List endpoints (id, methods, cartridges that build each, middleware as written). Filter with filter, cartridge, uses.',
  endpoint:
    'One endpoint in full (id required): chain in run order, route event listeners, defining statements, issues.',
  hooks: 'Hook registrations by extension point in run order, with the functions callers use and issues.',
  customApis: 'Custom API endpoints with route, security, scopes, implementation, and wiring problems.',
  jobSteps: 'Custom job step types from steptypes.json with parameters and implementation.',
};

/** Shared by the project tools so instance lookups are cached across calls. */
const defaultResolver = new CartridgePathResolver();

/** Input schema shared by the project tools for choosing the site whose cartridge path to use. */
const siteIdInput = z
  .string()
  .min(1)
  .optional()
  .describe(
    'Site whose cartridge path to read live from the instance (overrides configured cartridges). See cartridgePathHint.',
  );

const allCartridgesInput = z
  .boolean()
  .optional()
  .describe('Also index cartridges not on the cartridge path, after it (as if the site ran them). Default false.');

/** Builds the index for the project directory, ordered by the resolved cartridge path. */
function loadIndex(projectDirectory: string, resolved: ResolvedCartridgePath, allCartridges?: boolean): ProjectIndex {
  return buildProjectIndex({
    root: projectDirectory,
    includeAllCartridges: allCartridges,
    cartridgePath: resolved.cartridgePath,
    cartridgePathSource: resolved.cartridgePathSource,
    siteId: resolved.siteId,
  });
}

/** A cartridge file as a path relative to the project directory, with an optional `:line`. */
function fileRef(
  index: ProjectIndex,
  projectDirectory: string,
  cartridge: string,
  relPath: string,
  line?: number,
): string {
  const src = index.cartridges.find((c) => c.name === cartridge)?.src;
  const file = src
    ? path.relative(projectDirectory, path.join(src, relPath)).split(path.sep).join('/')
    : `${cartridge}/${relPath}`;
  return line ? `${file}:${line}` : file;
}

/** A cartridge off the cartridge path that has a controller file for `controller`, if any. */
function offPathController(index: ProjectIndex, controller: string): string | undefined {
  return index.otherCartridges?.find((c) =>
    ['.js', '.ds'].some((ext) => fs.existsSync(path.join(c.src, 'cartridge', 'controllers', controller + ext))),
  )?.name;
}

function endpointDetail(index: ProjectIndex, dir: string, e: IndexedEndpoint) {
  return {
    id: e.id,
    kind: e.kind,
    servedBy: fileRef(index, dir, e.cartridge, e.relPath, e.line),
    cartridge: e.cartridge,
    methods: e.methods,
    https: e.https,
    loginRequired: e.loginRequired,
    csrf: e.csrf,
    ...(e.filters ? {guardFilters: e.filters} : {}),
    ...(e.chain
      ? {
          chain: e.chain.map((m) => ({
            id: m.id,
            label: m.id === 'function' ? 'Handler' : middlewareLabel(m.id),
            cartridge: m.cartridge,
            at: fileRef(index, dir, m.cartridge, m.relPath, m.line),
            ...(m.via ? {via: m.via} : {}),
            ...(m.validatesCsrf ? {validatesCsrf: true} : {}),
            ...(m.expression ? {expression: m.expression} : {}),
            ...(m.source
              ? {implementation: fileRef(index, dir, m.source.cartridge, m.source.relPath, m.source.line)}
              : {}),
          })),
        }
      : {}),
    ...(e.steps
      ? {
          steps: e.steps.map((s) => ({
            method: s.method,
            cartridge: s.cartridge,
            at: fileRef(index, dir, s.cartridge, s.relPath, s.line),
            ...(s.dropped && s.dropped.length > 0 ? {dropped: s.dropped.map((id) => securityRole(id) ?? id)} : {}),
          })),
        }
      : {}),
    issues: endpointIssues(e),
  };
}

export function createProjectInspectTool(
  loadServices: () => Promise<Services> | Services,
  resolver: CartridgePathResolver = defaultResolver,
): McpTool {
  return createToolAdapter<ProjectInspectInput, Record<string, unknown>>(
    {
      name: 'project_inspect',
      // Entry point for most cartridge sessions: which cartridge serves a route and what runs for it.
      alwaysLoad: true,
      effect: 'read',
      idempotent: true,
      // The instance lookup for the cartridge path is best effort and falls back to local sources.
      openWorld: false,
      description:
        'Inspect storefront code from source (preview), along the site cartridge path. Start with the summary ' +
        '(counts and what each aspect returns); list endpoints, filtered by ID, cartridge, or middleware; then get one ' +
        'endpoint for what runs, in order, and which cartridge each step comes from. Also hooks in run order, Custom ' +
        'APIs, and custom job steps. Reads local files.',
      searchHint:
        'controller route endpoint middleware override extend replace prepend append superModule hooks hooks.json custom api rest-apis job steps steptypes.json which cartridge',
      toolsets: ['CARTRIDGES', 'STOREFRONTNEXT'],
      usesProjectContext: true,
      inputSchema: {
        aspect: z
          .enum(['summary', 'endpoints', 'endpoint', 'hooks', 'customApis', 'jobSteps'])
          .optional()
          .describe('What to return. Defaults to summary, which lists what each aspect returns.'),
        id: z
          .string()
          .min(1)
          .optional()
          .describe('Endpoint ID (Controller-Action, case-insensitive). Required for aspect endpoint.'),
        filter: z
          .string()
          .min(1)
          .optional()
          .describe(
            'Case-insensitive substring of endpoint IDs, hook names, API/endpoint names, or job step type IDs.',
          ),
        cartridge: z
          .string()
          .min(1)
          .optional()
          .describe('endpoints and jobSteps: only items this cartridge defines or changes (exact name).'),
        uses: z
          .string()
          .min(1)
          .optional()
          .describe('endpoints: only endpoints whose middleware contains this text, such as "userLoggedIn" or "csrf".'),
        issuesOnly: z.boolean().optional().describe('hooks, customApis, jobSteps: only items with issues.'),
        siteId: siteIdInput,
        allCartridges: allCartridgesInput,
      },
      async execute(args, context) {
        const aspect = args.aspect ?? 'summary';
        if (aspect === 'endpoint' && !args.id)
          throw new Error('aspect "endpoint" requires id (for example Cart-AddProduct).');
        const dir = context.services.resolveProjectDirectory(args.projectDirectory).path;
        const resolved = await resolver.resolve(context.services, dir, args.siteId);
        const index = loadIndex(dir, resolved, args.allCartridges);
        const order = describeCartridgeOrder(index.cartridgeOrder, resolved);
        const filter = args.filter?.toLowerCase();
        const matches = (text: string) => !filter || text.toLowerCase().includes(filter);
        const endpoints = controllerEndpoints(index);

        if (aspect === 'summary') {
          const chains = hookChains(index);
          const apis = customApiGroups(index);
          return {
            projectDirectory: dir,
            cartridgePath: index.cartridges.map((c) => c.name),
            ...order,
            counts: {
              endpoints: endpoints.length,
              hookRegistrations: index.hooks.length,
              customApiEndpoints: index.customApis.length,
              jobSteps: index.jobSteps.length,
            },
            withIssues: {
              endpoints: endpoints.filter((e) => endpointIssues(e).length > 0).length,
              hooks: chains.filter((c) => c.issue || c.registrations.some((r) => hookRegistrationIssue(c, r))).length,
              customApiEndpoints: apis.flatMap((g) => g.endpoints).filter((e) => e.problems.length > 0).length,
              jobSteps: index.jobSteps.filter((s) => s.problems.length > 0).length,
            },
            aspects: ASPECTS,
            ...(index.errors.length > 0 ? {parseErrors: index.errors.slice(0, 20)} : {}),
          };
        }

        if (aspect === 'endpoint') {
          const endpoint = endpoints.find((e) => e.id.toLowerCase() === args.id!.toLowerCase());
          if (!endpoint) {
            const prefix = args.id!.split('-')[0].toLowerCase();
            const offPath = offPathController(index, args.id!.split('-')[0]);
            if (offPath) {
              throw new Error(
                `Endpoint "${args.id}" is only defined in ${offPath}, which is not on the cartridge path, so the site ` +
                  `does not serve it. If it belongs to another site, pass that site's siteId, or pass allCartridges.`,
              );
            }
            const similar = endpoints
              .filter((e) => e.id.toLowerCase().startsWith(prefix))
              .map((e) => e.id)
              .slice(0, 15);
            throw new Error(
              `Endpoint "${args.id}" not found.` +
                (similar.length > 0 ? ` Similar: ${similar.join(', ')}.` : ' Use aspect "endpoints" to list them.'),
            );
          }
          return {endpoint: endpointDetail(index, dir, endpoint), ...order};
        }

        if (aspect === 'endpoints') {
          const rows = endpointSummaries(index, {filter: args.filter, cartridge: args.cartridge, uses: args.uses}).map(
            (e) => ({
              id: e.id,
              methods: e.methods,
              cartridges: e.cartridges,
              middleware: e.middleware,
              at: fileRef(index, dir, e.cartridge, e.relPath, e.line),
            }),
          );
          return {
            total: rows.length,
            endpoints: rows.slice(0, MAX_LIST),
            ...(rows.length > MAX_LIST
              ? {truncated: rows.length - MAX_LIST, hint: 'Narrow with filter, cartridge, or uses.'}
              : {}),
            next: 'Use aspect "endpoint" with an id for what runs, protection (HTTPS, login, CSRF), and issues.',
            ...order,
          };
        }

        if (aspect === 'jobSteps') {
          const steps = index.jobSteps
            .filter(
              (s) =>
                matches(s.typeId) &&
                (!args.cartridge || s.cartridge === args.cartridge) &&
                (!args.issuesOnly || s.problems.length > 0),
            )
            .sort((a, b) => a.typeId.localeCompare(b.typeId))
            .map((s) => ({
              typeId: s.typeId,
              kind: s.kind === 'chunk-script-module-step' ? 'chunk' : 'task',
              cartridge: s.cartridge,
              ...(s.description ? {description: s.description} : {}),
              ...(s.function ? {function: s.function} : {}),
              registeredIn: fileRef(index, dir, s.cartridge, s.registeredIn.relPath, s.registeredIn.line),
              ...(s.implementationFile
                ? {
                    implementation: fileRef(
                      index,
                      dir,
                      s.implementationFile.cartridge,
                      s.implementationFile.relPath,
                      s.implementationFile.line,
                    ),
                  }
                : {module: s.module}),
              parameters: s.parameters,
              ...(s.problems.length > 0 ? {problems: s.problems} : {}),
            }));
          return {total: steps.length, jobSteps: steps.slice(0, MAX_LIST), ...order};
        }

        if (aspect === 'hooks') {
          const hooks = hookChains(index)
            .filter((c) => matches(c.name))
            .map((chain) => {
              const registrations = chain.registrations.map((h) => {
                const issue = hookRegistrationIssue(chain, h);
                return {
                  cartridge: h.cartridge,
                  at: h.relPath ? fileRef(index, dir, h.scriptCartridge ?? h.cartridge, h.relPath, h.line) : h.script,
                  ...(h.registeredIn
                    ? {registeredIn: fileRef(index, dir, h.cartridge, h.registeredIn.relPath, h.registeredIn.line)}
                    : {}),
                  ...(h.function ? {function: h.function} : {}),
                  ...(h.calledFunctions
                    ? {
                        calledAs: h.calledFunctions.map((f) => ({
                          name: f.name,
                          ...(f.line && h.relPath
                            ? {at: fileRef(index, dir, h.scriptCartridge ?? h.cartridge, h.relPath, f.line)}
                            : {exported: false}),
                          callers: f.callers.length,
                          calledFrom: f.callers
                            .slice(0, MAX_CALLERS)
                            .map((c) => fileRef(index, dir, c.cartridge, c.relPath, c.line)),
                        })),
                        ...(h.exports ? {exports: h.exports} : {}),
                      }
                    : h.exports
                      ? {exports: h.exports}
                      : {}),
                  ...(chain.kind === 'system' ? {returnsValue: h.returnsValue} : {}),
                  ...(issue ? {issue} : {}),
                };
              });
              return {
                name: chain.name,
                kind: chain.kind,
                ...(chain.issue ? {issue: chain.issue} : {}),
                ...(chain.note ? {note: chain.note} : {}),
                registrations,
              };
            })
            .filter((c) => !args.issuesOnly || c.issue || c.registrations.some((r) => r.issue));
          return {semantics: HOOK_SEMANTICS, hooks, ...order};
        }

        const apis = customApiGroups(index)
          .map((g) => ({
            api: g.api,
            cartridges: g.cartridges,
            types: g.types,
            ...(g.issue ? {issue: g.issue} : {}),
            endpoints: g.endpoints
              .filter((e) => matches(g.api) || matches(e.endpoint))
              .filter((e) => !args.issuesOnly || g.issue || e.problems.length > 0)
              .map((e) => ({
                endpoint: e.endpoint,
                ...(e.method ? {method: e.method} : {}),
                ...(e.path ? {path: e.path} : {}),
                ...(e.security ? {security: e.security} : {}),
                ...(e.scopes ? {scopes: e.scopes} : {}),
                apiType: e.apiType,
                ...(e.implementationFile
                  ? {
                      implementation: fileRef(
                        index,
                        dir,
                        e.cartridge,
                        e.implementationFile.relPath,
                        e.implementationFile.line,
                      ),
                    }
                  : {}),
                ...(e.public === undefined ? {} : {public: e.public}),
                ...(e.problems.length > 0 ? {problems: e.problems} : {}),
              })),
          }))
          .filter((g) => g.endpoints.length > 0);
        return {apis, ...order};
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}

interface SecurityScanInput {
  paths?: string[];
  rules?: string[];
  excludeRules?: string[];
  ignore?: string[];
  minSeverity?: SecuritySeverity;
  excludeReferenceCartridges?: boolean;
  siteId?: string;
  allCartridges?: boolean;
  includeSuppressed?: boolean;
  maxFindings?: number;
  projectDirectory?: string;
}

export function createSecurityScanTool(
  loadServices: () => Promise<Services> | Services,
  resolver: CartridgePathResolver = defaultResolver,
): McpTool {
  return createToolAdapter<SecurityScanInput, Record<string, unknown>>(
    {
      name: 'security_scan',
      effect: 'read',
      idempotent: true,
      openWorld: false,
      description:
        'Scan cartridge code and site data for B2C Commerce security problems (preview): CSRF gaps, overrides that drop ' +
        'security middleware, query injection, open redirects, hardcoded credentials, OCAPI demo client ID, and more. ' +
        'Local scan along the site cartridge path; honors suppressions, baseline, and settings. ' +
        'Triage with skill://b2c-cli/b2c-security/SKILL.md.',
      searchHint:
        'security vulnerabilities csrf xss injection secrets credentials audit lint sast ocapi permissions controllers',
      toolsets: ['CARTRIDGES', 'STOREFRONTNEXT'],
      usesProjectContext: true,
      inputSchema: {
        paths: z
          .array(z.string().min(1))
          .max(50)
          .optional()
          .describe('Files or directories to scan, relative to projectDirectory. Defaults to the whole project.'),
        rules: z.array(z.string().min(1)).max(50).optional().describe('Run only these rule IDs.'),
        excludeRules: z.array(z.string().min(1)).max(50).optional().describe('Skip these rule IDs.'),
        ignore: z
          .array(z.string().min(1))
          .max(50)
          .optional()
          .describe('Leave out files matching these globs (relative to projectDirectory), e.g. "cartridges/bm_*".'),
        minSeverity: z
          .enum(['critical', 'high', 'medium', 'low', 'info'])
          .optional()
          .describe('Drop findings below this severity.'),
        excludeReferenceCartridges: z
          .boolean()
          .optional()
          .describe('Leave out findings in SFRA and SiteGenesis base cartridges (reported and tagged by default).'),
        includeSuppressed: z.boolean().optional().describe('Also return suppressed and baselined findings.'),
        siteId: siteIdInput,
        allCartridges: allCartridgesInput,
        maxFindings: z
          .number()
          .int()
          .min(1)
          .max(500)
          .optional()
          .describe(`Findings to return. Defaults to ${DEFAULT_MAX_FINDINGS}.`),
      },
      async execute(args, context) {
        const dir = context.services.resolveProjectDirectory(args.projectDirectory).path;
        const realRoot = fs.realpathSync(dir);
        const paths = (args.paths ?? []).map((p) => {
          const resolved = path.resolve(dir, p);
          if (!fs.existsSync(resolved)) throw new Error(`Path not found: ${p}`);
          const real = fs.realpathSync(resolved);
          if (real !== realRoot && !real.startsWith(realRoot + path.sep))
            throw new Error(`Path is outside the project directory: ${p}`);
          return resolved;
        });
        let baseline: SecurityBaseline | undefined;
        const baselineFile = path.join(dir, BASELINE_FILE);
        if (fs.existsSync(baselineFile)) baseline = parseBaseline(fs.readFileSync(baselineFile, 'utf8'));

        const dwJsonSecurity = context.services.getResolvedConfig().values.security;
        const resolved = await resolver.resolve(context.services, dir, args.siteId);
        const result = scanSecurity({
          root: dir,
          paths,
          rules: args.rules,
          excludeRules: args.excludeRules,
          ignore: args.ignore,
          config:
            dwJsonSecurity === undefined ? undefined : validateSecurityConfig(dwJsonSecurity, 'dw.json "security"'),
          minSeverity: args.minSeverity,
          baseline,
          cartridgePath: resolved.cartridgePath,
          cartridgePathSource: resolved.cartridgePathSource,
          includeAllCartridges: args.allCartridges,
          siteId: resolved.siteId,
          excludeReferenceCartridges: args.excludeReferenceCartridges,
        });

        const open = result.findings.filter((f) => !f.suppression && !f.baselined);
        const shown = args.includeSuppressed
          ? [...open, ...result.findings.filter((f) => f.suppression || f.baselined)]
          : open;
        const max = args.maxFindings ?? DEFAULT_MAX_FINDINGS;
        const bySeverity = Object.fromEntries(
          SECURITY_SEVERITIES.map((s) => [s, open.filter((f) => f.severity === s).length]).filter(
            ([, n]) => (n as number) > 0,
          ),
        );
        const byRule: Record<string, number> = {};
        for (const f of open) byRule[f.ruleId] = (byRule[f.ruleId] ?? 0) + 1;
        const order = (s: SecuritySeverity) => SECURITY_SEVERITIES.indexOf(s);

        return {
          summary: {
            filesScanned: result.filesScanned,
            open: open.length,
            suppressed: result.findings.filter((f) => f.suppression).length,
            baselined: result.findings.filter((f) => f.baselined && !f.suppression).length,
            inReferenceCartridges: open.filter((f) => f.referenceCartridge).length,
            ...(result.notOnPathFindings > 0 ? {notOnPath: open.filter((f) => f.notOnPathCartridge).length} : {}),
            ...(result.hiddenReferenceFindings > 0 ? {hiddenReferenceFindings: result.hiddenReferenceFindings} : {}),
            bySeverity,
            byRule,
            ...(baseline ? {baselineFile: BASELINE_FILE} : {}),
          },
          cartridgePath: result.cartridgePath,
          ...describeCartridgeOrder(result.cartridgeOrder, resolved),
          findings: [...shown]
            .sort(
              (a, b) =>
                (a.suppression || a.baselined ? 1 : 0) - (b.suppression || b.baselined ? 1 : 0) ||
                order(a.severity) - order(b.severity),
            )
            .slice(0, max)
            .map((f) => ({
              ruleId: f.ruleId,
              severity: f.severity,
              confidence: f.confidence,
              at: `${f.location.file}:${f.location.startLine}:${f.location.startColumn}`,
              message: f.message,
              snippet: f.snippet,
              remediation: f.remediation,
              docsUrl: f.docsUrl,
              ...(f.referenceCartridge ? {referenceCartridge: f.referenceCartridge} : {}),
              ...(f.notOnPathCartridge ? {notOnPathCartridge: f.notOnPathCartridge} : {}),
              ...(f.suppression ? {suppressed: f.suppression.reason ?? true} : {}),
              ...(f.baselined ? {baselined: true} : {}),
            })),
          ...(shown.length > max ? {truncated: shown.length - max} : {}),
          ...(result.errors.length > 0
            ? {
                parseErrors: {
                  count: result.errors.length,
                  byReason: Object.fromEntries(
                    [...new Set(result.errors.map((e) => e.reason ?? 'syntax'))].map((r) => [
                      r,
                      result.errors.filter((e) => (e.reason ?? 'syntax') === r).length,
                    ]),
                  ),
                  sample: result.errors.slice(0, 5),
                },
              }
            : {}),
          ...(result.configFile ? {settingsFile: path.relative(dir, result.configFile)} : {}),
          ...(result.filesScanned === 0
            ? {note: 'No cartridge scripts or site data found under the project directory.'}
            : {}),
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}

/** Project tools for the CARTRIDGES and STOREFRONTNEXT toolsets. */
export function createProjectTools(loadServices: () => Promise<Services> | Services): McpTool[] {
  return [createProjectInspectTool(loadServices), createSecurityScanTool(loadServices)];
}
