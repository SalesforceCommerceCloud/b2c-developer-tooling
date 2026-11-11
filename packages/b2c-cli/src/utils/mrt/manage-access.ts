/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {
  StorefrontEnvironment,
  StorefrontManageAccess,
  UiManagedAt,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';

/**
 * Manage-access state using the CLI's user-facing keys.
 */
export interface ManageAccessState {
  ui: UiManagedAt;
  scapi: boolean | null;
  'legacy-mrt-api': boolean | null;
}

/**
 * JSON result of `mrt project manage-access get`.
 */
export interface ManageAccessGetResult extends ManageAccessState {
  project: string;
  environments: StorefrontEnvironment[];
  instances: string[];
}

const UI_EXPLANATIONS: Record<UiManagedAt, string> = {
  mrt: 'Managed in Runtime Admin. BM Dev Workspace is read-only for this storefront.',
  b2c: 'Managed in Business Manager. Runtime Admin is read-only for this storefront.',
};

const SCAPI_EXPLANATIONS = {
  true: 'SCAPI MRT Admin API available for this storefront.',
  false: 'SCAPI MRT Admin API not available for this storefront.',
};

const LEGACY_EXPLANATIONS = {
  true: 'Direct MRT API read/writes allowed.',
  false: 'Direct MRT API read/writes blocked.',
};

const UNKNOWN_EXPLANATION = 'Not reported by the server.';

const NO_WRITE_PATH_WARNING =
  '[!] No write path anywhere: SCAPI and direct MRT API access are both off for this storefront.';

/**
 * Maps SDK manage-access fields to the CLI's user-facing keys.
 */
export function toManageAccessState(access: StorefrontManageAccess): ManageAccessState {
  return {
    ui: access.uiManagedAt,
    scapi: access.scapiEnabled,
    'legacy-mrt-api': access.mrtApiEnabled,
  };
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function explainBoolean(value: boolean | null, explanations: {true: string; false: string}): [string, string] {
  if (value === null) return ['unknown', UNKNOWN_EXPLANATION];
  return [String(value), explanations[`${value}`]];
}

/**
 * Formats manage-access state as human-readable text.
 */
export function formatManageAccess(result: ManageAccessGetResult): string {
  const state: ManageAccessState = {ui: result.ui, scapi: result.scapi, 'legacy-mrt-api': result['legacy-mrt-api']};

  const rows: [string, string][] = [
    [`ui: ${state.ui}`, UI_EXPLANATIONS[state.ui]],
    ...[
      ['scapi', explainBoolean(state.scapi, SCAPI_EXPLANATIONS)] as const,
      ['legacy-mrt-api', explainBoolean(state['legacy-mrt-api'], LEGACY_EXPLANATIONS)] as const,
    ].map(([key, [value, explanation]]): [string, string] => [`${key}: ${value}`, explanation]),
  ];
  const labelWidth = Math.max(...rows.map(([label]) => label.length));

  const lines = [
    `Storefront: ${result.project}`,
    `Resolved across ${plural(result.instances.length, 'instance')} / ${plural(result.environments.length, 'environment')}`,
    '',
    JSON.stringify(state, null, 2),
    '',
    ...rows.map(([label, explanation]) => `${label.padEnd(labelWidth)} -> ${explanation}`),
  ];

  if (state.scapi === false && state['legacy-mrt-api'] === false) {
    lines.push('', NO_WRITE_PATH_WARNING);
  }

  if (result.environments.length > 0) {
    const slugWidth = Math.max(...result.environments.map((e) => e.slug.length));
    lines.push(
      '',
      'Environments:',
      ...result.environments.map(
        (e) => `  ${e.slug.padEnd(slugWidth)}  ${e.instanceId ?? '(no B2C instance connected)'}`,
      ),
    );
  }

  return lines.join('\n');
}
