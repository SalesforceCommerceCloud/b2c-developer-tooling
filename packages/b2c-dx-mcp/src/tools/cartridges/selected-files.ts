/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable no-await-in-loop -- Validate each selected file before the upload starts. */

import {realpath, stat} from 'node:fs/promises';
import path from 'node:path';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import {
  findCartridges,
  fileToCartridgePath,
  uploadFiles,
  reloadCodeVersion,
  type DeployOptions,
  type FileChange,
} from '@salesforce/b2c-tooling-sdk/operations/code';

/** Validate the complete selection before creating or uploading an archive. */
export async function deploySelectedFiles(
  instance: B2CInstance,
  directory: string,
  projectDirectory: string,
  files: string[],
  options: DeployOptions,
) {
  const cartridges = findCartridges(directory, options);
  const uploads: FileChange[] = [];
  const destinations = new Set<string>();
  for (const file of files) {
    const src = path.resolve(projectDirectory, file);
    const mapped = fileToCartridgePath(src, cartridges);
    if (!mapped) throw new Error(`File is outside the selected cartridges: ${file}`);
    const cartridge = cartridges.find((c) => c.dest === mapped.dest.split('/')[0])!;
    const actual = await realpath(src);
    const root = await realpath(cartridge.src);
    if (!fileToCartridgePath(actual, [{...cartridge, src: root}]) || !(await stat(actual)).isFile()) {
      throw new Error(`Source must be a regular file within its cartridge: ${file}`);
    }
    // eslint-disable-next-line no-control-regex -- Reject control characters in archive destinations.
    if (mapped.dest.split('/').some((part) => !part || part === '..' || /[\\\u0000-\u001F]/.test(part))) {
      throw new Error(`Invalid cartridge destination: ${file}`);
    }
    if (destinations.has(mapped.dest)) throw new Error(`Duplicate cartridge destination: ${mapped.dest}`);
    destinations.add(mapped.dest);
    uploads.push({...mapped, src: actual});
  }
  const codeVersion = instance.config.codeVersion!;
  const warnings: string[] = [];
  await uploadFiles(instance, codeVersion, uploads, [], {
    strict: true,
    maxBytes: 64 * 1024 * 1024,
    onWarning: (message) => warnings.push(message),
  });
  let reloaded = false;
  if (options.reload) {
    try {
      await reloadCodeVersion(options.scriptsBackend!, codeVersion);
      reloaded = true;
    } catch (error) {
      warnings.push(
        `Files uploaded, but code-version reload failed: ${String(error)}. Inspect the active version before retrying reload.`,
      );
    }
  }
  return {
    cartridges: cartridges.filter((c) => uploads.some((f) => f.dest.startsWith(`${c.dest}/`))),
    codeVersion,
    activated: reloaded,
    reloaded,
    uploadedFiles: [...destinations],
    ...(warnings.length > 0 ? {warnings} : {}),
  };
}
