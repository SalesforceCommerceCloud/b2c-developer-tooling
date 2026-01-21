/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type {SkillMetadata, SkillSet} from './types.js';
import {getLogger} from '../logging/logger.js';

/**
 * Parse simple YAML-like frontmatter from SKILL.md content.
 * Only supports basic key: value pairs (name and description).
 *
 * @param content - File content with frontmatter
 * @returns Parsed frontmatter or null if invalid
 */
export function parseSkillFrontmatter(content: string): {name: string; description: string} | null {
  // Match frontmatter between --- delimiters
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) {
    return null;
  }

  const frontmatter = match[1];
  const result: {name?: string; description?: string} = {};

  // Parse simple key: value lines
  for (const line of frontmatter.split('\n')) {
    const keyValueMatch = line.match(/^(\w+):\s*(.+)$/);
    if (keyValueMatch) {
      const [, key, value] = keyValueMatch;
      if (key === 'name') {
        result.name = value.trim();
      } else if (key === 'description') {
        result.description = value.trim();
      }
    }
  }

  if (!result.name || !result.description) {
    return null;
  }

  return {name: result.name, description: result.description};
}

/**
 * Scan a directory for skills and extract their metadata.
 *
 * @param skillsDir - Path to extracted skills directory (e.g., ~/.cache/b2c-cli/skills/v0.1.0/b2c/skills/)
 * @param skillSet - The skill set being scanned ('b2c' or 'b2c-cli')
 * @returns Array of skill metadata
 */
export async function scanSkills(skillsDir: string, skillSet: SkillSet): Promise<SkillMetadata[]> {
  const logger = getLogger();
  const skills: SkillMetadata[] = [];

  // The extracted structure should be: skillsDir/skills/skill-name/SKILL.md
  // Find the skills subdirectory
  const skillsSubdir = path.join(skillsDir, 'skills');

  if (!fs.existsSync(skillsSubdir)) {
    logger.debug({skillsDir, skillsSubdir}, 'Skills subdirectory not found');
    return skills;
  }

  const entries = await fs.promises.readdir(skillsSubdir, {withFileTypes: true});

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const skillDir = path.join(skillsSubdir, entry.name);
    const skillPath = path.join(skillDir, 'SKILL.md');

    if (!fs.existsSync(skillPath)) {
      logger.debug({skillDir}, 'No SKILL.md found, skipping');
      continue;
    }

    try {
      const content = await fs.promises.readFile(skillPath, 'utf-8');
      const frontmatter = parseSkillFrontmatter(content);

      if (!frontmatter) {
        logger.warn({skillPath}, 'Invalid frontmatter in SKILL.md');
        continue;
      }

      // Check for references directory
      const referencesDir = path.join(skillDir, 'references');
      const hasReferences = fs.existsSync(referencesDir);

      skills.push({
        name: frontmatter.name,
        description: frontmatter.description,
        skillSet,
        path: entry.name, // Relative path within skills directory
        hasReferences,
      });
    } catch (error) {
      logger.warn({skillPath, error}, 'Failed to parse SKILL.md');
    }
  }

  logger.debug({count: skills.length, skillSet}, 'Scanned skills');
  return skills;
}

/**
 * Filter skills by name.
 *
 * @param skills - All available skills
 * @param names - Skill names to include (if provided)
 * @returns Filtered skills
 */
export function filterSkillsByName(skills: SkillMetadata[], names?: string[]): SkillMetadata[] {
  if (!names || names.length === 0) {
    return skills;
  }

  const nameSet = new Set(names);
  return skills.filter((skill) => nameSet.has(skill.name));
}

/**
 * Find skills that match the given names, returning any that weren't found.
 *
 * @param skills - Available skills
 * @param names - Requested skill names
 * @returns Object with matched skills and names not found
 */
export function findSkillsByName(
  skills: SkillMetadata[],
  names: string[],
): {found: SkillMetadata[]; notFound: string[]} {
  const skillMap = new Map(skills.map((s) => [s.name, s]));
  const found: SkillMetadata[] = [];
  const notFound: string[] = [];

  for (const name of names) {
    const skill = skillMap.get(name);
    if (skill) {
      found.push(skill);
    } else {
      notFound.push(name);
    }
  }

  return {found, notFound};
}
