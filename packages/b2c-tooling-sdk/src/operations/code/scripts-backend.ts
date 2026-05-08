/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {B2CInstance} from '../../instance/index.js';
import type {AuthStrategy} from '../../auth/types.js';
import type {ScriptsBackend, CodeVersionInfo} from './scripts-types.js';
import {OcapiScriptsBackend} from './ocapi-scripts-backend.js';
import {ScapiScriptsBackend} from './scapi-scripts-backend.js';
import {ScapiFallbackBackend} from '../../clients/scapi-fallback-backend.js';
import {resolveScapiOrOcapi, type ApiBackendPreference} from '../../clients/scapi-backend-utils.js';

export interface ScriptsBackendConfig {
  preference: ApiBackendPreference;
  instance: B2CInstance;
  shortCode?: string;
  tenantId?: string;
  auth?: AuthStrategy;
}

export function createScriptsBackend(config: ScriptsBackendConfig): ScriptsBackend {
  const hasScapiConfig = Boolean(config.shortCode && config.tenantId && config.auth);
  const resolved = resolveScapiOrOcapi({
    preference: config.preference,
    hasScapiConfig,
    domainName: 'Scripts',
  });

  if (resolved === 'ocapi') {
    return new OcapiScriptsBackend(config.instance);
  }

  const scapiBackend = new ScapiScriptsBackend({
    shortCode: config.shortCode!,
    tenantId: config.tenantId!,
    auth: config.auth!,
  });

  if (config.preference === 'scapi') {
    return scapiBackend;
  }

  // Auto mode: wrap with fallback
  const ocapiBackend = new OcapiScriptsBackend(config.instance);
  return new FallbackScriptsBackend(scapiBackend, ocapiBackend);
}

export class FallbackScriptsBackend extends ScapiFallbackBackend<ScriptsBackend> implements ScriptsBackend {
  constructor(scapiBackend: ScapiScriptsBackend, ocapiBackend: OcapiScriptsBackend) {
    super(scapiBackend, ocapiBackend, 'scripts');
  }

  async listCodeVersions(): Promise<CodeVersionInfo[]> {
    return this.withFallback((b) => b.listCodeVersions());
  }

  async getActiveCodeVersion(): Promise<CodeVersionInfo | undefined> {
    return this.withFallback((b) => b.getActiveCodeVersion());
  }

  async activateCodeVersion(codeVersionId: string): Promise<void> {
    return this.withFallback((b) => b.activateCodeVersion(codeVersionId));
  }

  async deleteCodeVersion(codeVersionId: string): Promise<void> {
    return this.withFallback((b) => b.deleteCodeVersion(codeVersionId));
  }

  async createCodeVersion(codeVersionId: string): Promise<void> {
    return this.withFallback((b) => b.createCodeVersion(codeVersionId));
  }

  async reloadCodeVersion(codeVersionId?: string): Promise<void> {
    return this.withFallback((b) => b.reloadCodeVersion(codeVersionId));
  }
}
