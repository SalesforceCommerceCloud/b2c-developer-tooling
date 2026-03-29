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
      {text: 'Security', link: '/guide/security'},
      {text: 'Storefront Next', link: '/guide/storefront-next'},
      {text: 'MRT Utilities', link: '/guide/mrt-utilities'},
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
      {text: 'Guides', link: '/guide/'},
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
    },
  },
});
