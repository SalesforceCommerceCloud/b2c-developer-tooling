/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * ODS (On-Demand Sandbox) operations.
 *
 * @module operations/ods
 */

export {
  isUuid,
  isFriendlySandboxId,
  parseFriendlySandboxId,
  resolveSandboxId,
  SandboxNotFoundError,
} from './sandbox-lookup.js';
