// Adventure: Manage SLAS clients (b2c slas).
//
// Walks the user through configuring auth + tenant for the SLAS commands.
// Two main surfaces:
//   - "management": `b2c slas client list/create/get/update/delete/open` —
//     authenticated against the SLAS Admin API. Built-in public client works
//     out of the box (browser login as a user with the SLAS Organization
//     Administrator role + tenant filter). Server-side automation can use a
//     custom Account Manager API client with the Sandbox API User role.
//   - "token": `b2c slas token` — fetches a shopper access token. Needs the
//     SLAS client id (public or private), site id, short-code, and tenant id.

import {choice, defineAdventure, doc, md, step} from './_authoring.js';
import {check, dwJson, link} from './_helpers.js';

export const slasClientsAdventure = defineAdventure({
  id: 'slas-clients',
  title: 'Manage SLAS clients',
  tagline: 'Create and configure Shopper Login & Access Service (SLAS) clients for headless storefronts.',
  icon: 'mdi:account-key-outline',
  tags: ['slas', 'headless', 'shopper', 'oauth'],
  priority: 'specialized',
  intro:
    "SLAS commands work out of the box — the CLI's built-in public client authenticates you via browser login. You only need to set up a custom Account Manager API client for automation/CI. The SLAS Admin API is scoped per tenant, so a tenant id is always required.",

  steps: [
    step('surface', {
      title: 'What do you want to do?',
      doc: doc('/cli/slas', undefined, 'SLAS Commands'),
      choices: [
        choice('management', {
          title: 'Manage SLAS clients',
          subtitle: 'b2c slas client create / list / get / update / delete',
          icon: 'mdi:cog-outline',
          badges: [{text: 'Recommended', tone: 'info'}],
          body: md`
            Create and inspect SLAS clients (public or private) on a tenant. Uses the
            [SLAS Admin API](/cli/slas).
          `,
          contributes: {surface: 'management'},
        }),
        choice('token', {
          title: 'Fetch shopper tokens',
          subtitle: 'b2c slas token',
          icon: 'mdi:key-chain-variant',
          body: md`
            Mint a guest or registered-shopper access token against an existing SLAS client. Useful for testing
            Shopper APIs from \`curl\` or your headless storefront.
          `,
          contributes: {surface: 'token'},
        }),
      ],
    }),

    step('auth', {
      title: 'How will you authenticate to the SLAS Admin API?',
      doc: doc('/guide/authentication', 'account-manager-api-client', 'Account Manager API Client'),
      choices: [
        choice('implicit', {
          title: 'Browser login (default)',
          subtitle: 'Zero config',
          icon: 'mdi:account-arrow-right-outline',
          badges: [{text: 'Quick', tone: 'quick'}],
          body: md`
            Use the CLI's built-in public client. \`b2c slas client list\` opens a browser window for login on first
            use. Your user account just needs the \`SLAS Organization Administrator\` role with a tenant filter.
          `,
          contributes: {authMethod: 'implicit'},
        }),
        choice('client-credentials', {
          title: 'Client Credentials',
          subtitle: 'Recommended for CI/CD',
          icon: 'mdi:key-variant',
          badges: [{text: 'CI', tone: 'quick'}],
          body: md`
            Account Manager API client with a client secret. Non-interactive — assign the
            \`Sandbox API User\` role on the client and configure a
            [tenant filter](/guide/authentication#configuring-tenant-filter) for the tenant.
          `,
          contributes: {authMethod: 'client-credentials'},
        }),
      ],
    }),

    step('slas-client-type', {
      title: 'Which kind of SLAS client will you mint a token for?',
      subtitle: 'Public clients use PKCE (no secret). Private clients use client_credentials.',
      showIf: (state) => state.surface === 'token',
      doc: doc('/cli/slas', undefined, 'b2c slas token'),
      choices: [
        choice('public', {
          title: 'Public client (PKCE)',
          subtitle: 'Browser / mobile / SPA',
          icon: 'mdi:web',
          badges: [{text: 'Recommended', tone: 'info'}],
          body: md`
            No secret — the CLI uses the authorization_code_pkce flow. This is the right choice for headless
            storefronts (PWA Kit, Storefront Next) and any browser-side code.
          `,
          contributes: {slasClientType: 'public'},
        }),
        choice('private', {
          title: 'Private client (client_credentials)',
          subtitle: 'Server-side only',
          icon: 'mdi:server-security',
          body: md`
            Has a client secret. Use only for trusted server-to-server code paths — never embed in a browser
            or mobile bundle.
          `,
          contributes: {slasClientType: 'private'},
        }),
      ],
    }),

    step('persistence', {
      title: 'How should the CLI find your tenant id and credentials?',
      subtitle: '--tenant-id is required on every SLAS command — store it once or pass it on each invocation.',
      doc: doc('/guide/configuration', 'configuration-file', 'Configuration file (dw.json)'),
      choices: [
        choice('dw-json', {
          title: 'dw.json (project root)',
          subtitle: 'Recommended',
          icon: 'mdi:file-cog-outline',
          badges: [{text: 'Recommended', tone: 'info'}],
          body: md`
            Stores \`tenant-id\` (plus credentials and any token-flow values) in a per-project file.
            Walk-up discovery from the current directory.
          `,
          contributes: {configSource: 'dw-json'},
        }),
        choice('env', {
          title: '.env / environment variables',
          subtitle: 'CI-friendly',
          icon: 'mdi:console-line',
          body: md`
            Use \`SFCC_TENANT_ID\` (and \`SFCC_SLAS_CLIENT_ID\`, \`SFCC_SITE_ID\`,
            \`SFCC_SHORTCODE\` for the token flow). The CLI auto-loads \`.env\` files.
          `,
          contributes: {configSource: 'env'},
        }),
        choice('flags', {
          title: 'Flags on every command',
          subtitle: 'No persistence',
          icon: 'mdi:flag-outline',
          body: md`
            Pass \`--tenant-id <TENANT_ID>\` (and friends) on every \`b2c slas\`
            invocation. Useful for one-off scripts or when juggling multiple tenants.
          `,
          contributes: {configSource: 'flags'},
        }),
      ],
    }),
  ],

  synthesize(state) {
    const surface = String(state.surface ?? 'management');
    const isToken = surface === 'token';
    const authMethod = String(state.authMethod ?? 'implicit');
    const isImplicit = authMethod === 'implicit';
    const isClientCreds = authMethod === 'client-credentials';

    const configSource = String(state.configSource ?? 'dw-json');
    const useEnv = configSource === 'env';
    const useFlags = configSource === 'flags';

    const isPrivate = state.slasClientType === 'private';

    // -----------------------------------------------------------------
    // dw.json + env synthesis
    // -----------------------------------------------------------------

    let dw: string;
    if (useFlags) {
      dw = isToken
        ? '# No config file needed — pass --tenant-id, --site-id, --short-code, and --slas-client-id on every command.\n# Example:\n#   b2c slas token --tenant-id <TENANT_ID> --site-id <SITE_ID> --short-code <SCAPI_SHORT_CODE>'
        : '# No config file needed — pass --tenant-id on every command.\n# Example:\n#   b2c slas client list --tenant-id <TENANT_ID>';
    } else if (useEnv) {
      dw = '# Using environment variables — see .env tab below.';
    } else if (isToken) {
      // dw.json doesn't have a first-class `site-id` placeholder builder, so
      // assemble it by hand for the token surface.
      const lines = [
        '{',
        '  "tenant-id": "<TENANT_ID>",',
        '  "short-code": "<SCAPI_SHORT_CODE>",',
        '  "site-id": "<SITE_ID>",',
        '  "slas-client-id": "<SLAS_CLIENT_ID>"',
      ];
      if (isClientCreds) {
        lines[lines.length - 1] += ',';
        lines.push('  "client-id": "<CLIENT_ID>",', '  "client-secret": "<CLIENT_SECRET>"');
      }
      lines.push('}');
      dw = lines.join('\n');
    } else {
      // Management surface, dw-json
      dw = dwJson({
        tenantId: true,
        clientId: isClientCreds,
        clientSecret: isClientCreds,
      });
    }

    let env: string | undefined;
    if (useEnv) {
      const lines: string[] = ['SFCC_TENANT_ID=<TENANT_ID>'];
      if (isToken) {
        lines.push('SFCC_SITE_ID=<SITE_ID>');
        lines.push('SFCC_SHORTCODE=<SCAPI_SHORT_CODE>');
        lines.push('SFCC_SLAS_CLIENT_ID=<SLAS_CLIENT_ID>');
        if (isPrivate) {
          lines.push('SFCC_SLAS_CLIENT_SECRET=<SLAS_CLIENT_SECRET>');
        }
      }
      if (isClientCreds) {
        lines.push('SFCC_CLIENT_ID=<CLIENT_ID>');
        lines.push('SFCC_CLIENT_SECRET=<CLIENT_SECRET>');
      }
      env = lines.join('\n');
    }

    // -----------------------------------------------------------------
    // Checklist
    // -----------------------------------------------------------------

    const checklist = [
      ...(isImplicit
        ? [
            check(
              'Sign in with the built-in client (browser login on first command)',
              link('/cli/slas', undefined, 'SLAS Commands'),
            ),
            check(
              'Confirm your user has the SLAS Organization Administrator role with a tenant filter',
              link('/guide/authentication', 'for-user-authentication-roles-on-user', 'Roles for User Authentication'),
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
              'Add a tenant filter for your tenant/realm on the Sandbox API User role',
              link('/guide/authentication', 'configuring-tenant-filter', 'Configuring Tenant Filter'),
            ),
          ]),
      ...(useFlags
        ? [
            check(
              isToken
                ? 'Pass --tenant-id, --site-id, --short-code (and --slas-client-id) on every slas token command'
                : 'Pass --tenant-id on every slas client command',
              link('/cli/slas', undefined, 'SLAS Commands'),
            ),
          ]
        : [
            check(
              useEnv
                ? `Set SFCC_TENANT_ID${isToken ? ' + SFCC_SITE_ID + SFCC_SHORTCODE + SFCC_SLAS_CLIENT_ID' : ''}${isClientCreds ? ' + SFCC_CLIENT_ID/SECRET' : ''}`
                : `Save tenant-id${isToken ? ' + short-code + site-id + slas-client-id' : ''} to dw.json`,
              link(
                '/guide/configuration',
                useEnv ? 'environment-variables' : 'configuration-file',
                useEnv ? 'Environment Variables' : 'Configuration File',
              ),
            ),
          ]),
      ...(isToken
        ? [
            check(
              'Note the SLAS client id (and secret, if private) from `b2c slas client create` output or Business Manager',
              link('/cli/slas', undefined, 'b2c slas client create'),
            ),
          ]
        : []),
    ];

    // -----------------------------------------------------------------
    // Warnings
    // -----------------------------------------------------------------

    const warnings: string[] = [];
    if (isImplicit) {
      warnings.push(
        'Browser auth opens a login window the first time and on token expiry. Great for local development; use client credentials for CI/CD.',
      );
    }
    if (isToken) {
      warnings.push(
        'SLAS public clients (created with `--public`) have no secret — use the PKCE flow by omitting `--slas-client-secret`. Use private clients only for trusted server-side code.',
      );
      if (!isPrivate) {
        warnings.push(
          'If you omit `--slas-client-id`, `b2c slas token` auto-discovers the first public SLAS client for the tenant. Pin the id explicitly for reproducible CI runs.',
        );
      }
    }

    // -----------------------------------------------------------------
    // Verify command
    // -----------------------------------------------------------------

    let verifyCommand: string;
    if (isToken) {
      verifyCommand = isPrivate
        ? 'b2c slas token --tenant-id <TENANT_ID> --site-id <SITE_ID> --short-code <SCAPI_SHORT_CODE> --slas-client-id <SLAS_CLIENT_ID> --slas-client-secret <SLAS_CLIENT_SECRET>'
        : 'b2c slas token --tenant-id <TENANT_ID> --site-id <SITE_ID> --short-code <SCAPI_SHORT_CODE> --slas-client-id <SLAS_CLIENT_ID>';
    } else {
      verifyCommand = 'b2c slas client list --tenant-id <TENANT_ID>';
    }

    return {
      dwJson: dw,
      env,
      checklist,
      warnings,
      verifyCommand,
    };
  },
});
