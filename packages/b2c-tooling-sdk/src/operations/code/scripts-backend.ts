/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {CodeVersionActivationResult, CodeVersionInfo, ScriptsBackend} from './scripts-types.js';
import {OcapiScriptsBackend} from './ocapi-scripts-backend.js';
import {ScapiScriptsBackend} from './scapi-scripts-backend.js';
import {WebDavScriptsBackend} from './webdav-scripts-backend.js';
import {createDualBackend, type DualBackendConfig} from '../../clients/dual-backend-factory.js';
import {getLogger} from '../../logging/logger.js';

export type ScriptsBackendConfig = DualBackendConfig;

/**
 * API backend whose code-version lookups fall back to WebDAV. An API client
 * can be configured but lack access on the instance (no OCAPI permissions, a
 * client from another tenant, no SCAPI scope) while WebDAV, which code
 * upload and download use anyway, still works. Listing versions and finding
 * the active one fall back; activation, creation, and deletion stay on the API.
 */
export class WebDavLookupFallbackScriptsBackend implements ScriptsBackend {
  private useWebDav = false;

  constructor(
    /** The SCAPI/OCAPI backend; used directly by operations that end in an activation. */
    readonly api: ScriptsBackend,
    private readonly webdav: WebDavScriptsBackend,
  ) {}

  get name(): ScriptsBackend['name'] {
    return this.useWebDav ? this.webdav.name : this.api.name;
  }

  activateCodeVersion(codeVersionId: string): Promise<CodeVersionActivationResult> {
    return this.api.activateCodeVersion(codeVersionId);
  }

  createCodeVersion(codeVersionId: string): Promise<void> {
    return this.api.createCodeVersion(codeVersionId);
  }

  deleteCodeVersion(codeVersionId: string): Promise<void> {
    return this.api.deleteCodeVersion(codeVersionId);
  }

  getActiveCodeVersion(): Promise<CodeVersionInfo | undefined> {
    return this.lookup((backend) => backend.getActiveCodeVersion());
  }

  listCodeVersions(): Promise<CodeVersionInfo[]> {
    return this.lookup((backend) => backend.listCodeVersions());
  }

  private async lookup<R>(fn: (backend: ScriptsBackend) => Promise<R>): Promise<R> {
    if (this.useWebDav) return fn(this.webdav);
    let apiError: unknown;
    try {
      return await fn(this.api);
    } catch (error) {
      apiError = error;
    }
    const apiMessage = apiError instanceof Error ? apiError.message : String(apiError);
    try {
      const result = await fn(this.webdav);
      getLogger().warn(`Read code versions over WebDAV because the API request failed: ${apiMessage.split('\n')[0]}`);
      getLogger().debug({err: apiError}, 'Code-version lookup through the API failed');
      this.useWebDav = true;
      return result;
    } catch (error) {
      const webdavMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`${apiMessage}\nOver WebDAV: ${webdavMessage}`, {cause: apiError});
    }
  }
}

/**
 * Creates the code-version backend for an instance: SCAPI or OCAPI per the
 * `apiBackend` preference, or, without an API client, a WebDAV backend that
 * lists versions and finds the active one but cannot activate. With an API
 * client, lookups fall back to WebDAV when the API refuses them; see
 * {@link WebDavLookupFallbackScriptsBackend}.
 */
export function createScriptsBackend(config: ScriptsBackendConfig): ScriptsBackend {
  const webdav = new WebDavScriptsBackend(config.instance);
  if (!config.instance.hasOAuthCredentials) return webdav;
  const api = createDualBackend<ScriptsBackend>(config, {
    domainName: 'Scripts',
    Scapi: ScapiScriptsBackend,
    Ocapi: OcapiScriptsBackend,
  });
  return new WebDavLookupFallbackScriptsBackend(api, webdav);
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
  // Reload ends in activations, which need the API, so a WebDAV lookup can't help.
  if (backend instanceof WebDavLookupFallbackScriptsBackend) backend = backend.api;
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
