/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {ScapiUserAuthUnsupportedError} from '../clients/scapi-backend-utils.js';
import {resolveScapiReference, SCAPI_METHODS, type ApiDocument, type ScapiSchemaDocument} from './catalog.js';

export type ScapiAuthType = 'admin' | 'shopper' | 'unknown';
export interface ScapiAuthInfo {
  types: ScapiAuthType[];
  schemes: string[];
  executable: boolean;
}

/** Identify supported authentication per operation, including mixed Admin/Shopper contracts. */
export function getScapiAuthInfo(document: ScapiSchemaDocument, operation: ApiDocument): ScapiAuthInfo {
  const security: ApiDocument[] = operation.security ?? document.schema.security ?? [];
  const schemes = [...new Set(security.flatMap((requirement) => Object.keys(requirement)))];
  const types = new Set<ScapiAuthType>();
  for (const scheme of schemes) {
    if (scheme === 'AmOAuth2' || (scheme === 'BearerToken' && document.entry.id === 'shopper/auth-admin/v1'))
      types.add('admin');
    else if (/^(Shopper|RegisteredShopper)/.test(scheme)) types.add('shopper');
    else types.add('unknown');
  }
  // OAuth endpoints can declare credentials in grant parameters instead of security schemes.
  if (!types.size) types.add(document.entry.id === 'shopper/auth/v1' ? 'shopper' : 'unknown');
  const admin = security.some(
    (requirement) => Array.isArray(requirement.AmOAuth2) && Object.keys(requirement).length === 1,
  );
  const body = operation.requestBody && resolveScapiReference(operation.requestBody, document.schema);
  return {
    types: [...types].sort(),
    schemes,
    executable: admin && (!body?.required || Boolean(body.content?.['application/json'])),
  };
}

/** Add discovery metadata and filter operations without modifying the bundled source documents. */
export function describeScapiSchemas(
  documents: ScapiSchemaDocument[],
  authType?: ScapiAuthType,
): ScapiSchemaDocument[] {
  return documents.flatMap((document) => {
    const paths: ApiDocument = {};
    const authTypes = new Set<ScapiAuthType>();
    for (const [path, item] of Object.entries(document.schema.paths) as [string, ApiDocument][]) {
      const selected: ApiDocument = {...item};
      let count = 0;
      for (const method of SCAPI_METHODS) {
        if (!item[method]) continue;
        const auth = getScapiAuthInfo(document, item[method]);
        if (authType && !auth.types.includes(authType)) {
          delete selected[method];
          continue;
        }
        selected[method] = {...item[method], auth};
        for (const type of auth.types) authTypes.add(type);
        count++;
      }
      if (count) paths[path] = selected;
    }
    return Object.keys(paths).length
      ? [
          {
            ...document,
            entry: {...document.entry, authTypes: [...authTypes].sort()},
            schema: {...document.schema, paths},
          },
        ]
      : [];
  });
}

export interface ScapiAuthDiagnostic {
  code: string;
  message: string;
}

interface AuthContext {
  operationId: string;
  api: string;
  tenantScope: string;
  candidates: string[][];
}

function scopeAdvice(context: AuthContext): string {
  const choices = context.candidates.map((candidate) => candidate.join(' + ')).join(' OR ');
  return (
    `Account Manager client grants: ${choices}; tenant scope: ${context.tenantScope}. ` +
    'Operation scopes are requested automatically; also check any extra configured scopes and instance access.'
  );
}

/** Enrich known OAuth failures; leave network and unrelated errors intact. */
export function scapiAuthError(error: unknown, context: AuthContext): unknown {
  const message = error instanceof Error ? error.message : String(error);
  const target = `${context.operationId} (${context.api})`;
  let diagnostic: ScapiAuthDiagnostic | undefined;
  if (/\binvalid_scope\b|\binsufficient_scope\b/i.test(message))
    diagnostic = {
      code: 'SCAPI_SCOPE_MISSING',
      message: `Admin authentication rejected scopes for ${target}. ${scopeAdvice(context)}`,
    };
  else if (/OAuth requires clientId/.test(message))
    diagnostic = {
      code: 'SCAPI_ADMIN_CONFIG_MISSING',
      message: `${target} requires an Account Manager clientId and Admin credentials (clientSecret or configured JWT strategy). Inspect resolved configuration with secrets masked; slasClientId is for Shopper authentication.`,
    };
  else if (error instanceof ScapiUserAuthUnsupportedError)
    diagnostic = {
      code: 'SCAPI_ADMIN_AUTH_UNSUPPORTED',
      message: `${target} cannot use browser user authentication. Configure Account Manager client credentials or a supported JWT strategy. Inspect resolved configuration with secrets masked.`,
    };
  else if (
    /\binvalid_client\b|\bunauthorized_client\b|(?:authentication failed|Failed to get access token).*401/i.test(
      message,
    )
  )
    diagnostic = {
      code: 'SCAPI_ADMIN_CREDENTIALS_REJECTED',
      message: `Account Manager rejected credentials for ${target}. Check clientId, clientSecret or JWT setup, client enablement, and Account Manager host. Use Admin credentials, not a SLAS Shopper client.`,
    };
  return diagnostic ? new Error(`${diagnostic.code}: ${diagnostic.message}`, {cause: error}) : error;
}

/** HTTP status alone cannot prove that a grant is missing. Keep the original status and body. */
export function scapiAuthResponse(status: number, context: AuthContext): ScapiAuthDiagnostic | undefined {
  if (status === 401)
    return {
      code: 'SCAPI_UNAUTHORIZED',
      message: `${context.operationId}: API rejected the Admin token. Check token validity and the resolved tenant. ${scopeAdvice(context)}`,
    };
  if (status === 403)
    return {
      code: 'SCAPI_FORBIDDEN',
      message: `${context.operationId}: access denied; a 403 alone does not identify the missing permission. ${scopeAdvice(context)}`,
    };
}

export function unsupportedScapiAuth(document: ScapiSchemaDocument, operation: ApiDocument): Error {
  const auth = getScapiAuthInfo(document, operation);
  const target = `${operation.operationId} (${document.entry.id})`;
  const schemes = auth.schemes.join(' OR ') || 'OAuth grant parameters';
  if (document.entry.id === 'shopper/auth-admin/v1')
    return new Error(
      `SCAPI_AUTH_UNSUPPORTED: ${target} requires SLAS administration authentication and its declared admin roles. This executor supports AmOAuth2 only; use the SLAS administration CLI/SDK. A SLAS Shopper client is not an admin credential.`,
    );
  if (auth.types.includes('shopper'))
    return new Error(
      `SCAPI_SHOPPER_AUTH_UNSUPPORTED: ${target} requires ${schemes}. Shopper execution is not supported by this executor yet. Use a Shopper client/SDK with SLAS authentication (slasClientId, siteId, and the required token flow; slasClientSecret for private clients). Follow the operation's security scopes. Adding SLAS settings will not enable this executor; do not substitute Account Manager credentials.`,
    );
  return new Error(
    `SCAPI_AUTH_UNSUPPORTED: ${target} declares ${schemes}; this executor supports AmOAuth2 only. Inspect the operation's security requirements before choosing a client.`,
  );
}
