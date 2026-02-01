/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {glob} from 'glob';
import type {
  Scaffold,
  ScaffoldGenerateOptions,
  ScaffoldGenerateResult,
  GeneratedFile,
  FileMapping,
  FileModification,
} from './types.js';
import {ScaffoldEngine} from './engine.js';
import {evaluateCondition, validateParameters} from './validators.js';
import {mergeJson, insertAfter, insertBefore, appendContent, prependContent} from './merge.js';

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get default file mappings by scanning the files/ directory
 */
async function getDefaultFileMappings(filesPath: string): Promise<FileMapping[]> {
  const files = await glob('**/*', {
    cwd: filesPath,
    nodir: true,
    dot: true,
  });

  return files.map((file) => ({
    template: file,
    destination: file.replace(/\.ejs$/, ''),
  }));
}

/**
 * Generate files from a scaffold
 * @param scaffold - The scaffold to use
 * @param options - Generation options
 * @returns Generation result
 */
export async function generateFromScaffold(
  scaffold: Scaffold,
  options: ScaffoldGenerateOptions = {},
): Promise<ScaffoldGenerateResult> {
  const outputDir = options.outputDir || process.cwd();
  const variables = options.variables || {};
  const dryRun = options.dryRun ?? false;
  const force = options.force ?? false;

  // Validate parameters
  const validationResult = validateParameters(scaffold.manifest, variables);
  if (!validationResult.valid) {
    const errorMessages = validationResult.errors.map((e) => `${e.parameter}: ${e.message}`).join(', ');
    throw new Error(`Invalid parameters: ${errorMessages}`);
  }

  // Create template engine with resolved variables
  const engine = new ScaffoldEngine(validationResult.values);

  // Get file mappings
  const fileMappings = scaffold.manifest.files || (await getDefaultFileMappings(scaffold.filesPath));

  const generatedFiles: GeneratedFile[] = [];
  const createdDirs = new Set<string>();

  for (const mapping of fileMappings) {
    // Check condition
    if (mapping.condition && !evaluateCondition(mapping.condition, validationResult.values)) {
      continue;
    }

    const templatePath = path.join(scaffold.filesPath, mapping.template);
    const destRelative = engine.renderPath(mapping.destination);
    const destAbsolute = path.join(outputDir, destRelative);

    // Check if destination exists
    const exists = await fileExists(destAbsolute);
    const overwrite = mapping.overwrite || 'never';

    if (exists) {
      if (overwrite === 'never' && !force) {
        generatedFiles.push({
          path: destRelative,
          absolutePath: destAbsolute,
          action: 'skipped',
          skipReason: 'File already exists',
        });
        continue;
      }

      if (overwrite === 'prompt' && !force) {
        // In non-interactive mode without force, skip
        generatedFiles.push({
          path: destRelative,
          absolutePath: destAbsolute,
          action: 'skipped',
          skipReason: 'File already exists (prompt required)',
        });
        continue;
      }
    }

    // Read and render template
    let content: string;
    try {
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      // Only render EJS if the file has .ejs extension
      if (mapping.template.endsWith('.ejs')) {
        content = engine.render(templateContent);
      } else {
        content = templateContent;
      }
    } catch (error) {
      throw new Error(`Failed to read template ${mapping.template}: ${(error as Error).message}`);
    }

    if (!dryRun) {
      // Create parent directories
      const destDir = path.dirname(destAbsolute);
      if (!createdDirs.has(destDir)) {
        await fs.mkdir(destDir, {recursive: true});
        createdDirs.add(destDir);
      }

      // Write file
      await fs.writeFile(destAbsolute, content, 'utf-8');
    }

    generatedFiles.push({
      path: destRelative,
      absolutePath: destAbsolute,
      action: exists ? 'overwritten' : 'created',
    });
  }

  // Process file modifications
  if (scaffold.manifest.modifications) {
    for (const modification of scaffold.manifest.modifications) {
      // Check condition
      if (modification.condition && !evaluateCondition(modification.condition, validationResult.values)) {
        continue;
      }

      const targetRelative = engine.renderPath(modification.target);
      const targetAbsolute = path.join(outputDir, targetRelative);

      // Get modification content
      let modContent: string;
      if (modification.contentTemplate) {
        const templatePath = path.join(scaffold.filesPath, modification.contentTemplate);
        try {
          const templateContent = await fs.readFile(templatePath, 'utf-8');
          modContent = modification.contentTemplate.endsWith('.ejs') ? engine.render(templateContent) : templateContent;
        } catch (error) {
          throw new Error(
            `Failed to read modification template ${modification.contentTemplate}: ${(error as Error).message}`,
          );
        }
      } else if (modification.content) {
        modContent = engine.render(modification.content);
      } else {
        throw new Error(`Modification for ${modification.target} must have content or contentTemplate`);
      }

      // Process the modification
      const result = await processModification(modification, targetAbsolute, targetRelative, modContent, dryRun);
      generatedFiles.push(result);
    }
  }

  // Render post-instructions if present
  let postInstructions: string | undefined;
  if (scaffold.manifest.postInstructions) {
    postInstructions = engine.render(scaffold.manifest.postInstructions);
  }

  return {
    scaffold,
    files: generatedFiles,
    postInstructions,
    dryRun,
    outputDir,
  };
}

/**
 * Process a single file modification
 */
async function processModification(
  modification: FileModification,
  targetAbsolute: string,
  targetRelative: string,
  content: string,
  dryRun: boolean,
): Promise<GeneratedFile> {
  const exists = await fileExists(targetAbsolute);

  // For modifications, the file should exist (except for json-merge which can create)
  if (!exists && modification.type !== 'json-merge') {
    return {
      path: targetRelative,
      absolutePath: targetAbsolute,
      action: 'skipped',
      skipReason: `Target file does not exist for ${modification.type}`,
    };
  }

  let existingContent = '';
  if (exists) {
    existingContent = await fs.readFile(targetAbsolute, 'utf-8');
  }

  let newContent: string;
  try {
    switch (modification.type) {
      case 'json-merge': {
        if (!exists) {
          // Create new JSON file
          newContent = JSON.stringify(JSON.parse(content), null, 2);
        } else {
          newContent = mergeJson(existingContent, content, {
            jsonPath: modification.jsonPath,
            createPath: true,
          });
        }
        break;
      }

      case 'insert-after': {
        if (!modification.marker) {
          throw new Error('insert-after requires a marker');
        }
        newContent = insertAfter(existingContent, content, modification.marker);
        break;
      }

      case 'insert-before': {
        if (!modification.marker) {
          throw new Error('insert-before requires a marker');
        }
        newContent = insertBefore(existingContent, content, modification.marker);
        break;
      }

      case 'append': {
        newContent = appendContent(existingContent, content);
        break;
      }

      case 'prepend': {
        newContent = prependContent(existingContent, content);
        break;
      }

      default: {
        throw new Error(`Unknown modification type: ${modification.type}`);
      }
    }
  } catch (error) {
    return {
      path: targetRelative,
      absolutePath: targetAbsolute,
      action: 'skipped',
      skipReason: `Modification failed: ${(error as Error).message}`,
    };
  }

  if (!dryRun) {
    // Create parent directories if needed
    const targetDir = path.dirname(targetAbsolute);
    await fs.mkdir(targetDir, {recursive: true});
    await fs.writeFile(targetAbsolute, newContent, 'utf-8');
  }

  return {
    path: targetRelative,
    absolutePath: targetAbsolute,
    action: exists ? 'merged' : 'created',
  };
}

/**
 * Preview scaffold generation without writing files
 * @param scaffold - The scaffold to preview
 * @param options - Generation options
 * @returns Preview result
 */
export async function previewScaffold(
  scaffold: Scaffold,
  options: Omit<ScaffoldGenerateOptions, 'dryRun'> = {},
): Promise<ScaffoldGenerateResult> {
  return generateFromScaffold(scaffold, {...options, dryRun: true});
}
