/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Error types for B2C tooling operations.
 *
 * @module errors
 */
export {HTTPError} from './http-error.js';
export {JobExecutionError} from '../operations/jobs/run.js';
export {SafetyBlockedError} from '../safety/safety-middleware.js';
export {MetaDefinitionDetectionError} from '../operations/content/validate.js';
export {SandboxNotFoundError} from '../operations/ods/sandbox-lookup.js';
export {
  SandboxPollingTimeoutError,
  SandboxPollingError,
  SandboxTerminalStateError,
} from '../operations/ods/wait-for-sandbox.js';
export {ClonePollingTimeoutError, ClonePollingError, CloneFailedError} from '../operations/ods/wait-for-clone.js';
