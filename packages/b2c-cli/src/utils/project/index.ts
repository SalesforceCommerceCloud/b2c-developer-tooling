/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';
import {buildProjectIndex, type ProjectIndex} from '@salesforce/b2c-tooling-sdk/project-index';

/**
 * Builds the project index for the current directory: every cartridge below it
 * (plus any extra paths), ordered by the configured `cartridges` value.
 */
export function loadProjectIndex(cartridgePath: string[] | undefined, extraPaths: string[] = []): ProjectIndex {
  return buildProjectIndex({root: process.cwd(), paths: extraPaths, cartridgePath});
}

/** A cartridge file as a path relative to the current directory, with an optional `:line`. */
export function displayPath(index: ProjectIndex, cartridge: string, relPath: string, line?: number): string {
  const root = index.cartridges.find((c) => c.name === cartridge)?.src;
  const file = root ? path.relative(process.cwd(), path.join(root, relPath)) : `${cartridge}/${relPath}`;
  return line ? `${file}:${line}` : file;
}
