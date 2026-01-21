/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

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

export function stubJsonEnabled(command: any, enabled: boolean): void {
  command.jsonEnabled = () => enabled;
}

export function stubAccountManagerRolesClient(command: any, client: any): void {
  Object.defineProperty(command, 'accountManagerRolesClient', {
    get: () => client,
    configurable: true,
  });
}

export function stubAccountManagerClient(command: any, client: any): void {
  Object.defineProperty(command, 'accountManagerClient', {
    get: () => client,
    configurable: true,
  });
}

export function makeCommandThrowOnError(command: any): void {
  command.error = (msg: string) => {
    throw new Error(msg);
  };
}
