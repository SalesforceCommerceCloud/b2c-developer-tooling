/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Script operations for B2C Commerce.
 *
 * This module provides functions for evaluating Script API expressions
 * on B2C Commerce instances using the SDAPI debugger.
 *
 * ## Functions
 *
 * - {@link evaluateScript} - Evaluate a Script API expression
 * - {@link wrapExpression} - Wrap multi-statement code for SDAPI eval
 * - {@link createSdapiClient} - Create an SDAPI client from a B2C instance
 *
 * ## Usage
 *
 * ```typescript
 * import { evaluateScript } from '@salesforce/b2c-tooling-sdk/operations/script';
 *
 * const result = await evaluateScript(instance, 'dw.system.Site.getCurrent().getName()');
 * if (result.success) {
 *   console.log('Result:', result.result);
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 *
 * ## Authentication
 *
 * Script evaluation requires Basic auth credentials (username/password) for SDAPI,
 * and OAuth credentials for OCAPI (site operations).
 *
 * @module operations/script
 */

// Eval operations
export {evaluateScript, wrapExpression, createSdapiClient} from './eval.js';
export type {EvaluateScriptOptions, EvaluateScriptResult} from './eval.js';

// Controller operations (for advanced use)
export {
  BREAKPOINT_LINE,
  EVAL_CARTRIDGE_NAME,
  BREAKPOINT_CONTROLLER_CONTENT,
  cartridgeExists,
  controllerExists,
  backupController,
  restoreController,
  deleteController,
  createCartridgeStructure,
  deleteCartridge,
  injectController,
  createCartridgeWithController,
  cleanupInjectedController,
  findExistingCartridge,
  findCartridgeWithDefaultController,
} from './controller.js';
export type {ControllerBackup, InjectedController} from './controller.js';
