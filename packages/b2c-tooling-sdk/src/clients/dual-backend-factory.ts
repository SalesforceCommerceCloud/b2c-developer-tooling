/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Generic factory for SCAPI/OCAPI dual backends.
 *
 * Replaces the per-domain `create*Backend()` functions (jobs, scripts,
 * users, roles) which were 100% structurally identical. Each domain now
 * supplies its constructors and config and delegates to {@link createDualBackend}.
 *
 * @module clients/dual-backend-factory
 */
import type {AuthStrategy} from '../auth/types.js';
import type {B2CInstance} from '../instance/index.js';
import {createFallbackBackend} from './scapi-fallback-backend.js';
import {resolveScapiOrOcapi, type ApiBackendPreference, type BackendBase} from './scapi-backend-utils.js';

/**
 * Common shape of every dual-backend factory's input.
 */
export interface DualBackendConfig {
  preference: ApiBackendPreference;
  instance: B2CInstance;
  shortCode?: string;
  tenantId?: string;
  auth?: AuthStrategy;
}

/**
 * Configuration passed to a SCAPI backend constructor. Domains add their
 * own optional fields (e.g., `instance` for log/WebDAV access on jobs) but
 * always include shortCode + tenantId + auth.
 */
export interface ScapiBackendCtorConfig {
  shortCode: string;
  tenantId: string;
  auth: AuthStrategy;
  instance: B2CInstance;
}

/**
 * Constructors needed to build a dual-backend instance. Each domain plugs in
 * its own SCAPI/OCAPI backend classes; the factory wires them together.
 */
export interface DualBackendCtors<T extends BackendBase> {
  domainName: string;
  Scapi: new (config: ScapiBackendCtorConfig) => T;
  Ocapi: new (instance: B2CInstance) => T;
}

/**
 * Resolves the user's preference + config availability into a concrete
 * backend instance.
 *
 * - Explicit `'ocapi'` returns an OCAPI backend.
 * - Explicit `'scapi'` returns a SCAPI backend (throws if config missing).
 * - `'auto'` returns a fallback Proxy that tries SCAPI first, falls back to
 *   OCAPI on `invalid_scope`.
 *
 * @example
 * ```ts
 * export function createJobsBackend(config: JobsBackendConfig): JobsBackend {
 *   return createDualBackend(config, {
 *     domainName: 'Jobs',
 *     Scapi: ScapiJobsBackend,
 *     Ocapi: OcapiJobsBackend,
 *   });
 * }
 * ```
 */
export function createDualBackend<T extends BackendBase>(config: DualBackendConfig, ctors: DualBackendCtors<T>): T {
  const hasScapiConfig = Boolean(config.shortCode && config.tenantId && config.auth);
  const resolved = resolveScapiOrOcapi({
    preference: config.preference,
    hasScapiConfig,
    domainName: ctors.domainName,
  });

  if (resolved === 'ocapi') {
    return new ctors.Ocapi(config.instance);
  }

  const scapiBackend = new ctors.Scapi({
    shortCode: config.shortCode!,
    tenantId: config.tenantId!,
    auth: config.auth!,
    instance: config.instance,
  });

  if (config.preference === 'scapi') {
    return scapiBackend;
  }

  // Auto mode: wrap with fallback
  const ocapiBackend = new ctors.Ocapi(config.instance);
  return createFallbackBackend<T>(scapiBackend, ocapiBackend, ctors.domainName.toLowerCase());
}
