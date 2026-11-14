/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/*
 * Derived views of a project index shared by the CLI (`b2c project`), the VS
 * Code Endpoints view, and agent tools: which endpoints have problems, hook
 * registrations grouped by extension point with their run semantics, and
 * Custom APIs grouped by API.
 */
import {securityRole} from './labels.js';
import type {IndexedCustomApiEndpoint, IndexedEndpoint, IndexedHook, ProjectIndex} from './types.js';

/** Whether an endpoint accepts POST, or any method while handling a form submission. */
export function acceptsFormPosts(endpoint: IndexedEndpoint): boolean {
  if (endpoint.methods.includes('POST')) return true;
  return endpoint.methods.includes('ANY') && Boolean(endpoint.chain?.some((m) => m.readsForm));
}

/** Problems worth flagging on a controller endpoint. */
export function endpointIssues(endpoint: IndexedEndpoint): string[] {
  const issues: string[] = [];
  if (endpoint.csrf === 'none' && acceptsFormPosts(endpoint)) issues.push('Accepts POST without a CSRF token check.');
  for (const step of endpoint.steps ?? []) {
    const lost = (step.dropped ?? []).map((id) => securityRole(id) ?? id);
    if (lost.length > 0) issues.push(`server.replace() in ${step.cartridge} dropped the ${lost.join(', ')}.`);
  }
  return issues;
}

/** Controller endpoints (SFRA and SiteGenesis; pipelines left out), sorted by ID. */
export function controllerEndpoints(index: ProjectIndex): IndexedEndpoint[] {
  return index.endpoints.filter((e) => e.kind !== 'pipeline').sort((a, b) => a.id.localeCompare(b.id));
}

/** Registrations of one extension point, in cartridge path order. */
export interface HookChain {
  name: string;
  kind: IndexedHook['kind'];
  registrations: IndexedHook[];
  /**
   * For system extension points: the position of the first registration that
   * can return a value. When it does, the registrations after it and the
   * system implementation are skipped.
   */
  stopsAt?: number;
  /** A risk worth flagging: an OCAPI/SCAPI hook that returns a value, or one that skips later registrations. */
  issue?: string;
  /** Information that isn't a problem, such as the last registration intentionally replacing the system implementation. */
  note?: string;
}

/** How registrations run for an extension point kind. */
export const HOOK_SEMANTICS: Readonly<Record<IndexedHook['kind'], string>> = Object.freeze({
  system:
    'System extension point: registrations run in cartridge path order. The first one that returns a value (such as a Status) skips the later registrations and the system implementation; returning nothing lets them run.',
  custom: 'Custom extension point: every registration runs, whatever it returns.',
});

/** Whether an extension point is an OCAPI/SCAPI hook (`dw.ocapi.*`). */
export function isApiHook(name: string): boolean {
  return name.startsWith('dw.ocapi.');
}

/**
 * Hook registrations grouped by extension point, ordered by the index's
 * cartridge path. For system extension points, a registration that can return
 * a value is an issue when it would skip later registrations, or for any
 * OCAPI/SCAPI hook (where it also skips the system implementation, such as
 * basket calculation). When the last registration of another system hook
 * returns a value, it is noted as replacing the system implementation.
 */
export function hookChains(index: ProjectIndex): HookChain[] {
  const order = new Map(index.cartridges.map((c, i) => [c.name, i]));
  const groups = new Map<string, IndexedHook[]>();
  for (const h of index.hooks) groups.set(h.name, [...(groups.get(h.name) ?? []), h]);
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, registrations]) => {
      const sorted = [...registrations].sort((a, b) => (order.get(a.cartridge) ?? 0) - (order.get(b.cartridge) ?? 0));
      const kind = sorted[0].kind;
      const stopsAt = kind === 'system' ? sorted.findIndex((r) => r.returnsValue === 'yes') : -1;
      if (stopsAt < 0) return {name, kind, registrations: sorted};
      const skipped = sorted.length - stopsAt - 1;
      const cartridge = sorted[stopsAt].cartridge;
      if (skipped === 0 && !isApiHook(name)) {
        return {
          name,
          kind,
          registrations: sorted,
          stopsAt,
          note: `${cartridge} returns a value, replacing the system implementation.`,
        };
      }
      const issue =
        `${cartridge} can return a value, which skips ` +
        (skipped > 0 ? `${skipped} later registration${skipped > 1 ? 's' : ''} and ` : '') +
        'the system implementation.';
      return {name, kind, registrations: sorted, stopsAt, issue};
    });
}

/** A problem with one hook registration, if any. */
export function hookRegistrationIssue(chain: HookChain, hook: IndexedHook): string | undefined {
  if (!hook.relPath) return `Script ${hook.script} not found.`;
  if (chain.kind !== 'system') return undefined;
  const file = hook.relPath.split('/').at(-1);
  if (hook.returnsValue === 'unknown') return `No exported function named ${hook.function} in ${file}.`;
  if (hook.returnsValue !== 'yes') return undefined;
  const isLast = chain.registrations.indexOf(hook) === chain.registrations.length - 1;
  if (isApiHook(chain.name)) {
    return 'Returns a value: when it does, later registrations and the system implementation (such as basket calculation) are skipped. Return nothing unless you mean to stop processing.';
  }
  if (!isLast) return 'Returns a value: when it does, later registrations and the system implementation are skipped.';
  return undefined;
}

/** One Custom API and its endpoints. */
export interface CustomApiGroup {
  api: string;
  endpoints: IndexedCustomApiEndpoint[];
  cartridges: string[];
  /** `shopper` and/or `admin`, from the endpoints' security schemes. */
  types: Array<'admin' | 'shopper'>;
  issue?: string;
}

/** Custom API endpoints grouped by API name. */
export function customApiGroups(index: ProjectIndex): CustomApiGroup[] {
  const groups = new Map<string, IndexedCustomApiEndpoint[]>();
  for (const e of index.customApis) groups.set(e.api, [...(groups.get(e.api) ?? []), e]);
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([api, endpoints]) => {
      const cartridges = [...new Set(endpoints.map((e) => e.cartridge))];
      const types = [
        ...new Set(endpoints.map((e) => e.apiType).filter((t): t is 'admin' | 'shopper' => t !== 'unknown')),
      ];
      const issue =
        cartridges.length > 1
          ? `Defined in more than one cartridge (${cartridges.join(', ')}). Check which one is on the site's cartridge path.`
          : undefined;
      return {api, endpoints, cartridges, types, ...(issue ? {issue} : {})};
    });
}
