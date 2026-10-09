/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {
  createCipClient,
  DEFAULT_CIP_HOST,
  DEFAULT_CIP_STAGING_HOST,
  normalizeTenantId,
  MiddlewareRegistry,
  globalMiddlewareRegistry,
  createSafetyMiddleware,
} from '@salesforce/b2c-tooling-sdk/clients';
import {getB2CConfigDirectory} from '@salesforce/b2c-tooling-sdk/config';
import {SafetyGuard, resolveEffectiveSafetyConfig, loadGlobalSafetyConfig} from '@salesforce/b2c-tooling-sdk/safety';
import type {Services} from '../../services.js';

export function resolveCipClient(services: Services, signal: AbortSignal, staging?: boolean) {
  const config = services.getResolvedConfig();
  const {tenantId, clientId, clientSecret, authMethods} = config.values;
  if (!tenantId || !clientId || !clientSecret)
    throw new Error(
      'CIP_CONFIG_REQUIRED: Configure tenantId, clientId, and clientSecret. Use config_inspect with secrets masked.',
    );
  if (authMethods?.some((method) => method !== 'client-credentials'))
    throw new Error(
      'CIP_AUTH_METHOD: CIP requires client-credentials authentication; user and JWT flows are unsupported.',
    );
  const instance = normalizeTenantId(tenantId);
  if (!/^[a-z0-9]+_[a-z0-9]+$/i.test(instance))
    throw new Error('CIP_CONFIG_REQUIRED: Invalid tenantId; use a tenant such as abcd_prd or abcd_001.');
  const useStaging = staging ?? ['1', 'true'].includes(services.getEnvironmentVariable('SFCC_CIP_STAGING') ?? '');
  const host =
    services.getEnvironmentVariable('SFCC_CIP_HOST') ??
    config.values.cipHost ??
    (useStaging || !instance.endsWith('_prd') ? DEFAULT_CIP_STAGING_HOST : DEFAULT_CIP_HOST);
  const url = new URL(host.includes('://') ? host : `https://${host}`);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash)
    throw new Error('CIP_CONFIG_REQUIRED: cipHost must be an HTTPS hostname without credentials or a path.');
  const safetyEnvironment = Object.fromEntries(
    ['SFCC_SAFETY_LEVEL', 'SFCC_SAFETY_CONFIRM', 'SFCC_SAFETY_CONFIG'].map((name) => [
      name,
      services.getEnvironmentVariable(name),
    ]),
  );
  const guard = new SafetyGuard(
    resolveEffectiveSafetyConfig(
      config.values.safety,
      loadGlobalSafetyConfig(
        getB2CConfigDirectory(),
        safetyEnvironment,
        services.getResolution().projectDirectory.path,
      ),
      safetyEnvironment,
    ),
  );
  // Replace only the startup policy with this call's resolved project policy; retain plugin middleware.
  const middlewareRegistry = new (class extends MiddlewareRegistry {
    override getMiddleware() {
      return [
        ...globalMiddlewareRegistry.getMiddleware('cip', {exclude: ['cli-safety-guard']}),
        createSafetyMiddleware(guard),
      ];
    }
  })();
  const scope = `SALESFORCE_COMMERCE_API:${instance}`;
  const client = createCipClient(
    {instance, host: url.host, signal, maxResponseBytes: 8 * 1024 * 1024, middlewareRegistry},
    config.createOAuth({allowedMethods: ['client-credentials'], scopes: [scope]}),
  );
  return {client, target: {tenantId: instance, host: url.host, scope}};
}
