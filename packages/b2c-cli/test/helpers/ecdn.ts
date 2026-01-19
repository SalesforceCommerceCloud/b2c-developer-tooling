/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Stub the CDN Zones client for eCDN commands.
 * This stubs both the read-only and read-write clients.
 */
export function stubEcdnClient(
  command: any,
  client: Partial<{GET: any; POST: any; PUT: any; PATCH: any; DELETE: any}>,
): void {
  Object.defineProperty(command, '_cdnZonesClient', {
    value: client,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(command, '_cdnZonesRwClient', {
    value: client,
    configurable: true,
    writable: true,
  });
}

/**
 * Stub the resolveZoneId method for zone-scoped commands.
 */
export function stubResolveZoneId(command: any, zoneId: string): void {
  command.resolveZoneId = async () => zoneId;
}

/**
 * Stub the command config and logger for testing.
 */
export function stubCommandConfigAndLogger(command: any, shortCode = 'kv7kzm78'): void {
  Object.defineProperty(command, 'resolvedConfig', {
    get: () => ({
      values: {shortCode},
      warnings: [],
      sources: [],
    }),
    configurable: true,
  });

  Object.defineProperty(command, 'logger', {
    value: {info() {}, debug() {}, warn() {}, error() {}},
    configurable: true,
  });

  // Stub log method
  command.log = () => {};
  command.warn = () => {};
}

/**
 * Stub the jsonEnabled method.
 */
export function stubJsonEnabled(command: any, enabled: boolean): void {
  command.jsonEnabled = () => enabled;
}

/**
 * Stub the getOrganizationId method.
 */
export function stubOrganizationId(command: any, orgId = 'f_ecom_zzxy_prd'): void {
  command.getOrganizationId = () => orgId;
}

/**
 * Stub OAuth requirement check to do nothing.
 */
export function stubRequireOAuthCredentials(command: any): void {
  command.requireOAuthCredentials = () => {};
}

/**
 * Make the command throw on error instead of exiting.
 */
export function makeCommandThrowOnError(command: any): void {
  command.error = (msg: string) => {
    throw new Error(msg);
  };
}
