/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {useCallback, useEffect, useState} from 'react';
import type {OdsClient, OdsComponents} from '@salesforce/b2c-tooling-sdk';

type SandboxModel = OdsComponents['schemas']['SandboxModel'];

interface UseSandboxesResult {
  error: null | string;
  lastUpdated: Date | null;
  loading: boolean;
  refresh: () => void;
  sandboxes: SandboxModel[];
}

const POLL_INTERVAL = 10_000; // 10 seconds

/**
 * Hook to fetch and poll sandbox data.
 * Provides automatic polling every 10 seconds with manual refresh capability.
 */
export function useSandboxes(odsClient: OdsClient, filterParams?: string): UseSandboxesResult {
  const [sandboxes, setSandboxes] = useState<SandboxModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSandboxes = useCallback(async () => {
    try {
      const result = await odsClient.GET('/sandboxes', {
        params: {
          query: {
            filter_params: filterParams,
          },
        },
      });

      if (result.error) {
        setError(`Failed to fetch sandboxes: ${result.response?.statusText ?? 'Unknown error'}`);
        return;
      }

      setSandboxes(result.data?.data ?? []);
      setError(null);
      setLastUpdated(new Date());
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [odsClient, filterParams]);

  // Initial fetch
  useEffect(() => {
    fetchSandboxes();
  }, [fetchSandboxes]);

  // Polling
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSandboxes();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchSandboxes]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchSandboxes();
  }, [fetchSandboxes]);

  return {
    error,
    lastUpdated,
    loading,
    refresh,
    sandboxes,
  };
}
