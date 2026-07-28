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
 * IDE list and detection paths come directly from
 * `@salesforce/b2c-tooling-sdk/skills` IDE_CONFIGS (DRY by mirroring the
 * paths since the SDK runs in the extension host too).
 */

export type IdeStatus = 'not-installed' | 'ide-present' | 'skills-installed';

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
  /** Marketplace plugin command, if applicable. */
  marketplaceCommand?: string;
  /** MCP install one-liner / snippet. */
  mcpCommand?: string;
}

const home = os.homedir();

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
  },
  {
    id: 'windsurf',
    label: 'Windsurf',
    description: 'Codeium Windsurf editor.',
    detectPath: path.join(home, '.codeium', 'windsurf'),
    globalSkillsDir: path.join(home, '.codeium', 'windsurf', 'skills'),
    projectSkillsDir: path.join('.windsurf', 'skills'),
  },
  {
    id: 'vscode',
    label: 'VS Code / GitHub Copilot',
    description: 'Copilot Chat in VS Code. MCP via .vscode/mcp.json.',
    detectPath: path.join(home, '.copilot'),
    globalSkillsDir: path.join(home, '.copilot', 'skills'),
    projectSkillsDir: path.join('.github', 'skills'),
    mcpCommand:
      'mkdir -p .vscode && printf \'%s\' \'{"servers":{"b2c-dx-mcp":{"type":"stdio","command":"npx","args":["-y","@salesforce/b2c-dx-mcp@latest","--allow-non-ga-tools"]}}}\' > .vscode/mcp.json',
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
    id: 'agentforce-vibes',
    label: 'Agentforce Vibes',
    description: 'Salesforce Agentforce Vibes (VS Code extension).',
    detectPath: getAgentforceVibesProbePath(),
    globalSkillsDir: getAgentforceVibesGlobalDir(),
    projectSkillsDir: path.join('.a4drules', 'skills'),
  },
];

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
}

/**
 * Detect status for every target in parallel. Pulls workspace roots from
 * VS Code so project-scoped skill installs are picked up.
 */
export async function detectAllTargets(): Promise<DetectedTarget[]> {
  const roots = (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath);
  return Promise.all(AI_SKILL_TARGETS.map(async (t) => ({...t, status: await detectIdeStatus(t, roots)})));
}

const escape = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );

function statusPill(status: IdeStatus): string {
  switch (status) {
    case 'skills-installed':
      return `<span class="ai-pill ai-pill--ok"><svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path fill="currentColor" d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/></svg>Ready · Skills installed</span>`;
    case 'ide-present':
      return `<span class="ai-pill ai-pill--ready"><span class="ai-pill__dot"></span>IDE detected</span>`;
    case 'not-installed':
      return `<span class="ai-pill ai-pill--off"><span class="ai-pill__dot"></span>Not installed</span>`;
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

  const cards = sorted
    .map((t) => {
      const isInstalled = t.status === 'skills-installed';
      const isReady = t.status === 'ide-present';
      const isMissing = t.status === 'not-installed';

      const skillsLabel = isInstalled ? 'Reinstall' : isReady ? 'Install Skills' : 'Install Skills';
      const skillsDisabled = isMissing ? 'disabled' : '';
      const skillsClass = isReady ? 'ai-btn ai-btn--primary' : isInstalled ? 'ai-btn ai-btn--ghost' : 'ai-btn';

      const secondaryActions: string[] = [];
      if (t.marketplaceCommand) {
        secondaryActions.push(
          `<button data-action="run-cmd" data-cmd="${escape(t.marketplaceCommand)}" data-label="${escape(t.label)} marketplace" class="ai-btn ai-btn--ghost" ${isMissing ? 'disabled' : ''}>Marketplace plugin</button>`,
        );
      }
      if (t.mcpCommand) {
        secondaryActions.push(
          `<button data-action="run-cmd" data-cmd="${escape(t.mcpCommand)}" data-label="${escape(t.label)} MCP" class="ai-btn ai-btn--ghost" ${isMissing ? 'disabled' : ''}>Install MCP</button>`,
        );
      }

      return `
        <article class="ai-card" data-status="${t.status}">
          <header class="ai-card__top">
            <div class="ai-card__icon" data-id="${escape(t.id)}">${ideIcon(t.id)}</div>
            <div class="ai-card__title">
              <h3>${escape(t.label)}</h3>
              ${statusPill(t.status)}
            </div>
          </header>
          <p class="ai-card__desc">${escape(t.description)}</p>
          <div class="ai-card__cta">
            <button data-action="install-skills" data-ide="${escape(t.id)}" class="${skillsClass}" ${skillsDisabled}>
              ${isReady || isInstalled ? '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M8 1v9.59l3.3-3.3 1.4 1.42L8 13.41 3.3 8.71l1.4-1.42L8 10.59V1zM2 14h12v2H2z"/></svg>' : ''}
              <span>${skillsLabel}</span>
            </button>
            ${secondaryActions.length ? `<div class="ai-card__secondary">${secondaryActions.join('')}</div>` : ''}
          </div>
        </article>`;
    })
    .join('');

  const installedCount = targets.filter((t) => t.status !== 'not-installed').length;
  const skillsInstalledCount = targets.filter((t) => t.status === 'skills-installed').length;

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
  border-color: var(--hairline, rgba(128,128,128,0.30));
  color: var(--vscode-foreground);
  font-size: 0.78rem; padding: 6px 10px; border-radius: 999px;
}
.ai-btn--ghost:hover:not([disabled]) { border-color: var(--brand-blue, #0176D3); color: var(--brand-blue, #0176D3); background: transparent; }
.ai-btn[disabled] { cursor: not-allowed; opacity: 0.5; }

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
  <div class="ai-stats" role="group" aria-label="AI skills coverage">
    <span class="ai-stat"><span class="ai-stat__num">${targets.length}</span><span class="ai-stat__label">compatible</span></span>
    <span class="ai-stat__sep">·</span>
    <span class="ai-stat"><span class="ai-stat__num ai-stat__num--ready">${installedCount}</span><span class="ai-stat__label">detected</span></span>
    <span class="ai-stat__sep">·</span>
    <span class="ai-stat"><span class="ai-stat__num ai-stat__num--ok">${skillsInstalledCount}</span><span class="ai-stat__label">skills installed</span></span>
  </div>
  <button class="ai-recheck" data-action="ai-recheck" title="Re-detect installed IDEs and skills">
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M13.65 2.35a8 8 0 1 0 1.96 8.4l-1.83-.69A6 6 0 1 1 12.24 3.76L10 6h6V0l-2.35 2.35z"/></svg>
    Re-check
  </button>
</div>

<div class="ai-grid">${cards}</div>

<p class="ai-tip"><strong>One-click install.</strong> Click <em>Install Skills</em> on a detected IDE and a terminal opens with <code>b2c setup skills b2c --ide &lt;ide&gt;</code> queued. Press <kbd>Enter</kbd> to run; the CLI handles paths, downloads, and overwrites.</p>

<h2>What gets installed</h2>
<ul>
  <li><strong>Agent Skills</strong> — B2C-specific instructions, prompts, and conventions your AI tool can reference.</li>
  <li><strong>MCP server</strong> — exposes B2C-specific tools (deploy, log queries, sandbox info) to any MCP-aware client.</li>
</ul>

<p><a href="https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/agent-skills.html">Agent Skills documentation</a> &middot; <a href="https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/">MCP server documentation</a></p>
</section>`;
}
