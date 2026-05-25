// Adventure: Migrate from sfcc-ci.
//
// Mirrors docs/guide/sfcc-ci-migration.md. The synthesized output's most
// valuable artifact is the side-by-side command translation table, plus a
// CI snippet showing the new env-var-based auth pattern.

import {choice, defineAdventure, doc, md, step} from './_authoring.js';
import {check, dwJson, link} from './_helpers.js';

// Side-by-side translation table rows, grouped by command surface.
const ROWS_BY_COMMAND: Record<string, string[]> = {
  auth: [
    '| `sfcc-ci client:auth <id> <secret>` | `b2c auth client --client-id <id> --client-secret <secret>` |',
    '| `sfcc-ci client:auth:renew` | `b2c auth client renew` |',
    '| `sfcc-ci client:auth:token` | `b2c auth client token` |',
  ],
  code: [
    '| `sfcc-ci code:list` | `b2c code list` |',
    '| `sfcc-ci code:deploy <archive>` | `b2c code deploy --activate` |',
    '| `sfcc-ci code:activate <version>` | `b2c code activate <version>` |',
    '| `sfcc-ci code:delete` | `b2c code delete` |',
  ],
  instance: [
    '| `sfcc-ci instance:upload <file>` | `b2c webdav put <file> <remote-path>` |',
    '| `sfcc-ci instance:import <archive>` | `b2c webdav put <archive> /Impex/src/instance/<archive>` then `b2c job run sfcc-site-archive-import --wait` |',
    '| `sfcc-ci instance:export` | `b2c content export` |',
  ],
  job: [
    '| `sfcc-ci job:run <id>` | `b2c job run <id> --wait` |',
    '| `sfcc-ci job:status <id> <exec>` | `b2c job wait <id> <exec>` |',
  ],
  sandbox: [
    '| `sfcc-ci sandbox:list` | `b2c sandbox list` |',
    '| `sfcc-ci sandbox:create` | `b2c sandbox create` |',
    '| `sfcc-ci sandbox:delete` | `b2c sandbox delete` |',
    '| `sfcc-ci sandbox:reset` | `b2c sandbox reset` |',
  ],
};

const SURFACE_ROWS: Record<string, string[]> = {
  'code-deploy': [...ROWS_BY_COMMAND.auth, ...ROWS_BY_COMMAND.code],
  'data-import': [...ROWS_BY_COMMAND.auth, ...ROWS_BY_COMMAND.instance, ...ROWS_BY_COMMAND.job],
  jobs: [...ROWS_BY_COMMAND.auth, ...ROWS_BY_COMMAND.job],
  sandbox: [...ROWS_BY_COMMAND.auth, ...ROWS_BY_COMMAND.sandbox],
  all: [
    ...ROWS_BY_COMMAND.auth,
    ...ROWS_BY_COMMAND.code,
    ...ROWS_BY_COMMAND.instance,
    ...ROWS_BY_COMMAND.job,
    ...ROWS_BY_COMMAND.sandbox,
  ],
};

export const migrateSfccCiAdventure = defineAdventure({
  id: 'migrate-sfcc-ci',
  title: 'Migrate from sfcc-ci',
  tagline: 'Move from the legacy sfcc-ci tool to the B2C CLI without breaking your CI/CD pipelines.',
  icon: 'mdi:swap-horizontal-bold',
  tags: ['migration', 'sfcc-ci', 'automation'],
  priority: 'specialized',
  intro:
    'sfcc-ci is deprecated. The B2C CLI is its drop-in replacement — colon-syntax aliases (b2c code:deploy), legacy env var names (SFCC_OAUTH_CLIENT_ID), and the dw.json file all keep working. This adventure picks the right migration path for your workflow and produces a side-by-side command translation table plus a before/after CI snippet.',

  steps: [
    step('surface', {
      title: 'Which sfcc-ci commands are you replacing?',
      subtitle:
        'Pick the workflow that matches most of your existing pipeline. The translation table will be focused on this surface.',
      doc: doc('/guide/sfcc-ci-migration', 'command-mapping', 'Command Mapping'),
      choices: [
        choice('code-deploy', {
          title: 'Code deploy + activate',
          subtitle: 'code:deploy / code:activate',
          icon: 'mdi:cloud-upload-outline',
          badges: [{text: 'Most common', tone: 'quick'}],
          body: md`
            Build, upload, and activate cartridges with \`b2c code deploy --activate\`.
            See the [Code Management](/guide/sfcc-ci-migration#code-management)
            section of the migration guide.
          `,
          contributes: {surface: 'code-deploy'},
        }),
        choice('data-import', {
          title: 'Data / site import + export',
          subtitle: 'instance:upload / instance:import',
          icon: 'mdi:database-arrow-up-outline',
          body: md`
            Replace \`sfcc-ci instance:*\` with \`b2c webdav put\` +
            \`b2c job run sfcc-site-archive-import\`.
          `,
          contributes: {surface: 'data-import'},
        }),
        choice('jobs', {
          title: 'Job orchestration',
          subtitle: 'job:run / job:status',
          icon: 'mdi:cog-play-outline',
          body: md`Trigger and wait on B2C jobs from CI with \`b2c job run <id> --wait\`.`,
          contributes: {surface: 'jobs'},
        }),
        choice('sandbox', {
          title: 'Sandbox lifecycle',
          subtitle: 'sandbox:create / sandbox:reset',
          icon: 'mdi:flask-outline',
          body: md`Provision and tear down On-Demand Sandboxes with \`b2c sandbox\`.`,
          contributes: {surface: 'sandbox'},
        }),
        choice('all', {
          title: 'All of the above',
          subtitle: 'Full pipeline migration',
          icon: 'mdi:format-list-checks',
          body: md`Get the complete translation table covering every surface.`,
          contributes: {surface: 'all'},
        }),
      ],
    }),

    step('auth', {
      title: 'How should the CLI authenticate?',
      subtitle:
        'sfcc-ci defaulted to a stateful flow (client:auth stores a token). The B2C CLI supports that pattern but recommends stateless env-var auth for CI.',
      doc: doc('/guide/sfcc-ci-migration', 'authentication', 'Authentication'),
      choices: [
        choice('stateless', {
          title: 'Stateless · env vars',
          subtitle: 'Recommended for CI/CD',
          icon: 'mdi:console-line',
          badges: [{text: 'Recommended', tone: 'info'}],
          body: md`
            Set \`SFCC_CLIENT_ID\` / \`SFCC_CLIENT_SECRET\` in your runner's
            secret store — no separate \`client:auth\` step. See
            [Stateless Auth](/guide/sfcc-ci-migration#stateless-auth-recommended-for-cicd).
          `,
          contributes: {authMode: 'stateless'},
        }),
        choice('stateful', {
          title: 'Stateful · b2c auth client',
          subtitle: 'Closest sfcc-ci analog',
          icon: 'mdi:key-variant',
          badges: [{text: 'Drop-in', tone: 'quick'}],
          body: md`
            Mirror sfcc-ci's \`client:auth\` with \`b2c auth client --renew\` —
            stores a token, reused across commands. See
            [b2c auth client](/cli/auth#b2c-auth-client).
          `,
          contributes: {authMode: 'stateful'},
        }),
        choice('dw-json', {
          title: 'dw.json at project root',
          subtitle: 'Local dev / cartridge repos',
          icon: 'mdi:file-cog-outline',
          body: md`
            Keep the existing \`dw.json\` file — both kebab-case (\`client-id\`)
            and camelCase (\`clientId\`) keys are accepted by the CLI's config
            reader.
          `,
          contributes: {authMode: 'dw-json'},
        }),
      ],
    }),

    step('safety', {
      title: 'What safety level should production enforce?',
      subtitle:
        'sfcc-ci had no destructive-op guard. The B2C CLI lets you gate destructive calls per environment — strongly recommended for production CI.',
      doc: doc('/guide/safety', 'safety-levels', 'Safety Levels'),
      choices: [
        choice('none', {
          title: 'NONE',
          subtitle: 'No restrictions (sfcc-ci parity)',
          icon: 'mdi:lock-open-variant-outline',
          body: md`Matches sfcc-ci's behavior. Acceptable for ephemeral sandbox pipelines.`,
          contributes: {safetyLevel: 'NONE'},
        }),
        choice('no-delete', {
          title: 'NO_DELETE',
          subtitle: 'Block DELETE operations',
          icon: 'mdi:lock-outline',
          badges: [{text: 'Recommended', tone: 'info'}],
          body: md`A reasonable default — uploads and activations still work, but accidental deletions are blocked.`,
          contributes: {safetyLevel: 'NO_DELETE'},
        }),
        choice('no-update', {
          title: 'NO_UPDATE',
          subtitle: 'Block deletes + reset/stop/restart',
          icon: 'mdi:shield-lock-outline',
          body: md`Stricter — preserves the ability to deploy code while blocking destructive admin ops.`,
          contributes: {safetyLevel: 'NO_UPDATE'},
        }),
        choice('read-only', {
          title: 'READ_ONLY',
          subtitle: 'Block all writes',
          icon: 'mdi:eye-lock-outline',
          body: md`For audit / verification jobs that should never modify the instance.`,
          contributes: {safetyLevel: 'READ_ONLY'},
        }),
      ],
    }),
  ],

  synthesize(state) {
    const surface = (state.surface as string) ?? 'code-deploy';
    const authMode = (state.authMode as string) ?? 'stateless';
    const safetyLevel = (state.safetyLevel as string) ?? 'NO_DELETE';

    const isStateful = authMode === 'stateful';
    const isDwJson = authMode === 'dw-json';
    const isStateless = authMode === 'stateless';

    // Configuration block: dw.json for the dw-json branch, otherwise a comment
    // pointing at the .env tab.
    const dw = isDwJson
      ? dwJson({
          hostname: true,
          username: true,
          password: true,
          clientId: true,
          clientSecret: true,
          codeVersion: true,
        })
      : '# sfcc-ci users moving to CI prefer environment variables — see the .env tab.';

    const envLines = [
      'SFCC_SERVER=<INSTANCE>.dx.commercecloud.salesforce.com',
      'SFCC_CLIENT_ID=<CLIENT_ID>',
      'SFCC_CLIENT_SECRET=<CLIENT_SECRET>',
      'SFCC_CODE_VERSION=version1',
      'SFCC_USERNAME=<BM_USERNAME>',
      'SFCC_PASSWORD=<WEBDAV_ACCESS_KEY>',
      `SFCC_SAFETY_LEVEL=${safetyLevel}`,
      '',
      '# sfcc-ci compatibility — these legacy names are still accepted:',
      '# SFCC_OAUTH_CLIENT_ID, SFCC_OAUTH_CLIENT_SECRET, SFCC_LOGIN_URL',
    ].join('\n');

    const checklist = [
      check(
        'Install the B2C CLI: `npm install -g @salesforce/b2c-cli`',
        link('/guide/installation', undefined, 'Installation'),
      ),
      ...(isStateful
        ? [
            check(
              'Replace `sfcc-ci client:auth` with `b2c auth client --renew` to keep the stored-token workflow',
              link('/cli/auth', 'b2c-auth-client', 'b2c auth client'),
            ),
          ]
        : []),
      ...(isStateless
        ? [
            check(
              'Drop the `sfcc-ci client:auth` step entirely — exporting `SFCC_CLIENT_ID` / `SFCC_CLIENT_SECRET` is enough',
              link('/guide/sfcc-ci-migration', 'stateless-auth-recommended-for-cicd', 'Stateless Auth'),
            ),
          ]
        : []),
      ...(isDwJson
        ? [
            check(
              'Save the dw.json snippet at your project root — both kebab-case (`client-id`) and camelCase (`clientId`) keys are accepted',
              link('/guide/configuration', 'configuration-file', 'Configuration File'),
            ),
          ]
        : []),
      check(
        'Rewrite CI scripts using the command translation table below',
        link('/guide/sfcc-ci-migration', 'command-mapping', 'Command Mapping'),
      ),
      check(
        `Set SFCC_SAFETY_LEVEL=${safetyLevel} in production env to gate destructive operations`,
        link('/guide/safety', 'safety-levels', 'Safety Levels'),
      ),
      check(
        'Update existing env vars: `SFCC_OAUTH_CLIENT_ID`, `SFCC_OAUTH_CLIENT_SECRET`, and `SFCC_LOGIN_URL` are still accepted as aliases',
        link('/guide/sfcc-ci-migration', 'environment-variables', 'Environment Variables'),
      ),
    ];

    // Side-by-side translation table. Curated for the picked surface so the
    // table stays focused on commands the user actually runs today.
    const tableHeader = '| sfcc-ci | B2C CLI |\n|---------|---------|';
    const tableRows = (SURFACE_ROWS[surface] ?? SURFACE_ROWS['code-deploy']).join('\n');
    const translationTable = `${tableHeader}\n${tableRows}`;

    // CI snippet: the canonical "before / after" for the chosen auth mode.
    const ciLines: string[] = [
      '# Before (sfcc-ci):',
      'sfcc-ci client:auth $SFCC_OAUTH_CLIENT_ID $SFCC_OAUTH_CLIENT_SECRET',
    ];
    if (surface === 'code-deploy' || surface === 'all') {
      ciLines.push('sfcc-ci code:deploy build/code.zip -i $INSTANCE', 'sfcc-ci code:activate v1 -i $INSTANCE');
    } else if (surface === 'data-import') {
      ciLines.push('sfcc-ci instance:import site.zip -i $INSTANCE');
    } else if (surface === 'jobs') {
      ciLines.push('sfcc-ci job:run ImportCatalogs -i $INSTANCE');
    } else if (surface === 'sandbox') {
      ciLines.push('sfcc-ci sandbox:create -r <REALM>');
    }

    ciLines.push('', '# After (B2C CLI):');
    if (isStateful) {
      ciLines.push(
        'export SFCC_SERVER=$INSTANCE',
        'b2c auth client --client-id $SFCC_OAUTH_CLIENT_ID --client-secret $SFCC_OAUTH_CLIENT_SECRET --renew',
      );
    } else if (isStateless) {
      ciLines.push(
        '# Just export env vars — no separate auth step',
        'export SFCC_SERVER=$INSTANCE',
        'export SFCC_CLIENT_ID=$SFCC_OAUTH_CLIENT_ID',
        'export SFCC_CLIENT_SECRET=$SFCC_OAUTH_CLIENT_SECRET',
      );
    } else {
      ciLines.push('# dw.json at project root supplies hostname + credentials');
    }
    ciLines.push(`export SFCC_SAFETY_LEVEL=${safetyLevel}`);

    if (surface === 'code-deploy' || surface === 'all') {
      ciLines.push('b2c code deploy --activate');
    } else if (surface === 'data-import') {
      // No `b2c content import` command exists — upload via WebDAV then run the
      // built-in site-archive-import job.
      ciLines.push(
        'b2c webdav put site.zip /Impex/src/instance/site.zip',
        'b2c job run sfcc-site-archive-import --wait',
      );
    } else if (surface === 'jobs') {
      ciLines.push('b2c job run ImportCatalogs --wait');
    } else if (surface === 'sandbox') {
      ciLines.push('b2c sandbox create --realm <REALM>');
    }

    const warnings: string[] = [
      `**Command translation** — the most common sfcc-ci → B2C CLI replacements:\n\n${translationTable}\n\nThe full table lives in the [sfcc-ci migration guide](/guide/sfcc-ci-migration#command-mapping).`,
      `**Before / after CI snippet:**\n\n\`\`\`bash\n${ciLines.join('\n')}\n\`\`\``,
      'Safety mode: sfcc-ci had no built-in destructive-op guard. Set `SFCC_SAFETY_LEVEL=NO_DELETE` (or stricter) in your production CI to opt into the new safety net — see [Safety Levels](/guide/safety#safety-levels).',
      'Legacy env var names (`SFCC_OAUTH_CLIENT_ID`, `SFCC_OAUTH_CLIENT_SECRET`, `SFCC_LOGIN_URL`) are still accepted, so existing pipelines keep working while you migrate.',
    ];

    if (isStateful) {
      warnings.push(
        'Stateful mode stores the OAuth token under your home directory. Fine for local dev — for CI runners that spin up fresh per job, prefer the stateless (env-var) mode instead.',
      );
    }

    if (safetyLevel === 'NONE') {
      warnings.push(
        "You picked SFCC_SAFETY_LEVEL=NONE — destructive operations are not blocked. That matches sfcc-ci's behavior, but consider raising to `NO_DELETE` for production.",
      );
    }

    return {
      dwJson: dw,
      env: envLines,
      checklist,
      warnings,
      verifyCommand: 'b2c code list',
    };
  },
});
