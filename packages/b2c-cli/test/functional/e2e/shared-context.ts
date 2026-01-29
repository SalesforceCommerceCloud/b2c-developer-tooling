/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Shared context for E2E tests
 *
 * When TEST_USE_SHARED_SANDBOX=true, a single sandbox is created for all E2E tests.
 * This module manages the shared state across all test files.
 */

export interface SharedSandboxContext {
  sandboxId: null | string;
  hostname: null | string;
  tenantId: null | string;
  instanceNum: null | string;
  realm: null | string;
  shortCode: null | string;
}

// Global state shared across all test files
let sharedContext: SharedSandboxContext = {
  sandboxId: null,
  hostname: null,
  tenantId: null,
  instanceNum: null,
  realm: null,
  shortCode: null,
};

/**
 * Get the current shared context
 */
export function getSharedContext(): SharedSandboxContext {
  return sharedContext;
}

/**
 * Set or update the shared context
 */
export function setSharedContext(data: Partial<SharedSandboxContext>): void {
  sharedContext = {...sharedContext, ...data};
}

/**
 * Check if a shared sandbox is available
 */
export function hasSharedSandbox(): boolean {
  return sharedContext.sandboxId !== null && sharedContext.hostname !== null;
}

/**
 * Clear the shared context (used in cleanup)
 */
export function clearSharedContext(): void {
  sharedContext = {
    sandboxId: null,
    hostname: null,
    tenantId: null,
    instanceNum: null,
    realm: null,
    shortCode: null,
  };
}

/**
 * Check if shared sandbox mode is enabled via environment variable
 */
export function isSharedSandboxEnabled(): boolean {
  return process.env.TEST_USE_SHARED_SANDBOX !== 'false';
}
