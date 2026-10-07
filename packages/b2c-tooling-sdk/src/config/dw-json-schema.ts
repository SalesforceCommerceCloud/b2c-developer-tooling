/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * JSON Schema for `dw.json` configuration files.
 *
 * This module is the single source of truth for the published schema at
 * `data/schemas/dw.schema.json` (regenerate with `pnpm run generate:dw-json-schema`).
 * Editors use it for validation, completion, and hover docs; the VS Code
 * extension registers it for every `dw.json`.
 *
 * `dw.json` accepts both kebab-case (canonical) and camelCase spellings, plus a
 * few legacy aliases (see {@link CONFIG_KEY_ALIASES}). The schema lists every
 * accepted spelling so editors do not flag valid files. Unknown keys are allowed
 * because other tools share `dw.json`.
 *
 * @module config/dw-json-schema
 */
import {CLIENT_AUTH_METHODS} from '../auth/client-credentials.js';
import {CONFIG_KEY_ALIASES, kebabToCamelCase} from './mapping.js';

/** A JSON Schema fragment (draft-07 subset). */
export type JsonSchema = Record<string, unknown>;

/** Public URL of the published schema (usable as `"$schema"` in dw.json). */
export const DW_JSON_SCHEMA_URL =
  'https://salesforcecommercecloud.github.io/b2c-developer-tooling/schemas/dw.schema.json';

const DOCS_URL = 'https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html';

const stringArray: JsonSchema = {type: 'array', items: {type: 'string'}};

const AUTH_METHODS = ['client-credentials', 'jwt', 'user', 'implicit', 'basic', 'api-key'];

/**
 * Canonical instance-level fields keyed by kebab-case name (the on-disk spelling).
 * Descriptions mirror the Settings Reference in the configuration guide.
 */
export const DW_JSON_FIELDS: Record<string, JsonSchema> = {
  // Instance and site
  name: {type: 'string', description: 'Connection name for instance selection (`--instance` / `SFCC_INSTANCE`).'},
  active: {type: 'boolean', description: 'Use this entry as the default instance.'},
  hostname: {
    type: 'string',
    description:
      'Instance hostname, without a URL path (e.g. `abcd-001.dx.commercecloud.salesforce.com`). Env: `SFCC_SERVER`.',
  },
  'webdav-hostname': {type: 'string', description: 'Separate WebDAV hostname. Env: `SFCC_WEBDAV_SERVER`.'},
  'code-version': {
    type: 'string',
    description: 'Default code version for operations that accept one. Env: `SFCC_CODE_VERSION`.',
  },
  'short-code': {type: 'string', description: 'SCAPI short code. Env: `SFCC_SHORTCODE`.'},
  'tenant-id': {
    type: 'string',
    description: 'Tenant or organization ID, such as `abcd_001` or `f_ecom_abcd_001`. Env: `SFCC_TENANT_ID`.',
  },
  'site-id': {
    type: 'string',
    description: 'Default site/channel ID for supported site and shopper operations. Env: `SFCC_SITE_ID`.',
  },
  'api-backend': {
    type: 'string',
    enum: ['auto', 'scapi', 'ocapi'],
    description:
      'API backend for operations supporting both SCAPI and OCAPI. `auto` (default) prefers SCAPI with OCAPI fallback. Env: `SFCC_API_BACKEND`.',
  },

  // Administrative authentication
  'client-id': {type: 'string', description: 'Account Manager API client ID. Env: `SFCC_CLIENT_ID`.'},
  'client-secret': {type: 'string', description: 'Account Manager client secret. Env: `SFCC_CLIENT_SECRET`.'},
  'oauth-scopes': {
    ...stringArray,
    description:
      'Requested OAuth scopes. Scope grants must be configured on the API client. Env: `SFCC_OAUTH_SCOPES` (comma-separated).',
  },
  'jwt-cert-path': {
    type: 'string',
    description: 'PEM certificate path for JWT authentication. Env: `SFCC_JWT_CERT`; flag: `--jwt-cert`.',
  },
  'jwt-key-path': {type: 'string', description: 'PEM private key path for JWT authentication. Env: `SFCC_JWT_KEY`.'},
  'jwt-passphrase': {
    type: 'string',
    description: 'Passphrase for an encrypted JWT private key. Env: `SFCC_JWT_PASSPHRASE`.',
  },
  'auth-methods': {
    type: 'array',
    items: {type: 'string', enum: AUTH_METHODS},
    uniqueItems: true,
    description:
      'Ordered list of allowed authentication methods. Do not combine with `user-auth`. Env: `SFCC_AUTH_METHODS` (comma-separated).',
  },
  'user-auth': {
    type: 'boolean',
    description: 'Shorthand for `"auth-methods": ["user"]` (browser login). Do not combine with `auth-methods`.',
  },
  'account-manager-host': {
    type: 'string',
    description: 'Account Manager hostname override. Env: `SFCC_ACCOUNT_MANAGER_HOST`.',
  },
  'client-auth-method': {
    type: 'string',
    enum: [...CLIENT_AUTH_METHODS],
    description:
      'How client credentials are sent to Account Manager (default `basic`). Env: `SFCC_CLIENT_AUTH_METHOD`; flag: `--client-auth-method`.',
  },

  // Shopper authentication
  'slas-client-id': {
    type: 'string',
    description: 'Shopper Login and API Access Service (SLAS) client ID. Env: `SFCC_SLAS_CLIENT_ID`.',
  },
  'slas-client-secret': {
    type: 'string',
    description: 'Secret for a private SLAS client; omit for public clients. Env: `SFCC_SLAS_CLIENT_SECRET`.',
  },

  // WebDAV and certificates
  username: {
    type: 'string',
    description: 'Business Manager username (typically an email address) for WebDAV. Env: `SFCC_USERNAME`.',
  },
  password: {type: 'string', description: 'WebDAV access key for `username`. Env: `SFCC_PASSWORD`.'},
  certificate: {
    type: 'string',
    description: 'Path to a PKCS12 (`.p12` / `.pfx`) client certificate for mTLS. Env: `SFCC_CERTIFICATE`.',
  },
  'certificate-passphrase': {
    type: 'string',
    description: 'Client certificate passphrase. Env: `SFCC_CERTIFICATE_PASSPHRASE`.',
  },
  'self-signed': {
    type: 'boolean',
    description:
      'Disable server certificate verification (default `false`). Not required just because you use mTLS. Env: `SFCC_SELFSIGNED`.',
  },

  // Code, content, and documentation
  cartridges: {
    oneOf: [stringArray, {type: 'string'}],
    description:
      'Cartridge names for deploy/watch filtering and IDE discovery. Array, or a colon/comma-separated string. Env: `SFCC_CARTRIDGES`.',
  },
  'auto-upload': {type: 'boolean', description: 'Automatically upload code changes from the VS Code extension.'},
  'content-library': {type: 'string', description: 'Default library for content list/export.'},
  catalogs: {...stringArray, description: 'Catalog IDs for WebDAV browsing. Env: `SFCC_CATALOGS`.'},
  libraries: {
    type: 'array',
    items: {
      oneOf: [
        {type: 'string'},
        {
          type: 'object',
          required: ['id'],
          properties: {
            id: {type: 'string', description: 'Library ID.'},
            siteLibrary: {type: 'boolean', description: 'Whether this is a site-private library.'},
          },
        },
      ],
    },
    description:
      'Content library IDs, as strings or `{"id": "RefArch", "siteLibrary": true}` entries. Env: `SFCC_LIBRARIES`.',
  },
  'asset-query': {
    ...stringArray,
    description:
      'JSON dot-paths for finding static asset URLs in content (default `["image.path"]`). Env: `SFCC_ASSET_QUERY`.',
  },
  'import-set-exclude': {
    ...stringArray,
    description:
      'Project-relative directories to exclude recursively from import-set discovery. Env: `SFCC_IMPORT_SET_EXCLUDE`.',
  },
  'docs-categories': {
    ...stringArray,
    description: 'Documentation category allowlist for supported searches. Env: `SFCC_DOCS_CATEGORIES`.',
  },
  'scapi-schemas': {
    ...stringArray,
    description:
      'Local SCAPI OpenAPI JSON files or directories (relative to the project directory), or http(s) URLs, for MCP code mode. Env: `SFCC_SCAPI_SCHEMAS`.',
  },

  // Sandboxes and analytics
  realm: {type: 'string', description: 'Default realm for sandbox operations.'},
  'sandbox-api-host': {
    type: 'string',
    description: 'On-Demand Sandbox API hostname override. Env: `SFCC_SANDBOX_API_HOST`.',
  },
  'cip-host': {type: 'string', description: 'CIP analytics host override. Env: `SFCC_CIP_HOST`.'},
  safety: {
    type: 'object',
    description: 'Per-instance safety restrictions and confirmation rules. See the Safety Mode guide.',
    additionalProperties: false,
    properties: {
      level: {
        type: 'string',
        enum: ['NONE', 'NO_DELETE', 'NO_UPDATE', 'READ_ONLY'],
        description: 'Baseline restriction level. Env: `SFCC_SAFETY_LEVEL`.',
      },
      confirm: {
        type: 'boolean',
        description: 'Require interactive confirmation for blocked operations instead of refusing them.',
      },
      rules: {
        type: 'array',
        description: 'Ordered rules; the first match wins.',
        items: {
          type: 'object',
          required: ['action'],
          additionalProperties: false,
          properties: {
            method: {type: 'string', description: 'HTTP method pattern (e.g. `POST`, `DELETE`).'},
            path: {type: 'string', description: 'URL path glob (e.g. `/jobs/*/executions`).'},
            job: {type: 'string', description: 'Job ID glob.'},
            command: {type: 'string', description: 'CLI command ID glob (e.g. `sandbox:*`, `ecdn:cache:purge`).'},
            action: {type: 'string', enum: ['allow', 'block', 'confirm'], description: 'Action when the rule matches.'},
          },
        },
      },
    },
  },

  // Managed Runtime
  'mrt-api-key': {type: 'string', description: 'Managed Runtime API key. Env: `MRT_API_KEY`.'},
  'mrt-project': {
    type: 'string',
    description: 'Managed Runtime project slug (storefront ID for SCAPI MRT operations). Env: `MRT_PROJECT`.',
  },
  'mrt-environment': {type: 'string', description: 'Managed Runtime target environment. Env: `MRT_ENVIRONMENT`.'},
  'mrt-origin': {type: 'string', description: 'Managed Runtime API origin override. Env: `MRT_CLOUD_ORIGIN`.'},
  'mrt-backend': {
    type: 'string',
    enum: ['auto', 'legacy', 'scapi'],
    description: 'Managed Runtime backend for supported operations (default `auto`). Env: `MRT_BACKEND`.',
  },
};

/** Legacy and alternate spellings, excluding simple camelCase forms. */
function aliasesFor(camelKey: string): string[] {
  return Object.entries(CONFIG_KEY_ALIASES)
    .filter(([, canonical]) => canonical === camelKey)
    .map(([alias]) => alias);
}

/**
 * Builds the `dw.json` JSON Schema from {@link DW_JSON_FIELDS}, adding the
 * camelCase spelling and legacy aliases for every field.
 */
export function buildDwJsonSchema(): JsonSchema {
  const instanceProperties: Record<string, JsonSchema> = {};
  for (const [kebab, schema] of Object.entries(DW_JSON_FIELDS)) {
    instanceProperties[kebab] = schema;
    const camel = kebabToCamelCase(kebab);
    const alternates = [camel, ...aliasesFor(camel)].filter((k) => k !== kebab);
    for (const alternate of alternates) {
      instanceProperties[alternate] ??= {
        ...schema,
        description: `Alternate spelling of \`${kebab}\`. ${String(schema.description ?? '')}`.trim(),
      };
    }
  }

  const instanceSchema: JsonSchema = {
    type: 'object',
    properties: instanceProperties,
    additionalProperties: true,
    not: {
      anyOf: [
        {required: ['user-auth', 'auth-methods']},
        {required: ['userAuth', 'authMethods']},
        {required: ['user-auth', 'authMethods']},
        {required: ['userAuth', 'auth-methods']},
      ],
    },
  };

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: DW_JSON_SCHEMA_URL,
    title: 'B2C Commerce dw.json',
    description: `Connection and project configuration for B2C Commerce tooling. See ${DOCS_URL}`,
    definitions: {instance: instanceSchema},
    allOf: [{$ref: '#/definitions/instance'}],
    type: 'object',
    properties: {
      $schema: {type: 'string', description: 'JSON Schema reference for editor support.'},
      configs: {
        type: 'array',
        description: 'Named instance entries. Select one with `--instance` / `SFCC_INSTANCE`, or mark one `active`.',
        items: {$ref: '#/definitions/instance'},
      },
    },
  };
}
