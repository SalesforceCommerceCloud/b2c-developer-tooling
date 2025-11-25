import { defineConfig } from 'vitepress';
import typedocSidebar from '../api/typedoc-sidebar.json';

export default defineConfig({
  title: 'B2C CLI',
  description: 'Salesforce Commerce Cloud B2C Command Line Tools',
  base: '',

  // Show deeper heading levels in the outline
  markdown: {
    toc: { level: [2, 3, 4] },
  },

  themeConfig: {
    outline: {
      level: [2, 3],
    },
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'CLI Reference', link: '/cli/' },
      { text: 'API Reference', link: '/api/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
      ],
      '/cli/': [
        {
          text: 'CLI Reference',
          items: [
            { text: 'Overview', link: '/cli/' },
            { text: 'Code Commands', link: '/cli/code' },
            { text: 'Sites Commands', link: '/cli/sites' },
            { text: 'Sandbox Commands', link: '/cli/sandbox' },
            { text: 'MRT Commands', link: '/cli/mrt' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [{ text: 'Overview', link: '/api/' }],
        },
        ...typedocSidebar,
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/salesforce/b2c-cli' }],

    search: {
      provider: 'local',
    },
  },
});
