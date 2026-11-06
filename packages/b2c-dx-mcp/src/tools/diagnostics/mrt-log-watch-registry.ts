/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {randomUUID} from 'node:crypto';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';
import type {MrtLogWatch} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import type {ToolExecutionContext} from '../adapter.js';
import type {ToolResolution} from '../project-context.js';

const IDLE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export interface MrtLogWatchEntry {
  watchId: string;
  /** MRT project slug being tailed. */
  project: string;
  /** MRT environment slug being tailed. */
  environment: string;
  /** MRT API origin URL. */
  origin?: string;
  /** Buffered SDK watch; owns entries, filters and caps. */
  watch: MrtLogWatch;
  resolution?: ToolResolution;
}

export interface RegisterMrtWatchOptions {
  project: string;
  environment: string;
  origin?: string;
  watch: MrtLogWatch;
  resolution?: ToolResolution;
}

/**
 * Dedup key for an MRT log watch. A developer may tail several
 * (project, environment, origin) tuples concurrently, so all three form the key.
 */
export function mrtWatchKey(project: string, environment: string, origin?: string): string {
  return `${project}\u0000${environment}\u0000${origin ?? ''}`;
}

/** Tool-facing IDs for running MRT log watches: one per (project, environment, origin), reaped when idle. */
export class MrtLogWatchRegistry {
  private cleanupTimer: ReturnType<typeof setInterval> | undefined;
  private readonly watches = new Map<string, MrtLogWatchEntry>();

  constructor() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleWatches().catch(() => {});
    }, CLEANUP_INTERVAL_MS);
    this.cleanupTimer.unref();
  }

  async destroyAll(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    await Promise.allSettled([...this.watches.keys()].map((id) => this.destroyWatch(id)));
  }

  async destroyWatch(watchId: string): Promise<void> {
    const entry = this.watches.get(watchId);
    if (!entry) return;
    this.watches.delete(watchId);
    await entry.watch.stop().catch(() => {});
  }

  findByKey(project: string, environment: string, origin?: string): MrtLogWatchEntry | undefined {
    const key = mrtWatchKey(project, environment, origin);
    for (const entry of this.watches.values()) {
      if (mrtWatchKey(entry.project, entry.environment, entry.origin) === key) return entry;
    }
    return undefined;
  }

  getWatch(watchId: string): MrtLogWatchEntry | undefined {
    return this.watches.get(watchId);
  }

  getWatchOrThrow(watchId: string): MrtLogWatchEntry {
    const entry = this.watches.get(watchId);
    if (!entry) {
      throw new Error(
        `No MRT log watch found with id "${watchId}". Use mrt_logs_watch(action: list) to see active watches.`,
      );
    }
    return entry;
  }

  listWatches(): MrtLogWatchEntry[] {
    return [...this.watches.values()];
  }

  registerWatch(options: RegisterMrtWatchOptions): MrtLogWatchEntry {
    const {project, environment, origin} = options;
    const existing = this.findByKey(project, environment, origin);
    if (existing) {
      throw new Error(
        `An MRT log watch already exists for ${project}/${environment} (watch_id: "${existing.watchId}"). ` +
          `Stop it with mrt_logs_watch(action: stop) first, or poll the existing watch.`,
      );
    }
    const entry: MrtLogWatchEntry = {watchId: randomUUID(), ...options};
    this.watches.set(entry.watchId, entry);
    return entry;
  }

  private async cleanupIdleWatches(): Promise<void> {
    const logger = getLogger();
    const now = Date.now();
    const idle = [...this.watches.values()].filter((entry) => now - entry.watch.info().lastActivityAt > IDLE_TTL_MS);
    await Promise.allSettled(
      idle.map((entry) => {
        logger.info(
          {watchId: entry.watchId, project: entry.project, environment: entry.environment},
          'Cleaning up idle MRT log watch',
        );
        return this.destroyWatch(entry.watchId);
      }),
    );
  }
}

export function getMrtLogWatchRegistry(context: ToolExecutionContext): MrtLogWatchRegistry {
  const registry = context.serverContext?.mrtLogWatches;
  if (!registry) {
    throw new Error('MRT log watch registry not available');
  }
  return registry;
}
