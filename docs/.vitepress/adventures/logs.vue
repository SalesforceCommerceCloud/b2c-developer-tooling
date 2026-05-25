<!--
  Tail and search logs · Quickstart adventure.

  Page shim: docs/quickstart/logs.md
-->
<script setup lang="ts">
import {check, dwJson, link} from '../data/adventures/_helpers.js';
import type {Synthesizer} from '../theme/adventure/declarative/wizard-context.js';

const synth: Synthesizer = (state) => {
  const useBasic = state.webdavAuth === 'basic';
  const useEnv = state.configSource === 'env';

  const dw = useEnv
    ? '# Using environment variables — see .env tab below.'
    : dwJson({
        hostname: true,
        username: useBasic,
        password: useBasic,
        clientId: !useBasic,
        clientSecret: !useBasic,
      });

  const envLines = [
    'SFCC_SERVER=<INSTANCE>.dx.commercecloud.salesforce.com',
    useBasic ? 'SFCC_USERNAME=<BM_USERNAME>' : '',
    useBasic ? 'SFCC_PASSWORD=<WEBDAV_ACCESS_KEY>' : '',
    !useBasic ? 'SFCC_CLIENT_ID=<CLIENT_ID>' : '',
    !useBasic ? 'SFCC_CLIENT_SECRET=<CLIENT_SECRET>' : '',
  ]
    .filter(Boolean)
    .join('\n');

  const checklist = [
    ...(useBasic
      ? [
          check(
            'Generate a WebDAV access key for your BM user',
            link('/guide/authentication', 'option-a-basic-authentication-recommended', 'Basic Authentication'),
          ),
        ]
      : [
          check(
            'Create an Account Manager API client',
            link('/guide/authentication', 'creating-an-api-client', 'Creating an API Client'),
          ),
          check(
            'Configure WebDAV Client Permissions in Business Manager',
            link('/guide/authentication', 'option-b-oauth-based-webdav', 'OAuth-based WebDAV'),
          ),
        ]),
    check(
      useEnv ? 'Set SFCC_* environment variables' : 'Save the dw.json snippet to your project root',
      link(
        '/guide/configuration',
        useEnv ? 'environment-variables' : 'configuration-file',
        useEnv ? 'Environment Variables' : 'Configuration File',
      ),
    ),
  ];

  const warnings: string[] = [
    'Filter aggressively to avoid noise. Example — recent ERROR entries containing "OutOfMemory":\n\n```bash\nb2c logs get --level error --since 1h --search "OutOfMemory"\n```',
    'Tail in real-time with rich filtering — runs until Ctrl+C:\n\n```bash\nb2c logs tail --filter customerror --level ERROR --search "OrderMgr"\n```',
  ];

  return {
    dwJson: dw,
    env: useEnv ? envLines : undefined,
    checklist,
    warnings,
    verifyCommand: 'b2c logs get --count 10',
  };
};
</script>

<template>
  <Wizard
    id="logs"
    title="Tail and search logs"
    tagline="Stream and filter B2C Commerce instance logs from the terminal."
    intro="Logs commands (b2c logs tail, get, list) read log files over WebDAV. You only need WebDAV credentials — no OCAPI configuration required."
    icon="mdi:text-search"
    :synth="synth"
  >
    <QStep
      id="webdav"
      title="How will WebDAV authenticate?"
      subtitle="Logs are read directly from the instance's WebDAV log share."
      :doc="{path: '/guide/authentication', hash: 'webdav-access', label: 'WebDAV Access'}"
    >
      <QChoice
        id="basic"
        title="BM username + access key"
        subtitle="Recommended"
        icon="mdi:key-outline"
        :badges="[{text: 'Quick', tone: 'quick'}]"
        :contributes="{webdavAuth: 'basic'}"
      >
        Generate a WebDAV access key for your Business Manager user. Fastest path to a working
        <code>b2c logs tail</code>.
      </QChoice>
      <QChoice
        id="oauth"
        title="OAuth (client credentials)"
        subtitle="Reuse an Account Manager client"
        icon="mdi:key-variant"
        :contributes="{webdavAuth: 'oauth'}"
      >
        Use an Account Manager API client. Requires WebDAV Client Permissions configured in BM
        for your <code>client_id</code>.
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
        Per-project config file with walk-up discovery from the current directory.
      </QChoice>
      <QChoice
        id="env"
        title=".env / environment variables"
        subtitle="CI-friendly"
        icon="mdi:console-line"
        :contributes="{configSource: 'env'}"
      >
        Use <code>SFCC_*</code> env vars; the CLI auto-loads a <code>.env</code> file.
      </QChoice>
    </QStep>
  </Wizard>
</template>
