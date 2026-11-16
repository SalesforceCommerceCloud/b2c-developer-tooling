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
  type IndexedJobStep,
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
  /** Where the row is registered (the hooks.json or steptypes.json entry), for "Open Registration". */
  registration?: SourceLocation;
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
    const label = m.id === 'function' ? `Handler (${fileName(m.relPath)}:${m.line})` : (m.expression ?? m.id);
    // Show the cartridge the code comes from: the implementing module for required middleware.
    const fromCartridge = m.source?.cartridge ?? m.cartridge;
    const description = [m.via, fromCartridge].filter(Boolean).join(' · ');
    const known = m.id === 'function' ? undefined : middlewareLabel(m.id);
    return {
      label,
      description,
      tooltip: [
        m.id === 'function' ? 'Inline handler' : known && known !== m.id ? known : '',
        m.source
          ? `Implemented in ${m.source.cartridge}/${m.source.relPath}${m.source.line ? `:${m.source.line}` : ''}`
          : '',
        `Used in ${m.cartridge}/${m.relPath}:${m.line}`,
        m.via ? `Added by server.${m.via}()` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      location: {cartridge: m.cartridge, relPath: m.relPath, line: m.line},
      ...(m.source
        ? {implementation: {cartridge: m.source.cartridge, relPath: m.source.relPath, line: m.source.line}}
        : {}),
    };
  });
}

const EVENT_TIMING: Record<string, string> = {
  'route:BeforeComplete': 'Runs after the last step, before the response is rendered.',
  'route:Complete': 'Runs after the response is rendered.',
  'route:Redirect': 'Runs instead of the remaining steps when a step sets a redirect.',
};

/** Rows for route event listeners (`this.on('route:BeforeComplete', fn)`) registered by the chain, in the order they run. */
export function eventRows(e: IndexedEndpoint): RowModel[] {
  return (e.events ?? []).map((listener) => ({
    label: listener.event,
    description: [
      `step ${listener.step + 1}`,
      listener.via,
      listener.cartridge,
      listener.conditional ? 'conditional' : '',
    ]
      .filter(Boolean)
      .join(' · '),
    tooltip: [
      `${listener.cartridge}/${listener.relPath}:${listener.line}`,
      `Registered by step ${listener.step + 1} of the chain.`,
      EVENT_TIMING[listener.event] ?? '',
      listener.conditional ? 'Registered inside a condition, so it may not run on every request.' : '',
    ]
      .filter(Boolean)
      .join('\n'),
    location: {cartridge: listener.cartridge, relPath: listener.relPath, line: listener.line},
  }));
}

const DELEGATE_NOTE =
  'This controller passes module to a helper, which may change the route. What the helper does is not shown.';

function stepLabel(step: RouteStep): string {
  return step.method === 'delegate' ? 'passes module to a helper' : `server.${step.method}`;
}

/** Rows for the statements that built an SFRA endpoint, across cartridges. */
export function historyRows(e: IndexedEndpoint): RowModel[] {
  return (e.steps ?? []).map((step) => {
    const lost = dropped(step);
    return {
      label: stepLabel(step),
      description: `${fileName(step.relPath)}:${step.line} · ${step.cartridge}`,
      ...(lost.length > 0 ? {warning: `Dropped the ${lost.join(', ')} that the replaced route had.`} : {}),
      tooltip: [`${step.cartridge}/${step.relPath}:${step.line}`, step.method === 'delegate' ? DELEGATE_NOTE : '']
        .filter(Boolean)
        .join('\n'),
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

/** Row for one hook registration: opens the script; custom hooks list the functions callers use as children. */
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
    tooltip: [
      `${subject} in ${hook.scriptCartridge ?? hook.cartridge}/${hook.relPath ?? hook.script}`,
      hook.registeredIn
        ? `Registered in ${hook.cartridge}/${hook.registeredIn.relPath}${hook.registeredIn.line ? `:${hook.registeredIn.line}` : ''}`
        : '',
      warning ?? '',
    ]
      .filter(Boolean)
      .join('\n'),
    ...(hook.relPath
      ? {location: {cartridge: hook.scriptCartridge ?? hook.cartridge, relPath: hook.relPath, line: hook.line}}
      : {}),
    ...(hook.registeredIn ? {registration: {cartridge: hook.cartridge, ...hook.registeredIn}} : {}),
  };
}

/** A function the project calls on a custom hook, with the call sites that name it. */
export interface HookFunctionRow extends RowModel {
  callers: RowModel[];
}

/**
 * Rows for the functions the project names in `HookMgr.callHook(hook, fn, ...)`
 * for one custom hook registration. Each opens the function in the hook script
 * and lists the call sites as children; functions the script doesn't export are flagged.
 */
export function hookFunctionRows(hook: IndexedHook): HookFunctionRow[] {
  const script = hook.scriptCartridge ?? hook.cartridge;
  return (hook.calledFunctions ?? []).map((fn) => {
    const count = fn.callers.length;
    const warning =
      fn.line === undefined && hook.relPath ? `${fileName(hook.relPath)} does not export ${fn.name}().` : undefined;
    return {
      label: `${fn.name}()`,
      description: [
        fn.line !== undefined && hook.relPath ? `${fileName(hook.relPath)}:${fn.line}` : '',
        `${count} caller${count === 1 ? '' : 's'}`,
      ]
        .filter(Boolean)
        .join(' · '),
      ...(warning ? {warning} : {}),
      tooltip: [
        `HookMgr.callHook('${hook.name}', '${fn.name}', ...)`,
        hook.relPath ? `Implemented in ${script}/${hook.relPath}${fn.line ? `:${fn.line}` : ''}` : '',
        warning ?? '',
      ]
        .filter(Boolean)
        .join('\n'),
      ...(hook.relPath ? {location: {cartridge: script, relPath: hook.relPath, line: fn.line}} : {}),
      callers: fn.callers.map((c) => ({
        label: `${fileName(c.relPath)}:${c.line}`,
        description: c.cartridge,
        tooltip: `${c.cartridge}/${c.relPath}:${c.line}`,
        location: {cartridge: c.cartridge, relPath: c.relPath, line: c.line},
      })),
    };
  });
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
      for (const s of later.filter((x) => x.method === 'delegate')) notes.push(`may be changed by ${s.cartridge}`);
      const base = steps.slice(0, i).find((s) => s.cartridge !== cartridge);
      if (
        base &&
        (step.method === 'append' ||
          step.method === 'prepend' ||
          step.method === 'replace' ||
          step.method === 'delegate')
      ) {
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
        label: step.method === 'delegate' ? `extends ${e.action} in a helper` : `${step.method} ${e.action}`,
        description: notes.join(' · '),
        ...(warning ? {warning} : {}),
        tooltip: [
          step.method === 'delegate'
            ? `${e.id}: line ${step.line}. ${DELEGATE_NOTE}`
            : `${e.id}: server.${step.method}() at line ${step.line}`,
          ...notes,
          warning ?? '',
        ]
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

// ---------------------------------------------------------------------------
// Cartridges tree: Hooks and Custom APIs categories
// ---------------------------------------------------------------------------

/**
 * Rows for the hooks `cartridge` registers, one per registration: the hook
 * name with its position among all registrations of that hook. Built from the
 * same rows as the Endpoints view's Hooks group.
 */
export function cartridgeHookRows(
  index: ProjectIndex,
  cartridge: string,
): Array<RowModel & {children?: Array<RowModel & {icon: string; children: Array<RowModel & {icon: string}>}>}> {
  const rows: ReturnType<typeof cartridgeHookRows> = [];
  for (const group of hookGroups(index)) {
    group.registrations.forEach((hook, i) => {
      if (hook.cartridge !== cartridge) return;
      const row = hookRegistrationRow(group, hook, i);
      const total = group.registrations.length;
      const functions = group.kind === 'custom' ? hookFunctionRows(hook) : [];
      rows.push({
        ...row,
        label: group.name,
        description: [total > 1 ? `${i + 1} of ${total}` : '', row.description].filter(Boolean).join(' · '),
        tooltip: [group.row.tooltip, row.tooltip].filter(Boolean).join('\n\n'),
        ...(functions.length > 0
          ? {
              children: functions.map(({callers, ...fn}) => ({
                ...fn,
                icon: 'symbol-method',
                children: callers.map((c) => ({...c, icon: 'call-incoming'})),
              })),
            }
          : {}),
      });
    });
  }
  return rows.sort((a, b) => a.label.localeCompare(b.label));
}

/** The Custom APIs `cartridge` defines, with only that cartridge's endpoints. */
export function cartridgeCustomApis(index: ProjectIndex, cartridge: string): CustomApiGroup[] {
  return customApiGroups(index)
    .map((group) => ({...group, endpoints: group.endpoints.filter((e) => e.cartridge === cartridge)}))
    .filter((group) => group.endpoints.length > 0);
}

/** Rows for the custom job steps `cartridge` registers in steptypes.json; a click opens the step's function. */
export function cartridgeJobStepRows(index: ProjectIndex, cartridge: string): RowModel[] {
  return (index.jobSteps ?? [])
    .filter((step) => step.cartridge === cartridge)
    .sort((a, b) => a.typeId.localeCompare(b.typeId))
    .map((step) => jobStepRow(step));
}

/** Row for one custom job step: `custom.Export` with `task · execute() · export.js:12`. */
export function jobStepRow(step: IndexedJobStep): RowModel {
  const impl = step.implementationFile;
  const kind = step.kind === 'chunk-script-module-step' ? 'chunk' : 'task';
  const where = impl ? `${fileName(impl.relPath)}${impl.line ? `:${impl.line}` : ''}` : undefined;
  const warning = step.problems.length > 0 ? step.problems.join(' ') : undefined;
  const params = step.parameters.map(
    (p) => `${p.name}${p.type ? `: ${p.type}` : ''}${p.required ? ' (required)' : ''}`,
  );
  return {
    label: step.typeId,
    description: [kind, step.function ? `${step.function}()` : '', where].filter(Boolean).join(' · '),
    ...(warning ? {warning} : {}),
    tooltip: [
      `${step.typeId} (${kind} step)`,
      step.description ?? '',
      impl ? `Implemented in ${impl.cartridge}/${impl.relPath}${impl.line ? `:${impl.line}` : ''}` : '',
      params.length > 0 ? `Parameters: ${params.join(', ')}` : '',
      `Registered in ${step.cartridge}/${step.registeredIn.relPath}${step.registeredIn.line ? `:${step.registeredIn.line}` : ''}`,
      warning ?? '',
    ]
      .filter(Boolean)
      .join('\n'),
    location: impl
      ? {cartridge: impl.cartridge, relPath: impl.relPath, line: impl.line}
      : {cartridge: step.cartridge, ...step.registeredIn},
    registration: {cartridge: step.cartridge, ...step.registeredIn},
  };
}

// ---------------------------------------------------------------------------
// Editor: code lenses on controller route statements
// ---------------------------------------------------------------------------

/** A code lens for one route statement or SiteGenesis action in a controller file. */
export interface ControllerLens {
  /** 1-based line of the statement. */
  line: number;
  endpoint: string;
  title: string;
  tooltip: string;
}

/**
 * Lenses for the controller at `file` (absolute path): one per route statement
 * or SiteGenesis action, summarizing the composed endpoint, such as
 * `Cart-AddProduct · POST · 4 steps · appended by int_paypal`.
 */
export function controllerLenses(index: ProjectIndex, file: string): ControllerLens[] {
  const normalized = file.replace(/\\/g, '/');
  const cartridge = index.cartridges.find((c) => normalized.startsWith(`${c.src.replace(/\\/g, '/')}/`));
  if (!cartridge) return [];
  const relPath = normalized.slice(cartridge.src.replace(/\\/g, '/').length + 1);
  const lenses: ControllerLens[] = [];
  for (const e of index.endpoints) {
    if (e.kind === 'pipeline') continue;
    const methods = e.methods.includes('ANY') ? 'any method' : e.methods.join('/');
    if (e.kind === 'sg-controller') {
      if (e.cartridge !== cartridge.name || e.relPath !== relPath) continue;
      lenses.push({
        line: e.line,
        endpoint: e.id,
        title: [e.id, ...(e.filters ?? [])].join(' · '),
        tooltip: 'Show in the Endpoints view',
      });
      continue;
    }
    const steps = e.steps ?? [];
    steps.forEach((step, i) => {
      if (step.cartridge !== cartridge.name || step.relPath !== relPath) return;
      const others = steps.filter((s, j) => j !== i && s.cartridge !== cartridge.name);
      const later = steps.slice(i + 1).filter((s) => s.cartridge !== cartridge.name);
      const notes = later.map((s) =>
        s.method === 'replace'
          ? `replaced by ${s.cartridge}`
          : s.method === 'delegate'
            ? `may be changed by ${s.cartridge}`
            : `${s.method}ed by ${s.cartridge}`,
      );
      const chain = (e.chain ?? []).length;
      lenses.push({
        line: step.line,
        endpoint: e.id,
        title: [e.id, methods, chain > 0 ? `${chain} step${chain === 1 ? '' : 's'}` : '', ...new Set(notes)]
          .filter(Boolean)
          .join(' · '),
        tooltip: [
          'Show what runs for this endpoint in the Endpoints view',
          others.length > 0 ? `Also changed in: ${[...new Set(others.map((s) => s.cartridge))].join(', ')}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      });
    });
  }
  return lenses.sort((a, b) => a.line - b.line);
}

/** Whether a row or any of the given rows carries a warning (for "only issues" filtering). */
export function hasWarning(...rows: RowModel[]): boolean {
  return rows.some((r) => r.warning !== undefined);
}
