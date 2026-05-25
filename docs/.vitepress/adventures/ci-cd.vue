<!--
  Set up CI/CD pipeline · Quickstart adventure.

  Page shim: docs/quickstart/ci-cd.md
-->
<script setup lang="ts">
import {check, link, ocapiConfig, scopes} from '../data/adventures/_helpers.js';
import type {Synthesizer} from '../theme/adventure/declarative/wizard-context.js';

const synth: Synthesizer = (state) => {
  const runner = (state.runner as string) ?? 'github';
  const authMethod = (state.authMethod as string) ?? 'client-credentials';
  const deployScope = (state.deployScope as string) ?? 'cartridges';
  const safetyLevel = (state.safetyLevel as string) ?? 'NO_DELETE';

  const isJwt = authMethod === 'jwt';
  const includeJobs = deployScope === 'cartridges-jobs';
  const isGithub = runner === 'github';

  // CI prefers env vars from secret stores. We always emit an env-style block;
  // dwJson is set to a comment that tells the user to use the .env tab.
  const dw = '# CI/CD prefers environment variables from your runner\'s secret store — see the .env tab.';

  const envLines = [
    'SFCC_SERVER=<INSTANCE>.dx.commercecloud.salesforce.com',
    'SFCC_CODE_VERSION=version1',
    'SFCC_CLIENT_ID=<CLIENT_ID>',
    isJwt ? 'SFCC_JWT_CERT=./cert.pem' : 'SFCC_CLIENT_SECRET=<CLIENT_SECRET>',
    isJwt ? 'SFCC_JWT_KEY=./key.pem' : '',
    'SFCC_USERNAME=<BM_USERNAME>',
    'SFCC_PASSWORD=<WEBDAV_ACCESS_KEY>',
    `SFCC_SAFETY_LEVEL=${safetyLevel}`,
  ]
    .filter(Boolean)
    .join('\n');

  const checklist = [
    check(
      isJwt
        ? 'Create an Account Manager API client with JWT (certificate) auth'
        : 'Create an Account Manager API client with a client secret',
      link('/guide/authentication', 'creating-an-api-client', 'Creating an API Client'),
    ),
    check(
      `Add Default Scopes: ${scopes('baseline')}`,
      link('/guide/authentication', 'configuring-scopes', 'Configuring Scopes'),
    ),
    ...(isJwt
      ? [
          check(
            'Generate a certificate pair and register the public cert in Account Manager',
            link(
              '/guide/authentication',
              'jwt-authentication-certificate-based',
              'JWT Authentication (Certificate-Based)',
            ),
          ),
        ]
      : []),
    check(
      'Generate a WebDAV access key for cartridge uploads',
      link('/guide/authentication', 'option-a-basic-authentication-recommended', 'Basic Authentication'),
    ),
    check(
      'Enable code_versions in OCAPI Data API (Business Manager)',
      link('/guide/authentication', 'ocapi-configuration', 'OCAPI Configuration'),
    ),
    ...(includeJobs
      ? [
          check(
            'Enable Jobs in OCAPI Data API (Business Manager)',
            link('/guide/authentication', 'ocapi-configuration', 'OCAPI Configuration'),
          ),
        ]
      : []),
    check(
      isGithub
        ? 'Add SFCC_* values as GitHub repository secrets / variables'
        : 'Store SFCC_* values in your CI runner\'s secret store',
      link('/guide/ci-cd', 'authentication', isGithub ? 'GitHub Actions: Authentication' : 'CI/CD Authentication'),
    ),
    check(
      `Set SFCC_SAFETY_LEVEL=${safetyLevel} for production deployments`,
      link('/guide/safety', 'safety-levels', 'Safety Levels'),
    ),
  ];

  const ocapi = ocapiConfig('<CLIENT_ID>', includeJobs ? ['codeVersions', 'jobs'] : ['codeVersions']);

  const warnings: string[] = [
    'Never commit `dw.json` or `.env` files containing real secrets — always load them from your runner\'s secret store.',
    `Paste the following block into Business Manager → Administration → Site Development → Open Commerce API Settings → Data API:\n\n\`\`\`json\n${ocapi}\n\`\`\``,
  ];

  if (isGithub) {
    // Install the CLI from npm, then run it with secrets exposed via env. We
    // deliberately do NOT reference a custom `actions/setup@v1` or
    // `actions/code-deploy@v1` action — those aren't published.
    const ghLines: string[] = [
      'name: Deploy',
      '',
      'on:',
      '  push:',
      '    branches: [main]',
      '',
      'jobs:',
      '  deploy:',
      '    runs-on: ubuntu-latest',
      '    env:',
      '      SFCC_SERVER: ${{ vars.SFCC_SERVER }}',
      '      SFCC_CODE_VERSION: ${{ vars.SFCC_CODE_VERSION }}',
      '      SFCC_CLIENT_ID: ${{ secrets.SFCC_CLIENT_ID }}',
    ];
    if (isJwt) {
      ghLines.push('      SFCC_JWT_CERT: ./cert.pem');
      ghLines.push('      SFCC_JWT_KEY: ./key.pem');
    } else {
      ghLines.push('      SFCC_CLIENT_SECRET: ${{ secrets.SFCC_CLIENT_SECRET }}');
    }
    ghLines.push(
      '      SFCC_USERNAME: ${{ secrets.SFCC_USERNAME }}',
      '      SFCC_PASSWORD: ${{ secrets.SFCC_PASSWORD }}',
      `      SFCC_SAFETY_LEVEL: ${safetyLevel}`,
      '    steps:',
      '      - uses: actions/checkout@v4',
      '      - uses: actions/setup-node@v4',
      '        with:',
      '          node-version: 22',
      '      - run: npm install -g @salesforce/b2c-cli',
    );
    if (isJwt) {
      ghLines.push(
        '      - name: Write JWT credentials',
        '        run: |',
        '          printf "%s" "${{ secrets.SFCC_JWT_CERT_PEM }}" > cert.pem',
        '          printf "%s" "${{ secrets.SFCC_JWT_KEY_PEM }}" > key.pem',
      );
    }
    ghLines.push('      - run: b2c code deploy --activate');
    if (includeJobs) {
      ghLines.push('      - run: b2c job run ImportCatalogs --wait');
    }
    warnings.push(`Example GitHub Actions workflow:\n\n\`\`\`yaml\n${ghLines.join('\n')}\n\`\`\``);
  } else {
    warnings.push(
      'Generic runners: install the CLI with `npm i -g @salesforce/b2c-cli`, then run `b2c code deploy --code-version=$SFCC_CODE_VERSION --activate` after exporting the SFCC_* env vars from your secret store.',
    );
  }

  if (isJwt) {
    warnings.push(
      'For JWT auth, write the cert/key files to disk in a single setup step (e.g., `echo "$SFCC_JWT_CERT_PEM" > cert.pem`) and point `SFCC_JWT_CERT` / `SFCC_JWT_KEY` at them. Avoid committing certs.',
    );
  }

  if (safetyLevel === 'NONE') {
    warnings.push(
      'You picked SFCC_SAFETY_LEVEL=NONE — destructive operations are not blocked. Reserve this for sandbox-only workflows.',
    );
  }

  return {
    dwJson: dw,
    env: envLines,
    checklist,
    warnings,
    verifyCommand: 'b2c code list',
  };
};
</script>

<template>
  <Wizard
    id="ci-cd"
    title="Set up CI/CD pipeline"
    tagline="Automate cartridge deployment from GitHub Actions or another CI runner."
    intro="CI/CD runs the CLI non-interactively. You'll wire credentials through your runner's secret store, pick an authentication method that works without a human at the keyboard, and choose a safety level so production deploys can't accidentally delete or overwrite data."
    icon="mdi:source-branch"
    :synth="synth"
  >
    <QStep
      id="runner"
      title="Which CI runner are you using?"
      :doc="{path: '/guide/ci-cd', hash: 'overview', label: 'CI/CD overview'}"
    >
      <QChoice
        id="github"
        title="GitHub Actions"
        subtitle="Official actions available"
        icon="mdi:github"
        :badges="[{text: 'Recommended', tone: 'info'}]"
        :contributes="{runner: 'github'}"
      >
        Use the official
        <a href="/b2c-developer-tooling/guide/ci-cd#quick-start-deploy-cartridges">SalesforceCommerceCloud/b2c-developer-tooling</a>
        actions for setup, code deploy, and data import.
      </QChoice>
      <QChoice
        id="generic"
        title="GitLab / Jenkins / Other"
        subtitle="Generic runner"
        icon="mdi:server-outline"
        :contributes="{runner: 'generic'}"
      >
        Install the CLI in your job and load <code>SFCC_*</code> env vars from the runner's secret store.
      </QChoice>
    </QStep>

    <QStep
      id="auth"
      title="How will the runner authenticate?"
      subtitle="Both options are non-interactive — pick what your security policy allows."
      :doc="{path: '/guide/authentication', hash: 'account-manager-api-client', label: 'Account Manager API Client'}"
    >
      <QChoice
        id="client-credentials"
        title="Client Credentials"
        subtitle="Client ID + secret"
        icon="mdi:key-variant"
        :badges="[{text: 'Common', tone: 'quick'}]"
        :contributes="{authMethod: 'client-credentials'}"
      >
        Account Manager API client with a client secret stored in your runner's secret store.
      </QChoice>
      <QChoice
        id="jwt"
        title="JWT Bearer"
        subtitle="Certificate-based"
        icon="mdi:certificate-outline"
        :badges="[{text: 'Preferred where allowed', tone: 'info'}]"
        :contributes="{authMethod: 'jwt'}"
      >
        Use a public/private cert pair instead of a long-lived secret. See
        <a href="/b2c-developer-tooling/guide/authentication#jwt-authentication-certificate-based">JWT setup</a>.
      </QChoice>
    </QStep>

    <QStep
      id="scope"
      title="What will the pipeline deploy?"
      :doc="{path: '/guide/ci-cd', hash: 'quick-start-deploy-cartridges', label: 'Quick Start: Deploy Cartridges'}"
    >
      <QChoice
        id="cartridges"
        title="Cartridges only"
        subtitle="Deploy + activate"
        icon="mdi:cloud-upload-outline"
        :contributes="{deployScope: 'cartridges'}"
      >
        Build, upload, and activate a code version with <code>b2c code deploy</code>.
      </QChoice>
      <QChoice
        id="cartridges-jobs"
        title="Cartridges + job-driven imports"
        subtitle="Adds Jobs OCAPI scope"
        icon="mdi:cog-play-outline"
        :contributes="{deployScope: 'cartridges-jobs'}"
      >
        Also runs site / catalog imports via
        <a href="/b2c-developer-tooling/guide/ci-cd#data-import">b2c-developer-tooling/actions/data-import</a>
        or <code>b2c job run</code>.
      </QChoice>
    </QStep>

    <QStep
      id="safety"
      title="What safety level should the pipeline enforce?"
      subtitle="Set SFCC_SAFETY_LEVEL so destructive operations are blocked at the SDK middleware layer."
      :doc="{path: '/guide/safety', hash: 'safety-levels', label: 'Safety Levels'}"
    >
      <QChoice
        id="none"
        title="NONE"
        subtitle="No restrictions"
        icon="mdi:lock-open-variant-outline"
        :contributes="{safetyLevel: 'NONE'}"
      >
        Default. Acceptable for ephemeral sandbox pipelines only.
      </QChoice>
      <QChoice
        id="no-delete"
        title="NO_DELETE"
        subtitle="Block DELETE operations"
        icon="mdi:lock-outline"
        :badges="[{text: 'Common', tone: 'quick'}]"
        :contributes="{safetyLevel: 'NO_DELETE'}"
      >
        A reasonable default for shared sandboxes — uploads and activations still work.
      </QChoice>
      <QChoice
        id="no-update"
        title="NO_UPDATE"
        subtitle="Block deletes + reset/stop/restart"
        icon="mdi:shield-lock-outline"
        :badges="[{text: 'Recommended', tone: 'info'}]"
        :contributes="{safetyLevel: 'NO_UPDATE'}"
      >
        Recommended for production pipelines — preserves the ability to deploy code while blocking destructive admin ops.
      </QChoice>
      <QChoice
        id="read-only"
        title="READ_ONLY"
        subtitle="Block all writes"
        icon="mdi:eye-lock-outline"
        :contributes="{safetyLevel: 'READ_ONLY'}"
      >
        Audit / verification jobs that should never modify the instance.
      </QChoice>
    </QStep>
  </Wizard>
</template>
