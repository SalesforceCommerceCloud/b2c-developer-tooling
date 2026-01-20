/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type {IdeType, InstallSkillsOptions, InstallSkillsResult, SkillMetadata} from './types.js';
import {getSkillInstallPath} from './agents.js';
import {getLogger} from '../logging/logger.js';

/**
 * Sanitize a skill name to prevent path traversal attacks.
 *
 * @param name - Skill name to sanitize
 * @returns Sanitized name safe for use in file paths
 */
function sanitizeName(name: string): string {
  // Remove path separators and null bytes
  let sanitized = name.replace(/[/\\:\0]/g, '');

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');

  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.slice(0, 255);
  }

  return sanitized;
}

/**
 * Validate that a path is safely within a base directory.
 *
 * @param targetPath - Path to validate
 * @param baseDir - Base directory that must contain targetPath
 * @returns true if path is safe, false otherwise
 */
function isPathSafe(targetPath: string, baseDir: string): boolean {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedBase = path.resolve(baseDir);

  // Ensure the target is within the base directory
  return resolvedTarget.startsWith(resolvedBase + path.sep) || resolvedTarget === resolvedBase;
}

/**
 * Recursively copy a directory.
 *
 * @param source - Source directory
 * @param target - Target directory
 */
async function copyDirectory(source: string, target: string): Promise<number> {
  const logger = getLogger();
  let fileCount = 0;

  await fs.promises.mkdir(target, {recursive: true});

  const entries = await fs.promises.readdir(source, {withFileTypes: true});

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      fileCount += await copyDirectory(sourcePath, targetPath);
    } else if (entry.isFile()) {
      await fs.promises.copyFile(sourcePath, targetPath);
      fileCount++;
    }
    // Skip symlinks and other special files for security
  }

  logger.debug({source, target, fileCount}, 'Copied directory');
  return fileCount;
}

/**
 * Check if a skill is already installed.
 *
 * @param skillName - Name of the skill
 * @param ide - Target IDE
 * @param options - Installation options
 * @returns true if skill is installed, false otherwise
 */
export function isSkillInstalled(
  skillName: string,
  ide: IdeType,
  options: {global: boolean; projectRoot?: string},
): boolean {
  const installPath = getSkillInstallPath(ide, skillName, options);
  return fs.existsSync(installPath);
}

/**
 * Install skills to target IDE directories.
 *
 * @param skills - Skills to install
 * @param sourceDir - Directory containing extracted skills
 * @param options - Installation options
 * @returns Installation results
 */
export async function installSkills(
  skills: SkillMetadata[],
  sourceDir: string,
  options: InstallSkillsOptions,
): Promise<InstallSkillsResult> {
  const logger = getLogger();
  const result: InstallSkillsResult = {
    installed: [],
    skipped: [],
    errors: [],
  };

  for (const skill of skills) {
    const sanitizedName = sanitizeName(skill.name);

    if (sanitizedName !== skill.name) {
      logger.warn({original: skill.name, sanitized: sanitizedName}, 'Skill name was sanitized');
    }

    // Source path: sourceDir/skills/skill-path/
    const sourcePath = path.join(sourceDir, 'skills', skill.path);

    if (!fs.existsSync(sourcePath)) {
      for (const ide of options.ides) {
        result.errors.push({
          skill: skill.name,
          ide,
          error: `Source directory not found: ${sourcePath}`,
        });
      }
      continue;
    }

    for (const ide of options.ides) {
      try {
        const targetPath = getSkillInstallPath(ide, sanitizedName, {
          global: options.global,
          projectRoot: options.projectRoot,
        });

        // Get the base directory for path safety validation
        const baseDir = path.dirname(targetPath);

        // Validate path safety
        if (!isPathSafe(targetPath, baseDir)) {
          result.errors.push({
            skill: skill.name,
            ide,
            error: 'Path validation failed: potential directory traversal',
          });
          continue;
        }

        // Check if already installed
        if (fs.existsSync(targetPath)) {
          if (!options.update) {
            result.skipped.push({
              skill: skill.name,
              ide,
              reason: 'Already installed (use --update to overwrite)',
            });
            continue;
          }

          // Remove existing for update
          await fs.promises.rm(targetPath, {recursive: true});
        }

        // Copy skill directory
        await copyDirectory(sourcePath, targetPath);

        result.installed.push({
          skill: skill.name,
          ide,
          path: targetPath,
        });
      } catch (error) {
        result.errors.push({
          skill: skill.name,
          ide,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  logger.debug(
    {
      installed: result.installed.length,
      skipped: result.skipped.length,
      errors: result.errors.length,
    },
    'Installation complete',
  );

  return result;
}

/**
 * Remove an installed skill.
 *
 * @param skillName - Name of the skill to remove
 * @param ide - Target IDE
 * @param options - Installation options
 * @returns true if removed, false if not found
 */
export async function removeSkill(
  skillName: string,
  ide: IdeType,
  options: {global: boolean; projectRoot?: string},
): Promise<boolean> {
  const sanitizedName = sanitizeName(skillName);
  const installPath = getSkillInstallPath(ide, sanitizedName, options);

  if (!fs.existsSync(installPath)) {
    return false;
  }

  await fs.promises.rm(installPath, {recursive: true});
  return true;
}
