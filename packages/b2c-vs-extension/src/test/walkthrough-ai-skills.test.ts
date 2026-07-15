/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import {
  AI_SKILL_TARGETS,
  detectIdeStatus,
  detectMcpStatus,
  generateAiSkillsHtml,
  type AiSkillsTarget,
  type DetectedTarget,
} from '../walkthrough/aiSkillsContent.js';

/**
 * Build a DetectedTarget for render-only assertions without touching disk.
 * Uses a clean minimal base (NOT a real registry entry) so tests control
 * exactly which optional fields — mcpCommand, marketplaceCommand — are present.
 */
function detected(over: Partial<DetectedTarget>): DetectedTarget {
  return {
    id: 'test',
    label: 'Test IDE',
    description: 'desc',
    detectPath: '/nope',
    globalSkillsDir: '/nope/skills',
    projectSkillsDir: 'skills',
    status: 'ide-present',
    mcpStatus: 'not-configured',
    ...over,
  };
}

suite('walkthrough AI skills — targets', () => {
  test('includes a GitHub Copilot CLI card distinct from VS Code Copilot', () => {
    const ids = AI_SKILL_TARGETS.map((t) => t.id);
    assert.ok(ids.includes('copilot-cli'), 'copilot-cli target is registered');
    assert.ok(ids.includes('vscode'), 'vscode (Copilot Chat) target still present');
    assert.notEqual(ids.indexOf('copilot-cli'), ids.indexOf('vscode'), 'they are separate cards');
  });

  test('Copilot CLI installs skills via the marketplace command, not --ide', () => {
    const copilot = AI_SKILL_TARGETS.find((t) => t.id === 'copilot-cli')!;
    assert.equal(copilot.skillsMode, 'marketplace');
    assert.ok(copilot.marketplaceCommand?.includes('copilot plugin install'), 'runs `copilot plugin install`');
    // Guard the invariant that broke the UI: copilot-cli is NOT a valid `b2c
    // setup skills --ide` value, so it must never rely on the file-copy path.
    assert.notEqual(copilot.skillsMode, 'cli');
  });

  test('Copilot CLI marketplace-add is separated with ; so a re-add does not abort installs', () => {
    // `copilot plugin marketplace add` errors if the marketplace is already
    // registered; joining it with `&&` would abort the installs (real bug).
    const copilot = AI_SKILL_TARGETS.find((t) => t.id === 'copilot-cli')!;
    assert.match(copilot.marketplaceCommand!, /marketplace add [^&]*;[^&]*plugin install/);
    assert.doesNotMatch(copilot.marketplaceCommand!, /marketplace add\s+\S+\s+&&/);
  });

  test('VS Code card no longer probes ~/.copilot (that is the Copilot CLI dir)', () => {
    const vscode = AI_SKILL_TARGETS.find((t) => t.id === 'vscode')!;
    const copilot = AI_SKILL_TARGETS.find((t) => t.id === 'copilot-cli')!;
    // The old collision was both cards detecting at ~/.copilot. Assert the VS
    // Code card resolves somewhere else AND to a non-empty, VS-Code-shaped path
    // (a broken empty string would also "not end with .copilot").
    assert.ok(vscode.detectPath.length > 0, 'vscode detectPath is set');
    assert.equal(path.basename(vscode.detectPath), 'Code', 'vscode detectPath points at a VS Code user dir');
    assert.notEqual(path.basename(vscode.detectPath), '.copilot', 'vscode detectPath is not ~/.copilot');
    assert.notEqual(vscode.detectPath, copilot.detectPath, 'VS Code and Copilot CLI detect at different paths');
    assert.equal(path.basename(copilot.detectPath), '.copilot', 'Copilot CLI keeps ~/.copilot');
  });
});

suite('walkthrough AI skills — MCP detection', () => {
  let tmp: string;

  suiteSetup(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'b2c-mcp-test-'));
  });

  suiteTeardown(async () => {
    await fs.rm(tmp, {recursive: true, force: true});
  });

  test('returns "unknown" when the target has no documented MCP location', async () => {
    const target: AiSkillsTarget = {
      id: 'x',
      label: 'X',
      description: '',
      detectPath: tmp,
      globalSkillsDir: tmp,
      projectSkillsDir: 'skills',
    };
    assert.equal(await detectMcpStatus(target, [tmp]), 'unknown');
  });

  test('returns "not-configured" when a known config file lacks the server', async () => {
    const root = path.join(tmp, 'proj-empty');
    await fs.mkdir(path.join(root, '.cursor'), {recursive: true});
    await fs.writeFile(path.join(root, '.cursor', 'mcp.json'), JSON.stringify({mcpServers: {}}));
    const target: AiSkillsTarget = {
      id: 'cursor',
      label: 'Cursor',
      description: '',
      detectPath: tmp,
      globalSkillsDir: path.join(tmp, 'nope'),
      projectSkillsDir: '.cursor/skills',
      mcpProjectConfig: path.join('.cursor', 'mcp.json'),
      mcpGlobalConfig: path.join(tmp, 'nope', 'mcp.json'),
    };
    assert.equal(await detectMcpStatus(target, [root]), 'not-configured');
  });

  test('returns "configured" when a project config registers b2c-dx-mcp', async () => {
    const root = path.join(tmp, 'proj-ok');
    await fs.mkdir(path.join(root, '.cursor'), {recursive: true});
    await fs.writeFile(
      path.join(root, '.cursor', 'mcp.json'),
      JSON.stringify({mcpServers: {'b2c-dx-mcp': {command: 'npx'}}}),
    );
    const target: AiSkillsTarget = {
      id: 'cursor',
      label: 'Cursor',
      description: '',
      detectPath: tmp,
      globalSkillsDir: path.join(tmp, 'nope'),
      projectSkillsDir: '.cursor/skills',
      mcpProjectConfig: path.join('.cursor', 'mcp.json'),
    };
    assert.equal(await detectMcpStatus(target, [root]), 'configured');
  });

  test('detects the server inside a shared settings file (Gemini-style)', async () => {
    const settings = path.join(tmp, 'settings.json');
    await fs.writeFile(settings, JSON.stringify({theme: 'dark', mcpServers: {'b2c-dx-mcp': {command: 'npx'}}}));
    const target: AiSkillsTarget = {
      id: 'gemini-cli',
      label: 'Gemini CLI',
      description: '',
      detectPath: tmp,
      globalSkillsDir: tmp,
      projectSkillsDir: 'skills',
      mcpGlobalConfig: settings,
    };
    assert.equal(await detectMcpStatus(target, []), 'configured');
  });

  test('a stray "b2c-dx-mcp" string outside a server container is NOT configured', async () => {
    // Regression guard: a broad settings file that merely mentions the server
    // (e.g. in a disabled list or a comment-like string) must not read as
    // configured — only a real entry inside mcpServers/servers counts.
    const settings = path.join(tmp, 'stray.json');
    await fs.writeFile(
      settings,
      JSON.stringify({note: 'considered adding b2c-dx-mcp', disabledMcpServers: ['b2c-dx-mcp'], mcpServers: {}}),
    );
    const target: AiSkillsTarget = {
      id: 'gemini-cli',
      label: 'Gemini CLI',
      description: '',
      detectPath: tmp,
      globalSkillsDir: tmp,
      projectSkillsDir: 'skills',
      mcpGlobalConfig: settings,
    };
    assert.equal(await detectMcpStatus(target, []), 'not-configured');
  });

  test('a present marker dir counts as configured (extension install)', async () => {
    const marker = path.join(tmp, 'ext', 'b2c-developer-tooling');
    await fs.mkdir(marker, {recursive: true});
    const target: AiSkillsTarget = {
      id: 'gemini-cli',
      label: 'Gemini CLI',
      description: '',
      detectPath: tmp,
      globalSkillsDir: tmp,
      projectSkillsDir: 'skills',
      mcpMarkerDir: marker,
    };
    assert.equal(await detectMcpStatus(target, []), 'configured');
  });
});

suite('walkthrough AI skills — IDE / skills detection', () => {
  let tmp: string;

  suiteSetup(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'b2c-ide-test-'));
  });

  suiteTeardown(async () => {
    await fs.rm(tmp, {recursive: true, force: true});
  });

  test('marketplace target flips to skills-installed via its skillsMarkerDir', async () => {
    // Copilot CLI installs plugins under ~/.copilot/installed-plugins/<mkt>/,
    // NOT in a skills dir. A b2c* entry there must count as installed.
    const detect = path.join(tmp, '.copilot');
    const marker = path.join(detect, 'installed-plugins', 'b2c-developer-tooling');
    await fs.mkdir(path.join(marker, 'b2c-cli'), {recursive: true});
    const target: AiSkillsTarget = {
      id: 'copilot-cli',
      label: 'GitHub Copilot CLI',
      description: '',
      detectPath: detect,
      globalSkillsDir: path.join(detect, 'skills'), // empty — must NOT be the deciding signal
      projectSkillsDir: '.copilot/skills',
      skillsMarkerDir: marker,
    };
    assert.equal(await detectIdeStatus(target, []), 'skills-installed');
  });

  test('marketplace target with an empty marker dir stays ide-present', async () => {
    const detect = path.join(tmp, '.copilot-empty');
    const marker = path.join(detect, 'installed-plugins', 'b2c-developer-tooling');
    await fs.mkdir(marker, {recursive: true}); // exists but has no b2c* plugin
    const target: AiSkillsTarget = {
      id: 'copilot-cli',
      label: 'GitHub Copilot CLI',
      description: '',
      detectPath: detect,
      globalSkillsDir: path.join(detect, 'skills'),
      projectSkillsDir: '.copilot/skills',
      skillsMarkerDir: marker,
    };
    assert.equal(await detectIdeStatus(target, []), 'ide-present');
  });

  test('the registered Copilot CLI target has a marketplace skillsMarkerDir', () => {
    const copilot = AI_SKILL_TARGETS.find((t) => t.id === 'copilot-cli')!;
    assert.ok(copilot.skillsMarkerDir, 'copilot-cli defines skillsMarkerDir');
    assert.match(copilot.skillsMarkerDir!, /installed-plugins/);
  });
});

suite('walkthrough AI skills — rendered summary + badges', () => {
  test('summary counts distinguish detected / with-skills / with-MCP', () => {
    const targets: DetectedTarget[] = [
      detected({id: 'cursor', status: 'skills-installed', mcpStatus: 'configured'}),
      detected({id: 'vscode', status: 'ide-present', mcpStatus: 'not-configured'}),
      detected({id: 'windsurf', status: 'not-installed', mcpStatus: 'unknown'}),
    ];
    const html = generateAiSkillsHtml(targets);
    // 3 supported, 2 detected (not "not-installed"), 1 with skills, 1 with MCP.
    assert.match(html, /3<\/span><span class="ai-stat__label">tools supported/);
    assert.match(html, /2<\/span><span class="ai-stat__label">detected here/);
    assert.match(html, /1<\/span><span class="ai-stat__label">with skills/);
    assert.match(html, /1<\/span><span class="ai-stat__label">with MCP/);
    // The old ambiguous "skills installed" phrasing must be gone.
    assert.doesNotMatch(html, />skills installed</);
  });

  test('renders an MCP badge on present cards and hides it on absent ones', () => {
    const html = generateAiSkillsHtml([
      detected({id: 'cursor', status: 'ide-present', mcpStatus: 'configured'}),
      detected({id: 'windsurf', status: 'not-installed', mcpStatus: 'unknown'}),
    ]);
    assert.match(html, /MCP configured/, 'configured present card shows the badge');
    // The not-installed card should not assert any MCP state. Anchor on the
    // <article> tag (the CSS block also contains data-status="not-installed")
    // and bound the slice at the card's own </article> so it can't bleed into
    // the next card or truncate before the pills.
    const cardStart = html.indexOf('<article class="ai-card" data-status="not-installed"');
    assert.ok(cardStart > -1, 'not-installed card is rendered');
    const cardEnd = html.indexOf('</article>', cardStart);
    assert.ok(cardEnd > cardStart, 'not-installed card is closed');
    const notInstalledCard = html.slice(cardStart, cardEnd);
    assert.doesNotMatch(notInstalledCard, /MCP configured|MCP not set up|MCP · manual/);
  });

  test('offers an MCP setup-guide link when no one-click MCP command exists', () => {
    const html = generateAiSkillsHtml([detected({id: 'codex', status: 'ide-present', mcpStatus: 'unknown'})]);
    assert.match(html, /MCP setup guide/);
    assert.match(html, /mcp\/installation/);
  });

  test('MCP action reads "Re-configure MCP" when already configured, "Install MCP" otherwise', () => {
    const mcpCommand = 'mkdir -p .vscode && echo b2c-dx-mcp > .vscode/mcp.json';
    const notYet = generateAiSkillsHtml([
      detected({id: 'vscode', status: 'ide-present', mcpStatus: 'not-configured', mcpCommand}),
    ]);
    assert.match(notYet, />Install MCP</);
    assert.doesNotMatch(notYet, />Re-configure MCP</);

    const already = generateAiSkillsHtml([
      detected({id: 'vscode', status: 'ide-present', mcpStatus: 'configured', mcpCommand}),
    ]);
    assert.match(already, />Re-configure MCP</);
    assert.doesNotMatch(already, />Install MCP</);
  });

  test('marketplace Reinstall runs uninstall THEN install; fresh install does not', () => {
    const base = {
      skillsMode: 'marketplace' as const,
      marketplaceCommand: 'copilot plugin install b2c@mkt',
      marketplaceUninstallCommand: 'copilot plugin uninstall b2c@mkt',
    };
    // Skills already installed → primary is "Reinstall" and chains uninstall → install.
    const reinstall = generateAiSkillsHtml([detected({id: 'copilot-cli', status: 'skills-installed', ...base})]);
    assert.match(reinstall, /<span>Reinstall<\/span>/);
    // The button's data-cmd carries `uninstall ... ; ... install`.
    assert.match(reinstall, /copilot plugin uninstall b2c@mkt\s*;\s*copilot plugin install b2c@mkt/);

    // Fresh (IDE present, no skills) → "Install Skills", plain install only.
    const fresh = generateAiSkillsHtml([detected({id: 'copilot-cli', status: 'ide-present', ...base})]);
    assert.match(fresh, /<span>Install Skills<\/span>/);
    assert.doesNotMatch(fresh, /plugin uninstall/);
  });
});
