import { defineConfig } from 'vitepress';
import typedocSidebar from '../api/typedoc-sidebar.json';

// Version configuration from environment
const releaseVersion = process.env.RELEASE_VERSION || 'unreleased';
const isReleaseBuild = process.env.IS_RELEASE_BUILD === 'true';

// Base paths - release build lives in /release/ subdirectory
const siteBase = '/b2c-developer-tooling';
const basePath = isReleaseBuild ? `${siteBase}/release/` : `${siteBase}/`;

// Build version dropdown items
// VitePress prepends base path to links starting with /, so we use relative paths
// that work correctly for each build context
function getVersionItems() {
  if (releaseVersion === 'unreleased') {
    // No release yet - only show dev
    return [{ text: 'Development (main)', link: '/' }];
  }

  if (isReleaseBuild) {
    // Release build: base is /b2c-developer-tooling/release/
    // Use ../ to navigate up to main docs
    return [
      { text: 'Development (main)', link: '../' },
      { text: `Release (${releaseVersion})`, link: '/' },
    ];
  }

  // Main build: base is /b2c-developer-tooling/
  return [
    { text: 'Development (main)', link: '/' },
    { text: `Release (${releaseVersion})`, link: '/release/' },
  ];
}

const guideSidebar = [
  {
    text: 'Getting Started',
    items: [
      { text: 'Introduction', link: '/guide/' },
      { text: 'Installation', link: '/guide/installation' },
      { text: 'Configuration', link: '/guide/configuration' },
      { text: 'Agent Skills & Plugins', link: '/guide/agent-skills' },
    ],
  },
  {
    text: 'Guides',
    items: [
      { text: 'Authentication Setup', link: '/guide/authentication' },
      { text: 'Scaffolding', link: '/guide/scaffolding' },
      { text: 'IDE Support', link: '/guide/ide-support' },
      { text: 'Security', link: '/guide/security' },
    ],
  },
  {
    text: 'Extending',
    items: [
      { text: 'Custom Plugins', link: '/guide/extending' },
      { text: '3rd Party Plugins', link: '/guide/third-party-plugins' },
    ],
  },
  {
    text: 'CLI Reference',
    items: [
      { text: 'Overview', link: '/cli/' },
      { text: 'Code Commands', link: '/cli/code' },
      { text: 'Job Commands', link: '/cli/jobs' },
      { text: 'Logs Commands', link: '/cli/logs' },
      { text: 'Sites Commands', link: '/cli/sites' },
      { text: 'WebDAV Commands', link: '/cli/webdav' },
      { text: 'Sandbox Commands', link: '/cli/sandbox' },
      { text: 'MRT Commands', link: '/cli/mrt' },
      { text: 'eCDN Commands', link: '/cli/ecdn' },
      { text: 'SLAS Commands', link: '/cli/slas' },
      { text: 'Custom APIs', link: '/cli/custom-apis' },
      { text: 'SCAPI Schemas', link: '/cli/scapi-schemas' },
      { text: 'Setup Commands', link: '/cli/setup' },
      { text: 'Scaffold Commands', link: '/cli/scaffold' },
      { text: 'Auth Commands', link: '/cli/auth' },
      { text: 'Account Manager Commands', link: '/cli/account-manager' },
      { text: 'Logging', link: '/cli/logging' },
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
  if (href && (href.includes('/release/') || href === '../')) {
    e.preventDefault();
    e.stopPropagation();
    if (href === '../') {
      // Navigate from /release/ back to main - construct path explicitly
      // to avoid relative path issues with trailing slashes
      const path = window.location.pathname;
      const mainPath = path.replace(/\\/release\\/.*$/, '/').replace(/\\/release$/, '/');
      window.location.href = mainPath;
    } else {
      window.location.href = link.href;
    }
  }
}, true);
`;

export default defineConfig({
  title: 'B2C DX',
  description: 'Salesforce Commerce Cloud B2C Developer Experience - CLI, MCP Server, and SDK',
  base: basePath,

  head: [['script', {}, versionSwitchScript]],

  // Ignore dead links in api-readme.md (links are valid after TypeDoc generates the API docs)
  ignoreDeadLinks: [/^\.\/clients\//],

  // Show deeper heading levels in the outline
  markdown: {
    toc: { level: [2, 3, 4] },
  },

  themeConfig: {
    logo: '/logo.svg',
    outline: {
      level: [2, 3],
    },
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'CLI Reference', link: '/cli/' },
      { text: 'API Reference', link: '/api/' },
      {
        text: isReleaseBuild ? releaseVersion : 'dev',
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
          items: [{ text: 'Overview', link: '/api/' }],
        },
        ...typedocSidebar,
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/SalesforceCommerceCloud/b2c-developer-tooling' }],

    search: {
      provider: 'local',
    },
  },
});
