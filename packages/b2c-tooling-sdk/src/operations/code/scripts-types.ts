/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Canonical types and backend interface for code-version (Scripts) operations.
 *
 * The OCAPI Data API and the SCAPI Scripts API both manage code versions on a
 * B2C instance. We expose a single canonical shape here so command code is
 * agnostic to which backend serves the request.
 *
 * @module operations/code/scripts-types
 */
import type {BackendBase} from '../../clients/scapi-backend-utils.js';

/**
 * Canonical code version. CamelCase fields match SCAPI; OCAPI mapping
 * converts from snake_case.
 */
export interface CodeVersionInfo {
  id: string;
  active?: boolean;
  cartridges?: string[];
  compatibilityMode?: string;
  activationTime?: string;
  lastModificationTime?: string;
  rollback?: boolean;
  totalSize?: number;
  webDavUrl?: string;
  /** Original backend response, for advanced consumers. */
  _raw?: unknown;
}

/**
 * Backend contract for code-version operations.
 *
 * Reload is implemented as a backend-agnostic helper (`reloadCodeVersion`
 * in the operations module) since it's just `activate(alternate) +
 * activate(target)` on top of these primitives.
 */
export interface ScriptsBackend extends BackendBase {
  listCodeVersions(): Promise<CodeVersionInfo[]>;
  getActiveCodeVersion(): Promise<CodeVersionInfo | undefined>;
  activateCodeVersion(codeVersionId: string): Promise<void>;
  deleteCodeVersion(codeVersionId: string): Promise<void>;
  createCodeVersion(codeVersionId: string): Promise<void>;
}
