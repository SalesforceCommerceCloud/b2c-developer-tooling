/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import cliui from 'cliui';
import type {SlasComponents} from '@salesforce/b2c-tooling-sdk';

export type IdentityProvider = SlasComponents['schemas']['IdentityProviderResponse'];
export type IdentityProviderRequest = SlasComponents['schemas']['IdentityProvider'];

/** Provider name prefixes SLAS accepts. A name is `<prefix>` or `<prefix>-<suffix>`. */
export const IDP_PROVIDERS = [
  'adfs',
  'apple',
  'auth0',
  'azure',
  'azure_adb2c',
  'cognito',
  'default',
  'facebook',
  'forgerock',
  'gigya',
  'gigya_social',
  'google',
  'line',
  'okta',
  'ping',
  'salesforce',
] as const;

/** Fields the service populates, which must not be sent back on update. */
const SERVER_FIELDS = ['id', 'tenantId', 'idpOrigin', 'privateJwtKeyAlgorithm', 'privateJwtKeyPair'];

/** Placeholder shown in place of a secret in human-readable output. */
export const REDACTED = '********';

/**
 * Whether an IDP name has a provider prefix SLAS accepts.
 */
export function isValidIdpName(name: string): boolean {
  return IDP_PROVIDERS.some((p) => name === p || (name.startsWith(`${p}-`) && name.length > p.length + 1));
}

/**
 * Build the default SLAS callback URL for an IDP.
 */
export function defaultIdpRedirectUrl(shortCode: string, name: string): string {
  return `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/idp/callback/${name}`;
}

/**
 * Hide the IDP client secret (and private key material) unless asked to show it.
 */
export function redactIdp(idp: IdentityProvider, showSecret = false): IdentityProvider {
  if (showSecret) return idp;
  const copy = {...idp};
  if (copy.clientSecret) copy.clientSecret = REDACTED;
  if (copy.privateJwtKeyPair) copy.privateJwtKeyPair = REDACTED;
  return copy;
}

/**
 * Build an IDP update request from an existing configuration and changes.
 *
 * SLAS replaces the whole configuration and rejects partial bodies, so updates start from the
 * current values. The service also requires `isPreferred` and (on update) `clientAuthType`.
 */
export function buildIdpRequest(
  name: string,
  existing: IdentityProvider | undefined,
  changes: Partial<IdentityProviderRequest>,
): IdentityProviderRequest {
  // Strip server-owned fields from both sides: a --file copied from another tenant carries its id/tenantId.
  const merged: Record<string, unknown> = {...existing, ...changes, name};
  for (const field of SERVER_FIELDS) delete merged[field];
  merged.isPreferred ??= false;
  merged.isClientCredsBody ??= false;
  if (existing) merged.clientAuthType ??= existing.clientAuthType ?? 'client_secret';
  for (const [key, value] of Object.entries(merged)) {
    if (value === null || value === undefined || value === REDACTED) delete merged[key];
  }
  return merged as IdentityProviderRequest;
}

/**
 * Print IDP details.
 */
export function printIdp(idp: IdentityProvider): void {
  const ui = cliui({width: process.stdout.columns || 80});
  const labelWidth = 18;
  const rows: [string, unknown][] = [
    ['Name:', idp.name],
    ['Provider:', idp.idpOrigin],
    ['Preferred:', idp.isPreferred],
    ['Client ID:', idp.clientId],
    ['Client Secret:', idp.clientSecret],
    ['Client Auth:', idp.clientAuthType],
    ['Creds in Body:', idp.isClientCredsBody],
    ['Scopes:', idp.scopes?.join(' ')],
    ['Redirect URL:', idp.redirectUrl],
    ['Well-known URL:', idp.wellKnownUrl],
    ['Use Well-known:', idp.useWellKnown],
    ['Auth URL:', idp.authUrl],
    ['Token URL:', idp.tokenUrl],
    ['Token Info URL:', idp.tokenInfoUrl],
    ['User Info URL:', idp.userInfoUrl],
    ['Merge Claims:', idp.loginMergeClaims?.join(', ')],
    ['Claim Mapper:', idp.oidcClaimMapper?.join('\n')],
    ['Apple Team ID:', idp.teamId],
    ['Apple Key ID:', idp.keyId],
  ];
  ui.div('');
  for (const [label, value] of rows) {
    if (value !== undefined && value !== null && value !== '') {
      ui.div({text: label, width: labelWidth}, {text: String(value)});
    }
  }
  ux.stdout(ui.toString());
}
