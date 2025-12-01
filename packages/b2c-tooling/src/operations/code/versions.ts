import type {B2CInstance} from '../../instance/index.js';
import {type OcapiComponents} from '../../clients/index.js';
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
  const {data, error} = await instance.ocapi.GET('/code_versions', {});

  if (error) {
    throw new Error('Failed to list code versions', {cause: error});
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

  const {error} = await instance.ocapi.PATCH('/code_versions/{code_version_id}', {
    params: {path: {code_version_id: codeVersionId}},
    body: {active: true},
  });

  if (error) {
    throw new Error('Failed to activate code version', {cause: error});
  }

  logger.debug({codeVersionId}, `Code version ${codeVersionId} activated`);
}

/**
 * Reloads (re-activates) the current code version.
 *
 * This performs a "toggle" activation - first activating a different code version,
 * then re-activating the target version. This forces the instance to reload the code.
 *
 * @param instance - B2C instance
 * @param codeVersionId - Code version to reload (defaults to current active)
 * @throws Error if reload fails or no alternate version is available
 *
 * @example
 * ```typescript
 * // Reload the currently active code version
 * await reloadCodeVersion(instance);
 *
 * // Reload a specific code version
 * await reloadCodeVersion(instance, 'v1');
 * ```
 */
export async function reloadCodeVersion(instance: B2CInstance, codeVersionId?: string): Promise<void> {
  const logger = getLogger();
  const versions = await listCodeVersions(instance);

  const activeVersion = versions.find((v) => v.active);
  const targetVersion = codeVersionId ?? activeVersion?.id;

  if (!targetVersion) {
    throw new Error('No code version specified and no active version found');
  }

  logger.debug({targetVersion}, `Reloading code version ${targetVersion}`);

  // If the target is already active, we need to toggle to another version first
  if (activeVersion?.id === targetVersion) {
    const alternateVersion = versions.find((v) => v.id !== targetVersion);
    if (!alternateVersion) {
      throw new Error('Cannot reload: no alternate code version available for toggle');
    }

    logger.debug({alternateVersion: alternateVersion.id}, `Temporarily activating ${alternateVersion.id}`);
    await activateCodeVersion(instance, alternateVersion.id!);
  }

  // Now activate the target version
  await activateCodeVersion(instance, targetVersion);
  logger.debug({targetVersion}, `Code version ${targetVersion} reloaded`);
}

/**
 * Deletes a code version from an instance.
 *
 * @param instance - B2C instance
 * @param codeVersionId - Code version ID to delete
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

  const {error} = await instance.ocapi.DELETE('/code_versions/{code_version_id}', {
    params: {path: {code_version_id: codeVersionId}},
  });

  if (error) {
    throw new Error('Failed to delete code version', {cause: error});
  }

  logger.debug({codeVersionId}, `Code version ${codeVersionId} deleted`);
}

/**
 * Creates a new code version on an instance.
 *
 * @param instance - B2C instance
 * @param codeVersionId - Code version ID to create
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

  const {error} = await instance.ocapi.PUT('/code_versions/{code_version_id}', {
    params: {path: {code_version_id: codeVersionId}},
  });

  if (error) {
    throw new Error('Failed to create code version', {cause: error});
  }

  logger.debug({codeVersionId}, `Code version ${codeVersionId} created`);
}
