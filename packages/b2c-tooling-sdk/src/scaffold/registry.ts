/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {glob} from 'glob';
import type {
  Scaffold,
  ScaffoldManifest,
  ScaffoldSource,
  ScaffoldDiscoveryOptions,
  ScaffoldProvider,
  ScaffoldTransformer,
} from './types.js';
import {SCAFFOLDS_DATA_DIR} from './types.js';
import {validateScaffoldManifest} from './validators.js';

/**
 * Load a scaffold manifest from a directory
 * @param scaffoldDir - Path to the scaffold directory
 * @param source - Source type for this scaffold
 * @returns Scaffold object or null if invalid
 */
async function loadScaffold(scaffoldDir: string, source: ScaffoldSource): Promise<Scaffold | null> {
  const manifestPath = path.join(scaffoldDir, 'scaffold.json');

  try {
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent) as ScaffoldManifest;

    // Validate manifest
    const errors = validateScaffoldManifest(manifest);
    if (errors.length > 0) {
      console.warn(`Invalid scaffold manifest at ${manifestPath}:`, errors);
      return null;
    }

    const filesPath = path.join(scaffoldDir, 'files');

    // Check if files directory exists
    try {
      await fs.access(filesPath);
    } catch {
      console.warn(`Scaffold at ${scaffoldDir} has no files/ directory`);
      return null;
    }

    return {
      id: manifest.name,
      manifest,
      path: scaffoldDir,
      filesPath,
      source,
    };
  } catch {
    // Manifest doesn't exist or is invalid JSON
    return null;
  }
}

/**
 * Discover scaffolds from a directory
 * @param baseDir - Base directory to search
 * @param source - Source type for scaffolds found here
 * @returns Array of discovered scaffolds
 */
async function discoverScaffoldsFromDir(baseDir: string, source: ScaffoldSource): Promise<Scaffold[]> {
  const scaffolds: Scaffold[] = [];

  try {
    await fs.access(baseDir);
  } catch {
    // Directory doesn't exist
    return scaffolds;
  }

  // Find all scaffold.json files
  const manifestPaths = await glob('*/scaffold.json', {
    cwd: baseDir,
    absolute: false,
  });

  for (const manifestPath of manifestPaths) {
    const scaffoldDir = path.join(baseDir, path.dirname(manifestPath));
    const scaffold = await loadScaffold(scaffoldDir, source);
    if (scaffold) {
      scaffolds.push(scaffold);
    }
  }

  return scaffolds;
}

/**
 * Filter scaffolds based on discovery options
 */
function filterScaffolds(scaffolds: Scaffold[], options: ScaffoldDiscoveryOptions): Scaffold[] {
  let filtered = scaffolds;

  // Filter by category
  if (options.category) {
    filtered = filtered.filter((s) => s.manifest.category === options.category);
  }

  // Filter by source
  if (options.sources && options.sources.length > 0) {
    filtered = filtered.filter((s) => options.sources!.includes(s.source));
  }

  // Filter by search query
  if (options.query) {
    const query = options.query.toLowerCase();
    filtered = filtered.filter((s) => {
      const searchText = [s.manifest.name, s.manifest.displayName, s.manifest.description].join(' ').toLowerCase();
      return searchText.includes(query);
    });
  }

  return filtered;
}

/**
 * Scaffold registry for discovering and managing scaffolds
 */
export class ScaffoldRegistry {
  private providers: ScaffoldProvider[] = [];
  private transformers: ScaffoldTransformer[] = [];
  private scaffoldCache: Map<string, Scaffold[]> = new Map();

  /**
   * Add scaffold providers
   */
  addProviders(providers: ScaffoldProvider[]): void {
    this.providers.push(...providers);
    this.clearCache();
  }

  /**
   * Add scaffold transformers
   */
  addTransformers(transformers: ScaffoldTransformer[]): void {
    this.transformers.push(...transformers);
    this.clearCache();
  }

  /**
   * Clear the scaffold cache
   */
  clearCache(): void {
    this.scaffoldCache.clear();
  }

  /**
   * Get all scaffolds from all sources
   * @param options - Discovery options
   * @returns Array of scaffolds (deduplicated by name, later sources override earlier)
   */
  async getScaffolds(options: ScaffoldDiscoveryOptions = {}): Promise<Scaffold[]> {
    const cacheKey = JSON.stringify(options);
    if (this.scaffoldCache.has(cacheKey)) {
      return this.scaffoldCache.get(cacheKey)!;
    }

    // Collect scaffolds from all sources in priority order
    const allScaffolds: Scaffold[] = [];

    // 1. Run 'before' providers
    const beforeProviders = this.providers.filter((p) => p.priority === 'before');
    for (const provider of beforeProviders) {
      const providerScaffolds = await provider.getScaffolds(options);
      allScaffolds.push(...providerScaffolds);
    }

    // 2. Built-in scaffolds (lowest priority for built-ins)
    const builtInScaffolds = await discoverScaffoldsFromDir(SCAFFOLDS_DATA_DIR, 'built-in');
    allScaffolds.push(...builtInScaffolds);

    // 3. User scaffolds (~/.b2c/scaffolds/)
    const userScaffoldsDir = path.join(os.homedir(), '.b2c', 'scaffolds');
    const userScaffolds = await discoverScaffoldsFromDir(userScaffoldsDir, 'user');
    allScaffolds.push(...userScaffolds);

    // 4. Project scaffolds (.b2c/scaffolds/) - highest priority
    if (options.projectRoot) {
      const projectScaffoldsDir = path.join(options.projectRoot, '.b2c', 'scaffolds');
      const projectScaffolds = await discoverScaffoldsFromDir(projectScaffoldsDir, 'project');
      allScaffolds.push(...projectScaffolds);
    }

    // 5. Run 'after' providers
    const afterProviders = this.providers.filter((p) => p.priority === 'after');
    for (const provider of afterProviders) {
      const providerScaffolds = await provider.getScaffolds(options);
      allScaffolds.push(...providerScaffolds);
    }

    // Deduplicate by ID (later sources override earlier)
    const scaffoldMap = new Map<string, Scaffold>();
    for (const scaffold of allScaffolds) {
      scaffoldMap.set(scaffold.id, scaffold);
    }

    let scaffolds = Array.from(scaffoldMap.values());

    // Apply transformers
    for (const transformer of this.transformers) {
      scaffolds = await Promise.all(
        scaffolds.map((s) =>
          transformer.transform(s, {
            outputDir: process.cwd(),
            variables: {},
            dryRun: false,
            force: false,
            interactive: false,
          }),
        ),
      );
    }

    // Apply filters
    scaffolds = filterScaffolds(scaffolds, options);

    // Sort by name
    scaffolds.sort((a, b) => a.id.localeCompare(b.id));

    this.scaffoldCache.set(cacheKey, scaffolds);
    return scaffolds;
  }

  /**
   * Get a specific scaffold by ID
   * @param id - Scaffold ID
   * @param options - Discovery options
   * @returns Scaffold or null if not found
   */
  async getScaffold(id: string, options: ScaffoldDiscoveryOptions = {}): Promise<Scaffold | null> {
    const scaffolds = await this.getScaffolds(options);
    return scaffolds.find((s) => s.id === id) || null;
  }

  /**
   * Search scaffolds by query
   * @param query - Search query
   * @param options - Additional discovery options
   * @returns Matching scaffolds
   */
  async searchScaffolds(query: string, options: ScaffoldDiscoveryOptions = {}): Promise<Scaffold[]> {
    return this.getScaffolds({...options, query});
  }
}

/**
 * Create a new scaffold registry instance
 */
export function createScaffoldRegistry(): ScaffoldRegistry {
  return new ScaffoldRegistry();
}
