// Adventure: Manage sandboxes (b2c sandbox).
//
// Sandbox commands authenticate via the CLI's built-in public client by
// default, so the simplest path requires zero configuration. This wizard
// branches on auth method (browser / client credentials / JWT) and on how
// the user wants to supply the realm and (optional) credentials.

import {choice, defineAdventure, doc, md, step} from './_authoring.js';
import {check, dwJson, link} from './_helpers.js';

export const sandboxAdventure = defineAdventure({
  id: 'sandbox',
  title: 'Manage sandboxes',
  tagline: 'Create, start/stop, and delete on-demand sandboxes from the CLI.',
  icon: 'mdi:flask-empty-outline',
  tags: ['sandbox', 'ods', 'oauth', 'realm'],
  priority: 'core',
  intro:
    "Sandbox commands work out of the box — the CLI ships with a built-in public client that authenticates you via your browser. For automation or CI you can swap in your own Account Manager API client.",

  steps: [
    step('auth', {
      title: 'How will you authenticate?',
      doc: doc('/guide/authentication', 'account-manager-api-client', 'Account Manager API Client'),
      choices: [
        choice('implicit', {
          title: 'Browser login (default)',
          subtitle: 'Zero config',
          icon: 'mdi:account-arrow-right-outline',
          badges: [{text: 'Quick', tone: 'quick'}],
          body: md`Use the CLI's built-in public client. \`b2c sandbox list\` opens a browser window for login on first use. Your user account just needs the \`Sandbox API User\` role with a tenant filter.`,
          contributes: {authMethod: 'implicit'},
        }),
        choice('client-credentials', {
          title: 'Client Credentials',
          subtitle: 'Recommended for CI/CD',
          icon: 'mdi:key-variant',
          badges: [{text: 'CI', tone: 'quick'}],
          body: md`Account Manager API client with a client secret. Non-interactive — assign the \`Sandbox API User\` role on the client and configure a tenant filter for the realm.`,
          contributes: {authMethod: 'client-credentials'},
        }),
        choice('jwt', {
          title: 'JWT Bearer',
          subtitle: 'Certificate-based',
          icon: 'mdi:certificate-outline',
          body: md`Use a public/private cert pair instead of a secret. See [JWT setup](/guide/authentication#jwt-authentication-certificate-based).`,
          contributes: {authMethod: 'jwt'},
        }),
      ],
    }),

    step('persistence', {
      title: 'How should the CLI find your realm and credentials?',
      subtitle: 'Sandbox commands need a realm — either stored in config or passed via --realm.',
      doc: doc('/guide/configuration', 'configuration-file', 'Configuration file (dw.json)'),
      choices: [
        choice('dw-json', {
          title: 'dw.json (project root)',
          subtitle: 'Recommended',
          icon: 'mdi:file-cog-outline',
          badges: [{text: 'Recommended', tone: 'info'}],
          body: md`Stores \`realm\` (and optional credentials) in a per-project file. Walk-up discovery from the current directory.`,
          contributes: {configSource: 'dw-json'},
        }),
        choice('env', {
          title: '.env / environment variables',
          subtitle: 'Credentials only — pass --realm per command',
          icon: 'mdi:console-line',
          body: md`Use \`SFCC_CLIENT_ID\` / \`SFCC_CLIENT_SECRET\` for OAuth credentials. There is no env var for \`--realm\`, so pass it on each \`b2c sandbox\` invocation (or store it in \`dw.json\`).`,
          contributes: {configSource: 'env'},
        }),
        choice('flags', {
          title: 'Flags on every command',
          subtitle: 'No persistence',
          icon: 'mdi:flag-outline',
          body: md`Pass \`--realm <REALM_ID>\` on every \`b2c sandbox\` invocation. Useful for one-off scripts or when juggling multiple realms.`,
          contributes: {configSource: 'flags'},
        }),
      ],
    }),
  ],

  synthesize(state) {
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
  },
});
