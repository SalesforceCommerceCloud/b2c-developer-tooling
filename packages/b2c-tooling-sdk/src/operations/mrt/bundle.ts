/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Bundle creation utilities for Managed Runtime.
 *
 * Creates tar archives for deployment to Managed Runtime.
 * Based on the bundle format expected by the MRT API.
 *
 * @module operations/mrt/bundle
 */
import {createWriteStream} from 'node:fs';
import {readFile, stat, mkdtemp, rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import archiver from 'archiver';
import {Minimatch} from 'minimatch';
import {getLogger} from '../../logging/logger.js';
import type {Stats} from 'node:fs';

/**
 * Default SSR parameters applied to all bundles.
 * These can be overridden by providing ssrParameters in CreateBundleOptions.
 */
export const DEFAULT_SSR_PARAMETERS: Record<string, unknown> = {
  /**
   * Node.js version for the SSR function runtime.
   * @see https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/upgrading-node-version.html
   */
  SSRFunctionNodeVersion: '22.x',
};

/**
 * Configuration for bundle creation.
 */
export interface CreateBundleOptions {
  /**
   * Optional message describing the bundle.
   * Defaults to a git-based message or a timestamp.
   */
  message?: string;

  /**
   * SSR parameters to include in the bundle.
   * These are configuration values for the SSR runtime.
   */
  ssrParameters?: Record<string, unknown>;

  /**
   * Glob patterns for files that should only run on the server.
   * @example ['ssr.js', 'ssr/*.js']
   */
  ssrOnly: string[];

  /**
   * Glob patterns for files shared between client and server.
   * @example ['static/**\/*', '**\/*.js']
   */
  ssrShared: string[];

  /**
   * Path to the build directory containing the application build output.
   * @default 'build'
   */
  buildDirectory?: string;

  /**
   * Project slug for the MRT project.
   * Used to prefix files in the archive.
   */
  projectSlug: string;
}

/**
 * A bundle ready for upload to Managed Runtime.
 */
export interface Bundle {
  /**
   * Message describing the bundle.
   */
  message: string;

  /**
   * Encoding of the data field.
   */
  encoding: 'base64';

  /**
   * Base64-encoded tar archive of the build.
   */
  data: string;

  /**
   * SSR parameters configuration.
   */
  ssr_parameters: Record<string, unknown>;

  /**
   * List of files that only run on the server.
   */
  ssr_only: string[];

  /**
   * List of files shared between client and server.
   */
  ssr_shared: string[];

  /**
   * Bundle metadata including dependencies.
   */
  bundle_metadata?: Record<string, unknown>;
}

/**
 * Creates a glob filter function from patterns.
 *
 * Patterns can include negations (prefixed with !).
 * A path matches if it matches any positive pattern
 * and does not match any negative pattern.
 *
 * @param patterns - Glob patterns to match against
 * @returns Filter function that returns true for matching paths
 */
export function createGlobFilter(patterns?: string[]): (path: string) => boolean {
  const allPatterns = (patterns || [])
    .map((pattern) => new Minimatch(pattern, {nocomment: true}))
    .filter((pattern) => !pattern.empty);

  const positivePatterns = allPatterns.filter((pattern) => !pattern.negate);
  const negativePatterns = allPatterns.filter((pattern) => pattern.negate);

  return (filePath: string) => {
    if (!filePath) return false;
    const positive = positivePatterns.some((pattern) => pattern.match(filePath));
    const negative = negativePatterns.some((pattern) => !pattern.match(filePath));
    return positive && !negative;
  };
}

/**
 * Gets a default bundle message with timestamp.
 *
 * @returns A message like "Bundle 2025-01-15T10:30:00.000Z"
 */
export function getDefaultMessage(): string {
  return `Bundle ${new Date().toISOString()}`;
}

/**
 * Creates a bundle from a build directory.
 *
 * This creates a tar archive of the build directory, base64 encodes it,
 * and returns a bundle object ready for upload to Managed Runtime.
 *
 * The archive structure is: `{projectSlug}/bld/{files...}`
 *
 * @param options - Bundle creation options
 * @returns Bundle object ready for upload
 * @throws Error if build directory doesn't exist or ssr patterns are empty
 *
 * @example
 * ```typescript
 * const bundle = await createBundle({
 *   projectSlug: 'my-project',
 *   ssrOnly: ['ssr.js'],
 *   ssrShared: ['**\/*.js', 'static/**\/*'],
 *   buildDirectory: './build',
 *   message: 'Release v1.0.0'
 * });
 * ```
 */
export async function createBundle(options: CreateBundleOptions): Promise<Bundle> {
  const logger = getLogger();
  const {ssrOnly, ssrShared, projectSlug} = options;
  const buildDirectory = options.buildDirectory || 'build';
  const message = options.message || getDefaultMessage();

  // Merge default SSR parameters with provided ones (provided values take precedence)
  const ssrParameters = {
    ...DEFAULT_SSR_PARAMETERS,
    ...options.ssrParameters,
  };

  logger.debug({projectSlug, buildDirectory, ssrParameters}, '[MRT] Creating bundle');

  // Validate SSR patterns
  if (ssrOnly.length === 0 || ssrShared.length === 0) {
    throw new Error('ssrOnly and ssrShared patterns are required and cannot be empty');
  }

  // Verify build directory exists
  const buildPath = path.isAbsolute(buildDirectory) ? buildDirectory : path.join(process.cwd(), buildDirectory);

  try {
    await stat(buildPath);
  } catch {
    throw new Error(
      `Build directory at path "${buildPath}" not found.\n` + 'Ensure your project has been built first.',
    );
  }

  // Create temp directory for tar file
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'b2c-mrt-'));
  const tarPath = path.join(tmpDir, 'build.tar');
  const filesInArchive: string[] = [];

  try {
    // Create tar archive
    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(tarPath);
      const archive = archiver('tar');

      archive.pipe(output);

      // Prefix all files with {projectSlug}/bld/
      const newRoot = path.join(projectSlug, 'bld', '');

      archive.directory(buildPath, false, (entry) => {
        const stats = entry.stats as Stats | undefined;
        if (stats?.isFile() && entry.name) {
          filesInArchive.push(entry.name);
        }
        entry.prefix = newRoot;
        return entry;
      });

      archive.on('error', reject);
      output.on('finish', resolve);

      archive.finalize();
    });

    logger.debug({fileCount: filesInArchive.length}, '[MRT] Archive created');
    logger.trace({files: filesInArchive.slice(0, 20)}, '[MRT] First 20 files in archive');

    // Read and encode the tar file
    const tarData = await readFile(tarPath);
    const base64Data = tarData.toString('base64');

    // Filter files for ssr_only and ssr_shared
    logger.trace({ssrOnly, ssrShared}, '[MRT] SSR patterns');
    const ssrOnlyFilter = createGlobFilter(ssrOnly);
    const ssrSharedFilter = createGlobFilter(ssrShared);

    const ssrOnlyFiles = filesInArchive.filter(ssrOnlyFilter);
    const ssrSharedFiles = filesInArchive.filter(ssrSharedFilter);

    logger.trace({ssrOnlyFiles: ssrOnlyFiles.slice(0, 20)}, '[MRT] First 20 ssr_only files');
    logger.trace({ssrSharedFiles: ssrSharedFiles.slice(0, 20)}, '[MRT] First 20 ssr_shared files');

    logger.debug(
      {
        ssrOnlyCount: ssrOnlyFiles.length,
        ssrSharedCount: ssrSharedFiles.length,
        totalSize: base64Data.length,
      },
      '[MRT] Bundle created',
    );

    return {
      message,
      encoding: 'base64',
      data: base64Data,
      ssr_parameters: ssrParameters,
      ssr_only: ssrOnlyFiles,
      ssr_shared: ssrSharedFiles,
    };
  } finally {
    // Clean up temp directory
    await rm(tmpDir, {recursive: true}).catch(() => {});
  }
}
