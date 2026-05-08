/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {B2CInstance} from '../../instance/index.js';
import type {ScriptsBackend, CodeVersionInfo} from './scripts-types.js';
import type {CodeVersion as OcapiCodeVersion} from './versions.js';
import {
  listCodeVersions as ocapiListCodeVersions,
  getActiveCodeVersion as ocapiGetActiveCodeVersion,
  activateCodeVersion as ocapiActivateCodeVersion,
  deleteCodeVersion as ocapiDeleteCodeVersion,
  createCodeVersion as ocapiCreateCodeVersion,
  reloadCodeVersion as ocapiReloadCodeVersion,
} from './versions.js';

function mapOcapiCodeVersion(ocapi: OcapiCodeVersion): CodeVersionInfo {
  return {
    id: ocapi.id ?? '',
    active: ocapi.active,
    cartridges: ocapi.cartridges,
    compatibilityMode: ocapi.compatibility_mode,
    activationTime: ocapi.activation_time,
    lastModificationTime: ocapi.last_modification_time,
    rollback: ocapi.rollback,
    totalSize: ocapi.total_size,
    webDavUrl: ocapi.web_dav_url,
    _raw: ocapi,
  };
}

export class OcapiScriptsBackend implements ScriptsBackend {
  readonly name = 'ocapi' as const;

  constructor(private instance: B2CInstance) {}

  async listCodeVersions(): Promise<CodeVersionInfo[]> {
    const versions = await ocapiListCodeVersions(this.instance);
    return versions.map(mapOcapiCodeVersion);
  }

  async getActiveCodeVersion(): Promise<CodeVersionInfo | undefined> {
    const active = await ocapiGetActiveCodeVersion(this.instance);
    return active ? mapOcapiCodeVersion(active) : undefined;
  }

  async activateCodeVersion(codeVersionId: string): Promise<void> {
    await ocapiActivateCodeVersion(this.instance, codeVersionId);
  }

  async deleteCodeVersion(codeVersionId: string): Promise<void> {
    await ocapiDeleteCodeVersion(this.instance, codeVersionId);
  }

  async createCodeVersion(codeVersionId: string): Promise<void> {
    await ocapiCreateCodeVersion(this.instance, codeVersionId);
  }

  async reloadCodeVersion(codeVersionId?: string): Promise<void> {
    await ocapiReloadCodeVersion(this.instance, codeVersionId);
  }
}
