/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export function stubCommandConfigAndLogger(command: any, sandboxApiHost = 'admin.dx.test.com'): void {
  Object.defineProperty(command, 'config', {
    value: {
      findConfigFile: () => ({
        read: () => ({'sandbox-api-host': sandboxApiHost}),
      }),
    },
    configurable: true,
  });

  Object.defineProperty(command, 'logger', {
    value: {info() {}, debug() {}, warn() {}, error() {}},
    configurable: true,
  });
}

export function stubJsonEnabled(command: any, enabled: boolean): void {
  command.jsonEnabled = () => enabled;
}

export function stubOdsClientGet(command: any, handler: (path: string) => Promise<any>): void {
  Object.defineProperty(command, 'odsClient', {
    value: {
      GET: handler,
    },
    configurable: true,
  });
}

export function stubOdsClient(command: any, client: Partial<{GET: any; POST: any; PUT: any; DELETE: any}>): void {
  Object.defineProperty(command, 'odsClient', {
    value: client,
    configurable: true,
  });
}

export function stubResolvedConfig(command: any, values: Record<string, unknown>): void {
  Object.defineProperty(command, 'resolvedConfig', {
    get: () => ({
      values,
      warnings: [],
      sources: [],
    }),
    configurable: true,
  });
}

export function makeCommandThrowOnError(command: any): void {
  command.error = (msg: string) => {
    throw new Error(msg);
  };
}
