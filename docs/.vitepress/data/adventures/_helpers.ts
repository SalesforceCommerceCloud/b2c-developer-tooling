// Builders shared by adventure synthesizers. Compose these instead of
// hand-writing JSON or anchor strings so the output stays consistent and the
// anchor checker can validate every link.

import type {ChecklistItem, DocAnchor} from './_types.js';

export interface DwJsonInput {
  hostname?: boolean | string; // true => placeholder
  username?: boolean | string;
  password?: boolean | string;
  clientId?: boolean | string;
  clientSecret?: boolean | string;
  codeVersion?: boolean | string;
  shortCode?: boolean | string;
  tenantId?: boolean | string;
  realm?: boolean | string;
  contentLibrary?: boolean | string;
  libraries?: string[];
  comment?: string;
}

const PLACEHOLDERS: Record<keyof Omit<DwJsonInput, 'libraries' | 'comment'>, string> = {
  hostname: '<INSTANCE>.dx.commercecloud.salesforce.com',
  username: '<BM_USERNAME>',
  password: '<WEBDAV_ACCESS_KEY>',
  clientId: '<CLIENT_ID>',
  clientSecret: '<CLIENT_SECRET>',
  codeVersion: 'version1',
  shortCode: '<SCAPI_SHORT_CODE>',
  tenantId: '<TENANT_ID>',
  realm: '<REALM_ID>',
  contentLibrary: '<LIBRARY_ID>',
};

// Order matters: render fields in a stable, scannable order.
const FIELD_ORDER: (keyof typeof PLACEHOLDERS)[] = [
  'hostname',
  'codeVersion',
  'username',
  'password',
  'clientId',
  'clientSecret',
  'shortCode',
  'tenantId',
  'realm',
  'contentLibrary',
];

const KEY_FOR: Record<keyof typeof PLACEHOLDERS, string> = {
  hostname: 'hostname',
  username: 'username',
  password: 'password',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  codeVersion: 'code-version',
  shortCode: 'short-code',
  tenantId: 'tenant-id',
  realm: 'realm',
  contentLibrary: 'content-library',
};

export function dwJson(input: DwJsonInput): string {
  const lines: string[] = ['{'];
  const entries: string[] = [];
  for (const field of FIELD_ORDER) {
    const value = input[field];
    if (value === undefined || value === false) continue;
    const rendered = value === true ? PLACEHOLDERS[field] : (value as string);
    entries.push(`  "${KEY_FOR[field]}": "${rendered}"`);
  }
  if (input.libraries && input.libraries.length > 0) {
    const arr = input.libraries.map((id) => `"${id}"`).join(', ');
    entries.push(`  "libraries": [${arr}]`);
  }
  lines.push(entries.join(',\n'));
  lines.push('}');
  return lines.join('\n');
}

export function envFile(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

export function link(path: string, hash: string | undefined, label: string): DocAnchor {
  return {path, hash, label};
}

export function check(text: string, href: DocAnchor): ChecklistItem {
  return {text, href};
}

// OCAPI Data API resource snippets, keyed by feature. Authors compose these
// into a single Business-Manager-ready JSON in synthesizers.
interface OcapiResource {
  resource_id: string;
  methods: string[];
}

export const OCAPI_RESOURCES: Record<string, OcapiResource[]> = {
  codeVersions: [
    {resource_id: '/code_versions', methods: ['get']},
    {resource_id: '/code_versions/*', methods: ['get', 'put', 'patch', 'delete']},
  ],
  jobs: [
    {resource_id: '/jobs/*/executions', methods: ['post']},
    {resource_id: '/jobs/*/executions/*', methods: ['get']},
    {resource_id: '/job_execution_search', methods: ['post']},
  ],
  sites: [
    {resource_id: '/sites', methods: ['get']},
    {resource_id: '/sites/*', methods: ['get']},
  ],
  // Cartridge-path mutations on a site (used by `b2c sites cartridges
  // add/remove/set`). Source: docs/cli/sites.md "Required OCAPI Permissions".
  siteCartridges: [{resource_id: '/sites/*/cartridges', methods: ['post', 'put', 'delete']}],
};

export type OcapiFeature = 'codeVersions' | 'jobs' | 'siteCartridges' | 'sites';

export function ocapiConfig(clientId: string, features: OcapiFeature[]): string {
  const resources: OcapiResource[] = features.flatMap((f) => OCAPI_RESOURCES[f] ?? []);
  const body = {
    _v: '24.5',
    clients: [
      {
        client_id: clientId,
        resources: resources.map((r) => ({
          ...r,
          read_attributes: '(**)',
          write_attributes: '(**)',
        })),
      },
    ],
  };
  return JSON.stringify(body, null, 2);
}

// Centralised list of OAuth scopes by purpose. Synthesizers pick from these.
export const SCOPE_BUNDLES = {
  baseline: ['mail', 'roles', 'tenantFilter', 'openid'],
  scapiSchemas: ['sfcc.scapi-schemas'],
  scapiCustomApis: ['sfcc.custom-apis'],
  ecdnRead: ['sfcc.cdn-zones'],
  ecdnWrite: ['sfcc.cdn-zones.rw'],
  // Required by `b2c scapi replications` — the SDK client requests this
  // explicitly. Source: packages/b2c-tooling-sdk/src/clients/granular-replications.ts
  replicationsRw: ['sfcc.granular-replications.rw'],
} as const;

export function scopes(...bundles: (keyof typeof SCOPE_BUNDLES)[]): string {
  const out = new Set<string>();
  for (const b of bundles) for (const s of SCOPE_BUNDLES[b]) out.add(s);
  return Array.from(out).join(' ');
}
