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
 * IDE configurations with paths and detection logic.
 * Based on patterns from the add-skill reference implementation.
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
  },
  'github-copilot': {
    id: 'github-copilot',
    displayName: 'GitHub Copilot',
    paths: {
      projectDir: '.github/skills',
      globalDir: path.join(home, '.copilot/skills'),
    },
    detectInstalled: async () => {
      // Check for either .github directory (project-based) or ~/.copilot
      return fs.existsSync(path.join(home, '.copilot'));
    },
  },
  codex: {
    id: 'codex',
    displayName: 'OpenAI Codex',
    paths: {
      projectDir: '.codex/skills',
      globalDir: path.join(home, '.codex/skills'),
    },
    detectInstalled: async () => {
      return fs.existsSync(path.join(home, '.codex'));
    },
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
  },
  manual: {
    id: 'manual',
    displayName: 'Manual Installation',
    paths: {
      // Manual mode uses same paths as Claude Code
      projectDir: '.claude/skills',
      globalDir: path.join(home, '.claude/skills'),
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
  'github-copilot',
  'codex',
  'opencode',
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
  options: {global: boolean; projectRoot?: string},
): string {
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
