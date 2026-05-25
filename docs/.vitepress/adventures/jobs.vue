<!--
  Run jobs · Quickstart adventure.

  This file is the single source of truth for the adventure: structure
  (Wizard / QStep / QChoice), prose (intro, choice descriptions), and the
  synthesizer that assembles dw.json + checklist + verify command.

  The corresponding page at `docs/quickstart/jobs.md` is just a thin shim
  that imports this component and sets the page chrome (title, layout).
-->
<script setup lang="ts">
import {check, dwJson, link, ocapiConfig, scopes} from '../data/adventures/_helpers.js';
import type {Synthesizer} from '../theme/adventure/declarative/wizard-context.js';

const synth: Synthesizer = (state) => {
  const isJwt = state.authMethod === 'jwt';
  const isImplicit = state.authMethod === 'implicit';
  const useEnv = state.configSource === 'env';

  const dw = useEnv
    ? '# Using environment variables — see .env tab below.'
    : dwJson({hostname: true, clientId: true, clientSecret: !isJwt && !isImplicit});

  const env = useEnv
    ? [
        'SFCC_SERVER=<INSTANCE>.dx.commercecloud.salesforce.com',
        'SFCC_CLIENT_ID=<CLIENT_ID>',
        isJwt ? 'SFCC_JWT_CERT=./cert.pem' : '',
        isJwt ? 'SFCC_JWT_KEY=./key.pem' : '',
        !isJwt && !isImplicit ? 'SFCC_CLIENT_SECRET=<CLIENT_SECRET>' : '',
      ]
        .filter(Boolean)
        .join('\n')
    : undefined;

  const ocapi = ocapiConfig('<CLIENT_ID>', ['jobs']);

  return {
    dwJson: dw,
    env,
    checklist: [
      check(
        'Create an Account Manager API client',
        link('/guide/authentication', 'creating-an-api-client', 'Creating an API Client'),
      ),
      check(
        `Add Default Scopes: ${scopes('baseline')}`,
        link('/guide/authentication', 'configuring-scopes', 'Configuring Scopes'),
      ),
      check(
        'Add a tenant filter on the Sandbox API User role',
        link('/guide/authentication', 'configuring-tenant-filter', 'Configuring Tenant Filter'),
      ),
      check(
        'Enable Jobs in OCAPI Data API (Business Manager)',
        link('/guide/authentication', 'ocapi-configuration', 'OCAPI Configuration'),
      ),
      check(
        useEnv ? 'Set SFCC_* environment variables' : 'Save the dw.json snippet to your project root',
        link(
          '/guide/configuration',
          useEnv ? 'environment-variables' : 'configuration-file',
          useEnv ? 'Environment Variables' : 'Configuration File',
        ),
      ),
    ],
    warnings: [
      `Paste the following block into Business Manager → Administration → Site Development → Open Commerce API Settings → Data API:\n\n\`\`\`json\n${ocapi}\n\`\`\``,
      ...(isImplicit ? ['User auth opens a browser per session — fine for development, not for CI.'] : []),
    ],
    verifyCommand: 'b2c job search',
  };
};
</script>

<template>
  <Wizard
    id="jobs"
    title="Run jobs"
    tagline="Trigger and watch B2C Commerce jobs from the CLI."
    intro="Jobs are run via OCAPI. You need an Account Manager API client with OAuth and an OCAPI configuration in Business Manager that grants the Jobs resource."
    icon="mdi:cog-play-outline"
    :synth="synth"
  >
    <QStep
      id="instance"
      title="Where will you run jobs?"
      :doc="{path: '/guide/authentication', hash: 'overview', label: 'Authentication overview'}"
    >
      <QChoice
        id="ods"
        title="On-Demand Sandbox"
        subtitle="Realm-managed"
        icon="mdi:flask-outline"
        :contributes="{instanceType: 'ods'}"
      >
        A short-lived sandbox provisioned via <code>b2c sandbox</code>.
      </QChoice>
      <QChoice
        id="primary"
        title="Primary Instance"
        subtitle="Development / Staging / Production"
        icon="mdi:server"
        :contributes="{instanceType: 'primary'}"
      >
        A long-running instance you connect to with hostname + credentials.
      </QChoice>
    </QStep>

    <QStep
      id="auth"
      title="How will you authenticate?"
      :doc="{path: '/guide/authentication', hash: 'account-manager-api-client', label: 'Account Manager API Client'}"
    >
      <QChoice
        id="client-credentials"
        title="Client Credentials"
        subtitle="Recommended for CI/CD"
        icon="mdi:key-variant"
        :badges="[{text: 'CI', tone: 'quick'}]"
        :contributes="{authMethod: 'client-credentials'}"
      >
        Account Manager API client with a client secret. Non-interactive, ideal for automation.
      </QChoice>
      <QChoice
        id="jwt"
        title="JWT Bearer"
        subtitle="Certificate-based"
        icon="mdi:certificate-outline"
        :contributes="{authMethod: 'jwt'}"
      >
        Use a public/private cert pair instead of a client secret. See
        <a href="/b2c-developer-tooling/guide/authentication#jwt-authentication-certificate-based">JWT setup</a>.
      </QChoice>
      <QChoice
        id="user-auth"
        title="User Auth (Browser)"
        subtitle="Implicit"
        icon="mdi:account-arrow-right-outline"
        :contributes="{authMethod: 'implicit'}"
      >
        Browser-based login. Useful for local development without a stored secret.
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
        :contributes="{configSource: 'dw-json'}"
      >
        Per-project config file. Walk-up discovery from the current directory.
      </QChoice>
      <QChoice
        id="env"
        title=".env / environment variables"
        subtitle="CI-friendly"
        icon="mdi:console-line"
        :contributes="{configSource: 'env'}"
      >
        Use <code>SFCC_*</code> environment variables — the CLI auto-loads <code>.env</code> files.
      </QChoice>
    </QStep>
  </Wizard>
</template>
