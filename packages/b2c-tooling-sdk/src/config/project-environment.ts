/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {parseEnv} from 'node:util';

/** Environment variable that selects the env file (`SFCC_DOTENV_FILE=` selects none). */
export const ENV_FILE_ENV_VAR = 'SFCC_DOTENV_FILE';

/** Read all variables from a project's `.env` file without mutating `process.env`. */
export function readProjectEnvironment(projectDirectory?: string): Record<string, string | undefined> | undefined {
  if (!projectDirectory) return undefined;

  const environmentPath = path.join(projectDirectory, '.env');
  if (!existsSync(environmentPath)) return undefined;

  return parseEnv(readFileSync(environmentPath, 'utf8'));
}

/** Merge project variables with an ambient environment, with ambient values taking precedence. */
export function mergeProjectEnvironment(
  projectEnvironment?: Record<string, string | undefined>,
  ambientEnvironment: Record<string, string | undefined> = process.env,
): Record<string, string | undefined> {
  return {...projectEnvironment, ...ambientEnvironment};
}

/** Options for selecting a project env file. */
export interface EnvFileSelectionOptions {
  /**
   * Explicit env file path. An empty string selects no env file; `undefined`
   * selects `<projectDirectory>/.env` when it exists. Relative paths resolve
   * from the current working directory.
   */
  envFile?: string;
  /** Directory searched for the default `.env` (default: current working directory) */
  projectDirectory?: string;
}

/**
 * Resolves which env file applies.
 *
 * An explicit file replaces the default `.env` (it is not layered on top of it).
 *
 * @returns Absolute path of the env file, or undefined when none applies
 * @throws Error if an explicitly selected file does not exist
 */
export function resolveEnvFilePath(options: EnvFileSelectionOptions = {}): string | undefined {
  if (options.envFile === '') return undefined;

  if (options.envFile !== undefined) {
    const explicitPath = path.resolve(options.envFile);
    if (!existsSync(explicitPath)) {
      throw new Error(`Env file not found: ${explicitPath}`);
    }
    return explicitPath;
  }

  const defaultPath = path.resolve(options.projectDirectory ?? process.cwd(), '.env');
  return existsSync(defaultPath) ? defaultPath : undefined;
}

/** Reads variables from an env file without mutating `process.env`. */
export function readEnvFile(filePath: string): Record<string, string | undefined> {
  return parseEnv(readFileSync(filePath, 'utf8'));
}

/**
 * Loads env file variables into an environment object without overriding
 * values that are already set (shell variables win).
 *
 * `SFCC_DOTENV_FILE` is ignored inside env files (no chaining). A relative
 * `SFCC_CONFIG` resolves from the env file's directory.
 *
 * @returns Names of the variables that were applied
 */
export function applyEnvFile(filePath: string, env: Record<string, string | undefined> = process.env): string[] {
  const values = readEnvFile(filePath);
  const applied: string[] = [];

  for (const [key, rawValue] of Object.entries(values)) {
    if (key === ENV_FILE_ENV_VAR || rawValue === undefined || env[key] !== undefined) continue;

    let value = rawValue;
    if (key === 'SFCC_CONFIG' && value !== '' && !path.isAbsolute(value)) {
      value = path.resolve(path.dirname(filePath), value);
    }

    env[key] = value;
    applied.push(key);
  }

  return applied;
}

/** An env file applied to the environment, with the variables it set. */
export interface LoadedEnvFile {
  path: string;
  keys: string[];
}

const PRELOADED_ENV_FILE = Symbol.for('@salesforce/b2c-tooling-sdk/preloaded-env-file');

/**
 * Selects the env file for a command line and applies it without overriding
 * variables that are already set.
 *
 * `--dotenv-file` / `SFCC_DOTENV_FILE` select the file; otherwise
 * `<--project-directory>/.env` or `./.env` applies.
 *
 * @throws Error if an explicitly selected file does not exist
 */
export function loadEnvFileForArgv(
  argv: string[],
  env: Record<string, string | undefined> = process.env,
): LoadedEnvFile | undefined {
  const envFile = readRawFlag(argv, ['--dotenv-file']) ?? env[ENV_FILE_ENV_VAR];
  const projectDirectory =
    readRawFlag(argv, ['--project-directory', '--working-directory']) ??
    (env.SFCC_PROJECT_DIRECTORY || env.SFCC_WORKING_DIRECTORY || undefined);

  const filePath = resolveEnvFilePath({envFile, projectDirectory});
  if (!filePath) return undefined;
  return {path: filePath, keys: applyEnvFile(filePath, env)};
}

/**
 * Applies the env file from an executable's entry point, before oclif starts,
 * so hooks and plugins see its values. Errors are left for the command to
 * report when it loads the env file again.
 */
export function preloadEnvFile(argv: string[] = process.argv.slice(2)): void {
  try {
    const loaded = loadEnvFileForArgv(argv);
    if (loaded) (globalThis as Record<symbol, unknown>)[PRELOADED_ENV_FILE] = loaded;
  } catch {
    // Reported by the command.
  }
}

/** Returns (and forgets) the env file applied by {@link preloadEnvFile}. */
export function takePreloadedEnvFile(): LoadedEnvFile | undefined {
  const store = globalThis as Record<symbol, unknown>;
  const loaded = store[PRELOADED_ENV_FILE] as LoadedEnvFile | undefined;
  delete store[PRELOADED_ENV_FILE];
  return loaded;
}

/**
 * Reads a string flag value from raw argv (`--flag value` or `--flag=value`)
 * before oclif parses it. Stops at `--`.
 */
export function readRawFlag(argv: string[], names: string[]): string | undefined {
  let value: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--') break;
    for (const name of names) {
      if (arg === name && i + 1 < argv.length) {
        value = argv[i + 1];
      } else if (arg.startsWith(`${name}=`)) {
        value = arg.slice(name.length + 1);
      }
    }
  }
  return value;
}
