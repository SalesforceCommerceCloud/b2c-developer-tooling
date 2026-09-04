// Adventure: Configure SCAPI access (b2c scapi / b2c ecdn).

import {choice, defineAdventure, doc, md, step} from './_authoring.js';
import {check, dwJson, link, scopes} from './_helpers.js';
import type {AdventureState} from './_types.js';

type ScopeBundle = 'baseline' | 'ecdnRead' | 'ecdnWrite' | 'replicationsRw' | 'scapiCustomApis' | 'scapiSchemas';

function selectedSurfaces(state: AdventureState): string[] {
  const raw = state.surfaces;
  return Array.isArray(raw) ? raw : [];
}

function bundlesFor(surfaces: string[]): ScopeBundle[] {
  const out = new Set<ScopeBundle>(['baseline']);
  if (surfaces.includes('ecdn')) {
    out.add('ecdnRead');
    out.add('ecdnWrite');
  }
  if (surfaces.includes('schemas')) out.add('scapiSchemas');
  if (surfaces.includes('custom-apis')) out.add('scapiCustomApis');
  if (surfaces.includes('replications')) out.add('replicationsRw');
  return Array.from(out);
}

function pickVerifyCommand(surfaces: string[]): string {
  // Prefer the lightest read-only command for whichever surface was picked.
  // Replications has to come before schemas/custom because a replications-only
  // client won't have those scopes.
  if (surfaces.includes('ecdn')) return 'b2c ecdn zones list';
  if (surfaces.includes('replications')) return 'b2c scapi replications list';
  if (surfaces.includes('schemas')) return 'b2c scapi schemas list';
  if (surfaces.includes('custom-apis')) return 'b2c scapi custom status';
  return 'b2c auth client token';
}

export const scapiAccessAdventure = defineAdventure({
  id: 'scapi-access',
  title: 'Configure SCAPI access',
  tagline: 'Set up OAuth client + tenant for eCDN, Custom APIs, schemas, and replications.',
  icon: 'mdi:api',
  tags: ['scapi', 'oauth', 'ecdn', 'custom-apis', 'tenant-id'],
  priority: 'common',
  intro:
    "SCAPI commands authenticate via Account Manager OAuth with the Salesforce Commerce API role, a tenant filter, and one or more sfcc.* scopes. Pick the surfaces you'll use and the wizard will compute the right scope set and config snippet.",

  steps: [
    step('surfaces', {
      title: 'Which SCAPI surfaces will you use?',
      subtitle: 'Pick one or more — the wizard computes the union of required scopes.',
      multiSelect: true,
      minPicks: 1,
      doc: doc('/guide/authentication', 'scapi-authentication', 'SCAPI Authentication'),
      choices: [
        choice('ecdn', {
          title: 'eCDN',
          subtitle: 'b2c ecdn zones / cache / certificates',
          icon: 'mdi:cloud-outline',
          body: md`Manage Cloudflare-backed eCDN zones, cache purges, certificates, and WAF rules. Adds \`sfcc.cdn-zones\` and \`sfcc.cdn-zones.rw\`.`,
          contributes: {surfaces: ['ecdn']},
        }),
        choice('schemas', {
          title: 'SCAPI Schemas',
          subtitle: 'b2c scapi schemas list / get',
          icon: 'mdi:file-document-outline',
          body: md`Discover and inspect Shopper / Admin SCAPI OpenAPI schemas. Adds \`sfcc.scapi-schemas\`.`,
          contributes: {surfaces: ['schemas']},
        }),
        choice('custom-apis', {
          title: 'Custom APIs',
          subtitle: 'b2c scapi custom status',
          icon: 'mdi:application-braces-outline',
          body: md`Inspect Custom API endpoint registration status across sites. Adds \`sfcc.custom-apis\`.`,
          contributes: {surfaces: ['custom-apis']},
        }),
        choice('replications', {
          title: 'Replications',
          subtitle: 'b2c scapi replications',
          icon: 'mdi:database-sync-outline',
          body: md`Trigger and monitor granular replications (publish staging items to production) via SCAPI. Adds \`sfcc.granular-replications.rw\`.`,
          contributes: {surfaces: ['replications']},
        }),
      ],
    }),

    step('auth', {
      title: 'How will the API client authenticate?',
      doc: doc('/guide/authentication', 'account-manager-api-client', 'Account Manager API Client'),
      choices: [
        choice('client-credentials', {
          title: 'Client Credentials',
          subtitle: 'client_id + client_secret',
          icon: 'mdi:key-variant',
          badges: [{text: 'Recommended', tone: 'info'}],
          body: md`The typical setup — the API client has a Token Endpoint Auth Method of \`client_secret_post\` or \`client_secret_basic\`.`,
          contributes: {authMethod: 'client-credentials'},
        }),
        choice('jwt', {
          title: 'JWT Bearer',
          subtitle: 'Certificate-based',
          icon: 'mdi:certificate-outline',
          badges: [{text: 'Complex', tone: 'complex'}],
          body: md`Use a public/private cert pair instead of a client secret.`,
          contributes: {authMethod: 'jwt'},
        }),
      ],
    }),

    step('tenant', {
      title: 'Where will the CLI find your tenant-id?',
      subtitle: 'SCAPI requires a tenant-id (realm) on every request.',
      doc: doc('/guide/authentication', 'configuring-tenant-filter', 'Configuring Tenant Filter'),
      choices: [
        choice('dw-json', {
          title: 'dw.json (project root)',
          subtitle: 'Recommended',
          icon: 'mdi:file-cog-outline',
          body: md`Add \`"tenant-id": "<TENANT_ID>"\` to your project's \`dw.json\`.`,
          contributes: {tenantSource: 'dw-json'},
        }),
        choice('env', {
          title: 'Environment variable',
          subtitle: 'SFCC_TENANT_ID',
          icon: 'mdi:console-line',
          body: md`CI-friendly. The CLI auto-loads \`.env\` files.`,
          contributes: {tenantSource: 'env'},
        }),
        choice('flag', {
          title: 'Per-command flag',
          subtitle: '--tenant-id',
          icon: 'mdi:flag-outline',
          body: md`Pass \`--tenant-id zzxy_prd\` on each invocation. Useful for one-off scripts.`,
          contributes: {tenantSource: 'flag'},
        }),
      ],
    }),

    step('short-code', {
      title: 'Where will the CLI find your SCAPI short-code?',
      subtitle: 'Required for scapi schemas, scapi custom, and scapi replications.',
      showIf: (state: AdventureState) =>
        selectedSurfaces(state).some((s) => s === 'schemas' || s === 'custom-apis' || s === 'replications'),
      doc: doc('/guide/authentication', 'scapi-authentication', 'SCAPI Authentication'),
      choices: [
        choice('dw-json', {
          title: 'dw.json',
          subtitle: 'short-code key',
          icon: 'mdi:file-cog-outline',
          body: md`Add \`"short-code": "<SCAPI_SHORT_CODE>"\` to your project's \`dw.json\`.`,
          contributes: {shortCodeSource: 'dw-json'},
        }),
        choice('env', {
          title: 'Environment variable',
          subtitle: 'SFCC_SHORTCODE',
          icon: 'mdi:console-line',
          body: md`Set \`SFCC_SHORTCODE\` alongside your other SCAPI env vars.`,
          contributes: {shortCodeSource: 'env'},
        }),
        choice('flag', {
          title: 'Per-command flag',
          subtitle: '--short-code',
          icon: 'mdi:flag-outline',
          body: md`Pass \`--short-code kv7kzm78\` on each invocation.`,
          contributes: {shortCodeSource: 'flag'},
        }),
      ],
    }),
  ],

  synthesize(state) {
    const surfaces = selectedSurfaces(state);
    const isJwt = state.authMethod === 'jwt';
    const tenantSource = (state.tenantSource as string) || 'dw-json';
    const shortCodeSource = (state.shortCodeSource as string) || 'dw-json';
    const useEnv = tenantSource === 'env' || shortCodeSource === 'env';
    const needsShortCode = surfaces.some((s) => s === 'schemas' || s === 'custom-apis' || s === 'replications');

    const bundles = bundlesFor(surfaces);
    const computedScopes = scopes(...bundles);

    const dw = dwJson({
      clientId: true,
      clientSecret: !isJwt,
      tenantId: tenantSource === 'dw-json',
      shortCode: needsShortCode && shortCodeSource === 'dw-json',
    });

    const envLines = [
      'SFCC_CLIENT_ID=<CLIENT_ID>',
      isJwt ? 'SFCC_JWT_CERT=./cert.pem' : '',
      isJwt ? 'SFCC_JWT_KEY=./key.pem' : '',
      !isJwt ? 'SFCC_CLIENT_SECRET=<CLIENT_SECRET>' : '',
      tenantSource === 'env' ? 'SFCC_TENANT_ID=<TENANT_ID>' : '',
      needsShortCode && shortCodeSource === 'env' ? 'SFCC_SHORTCODE=<SCAPI_SHORT_CODE>' : '',
    ]
      .filter(Boolean)
      .join('\n');

    const surfaceLabels: Record<string, string> = {
      'custom-apis': 'Custom APIs (`b2c scapi custom`)',
      ecdn: 'eCDN (`b2c ecdn`)',
      replications: 'Replications (`b2c scapi replications`)',
      schemas: 'SCAPI Schemas (`b2c scapi schemas`)',
    };
    const surfaceList = surfaces.length > 0 ? surfaces.map((s) => surfaceLabels[s] ?? s).join(', ') : 'None selected';

    const checklist = [
      check(
        'Create an Account Manager API client and pick a Token Endpoint Auth Method',
        link('/guide/authentication', 'creating-an-api-client', 'Creating an API Client'),
      ),
      check(
        'Assign the Salesforce Commerce API role with a tenant filter',
        link('/guide/authentication', 'assigning-roles', 'Assigning Roles'),
      ),
      check(
        `Add Default Scopes: ${computedScopes}`,
        link('/guide/authentication', 'configuring-scopes', 'Configuring Scopes'),
      ),
      check(
        'Set the tenant filter to the realm/tenant IDs your client may access',
        link('/guide/authentication', 'configuring-tenant-filter', 'Configuring Tenant Filter'),
      ),
      ...(isJwt
        ? [
            check(
              'Register your public certificate and configure JWT credentials',
              link('/guide/authentication', 'jwt-authentication-certificate-based', 'JWT Authentication'),
            ),
          ]
        : []),
      check(
        useEnv
          ? `Set SFCC_* environment variables (tenant-id${needsShortCode ? ' + short-code' : ''})`
          : `Save dw.json with tenant-id${needsShortCode ? ' + short-code' : ''}`,
        link(
          '/guide/configuration',
          useEnv ? 'environment-variables' : 'configuration-file',
          useEnv ? 'Environment Variables' : 'Configuration File',
        ),
      ),
    ];

    const warnings: string[] = [
      `Selected surfaces: ${surfaceList}`,
      "Do NOT add `SALESFORCE_COMMERCE_API` as a scope — that is a *role* you assign to the API client, not a scope. The CLI auto-requests the scopes above; they only need to appear in the client's Default Scopes list.",
    ];
    if (needsShortCode) {
      warnings.push(
        'The SCAPI short-code is the per-realm subdomain in your SCAPI URL (e.g., `kv7kzm78`). It is required for `scapi schemas`, `scapi custom`, and `scapi replications`.',
      );
    }

    return {
      dwJson: dw,
      env: useEnv ? envLines : undefined,
      checklist,
      warnings,
      verifyCommand: pickVerifyCommand(surfaces),
    };
  },
});
