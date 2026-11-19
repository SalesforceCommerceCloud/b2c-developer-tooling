/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';
import {Flags} from '@oclif/core';
import {buildProjectIndex, type ProjectIndex} from '@salesforce/b2c-tooling-sdk/project-index';

/** `--all-cartridges`: index every project cartridge, not just those on the cartridge path. */
export const allCartridgesFlag = Flags.boolean({
  description:
    'Include cartridges that are not on the cartridge path, after the path cartridges (as if the site ran them all)',
  default: false,
});

/**
 * Builds the project index for the project directory (`--project-directory`,
 * else the current directory): every cartridge below it (plus any extra paths),
 * ordered by the configured `cartridges` value.
 */
export function loadProjectIndex(
  cartridgePath: string[] | undefined,
  extraPaths: string[] = [],
  root: string = process.cwd(),
  siteId?: string,
  includeAllCartridges = false,
): ProjectIndex {
  return buildProjectIndex({root, paths: extraPaths, cartridgePath, siteId, includeAllCartridges});
}

/** One line saying where the cartridge order came from, for human-readable output. */
export function describeCartridgeOrder(index: ProjectIndex): string {
  const order = index.cartridgeOrder;
  const notOnPath = order?.notOnPath?.length
    ? `; ${order.allCartridges ? 'included though not on the path' : 'not on the path'}: ${listNames(order.notOnPath)}` +
      (order.allCartridges ? '' : ' (include them with --all-cartridges)')
    : '';
  return describeSource(order) + notOnPath;
}

function listNames(names: readonly string[], max = 10): string {
  return names.length > max ? `${names.slice(0, max).join(', ')} and ${names.length - max} more` : names.join(', ');
}

function describeSource(order: ProjectIndex['cartridgeOrder']): string {
  switch (order?.source) {
    case 'configured': {
      return 'from configuration (cartridges in dw.json or SFCC_CARTRIDGES)';
    }
    case 'site-file': {
      const others = order.otherSites?.length
        ? `; other sites with a different path: ${order.otherSites.join(', ')} (choose with SFCC_SITE_ID or siteId)`
        : '';
      return `from site ${order.siteId} in ${order.file}${others}`;
    }
    default: {
      return 'guessed from discovery order; set cartridges in dw.json or SFCC_CARTRIDGES to match the site';
    }
  }
}

/** The project directory (`--project-directory` / `SFCC_PROJECT_DIRECTORY`), else the current directory. */
export function projectRoot(config: {values: {projectDirectory?: string}}): string {
  return path.resolve(config.values.projectDirectory || process.cwd());
}

/** A cartridge file as a path relative to the current directory, with an optional `:line`. */
export function displayPath(index: ProjectIndex, cartridge: string, relPath: string, line?: number): string {
  const root = index.cartridges.find((c) => c.name === cartridge)?.src;
  const file = root ? path.relative(process.cwd(), path.join(root, relPath)) : `${cartridge}/${relPath}`;
  return line ? `${file}:${line}` : file;
}
