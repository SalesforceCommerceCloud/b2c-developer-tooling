import {defineConfig} from 'vitepress';
import typedocSidebar from '../api/typedoc-sidebar.json';

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

const guideSidebar = [
  {
    text: 'Getting Started',
    items: [
      {text: 'Introduction', link: '/guide/'},
      {text: 'Installation', link: '/guide/installation'},
      {text: 'Configuration', link: '/guide/configuration'},
      {text: 'Agent Skills & Plugins', link: '/guide/agent-skills'},
    ],
  },
  {
    text: 'Guides',
    items: [
      {text: 'Authentication Setup', link: '/guide/authentication'},
      {text: 'CI/CD with GitHub Actions', link: '/guide/ci-cd'},
      {text: 'Account Manager', link: '/guide/account-manager'},
      {text: 'Analytics Reports (CIP/CCAC)', link: '/guide/analytics-reports-cip-ccac'},
      {text: 'IDE Integration', link: '/guide/ide-integration'},
      {text: 'Scaffolding', link: '/guide/scaffolding'},
      {text: 'Security', link: '/guide/security'},
      {text: 'Storefront Next', link: '/guide/storefront-next'},
    ],
  },
  {
    text: 'Extending',
    items: [
      {text: 'Custom Plugins', link: '/guide/extending'},
      {text: '3rd Party Plugins', link: '/guide/third-party-plugins'},
    ],
  },
  {
    text: 'CLI Reference',
    items: [
      {text: 'Overview', link: '/cli/'},
      {text: 'Code Commands', link: '/cli/code'},
      {text: 'Content Commands', link: '/cli/content'},
      {text: 'CIP Commands', link: '/cli/cip'},
      {text: 'Job Commands', link: '/cli/jobs'},
      {text: 'Logs Commands', link: '/cli/logs'},
      {text: 'Sites Commands', link: '/cli/sites'},
      {text: 'WebDAV Commands', link: '/cli/webdav'},
      {text: 'Sandbox Commands', link: '/cli/sandbox'},
      {text: 'MRT Commands', link: '/cli/mrt'},
      {text: 'eCDN Commands', link: '/cli/ecdn'},
      {text: 'SLAS Commands', link: '/cli/slas'},
      {text: 'Custom APIs', link: '/cli/custom-apis'},
      {text: 'SCAPI Schemas', link: '/cli/scapi-schemas'},
      {text: 'Setup Commands', link: '/cli/setup'},
      {text: 'Scaffold Commands', link: '/cli/scaffold'},
      {text: 'Docs Commands', link: '/cli/docs'},
      {text: 'Auth Commands', link: '/cli/auth'},
      {text: 'Account Manager Commands', link: '/cli/account-manager'},
      {text: 'Logging', link: '/cli/logging'},
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

  // Ignore dead links in api-readme.md (links are valid after TypeDoc generates the API docs)
  ignoreDeadLinks: [/^\.\/clients\//],

  // Show deeper heading levels in the outline
  markdown: {
    toc: {level: [2, 3, 4]},
  },

  themeConfig: {
    logo: '/logo.svg',
    outline: {
      level: [2, 3],
    },
    nav: [
      {text: 'Guide', link: '/guide/'},
      {text: 'CLI Reference', link: '/cli/'},
      {text: 'API Reference', link: '/api/'},
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
      '/guide/': guideSidebar,
      '/cli/': guideSidebar,
      '/api/': [
        {
          text: 'API Reference',
          items: [{text: 'Overview', link: '/api/'}],
        },
        ...typedocSidebar,
      ],
    },

    socialLinks: [{icon: 'github', link: 'https://github.com/SalesforceCommerceCloud/b2c-developer-tooling'}],

    search: {
      provider: 'local',
    },
  },
});
