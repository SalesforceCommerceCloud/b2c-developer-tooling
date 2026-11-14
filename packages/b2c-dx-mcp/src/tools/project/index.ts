/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Project tools: inspect a project's storefront code from source (project
 * index) and scan it for security problems. Both read local files on the MCP
 * host only; no instance or credentials.
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
  type SecurityBaseline,
  type SecuritySeverity,
} from '@salesforce/b2c-tooling-sdk/security';
import {createToolAdapter, jsonResult} from '../adapter.js';
import type {Services} from '../../services.js';
import type {McpTool} from '../../utils/index.js';

const MAX_LIST = 300;
const DEFAULT_MAX_FINDINGS = 50;
const BASELINE_FILE = '.b2c-security-baseline.json';

type Aspect = 'customApis' | 'endpoint' | 'endpoints' | 'hooks' | 'summary';

interface ProjectInspectInput {
  aspect?: Aspect;
  id?: string;
  filter?: string;
  issuesOnly?: boolean;
  projectDirectory?: string;
}

/** Builds the index for the project directory, ordered by that project's `cartridges` configuration. */
function loadIndex(projectDirectory: string, cartridgePath: string[] | undefined): ProjectIndex {
  return buildProjectIndex({root: projectDirectory, cartridgePath});
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
            ...(m.source ? {implementation: fileRef(index, dir, m.source.cartridge, m.source.relPath)} : {}),
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

export function createProjectInspectTool(loadServices: () => Promise<Services> | Services): McpTool {
  return createToolAdapter<ProjectInspectInput, Record<string, unknown>>(
    {
      name: 'project_inspect',
      // Entry point for most cartridge sessions: which cartridge serves a route and what runs for it.
      alwaysLoad: true,
      effect: 'read',
      idempotent: true,
      openWorld: false,
      description:
        'Inspect storefront code from source, composed along the configured cartridge path: summary, SFRA/SiteGenesis ' +
        'controller endpoints with HTTPS/login/CSRF protection, what runs for one endpoint and which cartridge each step ' +
        'comes from, hook registrations in run order, and Custom API wiring. Offline; no instance needed.',
      searchHint:
        'controller route endpoint middleware override extend replace prepend append superModule hooks hooks.json custom api rest-apis which cartridge',
      toolsets: ['CARTRIDGES', 'STOREFRONTNEXT'],
      usesProjectContext: true,
      inputSchema: {
        aspect: z
          .enum(['summary', 'endpoints', 'endpoint', 'hooks', 'customApis'])
          .optional()
          .describe('What to return. Defaults to summary.'),
        id: z
          .string()
          .min(1)
          .optional()
          .describe('Endpoint ID (Controller-Action, case-insensitive). Required for aspect endpoint.'),
        filter: z
          .string()
          .min(1)
          .optional()
          .describe('Case-insensitive substring of endpoint IDs, hook names, or API/endpoint names.'),
        issuesOnly: z.boolean().optional().describe('Only items with issues (endpoints, hooks, customApis).'),
      },
      async execute(args, context) {
        const aspect = args.aspect ?? 'summary';
        if (aspect === 'endpoint' && !args.id)
          throw new Error('aspect "endpoint" requires id (for example Cart-AddProduct).');
        const dir = context.services.resolveProjectDirectory(args.projectDirectory).path;
        const cartridgePath = context.services.getResolvedConfig().values.cartridges;
        const index = loadIndex(dir, cartridgePath);
        const filter = args.filter?.toLowerCase();
        const matches = (text: string) => !filter || text.toLowerCase().includes(filter);
        const endpoints = controllerEndpoints(index);

        if (aspect === 'summary') {
          const chains = hookChains(index);
          const apis = customApiGroups(index);
          return {
            projectDirectory: dir,
            cartridgePath: index.cartridges.map((c) => c.name),
            cartridgePathSource:
              cartridgePath && cartridgePath.length > 0
                ? 'configuration'
                : 'discovery (set cartridges in dw.json to match the site)',
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
            },
            ...(index.errors.length > 0 ? {parseErrors: index.errors.slice(0, 20)} : {}),
          };
        }

        if (aspect === 'endpoint') {
          const endpoint = endpoints.find((e) => e.id.toLowerCase() === args.id!.toLowerCase());
          if (!endpoint) {
            const prefix = args.id!.split('-')[0].toLowerCase();
            const similar = endpoints
              .filter((e) => e.id.toLowerCase().startsWith(prefix))
              .map((e) => e.id)
              .slice(0, 15);
            throw new Error(
              `Endpoint "${args.id}" not found.` +
                (similar.length > 0 ? ` Similar: ${similar.join(', ')}.` : ' Use aspect "endpoints" to list them.'),
            );
          }
          return {endpoint: endpointDetail(index, dir, endpoint)};
        }

        if (aspect === 'endpoints') {
          const rows = endpoints
            .filter((e) => matches(e.id))
            .map((e) => {
              const issues = endpointIssues(e);
              return {
                id: e.id,
                methods: e.methods,
                https: e.https,
                loginRequired: e.loginRequired,
                csrf: e.csrf,
                cartridge: e.cartridge,
                at: fileRef(index, dir, e.cartridge, e.relPath, e.line),
                ...(issues.length > 0 ? {issues} : {}),
              };
            })
            .filter((r) => !args.issuesOnly || r.issues);
          return {
            total: rows.length,
            endpoints: rows.slice(0, MAX_LIST),
            ...(rows.length > MAX_LIST ? {truncated: rows.length - MAX_LIST} : {}),
          };
        }

        if (aspect === 'hooks') {
          const hooks = hookChains(index)
            .filter((c) => matches(c.name))
            .map((chain) => {
              const registrations = chain.registrations.map((h) => {
                const issue = hookRegistrationIssue(chain, h);
                return {
                  cartridge: h.cartridge,
                  at: h.relPath ? fileRef(index, dir, h.cartridge, h.relPath, h.line) : h.script,
                  ...(h.function ? {function: h.function} : {}),
                  ...(h.exports ? {exports: h.exports} : {}),
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
          return {semantics: HOOK_SEMANTICS, hooks};
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
        return {apis};
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
  minSeverity?: SecuritySeverity;
  excludeReferenceCartridges?: boolean;
  includeSuppressed?: boolean;
  maxFindings?: number;
  projectDirectory?: string;
}

export function createSecurityScanTool(loadServices: () => Promise<Services> | Services): McpTool {
  return createToolAdapter<SecurityScanInput, Record<string, unknown>>(
    {
      name: 'security_scan',
      effect: 'read',
      idempotent: true,
      openWorld: false,
      description:
        'Scan cartridge code and site data for B2C Commerce security problems (preview): CSRF gaps, overrides that drop ' +
        'security middleware, query injection, open redirects, hardcoded credentials, OCAPI demo client ID, and more. ' +
        'Offline; honors inline suppressions and the project baseline. Triage with skill://b2c-cli/b2c-security/SKILL.md.',
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
        minSeverity: z
          .enum(['critical', 'high', 'medium', 'low', 'info'])
          .optional()
          .describe('Drop findings below this severity.'),
        excludeReferenceCartridges: z
          .boolean()
          .optional()
          .describe('Leave out findings in SFRA and SiteGenesis base cartridges (reported and tagged by default).'),
        includeSuppressed: z.boolean().optional().describe('Also return suppressed and baselined findings.'),
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

        const result = scanSecurity({
          root: dir,
          paths,
          rules: args.rules,
          excludeRules: args.excludeRules,
          minSeverity: args.minSeverity,
          baseline,
          cartridgePath: context.services.getResolvedConfig().values.cartridges,
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
            ...(result.hiddenReferenceFindings > 0 ? {hiddenReferenceFindings: result.hiddenReferenceFindings} : {}),
            bySeverity,
            byRule,
            ...(baseline ? {baselineFile: BASELINE_FILE} : {}),
          },
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
              ...(f.suppression ? {suppressed: f.suppression.reason ?? true} : {}),
              ...(f.baselined ? {baselined: true} : {}),
            })),
          ...(shown.length > max ? {truncated: shown.length - max} : {}),
          ...(result.errors.length > 0
            ? {parseErrors: {count: result.errors.length, sample: result.errors.slice(0, 5)}}
            : {}),
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
