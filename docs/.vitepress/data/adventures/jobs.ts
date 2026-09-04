// Adventure: Run jobs (b2c job).

import {choice, defineAdventure, doc, md, step} from './_authoring.js';
import {check, dwJson, link, ocapiConfig, scopes} from './_helpers.js';

export const jobsAdventure = defineAdventure({
  id: 'jobs',
  title: 'Run jobs',
  tagline: 'Trigger and watch B2C Commerce jobs from the CLI.',
  icon: 'mdi:cog-play-outline',
  tags: ['jobs', 'ocapi', 'oauth', 'automation'],
  priority: 'common',
  intro:
    'Jobs are run via OCAPI. You need an Account Manager API client with OAuth and an OCAPI configuration in Business Manager that grants the Jobs resource.',

  steps: [
    step('instance', {
      title: 'Where will you run jobs?',
      doc: doc('/guide/authentication', 'overview', 'Authentication overview'),
      choices: [
        choice('ods', {
          title: 'On-Demand Sandbox',
          subtitle: 'Realm-managed',
          icon: 'mdi:flask-outline',
          body: md`A short-lived sandbox provisioned via \`b2c sandbox\`.`,
          contributes: {instanceType: 'ods'},
        }),
        choice('primary', {
          title: 'Primary Instance',
          subtitle: 'Development / Staging / Production',
          icon: 'mdi:server',
          body: md`A long-running instance you connect to with hostname + credentials.`,
          contributes: {instanceType: 'primary'},
        }),
      ],
    }),

    step('auth', {
      title: 'How will you authenticate?',
      doc: doc('/guide/authentication', 'account-manager-api-client', 'Account Manager API Client'),
      choices: [
        choice('client-credentials', {
          title: 'Client Credentials',
          subtitle: 'Recommended for CI/CD',
          icon: 'mdi:key-variant',
          badges: [{text: 'CI', tone: 'quick'}],
          body: md`Account Manager API client with a client secret. Non-interactive, ideal for automation.`,
          contributes: {authMethod: 'client-credentials'},
        }),
        choice('jwt', {
          title: 'JWT Bearer',
          subtitle: 'Certificate-based',
          icon: 'mdi:certificate-outline',
          body: md`Use a public/private cert pair instead of a client secret. See [JWT setup](/guide/authentication#jwt-authentication-certificate-based).`,
          contributes: {authMethod: 'jwt'},
        }),
        choice('user-auth', {
          title: 'User Auth (Browser)',
          subtitle: 'Implicit',
          icon: 'mdi:account-arrow-right-outline',
          body: md`Browser-based login. Useful for local development without a stored secret.`,
          contributes: {authMethod: 'implicit'},
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
          body: md`Per-project config file. Walk-up discovery from the current directory.`,
          contributes: {configSource: 'dw-json'},
        }),
        choice('env', {
          title: '.env / environment variables',
          subtitle: 'CI-friendly',
          icon: 'mdi:console-line',
          body: md`Use \`SFCC_*\` environment variables — the CLI also auto-loads \`.env\` files.`,
          contributes: {configSource: 'env'},
        }),
      ],
    }),
  ],

  synthesize(state) {
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
  },
});
