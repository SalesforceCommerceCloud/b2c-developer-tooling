/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {Config} from '@oclif/core';
import {captureOutput} from '@oclif/test';
import sinon from 'sinon';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from './stub-parse.js';

/**
 * Run a command silently, capturing stdout/stderr.
 * Use this when you don't need to verify console output.
 *
 * @example
 * const result = await runSilent(() => command.run());
 */
export async function runSilent<T>(fn: () => Promise<T>): Promise<T> {
  const {result, error} = await captureOutput(fn);
  if (error) throw error;
  return result as T;
}

export function createIsolatedEnvHooks(): {
  beforeEach: () => void;
  afterEach: () => void;
} {
  return {
    beforeEach() {
      isolateConfig();
    },
    afterEach() {
      sinon.restore();
      restoreConfig();
    },
  };
}

export function createIsolatedConfigHooks(): {
  beforeEach: () => Promise<void>;
  afterEach: () => void;
  getConfig: () => Config;
} {
  let config: Config;

  return {
    async beforeEach() {
      isolateConfig();
      const {Config} = await import('@oclif/core');
      config = await Config.load();
    },
    afterEach() {
      sinon.restore();
      restoreConfig();
    },
    getConfig: () => config,
  };
}

export async function createTestCommand<T extends {init: () => Promise<void>}>(
  CommandClass: new (argv: string[], config: Config) => T,
  config: Config,
  flags: Record<string, unknown> = {},
  args: Record<string, unknown> = {},
): Promise<T> {
  const command: any = new CommandClass([], config);
  stubParse(command, flags, args);
  await command.init();
  return command as T;
}

/**
 * Stubs command config and logger for testing.
 * @param command - The command instance to stub
 * @param accountManagerHost - Account Manager hostname (default: 'account.test.demandware.com')
 */
export function stubCommandConfigAndLogger(command: any, accountManagerHost = 'account.test.demandware.com'): void {
  Object.defineProperty(command, 'config', {
    value: {
      findConfigFile: () => ({
        read: () => ({}),
      }),
    },
    configurable: true,
  });

  Object.defineProperty(command, 'logger', {
    value: {info() {}, debug() {}, warn() {}, error() {}},
    configurable: true,
  });

  Object.defineProperty(command, 'resolvedConfig', {
    value: {
      values: {
        accountManagerHost,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      },
      hasOAuthConfig() {
        return Boolean(this.values.clientId);
      },
    },
    configurable: true,
  });
}

/**
 * Stubs the JSON enabled flag for a command.
 * @param command - The command instance to stub
 * @param enabled - Whether JSON mode is enabled
 */
export function stubJsonEnabled(command: any, enabled: boolean): void {
  command.jsonEnabled = () => enabled;
}

/**
 * Stubs a client property on a command.
 * @param command - The command instance to stub
 * @param propertyName - The name of the client property (e.g., 'accountManagerClient', 'accountManagerRolesClient', 'accountManagerOrgsClient')
 * @param client - The client instance to stub
 */
export function stubClient(command: any, propertyName: string, client: any): void {
  Object.defineProperty(command, propertyName, {
    get: () => client,
    configurable: true,
  });
}

/**
 * Makes a command throw on error instead of using oclif's error handling.
 * @param command - The command instance to modify
 */
export function makeCommandThrowOnError(command: any): void {
  command.error = (msg: string) => {
    throw new Error(msg);
  };
}
