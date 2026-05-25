// Adventure: Deploy cartridge code (b2c code deploy / watch / activate).

import {choice, defineAdventure, doc, md, step} from './_authoring.js';
import {check, dwJson, link, ocapiConfig, scopes} from './_helpers.js';

export const deployCodeAdventure = defineAdventure({
  id: 'deploy-code',
  title: 'Deploy cartridge code',
  tagline: 'Upload, watch, and activate cartridges on a B2C Commerce instance.',
  icon: 'mdi:cloud-upload-outline',
  tags: ['code', 'webdav', 'ocapi', 'deploy', 'sfra', 'cartridges'],
  priority: 'core',
  intro:
    'Code deployment uses WebDAV to upload files. Listing and activating code versions additionally requires OAuth + OCAPI.',

  steps: [
    step('instance', {
      title: 'Where will you deploy?',
      doc: doc('/guide/authentication', 'overview', 'Authentication overview'),
      choices: [
        choice('ods', {
          title: 'On-Demand Sandbox',
          subtitle: 'Realm-managed',
          icon: 'mdi:flask-outline',
          body: md`Short-lived sandbox provisioned with \`b2c sandbox\`.`,
          contributes: {instanceType: 'ods'},
        }),
        choice('primary', {
          title: 'Primary Instance',
          subtitle: 'Development / Staging / Production',
          icon: 'mdi:server',
          body: md`A long-running instance with its own hostname and credentials.`,
          contributes: {instanceType: 'primary'},
        }),
      ],
    }),

    step('webdav', {
      title: 'How will WebDAV authenticate?',
      subtitle: 'WebDAV is required for the actual file upload.',
      doc: doc('/guide/authentication', 'webdav-access', 'WebDAV Access'),
      choices: [
        choice('basic', {
          title: 'BM username + access key',
          subtitle: 'Recommended',
          icon: 'mdi:key-outline',
          badges: [{text: 'Quick', tone: 'quick'}],
          body: md`Best performance for large uploads. Generate the access key in Business Manager.`,
          contributes: {webdavAuth: 'basic'},
        }),
        choice('oauth', {
          title: 'OAuth (client credentials)',
          subtitle: 'Use the same client as OCAPI',
          icon: 'mdi:key-variant',
          body: md`Requires WebDAV Client Permissions configured in BM for your \`client_id\`.`,
          contributes: {webdavAuth: 'oauth'},
        }),
      ],
    }),

    step('activation', {
      title: 'Will you list / activate code versions from the CLI?',
      subtitle: 'b2c code list, activate, delete need OCAPI.',
      doc: doc('/guide/authentication', 'ocapi-configuration', 'OCAPI Configuration'),
      choices: [
        choice('yes', {
          title: 'Yes — full lifecycle',
          subtitle: 'list / activate / delete',
          icon: 'mdi:check-circle-outline',
          badges: [{text: 'Recommended', tone: 'info'}],
          body: md`Adds an Account Manager API client and an OCAPI Data API entry for \`/code_versions\`.`,
          contributes: {needsOcapi: true},
        }),
        choice('no', {
          title: 'No — upload only',
          subtitle: 'b2c code deploy / watch',
          icon: 'mdi:upload',
          body: md`Skip OCAPI. You can still upload but will need to activate code versions in BM manually.`,
          contributes: {needsOcapi: false},
        }),
      ],
    }),

    step('persistence', {
      title: 'How should the CLI find your config?',
      doc: doc('/guide/configuration', 'configuration-file', 'Configuration file (dw.json)'),
      choices: [
        choice('dw-json', {
          title: 'dw.json (project root)',
          subtitle: 'Recommended',
          icon: 'mdi:file-cog-outline',
          body: md`Per-project config file with walk-up discovery.`,
          contributes: {configSource: 'dw-json'},
        }),
        choice('env', {
          title: '.env / environment variables',
          subtitle: 'CI-friendly',
          icon: 'mdi:console-line',
          body: md`Use \`SFCC_*\` env vars; the CLI auto-loads a \`.env\` file.`,
          contributes: {configSource: 'env'},
        }),
      ],
    }),
  ],

  synthesize(state) {
    const useBasic = state.webdavAuth === 'basic';
    const needsOcapi = state.needsOcapi === true;
    const useEnv = state.configSource === 'env';

    const dw = useEnv
      ? '# Using environment variables — see .env tab below.'
      : dwJson({
          hostname: true,
          codeVersion: 'version1',
          username: useBasic,
          password: useBasic,
          clientId: needsOcapi || !useBasic,
          clientSecret: needsOcapi || !useBasic,
        });

    const envLines = [
      'SFCC_SERVER=<INSTANCE>.dx.commercecloud.salesforce.com',
      'SFCC_CODE_VERSION=version1',
      useBasic ? 'SFCC_USERNAME=<BM_USERNAME>' : '',
      useBasic ? 'SFCC_PASSWORD=<WEBDAV_ACCESS_KEY>' : '',
      needsOcapi || !useBasic ? 'SFCC_CLIENT_ID=<CLIENT_ID>' : '',
      needsOcapi || !useBasic ? 'SFCC_CLIENT_SECRET=<CLIENT_SECRET>' : '',
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
      ...(needsOcapi
        ? [
            check(
              'Create an Account Manager API client (if not already)',
              link('/guide/authentication', 'creating-an-api-client', 'Creating an API Client'),
            ),
            check(
              `Add Default Scopes: ${scopes('baseline')}`,
              link('/guide/authentication', 'configuring-scopes', 'Configuring Scopes'),
            ),
            check(
              'Enable code_versions in OCAPI Data API (Business Manager)',
              link('/guide/authentication', 'ocapi-configuration', 'OCAPI Configuration'),
            ),
          ]
        : []),
      check(
        useEnv ? 'Set SFCC_* environment variables' : 'Save the dw.json snippet to your project root',
        link(
          '/guide/configuration',
          useEnv ? 'environment-variables' : 'configuration-file',
          useEnv ? 'Environment Variables' : 'Configuration File',
        ),
      ),
    ];

    const warnings: string[] = [];
    if (needsOcapi) {
      warnings.push(
        `Paste this OCAPI Data API config into Business Manager (Site Development → Open Commerce API Settings → Data API):\n\n\`\`\`json\n${ocapiConfig('<CLIENT_ID>', ['codeVersions'])}\n\`\`\``,
      );
    }
    if (state.instanceType === 'ods') {
      warnings.push('On ODS, hostname and credentials change per sandbox — refresh dw.json with `b2c sandbox info`.');
    }

    return {
      dwJson: dw,
      env: useEnv ? envLines : undefined,
      checklist,
      warnings,
      verifyCommand: needsOcapi ? 'b2c code list' : 'b2c webdav ls --root=cartridges',
    };
  },
});
