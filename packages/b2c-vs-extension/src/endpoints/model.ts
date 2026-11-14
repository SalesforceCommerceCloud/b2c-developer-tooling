/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/*
 * View model for the Endpoints view and the Controllers category of the
 * Cartridges tree, derived from the SDK project index. Pure functions (no
 * vscode imports) so they can be tested directly.
 */
import {
  HOOK_SEMANTICS,
  acceptsFormPosts,
  customApiGroups as sdkCustomApiGroups,
  endpointIssues,
  hookChains,
  hookRegistrationIssue,
  middlewareLabel,
  securityRole,
  type CustomApiGroup as SdkCustomApiGroup,
  type HookChain,
  type IndexedCustomApiEndpoint,
  type IndexedEndpoint,
  type IndexedHook,
  type IndexedMiddleware,
  type ProjectIndex,
  type RouteStep,
} from '@salesforce/b2c-tooling-sdk/project-index';

/** A place in a cartridge file. */
export interface SourceLocation {
  cartridge: string;
  relPath: string;
  line?: number;
}

/** One row in a tree. */
export interface RowModel {
  label: string;
  description?: string;
  tooltip?: string;
  /** Set when the row deserves attention; shown as a warning icon and in the tooltip. */
  warning?: string;
  location?: SourceLocation;
}

/** Joins a cartridge-relative location to an absolute path using the index's cartridge list. */
export function absolutePath(index: ProjectIndex, location: SourceLocation): string | undefined {
  const cartridge = index.cartridges.find((c) => c.name === location.cartridge);
  return cartridge ? `${cartridge.src}/${location.relPath}` : undefined;
}

function fileName(relPath: string): string {
  return relPath.split('/').at(-1) ?? relPath;
}

function dropped(step: RouteStep): string[] {
  return (step.dropped ?? []).map((id) => securityRole(id) ?? id);
}

// ---------------------------------------------------------------------------
// Controller endpoints
// ---------------------------------------------------------------------------

/** Problems worth flagging on an endpoint (shared with `b2c project` through the SDK). */
export function endpointWarnings(e: IndexedEndpoint): string[] {
  return endpointIssues(e);
}

/** Row for a storefront endpoint: `Cart-AddProduct` with `POST · HTTPS · login · CSRF`. */
export function endpointRow(e: IndexedEndpoint): RowModel {
  const parts: string[] = [e.methods.includes('ANY') ? 'any method' : e.methods.join('/')];
  if (e.https) parts.push('HTTPS');
  if (e.loginRequired) parts.push('login');
  if (e.csrf === 'middleware' || e.csrf === 'in-handler') parts.push('CSRF');
  const warnings = endpointWarnings(e);
  const definedBy = `Defined in ${e.cartridge}/${e.relPath}:${e.line}`;
  return {
    label: e.id,
    description: parts.join(' · '),
    ...(warnings.length > 0 ? {warning: warnings.join(' ')} : {}),
    tooltip: [`${e.id} (${e.kind === 'sfra' ? 'SFRA' : 'SiteGenesis'})`, definedBy, ...warnings].join('\n'),
    location: {cartridge: e.cartridge, relPath: e.relPath, line: e.line},
  };
}

/** Rows for what runs for an SFRA endpoint, in execution order. */
export function chainRows(e: IndexedEndpoint): Array<RowModel & {implementation?: SourceLocation}> {
  return (e.chain ?? []).map((m: IndexedMiddleware) => {
    const label = m.id === 'function' ? `Handler (${fileName(m.relPath)}:${m.line})` : middlewareLabel(m.id);
    const description = [m.via, m.cartridge].filter(Boolean).join(' · ');
    return {
      label,
      description,
      tooltip: [
        m.id === 'function' ? 'Inline handler' : m.id,
        `${m.cartridge}/${m.relPath}:${m.line}`,
        m.via ? `Added by server.${m.via}()` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      location: {cartridge: m.cartridge, relPath: m.relPath, line: m.line},
      ...(m.source ? {implementation: {cartridge: m.source.cartridge, relPath: m.source.relPath}} : {}),
    };
  });
}

/** Rows for the statements that built an SFRA endpoint, across cartridges. */
export function historyRows(e: IndexedEndpoint): RowModel[] {
  return (e.steps ?? []).map((step) => {
    const lost = dropped(step);
    return {
      label: `server.${step.method}`,
      description: `${fileName(step.relPath)}:${step.line} · ${step.cartridge}`,
      ...(lost.length > 0 ? {warning: `Dropped the ${lost.join(', ')} that the replaced route had.`} : {}),
      tooltip: `${step.cartridge}/${step.relPath}:${step.line}`,
      location: {cartridge: step.cartridge, relPath: step.relPath, line: step.line},
    };
  });
}

/** Rows for SiteGenesis guard filters. */
export function guardRow(e: IndexedEndpoint): RowModel {
  return {
    label: `guard.ensure([${(e.filters ?? []).map((f) => `'${f}'`).join(', ')}])`,
    location: {cartridge: e.cartridge, relPath: e.relPath, line: e.line},
  };
}

/** Controller endpoints (SFRA and SiteGenesis; pipelines are not shown), grouped by controller name. */
export function controllerGroups(
  index: ProjectIndex,
): Array<{controller: string; cartridges: string[]; endpoints: IndexedEndpoint[]}> {
  const groups = new Map<string, IndexedEndpoint[]>();
  for (const e of index.endpoints) {
    if (e.kind === 'pipeline') continue;
    groups.set(e.controller, [...(groups.get(e.controller) ?? []), e]);
  }
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([controller, endpoints]) => ({
      controller,
      cartridges: [...new Set(endpoints.flatMap((e) => (e.steps ?? []).map((s) => s.cartridge).concat(e.cartridge)))],
      endpoints: endpoints.sort((a, b) => a.action.localeCompare(b.action)),
    }));
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** An extension point and its registrations in cartridge path order. */
export interface HookGroup extends HookChain {
  row: RowModel;
}

/** Hook registrations grouped by extension point, in cartridge path order. */
export function hookGroups(index: ProjectIndex): HookGroup[] {
  return hookChains(index).map((chain) => {
    const count = `${chain.registrations.length} registration${chain.registrations.length > 1 ? 's' : ''}`;
    return {
      ...chain,
      row: {
        label: chain.name,
        description: `${chain.kind} · ${count}`,
        ...(chain.issue ? {warning: chain.issue} : {}),
        tooltip: [chain.name, HOOK_SEMANTICS[chain.kind], chain.issue ?? chain.note ?? ''].filter(Boolean).join('\n\n'),
      },
    };
  });
}

/** Row for one hook registration. */
export function hookRegistrationRow(group: HookGroup, hook: IndexedHook, position: number): RowModel {
  const where = hook.relPath ? `${fileName(hook.relPath)}${hook.line ? `:${hook.line}` : ''}` : hook.script;
  const warning = hookRegistrationIssue(group, hook);
  let detail: string | undefined;
  if (group.kind === 'system' && hook.returnsValue !== 'unknown') {
    detail = hook.returnsValue === 'yes' ? 'returns a value' : 'returns nothing';
  } else if (group.kind === 'custom' && hook.exports && hook.exports.length > 0) {
    // Custom extension points: the caller picks the function in HookMgr.callHook(name, functionName, ...).
    detail = `exports ${hook.exports.join(', ')}`;
  }
  const subject = group.kind === 'system' ? `${hook.function}()` : 'Implementation';
  return {
    label: `${position + 1}. ${hook.cartridge}`,
    description: [where, detail].filter(Boolean).join(' · '),
    ...(warning ? {warning} : {}),
    tooltip: [`${subject} in ${hook.cartridge}/${hook.relPath ?? hook.script}`, warning ?? '']
      .filter(Boolean)
      .join('\n'),
    ...(hook.relPath ? {location: {cartridge: hook.cartridge, relPath: hook.relPath, line: hook.line}} : {}),
  };
}

// ---------------------------------------------------------------------------
// Custom APIs
// ---------------------------------------------------------------------------

/** A Custom API and its endpoints. */
export interface CustomApiGroup extends SdkCustomApiGroup {
  row: RowModel;
}

/** Custom API endpoints grouped by API name. */
export function customApiGroups(index: ProjectIndex): CustomApiGroup[] {
  return sdkCustomApiGroups(index).map((group) => ({
    ...group,
    row: {
      label: group.api,
      description: [group.types.join('/'), group.cartridges.join(', ')].filter(Boolean).join(' · '),
      ...(group.issue ? {warning: group.issue} : {}),
      tooltip: [`Custom API ${group.api}`, `Cartridge: ${group.cartridges.join(', ')}`, group.issue ?? '']
        .filter(Boolean)
        .join('\n'),
    },
  }));
}

/** Row for one Custom API endpoint: `getPoints` with `GET /points · ShopperToken c_loyalty`. */
export function customApiEndpointRow(e: IndexedCustomApiEndpoint): RowModel {
  const route = [e.method, e.path].filter(Boolean).join(' ');
  const security = [...(e.security ?? []), ...(e.scopes ?? [])].join(' ');
  const warning = e.problems.length > 0 ? e.problems.join(' ') : undefined;
  return {
    label: e.endpoint,
    description: [route, security].filter(Boolean).join(' · '),
    ...(warning ? {warning} : {}),
    tooltip: [
      `${e.endpoint} (${e.cartridge}/cartridge/rest-apis/${e.api})`,
      e.implementationFile
        ? `Implementation: ${e.implementationFile.relPath}${e.implementationFile.line ? `:${e.implementationFile.line}` : ''}`
        : '',
      warning ?? '',
    ]
      .filter(Boolean)
      .join('\n'),
    ...(e.implementationFile
      ? {location: {cartridge: e.cartridge, relPath: e.implementationFile.relPath, line: e.implementationFile.line}}
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Cartridges tree: Controllers category
// ---------------------------------------------------------------------------

/** A controller file in one cartridge and the route statements in it. */
export interface ControllerFile {
  relPath: string;
  /** Cartridge whose routes this file extends, when it changes routes defined elsewhere. */
  extends?: string;
  rows: RowModel[];
}

/** Controller files in `cartridge` with one row per route statement, noting what other cartridges do to each route. */
export function controllerFiles(index: ProjectIndex, cartridge: string): ControllerFile[] {
  const files = new Map<string, Array<RowModel & {line: number}>>();
  const extendsOf = new Map<string, string>();
  const add = (relPath: string, row: RowModel & {line: number}) =>
    files.set(relPath, [...(files.get(relPath) ?? []), row]);

  for (const e of index.endpoints) {
    if (e.kind === 'sg-controller' && e.cartridge === cartridge) {
      const warning = endpointWarnings(e)[0];
      add(e.relPath, {
        label: `exports.${e.action}`,
        description: (e.filters ?? []).join(', '),
        ...(warning ? {warning} : {}),
        location: {cartridge, relPath: e.relPath, line: e.line},
        line: e.line,
      });
      continue;
    }
    if (e.kind !== 'sfra') continue;
    const steps = e.steps ?? [];
    steps.forEach((step, i) => {
      if (step.cartridge !== cartridge) return;
      const notes: string[] = [];
      const later = steps.slice(i + 1).filter((s) => s.cartridge !== cartridge);
      const replacedBy = later.find((s) => s.method === 'replace');
      if (replacedBy) notes.push(`replaced by ${replacedBy.cartridge}`);
      for (const s of later.filter((x) => x.method === 'prepend' || x.method === 'append'))
        notes.push(`${s.method}ed by ${s.cartridge}`);
      const base = steps.slice(0, i).find((s) => s.cartridge !== cartridge);
      if (base && (step.method === 'append' || step.method === 'prepend' || step.method === 'replace')) {
        extendsOf.set(step.relPath, base.cartridge);
      }
      const lost = dropped(step);
      const isEffectiveDefinition = e.cartridge === cartridge && e.relPath === step.relPath && e.line === step.line;
      const warning =
        lost.length > 0
          ? `Dropped the ${lost.join(', ')} that the replaced route had.`
          : isEffectiveDefinition && e.csrf === 'none' && acceptsFormPosts(e)
            ? 'Accepts POST without a CSRF token check.'
            : undefined;
      add(step.relPath, {
        label: `${step.method} ${e.action}`,
        description: notes.join(' · '),
        ...(warning ? {warning} : {}),
        tooltip: [`${e.id}: server.${step.method}() at line ${step.line}`, ...notes, warning ?? '']
          .filter(Boolean)
          .join('\n'),
        location: {cartridge, relPath: step.relPath, line: step.line},
        line: step.line,
      });
    });
  }

  return [...files]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([relPath, rows]) => ({
      relPath,
      ...(extendsOf.has(relPath) ? {extends: extendsOf.get(relPath)} : {}),
      rows: rows.sort((a, b) => a.line - b.line).map(({line: _line, ...row}) => row),
    }));
}

/** Whether a row or any of the given rows carries a warning (for "only issues" filtering). */
export function hasWarning(...rows: RowModel[]): boolean {
  return rows.some((r) => r.warning !== undefined);
}
