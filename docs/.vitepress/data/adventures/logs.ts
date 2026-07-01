// Adventure: Tail and search logs (b2c logs).

import {choice, defineAdventure, doc, md, step} from './_authoring.js';
import {check, dwJson, link} from './_helpers.js';

export const logsAdventure = defineAdventure({
  id: 'logs',
  title: 'Tail and search logs',
  tagline: 'Stream and filter B2C Commerce instance logs from the terminal.',
  icon: 'mdi:text-search',
  tags: ['logs', 'webdav', 'debugging'],
  priority: 'common',
  intro:
    'Logs commands (b2c logs tail, get, list) read log files over WebDAV. You only need WebDAV credentials — no OCAPI configuration required.',

  steps: [
    step('webdav', {
      title: 'How will WebDAV authenticate?',
      subtitle: "Logs are read directly from the instance's WebDAV log share.",
      doc: doc('/guide/authentication', 'webdav-access', 'WebDAV Access'),
      choices: [
        choice('basic', {
          title: 'BM username + access key',
          subtitle: 'Recommended',
          icon: 'mdi:key-outline',
          badges: [{text: 'Quick', tone: 'quick'}],
          body: md`Generate a WebDAV access key for your Business Manager user. Fastest path to a working \`b2c logs tail\`.`,
          contributes: {webdavAuth: 'basic'},
        }),
        choice('oauth', {
          title: 'OAuth (client credentials)',
          subtitle: 'Reuse an Account Manager client',
          icon: 'mdi:key-variant',
          body: md`Use an Account Manager API client. Requires WebDAV Client Permissions configured in BM for your \`client_id\`.`,
          contributes: {webdavAuth: 'oauth'},
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
          body: md`Per-project config file with walk-up discovery from the current directory.`,
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
  },
});
