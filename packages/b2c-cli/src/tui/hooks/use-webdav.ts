/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {useCallback, useEffect, useState} from 'react';
import {B2CInstance, type AuthConfig} from '@salesforce/b2c-tooling-sdk';
import type {PropfindEntry} from '@salesforce/b2c-tooling-sdk/clients';

interface UseWebDavResult {
  entries: PropfindEntry[];
  error: null | string;
  fileContent: null | string;
  loading: boolean;
  listDirectory: (path: string) => void;
  readFile: (path: string) => void;
}

/**
 * Hook for WebDAV operations on a B2C instance.
 * Creates a B2CInstance with the given hostname and auth config.
 */
export function useWebDav(hostname: string | undefined, authConfig: AuthConfig): UseWebDavResult {
  const [entries, setEntries] = useState<PropfindEntry[]>([]);
  const [fileContent, setFileContent] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [instance, setInstance] = useState<B2CInstance | null>(null);

  // Create B2CInstance when hostname changes
  useEffect(() => {
    if (hostname) {
      const newInstance = new B2CInstance({hostname}, authConfig);
      setInstance(newInstance);
    } else {
      setInstance(null);
    }
  }, [hostname, authConfig]);

  const listDirectory = useCallback(
    (path: string) => {
      if (!instance) {
        setError('No instance configured');
        return;
      }

      setLoading(true);
      setError(null);
      setFileContent(null);

      instance.webdav
        .propfind(path, '1')
        .then((result) => {
          // Filter out the parent directory itself (first entry is usually the queried path)
          const filtered = result.filter((entry) => {
            const entryPath = decodeURIComponent(entry.href);
            const normalizedPath = path.replace(/\/$/, '');
            return !entryPath.endsWith(`/${normalizedPath}`) && !entryPath.endsWith(`/${normalizedPath}/`);
          });
          setEntries(filtered);
          setError(null);
        })
        .catch((error_: unknown) => {
          setError(error_ instanceof Error ? error_.message : 'Failed to list directory');
          setEntries([]);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [instance],
  );

  const readFile = useCallback(
    (path: string) => {
      if (!instance) {
        setError('No instance configured');
        return;
      }

      setLoading(true);
      setError(null);

      instance.webdav
        .get(path)
        .then((buffer) => {
          // Convert ArrayBuffer to string
          const decoder = new TextDecoder('utf8');
          const text = decoder.decode(buffer);
          setFileContent(text);
          setError(null);
        })
        .catch((error_: unknown) => {
          setError(error_ instanceof Error ? error_.message : 'Failed to read file');
          setFileContent(null);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [instance],
  );

  return {
    entries,
    error,
    fileContent,
    listDirectory,
    loading,
    readFile,
  };
}
