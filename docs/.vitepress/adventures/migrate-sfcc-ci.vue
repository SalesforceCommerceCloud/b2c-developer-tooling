<!--
  Migrate from sfcc-ci · Quickstart adventure.

  Page shim: docs/quickstart/migrate-sfcc-ci.md

  Mirrors docs/guide/sfcc-ci-migration.md. The synthesized output's most
  valuable artifact is the side-by-side command translation table, plus a
  CI snippet showing the new env-var-based auth pattern.
-->
<script setup lang="ts">
import {check, dwJson, link} from '../data/adventures/_helpers.js';
import type {Synthesizer} from '../theme/adventure/declarative/wizard-context.js';

const synth: Synthesizer = (state) => {
  const surface = (state.surface as string) ?? 'code-deploy';
  const authMode = (state.authMode as string) ?? 'stateless';
  const safetyLevel = (state.safetyLevel as string) ?? 'NO_DELETE';

  const isStateful = authMode === 'stateful';
  const isDwJson = authMode === 'dw-json';
  const isStateless = authMode === 'stateless';

  // Configuration block: dw.json for the dw-json branch, otherwise a comment
  // pointing at the .env tab.
  const dw = isDwJson
    ? dwJson({hostname: true, username: true, password: true, clientId: true, clientSecret: true, codeVersion: true})
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
            link('/guide/sfcc-ci-migration', 'stateless-auth-recommended-for-ci-cd', 'Stateless Auth'),
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
  const tableHeader =
    '| sfcc-ci | B2C CLI |\n|---------|---------|';

  const rowsByCommand: Record<string, string[]> = {
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

  const surfaceRows: Record<string, string[]> = {
    'code-deploy': [...rowsByCommand.auth, ...rowsByCommand.code],
    'data-import': [...rowsByCommand.auth, ...rowsByCommand.instance, ...rowsByCommand.job],
    jobs: [...rowsByCommand.auth, ...rowsByCommand.job],
    sandbox: [...rowsByCommand.auth, ...rowsByCommand.sandbox],
    all: [
      ...rowsByCommand.auth,
      ...rowsByCommand.code,
      ...rowsByCommand.instance,
      ...rowsByCommand.job,
      ...rowsByCommand.sandbox,
    ],
  };

  const tableRows = (surfaceRows[surface] ?? surfaceRows['code-deploy']).join('\n');
  const translationTable = `${tableHeader}\n${tableRows}`;

  // CI snippet: the canonical "before / after" for the chosen auth mode.
  const ciLines: string[] = ['# Before (sfcc-ci):', 'sfcc-ci client:auth $SFCC_OAUTH_CLIENT_ID $SFCC_OAUTH_CLIENT_SECRET'];
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
      'You picked SFCC_SAFETY_LEVEL=NONE — destructive operations are not blocked. That matches sfcc-ci\'s behavior, but consider raising to `NO_DELETE` for production.',
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
    id="migrate-sfcc-ci"
    title="Migrate from sfcc-ci"
    tagline="Move from the legacy sfcc-ci tool to the B2C CLI without breaking your CI/CD pipelines."
    intro="sfcc-ci is deprecated. The B2C CLI is its drop-in replacement — colon-syntax aliases (b2c code:deploy), legacy env var names (SFCC_OAUTH_CLIENT_ID), and the dw.json file all keep working. This adventure picks the right migration path for your workflow and produces a side-by-side command translation table plus a before/after CI snippet."
    icon="mdi:swap-horizontal-bold"
    :synth="synth"
  >
    <QStep
      id="surface"
      title="Which sfcc-ci commands are you replacing?"
      subtitle="Pick the workflow that matches most of your existing pipeline. The translation table will be focused on this surface."
      :doc="{path: '/guide/sfcc-ci-migration', hash: 'command-mapping', label: 'Command Mapping'}"
    >
      <QChoice
        id="code-deploy"
        title="Code deploy + activate"
        subtitle="code:deploy / code:activate"
        icon="mdi:cloud-upload-outline"
        :badges="[{text: 'Most common', tone: 'quick'}]"
        :contributes="{surface: 'code-deploy'}"
      >
        Build, upload, and activate cartridges with <code>b2c code deploy --activate</code>.
        See the
        <a href="/guide/sfcc-ci-migration#code-management">Code Management</a>
        section of the migration guide.
      </QChoice>
      <QChoice
        id="data-import"
        title="Data / site import + export"
        subtitle="instance:upload / instance:import"
        icon="mdi:database-arrow-up-outline"
        :contributes="{surface: 'data-import'}"
      >
        Replace <code>sfcc-ci instance:*</code> with
        <code>b2c webdav put</code> + <code>b2c job run sfcc-site-archive-import</code>.
      </QChoice>
      <QChoice
        id="jobs"
        title="Job orchestration"
        subtitle="job:run / job:status"
        icon="mdi:cog-play-outline"
        :contributes="{surface: 'jobs'}"
      >
        Trigger and wait on B2C jobs from CI with
        <code>b2c job run &lt;id&gt; --wait</code>.
      </QChoice>
      <QChoice
        id="sandbox"
        title="Sandbox lifecycle"
        subtitle="sandbox:create / sandbox:reset"
        icon="mdi:flask-outline"
        :contributes="{surface: 'sandbox'}"
      >
        Provision and tear down On-Demand Sandboxes with <code>b2c sandbox</code>.
      </QChoice>
      <QChoice
        id="all"
        title="All of the above"
        subtitle="Full pipeline migration"
        icon="mdi:format-list-checks"
        :contributes="{surface: 'all'}"
      >
        Get the complete translation table covering every surface.
      </QChoice>
    </QStep>

    <QStep
      id="auth"
      title="How should the CLI authenticate?"
      subtitle="sfcc-ci defaulted to a stateful flow (client:auth stores a token). The B2C CLI supports that pattern but recommends stateless env-var auth for CI."
      :doc="{path: '/guide/sfcc-ci-migration', hash: 'authentication', label: 'Authentication'}"
    >
      <QChoice
        id="stateless"
        title="Stateless · env vars"
        subtitle="Recommended for CI/CD"
        icon="mdi:console-line"
        :badges="[{text: 'Recommended', tone: 'info'}]"
        :contributes="{authMode: 'stateless'}"
      >
        Set <code>SFCC_CLIENT_ID</code> / <code>SFCC_CLIENT_SECRET</code> in
        your runner's secret store — no separate <code>client:auth</code> step.
        See
        <a href="/guide/sfcc-ci-migration#stateless-auth-recommended-for-ci-cd">Stateless Auth</a>.
      </QChoice>
      <QChoice
        id="stateful"
        title="Stateful · b2c auth client"
        subtitle="Closest sfcc-ci analog"
        icon="mdi:key-variant"
        :badges="[{text: 'Drop-in', tone: 'quick'}]"
        :contributes="{authMode: 'stateful'}"
      >
        Mirror sfcc-ci's <code>client:auth</code> with
        <code>b2c auth client --renew</code> — stores a token, reused across
        commands. See
        <a href="/cli/auth#b2c-auth-client">b2c auth client</a>.
      </QChoice>
      <QChoice
        id="dw-json"
        title="dw.json at project root"
        subtitle="Local dev / cartridge repos"
        icon="mdi:file-cog-outline"
        :contributes="{authMode: 'dw-json'}"
      >
        Keep the existing <code>dw.json</code> file — both kebab-case
        (<code>client-id</code>) and camelCase (<code>clientId</code>) keys
        are accepted by the CLI's config reader.
      </QChoice>
    </QStep>

    <QStep
      id="safety"
      title="What safety level should production enforce?"
      subtitle="sfcc-ci had no destructive-op guard. The B2C CLI lets you gate destructive calls per environment — strongly recommended for production CI."
      :doc="{path: '/guide/safety', hash: 'safety-levels', label: 'Safety Levels'}"
    >
      <QChoice
        id="none"
        title="NONE"
        subtitle="No restrictions (sfcc-ci parity)"
        icon="mdi:lock-open-variant-outline"
        :contributes="{safetyLevel: 'NONE'}"
      >
        Matches sfcc-ci's behavior. Acceptable for ephemeral sandbox pipelines.
      </QChoice>
      <QChoice
        id="no-delete"
        title="NO_DELETE"
        subtitle="Block DELETE operations"
        icon="mdi:lock-outline"
        :badges="[{text: 'Recommended', tone: 'info'}]"
        :contributes="{safetyLevel: 'NO_DELETE'}"
      >
        A reasonable default — uploads and activations still work, but accidental deletions are blocked.
      </QChoice>
      <QChoice
        id="no-update"
        title="NO_UPDATE"
        subtitle="Block deletes + reset/stop/restart"
        icon="mdi:shield-lock-outline"
        :contributes="{safetyLevel: 'NO_UPDATE'}"
      >
        Stricter — preserves the ability to deploy code while blocking destructive admin ops.
      </QChoice>
      <QChoice
        id="read-only"
        title="READ_ONLY"
        subtitle="Block all writes"
        icon="mdi:eye-lock-outline"
        :contributes="{safetyLevel: 'READ_ONLY'}"
      >
        For audit / verification jobs that should never modify the instance.
      </QChoice>
    </QStep>
  </Wizard>
</template>
