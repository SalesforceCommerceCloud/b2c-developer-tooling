/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type {IdeConfig, IdeType} from './types.js';

const home = os.homedir();

/**
 * Get the Agentforce Vibes global skills directory based on platform.
 */
function getAgentforceVibesGlobalDir(): string {
  const platform = process.platform;
  if (platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage');
  } else if (platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'Code', 'User', 'globalStorage');
  }
  return path.join(home, '.config', 'Code', 'User', 'globalStorage');
}

/**
 * IDE configurations with paths and detection logic.
 */
export const IDE_CONFIGS: Record<IdeType, IdeConfig> = {
  'claude-code': {
    id: 'claude-code',
    displayName: 'Claude Code',
    paths: {
      projectDir: '.claude/skills',
      globalDir: path.join(home, '.claude/skills'),
    },
    detectInstalled: async () => {
      return fs.existsSync(path.join(home, '.claude'));
    },
    docsUrl: 'https://docs.anthropic.com/en/docs/claude-code',
  },
  cursor: {
    id: 'cursor',
    displayName: 'Cursor',
    paths: {
      projectDir: '.cursor/skills',
      globalDir: path.join(home, '.cursor/skills'),
    },
    detectInstalled: async () => {
      return fs.existsSync(path.join(home, '.cursor'));
    },
    docsUrl: 'https://cursor.com/docs/context/skills',
  },
  windsurf: {
    id: 'windsurf',
    displayName: 'Windsurf',
    paths: {
      projectDir: '.windsurf/skills',
      globalDir: path.join(home, '.codeium/windsurf/skills'),
    },
    detectInstalled: async () => {
      return fs.existsSync(path.join(home, '.codeium/windsurf'));
    },
    docsUrl: 'https://docs.windsurf.com/',
  },
  vscode: {
    id: 'vscode',
    displayName: 'VS Code / GitHub Copilot',
    paths: {
      projectDir: '.github/skills',
      globalDir: path.join(home, '.copilot/skills'),
    },
    detectInstalled: async () => {
      // Check for either .github directory (project-based) or ~/.copilot
      return fs.existsSync(path.join(home, '.copilot'));
    },
    docsUrl: 'https://code.visualstudio.com/docs/copilot/customization/agent-skills',
  },
  codex: {
    id: 'codex',
    displayName: 'OpenAI Codex CLI',
    paths: {
      projectDir: '.codex/skills',
      globalDir: path.join(home, '.codex/skills'),
    },
    detectInstalled: async () => {
      return fs.existsSync(path.join(home, '.codex'));
    },
    docsUrl: 'https://github.com/openai/codex',
  },
  opencode: {
    id: 'opencode',
    displayName: 'OpenCode',
    paths: {
      projectDir: '.opencode/skills',
      globalDir: path.join(home, '.config/opencode/skills'),
    },
    detectInstalled: async () => {
      return fs.existsSync(path.join(home, '.config/opencode'));
    },
    docsUrl: 'https://opencode.ai/',
  },
  'agentforce-vibes': {
    id: 'agentforce-vibes',
    displayName: 'Agentforce Vibes',
    paths: {
      projectDir: '.a4drules/skills',
      globalDir: getAgentforceVibesGlobalDir(),
    },
    detectInstalled: async () => {
      // Check for the Agentforce extension's globalStorage entry
      const globalStorageDir = getAgentforceVibesGlobalDir();
      return fs.existsSync(path.join(globalStorageDir, 'salesforce.salesforcedx-einstein-gpt'));
    },
    docsUrl: 'https://developer.salesforce.com/docs/einstein/genai/guide/agentforce-in-ide.html',
  },
  manual: {
    id: 'manual',
    displayName: 'Manual Installation',
    paths: {
      projectDir: '.agents/skills',
      globalDir: path.join(home, '.agents/skills'),
    },
    detectInstalled: async () => {
      // Manual is always "available" as a fallback
      return true;
    },
  },
};

/**
 * All supported IDE types in display order.
 */
export const ALL_IDE_TYPES: IdeType[] = [
  'claude-code',
  'cursor',
  'windsurf',
  'vscode',
  'codex',
  'opencode',
  'agentforce-vibes',
  'manual',
];

/**
 * Detect which IDEs are installed on the system.
 *
 * @returns Array of IDE types that appear to be installed
 */
export async function detectInstalledIdes(): Promise<IdeType[]> {
  const installed: IdeType[] = [];

  for (const ideType of ALL_IDE_TYPES) {
    // Skip 'manual' from auto-detection since it's always available
    if (ideType === 'manual') {
      continue;
    }

    const config = IDE_CONFIGS[ideType];
    const isInstalled = await config.detectInstalled();
    if (isInstalled) {
      installed.push(ideType);
    }
  }

  return installed;
}

/**
 * Get the installation path for a skill.
 *
 * @param ide - Target IDE
 * @param skillName - Name of the skill
 * @param options - Installation options
 * @returns Absolute path where the skill would be installed
 */
export function getSkillInstallPath(
  ide: IdeType,
  skillName: string,
  options: {global: boolean; projectRoot?: string; directory?: string},
): string {
  // Custom directory override — used as the base path directly
  if (options.directory) {
    const projectRoot = options.projectRoot || process.cwd();
    const dir = path.isAbsolute(options.directory) ? options.directory : path.join(projectRoot, options.directory);
    return path.join(dir, skillName);
  }

  const config = IDE_CONFIGS[ide];

  if (options.global) {
    return path.join(config.paths.globalDir, skillName);
  }

  const projectRoot = options.projectRoot || process.cwd();
  return path.join(projectRoot, config.paths.projectDir, skillName);
}

/**
 * Get the display name for an IDE.
 *
 * @param ide - IDE type
 * @returns Human-readable display name
 */
export function getIdeDisplayName(ide: IdeType): string {
  return IDE_CONFIGS[ide].displayName;
}

/**
 * Get the documentation URL for an IDE.
 *
 * @param ide - IDE type
 * @returns Documentation URL or undefined if not available
 */
export function getIdeDocsUrl(ide: IdeType): string | undefined {
  return IDE_CONFIGS[ide].docsUrl;
}
