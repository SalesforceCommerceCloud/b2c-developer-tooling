<!--
  Set up an AI coding agent · Quickstart adventure.

  Branches heavily by IDE. Synthesizer assembles install commands + optional
  MCP config block (no dw.json — credentials are covered by other adventures).

  Page shim: docs/quickstart/agent-mcp.md
-->
<script setup lang="ts">
import {check, link} from '../data/adventures/_helpers.js';
import type {AdventureState, Flags, Synthesizer} from '../theme/adventure/declarative/wizard-context.js';

function ideAnchor(ide: string): {hash: string; label: string} {
  switch (ide) {
    case 'claude-code':
      return {hash: 'claude-code', label: 'Claude Code'};
    case 'cursor':
      return {hash: 'other-ides', label: 'Other IDEs'};
    case 'copilot-vscode':
    case 'copilot-cli':
      return {hash: 'copilot', label: 'Copilot'};
    case 'codex':
      return {hash: 'codex', label: 'Codex'};
    case 'agentforce-vibes':
      return {hash: 'agentforce-vibes', label: 'Agentforce Vibes'};
    default:
      return {hash: 'quick-start', label: 'Quick Start'};
  }
}

function vendorSkillsDoc(ide: string): {label: string; url: string} | null {
  switch (ide) {
    case 'claude-code':
      return {label: 'Claude Code plugins (vendor docs)', url: 'https://docs.claude.com/en/docs/claude-code/plugins'};
    case 'cursor':
      return {label: 'Cursor skills (vendor docs)', url: 'https://cursor.com/docs/context/skills'};
    case 'copilot-vscode':
      return {
        label: 'VS Code agent skills (vendor docs)',
        url: 'https://code.visualstudio.com/docs/copilot/customization/agent-skills',
      };
    case 'copilot-cli':
      return {label: 'GitHub Copilot CLI (vendor docs)', url: 'https://github.com/github/copilot-cli'};
    case 'codex':
      return {label: 'Codex CLI (vendor docs)', url: 'https://github.com/openai/codex'};
    case 'agentforce-vibes':
      return {
        label: 'Agentforce Vibes skills (vendor docs)',
        url: 'https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/skills.html',
      };
    default:
      return null;
  }
}

function vendorMcpDoc(ide: string): {label: string; url: string} | null {
  switch (ide) {
    case 'claude-code':
      return {label: 'Claude Code MCP (vendor docs)', url: 'https://docs.claude.com/en/docs/claude-code/mcp'};
    case 'cursor':
      return {
        label: 'Cursor MCP configuration (vendor docs)',
        url: 'https://cursor.com/docs/context/mcp#configuration-locations',
      };
    case 'copilot-vscode':
      return {
        label: 'VS Code MCP servers (vendor docs)',
        url: 'https://code.visualstudio.com/docs/copilot/customization/mcp-servers',
      };
    default:
      return null;
  }
}

function mcpAnchor(ide: string): {hash: string; label: string} {
  switch (ide) {
    case 'claude-code':
      return {hash: 'claude-code', label: 'MCP for Claude Code'};
    case 'cursor':
      return {hash: 'cursor', label: 'MCP for Cursor'};
    case 'copilot-vscode':
      return {hash: 'github-copilot', label: 'MCP for GitHub Copilot'};
    default:
      return {hash: 'after-installation', label: 'MCP After Installation'};
  }
}

const showMcpStep = (state: AdventureState, _flags: Flags) => state.ide !== 'codex';
const showToolsetsStep = (state: AdventureState, _flags: Flags) => state.includeMcp === true;

const synth: Synthesizer = (state) => {
  const ide = String(state.ide ?? 'claude-code');
  const skillsList = Array.isArray(state.skills) ? state.skills : ['b2c-cli', 'b2c', 'storefront-next'];
  const includeMcp = state.includeMcp === true;
  const toolsets = String(state.toolsets ?? 'all');

  let installBlock = '';
  if (ide === 'claude-code') {
    const lines = ['claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling'];
    for (const s of skillsList) lines.push(`claude plugin install ${s}`);
    if (includeMcp) lines.push('claude plugin install b2c-dx-mcp --scope project');
    installBlock = lines.join('\n');
  } else if (ide === 'copilot-cli') {
    const lines = ['copilot plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling'];
    for (const s of skillsList) lines.push(`copilot plugin install ${s}@b2c-developer-tooling`);
    installBlock = lines.join('\n');
  } else if (ide === 'codex') {
    installBlock =
      '# In a terminal:\ncodex plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling\n# Then in Codex:\n#   /plugins → select "B2C Developer Tooling" → install desired plugins';
  } else if (ide === 'cursor') {
    installBlock = skillsList.map((s) => `npx @salesforce/b2c-cli setup skills ${s} --ide cursor`).join('\n');
  } else if (ide === 'copilot-vscode') {
    installBlock = [
      '# In VS Code, open the Command Palette (Cmd/Ctrl+Shift+P) and run:',
      '#   Chat: Install Plugin from Source',
      '# Then enter:',
      '#   SalesforceCommerceCloud/b2c-developer-tooling',
      '# To update later: Extensions view → ··· menu → Check for Extension Updates',
    ].join('\n');
  } else if (ide === 'agentforce-vibes') {
    installBlock = skillsList
      .map((s) => `npx @salesforce/b2c-cli setup skills ${s} --ide agentforce-vibes`)
      .join('\n');
  }

  let mcpConfig = '';
  if (includeMcp && (ide === 'cursor' || ide === 'copilot-vscode')) {
    const filePath = ide === 'cursor' ? '.cursor/mcp.json' : '.vscode/mcp.json';
    const topKey = ide === 'cursor' ? 'mcpServers' : 'servers';
    const extra = ide === 'cursor' ? '' : '"type": "stdio",\n      ';
    mcpConfig = `Add the following to \`${filePath}\` in your project root:\n\n\`\`\`json\n{\n  "${topKey}": {\n    "b2c-dx-mcp": {\n      ${extra}"command": "npx",\n      "args": ["-y", "@salesforce/b2c-dx-mcp@latest", "--toolsets", "${toolsets}", "--allow-non-ga-tools"]\n    }\n  }\n}\n\`\`\``;
  } else if (includeMcp && ide === 'agentforce-vibes') {
    mcpConfig = 'For Agentforce Vibes, follow the IDE-specific MCP setup linked in the checklist.';
  }

  const ideDoc = ideAnchor(ide);
  const mcpDoc = mcpAnchor(ide);
  const vendorSkills = vendorSkillsDoc(ide);
  const vendorMcp = vendorMcpDoc(ide);

  const checklist = [
    check(`Install B2C agent skills for ${ideDoc.label}`, link('/guide/agent-skills', ideDoc.hash, ideDoc.label)),
    ...(vendorSkills
      ? [check(`Reference: ${vendorSkills.label}`, link(vendorSkills.url, undefined, vendorSkills.label))]
      : []),
    ...(includeMcp
      ? [
          check(`Install the MCP server for ${ideDoc.label}`, link('/mcp/installation', mcpDoc.hash, mcpDoc.label)),
          ...(vendorMcp ? [check(`Reference: ${vendorMcp.label}`, link(vendorMcp.url, undefined, vendorMcp.label))] : []),
          check(
            'Pick your MCP toolsets (or accept defaults)',
            link('/mcp/configuration', 'toolset-selection', 'Toolset Selection'),
          ),
        ]
      : []),
    check(
      'Provide credentials via dw.json or .env in the project root',
      link('/mcp/configuration', 'dw-json', 'MCP Credentials (dw.json)'),
    ),
  ];

  const warnings: string[] = [];
  if (mcpConfig) warnings.push(mcpConfig);
  if (ide === 'codex') {
    warnings.push(
      'Codex does not yet support an MCP plugin via the marketplace. Skills are installed; install the MCP server separately when Codex adds support.',
    );
  }

  return {
    dwJson: installBlock,
    checklist,
    warnings,
    verifyCommand:
      ide === 'claude-code'
        ? 'claude plugin list'
        : ide === 'copilot-cli'
          ? 'copilot plugin list'
          : 'In your IDE, ask the agent: "What B2C skills do you have available?"',
  };
};
</script>

<template>
  <Wizard
    id="agent-mcp"
    title="Set up an AI coding agent"
    tagline="Install B2C agent skills and the MCP server in your IDE."
    intro="Pair the B2C agent skills with the MCP server so your coding agent can both understand the platform and call CLI/MCP tools. Pick your IDE first; everything else flows from that."
    icon="mdi:robot-outline"
    :synth="synth"
  >
    <QStep
      id="ide"
      title="Which IDE / agent?"
      :doc="{path: '/guide/agent-skills', hash: 'quick-start', label: 'Agent Skills Quick Start'}"
    >
      <QChoice
        id="claude-code"
        title="Claude Code"
        subtitle="Anthropic"
        icon="logos:claude-icon"
        :badges="[{text: 'Recommended', tone: 'info'}]"
        :contributes="{ide: 'claude-code'}"
      >
        Marketplace install for skills + MCP via the official plugin.
      </QChoice>
      <QChoice
        id="cursor"
        title="Cursor"
        subtitle="Anysphere"
        icon="mdi:cursor-default-outline"
        :contributes="{ide: 'cursor'}"
      >
        Skills via <code>b2c setup skills</code>; MCP via project-level <code>.cursor/mcp.json</code>.
      </QChoice>
      <QChoice
        id="copilot-vscode"
        title="GitHub Copilot (VS Code)"
        subtitle="GitHub"
        icon="logos:visual-studio-code"
        :contributes="{ide: 'copilot-vscode'}"
      >
        Skills via Command Palette (Chat: Install Plugin from Source); MCP via <code>.vscode/mcp.json</code>.
      </QChoice>
      <QChoice
        id="copilot-cli"
        title="Copilot CLI"
        subtitle="GitHub"
        icon="logos:github-copilot"
        :contributes="{ide: 'copilot-cli'}"
      >
        Marketplace install via the <code>copilot</code> CLI.
      </QChoice>
      <QChoice
        id="codex"
        title="Codex"
        subtitle="OpenAI"
        icon="simple-icons:openai"
        :contributes="{ide: 'codex'}"
      >
        Marketplace install via the <code>codex</code> CLI; MCP not yet available.
      </QChoice>
      <QChoice
        id="agentforce-vibes"
        title="Agentforce Vibes"
        subtitle="Salesforce"
        icon="mdi:flash-outline"
        :contributes="{ide: 'agentforce-vibes'}"
      >
        Skills via <code>b2c setup skills</code>; MCP via direct add.
      </QChoice>
    </QStep>

    <QStep
      id="skills"
      title="Which skill packs?"
      subtitle="Pick one or more — each pack covers a different layer of the stack."
      :multi-select="true"
      :min-picks="1"
      :doc="{path: '/guide/agent-skills', hash: 'available-plugins', label: 'Available Plugins'}"
    >
      <QChoice
        id="b2c-cli"
        title="b2c-cli"
        subtitle="CLI commands"
        icon="mdi:console"
        :contributes="{skills: ['b2c-cli']}"
      >
        Code deploy, jobs, ODS, WebDAV, site archives.
      </QChoice>
      <QChoice
        id="b2c"
        title="b2c"
        subtitle="Platform patterns"
        icon="mdi:salesforce"
        :contributes="{skills: ['b2c']}"
      >
        Controllers, ISML, hooks, Page Designer, Custom APIs, services.
      </QChoice>
      <QChoice
        id="storefront-next"
        title="storefront-next"
        subtitle="Storefront Next"
        icon="mdi:rocket-outline"
        :contributes="{skills: ['storefront-next']}"
      >
        PWA scaffolding, routing, auth, deployment to MRT.
      </QChoice>
    </QStep>

    <QStep
      id="mcp"
      title="Install the MCP server?"
      subtitle="MCP gives your agent direct tool calls in addition to skills."
      :doc="{path: '/mcp/installation', label: 'MCP Installation'}"
      :show-if="showMcpStep"
    >
      <QChoice
        id="yes"
        title="Yes — install MCP"
        subtitle="Recommended"
        icon="mdi:check-circle-outline"
        :badges="[{text: 'Recommended', tone: 'info'}]"
        :contributes="{includeMcp: true}"
      >
        Adds direct tool-calls (deploy, watch, schemas, MRT) on top of skills.
      </QChoice>
      <QChoice
        id="no"
        title="No — skills only"
        icon="mdi:close-circle-outline"
        :contributes="{includeMcp: false}"
      >
        Skip MCP for now; install later from the same marketplace.
      </QChoice>
    </QStep>

    <QStep
      id="toolsets"
      title="Which MCP toolsets?"
      subtitle="Pre-select the tools your project actually needs."
      :doc="{path: '/mcp/configuration', hash: 'toolset-selection', label: 'Toolset Selection'}"
      :show-if="showToolsetsStep"
    >
      <QChoice
        id="all"
        title="All toolsets"
        subtitle="Everything"
        icon="mdi:toolbox"
        :badges="[{text: 'Quick', tone: 'quick'}]"
        :contributes="{toolsets: 'all'}"
      >
        CARTRIDGES, SCAPI, MRT, PWAV3, STOREFRONTNEXT.
      </QChoice>
      <QChoice
        id="cartridges-scapi"
        title="Cartridges + SCAPI"
        subtitle="Most common"
        icon="mdi:package-variant"
        :contributes="{toolsets: 'CARTRIDGES,SCAPI'}"
      >
        For SFRA-based projects with Custom APIs.
      </QChoice>
      <QChoice
        id="storefront-next"
        title="Storefront Next + MRT"
        subtitle="Headless"
        icon="mdi:rocket-launch-outline"
        :contributes="{toolsets: 'STOREFRONTNEXT,MRT'}"
      >
        For Storefront Next projects deploying to Managed Runtime.
      </QChoice>
    </QStep>
  </Wizard>
</template>
