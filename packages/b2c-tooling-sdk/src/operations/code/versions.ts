/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {B2CInstance} from '../../instance/index.js';
import {type OcapiComponents} from '../../clients/index.js';
import {throwOcapiError} from '../../clients/error-utils.js';
import {getLogger} from '../../logging/logger.js';

/** Code version type from OCAPI */
export type CodeVersion = OcapiComponents['schemas']['code_version'];

/** Result of listing code versions */
export type CodeVersionResult = OcapiComponents['schemas']['code_version_result'];

/**
 * Lists all code versions on an instance.
 *
 * @param instance - B2C instance to query
 * @returns Array of code versions
 * @throws Error if the request fails
 *
 * @example
 * ```typescript
 * const versions = await listCodeVersions(instance);
 * for (const v of versions) {
 *   console.log(v.id, v.active ? '(active)' : '');
 * }
 * ```
 */
export async function listCodeVersions(instance: B2CInstance): Promise<CodeVersion[]> {
  const {data, error, response} = await instance.ocapi.GET('/code_versions', {});

  if (error) {
    throwOcapiError(error, response, 'Failed to list code versions');
  }

  return (data as CodeVersionResult).data ?? [];
}

/**
 * Gets the currently active code version.
 *
 * @param instance - B2C instance to query
 * @returns The active code version, or undefined if none is active
 *
 * @example
 * ```typescript
 * const active = await getActiveCodeVersion(instance);
 * if (active) {
 *   console.log(`Active version: ${active.id}`);
 * }
 * ```
 */
export async function getActiveCodeVersion(instance: B2CInstance): Promise<CodeVersion | undefined> {
  const versions = await listCodeVersions(instance);
  return versions.find((v) => v.active);
}

/**
 * Activates a code version on an instance.
 *
 * @param instance - B2C instance
 * @param codeVersionId - Code version ID to activate
 * @returns Promise that resolves when the code version is activated
 * @throws Error if activation fails
 *
 * @example
 * ```typescript
 * await activateCodeVersion(instance, 'v2');
 * console.log('Code version v2 is now active');
 * ```
 */
export async function activateCodeVersion(instance: B2CInstance, codeVersionId: string): Promise<void> {
  const logger = getLogger();
  logger.debug({codeVersionId}, `Activating code version ${codeVersionId}`);

  const {error, response} = await instance.ocapi.PATCH('/code_versions/{code_version_id}', {
    params: {path: {code_version_id: codeVersionId}},
    body: {active: true},
  });

  if (error) {
    throwOcapiError(error, response, 'Failed to activate code version');
  }

  logger.debug({codeVersionId}, `Code version ${codeVersionId} activated`);
}

/**
 * Deletes a code version from an instance.
 *
 * @param instance - B2C instance
 * @param codeVersionId - Code version ID to delete
 * @returns Promise that resolves when the code version is successfully deleted
 * @throws Error if deletion fails (e.g., trying to delete active version)
 *
 * @example
 * ```typescript
 * await deleteCodeVersion(instance, 'old-version');
 * console.log('Code version deleted');
 * ```
 */
export async function deleteCodeVersion(instance: B2CInstance, codeVersionId: string): Promise<void> {
  const logger = getLogger();
  logger.debug({codeVersionId}, `Deleting code version ${codeVersionId}`);

  const {error, response} = await instance.ocapi.DELETE('/code_versions/{code_version_id}', {
    params: {path: {code_version_id: codeVersionId}},
  });

  if (error) {
    throwOcapiError(error, response, 'Failed to delete code version');
  }

  logger.debug({codeVersionId}, `Code version ${codeVersionId} deleted`);
}

/**
 * Creates a new code version on an instance.
 *
 * @param instance - B2C instance
 * @param codeVersionId - Code version ID to create
 * @returns Promise that resolves when the code version is successfully created
 * @throws Error if creation fails
 *
 * @example
 * ```typescript
 * await createCodeVersion(instance, 'v3');
 * console.log('Code version v3 created');
 * ```
 */
export async function createCodeVersion(instance: B2CInstance, codeVersionId: string): Promise<void> {
  const logger = getLogger();
  logger.debug({codeVersionId}, `Creating code version ${codeVersionId}`);

  const {error, response} = await instance.ocapi.PUT('/code_versions/{code_version_id}', {
    params: {path: {code_version_id: codeVersionId}},
  });

  if (error) {
    throwOcapiError(error, response, 'Failed to create code version');
  }

  logger.debug({codeVersionId}, `Code version ${codeVersionId} created`);
}
