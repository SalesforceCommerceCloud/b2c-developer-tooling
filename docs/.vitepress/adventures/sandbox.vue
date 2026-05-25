<!--
  Manage sandboxes · Quickstart adventure.

  Sandbox commands authenticate via the CLI's built-in public client by
  default, so the simplest path requires zero configuration. This wizard
  branches on auth method (browser / client credentials / JWT) and on how
  the user wants to supply the realm and (optional) credentials.

  Page shim: docs/quickstart/sandbox.md
-->
<script setup lang="ts">
import {check, dwJson, link} from '../data/adventures/_helpers.js';
import type {Synthesizer} from '../theme/adventure/declarative/wizard-context.js';

const synth: Synthesizer = (state) => {
  const authMethod = String(state.authMethod ?? 'implicit');
  const isImplicit = authMethod === 'implicit';
  const isJwt = authMethod === 'jwt';
  const isClientCreds = authMethod === 'client-credentials';
  const useEnv = state.configSource === 'env';
  const useFlags = state.configSource === 'flags';

  // Realm is only persisted when the user picks a stored config source.
  const persistRealm = !useFlags;

  let dw: string;
  if (useFlags) {
    dw = '# No config file needed — pass --realm on every command.\n# Example:\n#   b2c sandbox list --realm <REALM_ID>\n#   b2c sandbox create --realm <REALM_ID>';
  } else if (useEnv) {
    dw = '# Using environment variables — see .env tab below.';
  } else {
    dw = dwJson({
      realm: persistRealm,
      clientId: isClientCreds || isJwt,
      clientSecret: isClientCreds,
    });
  }

  // There is no env var that fills `--realm` for sandbox commands. Env mode
  // covers the OAuth credentials only — the realm itself must be in dw.json
  // or on the flag.
  const env = useEnv
    ? [
        '# --realm is not env-configurable; pass it on each command or use dw.json',
        isClientCreds || isJwt ? 'SFCC_CLIENT_ID=<CLIENT_ID>' : '',
        isClientCreds ? 'SFCC_CLIENT_SECRET=<CLIENT_SECRET>' : '',
        isJwt ? 'SFCC_JWT_CERT=./cert.pem' : '',
        isJwt ? 'SFCC_JWT_KEY=./key.pem' : '',
      ]
        .filter(Boolean)
        .join('\n')
    : undefined;

  const checklist = [
    ...(isImplicit
      ? [
          check(
            'Confirm your user has the Sandbox API User role with a tenant filter',
            link('/guide/authentication', 'configuring-tenant-filter', 'Configuring Tenant Filter'),
          ),
        ]
      : [
          check(
            'Create an Account Manager API client',
            link('/guide/authentication', 'creating-an-api-client', 'Creating an API Client'),
          ),
          check(
            'Assign the Sandbox API User role to the API client',
            link('/guide/authentication', 'for-client-credentials-roles-on-api-client', 'Roles for Client Credentials'),
          ),
          check(
            'Add a tenant filter for your realm on the Sandbox API User role',
            link('/guide/authentication', 'configuring-tenant-filter', 'Configuring Tenant Filter'),
          ),
        ]),
    ...(useFlags
      ? [
          check(
            'Pass --realm on every sandbox command (or use stored config)',
            link('/cli/sandbox', undefined, 'Sandbox Commands'),
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

  const warnings: string[] = [];
  if (isImplicit) {
    warnings.push(
      'Browser auth opens a login window the first time and on token expiry. Great for local development; use client credentials for CI/CD.',
    );
  }

  // `--realm` is required on sandbox create and recommended on list; the
  // dw.json `realm` field is not yet wired as a default for these flags.
  // Always include `--realm` in the verify command so the user sees the
  // canonical invocation.
  return {
    dwJson: dw,
    env,
    checklist,
    warnings,
    verifyCommand: 'b2c sandbox list --realm <REALM_ID>',
  };
};
</script>

<template>
  <Wizard
    id="sandbox"
    title="Manage sandboxes"
    tagline="Create, start/stop, and delete on-demand sandboxes from the CLI."
    intro="Sandbox commands work out of the box — the CLI ships with a built-in public client that authenticates you via your browser. For automation or CI you can swap in your own Account Manager API client."
    icon="mdi:flask-empty-outline"
    :synth="synth"
  >
    <QStep
      id="auth"
      title="How will you authenticate?"
      :doc="{path: '/guide/authentication', hash: 'account-manager-api-client', label: 'Account Manager API Client'}"
    >
      <QChoice
        id="implicit"
        title="Browser login (default)"
        subtitle="Zero config"
        icon="mdi:account-arrow-right-outline"
        :badges="[{text: 'Quick', tone: 'quick'}]"
        :contributes="{authMethod: 'implicit'}"
      >
        Use the CLI's built-in public client. <code>b2c sandbox list</code> opens a browser window for login on first
        use. Your user account just needs the <code>Sandbox API User</code> role with a tenant filter.
      </QChoice>
      <QChoice
        id="client-credentials"
        title="Client Credentials"
        subtitle="Recommended for CI/CD"
        icon="mdi:key-variant"
        :badges="[{text: 'CI', tone: 'quick'}]"
        :contributes="{authMethod: 'client-credentials'}"
      >
        Account Manager API client with a client secret. Non-interactive — assign the
        <code>Sandbox API User</code> role on the client and configure a tenant filter for the realm.
      </QChoice>
      <QChoice
        id="jwt"
        title="JWT Bearer"
        subtitle="Certificate-based"
        icon="mdi:certificate-outline"
        :contributes="{authMethod: 'jwt'}"
      >
        Use a public/private cert pair instead of a secret. See
        <a href="/guide/authentication#jwt-authentication-certificate-based">JWT setup</a>.
      </QChoice>
    </QStep>

    <QStep
      id="persistence"
      title="How should the CLI find your realm and credentials?"
      subtitle="Sandbox commands need a realm — either stored in config or passed via --realm."
      :doc="{path: '/guide/configuration', hash: 'configuration-file', label: 'Configuration file (dw.json)'}"
    >
      <QChoice
        id="dw-json"
        title="dw.json (project root)"
        subtitle="Recommended"
        icon="mdi:file-cog-outline"
        :badges="[{text: 'Recommended', tone: 'info'}]"
        :contributes="{configSource: 'dw-json'}"
      >
        Stores <code>realm</code> (and optional credentials) in a per-project file. Walk-up discovery from the current
        directory.
      </QChoice>
      <QChoice
        id="env"
        title=".env / environment variables"
        subtitle="Credentials only — pass --realm per command"
        icon="mdi:console-line"
        :contributes="{configSource: 'env'}"
      >
        Use <code>SFCC_CLIENT_ID</code> / <code>SFCC_CLIENT_SECRET</code> for OAuth credentials.
        There is no env var for <code>--realm</code>, so pass it on each <code>b2c sandbox</code>
        invocation (or store it in <code>dw.json</code>).
      </QChoice>
      <QChoice
        id="flags"
        title="Flags on every command"
        subtitle="No persistence"
        icon="mdi:flag-outline"
        :contributes="{configSource: 'flags'}"
      >
        Pass <code>--realm &lt;REALM_ID&gt;</code> on every <code>b2c sandbox</code> invocation. Useful for one-off
        scripts or when juggling multiple realms.
      </QChoice>
    </QStep>
  </Wizard>
</template>
