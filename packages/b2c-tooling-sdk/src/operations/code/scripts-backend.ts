/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {ScriptsBackend} from './scripts-types.js';
import {OcapiScriptsBackend} from './ocapi-scripts-backend.js';
import {ScapiScriptsBackend} from './scapi-scripts-backend.js';
import {createDualBackend, type DualBackendConfig} from '../../clients/dual-backend-factory.js';

export type ScriptsBackendConfig = DualBackendConfig;

export function createScriptsBackend(config: ScriptsBackendConfig): ScriptsBackend {
  return createDualBackend<ScriptsBackend>(config, {
    domainName: 'Scripts',
    Scapi: ScapiScriptsBackend,
    Ocapi: OcapiScriptsBackend,
  });
}

/**
 * Reloads (re-activates) a code version using a toggle-activate technique.
 *
 * Activates an alternate version, then re-activates the target. This forces
 * the instance to reload the code (rebuild caches, re-register custom APIs,
 * etc.). Works on top of any `ScriptsBackend` since it only uses
 * list+activate primitives.
 *
 * @param backend - Scripts backend (OCAPI, SCAPI, or fallback)
 * @param codeVersionId - Code version to reload (defaults to current active)
 * @throws Error if no alternate code version is available for toggling
 */
export async function reloadCodeVersion(backend: ScriptsBackend, codeVersionId?: string): Promise<void> {
  const versions = await backend.listCodeVersions();
  const activeVersion = versions.find((v) => v.active);
  const targetVersion = codeVersionId ?? activeVersion?.id;

  if (!targetVersion) {
    throw new Error('No code version specified and no active version found');
  }

  // If the target is already active, toggle through an alternate first.
  if (activeVersion?.id === targetVersion) {
    const alternateVersion = versions.find((v) => v.id !== targetVersion);
    if (!alternateVersion) {
      throw new Error('Cannot reload: no alternate code version available for toggle');
    }
    await backend.activateCodeVersion(alternateVersion.id);
  }

  await backend.activateCodeVersion(targetVersion);
}
