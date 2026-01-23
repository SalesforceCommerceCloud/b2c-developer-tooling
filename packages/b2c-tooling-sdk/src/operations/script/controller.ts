/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Controller injection operations for script evaluation.
 *
 * This module provides functions for injecting and cleaning up temporary
 * controllers used as breakpoint targets for SDAPI script evaluation.
 *
 * @module operations/script/controller
 */
import type {B2CInstance} from '../../instance/index.js';
import {getLogger} from '../../logging/logger.js';
import {HTTPError} from '../../errors/http-error.js';

/**
 * Line number where the breakpoint should be set in the injected controller.
 * This corresponds to the `var context = {};` line.
 */
export const BREAKPOINT_LINE = 8;

/**
 * Name of the temporary cartridge created for eval operations.
 */
export const EVAL_CARTRIDGE_NAME = 'b2c_cli_eval';

/**
 * The breakpoint target controller content.
 * SDAPI sets a breakpoint on line 9 (the context variable line).
 */
export const BREAKPOINT_CONTROLLER_CONTENT = `'use strict';
/**
 * Breakpoint target for b2c script eval command.
 * SDAPI sets a breakpoint on the marked line, then evaluates expressions via debugger.
 * AUTO-GENERATED - DO NOT MODIFY
 */
exports.Start = function() {
    var context = {}; // BREAKPOINT_LINE - debugger breaks here
    // Context object can be populated with useful data if needed
    response.setContentType('application/json');
    response.writer.print(JSON.stringify({status: 'ok', context: context}));
};
exports.Start.public = true;
`;

/**
 * Result of backup operation for a controller file.
 */
export interface ControllerBackup {
  /** Path to the backed up file in WebDAV */
  path: string;
  /** Original content of the file */
  content: ArrayBuffer;
  /** Whether this was an existing file (vs new file) */
  existed: boolean;
}

/**
 * Information about the injected controller location.
 */
export interface InjectedController {
  /** Cartridge name where the controller was injected */
  cartridge: string;
  /** Full WebDAV path to the controller file */
  webdavPath: string;
  /** Script path for SDAPI breakpoint (e.g., "controllers/Default.js") */
  scriptPath: string;
  /** Backup of the original file, if any */
  backup?: ControllerBackup;
  /** Whether a new cartridge was created */
  createdCartridge: boolean;
  /** Whether the cartridge was added to site path */
  addedToPath: boolean;
}

/**
 * Checks if a cartridge exists in the code version.
 *
 * @param instance - B2C instance
 * @param codeVersion - Code version to check
 * @param cartridgeName - Name of the cartridge
 * @returns true if cartridge exists
 */
export async function cartridgeExists(
  instance: B2CInstance,
  codeVersion: string,
  cartridgeName: string,
): Promise<boolean> {
  const webdav = instance.webdav;
  const cartridgePath = `Cartridges/${codeVersion}/${cartridgeName}`;
  return webdav.exists(cartridgePath);
}

/**
 * Checks if a controller file exists in a cartridge.
 *
 * @param instance - B2C instance
 * @param codeVersion - Code version
 * @param cartridgeName - Cartridge name
 * @param controllerName - Controller name (without .js extension)
 * @returns true if controller exists
 */
export async function controllerExists(
  instance: B2CInstance,
  codeVersion: string,
  cartridgeName: string,
  controllerName: string = 'Default',
): Promise<boolean> {
  const webdav = instance.webdav;
  const controllerPath = `Cartridges/${codeVersion}/${cartridgeName}/cartridge/controllers/${controllerName}.js`;
  return webdav.exists(controllerPath);
}

/**
 * Backs up a controller file.
 *
 * @param instance - B2C instance
 * @param codeVersion - Code version
 * @param cartridgeName - Cartridge name
 * @param controllerName - Controller name
 * @returns Backup information, or undefined if file doesn't exist
 */
export async function backupController(
  instance: B2CInstance,
  codeVersion: string,
  cartridgeName: string,
  controllerName: string = 'Default',
): Promise<ControllerBackup | undefined> {
  const logger = getLogger();
  const webdav = instance.webdav;
  const controllerPath = `Cartridges/${codeVersion}/${cartridgeName}/cartridge/controllers/${controllerName}.js`;

  const exists = await webdav.exists(controllerPath);
  if (!exists) {
    logger.debug({controllerPath}, 'Controller does not exist, no backup needed');
    return undefined;
  }

  logger.debug({controllerPath}, 'Backing up controller');
  const content = await webdav.get(controllerPath);

  return {
    path: controllerPath,
    content,
    existed: true,
  };
}

/**
 * Restores a controller from backup.
 *
 * @param instance - B2C instance
 * @param backup - Backup to restore
 */
export async function restoreController(instance: B2CInstance, backup: ControllerBackup): Promise<void> {
  const logger = getLogger();
  const webdav = instance.webdav;

  logger.debug({path: backup.path}, 'Restoring controller from backup');
  await webdav.put(backup.path, Buffer.from(backup.content), 'application/javascript');
  logger.debug({path: backup.path}, 'Controller restored');
}

/**
 * Deletes a controller file.
 *
 * @param instance - B2C instance
 * @param codeVersion - Code version
 * @param cartridgeName - Cartridge name
 * @param controllerName - Controller name
 */
export async function deleteController(
  instance: B2CInstance,
  codeVersion: string,
  cartridgeName: string,
  controllerName: string = 'Default',
): Promise<void> {
  const logger = getLogger();
  const webdav = instance.webdav;
  const controllerPath = `Cartridges/${codeVersion}/${cartridgeName}/cartridge/controllers/${controllerName}.js`;

  logger.debug({controllerPath}, 'Deleting controller');
  try {
    await webdav.delete(controllerPath);
    logger.debug({controllerPath}, 'Controller deleted');
  } catch (err) {
    if (err instanceof HTTPError && err.response.status === 404) {
      logger.debug({controllerPath}, 'Controller already deleted');
    } else {
      throw err;
    }
  }
}

/**
 * Creates the cartridge directory structure for a new cartridge.
 *
 * @param instance - B2C instance
 * @param codeVersion - Code version
 * @param cartridgeName - Cartridge name
 */
export async function createCartridgeStructure(
  instance: B2CInstance,
  codeVersion: string,
  cartridgeName: string,
): Promise<void> {
  const logger = getLogger();
  const webdav = instance.webdav;

  const basePath = `Cartridges/${codeVersion}/${cartridgeName}`;
  logger.debug({basePath}, 'Creating cartridge structure');

  // Create directory hierarchy
  await webdav.mkcol(`Cartridges/${codeVersion}`);
  await webdav.mkcol(basePath);
  await webdav.mkcol(`${basePath}/cartridge`);
  await webdav.mkcol(`${basePath}/cartridge/controllers`);

  logger.debug({basePath}, 'Cartridge structure created');
}

/**
 * Deletes a cartridge and all its contents.
 *
 * @param instance - B2C instance
 * @param codeVersion - Code version
 * @param cartridgeName - Cartridge name
 */
export async function deleteCartridge(
  instance: B2CInstance,
  codeVersion: string,
  cartridgeName: string,
): Promise<void> {
  const logger = getLogger();
  const webdav = instance.webdav;
  const cartridgePath = `Cartridges/${codeVersion}/${cartridgeName}`;

  logger.debug({cartridgePath}, 'Deleting cartridge');
  try {
    await webdav.delete(cartridgePath);
    logger.debug({cartridgePath}, 'Cartridge deleted');
  } catch (err) {
    if (err instanceof HTTPError && err.response.status === 404) {
      logger.debug({cartridgePath}, 'Cartridge already deleted');
    } else {
      throw err;
    }
  }
}

/**
 * Injects the breakpoint target controller into a cartridge.
 *
 * @param instance - B2C instance
 * @param codeVersion - Code version
 * @param cartridgeName - Cartridge name to inject into
 * @param controllerName - Controller name (default: Default)
 * @returns Information about the injected controller
 */
export async function injectController(
  instance: B2CInstance,
  codeVersion: string,
  cartridgeName: string,
  controllerName: string = 'Default',
): Promise<InjectedController> {
  const logger = getLogger();
  const webdav = instance.webdav;
  const controllerPath = `Cartridges/${codeVersion}/${cartridgeName}/cartridge/controllers/${controllerName}.js`;
  // SDAPI expects path with leading slash: /cartridge_name/cartridge/controllers/Controller.js
  const scriptPath = `/${cartridgeName}/cartridge/controllers/${controllerName}.js`;

  logger.debug({controllerPath}, 'Injecting breakpoint controller');

  // Backup existing controller if present
  const backup = await backupController(instance, codeVersion, cartridgeName, controllerName);

  // Write the breakpoint controller
  await webdav.put(controllerPath, BREAKPOINT_CONTROLLER_CONTENT, 'application/javascript');
  logger.debug({controllerPath}, 'Breakpoint controller injected');

  return {
    cartridge: cartridgeName,
    webdavPath: controllerPath,
    scriptPath,
    backup,
    createdCartridge: false,
    addedToPath: false,
  };
}

/**
 * Creates a new cartridge and injects the breakpoint controller.
 *
 * @param instance - B2C instance
 * @param codeVersion - Code version
 * @param cartridgeName - Cartridge name to create
 * @returns Information about the injected controller
 */
export async function createCartridgeWithController(
  instance: B2CInstance,
  codeVersion: string,
  cartridgeName: string = EVAL_CARTRIDGE_NAME,
): Promise<InjectedController> {
  const logger = getLogger();

  logger.debug({cartridgeName}, 'Creating cartridge with breakpoint controller');

  // Create cartridge structure
  await createCartridgeStructure(instance, codeVersion, cartridgeName);

  // Inject controller
  const result = await injectController(instance, codeVersion, cartridgeName);
  result.createdCartridge = true;

  logger.debug({cartridgeName}, 'Cartridge created with breakpoint controller');
  return result;
}

/**
 * Cleans up an injected controller.
 *
 * This restores the original controller if backed up, or deletes the
 * controller/cartridge if newly created.
 *
 * @param instance - B2C instance
 * @param codeVersion - Code version
 * @param injected - Information about the injected controller
 */
export async function cleanupInjectedController(
  instance: B2CInstance,
  codeVersion: string,
  injected: InjectedController,
): Promise<void> {
  const logger = getLogger();

  logger.debug({cartridge: injected.cartridge, createdCartridge: injected.createdCartridge}, 'Cleaning up controller');

  if (injected.backup) {
    // Restore original controller
    await restoreController(instance, injected.backup);
  } else if (injected.createdCartridge) {
    // Delete the entire cartridge we created
    await deleteCartridge(instance, codeVersion, injected.cartridge);
  } else {
    // Delete just the controller we added (cartridge existed before)
    await deleteController(instance, codeVersion, injected.cartridge, 'Default');
  }

  logger.debug({cartridge: injected.cartridge}, 'Controller cleanup complete');
}

/**
 * Finds the first cartridge in the path that exists in the code version.
 *
 * @param instance - B2C instance
 * @param codeVersion - Code version
 * @param cartridgePath - Array of cartridge names from site config
 * @returns First existing cartridge name, or undefined if none found
 */
export async function findExistingCartridge(
  instance: B2CInstance,
  codeVersion: string,
  cartridgePath: string[],
): Promise<string | undefined> {
  const logger = getLogger();

  for (const cartridge of cartridgePath) {
    const exists = await cartridgeExists(instance, codeVersion, cartridge);
    if (exists) {
      logger.debug({cartridge}, 'Found existing cartridge');
      return cartridge;
    }
  }

  logger.debug('No existing cartridges found in path');
  return undefined;
}

/**
 * Finds a cartridge that has a Default.js controller.
 *
 * @param instance - B2C instance
 * @param codeVersion - Code version
 * @param cartridgePath - Array of cartridge names from site config
 * @returns Cartridge name with Default.js, or undefined if none found
 */
export async function findCartridgeWithDefaultController(
  instance: B2CInstance,
  codeVersion: string,
  cartridgePath: string[],
): Promise<string | undefined> {
  const logger = getLogger();

  for (const cartridge of cartridgePath) {
    const exists = await controllerExists(instance, codeVersion, cartridge, 'Default');
    if (exists) {
      logger.debug({cartridge}, 'Found cartridge with Default.js');
      return cartridge;
    }
  }

  logger.debug('No cartridge with Default.js found in path');
  return undefined;
}
