/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {readFileSync} from 'node:fs';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';

const CHECK_INTERVAL_MS = 86_400_000;
const RETRY_INTERVAL_MS = 3_600_000;
const FETCH_TIMEOUT_MS = 3000;
const DEFAULT_REGISTRY = 'https://registry.npmjs.org/';
const RELEASE_VERSION = /^(\d+)\.(\d+)\.(\d+)$/;

interface UpdateCache {
  latest: string;
  checkedAt: number;
}

/** Running version and, once a registry check has succeeded, the latest published version. */
export interface UpdateStatus {
  current: string;
  latest?: string;
  updateAvailable?: boolean;
}

export interface UpdateCheckOptions {
  packageName: string;
  currentVersion: string;
  /** Where the last registry result is kept between sessions. No file disables the check. */
  cacheFile?: string;
  env?: NodeJS.ProcessEnv;
  fetch?: typeof fetch;
  now?: () => number;
}

const isSet = (value: string | undefined): boolean => value === 'true' || value === '1';

/** The check makes a network call, so it honors the telemetry opt-outs and skips CI. */
export function isUpdateCheckDisabled(env: NodeJS.ProcessEnv): boolean {
  if (isSet(env.SFCC_DISABLE_UPDATE_CHECK) || isSet(env.SFCC_DISABLE_TELEMETRY) || isSet(env.SF_DISABLE_TELEMETRY)) {
    return true;
  }
  return env.CI !== undefined && env.CI !== '' && env.CI !== 'false' && env.CI !== '0';
}

function parseVersion(version: string): number[] | undefined {
  const match = version.match(RELEASE_VERSION);
  return match ? match.slice(1).map(Number) : undefined;
}

/** True when `latest` is a newer release than `current`. Prerelease versions never compare. */
export function isNewerVersion(latest: string, current: string): boolean {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

function readCache(file: string): undefined | UpdateCache {
  try {
    const value = JSON.parse(readFileSync(file, 'utf8')) as Partial<UpdateCache>;
    if (typeof value.latest === 'string' && typeof value.checkedAt === 'number') {
      return {latest: value.latest, checkedAt: value.checkedAt};
    }
  } catch {
    // Missing or unreadable cache: no known latest version yet.
  }
  return undefined;
}

/**
 * Advisory update check. Startup reads only the cached registry result, so the
 * notice never delays `initialize`; `refresh()` updates the cache in the
 * background for this session's `config_inspect` and the next session's
 * instructions.
 */
export class UpdateCheck {
  readonly disabled: boolean;
  private attemptedAt?: number;
  private cache?: UpdateCache;
  private readonly env: NodeJS.ProcessEnv;
  private inflight?: Promise<void>;
  private readonly now: () => number;

  constructor(private readonly options: UpdateCheckOptions) {
    this.env = options.env ?? process.env;
    this.now = options.now ?? Date.now;
    this.disabled = !options.cacheFile || isUpdateCheckDisabled(this.env);
    if (!this.disabled && options.cacheFile) this.cache = readCache(options.cacheFile);
  }

  /** One instructions line when a newer version is known, otherwise undefined. */
  note(): string | undefined {
    const {current, latest, updateAvailable} = this.status();
    if (!updateAvailable) return undefined;
    return `b2c-dx-mcp ${latest} is available (running ${current}). To upgrade, update the agent plugin or MCP server configuration and restart.`;
  }

  /** Fetch the latest version when the cached result is a day old. Never rejects. */
  refresh(): Promise<void> {
    if (this.disabled) return Promise.resolve();
    const now = this.now();
    if (this.cache && now - this.cache.checkedAt < CHECK_INTERVAL_MS) return Promise.resolve();
    if (this.attemptedAt !== undefined && now - this.attemptedAt < RETRY_INTERVAL_MS) {
      return this.inflight ?? Promise.resolve();
    }
    this.attemptedAt = now;
    this.inflight = this.fetchLatest(now).finally(() => {
      this.inflight = undefined;
    });
    return this.inflight;
  }

  status(): UpdateStatus {
    const current = this.options.currentVersion;
    const latest = this.cache?.latest;
    if (!latest) return {current};
    return {current, latest, updateAvailable: isNewerVersion(latest, current)};
  }

  private async fetchLatest(now: number): Promise<void> {
    const registry = (this.env.npm_config_registry || DEFAULT_REGISTRY).replace(/\/?$/, '/');
    const url = new URL(`-/package/${encodeURIComponent(this.options.packageName)}/dist-tags`, registry);
    try {
      const response = await (this.options.fetch ?? fetch)(url, {
        headers: {accept: 'application/json'},
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`registry returned ${response.status}`);
      const {latest} = (await response.json()) as {latest?: unknown};
      if (typeof latest !== 'string') throw new Error('registry returned no latest tag');
      this.cache = {latest, checkedAt: now};
      const file = this.options.cacheFile as string;
      await mkdir(path.dirname(file), {recursive: true});
      await writeFile(file, JSON.stringify(this.cache));
    } catch (error) {
      getLogger().debug({err: error}, 'MCP update check failed');
    }
  }
}
