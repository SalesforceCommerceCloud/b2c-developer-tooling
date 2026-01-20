/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Supported IDE types for skill installation.
 */
export type IdeType = 'claude-code' | 'cursor' | 'windsurf' | 'github-copilot' | 'codex' | 'opencode' | 'manual';

/**
 * Skill set categories matching the plugins directory structure.
 */
export type SkillSet = 'b2c' | 'b2c-cli';

/**
 * IDE path configuration for skill installation.
 */
export interface IdePaths {
  /** Relative path for project-level installation (e.g., '.claude/skills') */
  projectDir: string;
  /** Absolute path for global/user-level installation (e.g., '~/.claude/skills') */
  globalDir: string;
}

/**
 * IDE configuration including paths and display name.
 */
export interface IdeConfig {
  /** IDE identifier */
  id: IdeType;
  /** Human-readable display name */
  displayName: string;
  /** Installation paths */
  paths: IdePaths;
  /** Function to detect if IDE is installed */
  detectInstalled: () => Promise<boolean>;
}

/**
 * Skill metadata extracted from SKILL.md frontmatter.
 */
export interface SkillMetadata {
  /** Skill identifier from frontmatter name field */
  name: string;
  /** Skill description from frontmatter */
  description: string;
  /** Skill set this skill belongs to (b2c or b2c-cli) */
  skillSet: SkillSet;
  /** Relative path within the skills archive */
  path: string;
  /** Whether this skill has a references/ subdirectory */
  hasReferences: boolean;
}

/**
 * GitHub release information.
 */
export interface ReleaseInfo {
  /** Git tag name (e.g., 'v0.1.0') */
  tagName: string;
  /** Version number without 'v' prefix */
  version: string;
  /** ISO date string when release was published */
  publishedAt: string;
  /** Download URL for b2c-skills.zip asset, or null if not present */
  b2cSkillsAssetUrl: string | null;
  /** Download URL for b2c-cli-skills.zip asset, or null if not present */
  b2cCliSkillsAssetUrl: string | null;
}

/**
 * Options for downloading skills artifacts.
 */
export interface DownloadSkillsOptions {
  /** Specific release version to download (default: 'latest') */
  version?: string;
  /** Custom cache directory (default: ~/.cache/b2c-cli/skills/) */
  cacheDir?: string;
  /** Force re-download even if cached */
  forceDownload?: boolean;
}

/**
 * Options for installing skills.
 */
export interface InstallSkillsOptions {
  /** Specific skill names to install (default: all skills in skillset) */
  skills?: string[];
  /** Target IDEs to install to */
  ides: IdeType[];
  /** Install to global/user directory instead of project */
  global: boolean;
  /** Overwrite existing skills */
  update: boolean;
  /** Project root for project-level installations */
  projectRoot?: string;
}

/**
 * Result of a single skill installation.
 */
export interface SkillInstallation {
  skill: string;
  ide: IdeType;
  path: string;
}

/**
 * Reason for skipping a skill installation.
 */
export interface SkillSkipped {
  skill: string;
  ide: IdeType;
  reason: string;
}

/**
 * Error during skill installation.
 */
export interface SkillError {
  skill: string;
  ide: IdeType;
  error: string;
}

/**
 * Result of installing skills.
 */
export interface InstallSkillsResult {
  /** Successfully installed skills */
  installed: SkillInstallation[];
  /** Skipped skills (already exist, no update flag) */
  skipped: SkillSkipped[];
  /** Failed installations */
  errors: SkillError[];
}

/**
 * Cached artifact metadata stored in manifest.json.
 */
export interface CachedArtifact {
  /** Version of the cached artifact */
  version: string;
  /** Path to the extracted skills directory */
  path: string;
  /** ISO date string when artifact was downloaded */
  downloadedAt: string;
}
