import { defineConfig } from 'vitepress';
import typedocSidebar from '../api/typedoc-sidebar.json';

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
      { text: 'Sites Commands', link: '/cli/sites' },
      { text: 'WebDAV Commands', link: '/cli/webdav' },
      { text: 'ODS Commands', link: '/cli/ods' },
      { text: 'MRT Commands', link: '/cli/mrt' },
      { text: 'SLAS Commands', link: '/cli/slas' },
      { text: 'Custom APIs', link: '/cli/custom-apis' },
      { text: 'SCAPI Schemas', link: '/cli/scapi-schemas' },
      { text: 'Setup Commands', link: '/cli/setup' },
      { text: 'Auth Commands', link: '/cli/auth' },
      { text: 'Logging', link: '/cli/logging' },
    ],
  },
];

export default defineConfig({
  title: 'B2C DX',
  description: 'Salesforce Commerce Cloud B2C Developer Experience - CLI, MCP Server, and SDK',
  base: '/b2c-developer-tooling/',

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
