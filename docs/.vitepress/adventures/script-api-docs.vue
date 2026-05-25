<!--
  Download API Docs · Quickstart adventure.

  Page shim: docs/quickstart/script-api-docs.md
-->
<script setup lang="ts">
import {check, dwJson, link} from '../data/adventures/_helpers.js';
import type {Synthesizer} from '../theme/adventure/declarative/wizard-context.js';

const synth: Synthesizer = (state) => {
  const isDownload = state.mode === 'download';
  const useBasic = state.webdavAuth === 'basic';
  const useEnv = state.configSource === 'env';

  // Bundled mode requires no configuration at all.
  if (!isDownload) {
    return {
      dwJson: '# No config required — bundled docs work offline.',
      checklist: [
        check(
          'Run `b2c docs search <term>` to query the bundled Script API docs',
          link('/cli/docs', undefined, 'Docs Commands'),
        ),
      ],
      warnings: [
        'Bundled docs ship with the CLI release — versions track the CLI itself, not your instance. Run `b2c docs schema --list` to see the bundled XSD schemas (catalog, order, etc.) available for offline XML validation.',
      ],
      verifyCommand: 'b2c docs search isCreate',
    };
  }

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
            'Configure WebDAV Client Permissions in Business Manager',
            link('/guide/authentication', 'webdav-access', 'WebDAV Access'),
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
    check(
      'Run `b2c docs download ./docs` to fetch fresh docs from your instance',
      link('/cli/docs', undefined, 'Docs Commands'),
    ),
  ];

  return {
    dwJson: dw,
    env: useEnv ? envLines : undefined,
    checklist,
    warnings: [
      'After downloading, point `b2c docs search` and `b2c docs read` at the extracted directory — or replace the bundled docs to make instance-specific APIs available everywhere.',
    ],
    verifyCommand: 'b2c docs download ./docs',
  };
};
</script>

<template>
  <Wizard
    id="script-api-docs"
    title="Download API Docs"
    tagline="Search and read instance-specific Script API documentation offline."
    intro="The CLI ships with bundled Script API docs and XSD schemas — search and read work offline with zero config. Only download fresh docs if you need APIs specific to your instance version."
    icon="mdi:book-open-page-variant-outline"
    :synth="synth"
  >
    <QStep
      id="mode"
      title="Bundled docs or download fresh?"
      :doc="{path: '/cli/docs', label: 'Docs Commands'}"
    >
      <QChoice
        id="bundled"
        title="Use bundled docs"
        subtitle="Zero config · offline"
        icon="mdi:book-open-outline"
        :badges="[{text: 'Quick', tone: 'quick'}]"
        :contributes="{mode: 'bundled'}"
      >
        <code>b2c docs search</code>, <code>b2c docs read</code>, and <code>b2c docs schema</code> work
        immediately against docs shipped with the CLI release. No credentials required.
      </QChoice>
      <QChoice
        id="download"
        title="Download from an instance"
        subtitle="Instance-specific APIs"
        icon="mdi:cloud-download-outline"
        :contributes="{mode: 'download'}"
      >
        Use <code>b2c docs download</code> to pull the Script API docs from a specific instance over
        WebDAV. Useful when you need APIs that match the instance version exactly.
      </QChoice>
    </QStep>

    <QStep
      id="webdav"
      title="How will WebDAV authenticate?"
      subtitle="b2c docs download fetches the docs archive over WebDAV."
      :showIf="(state) => state.mode === 'download'"
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
        Generate a WebDAV access key for your Business Manager user — fastest path to a
        successful <code>b2c docs download</code>.
      </QChoice>
      <QChoice
        id="oauth"
        title="OAuth (client credentials)"
        subtitle="Reuse an Account Manager client"
        icon="mdi:key-variant"
        :contributes="{webdavAuth: 'oauth'}"
      >
        Use an Account Manager API client with WebDAV Client Permissions configured in BM for
        your <code>client_id</code>.
      </QChoice>
    </QStep>

    <QStep
      id="persistence"
      title="How should the CLI find your config?"
      :showIf="(state) => state.mode === 'download'"
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
