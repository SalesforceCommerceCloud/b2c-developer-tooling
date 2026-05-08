/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AuthStrategy} from '../../auth/types.js';
import type {ScriptsBackend, CodeVersionInfo} from './scripts-types.js';
import {
  createScapiScriptsClient,
  SCAPI_SCRIPTS_RW_SCOPES,
  SCAPI_SCRIPTS_READ_SCOPES,
  type ScapiScriptsClient,
  type ScapiScriptsClientConfig,
  type CodeVersion as ScapiCodeVersion,
} from '../../clients/scapi-scripts.js';
import {buildTenantScope, toOrganizationId} from '../../clients/custom-apis.js';
import {ScopeTierManager} from '../../clients/scapi-scope-tier.js';
import {getLogger} from '../../logging/logger.js';

function mapScapiCodeVersion(scapi: ScapiCodeVersion): CodeVersionInfo {
  return {
    id: scapi.id ?? '',
    active: scapi.active,
    cartridges: scapi.cartridges,
    compatibilityMode: scapi.compatibilityMode,
    activationTime: scapi.activationTime,
    lastModificationTime: scapi.lastModificationTime,
    rollback: scapi.rollback,
    totalSize: scapi.totalSize,
    webDavUrl: scapi.webDavUrl,
    _raw: scapi,
  };
}

export interface ScapiScriptsBackendConfig {
  shortCode: string;
  tenantId: string;
  auth: AuthStrategy;
}

export class ScapiScriptsBackend implements ScriptsBackend {
  readonly name = 'scapi' as const;

  private organizationId: string;
  private scopeTier: ScopeTierManager<ScapiScriptsClient>;

  constructor(private config: ScapiScriptsBackendConfig) {
    this.organizationId = toOrganizationId(config.tenantId);
    this.scopeTier = new ScopeTierManager<ScapiScriptsClient>({
      buildClient: (scopes) => this.buildClient(scopes),
      rwScopes: SCAPI_SCRIPTS_RW_SCOPES,
      readScopes: SCAPI_SCRIPTS_READ_SCOPES,
      domainName: 'Scripts',
    });
  }

  async listCodeVersions(): Promise<CodeVersionInfo[]> {
    const client = this.scopeTier.getClientForRead();
    const {data, error} = await client.GET('/organizations/{organizationId}/code-versions', {
      params: {path: {organizationId: this.organizationId}},
    });
    if (error || !data) {
      throw new Error(toErrorMessage(error, 'Failed to list code versions'));
    }
    const result = data as unknown as {data?: ScapiCodeVersion[]};
    return (result.data ?? []).map(mapScapiCodeVersion);
  }

  async getActiveCodeVersion(): Promise<CodeVersionInfo | undefined> {
    const versions = await this.listCodeVersions();
    return versions.find((v) => v.active);
  }

  async activateCodeVersion(codeVersionId: string): Promise<void> {
    const client = this.scopeTier.getClientForWrite();
    const logger = getLogger();
    logger.debug({codeVersionId}, `Activating code version ${codeVersionId}`);

    const {error} = await client.PATCH('/organizations/{organizationId}/code-versions/{codeVersionId}', {
      params: {path: {organizationId: this.organizationId, codeVersionId}},
      body: {active: true} as unknown as ScapiCodeVersion,
    });
    if (error) {
      throw new Error(toErrorMessage(error, `Failed to activate code version ${codeVersionId}`));
    }
    logger.debug({codeVersionId}, `Code version ${codeVersionId} activated`);
  }

  async deleteCodeVersion(codeVersionId: string): Promise<void> {
    const client = this.scopeTier.getClientForWrite();
    const {error} = await client.DELETE('/organizations/{organizationId}/code-versions/{codeVersionId}', {
      params: {path: {organizationId: this.organizationId, codeVersionId}},
    });
    if (error) {
      throw new Error(toErrorMessage(error, `Failed to delete code version ${codeVersionId}`));
    }
  }

  async createCodeVersion(codeVersionId: string): Promise<void> {
    const client = this.scopeTier.getClientForWrite();
    const {error} = await client.PUT('/organizations/{organizationId}/code-versions/{codeVersionId}', {
      params: {path: {organizationId: this.organizationId, codeVersionId}},
    });
    if (error) {
      throw new Error(toErrorMessage(error, `Failed to create code version ${codeVersionId}`));
    }
  }

  async reloadCodeVersion(_codeVersionId?: string): Promise<void> {
    throw new Error('Reloading code versions is not supported via SCAPI. Use --api-backend ocapi to reload.');
  }

  private buildClient(scopes: string[]): ScapiScriptsClient {
    const clientConfig: ScapiScriptsClientConfig = {
      shortCode: this.config.shortCode,
      tenantId: this.config.tenantId,
      scopes: [...scopes, buildTenantScope(this.config.tenantId)],
    };
    return createScapiScriptsClient(clientConfig, this.config.auth);
  }
}

function toErrorMessage(error: unknown, fallback: string): string {
  const e = error as {detail?: string; title?: string} | undefined;
  return e?.detail ?? e?.title ?? fallback;
}
