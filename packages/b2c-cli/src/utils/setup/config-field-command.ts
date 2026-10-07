/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {Command} from '@oclif/core';
import {BaseCommand, loadConfig} from '@salesforce/b2c-tooling-sdk/cli';
import {
  ConfigWriteError,
  DotenvFileSource,
  EnvSource,
  isSensitiveConfigField,
  maskConfigValue,
  readEnvFile,
  type ConfigSource,
  type ResolvedB2CConfig,
} from '@salesforce/b2c-tooling-sdk/config';

/**
 * Sources for SFCC_* variables, split so that values from the shell and from
 * the .env file are reported (and written) separately.
 *
 * The .env file is re-read rather than taken from `process.env`, so edits made
 * during this command are visible to a reload. Shell variables still win.
 */
export function createEnvironmentSources(envFile?: {keys: string[]; path: string}): ConfigSource[] {
  const fileKeys = new Set(envFile?.keys ?? []);
  const shellEnvironment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !fileKeys.has(key)));
  const sources: ConfigSource[] = [new EnvSource(shellEnvironment)];
  if (envFile) {
    const fileEnvironment = Object.fromEntries(
      Object.entries(readEnvFile(envFile.path)).filter(([key]) => shellEnvironment[key] === undefined),
    );
    sources.push(new DotenvFileSource(envFile.path, fileEnvironment));
  }
  return sources;
}

/** Format a value for display, masking sensitive fields unless `unmask`. */
export function formatConfigValue(field: string, value: unknown, unmask: boolean): string {
  if (typeof value === 'string') return !unmask && isSensitiveConfigField(field) ? maskConfigValue(value) : value;
  return JSON.stringify(value);
}

/**
 * Base for `setup get/set/unset`: resolves configuration with the shell
 * environment and .env file as sources, like `setup inspect`.
 */
export abstract class ConfigFieldCommand<T extends typeof Command> extends BaseCommand<T> {
  /** Report config errors without a stack trace. */
  protected failWith(error: unknown): never {
    if (error instanceof ConfigWriteError) this.error(error.message, {code: error.code});
    this.error(error instanceof Error ? error.message : String(error));
  }

  protected override async loadConfiguration(): Promise<ResolvedB2CConfig> {
    return loadConfig({}, this.getBaseConfigOptions(), {before: createEnvironmentSources(this.envFile)});
  }
}
