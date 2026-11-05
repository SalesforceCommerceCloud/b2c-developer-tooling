/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Workspace project type detected at activation (`b2c-dx.isStorefrontNext`
 * context key), readable by features that behave differently per project.
 */
let storefrontNext = false;

export function setStorefrontNextWorkspace(value: boolean): void {
  storefrontNext = value;
}

export function isStorefrontNextWorkspace(): boolean {
  return storefrontNext;
}
