/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/*
 * Access to the project index that runners pass to rules through
 * `settings.b2cSecurity.projectIndex`. Rules must work without it (single-file
 * analysis) and use it to see across files: composed SFRA routes, overlays.
 */
import type {IndexedEndpoint, ProjectIndex} from '../../project-index/types.js';
import type {ScriptRuleContext} from '../rule.js';

/** Settings key under which runners pass security data to rules. */
export const SECURITY_SETTINGS_KEY = 'b2cSecurity';

/** The shape of `settings.b2cSecurity`. */
export interface SecurityRuleSettings {
  projectIndex?: ProjectIndex;
}

/** The project index passed to rules, if any. */
export function projectIndexOf(context: ScriptRuleContext): ProjectIndex | undefined {
  const settings = context.settings?.[SECURITY_SETTINGS_KEY] as SecurityRuleSettings | undefined;
  return settings?.projectIndex?.version === 1 ? settings.projectIndex : undefined;
}

/** Whether `filename` is `<cartridge>/<relPath>` (matching by suffix, so symlinked or relative roots still match). */
export function isIndexedFile(filename: string, cartridge: string, relPath: string): boolean {
  const normalized = filename.replace(/\\/g, '/');
  return normalized.endsWith(`/${cartridge}/${relPath}`) || normalized === `${cartridge}/${relPath}`;
}

/** The endpoint whose composed steps include the statement at `filename:line`. */
export function endpointForStatement(index: ProjectIndex, filename: string, line: number): IndexedEndpoint | undefined {
  return index.endpoints.find((e) =>
    e.steps?.some((s) => s.line === line && isIndexedFile(filename, s.cartridge, s.relPath)),
  );
}

/** The controller name for a controller file path (`.../controllers/Cart.js` gives `Cart`). */
export function controllerName(filename: string): string {
  return (filename.replace(/\\/g, '/').split('/').at(-1) ?? filename).replace(/\.(js|ds)$/, '');
}
