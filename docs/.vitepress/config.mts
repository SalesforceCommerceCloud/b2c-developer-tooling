import fs from 'node:fs';
import path from 'node:path';
import {defineConfig} from 'vitepress';
import {groupIconMdPlugin, groupIconVitePlugin} from 'vitepress-plugin-group-icons';
import typedocSidebar from '../api/typedoc-sidebar.json';

// Copy source .md files to the build output so pages can be fetched as raw
// markdown (powers the "View as Markdown" / "Copy for LLM" buttons).
function copyMarkdownSources(srcDir: string, outDir: string) {
  const entries = fs.readdirSync(srcDir, {withFileTypes: true});
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const src = path.join(srcDir, entry.name);
    const dest = path.join(outDir, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dest, {recursive: true});
      copyMarkdownSources(src, dest);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      fs.copyFileSync(src, dest);
    }
  }
}

// Build configuration from environment
const isDevBuild = process.env.IS_DEV_BUILD === 'true';

// Base paths - dev build lives in /dev/ subdirectory, stable/release is at root
const siteBase = '/b2c-developer-tooling';
const basePath = isDevBuild ? `${siteBase}/dev/` : `${siteBase}/`;

// Build version dropdown items
// VitePress prepends base path to links starting with /, so we use relative paths
// that work correctly for each build context
function getVersionItems() {
  if (isDevBuild) {
    // Dev build: base is /b2c-developer-tooling/dev/
    // Use ../ to navigate up to stable docs at root
    return [
      {text: 'Latest Release', link: '../'},
      {text: 'Development (main)', link: '/'},
    ];
  }

  // Stable build: base is /b2c-developer-tooling/
  return [
    {text: 'Latest Release', link: '/'},
    {text: 'Development (main)', link: '/dev/'},
  ];
}

const guidesSidebar = [
  {
    text: 'Getting Started',
    items: [
      {text: 'Introduction', link: '/guide/'},
      {text: 'CLI Installation', link: '/guide/installation'},
      {text: 'CLI Configuration', link: '/guide/configuration'},
      {text: 'Agent Skills & Plugins', link: '/guide/agent-skills'},
    ],
  },
  {
    text: 'How-To',
    items: [
      {text: 'Authentication Setup', link: '/guide/authentication'},
      {text: 'CI/CD with GitHub Actions', link: '/guide/ci-cd'},
      {text: 'sfcc-ci Migration', link: '/guide/sfcc-ci-migration'},
      {text: 'sfcc-ci SDK Migration', link: '/guide/sdk-migration'},
      {text: 'Account Manager', link: '/guide/account-manager'},
      {text: 'Analytics Reports (CIP/CCAC)', link: '/guide/analytics-reports-cip-ccac'},
      {text: 'IDE Integration', link: '/guide/ide-integration'},
      {text: 'Scaffolding', link: '/guide/scaffolding'},
      {text: 'Safety Mode', link: '/guide/safety'},
      {text: 'Security', link: '/guide/security'},
      {text: 'Storefront Next', link: '/guide/storefront-next'},
      {text: 'MRT Utilities', link: '/guide/mrt-utilities'},
      {text: 'Commerce Apps (CAPs)', link: '/guide/commerce-apps'},
    ],
  },
  {
    text: 'MCP Server',
    items: [
      {text: 'Overview', link: '/mcp/'},
      {text: 'MCP Installation', link: '/mcp/installation'},
      {text: 'MCP Configuration', link: '/mcp/configuration'},
      {text: 'Toolsets & Tools', link: '/mcp/toolsets'},
      {text: 'Figma Tools Setup', link: '/mcp/figma-tools-setup'},
    ],
  },
  {
    text: 'Extending',
    items: [
      {text: 'Custom Plugins', link: '/guide/extending'},
      {text: '3rd Party Plugins', link: '/guide/third-party-plugins'},
    ],
  },
];

const referenceSidebar = [
  {
    text: 'CLI Commands',
    items: [
      {text: 'Overview', link: '/cli/'},
      {text: 'Account Manager', link: '/cli/account-manager'},
      {text: 'Auth', link: '/cli/auth'},
      {text: 'BM Roles', link: '/cli/bm-roles'},
      {text: 'CIP', link: '/cli/cip'},
      {text: 'CAP (Commerce Apps)', link: '/cli/cap'},
      {text: 'Code', link: '/cli/code'},
      {text: 'Content', link: '/cli/content'},
      {text: 'Custom APIs', link: '/cli/custom-apis'},
      {text: 'Docs', link: '/cli/docs'},
      {text: 'eCDN', link: '/cli/ecdn'},
      {text: 'Jobs', link: '/cli/jobs'},
      {text: 'Logs', link: '/cli/logs'},
      {text: 'MRT', link: '/cli/mrt'},
      {text: 'Sandbox', link: '/cli/sandbox'},
      {text: 'Scaffold', link: '/cli/scaffold'},
      {text: 'SCAPI Schemas', link: '/cli/scapi-schemas'},
      {text: 'Granular Replications', link: '/cli/replications'},
      {text: 'Setup', link: '/cli/setup'},
      {text: 'Sites', link: '/cli/sites'},
      {text: 'SLAS', link: '/cli/slas'},
      {text: 'WebDAV', link: '/cli/webdav'},
      {text: 'Logging', link: '/cli/logging'},
    ],
  },
  {
    text: 'MCP Tools',
    items: [
      {text: 'cartridge_deploy', link: '/mcp/tools/cartridge-deploy'},
      {text: 'mrt_bundle_push', link: '/mcp/tools/mrt-bundle-push'},
      {text: 'pwakit_get_guidelines', link: '/mcp/tools/pwakit-get-guidelines'},
      {text: 'scapi_schemas_list', link: '/mcp/tools/scapi-schemas-list'},
      {text: 'scapi_custom_api_generate_scaffold', link: '/mcp/tools/scapi-custom-api-generate-scaffold'},
      {text: 'scapi_custom_apis_get_status', link: '/mcp/tools/scapi-custom-apis-get-status'},
      {text: 'sfnext_get_guidelines', link: '/mcp/tools/sfnext-get-guidelines'},
      {text: 'sfnext_start_figma_workflow', link: '/mcp/tools/sfnext-start-figma-workflow'},
      {text: 'sfnext_analyze_component', link: '/mcp/tools/sfnext-analyze-component'},
      {text: 'sfnext_match_tokens_to_theme', link: '/mcp/tools/sfnext-match-tokens-to-theme'},
      {text: 'sfnext_add_page_designer_decorator', link: '/mcp/tools/sfnext-add-page-designer-decorator'},
      {text: 'sfnext_configure_theme', link: '/mcp/tools/sfnext-configure-theme'},
    ],
  },
];

// Script to force hard navigation for version switching links
// VitePress SPA router can't handle navigation between separate VitePress builds
const versionSwitchScript = `
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;
  const href = link.getAttribute('href');
  // Check if this is a version switch link
  if (href && (href.includes('/dev/') || href === '../')) {
    e.preventDefault();
    e.stopPropagation();
    if (href === '../') {
      // Navigate from /dev/ back to stable root - construct path explicitly
      // to avoid relative path issues with trailing slashes
      const path = window.location.pathname;
      const stablePath = path.replace(/\\/dev\\/.*$/, '/').replace(/\\/dev$/, '/');
      window.location.href = stablePath;
    } else {
      window.location.href = link.href;
    }
  }
}, true);
`;

export default defineConfig({
  title: 'B2C DX',
  description: 'Salesforce B2C Commerce Developer Experience - CLI, MCP Server, and SDK',
  base: basePath,

  head: [['script', {}, versionSwitchScript]],

  // Git-based "Last updated" timestamps (overridable per-page via frontmatter)
  lastUpdated: true,

  // Ignore dead links in api-readme.md (links are valid after TypeDoc generates the API docs)
  ignoreDeadLinks: [/^\.\/clients\//],

  buildEnd(siteConfig) {
    copyMarkdownSources(siteConfig.srcDir, siteConfig.outDir);
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
      groupIconVitePlugin({
        customIcon: {
          npx: 'vscode-icons:file-type-npm',
          homebrew: 'logos:homebrew',
          'agentforce vibes': {
            light:
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 56" fill="#333"><path d="M34 18h-7.9l6.8-15.2c0-.2.1-.5.1-.8 0-1.1-.9-2-2-2H9c-.9 0-1.7.6-1.9 1.5l-7 26c0 .2-.1.3-.1.5 0 1.1.9 2 2 2h7.5L4 53.5c0 .1-.1.3-.1.5 0 1.1.9 2 2 2 .6 0 1.2-.3 1.5-.7l28-34c.3-.4.5-.8.5-1.3.1-1.1-.8-2-1.9-2Z"/></svg>',
            dark: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 56" fill="#e8e8e8"><path d="M34 18h-7.9l6.8-15.2c0-.2.1-.5.1-.8 0-1.1-.9-2-2-2H9c-.9 0-1.7.6-1.9 1.5l-7 26c0 .2-.1.3-.1.5 0 1.1.9 2 2 2h7.5L4 53.5c0 .1-.1.3-.1.5 0 1.1.9 2 2 2 .6 0 1.2-.3 1.5-.7l28-34c.3-.4.5-.8.5-1.3.1-1.1-.8-2-1.9-2Z"/></svg>',
          },
          'claude code': 'logos:claude-icon',
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
    logo: '/logo-mark.svg',
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
      {text: 'Guides', link: '/guide/'},
      {text: 'Skills', link: '/guide/agent-skills'},
      {text: 'MCP', link: '/mcp/'},
      {text: 'Reference', link: '/cli/'},
      {text: 'SDK', link: '/api/'},
      {
        text: isDevBuild ? 'Dev' : 'Latest',
        items: getVersionItems(),
      },
    ],

    footer: {
      message: 'Released under the Apache-2.0 License.',
      copyright: `Copyright © ${new Date().getFullYear()} Salesforce, Inc.`,
    },

    sidebar: {
      '/mcp/tools/': referenceSidebar,
      '/mcp/': guidesSidebar,
      '/cli/': referenceSidebar,
      '/guide/': guidesSidebar,
      '/api/': [
        {
          text: 'SDK Reference',
          items: [{text: 'Overview', link: '/api/'}],
        },
        ...typedocSidebar,
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
