<!--
  Page Designer content · Quickstart adventure.

  Most demanding adventure: needs OAuth (jobs that drive site export), WebDAV
  (to fetch library XML), OCAPI Jobs, and a libraries config so VS Code
  knows what to load.

  Page shim: docs/quickstart/page-designer.md
-->
<script setup lang="ts">
import {check, dwJson, link, ocapiConfig, scopes} from '../data/adventures/_helpers.js';
import type {Synthesizer} from '../theme/adventure/declarative/wizard-context.js';

const synth: Synthesizer = (state) => {
  const isJwt = state.authMethod === 'jwt';
  const usingPackage = state.configSource === 'package-json';

  let libraries: string[];
  if (state.libraryKind === 'site') {
    libraries = ['<SITE_LIBRARY_ID>'];
  } else if (state.libraryKind === 'mixed') {
    libraries = ['<SHARED_LIBRARY_ID>', '<SITE_LIBRARY_ID>'];
  } else {
    libraries = ['<SHARED_LIBRARY_ID>'];
  }

  const dw = usingPackage
    ? dwJson({hostname: true, clientId: true, clientSecret: !isJwt, username: true, password: true})
    : dwJson({hostname: true, clientId: true, clientSecret: !isJwt, username: true, password: true, libraries});

  const ocapiSnippet = ocapiConfig('<CLIENT_ID>', ['jobs', 'sites']);

  const warnings: string[] = [
    `Add this OCAPI Data API config in Business Manager so the site-export job can run:\n\n\`\`\`json\n${ocapiSnippet}\n\`\`\``,
  ];
  if (state.libraryKind === 'site' || state.libraryKind === 'mixed') {
    warnings.push(
      'For site-private libraries use the object form so commands default --site-library correctly:\n\n```json\n{ "libraries": [{"id": "<SITE_LIBRARY_ID>", "siteLibrary": true}] }\n```',
    );
  }
  if (state.surface === 'vscode' || state.surface === 'both') {
    warnings.push(
      'Enable the Content Libraries tree in VS Code: set `b2c-dx.features.contentLibraries: true` in `.vscode/settings.json` and reload the window.',
    );
  }

  return {
    dwJson: dw,
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
        'Enable Jobs and Sites in OCAPI Data API',
        link('/guide/authentication', 'ocapi-configuration', 'OCAPI Configuration'),
      ),
      check(
        'Generate a WebDAV access key (BM username + key)',
        link('/guide/authentication', 'option-a-basic-authentication-recommended', 'Basic Authentication'),
      ),
      check(
        usingPackage ? 'Add a `libraries` array under the `b2c` key in package.json' : 'List your libraries in dw.json',
        link('/guide/configuration', 'content-libraries-example', 'Content Libraries Example'),
      ),
      ...(state.surface === 'vscode' || state.surface === 'both'
        ? [
            check(
              'Install the B2C DX VS Code extension',
              link('/vscode-extension/installation', undefined, 'VS Code Extension Installation'),
            ),
          ]
        : []),
    ],
    warnings,
    verifyCommand: 'b2c content list --library <LIBRARY_ID>',
  };
};
</script>

<template>
  <Wizard
    id="page-designer"
    title="Page Designer content"
    tagline="Use b2c content and the VS Code Content Libraries tree to inspect, export, and edit Page Designer pages."
    intro="Page Designer tooling reads library XML over WebDAV and uses an OCAPI Jobs export to fetch fresh content. You configure a library list once, and both the CLI and the VS Code extension pick it up."
    icon="mdi:view-grid-outline"
    :synth="synth"
  >
    <QStep
      id="surface"
      title="Where will you work with content?"
      :doc="{path: '/vscode-extension/', label: 'VS Code Extension'}"
    >
      <QChoice
        id="cli"
        title="CLI (b2c content)"
        subtitle="Terminal"
        icon="mdi:console-line"
        :contributes="{surface: 'cli'}"
      >
        Run <code>b2c content list / export / validate</code> from a shell.
      </QChoice>
      <QChoice
        id="vscode"
        title="VS Code extension"
        subtitle="Library Explorer tree"
        icon="mdi:microsoft-visual-studio-code"
        :badges="[{text: 'Best UX', tone: 'info'}]"
        :contributes="{surface: 'vscode'}"
      >
        Visual tree view with search and round-trip XML editing.
      </QChoice>
      <QChoice
        id="both"
        title="Both"
        icon="mdi:swap-horizontal"
        :contributes="{surface: 'both'}"
      >
        Configure once; the same <code>dw.json</code> drives both surfaces.
      </QChoice>
    </QStep>

    <QStep
      id="library"
      title="What kind of library?"
      :doc="{path: '/guide/configuration', hash: 'content-libraries-example', label: 'Content Libraries Example'}"
    >
      <QChoice
        id="shared"
        title="Shared library"
        subtitle="Org-level"
        icon="mdi:folder-outline"
        :contributes="{libraryKind: 'shared'}"
      >
        A library that multiple sites can reference.
      </QChoice>
      <QChoice
        id="site"
        title="Site library"
        subtitle="Site-private"
        icon="mdi:folder-account-outline"
        :contributes="{libraryKind: 'site'}"
      >
        A site-private library — the library ID is the site ID.
      </QChoice>
      <QChoice
        id="mixed"
        title="Mixed (multiple libraries)"
        icon="mdi:folder-multiple-outline"
        :contributes="{libraryKind: 'mixed'}"
      >
        List several libraries; mark site-private ones explicitly.
      </QChoice>
    </QStep>

    <QStep
      id="auth"
      title="How will you authenticate?"
      :doc="{path: '/guide/authentication', hash: 'account-manager-api-client', label: 'Account Manager API Client'}"
    >
      <QChoice
        id="client-credentials"
        title="Client Credentials"
        subtitle="Recommended"
        icon="mdi:key-variant"
        :contributes="{authMethod: 'client-credentials'}"
      >
        API client with secret. Same client covers OAuth + OCAPI Jobs.
      </QChoice>
      <QChoice
        id="jwt"
        title="JWT Bearer"
        subtitle="Certificate-based"
        icon="mdi:certificate-outline"
        :contributes="{authMethod: 'jwt'}"
      >
        Cert pair instead of client secret.
      </QChoice>
    </QStep>

    <QStep
      id="persistence"
      title="Where should the libraries config live?"
      :doc="{path: '/guide/configuration', hash: 'content-libraries-example', label: 'Content Libraries Example'}"
    >
      <QChoice
        id="dw-json"
        title="dw.json (instance-scoped)"
        subtitle="Recommended"
        icon="mdi:file-cog-outline"
        :contributes="{configSource: 'dw-json'}"
      >
        Lives next to credentials. Good if libraries vary per environment.
      </QChoice>
      <QChoice
        id="package-json"
        title="package.json (project-scoped)"
        subtitle="Shareable via VCS"
        icon="mdi:package-variant-closed"
        :contributes="{configSource: 'package-json'}"
      >
        Use the <code>b2c</code> block in <code>package.json</code> so the whole team picks it up.
      </QChoice>
    </QStep>
  </Wizard>
</template>
