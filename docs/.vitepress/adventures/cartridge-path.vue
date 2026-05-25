<!--
  Manage site cartridge paths · Quickstart adventure.

  This file is the single source of truth for the adventure: structure
  (Wizard / QStep / QChoice), prose (intro, choice descriptions), and the
  synthesizer that assembles dw.json + checklist + verify command.

  The corresponding page at `docs/quickstart/cartridge-path.md` is a thin shim
  that imports this component and sets the page chrome (title, layout).
-->
<script setup lang="ts">
import {check, dwJson, link, ocapiConfig, scopes} from '../data/adventures/_helpers.js';
import type {Synthesizer} from '../theme/adventure/declarative/wizard-context.js';

const synth: Synthesizer = (state) => {
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

  // OCAPI snippet — for the direct path we need /sites and /sites/* (read)
  // plus /sites/*/cartridges (post/put/delete). The fallback path skips
  // /sites/*/cartridges and relies on the site-archive job instead.
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

  // Pick the verify command based on the chosen operation.
  const verifyCommand =
    op === 'list'
      ? 'b2c sites cartridges list --site-id <SITE_ID>'
      : op === 'add'
        ? 'b2c sites cartridges list --site-id <SITE_ID>'
        : 'b2c sites cartridges list --site-id <SITE_ID>';

  return {
    dwJson: dw,
    env,
    checklist,
    warnings,
    verifyCommand,
  };
};
</script>

<template>
  <Wizard
    id="cartridge-path"
    title="Manage site cartridge paths"
    tagline="List, add, remove, or reorder cartridges in a site's cartridge path."
    intro="b2c sites cartridges manages the ordered list of cartridges active on a storefront. It uses OAuth + OCAPI by default and falls back to site archive import/export when /sites/*/cartridges OCAPI permissions are not available."
    icon="mdi:layers-outline"
    :synth="synth"
  >
    <QStep
      id="operation"
      title="What do you want to do?"
      subtitle="Read-only operations are always safe; destructive operations honor safety mode."
      :doc="{path: '/cli/sites', label: 'Sites command reference'}"
    >
      <QChoice
        id="list"
        title="List cartridge path"
        subtitle="Read-only inspection"
        icon="mdi:format-list-bulleted"
        :badges="[{text: 'Quick', tone: 'quick'}]"
        :contributes="{operation: 'list'}"
      >
        <code>b2c sites cartridges list</code> — show the ordered cartridges for a site.
      </QChoice>
      <QChoice
        id="add"
        title="Add a cartridge"
        subtitle="Insert at first / last / before / after"
        icon="mdi:playlist-plus"
        :contributes="{operation: 'add'}"
      >
        <code>b2c sites cartridges add &lt;cartridge&gt; --position &lt;first|last|before|after&gt; --target &lt;name&gt;</code>.
      </QChoice>
      <QChoice
        id="remove"
        title="Remove a cartridge"
        subtitle="Destructive — gated by safety mode"
        icon="mdi:playlist-minus"
        :badges="[{text: 'Complex', tone: 'complex'}]"
        :contributes="{operation: 'remove'}"
      >
        <code>b2c sites cartridges remove &lt;cartridge&gt;</code>. Blocked when <code>SFCC_SAFETY_LEVEL</code> is <code>NO_DELETE</code> or stricter (default <code>NONE</code> allows).
      </QChoice>
      <QChoice
        id="set"
        title="Replace cartridge path"
        subtitle="Destructive — overwrites the entire path"
        icon="mdi:swap-horizontal"
        :badges="[{text: 'Complex', tone: 'complex'}]"
        :contributes="{operation: 'set'}"
      >
        <code>b2c sites cartridges set "cart1:cart2:cart3"</code>. Blocked when <code>SFCC_SAFETY_LEVEL</code> is <code>NO_DELETE</code> or stricter (default <code>NONE</code> allows).
      </QChoice>
    </QStep>

    <QStep
      id="auth"
      title="How will the CLI talk to /sites?"
      subtitle="The default path is OAuth + OCAPI; if /sites/*/cartridges is not granted, the CLI falls back to site archive import."
      :doc="{path: '/guide/authentication', hash: 'account-manager-api-client', label: 'Account Manager API Client'}"
    >
      <QChoice
        id="ocapi-direct"
        title="OAuth + OCAPI (direct)"
        subtitle="Recommended"
        icon="mdi:key-variant"
        :badges="[{text: 'Recommended', tone: 'info'}]"
        :contributes="{authStrategy: 'ocapi-direct'}"
      >
        Account Manager API client with OCAPI permissions for <code>/sites</code>, <code>/sites/*</code>, and <code>/sites/*/cartridges</code>. Fastest and most direct.
      </QChoice>
      <QChoice
        id="bm-fallback"
        title="Site archive fallback"
        subtitle="When /sites/*/cartridges OCAPI access is not available"
        icon="mdi:archive-arrow-down-outline"
        :contributes="{authStrategy: 'bm-fallback'}"
      >
        Uses <code>sfcc-site-archive-import</code> + WebDAV <code>Impex/</code>. Use the <code>--bm</code> flag (shorthand for <code>--site-id Sites-Site</code>) to target the Business Manager cartridge path; BM updates always go through this fallback.
      </QChoice>
    </QStep>

    <QStep
      id="persistence"
      title="How should the CLI find your config?"
      subtitle="The site ID is always passed via --site-id (or --bm)."
      :doc="{path: '/guide/configuration', hash: 'configuration-file', label: 'Configuration file (dw.json)'}"
    >
      <QChoice
        id="dw-json"
        title="dw.json (project root)"
        subtitle="Recommended"
        icon="mdi:file-cog-outline"
        :contributes="{configSource: 'dw-json'}"
      >
        Per-project config file with walk-up discovery. Pass <code>--site-id &lt;SITE_ID&gt;</code> on each invocation.
      </QChoice>
      <QChoice
        id="env"
        title=".env / environment variables"
        subtitle="CI-friendly"
        icon="mdi:console-line"
        :contributes="{configSource: 'env'}"
      >
        Use <code>SFCC_*</code> env vars for hostname + credentials; the CLI auto-loads a <code>.env</code> file.
        Note: there is no <code>SFCC_SITE_ID</code> for these commands — <code>--site-id</code> (or <code>--bm</code>)
        is required on every invocation.
      </QChoice>
    </QStep>
  </Wizard>
</template>
