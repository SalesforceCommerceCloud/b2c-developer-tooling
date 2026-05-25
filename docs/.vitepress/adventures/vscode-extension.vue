<!--
  Install the VS Code extension · Quickstart adventure.

  Walks through downloading the VSIX, installing it, picking which features
  to enable, and providing a dw.json (or .env) the extension can pick up.
  Synthesizer assembles a tailored dw.json based on the chosen feature mix
  (the extension reuses whatever the CLI uses, so the credentials surface is
  feature-driven, not connection-driven).

  Page shim: docs/quickstart/vscode-extension.md
-->
<script setup lang="ts">
import {check, dwJson, link} from '../data/adventures/_helpers.js';
import type {AdventureState, Synthesizer} from '../theme/adventure/declarative/wizard-context.js';

function hasFeature(state: AdventureState, id: string): boolean {
  const features = Array.isArray(state.features) ? state.features : [];
  return features.includes(id);
}

const synth: Synthesizer = (state) => {
  const useEnv = state.configSource === 'env';
  const projectType = String(state.projectType ?? 'cartridges');
  const isHeadless = projectType === 'headless' || projectType === 'both';

  const wantsSandbox = hasFeature(state, 'sandbox');
  const wantsLibraries = hasFeature(state, 'libraries');
  const wantsDebugger = hasFeature(state, 'debugger');
  const wantsWebdav = hasFeature(state, 'webdav');
  const wantsCodeSync = hasFeature(state, 'codeSync');
  const wantsLogs = hasFeature(state, 'logs');
  const wantsApi = hasFeature(state, 'apiBrowser');

  // Different features need different fields. Compute the union.
  const needsWebdav = wantsLibraries || wantsDebugger || wantsWebdav || wantsCodeSync || wantsLogs;
  const needsOauth = wantsSandbox || wantsCodeSync || wantsApi;
  const needsScapi = wantsApi;

  const dw = useEnv
    ? '# Using environment variables — see .env tab below.'
    : dwJson({
        hostname: true,
        codeVersion: wantsCodeSync,
        username: needsWebdav,
        password: needsWebdav,
        clientId: needsOauth,
        clientSecret: needsOauth,
        shortCode: needsScapi,
        tenantId: needsScapi,
      });

  const env = useEnv
    ? [
        'SFCC_SERVER=<INSTANCE>.dx.commercecloud.salesforce.com',
        wantsCodeSync ? 'SFCC_CODE_VERSION=version1' : '',
        needsWebdav ? 'SFCC_USERNAME=<BM_USERNAME>' : '',
        needsWebdav ? 'SFCC_PASSWORD=<WEBDAV_ACCESS_KEY>' : '',
        needsOauth ? 'SFCC_CLIENT_ID=<CLIENT_ID>' : '',
        needsOauth ? 'SFCC_CLIENT_SECRET=<CLIENT_SECRET>' : '',
        needsScapi ? 'SFCC_SHORT_CODE=<SCAPI_SHORT_CODE>' : '',
        needsScapi ? 'SFCC_TENANT_ID=<TENANT_ID>' : '',
      ]
        .filter(Boolean)
        .join('\n')
    : undefined;

  // Build the disabled-feature toggles. The extension defaults every feature
  // ON, so we only emit explicit `false` for features the user did NOT pick —
  // and only when the user picked at least one feature, so we don't disable
  // everything by accident on first load.
  const allToggles: {id: string; key: string}[] = [
    {id: 'sandbox', key: 'b2c-dx.features.sandboxExplorer'},
    {id: 'webdav', key: 'b2c-dx.features.webdavBrowser'},
    {id: 'libraries', key: 'b2c-dx.features.contentLibraries'},
    {id: 'codeSync', key: 'b2c-dx.features.codeSync'},
    {id: 'logs', key: 'b2c-dx.features.logTailing'},
    {id: 'apiBrowser', key: 'b2c-dx.features.apiBrowser'},
  ];
  const featurePicks = Array.isArray(state.features) ? state.features : [];
  const disabledToggles = featurePicks.length > 0 ? allToggles.filter((t) => !featurePicks.includes(t.id)) : [];

  const warnings: string[] = [];

  if (disabledToggles.length > 0) {
    const settingsBody = disabledToggles.map((t) => `  "${t.key}": false`).join(',\n');
    warnings.push(
      `Optional — disable the features you skipped in \`.vscode/settings.json\` to trim the UI:\n\n\`\`\`json\n{\n${settingsBody}\n}\n\`\`\``,
    );
  }

  if (wantsLibraries) {
    warnings.push(
      'For the **Library Explorer** tree to populate automatically, add a `contentLibrary` (or `libraries`) entry to your `dw.json`. See [Content Libraries Example](/guide/configuration#content-libraries-example).',
    );
  }

  if (wantsDebugger) {
    warnings.push(
      'The **B2C Script Debugger** activates only when a `b2c-script` launch configuration is used — it ignores the feature toggles above.',
    );
  }

  if (isHeadless && (wantsCodeSync || wantsLibraries)) {
    warnings.push(
      'Headless projects (PWA Kit / Storefront Next) usually do not need Cartridge Code Sync or the Library Explorer. Consider unchecking those features unless you also work in a cartridge repo.',
    );
  }

  const checklist = [
    check(
      'Download the latest VSIX from the GitHub releases page',
      link('/vscode-extension/installation', 'get-the-latest-build', 'Get the latest build'),
    ),
    check(
      'Install the VSIX into VS Code (or Cursor / VS Codium)',
      link('/vscode-extension/installation', 'install-it', 'Install it'),
    ),
    check(
      'Have VS Code 1.105+ and the B2C CLI installed',
      link('/vscode-extension/installation', 'before-you-start', 'Before you start'),
    ),
    check(
      useEnv
        ? 'Provide credentials via SFCC_* environment variables (or .env)'
        : 'Add a dw.json at your project root with the fields each feature needs',
      link(
        '/vscode-extension/configuration',
        useEnv ? 'connecting-to-a-b2c-instance' : 'example-dwjson',
        useEnv ? 'Connecting to a B2C Instance' : 'Example dw.json',
      ),
    ),
    check(
      'Confirm which credentials each feature you picked needs',
      link('/vscode-extension/configuration', 'per-feature-requirements', 'Per-feature requirements'),
    ),
    ...(needsOauth
      ? [
          check(
            'Create an Account Manager API client for OAuth-backed features',
            link('/guide/authentication', 'account-manager-api-client', 'Account Manager API Client'),
          ),
        ]
      : []),
    ...(needsWebdav
      ? [
          check(
            'Generate a WebDAV access key (BM username + key)',
            link('/guide/authentication', 'webdav-access', 'WebDAV Access'),
          ),
        ]
      : []),
    ...(disabledToggles.length > 0
      ? [
          check(
            'Optionally disable unused features in .vscode/settings.json',
            link('/vscode-extension/configuration', 'feature-toggles', 'Feature toggles'),
          ),
        ]
      : []),
  ];

  return {
    dwJson: dw,
    env,
    checklist,
    warnings,
    verifyCommand: 'b2c setup inspect',
  };
};
</script>

<template>
  <Wizard
    id="vscode-extension"
    title="Install the VS Code extension"
    tagline="Set up the B2C DX VS Code extension and its features."
    intro="The B2C DX VS Code Extension is in Developer Preview and ships as a pre-built VSIX from GitHub releases. It reuses your existing CLI configuration, so once your dw.json (or SFCC_* env vars) is in place, every feature you turn on picks up the same connection."
    icon="mdi:microsoft-visual-studio-code"
    :synth="synth"
  >
    <QStep
      id="project"
      title="What kind of project?"
      :doc="{path: '/vscode-extension/', label: 'VS Code Extension overview'}"
    >
      <QChoice
        id="cartridges"
        title="Cartridges (SFRA / classic)"
        subtitle="Most common"
        icon="mdi:package-variant"
        :badges="[{text: 'Recommended', tone: 'info'}]"
        :contributes="{projectType: 'cartridges'}"
      >
        Server-side cartridges with WebDAV upload, code-version management, and the Script Debugger.
      </QChoice>
      <QChoice
        id="headless"
        title="Headless (PWA Kit / Storefront Next)"
        subtitle="Composable"
        icon="mdi:rocket-outline"
        :contributes="{projectType: 'headless'}"
      >
        Frontend-only project — the extension is mostly useful for the
        <strong>SCAPI API Browser</strong> and <strong>Sandbox Realm Explorer</strong>.
      </QChoice>
      <QChoice
        id="both"
        title="Both"
        subtitle="Cartridges + Headless"
        icon="mdi:swap-horizontal"
        :contributes="{projectType: 'both'}"
      >
        Mixed workspace — pick all the features you actually use below.
      </QChoice>
    </QStep>

    <QStep
      id="features"
      title="Which features will you use?"
      subtitle="Pick the ones you'll actually use — anything you skip can be disabled in settings."
      :multi-select="true"
      :min-picks="1"
      :doc="{path: '/vscode-extension/', hash: 'highlights', label: 'Extension Highlights'}"
    >
      <QChoice
        id="sandbox"
        title="Sandbox Realm Explorer"
        subtitle="ODS management"
        icon="mdi:flask-outline"
        :badges="[{text: 'Recommended', tone: 'info'}]"
        :contributes="{features: ['sandbox']}"
      >
        Spin up, start, stop, and clone on-demand sandboxes from a tree view.
        Needs an OAuth client with the <code>Sandbox API User</code> role.
      </QChoice>
      <QChoice
        id="codeSync"
        title="Cartridge Code Sync"
        subtitle="Watch + upload"
        icon="mdi:cloud-upload-outline"
        :contributes="{features: ['codeSync']}"
      >
        Auto-upload cartridges as you save. Uses WebDAV + OCAPI for code-version operations.
      </QChoice>
      <QChoice
        id="libraries"
        title="Library Explorer"
        subtitle="Page Designer content"
        icon="mdi:view-grid-outline"
        :contributes="{features: ['libraries']}"
      >
        Browse, edit, and round-trip Page Designer libraries. Reads library XML over WebDAV.
      </QChoice>
      <QChoice
        id="debugger"
        title="B2C Script Debugger"
        subtitle="Server-side breakpoints"
        icon="mdi:bug-outline"
        :contributes="{features: ['debugger']}"
      >
        Step through controllers, jobs, hooks, SCAPI hooks, and Custom APIs on the sandbox.
      </QChoice>
      <QChoice
        id="webdav"
        title="WebDAV Browser"
        subtitle="Remote files"
        icon="mdi:folder-network-outline"
        :contributes="{features: ['webdav']}"
      >
        Browse <code>Catalogs/</code>, <code>Libraries/</code>, and <code>IMPEX/</code> folders inside VS Code.
      </QChoice>
      <QChoice
        id="logs"
        title="Log Tailing"
        subtitle="Live error/warn/info logs"
        icon="mdi:console-line"
        :contributes="{features: ['logs']}"
      >
        Stream <code>error-*.log</code>, <code>warn-*.log</code>, and <code>info-*.log</code> into an output channel.
      </QChoice>
      <QChoice
        id="apiBrowser"
        title="SCAPI API Explorer"
        subtitle="Try APIs in Swagger UI"
        icon="mdi:api"
        :contributes="{features: ['apiBrowser']}"
      >
        Explore SCAPI APIs and run authenticated requests. Needs <code>short-code</code> + <code>tenant-id</code>.
      </QChoice>
    </QStep>

    <QStep
      id="config"
      title="How will you give the extension your credentials?"
      :doc="{path: '/vscode-extension/configuration', hash: 'connecting-to-a-b2c-instance', label: 'Connecting to a B2C Instance'}"
    >
      <QChoice
        id="dw-json"
        title="dw.json (workspace root)"
        subtitle="Recommended"
        icon="mdi:file-cog-outline"
        :badges="[{text: 'Recommended', tone: 'info'}]"
        :contributes="{configSource: 'dw-json'}"
      >
        Per-project file the extension and CLI both read. Walk-up discovery from the workspace root.
      </QChoice>
      <QChoice
        id="env"
        title=".env / environment variables"
        subtitle="CI-friendly"
        icon="mdi:console-line"
        :contributes="{configSource: 'env'}"
      >
        Use <code>SFCC_*</code> env vars — VS Code picks them up from the launching shell.
      </QChoice>
      <QChoice
        id="existing"
        title="Use my existing CLI config"
        subtitle="Already set up"
        icon="mdi:check-circle-outline"
        :contributes="{configSource: 'dw-json'}"
      >
        If <code>b2c</code> already works in this folder, the extension uses the same connection — no extra setup.
      </QChoice>
    </QStep>
  </Wizard>
</template>
