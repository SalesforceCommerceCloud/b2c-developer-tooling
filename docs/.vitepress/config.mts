import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {defineConfig, type DefaultTheme} from 'vitepress';
import {groupIconMdPlugin, groupIconVitePlugin} from 'vitepress-plugin-group-icons';
import typedocSidebar from '../api/typedoc-sidebar.json';
import {generateReleaseNotes} from './releases/generate.js';

const docsDirectory = path.resolve(import.meta.dirname, '..');
const releaseNotes = generateReleaseNotes(docsDirectory);

// Copy source .md files to the build output so pages can be fetched as raw
// markdown (powers the "View as Markdown" / "Copy for LLM" buttons).
function copyMarkdownSources(srcDir: string, outDir: string) {
  const entries = fs.readdirSync(srcDir, {withFileTypes: true});
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_') || entry.name === 'node_modules') continue;
    const src = path.join(srcDir, entry.name);
    const dest = path.join(outDir, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dest, {recursive: true});
      copyMarkdownSources(src, dest);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      fs.writeFileSync(dest, expandIncludes(src));
    }
  }
}

// Resolve the same plain-file includes used in authored pages for raw Markdown readers.
function expandIncludes(file: string, ancestors = new Set<string>()): string {
  if (ancestors.has(file)) throw new Error(`Circular Markdown include: ${file}`);
  const next = new Set([...ancestors, file]);
  return fs
    .readFileSync(file, 'utf8')
    .replace(/<!--@include:\s*(.+?)\s*-->/g, (_, relativePath: string) =>
      expandIncludes(path.resolve(path.dirname(file), relativePath), next),
    );
}

// Extract the committed Salesforce Help corpus tarball (docs/help-content.tar.gz)
// into <outDir>/help so the converted .md pages are served verbatim at
// <base>/help/<category>/<id>.md. The tarball is the committed artifact (one
// file instead of ~1000 loose .md); the loose tree is git-ignored. No-op if the
// tarball is absent so a partial checkout still builds.
function extractHelpCorpus(srcDir: string, outDir: string) {
  const tarball = path.join(srcDir, 'help-content.tar.gz');
  if (!fs.existsSync(tarball)) {
    console.warn(`[help-corpus] ${tarball} not found; skipping Help corpus extraction`);
    return;
  }
  fs.mkdirSync(outDir, {recursive: true});
  execFileSync('tar', ['-xzf', tarball, '-C', outDir], {stdio: 'inherit'});
}

// Build configuration from environment
const isDevBuild = process.env.IS_DEV_BUILD === 'true';

// Per-PR preview builds (CI) set DOCS_BASE_PATH to an absolute path such as "/pr-123/".
// When present it overrides the normal base so every asset and link URL is prefixed for
// the preview's subdirectory. Normalized to always have a single leading/trailing slash.
const previewBasePath = process.env.DOCS_BASE_PATH
  ? `/${process.env.DOCS_BASE_PATH.replace(/^\/+|\/+$/g, '')}/`
  : undefined;

// Base paths - dev build lives in /dev/ subdirectory, stable/release is at root
const siteBase = '/b2c-developer-tooling';
const basePath = previewBasePath ?? (isDevBuild ? `${siteBase}/dev/` : `${siteBase}/`);

const toolkitSidebar = [
  {text: 'Overview', link: '/'},
  {
    text: 'Getting Started',
    items: [
      {text: 'Introduction', link: '/guide/'},
      {text: 'Authentication', link: '/guide/authentication'},
      {text: 'Configuration', link: '/guide/configuration'},
      {text: 'Safety Mode', link: '/guide/safety'},
    ],
  },
  {
    text: 'Developer Tools',
    items: [
      {
        text: 'CLI',
        link: '/cli/overview',
        collapsed: true,
        items: [{text: 'Installation', link: '/guide/installation'}],
      },
      {
        text: 'IDE Extension',
        link: '/vscode-extension/',
        collapsed: true,
        items: [
          {text: 'Installation', link: '/vscode-extension/installation'},
          {text: 'Configuration', link: '/vscode-extension/configuration'},
        ],
      },
    ],
  },
  {
    text: 'AI Tools',
    items: [
      {
        text: 'MCP',
        link: '/mcp/',
        collapsed: true,
        items: [
          {text: 'Configuration', link: '/mcp/configuration'},
          {text: 'MCP Tools', link: '/mcp/toolsets'},
          {text: 'Security and Access', link: '/mcp/security'},
        ],
      },
      {text: 'Agent Skills', link: '/guide/agent-skills'},
    ],
  },
  {
    text: 'Extend',
    items: [
      {text: 'CLI Extensions', link: '/guide/third-party-plugins'},
      {text: 'Build an Extension', link: '/guide/extending'},
    ],
  },
];

const guidesSidebar: DefaultTheme.SidebarItem[] = [
  {text: 'All Guides', link: '/guide/workflows'},
  {
    text: 'Development',
    collapsed: false,
    items: [
      {text: 'Storefront Next', link: '/guide/storefront-next'},
      {text: 'Scaffolding', link: '/guide/scaffolding'},
      {text: 'Script Debugger', link: '/guide/script-debugger'},
      {text: 'IDE Integration', link: '/guide/ide-integration'},
      {text: 'Commerce Apps', link: '/guide/commerce-apps'},
      {text: 'Security', link: '/guide/security'},
    ],
  },
  {
    text: 'Deployment & Automation',
    collapsed: false,
    items: [
      {text: 'CI/CD with GitHub Actions', link: '/guide/ci-cd'},
      {text: 'Import Sets', link: '/guide/import-sets'},
      {text: 'MRT Utilities', link: '/guide/mrt-utilities'},
    ],
  },
  {
    text: 'Operations & Administration',
    collapsed: false,
    items: [
      {text: 'Operations', link: '/guide/operations'},
      {text: 'Account Manager', link: '/guide/account-manager'},
      {text: 'Analytics Reports', link: '/guide/analytics-reports-cip-ccac'},
      {text: 'Metrics', link: '/guide/metrics'},
    ],
  },
  {
    text: 'Migration',
    collapsed: false,
    items: [
      {text: 'From sfcc-ci', link: '/guide/sfcc-ci-migration'},
      {text: 'From the sfcc-ci SDK', link: '/guide/sdk-migration'},
    ],
  },
];

// Preserve existing guide URLs while assigning task guides their own navigation.
const guidePaths = guidesSidebar
  .flatMap(({link, items}) => [link, ...(items ?? []).map((item) => item.link)])
  .filter((link): link is string => Boolean(link));
const guidesActiveMatch = `(?:${guidePaths.join('|')})(?:\\.html)?/?$`;

const referenceSidebar = [
  {
    text: 'CLI Commands',
    items: [
      {text: 'Overview', link: '/cli/'},
      {text: 'Account Manager', link: '/cli/account-manager'},
      {text: 'Auth', link: '/cli/auth'},
      {text: 'Business Manager', link: '/cli/bm'},
      {text: 'CIP', link: '/cli/cip'},
      {text: 'CAP (Commerce Apps)', link: '/cli/cap'},
      {text: 'Code', link: '/cli/code'},
      {text: 'Content', link: '/cli/content'},
      {text: 'Custom APIs', link: '/cli/custom-apis'},
      {text: 'Debug', link: '/cli/debug'},
      {text: 'Docs', link: '/cli/docs'},
      {text: 'eCDN', link: '/cli/ecdn'},
      {text: 'Jobs', link: '/cli/jobs'},
      {text: 'Logs', link: '/cli/logs'},
      {text: 'Metrics', link: '/cli/metrics'},
      {text: 'MRT', link: '/cli/mrt'},
      {text: 'Preferences', link: '/cli/preferences'},
      {text: 'Sandbox', link: '/cli/sandbox'},
      {text: 'Scaffold', link: '/cli/scaffold'},
      {text: 'SCAPI Schemas', link: '/cli/scapi-schemas'},
      {text: 'Granular Replications', link: '/cli/replications'},
      {text: 'Setup', link: '/cli/setup'},
      {text: 'Sites', link: '/cli/sites'},
      {text: 'SLAS', link: '/cli/slas'},
      {text: 'Storefront Next', link: '/cli/sfnext'},
      {text: 'WebDAV', link: '/cli/webdav'},
      {text: 'Logging', link: '/cli/logging'},
    ],
  },
];

export default defineConfig({
  title: 'Agentic B2C Developer Toolkit',
  description:
    'Agentic B2C Developer Toolkit — CLI, Agent Skills, MCP Server, SDK, and IDE Extension for Salesforce B2C Commerce',
  base: basePath,
  srcExclude: ['_partials/**', 'releases/_entries/**', 'public/releases/**'],

  head: [['link', {rel: 'describedby', type: 'text/plain', href: `${basePath}llms.txt`}]],

  transformPageData(pageData, {siteConfig}) {
    if (!fs.existsSync(path.join(siteConfig.srcDir, pageData.relativePath))) return;
    const head = (pageData.frontmatter.head ??= []);
    head.push(['link', {rel: 'alternate', type: 'text/markdown', href: `${basePath}${pageData.relativePath}`}]);
  },

  // Git-based "Last updated" timestamps (overridable per-page via frontmatter)
  lastUpdated: true,

  // Ignore dead links in api-readme.md (links are valid after TypeDoc generates the API docs)
  ignoreDeadLinks: [/^\.\/clients\//],

  buildEnd(siteConfig) {
    copyMarkdownSources(siteConfig.srcDir, siteConfig.outDir);
    fs.writeFileSync(path.join(siteConfig.outDir, 'releases/index.md'), releaseNotes.markdown);
    // Extract the Salesforce Help corpus straight into the build output (raw
    // .md served verbatim; fetched by `b2c docs read` via each entry's
    // sourceUrl). Done here — in buildEnd — because it only matters for the
    // deployed production site (dev never serves it), and this hook runs on
    // `vitepress build` only, after rendering, so nothing lands in the source
    // tree or the VitePress page graph.
    extractHelpCorpus(siteConfig.srcDir, siteConfig.outDir);
  },

  // Show deeper heading levels in the outline; register group-icons md plugin
  markdown: {
    toc: {level: [2, 3, 4]},
    config(md) {
      md.use(groupIconMdPlugin);
    },
  },

  vite: {
    plugins: [
      {
        name: 'release-notes',
        configureServer(server) {
          const entries = path.join(docsDirectory, 'releases/_entries');
          const seed = path.join(docsDirectory, '.vitepress/releases/seed.json');
          const live = path.join(docsDirectory, '.vitepress/releases/live.json');
          server.watcher.add([entries, seed, live]);
          server.watcher.on('all', (_event, file) => {
            if (file === seed || file === live || file.startsWith(entries + path.sep)) {
              generateReleaseNotes(docsDirectory);
            }
          });
        },
      },
      groupIconVitePlugin({
        // Assistant tabs are Vue components, outside the plugin's Markdown scan.
        defaultLabels: ['Claude Code', 'Codex', 'Copilot (VS Code)', 'Cursor', 'OpenCode', 'Gemini'],
        customIcon: {
          npx: 'vscode-icons:file-type-npm',
          homebrew: 'logos:homebrew',
          'agentforce vibes': {
            light:
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 56" fill="#333"><path d="M34 18h-7.9l6.8-15.2c0-.2.1-.5.1-.8 0-1.1-.9-2-2-2H9c-.9 0-1.7.6-1.9 1.5l-7 26c0 .2-.1.3-.1.5 0 1.1.9 2 2 2h7.5L4 53.5c0 .1-.1.3-.1.5 0 1.1.9 2 2 2 .6 0 1.2-.3 1.5-.7l28-34c.3-.4.5-.8.5-1.3.1-1.1-.8-2-1.9-2Z"/></svg>',
            dark: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 56" fill="#e8e8e8"><path d="M34 18h-7.9l6.8-15.2c0-.2.1-.5.1-.8 0-1.1-.9-2-2-2H9c-.9 0-1.7.6-1.9 1.5l-7 26c0 .2-.1.3-.1.5 0 1.1.9 2 2 2h7.5L4 53.5c0 .1-.1.3-.1.5 0 1.1.9 2 2 2 .6 0 1.2-.3 1.5-.7l28-34c.3-.4.5-.8.5-1.3.1-1.1-.8-2-1.9-2Z"/></svg>',
          },
          'claude code': 'logos:claude-icon',
          gemini:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285f4" d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68q.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58a12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68q-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96q2.19.93 3.81 2.55t2.55 3.81"/></svg>',
          opencode: {
            light:
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#26251e" d="M22 24H2V0h20zM17 4.8H7v14.4h10z"/></svg>',
            dark: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#edecec" d="M22 24H2V0h20zM17 4.8H7v14.4h10z"/></svg>',
          },
          cursor: {
            light:
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 466.73 532.09" fill="#26251e"><path d="M457.43,125.94L244.42,2.96c-6.84-3.95-15.28-3.95-22.12,0L9.3,125.94c-5.75,3.32-9.3,9.46-9.3,16.11v247.99c0,6.65,3.55,12.79,9.3,16.11l213.01,122.98c6.84,3.95,15.28,3.95,22.12,0l213.01-122.98c5.75-3.32,9.3-9.46,9.3-16.11v-247.99c0-6.65-3.55-12.79-9.3-16.11h-.01ZM444.05,151.99l-205.63,356.16c-1.39,2.4-5.06,1.42-5.06-1.36v-233.21c0-4.66-2.49-8.97-6.53-11.31L24.87,145.67c-2.4-1.39-1.42-5.06,1.36-5.06h411.26c5.84,0,9.49,6.33,6.57,11.39h-.01Z"/></svg>',
            dark: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 466.73 532.09" fill="#edecec"><path d="M457.43,125.94L244.42,2.96c-6.84-3.95-15.28-3.95-22.12,0L9.3,125.94c-5.75,3.32-9.3,9.46-9.3,16.11v247.99c0,6.65,3.55,12.79,9.3,16.11l213.01,122.98c6.84,3.95,15.28,3.95,22.12,0l213.01-122.98c5.75-3.32,9.3-9.46,9.3-16.11v-247.99c0-6.65-3.55-12.79-9.3-16.11h-.01ZM444.05,151.99l-205.63,356.16c-1.39,2.4-5.06,1.42-5.06-1.36v-233.21c0-4.66-2.49-8.97-6.53-11.31L24.87,145.67c-2.4-1.39-1.42-5.06,1.36-5.06h411.26c5.84,0,9.49,6.33,6.57,11.39h-.01Z"/></svg>',
          },
          'copilot (vs code)': 'logos:visual-studio-code',
          'copilot cli': {
            light: 'logos:github-copilot',
            dark: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e8e8e8"><path d="M21.4 14.3A10 10 0 0 0 22 11C22 5.5 17.5 1 12 1S2 5.5 2 11c0 1.1.2 2.2.6 3.3A5 5 0 0 0 0 18.5C0 21 2 23 4.5 23H6a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H5c-.3 0-.5-.2-.5-.5S4.7 16 5 16h1a3 3 0 0 1 3 3v3a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3a3 3 0 0 1 3-3h1c.3 0 .5.2.5.5s-.2.5-.5.5h-1a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1.5c2.5 0 4.5-2 4.5-4.5a5 5 0 0 0-2.6-4.2zM8.5 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm7 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>',
          },
          codex: {
            light: 'simple-icons:openai',
            dark: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e8e8e8"><path d="M22.3 8.6a5.8 5.8 0 0 0-.5-4.8 5.9 5.9 0 0 0-6.4-2.8A5.8 5.8 0 0 0 11 0a5.9 5.9 0 0 0-5.6 4A5.8 5.8 0 0 0 1.5 6.6a5.9 5.9 0 0 0 .7 6.8 5.8 5.8 0 0 0 .5 4.8 5.9 5.9 0 0 0 6.4 2.8A5.8 5.8 0 0 0 13 22a5.9 5.9 0 0 0 5.6-4 5.8 5.8 0 0 0 3.9-2.6 5.9 5.9 0 0 0-.7-6.8zM13 20.6a4.4 4.4 0 0 1-2.8-1l.2-.1 4.6-2.6a.7.7 0 0 0 .4-.7V10l2 1.1v5.7a4.4 4.4 0 0 1-4.4 3.8zm-9.4-3.5c-.6-1-.8-2.1-.5-3.2l.2.1 4.6 2.6a.7.7 0 0 0 .8 0l5.6-3.2v2.3l-4.7 2.7a4.4 4.4 0 0 1-6-1.3zM2.3 7.9A4.4 4.4 0 0 1 4.6 6v.2l.1 5.3a.7.7 0 0 0 .3.6l5.6 3.2-2 1.1L4 13.8A4.4 4.4 0 0 1 2.3 8zM18 10l-5.6-3.2 2-1.2 4.6 2.7a4.4 4.4 0 0 1-.7 7.9v-5.5a.7.7 0 0 0-.3-.6zm2-3.2-.2-.1-4.6-2.7a.7.7 0 0 0-.8 0L8.8 7.3V5l4.7-2.7a4.4 4.4 0 0 1 6.5 4.6zm-12 4L6 9.7V4a4.4 4.4 0 0 1 7.2-3.4l-.2.1L8.4 3.3a.7.7 0 0 0-.4.7zm1-2.2 2.5-1.4 2.5 1.4v2.9L9.5 13l-2.5-1.5z"/></svg>',
          },
          'b2c cli': 'logos:salesforce',
        },
      }),
    ],
  },

  themeConfig: {
    logo: '/logo.svg',
    outline: {
      level: [2, 3],
    },
    editLink: {
      pattern: 'https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/edit/main/docs/:path',
      text: 'Suggest changes to this page',
    },
    lastUpdated: {
      text: 'Last updated',
      formatOptions: {dateStyle: 'medium'},
    },
    nav: [
      {text: 'Docs', link: '/', activeMatch: `^(?!${guidesActiveMatch})(?!/api/|/releases/|/cli/(?!overview))/`},
      {text: 'Guides', link: '/guide/workflows', activeMatch: `^${guidesActiveMatch}`},
      {text: 'Reference', link: '/cli/', activeMatch: '^/cli/(?!overview)'},
      {text: 'Release Notes', link: '/releases/'},
      {
        text: 'SDKs',
        activeMatch: '^/api/',
        items: [{text: 'TypeScript SDK', link: '/api/'}],
      },
    ],

    footer: {
      message:
        'Released under the <a href="https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/license.txt">Apache-2.0 License</a>.' +
        ` <a href="${basePath}releases/">Release notes</a>. LLM? Read <a href="${basePath}llms.txt">llms.txt</a>.`,
      copyright: `Copyright © 2024-${new Date().getFullYear()} Salesforce, Inc.`,
    },

    sidebar: {
      '/': toolkitSidebar,
      '/mcp/': toolkitSidebar,
      '/vscode-extension/': toolkitSidebar,
      '/cli/overview': toolkitSidebar,
      '/cli/': referenceSidebar,
      ...Object.fromEntries(guidePaths.map((link) => [link, guidesSidebar])),
      '/guide/': toolkitSidebar,
      '/api/': [
        {
          text: 'SDK',
          items: [{text: 'Overview', link: '/api/'}],
        },
        ...typedocSidebar.map((section) => ({...section, collapsed: true})),
      ],
    },

    socialLinks: [{icon: 'github', link: 'https://github.com/SalesforceCommerceCloud/b2c-developer-tooling'}],

    search: {
      provider: 'local',
      options: {
        detailedView: true,
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: {title: 4, text: 2, titles: 1},
          },
        },
      },
    },
  },
});
