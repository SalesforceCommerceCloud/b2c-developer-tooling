// Adventure: Manage site cartridge paths (b2c sites cartridges).

import {choice, defineAdventure, doc, md, step} from './_authoring.js';
import {check, dwJson, link, ocapiConfig, scopes} from './_helpers.js';

export const cartridgePathAdventure = defineAdventure({
  id: 'cartridge-path',
  title: 'Manage site cartridge paths',
  tagline: "List, add, remove, or reorder cartridges in a site's cartridge path.",
  icon: 'mdi:layers-outline',
  tags: ['sites', 'cartridges', 'deploy'],
  priority: 'common',
  intro:
    'b2c sites cartridges manages the ordered list of cartridges active on a storefront. It uses OAuth + OCAPI by default and falls back to site archive import/export when /sites/*/cartridges OCAPI permissions are not available.',

  steps: [
    step('operation', {
      title: 'What do you want to do?',
      subtitle: 'Read-only operations are always safe; destructive operations honor safety mode.',
      doc: doc('/cli/sites', undefined, 'Sites command reference'),
      choices: [
        choice('list', {
          title: 'List cartridge path',
          subtitle: 'Read-only inspection',
          icon: 'mdi:format-list-bulleted',
          badges: [{text: 'Quick', tone: 'quick'}],
          body: md`\`b2c sites cartridges list\` — show the ordered cartridges for a site.`,
          contributes: {operation: 'list'},
        }),
        choice('add', {
          title: 'Add a cartridge',
          subtitle: 'Insert at first / last / before / after',
          icon: 'mdi:playlist-plus',
          body: md`\`b2c sites cartridges add <cartridge> --position <first|last|before|after> --target <name>\`.`,
          contributes: {operation: 'add'},
        }),
        choice('remove', {
          title: 'Remove a cartridge',
          subtitle: 'Destructive — gated by safety mode',
          icon: 'mdi:playlist-minus',
          badges: [{text: 'Complex', tone: 'complex'}],
          body: md`\`b2c sites cartridges remove <cartridge>\`. Blocked when \`SFCC_SAFETY_LEVEL\` is \`NO_DELETE\` or stricter (default \`NONE\` allows).`,
          contributes: {operation: 'remove'},
        }),
        choice('set', {
          title: 'Replace cartridge path',
          subtitle: 'Destructive — overwrites the entire path',
          icon: 'mdi:swap-horizontal',
          badges: [{text: 'Complex', tone: 'complex'}],
          body: md`\`b2c sites cartridges set "cart1:cart2:cart3"\`. Blocked when \`SFCC_SAFETY_LEVEL\` is \`NO_DELETE\` or stricter (default \`NONE\` allows).`,
          contributes: {operation: 'set'},
        }),
      ],
    }),

    step('auth', {
      title: 'How will the CLI talk to /sites?',
      subtitle:
        'The default path is OAuth + OCAPI; if /sites/*/cartridges is not granted, the CLI falls back to site archive import.',
      doc: doc('/guide/authentication', 'account-manager-api-client', 'Account Manager API Client'),
      choices: [
        choice('ocapi-direct', {
          title: 'OAuth + OCAPI (direct)',
          subtitle: 'Recommended',
          icon: 'mdi:key-variant',
          badges: [{text: 'Recommended', tone: 'info'}],
          body: md`Account Manager API client with OCAPI permissions for \`/sites\`, \`/sites/*\`, and \`/sites/*/cartridges\`. Fastest and most direct.`,
          contributes: {authStrategy: 'ocapi-direct'},
        }),
        choice('bm-fallback', {
          title: 'Site archive fallback',
          subtitle: 'When /sites/*/cartridges OCAPI access is not available',
          icon: 'mdi:archive-arrow-down-outline',
          body: md`Uses \`sfcc-site-archive-import\` + WebDAV \`Impex/\`. Use the \`--bm\` flag (shorthand for \`--site-id Sites-Site\`) to target the Business Manager cartridge path; BM updates always go through this fallback.`,
          contributes: {authStrategy: 'bm-fallback'},
        }),
      ],
    }),

    step('persistence', {
      title: 'How should the CLI find your config?',
      subtitle: 'The site ID is always passed via --site-id (or --bm).',
      doc: doc('/guide/configuration', 'configuration-file', 'Configuration file (dw.json)'),
      choices: [
        choice('dw-json', {
          title: 'dw.json (project root)',
          subtitle: 'Recommended',
          icon: 'mdi:file-cog-outline',
          body: md`Per-project config file with walk-up discovery. Pass \`--site-id <SITE_ID>\` on each invocation.`,
          contributes: {configSource: 'dw-json'},
        }),
        choice('env', {
          title: '.env / environment variables',
          subtitle: 'CI-friendly',
          icon: 'mdi:console-line',
          body: md`Use \`SFCC_*\` env vars for hostname + credentials; the CLI auto-loads a \`.env\` file. Note: there is no \`SFCC_SITE_ID\` for these commands — \`--site-id\` (or \`--bm\`) is required on every invocation.`,
          contributes: {configSource: 'env'},
        }),
      ],
    }),
  ],

  synthesize(state) {
    const op = (state.operation as string) ?? 'list';
    const isDestructive = op === 'remove' || op === 'set';
    const useBmFallback = state.authStrategy === 'bm-fallback';
    const useEnv = state.configSource === 'env';

    const dw = useEnv
      ? '# Using environment variables — see .env tab below.'
      : dwJson({hostname: true, clientId: true, clientSecret: true});

    const env = useEnv
      ? [
          'SFCC_SERVER=<INSTANCE>.dx.commercecloud.salesforce.com',
          'SFCC_CLIENT_ID=<CLIENT_ID>',
          'SFCC_CLIENT_SECRET=<CLIENT_SECRET>',
        ].join('\n')
      : undefined;

    const ocapi = useBmFallback
      ? ocapiConfig('<CLIENT_ID>', ['sites'])
      : ocapiConfig('<CLIENT_ID>', ['sites', 'siteCartridges']);

    const checklist = [
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
        useBmFallback
          ? 'Enable /sites and /sites/* in OCAPI Data API (Business Manager)'
          : 'Enable /sites, /sites/*, and /sites/*/cartridges in OCAPI Data API (Business Manager)',
        link('/guide/authentication', 'ocapi-configuration', 'OCAPI Configuration'),
      ),
      ...(useBmFallback
        ? [
            check(
              'Grant Job Execution permission for sfcc-site-archive-import (BM fallback only)',
              link('/guide/authentication', 'ocapi-configuration', 'OCAPI Configuration'),
            ),
            check(
              'Grant WebDAV write access to /Impex (BM fallback only)',
              link('/guide/authentication', 'webdav-access', 'WebDAV Access'),
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

    const warnings: string[] = [
      `Paste the following block into Business Manager → Administration → Site Development → Open Commerce API Settings → Data API:\n\n\`\`\`json\n${ocapi}\n\`\`\``,
    ];

    if (isDestructive) {
      warnings.push(
        'Destructive cartridge-path commands (`remove`, `set`) are blocked when `SFCC_SAFETY_LEVEL` is `NO_DELETE` or stricter. For production sites, prefer `b2c sites cartridges add --position <before|after> --target <cartridge>` over wholesale `set`.',
      );
    }

    if (useBmFallback) {
      warnings.push(
        'Without `/sites/*/cartridges` OCAPI permissions, the CLI falls back to site archive import/export — which requires `sfcc-site-archive-import` job execution permission and WebDAV write access to `Impex/`.',
      );
    }

    const verifyCommand = 'b2c sites cartridges list --site-id <SITE_ID>';

    return {
      dwJson: dw,
      env,
      checklist,
      warnings,
      verifyCommand,
    };
  },
});
