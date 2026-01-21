/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Skills management module for downloading and installing agent skills.
 *
 * This module provides functionality to:
 * - Download skills artifacts from GitHub releases
 * - Detect installed IDEs
 * - Install skills to various IDE configurations
 * - Manage skills cache
 *
 * @example
 * ```typescript
 * import {
 *   downloadSkillsArtifact,
 *   scanSkills,
 *   installSkills,
 *   detectInstalledIdes,
 * } from '@salesforce/b2c-tooling-sdk/skills';
 *
 * // Download and extract skills
 * const skillsDir = await downloadSkillsArtifact('b2c');
 *
 * // Scan for available skills
 * const skills = await scanSkills(skillsDir, 'b2c');
 *
 * // Detect installed IDEs
 * const ides = await detectInstalledIdes();
 *
 * // Install skills
 * const result = await installSkills(skills, skillsDir, {
 *   ides: ['cursor'],
 *   global: true,
 *   update: false,
 * });
 * ```
 *
 * @module skills
 */

// Types
export type {
  IdeType,
  SkillSet,
  IdePaths,
  IdeConfig,
  SkillMetadata,
  ReleaseInfo,
  DownloadSkillsOptions,
  InstallSkillsOptions,
  SkillInstallation,
  SkillSkipped,
  SkillError,
  InstallSkillsResult,
  CachedArtifact,
} from './types.js';

// Agent/IDE utilities
export {
  IDE_CONFIGS,
  ALL_IDE_TYPES,
  detectInstalledIdes,
  getSkillInstallPath,
  getIdeDisplayName,
  getIdeDocsUrl,
} from './agents.js';

// GitHub/download utilities
export {
  getCacheDir,
  getRelease,
  listReleases,
  getCachedArtifact,
  downloadSkillsArtifact,
  clearCache,
} from './github.js';

// Skill parsing
export {parseSkillFrontmatter, scanSkills, filterSkillsByName, findSkillsByName} from './parser.js';

// Installation
export {isSkillInstalled, installSkills, removeSkill} from './installer.js';
