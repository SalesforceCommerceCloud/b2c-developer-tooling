/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Renders the AI Skills & MCP step body as styled HTML with one-click install
 * actions for each IDE the B2C CLI's `setup skills` command supports.
 *
 * IDE list and detection paths mirror `@salesforce/b2c-tooling-sdk/skills`
 * IDE_CONFIGS (DRY by mirroring the paths since the SDK runs in the extension
 * host too). Two intentional divergences from the SDK:
 *   - `vscode` detects via the VS Code user-data dir, NOT `~/.copilot`, so it
 *     doesn't collide with the separate GitHub Copilot CLI card (whose home IS
 *     `~/.copilot`). The SDK still uses `~/.copilot` for `vscode`.
 *   - `copilot-cli` is walkthrough-only — the SDK's IdeType union has no such
 *     value, so it installs skills via a marketplace command, not `--ide`.
 */

export type IdeStatus = 'not-installed' | 'ide-present' | 'skills-installed';

/**
 * MCP-server configuration state for a target.
 * - `configured` — a `b2c-dx-mcp` entry was found in the IDE's MCP config.
 * - `not-configured` — the IDE has a known MCP config location, but no entry yet.
 * - `unknown` — this IDE's MCP config path isn't documented, so we don't probe it
 *   (shown as a manual-setup hint rather than a false "not configured").
 */
export type McpStatus = 'configured' | 'not-configured' | 'unknown';

export interface AiSkillsTarget {
  /** CLI flag value for `b2c setup skills --ide <id>`. */
  id: string;
  label: string;
  description: string;
  /** Filesystem path used to detect IDE presence. */
  detectPath: string;
  /** Per-IDE skills install dir for `--global` installs (absolute). */
  globalSkillsDir: string;
  /** Per-IDE skills install dir for project-scoped installs (relative to workspace root). */
  projectSkillsDir: string;
  /**
   * Absolute dir that holds installed skills for marketplace-mode targets whose
   * skills DON'T land in `globalSkillsDir` (e.g. GitHub Copilot CLI installs
   * plugins under `~/.copilot/installed-plugins/<marketplace>/`). A `b2c*` entry
   * here counts as skills-installed.
   */
  skillsMarkerDir?: string;
  /**
   * How skills install for this target. `'cli'` (default) uses the file-copy
   * installer `b2c setup skills --ide <id>`. `'marketplace'` runs
   * `marketplaceCommand` as the primary action — used by GitHub Copilot CLI,
   * which is a marketplace-plugin target, NOT a valid `--ide` value.
   */
  skillsMode?: 'cli' | 'marketplace';
  /** Marketplace plugin command, if applicable. */
  marketplaceCommand?: string;
  /**
   * Command that uninstalls the marketplace plugins. Prepended to
   * `marketplaceCommand` for a clean "Reinstall" (uninstall → install) once the
   * plugins are already present. Only meaningful for marketplace-mode targets.
   */
  marketplaceUninstallCommand?: string;
  /** MCP install one-liner / snippet. */
  mcpCommand?: string;
  /** Project-relative MCP config file that would hold a `b2c-dx-mcp` entry. */
  mcpProjectConfig?: string;
  /** Absolute global MCP config file that would hold a `b2c-dx-mcp` entry. */
  mcpGlobalConfig?: string;
  /** Absolute marker dir whose existence implies MCP is registered (e.g. an installed extension). */
  mcpMarkerDir?: string;
}

const home = os.homedir();

/** Fallback MCP setup docs, linked when a target has no one-click MCP path. */
const MCP_DOCS_URL = 'https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/installation.html';

/** Only IDEs the b2c CLI's `setup skills` command actually supports. */
export const AI_SKILL_TARGETS: AiSkillsTarget[] = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    description: 'Anthropic CLI agent. Marketplace plugin recommended for auto-updates.',
    detectPath: path.join(home, '.claude'),
    globalSkillsDir: path.join(home, '.claude', 'skills'),
    projectSkillsDir: path.join('.claude', 'skills'),
    marketplaceCommand:
      'claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling && claude plugin install b2c-cli',
    mcpCommand:
      'claude mcp add --transport stdio --scope project b2c-dx-mcp -- npx -y @salesforce/b2c-dx-mcp@latest --allow-non-ga-tools',
    // `claude mcp add --scope project` writes .mcp.json; user scope writes ~/.claude.json.
    mcpProjectConfig: '.mcp.json',
    mcpGlobalConfig: path.join(home, '.claude.json'),
  },
  {
    id: 'cursor',
    label: 'Cursor',
    description: 'Cursor IDE. Skills install via b2c CLI; MCP via .cursor/mcp.json.',
    detectPath: path.join(home, '.cursor'),
    globalSkillsDir: path.join(home, '.cursor', 'skills'),
    projectSkillsDir: path.join('.cursor', 'skills'),
    mcpCommand:
      'mkdir -p .cursor && printf \'%s\' \'{"mcpServers":{"b2c-dx-mcp":{"command":"npx","args":["-y","@salesforce/b2c-dx-mcp@latest","--allow-non-ga-tools"]}}}\' > .cursor/mcp.json',
    mcpProjectConfig: path.join('.cursor', 'mcp.json'),
    mcpGlobalConfig: path.join(home, '.cursor', 'mcp.json'),
  },
  {
    id: 'windsurf',
    label: 'Windsurf',
    description: 'Codeium Windsurf editor.',
    detectPath: path.join(home, '.codeium', 'windsurf'),
    globalSkillsDir: path.join(home, '.codeium', 'windsurf', 'skills'),
    projectSkillsDir: path.join('.windsurf', 'skills'),
    // MCP config path for Windsurf is not documented in our install guide — leave
    // it unprobed (McpStatus 'unknown') rather than assert a false negative.
  },
  {
    id: 'vscode',
    label: 'VS Code / GitHub Copilot',
    description: 'Copilot Chat in VS Code. MCP via .vscode/mcp.json.',
    // Detect via the VS Code user dir, NOT ~/.copilot (that's the Copilot *CLI*,
    // which now has its own card below).
    detectPath: getVsCodeUserDir(),
    globalSkillsDir: path.join(home, '.copilot', 'skills'),
    projectSkillsDir: path.join('.github', 'skills'),
    mcpCommand:
      'mkdir -p .vscode && printf \'%s\' \'{"servers":{"b2c-dx-mcp":{"type":"stdio","command":"npx","args":["-y","@salesforce/b2c-dx-mcp@latest","--allow-non-ga-tools"]}}}\' > .vscode/mcp.json',
    mcpProjectConfig: path.join('.vscode', 'mcp.json'),
  },
  {
    id: 'codex',
    label: 'OpenAI Codex CLI',
    description: 'Codex CLI agent. Marketplace plugin available.',
    detectPath: path.join(home, '.codex'),
    globalSkillsDir: path.join(home, '.codex', 'skills'),
    projectSkillsDir: path.join('.codex', 'skills'),
    marketplaceCommand: 'codex plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling',
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    description: 'OpenCode agentic editor.',
    detectPath: path.join(home, '.config', 'opencode'),
    globalSkillsDir: path.join(home, '.config', 'opencode', 'skills'),
    projectSkillsDir: path.join('.opencode', 'skills'),
  },
  {
    id: 'gemini-cli',
    label: 'Gemini CLI',
    description: 'Google Gemini CLI. Extension install bundles skills, MCP, and context.',
    detectPath: path.join(home, '.gemini'),
    globalSkillsDir: path.join(home, '.gemini', 'skills'),
    projectSkillsDir: path.join('.gemini', 'skills'),
    // The extension bundles skills + MCP + GEMINI.md context in one install.
    // No raw mcpCommand: Gemini's ~/.gemini/settings.json holds broad settings
    // (not a dedicated mcp.json), so overwriting it would clobber user config.
    marketplaceCommand: 'gemini extensions install https://github.com/SalesforceCommerceCloud/b2c-developer-tooling',
    // The extension install drops the server under ~/.gemini/extensions/<name>.
    mcpMarkerDir: path.join(home, '.gemini', 'extensions', 'b2c-developer-tooling'),
    mcpGlobalConfig: path.join(home, '.gemini', 'settings.json'),
  },
  {
    id: 'antigravity',
    label: 'Google Antigravity',
    description: 'Google Antigravity (IDE/CLI/SDK). Skills via .agents/skills; MCP via .agents/mcp_config.json.',
    detectPath: path.join(home, '.gemini'),
    globalSkillsDir: path.join(home, '.gemini', 'config', 'skills'),
    projectSkillsDir: path.join('.agents', 'skills'),
    // .agents/mcp_config.json is a dedicated MCP file using the standard
    // mcpServers/stdio shape, so writing it directly is safe (like Cursor/VS Code).
    mcpCommand:
      'mkdir -p .agents && printf \'%s\' \'{"mcpServers":{"b2c-dx-mcp":{"command":"npx","args":["-y","@salesforce/b2c-dx-mcp@latest","--allow-non-ga-tools"]}}}\' > .agents/mcp_config.json',
    mcpProjectConfig: path.join('.agents', 'mcp_config.json'),
    mcpGlobalConfig: path.join(home, '.gemini', 'config', 'mcp_config.json'),
  },
  {
    // GitHub Copilot CLI is a MARKETPLACE-plugin target, not a `b2c setup skills
    // --ide` value — the CLI's IdeType union has no `copilot-cli`. Skills install
    // via `copilot plugin install`; MCP has no documented one-click path, so it
    // links to the setup docs.
    id: 'copilot-cli',
    label: 'GitHub Copilot CLI',
    description: 'GitHub Copilot in the terminal. Skills install as marketplace plugins.',
    detectPath: path.join(home, '.copilot'),
    globalSkillsDir: path.join(home, '.copilot', 'skills'),
    projectSkillsDir: path.join('.copilot', 'skills'),
    // `copilot plugin install` drops plugins under
    // ~/.copilot/installed-plugins/<marketplace>/<plugin>, NOT in a skills dir.
    // Our marketplace is `b2c-developer-tooling`, so its presence (containing
    // the b2c/b2c-cli plugins) means the skills are installed.
    skillsMarkerDir: path.join(home, '.copilot', 'installed-plugins', 'b2c-developer-tooling'),
    skillsMode: 'marketplace',
    // `marketplace add` errors ("already registered") if the marketplace is
    // already present, so separate it with `;` — otherwise `&&` would abort the
    // installs. The installs themselves chain with `&&` (b2c-cli after b2c).
    marketplaceCommand:
      'copilot plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling ; copilot plugin install b2c@b2c-developer-tooling && copilot plugin install b2c-cli@b2c-developer-tooling',
    // Reinstall = uninstall both plugins first, then re-run the install command.
    marketplaceUninstallCommand:
      'copilot plugin uninstall b2c@b2c-developer-tooling ; copilot plugin uninstall b2c-cli@b2c-developer-tooling',
    // MCP config location for Copilot CLI is not documented — surfaced as a docs link.
  },
  {
    id: 'agentforce-vibes',
    label: 'Agentforce Vibes',
    description: 'Salesforce Agentforce Vibes (VS Code extension).',
    detectPath: getAgentforceVibesProbePath(),
    globalSkillsDir: getAgentforceVibesGlobalDir(),
    projectSkillsDir: path.join('.a4drules', 'skills'),
  },
];

/** VS Code user-data dir, used to distinguish VS Code from the Copilot CLI (~/.copilot). */
function getVsCodeUserDir(): string {
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'Code');
  } else if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'Code');
  }
  return path.join(home, '.config', 'Code');
}

function getAgentforceVibesGlobalDir(): string {
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage');
  } else if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'Code', 'User', 'globalStorage');
  }
  return path.join(home, '.config', 'Code', 'User', 'globalStorage');
}

function getAgentforceVibesProbePath(): string {
  return path.join(getAgentforceVibesGlobalDir(), 'salesforce.salesforcedx-einstein-gpt');
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function dirHasB2cSkills(dir: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(dir);
    return entries.some((e) => e.toLowerCase().startsWith('b2c'));
  } catch {
    return false;
  }
}

/** Server-container keys used across the MCP config formats we support. */
const MCP_CONTAINER_KEYS = ['mcpServers', 'servers'] as const;

/**
 * Returns true if the given MCP config file registers a `b2c-dx-mcp` server.
 * Prefers a structural check — parse the JSON and look for a `b2c-dx-mcp` key
 * inside a `mcpServers` (Cursor/Gemini/Antigravity) or `servers` (VS Code
 * Copilot) container — so a disabled/commented mention or an unrelated string
 * in a broad settings file (`~/.gemini/settings.json`, `~/.claude.json`)
 * doesn't count as "configured". Falls back to a substring match only when the
 * file isn't parseable JSON. Missing/unreadable files → false.
 */
async function fileRegistersB2cMcp(file: string): Promise<boolean> {
  let text: string;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch {
    return false;
  }
  if (!text.includes('b2c-dx-mcp')) return false;
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return MCP_CONTAINER_KEYS.some((key) => {
      const container = parsed[key];
      return !!container && typeof container === 'object' && 'b2c-dx-mcp' in container;
    });
  } catch {
    // Not valid JSON (e.g. JSONC with comments) — the substring is our best signal.
    return true;
  }
}

/**
 * Resolve the MCP-server state for a target across its documented config
 * locations. Targets with no known MCP path resolve to `'unknown'` so the UI
 * can offer a manual-setup hint instead of a misleading "not configured".
 */
export async function detectMcpStatus(target: AiSkillsTarget, workspaceRoots: string[] = []): Promise<McpStatus> {
  const hasKnownLocation = !!(target.mcpProjectConfig || target.mcpGlobalConfig || target.mcpMarkerDir);
  if (!hasKnownLocation) return 'unknown';

  if (target.mcpMarkerDir && (await pathExists(target.mcpMarkerDir))) return 'configured';

  if (target.mcpProjectConfig) {
    for (const root of workspaceRoots) {
      if (await fileRegistersB2cMcp(path.join(root, target.mcpProjectConfig))) return 'configured';
    }
  }

  if (target.mcpGlobalConfig && (await fileRegistersB2cMcp(target.mcpGlobalConfig))) return 'configured';

  return 'not-configured';
}

/**
 * Returns the install state for a single target.
 * - `not-installed` — no IDE installed
 * - `ide-present` — IDE is on disk but no B2C skills found
 * - `skills-installed` — at least one b2c-* skill is already in the IDE's skills dir
 *
 * Checks both the global skills directory AND every workspace folder's
 * project-scoped skills dir, since `b2c setup skills` defaults to project
 * scope unless `--global` is passed.
 */
export async function detectIdeStatus(target: AiSkillsTarget, workspaceRoots: string[] = []): Promise<IdeStatus> {
  const idePresent = await pathExists(target.detectPath);
  if (!idePresent) return 'not-installed';

  // Marketplace-plugin targets (e.g. Copilot CLI) install skills outside the
  // per-IDE skills dir — check their dedicated marker dir for a b2c* entry.
  if (target.skillsMarkerDir && (await dirHasB2cSkills(target.skillsMarkerDir))) return 'skills-installed';

  // Project-scoped checks (one per workspace folder).
  for (const root of workspaceRoots) {
    const dir = path.join(root, target.projectSkillsDir);
    if (await dirHasB2cSkills(dir)) return 'skills-installed';
  }

  // Global / user-home check.
  if (await dirHasB2cSkills(target.globalSkillsDir)) return 'skills-installed';

  return 'ide-present';
}

export interface DetectedTarget extends AiSkillsTarget {
  status: IdeStatus;
  mcpStatus: McpStatus;
}

/**
 * Detect status for every target in parallel. Pulls workspace roots from
 * VS Code so project-scoped skill and MCP installs are picked up.
 */
export async function detectAllTargets(): Promise<DetectedTarget[]> {
  const roots = (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath);
  return Promise.all(
    AI_SKILL_TARGETS.map(async (t) => {
      const [status, mcpStatus] = await Promise.all([detectIdeStatus(t, roots), detectMcpStatus(t, roots)]);
      return {...t, status, mcpStatus};
    }),
  );
}

const escape = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );

const CHECK_SVG = `<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path fill="currentColor" d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/></svg>`;

function statusPill(status: IdeStatus): string {
  switch (status) {
    case 'skills-installed':
      return `<span class="ai-pill ai-pill--ok">${CHECK_SVG}Ready · Skills installed</span>`;
    case 'ide-present':
      return `<span class="ai-pill ai-pill--ready"><span class="ai-pill__dot"></span>IDE detected</span>`;
    case 'not-installed':
      return `<span class="ai-pill ai-pill--off"><span class="ai-pill__dot"></span>Not installed</span>`;
  }
}

/**
 * Small secondary badge showing MCP-server state. Only rendered when the IDE
 * is present (an "MCP configured" claim is meaningless for an absent IDE).
 * `unknown` targets (no documented MCP path) get a neutral "manual" hint.
 */
function mcpPill(status: McpStatus): string {
  switch (status) {
    case 'configured':
      return `<span class="ai-pill ai-pill--mcp-ok">${CHECK_SVG}MCP configured</span>`;
    case 'not-configured':
      return `<span class="ai-pill ai-pill--mcp-off"><span class="ai-pill__dot"></span>MCP not set up</span>`;
    case 'unknown':
      return `<span class="ai-pill ai-pill--mcp-na"><span class="ai-pill__dot"></span>MCP · manual</span>`;
  }
}

/** Per-IDE icon SVG. Stylised glyphs only — no logos to avoid trademark issues. */
function ideIcon(id: string): string {
  switch (id) {
    case 'claude-code':
      // Star-burst (Anthropic-ish accent)
      return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2 L14 9 L21 12 L14 15 L12 22 L10 15 L3 12 L10 9 Z"/></svg>`;
    case 'cursor':
      // Cursor / pointer arrow
      return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3 L4 18 L9 14 L12 21 L15 19 L12 12 L19 12 Z"/></svg>`;
    case 'windsurf':
      // Wind/wave lines
      return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 8 C 7 4, 11 12, 17 8 M3 14 C 7 10, 11 18, 21 14 M3 20 C 7 16, 11 24, 17 20"/></svg>`;
    case 'vscode':
      // Chat bubble (Copilot)
      return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M4 5 H20 V17 H13 L9 21 V17 H4 Z"/><circle cx="9" cy="11" r="0.9" fill="currentColor"/><circle cx="12" cy="11" r="0.9" fill="currentColor"/><circle cx="15" cy="11" r="0.9" fill="currentColor"/></svg>`;
    case 'codex':
      // Code brackets
      return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 6 3 12 8 18"/><polyline points="16 6 21 12 16 18"/></svg>`;
    case 'opencode':
      // Open hexagon
      return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><polygon points="12 3 21 8 21 16 12 21 3 16 3 8"/><circle cx="12" cy="12" r="3"/></svg>`;
    case 'gemini-cli':
      // Four-point sparkle (Gemini-ish accent)
      return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2 C12 7, 12 7, 22 12 C12 17, 12 17, 12 22 C12 17, 12 17, 2 12 C12 7, 12 7, 12 2 Z"/></svg>`;
    case 'antigravity':
      // Upward orbit (anti-gravity)
      return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="3"/><path d="M12 12 L12 3 M12 3 L9 6 M12 3 L15 6"/></svg>`;
    case 'copilot-cli':
      // Terminal prompt (CLI surface of Copilot)
      return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><polyline points="7 9 10 12 7 15"/><line x1="12" y1="15" x2="17" y2="15"/></svg>`;
    case 'agentforce-vibes':
      // Spark with cloud
      return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M14 2 L15.5 7 L20.5 8.5 L15.5 10 L14 15 L12.5 10 L7.5 8.5 L12.5 7 Z"/><circle cx="6" cy="17" r="2"/><circle cx="10" cy="20" r="1.5"/></svg>`;
    default:
      return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>`;
  }
}

export function generateAiSkillsHtml(targets: DetectedTarget[]): string {
  // Render detected IDEs first, then "ready" ones, then "not installed".
  const sorted = [...targets].sort((a, b) => {
    const order: Record<IdeStatus, number> = {'skills-installed': 0, 'ide-present': 1, 'not-installed': 2};
    return order[a.status] - order[b.status];
  });

  const downloadSvg = `<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M8 1v9.59l3.3-3.3 1.4 1.42L8 13.41 3.3 8.71l1.4-1.42L8 10.59V1zM2 14h12v2H2z"/></svg>`;

  const cards = sorted
    .map((t) => {
      const isInstalled = t.status === 'skills-installed';
      const isReady = t.status === 'ide-present';
      const isMissing = t.status === 'not-installed';
      // Marketplace-mode targets (GitHub Copilot CLI) install skills via a
      // `copilot plugin install` command, not `b2c setup skills --ide` — that
      // IDE value doesn't exist, so wiring the file-copy button would just fail.
      const marketplaceMode = t.skillsMode === 'marketplace';

      const skillsLabel = isInstalled ? 'Reinstall' : 'Install Skills';
      const skillsDisabled = isMissing ? 'disabled' : '';
      const skillsClass = isReady ? 'ai-btn ai-btn--primary' : isInstalled ? 'ai-btn ai-btn--ghost' : 'ai-btn';
      const skillsIcon = isReady || isInstalled ? downloadSvg : '';

      // Primary skills action: file-copy installer, or the marketplace command.
      // For a marketplace Reinstall, uninstall the plugins first so the install
      // is clean (uninstall → install); a fresh install just runs install.
      const marketplaceCmd =
        isInstalled && t.marketplaceUninstallCommand
          ? `${t.marketplaceUninstallCommand} ; ${t.marketplaceCommand ?? ''}`
          : (t.marketplaceCommand ?? '');
      const primaryAction = marketplaceMode
        ? `<button data-action="run-cmd" data-cmd="${escape(marketplaceCmd)}" data-label="${escape(t.label)} skills" class="${skillsClass}" ${skillsDisabled}>${skillsIcon}<span>${skillsLabel}</span></button>`
        : `<button data-action="install-skills" data-ide="${escape(t.id)}" class="${skillsClass}" ${skillsDisabled}>${skillsIcon}<span>${skillsLabel}</span></button>`;

      const secondaryActions: string[] = [];
      // In marketplace mode the plugin command IS the primary action — don't repeat it.
      if (t.marketplaceCommand && !marketplaceMode) {
        secondaryActions.push(
          `<button data-action="run-cmd" data-cmd="${escape(t.marketplaceCommand)}" data-label="${escape(t.label)} marketplace" class="ai-btn ai-btn--ghost" ${isMissing ? 'disabled' : ''}>Marketplace plugin</button>`,
        );
      }
      if (t.mcpCommand) {
        // Re-running the command overwrites the config, so label it as such
        // once the server is already registered.
        const mcpLabel = t.mcpStatus === 'configured' ? 'Re-configure MCP' : 'Install MCP';
        secondaryActions.push(
          `<button data-action="run-cmd" data-cmd="${escape(t.mcpCommand)}" data-label="${escape(t.label)} MCP" class="ai-btn ai-btn--ghost" ${isMissing ? 'disabled' : ''}>${mcpLabel}</button>`,
        );
      } else if (!isMissing) {
        // No one-click MCP path documented for this IDE — link to setup docs
        // instead of leaving the user with no MCP action at all.
        secondaryActions.push(
          `<a href="${MCP_DOCS_URL}" class="ai-btn ai-btn--ghost ai-btn--link">MCP setup guide</a>`,
        );
      }

      // Show the MCP badge next to the skills pill once the IDE is present.
      const mcpBadge = isMissing ? '' : mcpPill(t.mcpStatus);

      return `
        <article class="ai-card" data-status="${t.status}" data-mcp="${t.mcpStatus}">
          <header class="ai-card__top">
            <div class="ai-card__icon" data-id="${escape(t.id)}">${ideIcon(t.id)}</div>
            <div class="ai-card__title">
              <h3>${escape(t.label)}</h3>
              <div class="ai-card__pills">${statusPill(t.status)}${mcpBadge}</div>
            </div>
          </header>
          <p class="ai-card__desc">${escape(t.description)}</p>
          <div class="ai-card__cta">
            ${primaryAction}
            ${secondaryActions.length ? `<div class="ai-card__secondary">${secondaryActions.join('')}</div>` : ''}
          </div>
        </article>`;
    })
    .join('');

  const installedCount = targets.filter((t) => t.status !== 'not-installed').length;
  const skillsInstalledCount = targets.filter((t) => t.status === 'skills-installed').length;
  const mcpConfiguredCount = targets.filter((t) => t.mcpStatus === 'configured').length;

  return `<style>
:host, .ai-section { color: var(--vscode-foreground); }
.ai-section { margin: 0; }
.ai-section > p:first-child { margin: 0 0 14px; color: var(--vscode-descriptionForeground); font-size: 0.92rem; line-height: 1.55; max-width: 760px; }

.ai-stats-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px; flex-wrap: wrap;
  margin: 0 0 18px;
}
.ai-recheck {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--vscode-foreground) 22%, transparent);
  background: transparent;
  color: var(--vscode-descriptionForeground);
  font: inherit; font-size: 0.78rem; font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.ai-recheck:hover { color: var(--brand-blue, #0176D3); border-color: var(--brand-blue, #0176D3); background: var(--brand-blue-soft, rgba(1,118,211,0.08)); }
.ai-stats {
  display: inline-flex; flex-wrap: wrap; align-items: center; gap: 8px 14px;
  margin: 0;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--vscode-foreground) 22%, transparent);
  background: color-mix(in srgb, var(--vscode-foreground) 7%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vscode-foreground) 4%, transparent);
  font-size: 0.82rem;
}
.ai-stat {
  display: inline-flex; align-items: baseline; gap: 5px;
  color: var(--vscode-descriptionForeground);
}
.ai-stat__num { font-size: 0.96rem; font-weight: 800; line-height: 1; color: var(--vscode-foreground); }
.ai-stat__num--ok { color: #1A8754; }
.ai-stat__num--ready { color: #0176D3; }
.ai-stat__num--mcp { color: #6D28D9; }
.ai-stat__label { font-size: 0.78rem; font-weight: 500; }
.ai-stat__sep {
  color: var(--vscode-descriptionForeground);
  opacity: 0.7;
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 0.8;
  margin: 0 2px;
}

.ai-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
  margin: 0 0 24px;
}
.ai-card {
  position: relative;
  display: flex; flex-direction: column; gap: 12px;
  padding: 18px 20px 16px;
  border-radius: 12px;
  border: 1px solid var(--hairline, rgba(128,128,128,0.22));
  background: var(--surface-card, var(--vscode-editorWidget-background, var(--vscode-editor-background)));
  transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}
.ai-card:hover { border-color: color-mix(in srgb, var(--brand-blue, #0176D3) 35%, var(--hairline, rgba(128,128,128,0.22))); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
.ai-card[data-status="skills-installed"] { border-color: color-mix(in srgb, #1A8754 38%, var(--hairline, rgba(128,128,128,0.22))); }
.ai-card[data-status="ide-present"] { border-color: color-mix(in srgb, #0176D3 38%, var(--hairline, rgba(128,128,128,0.22))); }
.ai-card[data-status="not-installed"] { opacity: 0.55; }
.ai-card[data-status="not-installed"]:hover { transform: none; }

.ai-card__top { display: flex; align-items: flex-start; gap: 12px; }
.ai-card__icon {
  flex-shrink: 0;
  width: 40px; height: 40px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 10px;
  background: rgba(1,118,211,0.10);
  color: var(--brand-blue, #0176D3);
}
.ai-card[data-status="skills-installed"] .ai-card__icon { background: rgba(26,135,84,0.12); color: #1A8754; }
.ai-card[data-status="not-installed"] .ai-card__icon { background: rgba(127,127,127,0.14); color: var(--vscode-descriptionForeground); }
.ai-card__title { display: flex; flex-direction: column; gap: 6px; min-width: 0; flex: 1; }
.ai-card__title h3 { margin: 0; font-size: 1.0rem; font-weight: 700; letter-spacing: -0.005em; line-height: 1.2; }
.ai-card__desc { margin: 0; font-size: 0.84rem; color: var(--vscode-descriptionForeground); line-height: 1.55; min-height: 2.5em; }

.ai-card__cta { display: flex; flex-direction: column; gap: 8px; margin-top: auto; }
.ai-card__secondary { display: flex; flex-wrap: wrap; gap: 6px; }

.ai-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font: inherit; cursor: pointer;
  padding: 8px 14px; border-radius: 8px;
  border: 1px solid var(--brand-blue, #0176D3);
  background: transparent; color: var(--brand-blue, #0176D3);
  font-size: 0.84rem; font-weight: 600;
  transition: all 0.15s ease;
}
.ai-btn:hover:not([disabled]) { background: var(--brand-blue-soft, rgba(1,118,211,0.10)); }
.ai-btn--primary {
  background: var(--brand-blue, #0176D3); color: #fff;
  box-shadow: 0 1px 2px rgba(1,118,211,0.30);
}
.ai-btn--primary:hover:not([disabled]) { background: var(--brand-blue-deep, #014486); transform: translateY(-1px); box-shadow: 0 3px 10px rgba(1,118,211,0.35); }
.ai-btn--ghost {
  border-color: color-mix(in srgb, var(--vscode-foreground) 42%, transparent);
  color: var(--vscode-foreground);
  font-size: 0.78rem; padding: 6px 10px; border-radius: 999px;
}
.ai-btn--ghost:hover:not([disabled]) { border-color: var(--brand-blue, #0176D3); color: var(--brand-blue, #0176D3); background: transparent; }
.ai-btn--link { text-decoration: none; }
.ai-btn[disabled] { cursor: not-allowed; opacity: 0.5; }

.ai-card__pills { display: flex; flex-wrap: wrap; gap: 5px; }
.ai-pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 2px 10px; border-radius: 999px;
  font-size: 0.7rem; font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
  width: fit-content;
}
.ai-pill__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.ai-pill--ok { color: #1A8754; background: rgba(26,135,84,0.14); }
.ai-pill--ready { color: #0176D3; background: rgba(1,118,211,0.12); }
.ai-pill--off { color: var(--vscode-descriptionForeground); background: rgba(127,127,127,0.14); }
/* MCP badges use a distinct violet accent so they read as a separate axis from skills. */
.ai-pill--mcp-ok { color: #6D28D9; background: rgba(109,40,217,0.14); }
.ai-pill--mcp-off { color: var(--vscode-descriptionForeground); background: rgba(127,127,127,0.10); }
.ai-pill--mcp-na { color: var(--vscode-descriptionForeground); background: rgba(127,127,127,0.10); opacity: 0.85; }

.ai-tip {
  margin: 0 0 22px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid var(--hairline, rgba(128,128,128,0.18));
  background: rgba(127,127,127,0.06);
  font-size: 0.84rem; line-height: 1.55;
  color: var(--vscode-descriptionForeground);
}
.ai-tip strong { color: var(--vscode-foreground); }
.ai-tip code { font-family: var(--vscode-editor-font-family, ui-monospace, monospace); font-size: 0.82rem; padding: 1px 6px; border-radius: 4px; background: rgba(127,127,127,0.18); color: var(--vscode-foreground); }

.ai-section h2 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.10em; color: var(--vscode-foreground); margin: 16px 0 8px; }
.ai-section ul { margin: 0 0 16px; padding-left: 20px; }
.ai-section li { margin-bottom: 6px; line-height: 1.6; font-size: 0.88rem; }
.ai-section > p:last-of-type { font-size: 0.82rem; color: var(--vscode-descriptionForeground); }
</style>
<section class="ai-section">
<p>Configure once and your AI tools share the same instance, dw.json, and cartridge layout this extension already understands.</p>

<div class="ai-stats-row">
  <div class="ai-stats" role="group" aria-label="AI tool coverage">
    <span class="ai-stat"><span class="ai-stat__num">${targets.length}</span><span class="ai-stat__label">tools supported</span></span>
    <span class="ai-stat__sep">·</span>
    <span class="ai-stat"><span class="ai-stat__num ai-stat__num--ready">${installedCount}</span><span class="ai-stat__label">detected here</span></span>
    <span class="ai-stat__sep">·</span>
    <span class="ai-stat"><span class="ai-stat__num ai-stat__num--ok">${skillsInstalledCount}</span><span class="ai-stat__label">with skills</span></span>
    <span class="ai-stat__sep">·</span>
    <span class="ai-stat"><span class="ai-stat__num ai-stat__num--mcp">${mcpConfiguredCount}</span><span class="ai-stat__label">with MCP</span></span>
  </div>
  <button class="ai-recheck" data-action="ai-recheck" title="Re-detect installed IDEs, skills, and MCP config">
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M13.65 2.35a8 8 0 1 0 1.96 8.4l-1.83-.69A6 6 0 1 1 12.24 3.76L10 6h6V0l-2.35 2.35z"/></svg>
    Re-check
  </button>
</div>

<div class="ai-grid">${cards}</div>

<p class="ai-tip"><strong>One-click install.</strong> Click <em>Install Skills</em> on a detected tool and a terminal opens with the right command queued (<code>b2c setup skills b2c --ide &lt;ide&gt;</code>, or the marketplace-plugin command for GitHub Copilot CLI). Press <kbd>Enter</kbd> to run; the CLI handles paths, downloads, and overwrites.</p>

<h2>What gets installed</h2>
<ul>
  <li><strong>Agent Skills</strong> — B2C-specific instructions, prompts, and conventions your AI tool can reference.</li>
  <li><strong>MCP server</strong> — exposes B2C-specific tools (deploy, log queries, sandbox info) to any MCP-aware client.</li>
</ul>

<p><a href="https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/agent-skills.html">Agent Skills documentation</a> &middot; <a href="https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/">MCP server documentation</a></p>
</section>`;
}
