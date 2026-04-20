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

// Types
export type {SafetyAction, SafetyRule, SafetyOperation, SafetyEvaluation} from './types.js';
export {isValidSafetyAction, VALID_SAFETY_ACTIONS} from './types.js';

// Core safety config and levels
export type {SafetyLevel, SafetyConfig, SafetyConfigFragment} from './safety-middleware.js';
export {
  SafetyBlockedError,
  SafetyConfirmationRequired,
  checkSafetyViolation,
  checkLevelViolation,
  getSafetyLevel,
  describeSafetyLevel,
  maxSafetyLevel,
  isValidSafetyLevel,
  parseSafetyLevelString,
  resolveEffectiveSafetyConfig,
  loadGlobalSafetyConfig,
} from './safety-middleware.js';

// SafetyGuard
export {SafetyGuard, extractJobIdFromPath} from './safety-guard.js';

// Confirmation utility
export type {ConfirmHandler} from './with-confirmation.js';
export {withSafetyConfirmation} from './with-confirmation.js';
