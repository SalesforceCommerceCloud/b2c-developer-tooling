/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Safety module for preventing destructive operations.
 *
 * @module safety
 */

export type {SafetyLevel, SafetyConfig} from './safety-middleware.js';
export {SafetyBlockedError, checkSafetyViolation, getSafetyLevel, describeSafetyLevel} from './safety-middleware.js';
