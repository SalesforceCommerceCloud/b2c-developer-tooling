<!--
  Configure multiple instances · Quickstart adventure.

  Walks the user through structuring `dw.json` with a `configs` array
  (named profiles) and choosing how to switch between them — the
  `--instance` flag, `SFCC_INSTANCE` env var, or the
  `b2c setup instance set-active` wizard.

  Page shim: docs/quickstart/multi-instance.md
-->
<script setup lang="ts">
import {check, link} from '../data/adventures/_helpers.js';
import type {Synthesizer} from '../theme/adventure/declarative/wizard-context.js';

interface InstanceProfile {
  name: string;
  hostname: string;
  codeVersion: string;
  authMode: 'shared-oauth' | 'per-instance-oauth' | 'mixed';
}

const PROFILES_2: InstanceProfile[] = [
  {name: 'dev', hostname: '<DEV_INSTANCE>.dx.commercecloud.salesforce.com', codeVersion: 'version1', authMode: 'shared-oauth'},
  {
    name: 'production',
    hostname: '<PROD_INSTANCE>.dx.commercecloud.salesforce.com',
    codeVersion: 'version1',
    authMode: 'shared-oauth',
  },
];

const PROFILES_3: InstanceProfile[] = [
  {name: 'dev', hostname: '<DEV_INSTANCE>.dx.commercecloud.salesforce.com', codeVersion: 'version1', authMode: 'shared-oauth'},
  {
    name: 'staging',
    hostname: '<STAGING_INSTANCE>.dx.commercecloud.salesforce.com',
    codeVersion: 'version1',
    authMode: 'shared-oauth',
  },
  {
    name: 'production',
    hostname: '<PROD_INSTANCE>.dx.commercecloud.salesforce.com',
    codeVersion: 'version1',
    authMode: 'shared-oauth',
  },
];

function buildDwJson(profiles: InstanceProfile[], authStrategy: string): string {
  const lines: string[] = ['{', '  "configs": ['];
  profiles.forEach((p, idx) => {
    const isActive = idx === 0;
    const fields: string[] = [];
    fields.push(`      "name": "${p.name}"`);
    if (isActive) fields.push(`      "active": true`);
    fields.push(`      "hostname": "${p.hostname}"`);
    fields.push(`      "code-version": "${p.codeVersion}"`);

    if (authStrategy === 'shared-oauth') {
      // Same OAuth credentials reused across all instances.
      fields.push(`      "client-id": "<CLIENT_ID>"`);
      fields.push(`      "client-secret": "<CLIENT_SECRET>"`);
    } else if (authStrategy === 'per-instance-oauth') {
      // Distinct OAuth credentials per instance.
      const upper = p.name.toUpperCase();
      fields.push(`      "client-id": "<${upper}_CLIENT_ID>"`);
      fields.push(`      "client-secret": "<${upper}_CLIENT_SECRET>"`);
    } else {
      // Mixed: basic auth on dev/staging, OAuth on prod.
      if (p.name === 'production') {
        fields.push(`      "client-id": "<PROD_CLIENT_ID>"`);
        fields.push(`      "client-secret": "<PROD_CLIENT_SECRET>"`);
      } else {
        fields.push(`      "username": "<${p.name.toUpperCase()}_BM_USERNAME>"`);
        fields.push(`      "password": "<${p.name.toUpperCase()}_WEBDAV_ACCESS_KEY>"`);
      }
    }

    lines.push('    {');
    lines.push(fields.join(',\n'));
    lines.push(idx === profiles.length - 1 ? '    }' : '    },');
  });
  lines.push('  ]');
  lines.push('}');
  return lines.join('\n');
}

const synth: Synthesizer = (state) => {
  const envCount = (state.envCount as string) ?? '3';
  const authStrategy = (state.authStrategy as string) ?? 'shared-oauth';
  const switchMethod = (state.switchMethod as string) ?? 'set-active';

  const profiles = envCount === '2' ? PROFILES_2 : PROFILES_3;
  const dw = buildDwJson(profiles, authStrategy);

  // For CI-style switching, suggest SFCC_INSTANCE in env tab.
  const env =
    switchMethod === 'env'
      ? '# Pick the active instance for this shell / CI job.\nSFCC_INSTANCE=production'
      : undefined;

  const checklist = [
    check(
      'Structure dw.json with a `configs` array of named instances',
      link('/guide/configuration', 'multiple-instances', 'Multiple Instances'),
    ),
    check(
      'Add instances interactively with `b2c setup instance create <name>`',
      link('/guide/configuration', 'quick-setup', 'Quick Setup'),
    ),
    check(
      'List configured instances with `b2c setup instance list`',
      link('/guide/configuration', 'listing-and-removing', 'Listing and Removing'),
    ),
    ...(switchMethod === 'set-active'
      ? [
          check(
            'Switch the default with `b2c setup instance set-active <name>`',
            link('/guide/configuration', 'switching-instances', 'Switching Instances'),
          ),
        ]
      : []),
    ...(switchMethod === 'flag'
      ? [
          check(
            'Use the `-i` / `--instance <name>` flag to override per command',
            link('/guide/configuration', 'multiple-instances', 'Multiple Instances'),
          ),
        ]
      : []),
    ...(switchMethod === 'env'
      ? [
          check(
            'Set `SFCC_INSTANCE=<name>` in your shell or CI environment',
            link('/guide/configuration', 'environment-variables', 'Environment Variables'),
          ),
        ]
      : []),
  ];

  const warnings: string[] = [
    'Tip: keep a separate `code-version` per instance if your environments deploy to different active versions (e.g., `version_dev` on dev, `version_prod` on production).',
  ];
  if (switchMethod !== 'env') {
    warnings.push(
      'For CI pipelines, prefer `SFCC_INSTANCE=production` (or `--instance production`) over committing `"active": true` on the production profile — it keeps the active instance out of source control.',
    );
  }
  if (authStrategy === 'shared-oauth') {
    warnings.push(
      'Sharing one client across environments is convenient, but for production consider a dedicated Account Manager API client with tighter scopes and a tenant filter.',
    );
  }

  return {
    dwJson: dw,
    env,
    checklist,
    warnings,
    verifyCommand: 'b2c setup instance list',
  };
};
</script>

<template>
  <Wizard
    id="multi-instance"
    title="Configure multiple instances"
    tagline="Switch between dev, staging, and production with named profiles in dw.json."
    intro="The CLI supports a `configs` array in `dw.json` so one project can target multiple B2C instances. Pick how many environments you need, how authentication is shared across them, and how you want to switch."
    icon="mdi:swap-horizontal-circle-outline"
    :synth="synth"
  >
    <QStep
      id="envCount"
      title="How many environments do you need?"
      :doc="{path: '/guide/configuration', hash: 'multiple-instances', label: 'Multiple Instances'}"
    >
      <QChoice
        id="two"
        title="Two: dev + production"
        subtitle="Minimal setup"
        icon="mdi:numeric-2-circle-outline"
        :badges="[{text: 'Quick', tone: 'quick'}]"
        :contributes="{envCount: '2'}"
      >
        A development sandbox and a production instance. Good starting point for small teams.
      </QChoice>
      <QChoice
        id="three"
        title="Three: dev + staging + production"
        subtitle="Recommended"
        icon="mdi:numeric-3-circle-outline"
        :badges="[{text: 'Recommended', tone: 'info'}]"
        :contributes="{envCount: '3'}"
      >
        Adds a staging tier so you can rehearse releases against production-like data before promoting code.
      </QChoice>
    </QStep>

    <QStep
      id="authStrategy"
      title="How are credentials structured?"
      subtitle="Each entry in the `configs` array can carry its own auth fields."
      :doc="{path: '/guide/configuration', hash: 'multiple-instances', label: 'Multiple Instances'}"
    >
      <QChoice
        id="shared-oauth"
        title="One OAuth client, all instances"
        subtitle="Simplest"
        icon="mdi:key-link"
        :contributes="{authStrategy: 'shared-oauth'}"
      >
        Reuse the same Account Manager <code>client-id</code> / <code>client-secret</code> across every entry. Quick to set up; relies on AM tenant filters for scoping.
      </QChoice>
      <QChoice
        id="per-instance-oauth"
        title="Separate OAuth client per instance"
        subtitle="Stronger isolation"
        icon="mdi:key-chain-variant"
        :badges="[{text: 'Recommended', tone: 'info'}]"
        :contributes="{authStrategy: 'per-instance-oauth'}"
      >
        Each instance gets its own <code>client-id</code> / <code>client-secret</code>. Lets you rotate or revoke production credentials without disturbing dev.
      </QChoice>
      <QChoice
        id="mixed"
        title="Mixed: basic auth on lower envs, OAuth on prod"
        subtitle="Pragmatic"
        icon="mdi:shield-half-full"
        :contributes="{authStrategy: 'mixed'}"
      >
        WebDAV username + access key on dev/staging for fast uploads, OAuth client credentials on production for full OCAPI access.
      </QChoice>
    </QStep>

    <QStep
      id="switchMethod"
      title="How will you switch the active instance?"
      :doc="{path: '/guide/configuration', hash: 'switching-instances', label: 'Switching Instances'}"
    >
      <QChoice
        id="set-active"
        title="`b2c setup instance set-active <name>`"
        subtitle="Interactive default"
        icon="mdi:cursor-default-click-outline"
        :badges="[{text: 'Recommended', tone: 'info'}]"
        :contributes="{switchMethod: 'set-active'}"
      >
        Sets the <code>"active": true</code> flag in <code>dw.json</code>. Run with no argument for a searchable picker.
      </QChoice>
      <QChoice
        id="flag"
        title="`--instance <name>` per command"
        subtitle="One-off override"
        icon="mdi:flag-outline"
        :contributes="{switchMethod: 'flag'}"
      >
        Pass <code>-i staging</code> on a single command without changing the active default. Useful for ad-hoc inspection.
      </QChoice>
      <QChoice
        id="env"
        title="`SFCC_INSTANCE` env var"
        subtitle="CI-friendly"
        icon="mdi:console-line"
        :badges="[{text: 'CI', tone: 'quick'}]"
        :contributes="{switchMethod: 'env'}"
      >
        Set <code>SFCC_INSTANCE=production</code> for the whole shell or pipeline job. Keeps the active selection out of source control.
      </QChoice>
    </QStep>
  </Wizard>
</template>
