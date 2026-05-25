<!--
  Configure SCAPI access · Quickstart adventure.

  Walks the user through configuring an Account Manager API client with the
  Salesforce Commerce API role, the right SCAPI scopes (computed from the
  surfaces the user picked), and the tenant-id / short-code that the CLI
  needs at runtime.

  Page shim: docs/quickstart/scapi-access.md
-->
<script setup lang="ts">
import {check, dwJson, link, scopes} from '../data/adventures/_helpers.js';
import type {AdventureState, Flags, Synthesizer} from '../theme/adventure/declarative/wizard-context.js';

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

const showShortCodeStep = (state: AdventureState, _flags: Flags) =>
  selectedSurfaces(state).some((s) => s === 'schemas' || s === 'custom-apis' || s === 'replications');

const synth: Synthesizer = (state) => {
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
    'Do NOT add `SALESFORCE_COMMERCE_API` as a scope — that is a *role* you assign to the API client, not a scope. The CLI auto-requests the scopes above; they only need to appear in the client\'s Default Scopes list.',
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
};
</script>

<template>
  <Wizard
    id="scapi-access"
    title="Configure SCAPI access"
    tagline="Set up OAuth client + tenant for eCDN, Custom APIs, schemas, and replications."
    intro="SCAPI commands authenticate via Account Manager OAuth with the Salesforce Commerce API role, a tenant filter, and one or more sfcc.* scopes. Pick the surfaces you'll use and the wizard will compute the right scope set and config snippet."
    icon="mdi:api"
    :synth="synth"
  >
    <QStep
      id="surfaces"
      title="Which SCAPI surfaces will you use?"
      subtitle="Pick one or more — the wizard computes the union of required scopes."
      :multi-select="true"
      :min-picks="1"
      :doc="{path: '/guide/authentication', hash: 'scapi-authentication', label: 'SCAPI Authentication'}"
    >
      <QChoice
        id="ecdn"
        title="eCDN"
        subtitle="b2c ecdn zones / cache / certificates"
        icon="mdi:cloud-outline"
        :contributes="{surfaces: ['ecdn']}"
      >
        Manage Cloudflare-backed eCDN zones, cache purges, certificates, and WAF rules.
        Adds <code>sfcc.cdn-zones</code> and <code>sfcc.cdn-zones.rw</code>.
      </QChoice>
      <QChoice
        id="schemas"
        title="SCAPI Schemas"
        subtitle="b2c scapi schemas list / get"
        icon="mdi:file-document-outline"
        :contributes="{surfaces: ['schemas']}"
      >
        Discover and inspect Shopper / Admin SCAPI OpenAPI schemas. Adds
        <code>sfcc.scapi-schemas</code>.
      </QChoice>
      <QChoice
        id="custom-apis"
        title="Custom APIs"
        subtitle="b2c scapi custom status"
        icon="mdi:application-braces-outline"
        :contributes="{surfaces: ['custom-apis']}"
      >
        Inspect Custom API endpoint registration status across sites. Adds
        <code>sfcc.custom-apis</code>.
      </QChoice>
      <QChoice
        id="replications"
        title="Replications"
        subtitle="b2c scapi replications"
        icon="mdi:database-sync-outline"
        :contributes="{surfaces: ['replications']}"
      >
        Trigger and monitor granular replications (publish staging items to production) via SCAPI.
        Adds <code>sfcc.granular-replications.rw</code>.
      </QChoice>
    </QStep>

    <QStep
      id="auth"
      title="How will the API client authenticate?"
      :doc="{path: '/guide/authentication', hash: 'account-manager-api-client', label: 'Account Manager API Client'}"
    >
      <QChoice
        id="client-credentials"
        title="Client Credentials"
        subtitle="client_id + client_secret"
        icon="mdi:key-variant"
        :badges="[{text: 'Recommended', tone: 'info'}]"
        :contributes="{authMethod: 'client-credentials'}"
      >
        The typical setup — the API client has a Token Endpoint Auth Method of
        <code>client_secret_post</code> or <code>client_secret_basic</code>.
      </QChoice>
      <QChoice
        id="jwt"
        title="JWT Bearer"
        subtitle="Certificate-based"
        icon="mdi:certificate-outline"
        :badges="[{text: 'Complex', tone: 'complex'}]"
        :contributes="{authMethod: 'jwt'}"
      >
        Use a public/private cert pair instead of a client secret.
      </QChoice>
    </QStep>

    <QStep
      id="tenant"
      title="Where will the CLI find your tenant-id?"
      subtitle="SCAPI requires a tenant-id (realm) on every request."
      :doc="{path: '/guide/authentication', hash: 'configuring-tenant-filter', label: 'Configuring Tenant Filter'}"
    >
      <QChoice
        id="dw-json"
        title="dw.json (project root)"
        subtitle="Recommended"
        icon="mdi:file-cog-outline"
        :contributes="{tenantSource: 'dw-json'}"
      >
        Add <code>"tenant-id": "&lt;TENANT_ID&gt;"</code> to your project's <code>dw.json</code>.
      </QChoice>
      <QChoice
        id="env"
        title="Environment variable"
        subtitle="SFCC_TENANT_ID"
        icon="mdi:console-line"
        :contributes="{tenantSource: 'env'}"
      >
        CI-friendly. The CLI auto-loads <code>.env</code> files.
      </QChoice>
      <QChoice
        id="flag"
        title="Per-command flag"
        subtitle="--tenant-id"
        icon="mdi:flag-outline"
        :contributes="{tenantSource: 'flag'}"
      >
        Pass <code>--tenant-id zzxy_prd</code> on each invocation. Useful for one-off scripts.
      </QChoice>
    </QStep>

    <QStep
      id="short-code"
      title="Where will the CLI find your SCAPI short-code?"
      subtitle="Required for scapi schemas, scapi custom, and scapi replications."
      :show-if="showShortCodeStep"
      :doc="{path: '/guide/authentication', hash: 'scapi-authentication', label: 'SCAPI Authentication'}"
    >
      <QChoice
        id="dw-json"
        title="dw.json"
        subtitle="short-code key"
        icon="mdi:file-cog-outline"
        :contributes="{shortCodeSource: 'dw-json'}"
      >
        Add <code>"short-code": "&lt;SCAPI_SHORT_CODE&gt;"</code> to your project's <code>dw.json</code>.
      </QChoice>
      <QChoice
        id="env"
        title="Environment variable"
        subtitle="SFCC_SHORTCODE"
        icon="mdi:console-line"
        :contributes="{shortCodeSource: 'env'}"
      >
        Set <code>SFCC_SHORTCODE</code> alongside your other SCAPI env vars.
      </QChoice>
      <QChoice
        id="flag"
        title="Per-command flag"
        subtitle="--short-code"
        icon="mdi:flag-outline"
        :contributes="{shortCodeSource: 'flag'}"
      >
        Pass <code>--short-code kv7kzm78</code> on each invocation.
      </QChoice>
    </QStep>
  </Wizard>
</template>
