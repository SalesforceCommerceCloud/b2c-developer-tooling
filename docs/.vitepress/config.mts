import { defineConfig } from 'vitepress';
import typedocSidebar from '../api/typedoc-sidebar.json';

const guideSidebar = [
  {
    text: 'Getting Started',
    items: [
      { text: 'Introduction', link: '/guide/' },
      { text: 'Installation', link: '/guide/installation' },
      { text: 'Configuration', link: '/guide/configuration' },
    ],
  },
  {
    text: 'CLI Reference',
    items: [
      { text: 'Overview', link: '/cli/' },
      { text: 'Code Commands', link: '/cli/code' },
      { text: 'Sites Commands', link: '/cli/sites' },
      { text: 'Sandbox Commands', link: '/cli/sandbox' },
      { text: 'MRT Commands', link: '/cli/mrt' },
      { text: 'Logging', link: '/cli/logging' },
    ],
  },
];

export default defineConfig({
  title: 'B2C CLI',
  description: 'Salesforce Commerce Cloud B2C Command Line Tools',
  base: '',

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
      message: 'All rights reserved.',
      copyright: `Copyright © ${new Date().getFullYear()} Salesforce, Inc. All rights reserved.`,
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

    socialLinks: [{ icon: 'github', link: 'https://github.com/SalesforceCommerceCloud/b2c-cli' }],

    search: {
      provider: 'local',
    },
  },
});
