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
import {pathToFileURL} from 'node:url';
import zlib from 'node:zlib';
import tar from 'tar-fs';
import {Minimatch} from 'minimatch';
import {getLogger} from '../../logging/logger.js';

/**
 * Shape of config.server.ts exported from an MRT app.
 * Used to define ssrOnly, ssrShared, and ssrParameters for bundle creation.
 */
export interface MrtServerConfig {
  ssrOnly: string[];
  ssrShared: string[];
  ssrParameters?: Record<string, unknown>;
}

export const DEFAULT_SSR_ONLY = ['ssr.js', 'ssr.mjs', 'server/**/*'];
export const DEFAULT_SSR_SHARED = ['static/**/*', 'client/**/*'];

/**
 * Default SSR parameters applied to all bundles.
 * These can be overridden by providing ssrParameters in CreateBundleOptions.
 */
export const DEFAULT_SSR_PARAMETERS: Record<string, unknown> = {
  /**
   * Node.js version for the SSR function runtime.
   * @see https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/upgrading-node-version.html
   */
  SSRFunctionNodeVersion: '24.x',
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
   * If omitted, loaded from `config.server.{ts,js}` in the project directory
   * (or the legacy `build/config.server.js`) if present.
   * @example ['ssr.js', 'ssr/*.js']
   */
  ssrOnly?: string[];

  /**
   * Glob patterns for files shared between client and server.
   * If omitted, loaded from `config.server.{ts,js}` in the project directory
   * (or the legacy `build/config.server.js`) if present.
   * @example ['static/**\/*', '**\/*.js']
   */
  ssrShared?: string[];

  /**
   * Path to the build directory containing the application build output.
   * @default 'build'
   */
  buildDirectory?: string;

  /**
   * Directory to read `config.server.{ts,js}` from when ssrOnly/ssrShared are
   * not provided explicitly. The config is read straight from source at bundle
   * time (no build step), so `config.server.js` need not be emitted into the
   * build output.
   * @default process.cwd()
   */
  projectDirectory?: string;

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
/**
 * Extracts the exported {@link MrtServerConfig} from an imported config module,
 * accepting either a named `config` export or a default export.
 */
function pickServerConfig(mod: unknown): MrtServerConfig | null {
  const record = mod as {config?: MrtServerConfig; default?: {config?: MrtServerConfig} & MrtServerConfig};
  const config = record.config ?? record.default?.config ?? record.default;
  return (config as MrtServerConfig | undefined) ?? null;
}

/**
 * Candidate `config.server` filenames in the project directory, in the order
 * they are tried. `.ts` is preferred (the authored source); compiled `.js`/`.mjs`
 * variants are accepted for compatibility.
 */
const PROJECT_SERVER_CONFIG_FILENAMES = ['config.server.ts', 'config.server.js', 'config.server.mjs'];

/**
 * Reads `config.server.{ts,js,mjs}` from the project directory and returns the
 * exported {@link MrtServerConfig}, or `null` if no such file exists.
 *
 * The config is read straight from source at bundle time (no build step): the
 * reference apps keep `config.server.ts` in the project root defining
 * ssrOnly/ssrShared/ssrParameters. TypeScript is loaded via jiti, so any
 * type-only imports in the file are erased and need not be resolved.
 *
 * Throws if a config file exists but cannot be imported, so a broken config
 * fails loudly rather than silently falling back to defaults.
 */
async function loadProjectServerConfig(projectDirectory: string): Promise<MrtServerConfig | null> {
  for (const filename of PROJECT_SERVER_CONFIG_FILENAMES) {
    const filePath = path.join(projectDirectory, filename);
    try {
      await stat(filePath);
    } catch {
      continue;
    }
    try {
      // jiti transpiles and evaluates the (possibly TypeScript) config in-memory
      // so it can be read from source without a build step. Imported lazily so
      // consumers that never build a bundle don't pay for it.
      const {createJiti} = await import('jiti');
      const jiti = createJiti(import.meta.url, {fsCache: false, interopDefault: true});
      const mod = await jiti.import(filePath);
      return pickServerConfig(mod);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load server config at "${filePath}": ${detail}`);
    }
  }
  return null;
}

/**
 * Reads the legacy compiled `build/config.server.js` from the build directory,
 * returning the exported {@link MrtServerConfig} or `null` if it is absent or
 * fails to import. Kept as a fallback for builds that still emit it; new builds
 * should keep `config.server.ts` in the project directory instead
 * (see {@link loadProjectServerConfig}).
 */
async function loadServerConfig(buildPath: string): Promise<MrtServerConfig | null> {
  const configPath = path.join(buildPath, 'config.server.js');
  try {
    await stat(configPath);
  } catch {
    return null;
  }
  try {
    // Convert the absolute path to a file:// URL before dynamic import. On
    // Windows a bare absolute path (e.g. `D:\build\config.server.js`) is parsed
    // as a URL whose scheme is the drive letter and fails to import; a file://
    // URL imports correctly on all platforms.
    const mod = await import(pathToFileURL(configPath).href);
    return pickServerConfig(mod);
  } catch {
    return null;
  }
}

/**
 * Reads the project's `package.json` and returns its declared dependencies
 * (merged `dependencies` + `devDependencies`) for inclusion in bundle metadata,
 * mirroring how pwa-kit and storefront-next populate `bundle_metadata.dependencies`.
 *
 * Best-effort: returns `undefined` when there is no readable/parseable
 * `package.json`, so metadata collection never blocks a bundle. The resolved
 * dependency-tree versions those tools overlay via `npm ls` are intentionally
 * not collected here — that overlay targets specific runtime packages and does
 * not generalize; the declared `package.json` versions are the portable metadata.
 */
async function loadProjectDependencies(projectDirectory: string): Promise<Record<string, string> | undefined> {
  const logger = getLogger();
  const packagePath = path.join(projectDirectory, 'package.json');
  let raw: string;
  try {
    raw = await readFile(packagePath, 'utf8');
  } catch {
    logger.debug({packagePath}, '[MRT] No package.json found; omitting bundle dependency metadata');
    return undefined;
  }
  try {
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencies = {...pkg.dependencies, ...pkg.devDependencies};
    return Object.keys(dependencies).length > 0 ? dependencies : undefined;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    logger.warn({packagePath, detail}, '[MRT] Could not parse package.json; omitting bundle dependency metadata');
    return undefined;
  }
}

export async function createBundle(options: CreateBundleOptions): Promise<Bundle> {
  const logger = getLogger();
  const {projectSlug} = options;
  const buildDirectory = options.buildDirectory || 'build';
  const message = options.message || getDefaultMessage();
  const projectDirectory = options.projectDirectory ?? process.cwd();
  const buildPath = path.isAbsolute(buildDirectory) ? buildDirectory : path.join(process.cwd(), buildDirectory);

  // Prefer config.server.{ts,js} read from the project directory; fall back to a
  // legacy compiled build/config.server.js for builds that still emit one.
  const serverConfig = (await loadProjectServerConfig(projectDirectory)) ?? (await loadServerConfig(buildPath));

  // Collect declared package.json dependencies for bundle metadata (best-effort).
  const dependencies = await loadProjectDependencies(projectDirectory);

  const ssrOnly = options.ssrOnly ?? serverConfig?.ssrOnly ?? DEFAULT_SSR_ONLY;
  const ssrShared = options.ssrShared ?? serverConfig?.ssrShared ?? DEFAULT_SSR_SHARED;
  const ssrParamsFromConfig = serverConfig?.ssrParameters ?? {};

  // Merge: defaults < config.server < explicit options (explicit values win)
  const ssrParameters = {
    ...DEFAULT_SSR_PARAMETERS,
    ...ssrParamsFromConfig,
    ...options.ssrParameters,
  };

  logger.debug({projectSlug, buildDirectory, ssrParameters}, '[MRT] Creating bundle');

  // Validate SSR patterns. An SSR entry point is mandatory, but ssrShared may
  // legitimately be empty for a pure-SSR app with no shared/static assets, so
  // only require ssrOnly to be non-empty.
  if (ssrOnly.length === 0) {
    throw new Error('ssrOnly patterns are required and cannot be empty');
  }

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

      // Prefix all files with {projectSlug}/bld/
      const newRoot = path.join(projectSlug, 'bld');

      const pack = tar.pack(buildPath, {
        map(header) {
          if (header.type === 'file') {
            filesInArchive.push(header.name);
          }
          header.name = path.join(newRoot, header.name);
          return header;
        },
      });

      pack.on('error', reject);
      output.on('error', reject);
      output.on('finish', resolve);

      pack.pipe(output);
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
      ...(dependencies ? {bundle_metadata: {dependencies}} : {}),
    };
  } finally {
    // Clean up temp directory
    await rm(tmpDir, {recursive: true}).catch(() => {});
  }
}

/**
 * How the server handles ssrOnly/ssrShared patterns that match no files.
 * - `strict`: reject patterns that match nothing.
 * - `ignore_missing`: allow patterns that match nothing.
 */
export type BundleV2MatchMode = 'strict' | 'ignore_missing';

/** Default archive path prefix under which built files and the config file live. */
export const DEFAULT_V2_ROOT_DIR = 'bld';

/** Default path to the in-archive config file, relative to the root directory. */
export const DEFAULT_V2_CONFIG_PATH = '.mrt/config.json';

/** Default match mode for ssrOnly/ssrShared pattern matching. */
export const DEFAULT_V2_MATCH_MODE: BundleV2MatchMode = 'strict';

/**
 * Bundle metadata written into the v2 in-archive config file.
 *
 * The server strictly allowlists these sub-keys; only `dependencies` and
 * `ccOverrides` are accepted.
 */
export interface BundleV2Metadata {
  /** Application dependencies (e.g. resolved package versions). */
  dependencies?: Record<string, unknown>;
  /** Commerce Cloud override identifiers. */
  ccOverrides?: string[];
}

/**
 * The v2 in-archive config file contents (`{rootDir}/{configPath}`).
 */
export interface BundleV2Config {
  ssrOnly: string[];
  ssrShared: string[];
  ssrParameters: Record<string, unknown>;
  bundleMetadata?: BundleV2Metadata;
}

/**
 * Configuration for v2 bundle archive creation.
 *
 * Unlike v1, the archive layout has no project-slug prefix: built files sit
 * directly under `{rootDir}/` and the SSR configuration is written into the
 * archive at `{rootDir}/{configPath}` rather than being sent as request fields.
 */
export interface CreateBundleV2Options {
  /**
   * Optional message describing the bundle.
   * Defaults to a git-based message or a timestamp.
   */
  message?: string;

  /**
   * SSR parameters written into the in-archive config file.
   * Merged over defaults and any values from the on-disk v2 config file
   * ({buildDirectory}/{configPath}) or the project's `config.server.{ts,js}`.
   */
  ssrParameters?: Record<string, unknown>;

  /**
   * Glob patterns for files that should only run on the server.
   * Written verbatim into the config file; matched server-side against
   * paths relative to `rootDir`.
   * If omitted, read from the on-disk v2 config file
   * ({buildDirectory}/{configPath}) if present, else the project's
   * `config.server.{ts,js}`, else defaults.
   */
  ssrOnly?: string[];

  /**
   * Glob patterns for files shared between client and server.
   * Written verbatim into the config file; matched server-side against
   * paths relative to `rootDir`.
   * If omitted, read from the on-disk v2 config file
   * ({buildDirectory}/{configPath}) if present, else the project's
   * `config.server.{ts,js}`, else defaults.
   */
  ssrShared?: string[];

  /**
   * Bundle metadata written into the config file (dependencies, ccOverrides).
   */
  bundleMetadata?: BundleV2Metadata;

  /**
   * Path to the build directory containing the application build output.
   * @default 'build'
   */
  buildDirectory?: string;

  /**
   * Directory to read `config.server.{ts,js}` from when there is no on-disk v2
   * config file and ssrOnly/ssrShared are not provided explicitly. The config
   * is read straight from source at bundle time (no build step) and its values
   * are written into the bundle's in-archive config file.
   * @default process.cwd()
   */
  projectDirectory?: string;

  /**
   * Archive path prefix under which built files and the config file live.
   * @default 'bld'
   */
  rootDir?: string;

  /**
   * Path to the in-archive config file, relative to `rootDir`.
   * @default '.mrt/config.json'
   */
  configPath?: string;

  /**
   * How the server handles ssrOnly/ssrShared patterns that match no files.
   * @default 'strict'
   */
  matchMode?: BundleV2MatchMode;
}

/**
 * A v2 bundle ready for multipart upload to Managed Runtime.
 */
export interface BundleV2 {
  /** Message describing the bundle. */
  message: string;

  /** The gzip-compressed tar archive bytes. */
  archive: Buffer;

  /** Archive path prefix used when building the archive; sent as a request field. */
  rootDir: string;

  /** Config file path relative to `rootDir`; sent as a request field. */
  configPath: string;

  /** Match mode; sent as a request field. */
  matchMode: BundleV2MatchMode;

  /** The config object written into the archive at `{rootDir}/{configPath}`. */
  config: BundleV2Config;
}

/**
 * Joins path segments using forward slashes, as required for tar entry names.
 */
function tarJoin(...segments: string[]): string {
  return path.posix.join(...segments.map((s) => s.split(path.sep).join('/')));
}

/**
 * Reads the v2 in-archive config file from disk, if the build emits one.
 *
 * v2 builds write their SSR configuration to `{buildPath}/{configPath}` (by
 * default `bld/.mrt/config.json` relative to the archive, i.e.
 * `{buildDirectory}/.mrt/config.json` on disk). Returns the parsed object — a
 * partial {@link BundleV2Config} plus any extra top-level keys the build wrote —
 * or `null` if no such file exists. Throws if the file exists but is not valid
 * JSON or is not a JSON object, so a malformed build config fails loudly rather
 * than being silently discarded.
 */
async function loadV2Config(buildPath: string, configPath: string): Promise<Record<string, unknown> | null> {
  const filePath = path.join(buildPath, configPath);
  let contents: string;
  try {
    contents = await readFile(filePath, 'utf8');
  } catch (error) {
    // Only treat a genuinely-absent file as "no config"; surface any other read
    // failure (permissions, path-is-a-directory, etc.) so a present-but-broken
    // config fails loudly rather than silently falling back to defaults.
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read v2 bundle config at "${filePath}": ${detail}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse v2 bundle config at "${filePath}": ${detail}`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Invalid v2 bundle config at "${filePath}": expected a JSON object`);
  }
  return parsed as Record<string, unknown>;
}

/**
 * Creates a v2-format bundle archive from a build directory.
 *
 * Produces a gzip-compressed tar archive whose entries sit directly under
 * `{rootDir}/` (no project-slug prefix, unlike v1), with the SSR configuration
 * written into the archive at `{rootDir}/{configPath}` (default
 * `bld/.mrt/config.json`). The returned object carries the archive bytes plus
 * the `rootDir`/`configPath`/`matchMode` values to send as multipart request
 * fields, so the builder and the request stay consistent.
 *
 * The SSR configuration is resolved as follows: if the build emitted an on-disk
 * v2 config file at `{buildDirectory}/{configPath}`, it is used; otherwise the
 * project's `config.server.{ts,js}` is read and used to build the config that
 * goes into the bundle; explicit options override either, merged per key. When
 * the build already emitted the v2 config file, it is excluded from the archive
 * walk and replaced by the resolved config so there is exactly one copy.
 *
 * @param options - v2 bundle creation options
 * @returns v2 bundle object ready for multipart upload
 * @throws Error if the build directory doesn't exist or ssr patterns are empty
 *
 * @example
 * ```typescript
 * const bundle = await createBundleV2({
 *   ssrOnly: ['ssr.js'],
 *   ssrShared: ['static/**\/*'],
 *   buildDirectory: './build',
 *   message: 'Release v1.0.0'
 * });
 * ```
 */
export async function createBundleV2(options: CreateBundleV2Options): Promise<BundleV2> {
  const logger = getLogger();
  const buildDirectory = options.buildDirectory || 'build';
  const message = options.message || getDefaultMessage();
  const rootDir = options.rootDir || DEFAULT_V2_ROOT_DIR;
  const configPath = options.configPath || DEFAULT_V2_CONFIG_PATH;
  const matchMode = options.matchMode || DEFAULT_V2_MATCH_MODE;
  const projectDirectory = options.projectDirectory ?? process.cwd();
  const buildPath = path.isAbsolute(buildDirectory) ? buildDirectory : path.join(process.cwd(), buildDirectory);

  // Resolve the base SSR config. Prefer the v2 config file the build emits at
  // {buildPath}/{configPath}; if absent, read the project's config.server.{ts,js}
  // (falling back to a legacy compiled build/config.server.js); if neither
  // exists, use defaults. Explicit options always win over the resolved base,
  // per key.
  const v2Config = await loadV2Config(buildPath, configPath);
  const serverConfig = v2Config
    ? null
    : ((await loadProjectServerConfig(projectDirectory)) ?? (await loadServerConfig(buildPath)));

  const baseSsrOnly = (v2Config?.ssrOnly as string[] | undefined) ?? serverConfig?.ssrOnly;
  const baseSsrShared = (v2Config?.ssrShared as string[] | undefined) ?? serverConfig?.ssrShared;
  const baseSsrParameters =
    (v2Config?.ssrParameters as Record<string, unknown> | undefined) ?? serverConfig?.ssrParameters ?? {};

  const ssrOnly = options.ssrOnly ?? baseSsrOnly ?? DEFAULT_SSR_ONLY;
  const ssrShared = options.ssrShared ?? baseSsrShared ?? DEFAULT_SSR_SHARED;

  // Merge: defaults < base config file < explicit options (explicit values win)
  const ssrParameters = {
    ...DEFAULT_SSR_PARAMETERS,
    ...baseSsrParameters,
    ...options.ssrParameters,
  };

  logger.debug(
    {
      buildDirectory,
      rootDir,
      configPath,
      matchMode,
      ssrParameters,
      configSource: v2Config ? 'v2-config-file' : serverConfig ? 'config.server' : 'defaults',
    },
    '[MRT] Creating v2 bundle',
  );

  // Validate SSR patterns. An SSR entry point is mandatory, but ssrShared may
  // legitimately be empty for a pure-SSR app with no shared/static assets, so
  // only require ssrOnly to be non-empty.
  if (ssrOnly.length === 0) {
    throw new Error('ssrOnly patterns are required and cannot be empty');
  }

  try {
    await stat(buildPath);
  } catch {
    throw new Error(
      `Build directory at path "${buildPath}" not found.\n` + 'Ensure your project has been built first.',
    );
  }

  // Assemble the in-archive config file contents. Preserve any extra top-level
  // keys the build wrote into its v2 config file, then apply the resolved SSR
  // values on top.
  const config: BundleV2Config & Record<string, unknown> = {...v2Config, ssrOnly, ssrShared, ssrParameters};

  // Merge bundle metadata per-key: explicit options override the file's values.
  // Only the server-allowlisted sub-keys (dependencies, ccOverrides) are kept.
  const fileMetadata = (v2Config?.bundleMetadata as BundleV2Metadata | undefined) ?? {};
  // Explicit option > v2 config file > declared package.json dependencies.
  const dependencies =
    options.bundleMetadata?.dependencies ??
    fileMetadata.dependencies ??
    (await loadProjectDependencies(projectDirectory));
  const ccOverrides = options.bundleMetadata?.ccOverrides ?? fileMetadata.ccOverrides;
  const metadata: BundleV2Metadata = {};
  if (dependencies) metadata.dependencies = dependencies;
  if (ccOverrides) metadata.ccOverrides = ccOverrides;
  if (Object.keys(metadata).length > 0) {
    config.bundleMetadata = metadata;
  } else {
    delete config.bundleMetadata;
  }

  const configBytes = Buffer.from(JSON.stringify(config), 'utf8');
  const configEntryName = tarJoin(rootDir, configPath);

  // Build a gzip-compressed tar with all built files prefixed by rootDir and the
  // config file injected at {rootDir}/{configPath}. Collect the output in memory.
  const filesInArchive: string[] = [];
  const gzip = zlib.createGzip();
  const chunks: Buffer[] = [];

  // If the build already emitted the config file on disk, exclude it from the
  // walk so the injected (resolved) config is the only copy in the archive.
  // tar-fs invokes `ignore` with the absolute path of each candidate entry.
  const onDiskConfigPath = path.resolve(buildPath, configPath);

  const pack = tar.pack(buildPath, {
    // Do not auto-finalize; we inject the config entry in finish() first.
    finalize: false,
    ignore(name) {
      return path.resolve(name) === onDiskConfigPath;
    },
    map(header) {
      if (header.type === 'file') {
        filesInArchive.push(header.name);
      }
      header.name = tarJoin(rootDir, header.name);
      return header;
    },
    finish(packStream) {
      packStream.entry({name: configEntryName}, configBytes, (err) => {
        if (err) {
          packStream.destroy(err);
          return;
        }
        packStream.finalize();
      });
    },
  });

  await new Promise<void>((resolve, reject) => {
    pack.on('error', reject);
    gzip.on('error', reject);
    gzip.on('data', (chunk: Buffer) => chunks.push(chunk));
    gzip.on('end', resolve);
    pack.pipe(gzip);
  });

  const archive = Buffer.concat(chunks);

  logger.debug(
    {fileCount: filesInArchive.length, configEntryName, archiveBytes: archive.length},
    '[MRT] v2 bundle archive created',
  );
  logger.trace({files: filesInArchive.slice(0, 20)}, '[MRT] First 20 files in v2 archive');

  return {message, archive, rootDir, configPath, matchMode, config};
}
