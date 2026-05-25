<!--
  Manage Account Manager, BM roles & users · Quickstart adventure.

  Covers both `b2c am` (Account Manager: org users, API clients, orgs, roles)
  and `b2c bm` (Business Manager admin: roles, users, access keys, whoami)
  since both are admin-flavored and overlap on workflows like "manage who
  can access this instance".

  Page shim: docs/quickstart/account-manager.md
-->
<script setup lang="ts">
import {check, dwJson, link, scopes} from '../data/adventures/_helpers.js';
import type {Synthesizer} from '../theme/adventure/declarative/wizard-context.js';

// Hand-rolled OCAPI Data API snippet for BM administration resources.
// The shared `ocapiConfig()` helper only covers code-versions/jobs/sites,
// so we inline the BM admin resources here.
const BM_ADMIN_OCAPI = (clientId: string): string => {
  const resources = [
    {resource_id: '/roles', methods: ['get']},
    {resource_id: '/roles/*', methods: ['get', 'put', 'delete']},
    {resource_id: '/roles/*/users', methods: ['get']},
    {resource_id: '/roles/*/users/*', methods: ['put', 'delete']},
    {resource_id: '/roles/*/permissions', methods: ['get', 'put']},
    {resource_id: '/users', methods: ['get']},
    {resource_id: '/users/*', methods: ['get', 'patch', 'delete']},
    {resource_id: '/users/this', methods: ['get']},
    {resource_id: '/users/*/access_key/*', methods: ['get', 'put', 'patch', 'delete']},
    {resource_id: '/user_search', methods: ['post']},
  ];
  return JSON.stringify(
    {
      _v: '24.5',
      clients: [
        {
          client_id: clientId,
          resources: resources.map((r) => ({...r, read_attributes: '(**)', write_attributes: '(**)'})),
        },
      ],
    },
    null,
    2,
  );
};

const synth: Synthesizer = (state) => {
  const target = (state.target as string) ?? 'both';
  const includesAm = target === 'am' || target === 'both';
  const includesBm = target === 'bm' || target === 'both';

  const isJwt = state.authMethod === 'jwt';
  const isImplicit = state.authMethod === 'implicit';
  const isClientCreds = state.authMethod === 'client-credentials';

  const persistence = (state.persistence as string) ?? 'dw-json';
  const useEnv = persistence === 'env';
  const useStateful = persistence === 'stateful';

  const needsBmHost = includesBm; // BM commands target a specific Commerce instance
  const needsClientSecret = isClientCreds;
  const needsClientId = isClientCreds || isJwt;

  // Configure OCAPI? Only meaningful when BM admin is in scope.
  const needsOcapi = includesBm && state.needsOcapi === true;

  // dw.json / env synthesis ------------------------------------------------
  // Edge case: AM-only + implicit + dw-json has nothing to write — emit a
  // comment-only note so users don't paste an empty `{}`.
  const noDwJsonNeeded = !needsBmHost && !needsClientId && !needsClientSecret;
  const dw = useStateful
    ? '// Stateful auth (b2c auth login) — no dw.json required for one-shot AM commands.\n// For BM commands, set the instance hostname (and optional client) via dw.json or flags.'
    : useEnv
      ? '# Using environment variables — see .env tab below.'
      : noDwJsonNeeded
        ? '// No dw.json required — AM commands authenticate via the built-in public client (browser).'
        : dwJson({
            hostname: needsBmHost,
            clientId: needsClientId,
            clientSecret: needsClientSecret,
          });

  const envLines = useEnv
    ? [
        needsBmHost ? 'SFCC_SERVER=<INSTANCE>.dx.commercecloud.salesforce.com' : '',
        needsClientId ? 'SFCC_CLIENT_ID=<CLIENT_ID>' : '',
        needsClientSecret ? 'SFCC_CLIENT_SECRET=<CLIENT_SECRET>' : '',
        isJwt ? 'SFCC_JWT_CERT=./cert.pem' : '',
        isJwt ? 'SFCC_JWT_KEY=./key.pem' : '',
      ]
        .filter(Boolean)
        .join('\n')
    : undefined;

  // Checklist --------------------------------------------------------------
  const checklist = [
    // Auth setup
    ...(isImplicit
      ? [
          check(
            'Sign in with `b2c auth login`',
            link('/guide/authentication', 'authentication-methods', 'Authentication Methods'),
          ),
        ]
      : [
          check(
            'Create an Account Manager API client',
            link('/guide/authentication', 'creating-an-api-client', 'Creating an API Client'),
          ),
        ]),

    // Roles - depends on target
    ...(includesAm
      ? [
          check(
            isImplicit
              ? 'Assign Account Administrator (or User Administrator) to your AM user'
              : 'Assign User Administrator to the API client (read-only AM users/roles)',
            link(
              '/guide/authentication',
              'understanding-roles-and-tenant-filters',
              'Understanding Roles and Tenant Filters',
            ),
          ),
        ]
      : []),
    ...(includesBm && !isImplicit
      ? [
          check(
            `Add Default Scopes: ${scopes('baseline')}`,
            link('/guide/authentication', 'configuring-scopes', 'Configuring Scopes'),
          ),
          check(
            'Add a tenant filter on the API client roles',
            link('/guide/authentication', 'configuring-tenant-filter', 'Configuring Tenant Filter'),
          ),
        ]
      : []),

    // OCAPI - only for BM admin
    ...(needsOcapi
      ? [
          check(
            'Enable BM administration resources in OCAPI Data API',
            link('/guide/authentication', 'minimal-configuration-by-feature', 'Minimal Configuration by Feature'),
          ),
        ]
      : []),

    // Persistence
    ...(useStateful
      ? [
          check(
            'Run `b2c auth login` to start a stateful session',
            link('/guide/configuration', 'configuration-file', 'Configuration File'),
          ),
        ]
      : [
          check(
            useEnv ? 'Set SFCC_* environment variables' : 'Save the dw.json snippet to your project root',
            link(
              '/guide/configuration',
              useEnv ? 'environment-variables' : 'configuration-file',
              useEnv ? 'Environment Variables' : 'Configuration File',
            ),
          ),
        ]),
  ];

  // Warnings ---------------------------------------------------------------
  const warnings: string[] = [];

  if (needsOcapi) {
    warnings.push(
      `Paste this BM administration OCAPI Data API config into Business Manager (Site Development → Open Commerce API Settings → Data API):\n\n\`\`\`json\n${BM_ADMIN_OCAPI('<CLIENT_ID>')}\n\`\`\``,
    );
  }

  if (includesAm && (isClientCreds || isJwt)) {
    warnings.push(
      'AM API client management (`am clients create/update/delete`) and `am orgs` are user-auth only — run `b2c auth login` first or pass `--user-auth`. Client-credentials work for read-only `am users list/get` and `am roles list/get` only.',
    );
  }

  if (includesBm && !isImplicit) {
    warnings.push(
      '`b2c bm whoami` and `b2c bm access-key …` need a token that resolves to a real BM user, so they default to browser-based user-auth. You can override with `--auth-methods client-credentials` only if your service client is configured to issue user-bearing tokens.',
    );
  }
  if (includesBm) {
    warnings.push(
      'Access-key writes (`bm access-key create/set/delete`) additionally require the `Manage_Users_Access_Keys` BM functional permission on your user account.',
    );
  }

  if (isImplicit && !useStateful) {
    warnings.push(
      'User auth opens a browser per session — fine for development. Use `b2c auth login` (stateful) to reuse a single session across commands.',
    );
  }

  // Verify command --------------------------------------------------------
  // Pick the smallest command that proves the chosen target works.
  const verifyCommand = includesBm
    ? isImplicit
      ? 'b2c bm whoami'
      : 'b2c bm roles list'
    : 'b2c am users list';

  return {
    dwJson: dw,
    env: envLines,
    checklist,
    warnings,
    verifyCommand,
  };
};
</script>

<template>
  <Wizard
    id="account-manager"
    title="Manage Account Manager, BM roles & users"
    tagline="Configure access to Account Manager (org users, API clients) and Business Manager admin (roles, permissions, access keys)."
    intro="Account Manager covers cross-instance identity (org users, API clients, orgs). Business Manager admin covers per-instance roles, users, and access keys via the OCAPI Data API. Pick the target you need — some commands are user-auth only, and `bm access-key` writes need an extra BM functional permission."
    icon="mdi:account-cog-outline"
    :synth="synth"
  >
    <QStep
      id="target"
      title="What do you want to manage?"
      :doc="{path: '/guide/authentication', hash: 'overview', label: 'Authentication overview'}"
    >
      <QChoice
        id="am"
        title="Account Manager only"
        subtitle="Org users, API clients, orgs"
        icon="mdi:office-building-cog-outline"
        :contributes="{target: 'am'}"
      >
        Cross-instance identity: <code>b2c am users</code>, <code>b2c am roles</code>,
        <code>b2c am clients</code>, <code>b2c am orgs</code>.
      </QChoice>
      <QChoice
        id="bm"
        title="Business Manager admin only"
        subtitle="Per-instance roles, users, access keys"
        icon="mdi:shield-account-outline"
        :contributes="{target: 'bm'}"
      >
        Instance-scoped admin via OCAPI Data API: <code>b2c bm roles</code>,
        <code>b2c bm users</code>, <code>b2c bm access-key</code>, <code>b2c bm whoami</code>.
      </QChoice>
      <QChoice
        id="both"
        title="Both"
        subtitle="AM + BM admin"
        icon="mdi:account-cog-outline"
        :badges="[{text: 'Recommended', tone: 'info'}]"
        :contributes="{target: 'both'}"
      >
        Set up credentials that work across Account Manager and Business Manager admin commands.
      </QChoice>
    </QStep>

    <QStep
      id="auth"
      title="How will you authenticate?"
      :doc="{path: '/guide/authentication', hash: 'authentication-methods', label: 'Authentication Methods'}"
    >
      <QChoice
        id="user-auth"
        title="User Auth (Browser)"
        subtitle="Implicit / b2c auth login"
        icon="mdi:account-arrow-right-outline"
        :badges="[{text: 'Recommended for AM', tone: 'info'}]"
        :contributes="{authMethod: 'implicit'}"
      >
        Required for <code>am clients create/update/delete</code>, <code>am orgs</code>,
        <code>bm whoami</code>, and <code>bm access-key</code>. Uses your real user roles
        and BM functional permissions.
      </QChoice>
      <QChoice
        id="client-credentials"
        title="Client Credentials"
        subtitle="For automation / CI/CD"
        icon="mdi:key-variant"
        :badges="[{text: 'CI', tone: 'quick'}]"
        :contributes="{authMethod: 'client-credentials'}"
      >
        Service-account token. Works for read-only AM (<code>users list</code>,
        <code>roles list</code>) and most BM <code>roles</code>/<code>users</code> commands
        once OCAPI is configured.
      </QChoice>
      <QChoice
        id="jwt"
        title="JWT Bearer"
        subtitle="Certificate-based"
        icon="mdi:certificate-outline"
        :contributes="{authMethod: 'jwt'}"
      >
        Cert pair instead of a client secret. See
        <a href="/guide/authentication#jwt-authentication-certificate-based">JWT setup</a>.
      </QChoice>
    </QStep>

    <QStep
      id="ocapi"
      title="Configure OCAPI for BM admin?"
      subtitle="Required for any b2c bm command other than user-auth-only ones."
      :showIf="(s) => s.target === 'bm' || s.target === 'both'"
      :doc="{
        path: '/guide/authentication',
        hash: 'minimal-configuration-by-feature',
        label: 'Minimal Configuration by Feature',
      }"
    >
      <QChoice
        id="yes"
        title="Yes — auto-config snippet"
        subtitle="roles, users, access_key, user_search"
        icon="mdi:check-circle-outline"
        :badges="[{text: 'Recommended', tone: 'info'}]"
        :contributes="{needsOcapi: true}"
      >
        Emits a JSON block to paste into Business Manager → Site Development → Open Commerce
        API Settings → Data API.
      </QChoice>
      <QChoice
        id="no"
        title="Skip — already configured"
        subtitle="Or only using bm whoami / access-key"
        icon="mdi:skip-next-outline"
        :contributes="{needsOcapi: false}"
      >
        <code>bm whoami</code> and <code>bm access-key</code> use user-auth and don't need
        OCAPI Data API entries beyond <code>/users/this</code> and <code>/users/*/access_key/*</code>.
      </QChoice>
    </QStep>

    <QStep
      id="persistence"
      title="How should the CLI find your config?"
      :doc="{path: '/guide/configuration', hash: 'configuration-file', label: 'Configuration file (dw.json)'}"
    >
      <QChoice
        id="dw-json"
        title="dw.json (project root)"
        subtitle="Recommended"
        icon="mdi:file-cog-outline"
        :contributes="{persistence: 'dw-json'}"
      >
        Per-project config file. Walk-up discovery from the current directory.
      </QChoice>
      <QChoice
        id="env"
        title=".env / environment variables"
        subtitle="CI-friendly"
        icon="mdi:console-line"
        :contributes="{persistence: 'env'}"
      >
        Use <code>SFCC_*</code> environment variables — the CLI auto-loads <code>.env</code> files.
      </QChoice>
      <QChoice
        id="stateful"
        title="Stateful (b2c auth login)"
        subtitle="One browser login, reused"
        icon="mdi:lock-open-check-outline"
        :contributes="{persistence: 'stateful'}"
      >
        Best for interactive use — sign in once and reuse the session across <code>am</code>
        and <code>bm</code> commands until it expires.
      </QChoice>
    </QStep>
  </Wizard>
</template>
