/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {useCallback, useState} from 'react';
import type {OdsClient} from '@salesforce/b2c-tooling-sdk';
import type {SandboxModel} from '../types.js';

type SandboxOperation = 'restart' | 'start' | 'stop';

interface UseSandboxActionsResult {
  deleteSandbox: (sandbox: SandboxModel) => Promise<boolean>;
  error: null | string;
  executing: boolean;
  executeSandboxOperation: (sandbox: SandboxModel, operation: SandboxOperation) => Promise<boolean>;
  lastOperation: null | string;
}

/**
 * Hook to execute sandbox actions (start, stop, restart, delete).
 */
export function useSandboxActions(odsClient: OdsClient): UseSandboxActionsResult {
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [lastOperation, setLastOperation] = useState<null | string>(null);

  const executeSandboxOperation = useCallback(
    async (sandbox: SandboxModel, operation: SandboxOperation): Promise<boolean> => {
      if (!sandbox.id) {
        setError('Sandbox ID is required');
        return false;
      }

      setExecuting(true);
      setError(null);
      setLastOperation(operation);

      try {
        const result = await odsClient.POST('/sandboxes/{sandboxId}/operations', {
          body: {
            operation,
          },
          params: {
            path: {
              sandboxId: sandbox.id,
            },
          },
        });

        if (result.error) {
          setError(`Failed to ${operation} sandbox: ${result.response?.statusText ?? 'Unknown error'}`);
          return false;
        }

        return true;
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Unknown error');
        return false;
      } finally {
        setExecuting(false);
      }
    },
    [odsClient],
  );

  const deleteSandbox = useCallback(
    async (sandbox: SandboxModel): Promise<boolean> => {
      if (!sandbox.id) {
        setError('Sandbox ID is required');
        return false;
      }

      setExecuting(true);
      setError(null);
      setLastOperation('delete');

      try {
        const result = await odsClient.DELETE('/sandboxes/{sandboxId}', {
          params: {
            path: {
              sandboxId: sandbox.id,
            },
          },
        });

        if (result.error) {
          setError(`Failed to delete sandbox: ${result.response?.statusText ?? 'Unknown error'}`);
          return false;
        }

        return true;
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Unknown error');
        return false;
      } finally {
        setExecuting(false);
      }
    },
    [odsClient],
  );

  return {
    deleteSandbox,
    error,
    executing,
    executeSandboxOperation,
    lastOperation,
  };
}
