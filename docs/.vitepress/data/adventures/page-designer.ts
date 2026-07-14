// Adventure: Page Designer content (b2c content + VS Code Content Libraries tree).

import {choice, defineAdventure, doc, md, step} from './_authoring.js';
import {check, dwJson, link, ocapiConfig, scopes} from './_helpers.js';

export const pageDesignerAdventure = defineAdventure({
  id: 'page-designer',
  title: 'Page Designer content',
  tagline:
    'Use b2c content and the VS Code Content Libraries tree to inspect, export, and edit Page Designer pages.',
  icon: 'mdi:view-grid-outline',
  tags: ['content', 'page-designer', 'webdav', 'ocapi', 'vscode'],
  priority: 'common',
  intro:
    'Page Designer tooling reads library XML over WebDAV and uses an OCAPI Jobs export to fetch fresh content. You configure a library list once, and both the CLI and the VS Code extension pick it up.',

  steps: [
    step('surface', {
      title: 'Where will you work with content?',
      doc: doc('/vscode-extension/', undefined, 'VS Code Extension'),
      choices: [
        choice('cli', {
          title: 'CLI (b2c content)',
          subtitle: 'Terminal',
          icon: 'mdi:console-line',
          body: md`Run \`b2c content list / export / validate\` from a shell.`,
          contributes: {surface: 'cli'},
        }),
        choice('vscode', {
          title: 'VS Code extension',
          subtitle: 'Library Explorer tree',
          icon: 'mdi:microsoft-visual-studio-code',
          badges: [{text: 'Best UX', tone: 'info'}],
          body: md`Visual tree view with search and round-trip XML editing.`,
          contributes: {surface: 'vscode'},
        }),
        choice('both', {
          title: 'Both',
          icon: 'mdi:swap-horizontal',
          body: md`Configure once; the same \`dw.json\` drives both surfaces.`,
          contributes: {surface: 'both'},
        }),
      ],
    }),

    step('library', {
      title: 'What kind of library?',
      doc: doc('/guide/configuration', 'content-libraries-example', 'Content Libraries Example'),
      choices: [
        choice('shared', {
          title: 'Shared library',
          subtitle: 'Org-level',
          icon: 'mdi:folder-outline',
          body: md`A library that multiple sites can reference.`,
          contributes: {libraryKind: 'shared'},
        }),
        choice('site', {
          title: 'Site library',
          subtitle: 'Site-private',
          icon: 'mdi:folder-account-outline',
          body: md`A site-private library — the library ID is the site ID.`,
          contributes: {libraryKind: 'site'},
        }),
        choice('mixed', {
          title: 'Mixed (multiple libraries)',
          icon: 'mdi:folder-multiple-outline',
          body: md`List several libraries; mark site-private ones explicitly.`,
          contributes: {libraryKind: 'mixed'},
        }),
      ],
    }),

    step('auth', {
      title: 'How will you authenticate?',
      doc: doc('/guide/authentication', 'account-manager-api-client', 'Account Manager API Client'),
      choices: [
        choice('client-credentials', {
          title: 'Client Credentials',
          subtitle: 'Recommended',
          icon: 'mdi:key-variant',
          body: md`API client with secret. Same client covers OAuth + OCAPI Jobs.`,
          contributes: {authMethod: 'client-credentials'},
        }),
        choice('jwt', {
          title: 'JWT Bearer',
          subtitle: 'Certificate-based',
          icon: 'mdi:certificate-outline',
          body: md`Cert pair instead of client secret.`,
          contributes: {authMethod: 'jwt'},
        }),
      ],
    }),

    step('persistence', {
      title: 'Where should the libraries config live?',
      doc: doc('/guide/configuration', 'content-libraries-example', 'Content Libraries Example'),
      choices: [
        choice('dw-json', {
          title: 'dw.json (instance-scoped)',
          subtitle: 'Recommended',
          icon: 'mdi:file-cog-outline',
          body: md`Lives next to credentials. Good if libraries vary per environment.`,
          contributes: {configSource: 'dw-json'},
        }),
        choice('package-json', {
          title: 'package.json (project-scoped)',
          subtitle: 'Shareable via VCS',
          icon: 'mdi:package-variant-closed',
          body: md`Use the \`b2c\` block in \`package.json\` so the whole team picks it up.`,
          contributes: {configSource: 'package-json'},
        }),
      ],
    }),
  ],

  synthesize(state) {
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
          link('/guide/authentication', 'option-a-basic-authentication-user-access', 'Basic Authentication'),
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
  },
});
