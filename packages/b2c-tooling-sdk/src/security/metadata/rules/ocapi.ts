/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {defineMetadataRule, jsonKeyLines, type MetadataDocument} from '../types.js';

/** The client ID used in OCAPI documentation, tutorials, and sample site data. */
export const DEMO_CLIENT_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

interface OcapiResource {
  resource_id?: unknown;
  methods?: unknown;
}

interface OcapiClient {
  client_id?: unknown;
  allowed_origins?: unknown;
  resources?: OcapiResource[];
}

function clients(document: MetadataDocument): OcapiClient[] {
  if (document.kind !== 'ocapi-settings') return [];
  const list = (document.data as {clients?: unknown})?.clients;
  return Array.isArray(list) ? (list as OcapiClient[]) : [];
}

/** `Shop API`, `Data API`, or `OCAPI` from the settings file name (wapi_shop_config.json, wapi_data_config.json). */
function apiName(file: string): string {
  if (/shop/i.test(file)) return 'Shop API';
  if (/data/i.test(file)) return 'Data API';
  return 'OCAPI';
}

export const ocapiDemoClientId = defineMetadataRule({
  id: 'ocapi-demo-client-id',
  severity: 'high',
  confidence: 'high',
  category: 'config',
  cwe: ['CWE-1188', 'CWE-798'],
  description: `OCAPI settings that grant access to the demo client ID ${DEMO_CLIENT_ID}, which appears in documentation, tutorials, and sample site data.`,
  remediation:
    'Create a dedicated API client in Account Manager for each integration, grant it only the resources it needs, and remove the demo client ID from OCAPI settings on every instance.',
  kinds: ['ocapi-settings'],
  check(document, report) {
    const lines = jsonKeyLines(document.text, 'client_id', DEMO_CLIENT_ID);
    let occurrence = 0;
    for (const client of clients(document)) {
      if (client.client_id !== DEMO_CLIENT_ID) continue;
      const count = Array.isArray(client.resources) ? client.resources.length : 0;
      report({
        line: lines[occurrence++] ?? 1,
        message: `${apiName(document.file)} settings grant the demo client ID ${DEMO_CLIENT_ID} access to ${count} resource(s). Anyone who has seen the sample data knows this ID.`,
      });
    }
  },
});

const LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

export const ocapiBroadAccess = defineMetadataRule({
  id: 'ocapi-broad-access',
  severity: 'medium',
  confidence: 'medium',
  category: 'authz',
  cwe: ['CWE-284', 'CWE-942'],
  description:
    'OCAPI settings that grant a client every resource (resource_id "/**" or "/*"), or allow any origin ("*") or plain http:// origins for cross-origin requests.',
  remediation:
    'List the specific resources and methods each client needs, and allow only the HTTPS origins of your own storefronts.',
  kinds: ['ocapi-settings'],
  check(document, report) {
    const wildcardLines = jsonKeyLines(document.text, 'resource_id', (raw) => raw === '"/**"' || raw === '"/*"');
    let wildcard = 0;
    const originLines = jsonKeyLines(document.text, 'allowed_origins');
    let origin = 0;
    for (const client of clients(document)) {
      for (const resource of client.resources ?? []) {
        if (resource.resource_id === '/**' || resource.resource_id === '/*') {
          report({
            line: wildcardLines[wildcard++] ?? 1,
            message: `${apiName(document.file)} client ${String(client.client_id)} is granted every resource (resource_id "${String(resource.resource_id)}").`,
          });
        }
      }
      if (client.allowed_origins === undefined) continue;
      const line = originLines[origin++] ?? 1;
      const origins = Array.isArray(client.allowed_origins) ? client.allowed_origins.map(String) : [];
      if (origins.includes('*')) {
        report({
          line,
          message: `${apiName(document.file)} client ${String(client.client_id)} allows cross-origin requests from any origin ("*").`,
        });
      }
      const insecure = origins.filter((o) => o.startsWith('http://') && !LOCALHOST.test(o));
      if (insecure.length > 0) {
        report({
          line,
          message: `${apiName(document.file)} client ${String(client.client_id)} allows plain http:// origins: ${insecure.join(', ')}.`,
        });
      }
    }
  },
});
