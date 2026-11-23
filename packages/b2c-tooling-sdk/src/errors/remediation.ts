/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Remediation hints for authentication and permission failures.
 *
 * Many command and tool failures are configuration problems that only an
 * administrator can fix (a missing Account Manager scope, a WebDAV Client
 * Permissions entry, a wrong secret). Retrying never helps. This module
 * recognizes those failures from the error text and names the fix, plus a
 * documentation page that explains it, so a person or an AI agent can act on
 * it instead of retrying.
 *
 * Messages are matched by text rather than by type because errors cross
 * package boundaries (CLI, MCP, duplicate SDK copies) and are often re-wrapped
 * with a prefix.
 *
 * @module errors/remediation
 */

const DOCS_BASE_URL = 'https://salesforcecommercecloud.github.io/b2c-developer-tooling';

/** A page in the tooling docs index, readable with the MCP `docs_read` tool or `b2c docs read`. */
export interface RemediationDoc {
  /** Tooling docs index ID, e.g. `guide-authentication`. */
  id: string;
  /** Heading on that page that covers the fix. */
  heading: string;
  /** Heading ID: the `docs_read` section and the URL anchor. */
  section: string;
  /** Rendered page URL with the heading anchor. */
  url: string;
}

/** Recognized failure kinds. */
export type RemediationKind =
  | 'account-manager-client-rejected'
  | 'account-manager-scope-rejected'
  | 'account-manager-tenant-rejected'
  | 'ocapi-permission'
  | 'webdav-not-found'
  | 'webdav-unauthorized';

/** Fix for a recognized failure. */
export interface Remediation {
  kind: RemediationKind;
  /** What to change, in one or two sentences. Never contains secrets or request identifiers. */
  hint: string;
  doc: RemediationDoc;
}

function doc(id: string, page: string, heading: string, section: string): RemediationDoc {
  return {id, heading, section, url: `${DOCS_BASE_URL}/${page}.html#${section}`};
}

/** Documentation targets. Each must exist in the tooling docs index; a test checks the IDs and headings. */
export const REMEDIATION_DOCS = {
  scopes: doc('guide-authentication', 'guide/authentication', 'Scopes by Command', 'scopes-by-command'),
  apiClient: doc(
    'guide-authentication',
    'guide/authentication',
    'Account Manager API Client',
    'account-manager-api-client',
  ),
  ocapi: doc(
    'guide-authentication',
    'guide/authentication',
    'Configuring OCAPI in Business Manager',
    'configuring-ocapi-in-business-manager',
  ),
  webdav: doc('guide-authentication', 'guide/authentication', 'WebDAV Access', 'webdav-access'),
  webdavRoots: doc('cli-webdav', 'cli/webdav', 'Root Directory', 'root-directory'),
} satisfies Record<string, RemediationDoc>;

/** Error text that already explains the fix; adding a generic hint would only repeat or contradict it. */
const ALREADY_ADVISED =
  /WebDAV Client Permissions|Open Commerce API Settings|Account Manager client grants|Check the path and WebDAV permissions|functional permission|access key of that Business Manager user|SCAPI_[A-Z_]+:/;

const INVALID_TENANT_SCOPE = /\binvalid_scope\b.*\b(?:Unknown\/invalid tenant scope|tenant scope)\b/is;
const INVALID_SCOPE = /\binvalid_scope\b/;
const INVALID_CLIENT = /\binvalid_client\b|\bunauthorized_client\b|Client authentication failed/;
const OCAPI_NOT_ALLOWED = /Access to resource '[^']+' isn't allowed for the current client/;
const WEBDAV_STATUS = /\b(?:PROPFIND|GET|PUT|DELETE|MKCOL|MOVE|COPY) failed: (401|403|404)\b/;

/**
 * Recognizes an authentication or permission failure and describes the fix.
 *
 * @param error - Thrown error or message
 * @returns The remediation, or undefined when the failure is not recognized or
 *   the message already explains the fix
 *
 * @example
 * ```typescript
 * import {describeRemediation} from '@salesforce/b2c-tooling-sdk/errors';
 *
 * const remediation = describeRemediation(error);
 * if (remediation) console.error(`${remediation.hint} See ${remediation.doc.url}`);
 * ```
 */
export function describeRemediation(error: unknown): Remediation | undefined {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (!message || ALREADY_ADVISED.test(message)) return undefined;

  if (INVALID_TENANT_SCOPE.test(message)) {
    return {
      kind: 'account-manager-tenant-rejected',
      hint:
        'Account Manager rejected the tenant: check that tenant-id is the tenant (for example zzxy_prd), and that the ' +
        'API client has the Salesforce Commerce API role with this tenant in its tenant filter.',
      doc: REMEDIATION_DOCS.apiClient,
    };
  }

  if (INVALID_SCOPE.test(message)) {
    return {
      kind: 'account-manager-scope-rejected',
      hint:
        "Account Manager rejected a requested scope: add the sfcc.* scopes named in the error to the API client's " +
        'Default Scopes in Account Manager, and check that the client has the Salesforce Commerce API role for this ' +
        'tenant. Retrying without changing the client does not help.',
      doc: REMEDIATION_DOCS.scopes,
    };
  }

  if (INVALID_CLIENT.test(message)) {
    return {
      kind: 'account-manager-client-rejected',
      hint:
        'Account Manager rejected the API client credentials: check client-id and client-secret (or the JWT ' +
        'certificate), that the client is enabled, and the Account Manager host.',
      doc: REMEDIATION_DOCS.apiClient,
    };
  }

  if (OCAPI_NOT_ALLOWED.test(message)) {
    return {
      kind: 'ocapi-permission',
      hint:
        'The API client has no OCAPI Data API permission for this resource: add it for the client ID in Business ' +
        'Manager under Administration > Site Development > Open Commerce API Settings (type Data API, context ' +
        'Global), or configure SCAPI.',
      doc: REMEDIATION_DOCS.ocapi,
    };
  }

  const webdavStatus = message.match(WEBDAV_STATUS)?.[1];
  if (webdavStatus === '404') {
    return {
      kind: 'webdav-not-found',
      hint:
        'The WebDAV path does not exist. Paths start with a root such as Cartridges, Impex, Logs, Temp, Static, ' +
        'Catalogs, Libraries or Dynamic; list the parent folder to find the right name.',
      doc: REMEDIATION_DOCS.webdavRoots,
    };
  }
  if (webdavStatus) {
    return {
      kind: 'webdav-unauthorized',
      hint:
        'The instance refused the WebDAV credentials. For an API client, grant it this folder in Business Manager ' +
        'under Administration > Organization > WebDAV Client Permissions; for Basic auth, use a WebDAV File Access ' +
        'access key as the password. Retrying with the same credentials does not help.',
      doc: REMEDIATION_DOCS.webdav,
    };
  }

  return undefined;
}

/**
 * Appends a remediation hint and a documentation link, for people reading terminal output.
 *
 * @param message - Original error message
 * @returns The message with a hint appended, or unchanged when nothing is recognized
 */
export function withRemediationHint(message: string): string {
  const remediation = describeRemediation(message);
  if (!remediation) return message;
  return `${message}\n\n${remediation.hint}\nSee: ${remediation.doc.url}`;
}
