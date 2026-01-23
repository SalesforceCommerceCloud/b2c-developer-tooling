/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Script evaluation operations for B2C Commerce.
 *
 * This module provides functions for evaluating Script API expressions
 * on B2C Commerce instances using the SDAPI debugger.
 *
 * @module operations/script/eval
 */
import type {B2CInstance} from '../../instance/index.js';
import {BasicAuthStrategy} from '../../auth/basic.js';
import {SdapiClient, type EvalResult} from '../../clients/sdapi.js';
import {getLogger} from '../../logging/logger.js';
import {getSiteCartridgePath, addCartridgeToSite, removeCartridgeFromSite} from '../sites/cartridges.js';
import {
  BREAKPOINT_LINE,
  EVAL_CARTRIDGE_NAME,
  type InjectedController,
  findCartridgeWithDefaultController,
  findExistingCartridge,
  injectController,
  createCartridgeWithController,
  cleanupInjectedController,
} from './controller.js';

/**
 * Options for evaluating a script expression.
 */
export interface EvaluateScriptOptions {
  /** Site ID to use for controller trigger (default: RefArch) */
  siteId?: string;
  /** Timeout for waiting for breakpoint hit in milliseconds (default: 30000) */
  timeout?: number;
  /** Poll interval for checking thread status in milliseconds (default: 500) */
  pollInterval?: number;
}

/**
 * Result of evaluating a script expression.
 */
export interface EvaluateScriptResult {
  /** Whether the evaluation was successful */
  success: boolean;
  /** The evaluated result (as a string from SDAPI) */
  result?: string;
  /** Error message if evaluation failed */
  error?: string;
}

/**
 * Wraps a multi-statement expression for SDAPI eval.
 *
 * SDAPI eval expects a single expression. Multi-statement code
 * is wrapped in a Function constructor IIFE with auto-return.
 *
 * @param expression - The expression to wrap
 * @returns Wrapped expression suitable for SDAPI eval
 */
export function wrapExpression(expression: string): string {
  const trimmed = expression.trim();

  if (!trimmed) {
    return '';
  }

  // Check if this is multi-statement (contains ; or newlines with content after)
  const hasMultipleStatements =
    trimmed.includes(';') || (trimmed.includes('\n') && trimmed.split('\n').filter((l) => l.trim()).length > 1);

  if (!hasMultipleStatements) {
    // Single expression - send directly
    return trimmed;
  }

  // Multi-statement - wrap in Function constructor
  // We need to add auto-return for the last expression/statement
  let modifiedCode = trimmed;

  // Split by semicolons to find the last statement
  // We need to find the last meaningful statement
  const statements = trimmed
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s);

  if (statements.length > 0) {
    const lastStatement = statements[statements.length - 1];

    // Only add return if the last statement doesn't already have one
    // and isn't a variable declaration
    if (
      !lastStatement.startsWith('return ') &&
      !lastStatement.startsWith('var ') &&
      !lastStatement.startsWith('let ') &&
      !lastStatement.startsWith('const ')
    ) {
      // Find where the last statement starts in the original code
      // We need to handle both with and without trailing semicolon
      const lastSemicolonIndex = trimmed.lastIndexOf(';');
      const afterLastSemicolon = trimmed.substring(lastSemicolonIndex + 1).trim();

      if (afterLastSemicolon && afterLastSemicolon === lastStatement) {
        // Last statement is after the last semicolon (no trailing semicolon)
        modifiedCode = trimmed.substring(0, lastSemicolonIndex + 1) + ' return ' + lastStatement + ';';
      } else {
        // Last statement ends with semicolon, need to find and replace it
        // Find the position of the last statement in the original string
        const beforeLast = statements.slice(0, -1).join('; ') + (statements.length > 1 ? '; ' : '');
        modifiedCode = beforeLast + 'return ' + lastStatement + ';';
      }
    }
  }

  // Escape quotes and newlines for the Function constructor
  const escaped = modifiedCode.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');

  return `(new Function('${escaped}'))()`;
}

/**
 * Creates an SDAPI client for the given instance.
 *
 * Requires Basic auth credentials to be configured on the instance.
 *
 * @param instance - B2C instance
 * @returns SDAPI client
 * @throws Error if Basic auth credentials are not configured
 */
export function createSdapiClient(instance: B2CInstance): SdapiClient {
  if (!instance.auth.basic) {
    throw new Error('Basic auth credentials (username/password) required for SDAPI operations');
  }

  const auth = new BasicAuthStrategy(instance.auth.basic.username, instance.auth.basic.password);
  return new SdapiClient(instance.config.hostname, auth);
}

/**
 * Triggers the breakpoint controller by making an HTTP request.
 *
 * @param instance - B2C instance
 * @param siteId - Site ID
 * @param controllerName - Controller name (default: Default)
 * @returns Response from the controller
 */
async function triggerController(
  instance: B2CInstance,
  siteId: string,
  controllerName: string = 'Default',
): Promise<Response> {
  const logger = getLogger();
  const url = `https://${instance.config.hostname}/on/demandware.store/Sites-${siteId}-Site/default/${controllerName}-Start`;

  logger.debug({url}, 'Triggering controller');

  // Use simple fetch - we don't need auth for storefront requests
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'b2c-cli/script-eval',
    },
  });

  logger.debug({url, status: response.status}, 'Controller triggered');
  return response;
}

/**
 * Waits for a thread to be halted at a breakpoint.
 *
 * @param sdapi - SDAPI client
 * @param timeout - Timeout in milliseconds
 * @param pollInterval - Poll interval in milliseconds
 * @returns Halted thread ID, or undefined if timeout
 */
async function waitForHaltedThread(
  sdapi: SdapiClient,
  timeout: number,
  pollInterval: number,
): Promise<number | undefined> {
  const logger = getLogger();
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const threads = await sdapi.getThreads();
    const halted = threads.find((t) => t.status === 'halted');

    if (halted) {
      logger.debug({threadId: halted.id}, 'Found halted thread');
      return halted.id;
    }

    logger.debug({elapsed: Date.now() - startTime}, 'No halted thread yet, polling...');
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  logger.debug({timeout}, 'Timeout waiting for halted thread');
  return undefined;
}

/**
 * Evaluates a Script API expression on a B2C Commerce instance.
 *
 * This function orchestrates the full evaluation workflow:
 * 1. Gets site's cartridge path (proactive, warns if fails)
 * 2. Finds or creates a suitable cartridge for the breakpoint controller
 * 3. Injects the breakpoint target controller
 * 4. Enables SDAPI debugger and sets breakpoint
 * 5. Triggers the controller via HTTP request
 * 6. Waits for thread to hit breakpoint
 * 7. Evaluates the expression via SDAPI
 * 8. Resumes thread and cleans up
 *
 * @param instance - B2C instance with Basic auth credentials
 * @param expression - Script API expression to evaluate
 * @param options - Evaluation options
 * @returns Evaluation result
 *
 * @example
 * ```typescript
 * // Simple expression
 * const result = await evaluateScript(instance, 'dw.system.Site.getCurrent().getName()');
 *
 * // Multi-statement code
 * const result = await evaluateScript(instance, `
 *   var site = dw.system.Site.getCurrent();
 *   site.getName() + ' - ' + site.ID;
 * `);
 * ```
 */
export async function evaluateScript(
  instance: B2CInstance,
  expression: string,
  options: EvaluateScriptOptions = {},
): Promise<EvaluateScriptResult> {
  const logger = getLogger();
  const {siteId = 'RefArch', timeout = 30000, pollInterval = 500} = options;

  const codeVersion = instance.config.codeVersion;
  if (!codeVersion) {
    throw new Error('Code version required for script evaluation');
  }

  // Create SDAPI client
  const sdapi = createSdapiClient(instance);

  // Track what we need to clean up
  let injected: InjectedController | undefined;
  let addedToPath = false;

  try {
    // Step 1: Get site cartridge path
    let cartridgePath: string[] = [];
    try {
      cartridgePath = await getSiteCartridgePath(instance, siteId);
      logger.debug({siteId, cartridges: cartridgePath}, 'Got site cartridge path');
    } catch (err) {
      logger.warn({siteId, error: err}, 'Could not get site cartridge path, will create new cartridge');
    }

    // Step 2: Find or create a suitable cartridge using fallback chain
    // Fallback 1: Modify existing Default.js
    let targetCartridge = await findCartridgeWithDefaultController(instance, codeVersion, cartridgePath);

    if (targetCartridge) {
      logger.debug({cartridge: targetCartridge}, 'Found cartridge with Default.js, will modify');
      injected = await injectController(instance, codeVersion, targetCartridge);
    } else {
      // Fallback 2: Add controller to existing cartridge
      targetCartridge = await findExistingCartridge(instance, codeVersion, cartridgePath);

      if (targetCartridge) {
        logger.debug({cartridge: targetCartridge}, 'Found existing cartridge, will add controller');
        injected = await injectController(instance, codeVersion, targetCartridge);
      } else {
        // Fallback 3: Create new cartridge
        logger.debug('No existing cartridge found, creating new cartridge');
        injected = await createCartridgeWithController(instance, codeVersion, EVAL_CARTRIDGE_NAME);

        // Add the new cartridge to site path
        try {
          await addCartridgeToSite(instance, siteId, EVAL_CARTRIDGE_NAME, 'first');
          injected.addedToPath = true;
          addedToPath = true;
          logger.debug({siteId, cartridge: EVAL_CARTRIDGE_NAME}, 'Added cartridge to site path');
        } catch (err) {
          logger.warn({siteId, error: err}, 'Could not add cartridge to site path');
          throw new Error(
            `Could not add cartridge to site path for site ${siteId}. Ensure OCAPI is configured correctly.`,
          );
        }
      }
    }

    // Step 3: Enable SDAPI debugger
    await sdapi.enableDebugger();
    logger.debug('SDAPI debugger enabled');

    // Step 4: Set breakpoint on the injected controller
    const breakpoints = await sdapi.setBreakpoints([
      {
        script_path: injected.scriptPath,
        line_number: BREAKPOINT_LINE,
      },
    ]);
    logger.debug({breakpoints}, 'Breakpoint set');

    // Step 5: Trigger the controller (fire and forget - it will block at breakpoint)
    // We use Promise.race to not wait for the response
    const triggerPromise = triggerController(instance, siteId).catch((err) => {
      // This is expected - the request will hang until we resume the thread
      logger.debug({error: err}, 'Controller trigger returned/failed (expected while halted)');
    });

    // Small delay to let the request get to the server
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Step 6: Wait for thread to hit breakpoint
    const threadId = await waitForHaltedThread(sdapi, timeout, pollInterval);

    if (threadId === undefined) {
      throw new Error(`Timeout waiting for breakpoint to be hit after ${timeout}ms`);
    }

    // Step 7: Evaluate the expression
    const wrappedExpression = wrapExpression(expression);
    logger.debug({originalLength: expression.length, wrappedLength: wrappedExpression.length}, 'Expression prepared');

    const evalResult: EvalResult = await sdapi.evaluate(threadId, 0, wrappedExpression);

    // Step 8: Resume the thread
    await sdapi.resumeThread(threadId);
    logger.debug({threadId}, 'Thread resumed');

    // Wait for trigger to complete (or timeout)
    await Promise.race([triggerPromise, new Promise((resolve) => setTimeout(resolve, 1000))]);

    // Return result
    if (evalResult.error) {
      return {
        success: false,
        error: evalResult.error,
      };
    }

    return {
      success: true,
      result: evalResult.result,
    };
  } finally {
    // Cleanup
    logger.debug('Starting cleanup');

    // DELETE /client is the primary cleanup - it removes all breakpoints,
    // resumes all halted threads, and disables the debugger in one call.
    // Always attempt this regardless of debuggerEnabled state (handles stale sessions).
    try {
      await sdapi.disableDebugger();
      logger.debug('Debugger disabled (breakpoints cleared, threads resumed)');
    } catch (err) {
      logger.debug({error: err}, 'Could not disable debugger (non-fatal)');
    }

    // Remove cartridge from site path if we added it
    if (addedToPath) {
      try {
        await removeCartridgeFromSite(instance, siteId, EVAL_CARTRIDGE_NAME);
        logger.debug({siteId, cartridge: EVAL_CARTRIDGE_NAME}, 'Removed cartridge from site path');
      } catch (err) {
        logger.debug({error: err}, 'Could not remove cartridge from site path (non-fatal)');
      }
    }

    // Restore or delete injected controller
    if (injected) {
      try {
        await cleanupInjectedController(instance, codeVersion, injected);
      } catch (err) {
        logger.debug({error: err}, 'Could not cleanup injected controller (non-fatal)');
      }
    }

    logger.debug('Cleanup complete');
  }
}
