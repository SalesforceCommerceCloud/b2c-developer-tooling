#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 *
 * Auth-free structural validation for a dw.json file.
 *
 * Checks:
 *   - File is valid JSON
 *   - Known keys only (camelCase canonical or recognized kebab-case / legacy aliases)
 *   - hostname present
 *   - At least one complete auth method (WebDAV basic, OAuth, or mTLS cert)
 *   - If `configs` array is present, each entry passes the same checks
 *
 * Does NOT contact any instance. Does NOT require credentials. Pure local lint.
 *
 * Usage:
 *   node validate.mjs <path-to-dw.json>
 *   node validate.mjs                     # defaults to ./dw.json
 *
 * Exits 0 on valid, 1 on validation errors, 2 on file/parse errors.
 */

import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';

const KNOWN_KEYS = new Set([
  'name',
  'active',
  'hostname',
  'codeVersion',
  'username',
  'password',
  'clientId',
  'clientSecret',
  'oauthScopes',
  'slasClientId',
  'slasClientSecret',
  'siteId',
  'shortCode',
  'webdavHostname',
  'authMethods',
  'accountManagerHost',
  'mrtProject',
  'mrtEnvironment',
  'mrtApiKey',
  'mrtOrigin',
  'tenantId',
  'sandboxApiHost',
  'realm',
  'cartridges',
  'contentLibrary',
  'catalogs',
  'libraries',
  'cipHost',
  'certificate',
  'certificatePassphrase',
  'selfSigned',
  'safety',
  'configs',
]);

// Accepted kebab-case / legacy forms — presence is OK, mirrors normalizeConfigKeys.
const ACCEPTED_ALIASES = new Set([
  'code-version',
  'client-id',
  'client-secret',
  'oauth-scopes',
  'slas-client-id',
  'slas-client-secret',
  'site-id',
  'short-code',
  'scapi-shortcode',
  'webdav-hostname',
  'auth-methods',
  'account-manager-host',
  'mrt-project',
  'mrt-environment',
  'mrt-api-key',
  'mrt-origin',
  'cloud-origin',
  'tenant-id',
  'sandbox-api-host',
  'content-library',
  'cip-host',
  'self-signed',
  'selfsigned',
  'certificate-passphrase',
  'passphrase',
  'server',
  'secure-hostname',
  'secureHostname',
]);

const errors = [];
const warnings = [];

function validateEntry(entry, label) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    errors.push(`${label}: not an object`);
    return;
  }

  for (const key of Object.keys(entry)) {
    if (!KNOWN_KEYS.has(key) && !ACCEPTED_ALIASES.has(key)) {
      warnings.push(`${label}: unknown key "${key}"`);
    }
  }

  // hostname required (but note `server` is a legacy alias, so accept either)
  if (!entry.hostname && !entry.server) {
    errors.push(`${label}: missing required "hostname"`);
  }

  // at least one full auth method
  const hasBasic = !!(entry.username && entry.password);
  const hasOAuth = !!(entry['client-id'] ?? entry.clientId) && !!(entry['client-secret'] ?? entry.clientSecret);
  const hasCert = !!entry.certificate;
  if (!hasBasic && !hasOAuth && !hasCert) {
    errors.push(
      `${label}: no complete auth method. Provide one of: username+password, clientId+clientSecret, or certificate.`,
    );
  }
}

const filePath = resolve(process.argv[2] ?? 'dw.json');

if (!existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(2);
}

let parsed;
try {
  parsed = JSON.parse(readFileSync(filePath, 'utf8'));
} catch (err) {
  console.error(`Invalid JSON in ${filePath}: ${err.message}`);
  process.exit(2);
}

if (Array.isArray(parsed.configs)) {
  parsed.configs.forEach((cfg, i) => {
    validateEntry(cfg, `configs[${i}]${cfg.name ? ` (${cfg.name})` : ''}`);
  });
  // Top-level may also have hostname/credentials as defaults — validate loosely
  const topKeys = Object.keys(parsed).filter((k) => k !== 'configs');
  for (const key of topKeys) {
    if (!KNOWN_KEYS.has(key) && !ACCEPTED_ALIASES.has(key)) {
      warnings.push(`top-level: unknown key "${key}"`);
    }
  }
} else {
  validateEntry(parsed, 'dw.json');
}

for (const w of warnings) console.warn(`WARN  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}
console.log(`OK — ${filePath} passed structural validation (${warnings.length} warning(s)).`);
process.exit(0);
