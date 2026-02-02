/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {useCallback, useEffect, useRef, useState} from 'react';
import {B2CInstance, type AuthConfig} from '@salesforce/b2c-tooling-sdk';
import {tailLogs, type LogEntry, type TailLogsResult} from '@salesforce/b2c-tooling-sdk/operations/logs';
import type {LogTailConfig, SandboxModel} from '../types.js';

// Batch updates every 100ms to reduce re-renders
const BATCH_INTERVAL = 100;

export interface UseLogTailOptions {
  /** Sandbox to tail logs from */
  sandbox: SandboxModel;
  /** Log tail configuration */
  config: LogTailConfig;
  /** Authentication configuration */
  authConfig: AuthConfig;
  /** Maximum entries to keep in buffer (default 1000) */
  maxBuffer?: number;
}

export interface UseLogTailResult {
  /** Log entries in buffer */
  entries: LogEntry[];
  /** Loading state (initial connection) */
  loading: boolean;
  /** Error message if any */
  error: null | string;
  /** Whether tailing is paused */
  paused: boolean;
  /** Pause tailing (stops auto-scroll) */
  pause: () => void;
  /** Resume tailing */
  resume: () => void;
  /** Clear the buffer */
  clear: () => void;
}

/**
 * Checks if a log entry matches the level filter.
 */
function matchesLevel(entry: LogEntry, levels: string[]): boolean {
  if (!entry.level) return true;
  return levels.includes(entry.level);
}

/**
 * Hook to tail logs from a B2C Commerce sandbox.
 *
 * Wraps the SDK's tailLogs() function with React state management,
 * providing a circular buffer, pause/resume, and filtering.
 */
export function useLogTail({sandbox, config, authConfig, maxBuffer = 1000}: UseLogTailOptions): UseLogTailResult {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [paused, setPaused] = useState(false);

  // Keep track of tail result for cleanup
  const tailResultRef = useRef<null | TailLogsResult>(null);
  const pausedRef = useRef(paused);

  // Batch pending entries to reduce re-renders
  const pendingEntriesRef = useRef<LogEntry[]>([]);
  const batchTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null);

  // Keep pausedRef in sync
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Flush batched entries
  const flushBatch = useCallback(() => {
    if (pendingEntriesRef.current.length > 0) {
      const newEntries = pendingEntriesRef.current;
      pendingEntriesRef.current = [];
      setEntries((prev) => {
        const updated = [...prev, ...newEntries];
        return updated.length > maxBuffer ? updated.slice(-maxBuffer) : updated;
      });
    }
    batchTimeoutRef.current = null;
  }, [maxBuffer]);

  // Start tailing
  useEffect(() => {
    if (!sandbox.hostName) {
      setError('Sandbox hostname not available');
      setLoading(false);
      return;
    }

    let mounted = true;

    const startTailing = async () => {
      try {
        // Create B2CInstance for WebDAV access
        const instance = new B2CInstance({hostname: sandbox.hostName!}, authConfig);

        // Start tailing
        const result = await tailLogs(instance, {
          prefixes: config.prefixes,
          pollInterval: config.pollInterval ?? 1000,
          lastEntries: 10,
          onEntry(entry) {
            if (!mounted) return;

            // Apply level filter at ingestion (reduces buffer size)
            if (config.levels && config.levels.length > 0 && !matchesLevel(entry, config.levels)) {
              return;
            }
            // Note: search filtering is done on render, not here, so existing entries can be searched

            // Add to pending batch
            pendingEntriesRef.current.push(entry);

            // Schedule batch flush if not already scheduled
            if (!batchTimeoutRef.current) {
              batchTimeoutRef.current = setTimeout(flushBatch, BATCH_INTERVAL);
            }
          },
          onError(error_) {
            if (!mounted) return;
            setError(error_.message);
          },
        });

        if (mounted) {
          tailResultRef.current = result;
          setLoading(false);
        } else {
          // Component unmounted before we finished, clean up
          await result.stop();
        }
      } catch (error_) {
        if (mounted) {
          setError(error_ instanceof Error ? error_.message : 'Failed to start tailing');
          setLoading(false);
        }
      }
    };

    startTailing();

    // Cleanup on unmount or config change
    return () => {
      mounted = false;
      if (tailResultRef.current) {
        tailResultRef.current.stop();
        tailResultRef.current = null;
      }
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = null;
      }
      pendingEntriesRef.current = [];
    };
  }, [sandbox.hostName, config.prefixes.join(','), config.pollInterval, authConfig, maxBuffer, flushBatch]);

  // Re-filter entries when level/search filters change
  useEffect(() => {
    // The filtering happens in onEntry callback, but we need to re-filter
    // existing entries when filters change. For simplicity, we just clear
    // and let new entries come through with new filters.
    // In a production app, you might want to keep unfiltered entries
    // and filter on render.
  }, [config.levels, config.search]);

  const pause = useCallback(() => {
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    setPaused(false);
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
  }, []);

  return {
    entries,
    loading,
    error,
    paused,
    pause,
    resume,
    clear,
  };
}
