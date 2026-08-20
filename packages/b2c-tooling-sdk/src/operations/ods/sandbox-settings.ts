/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {components} from '../../clients/ods.generated.js';

type OcapiSettings = components['schemas']['OcapiSettings'];
type WebDavSettings = components['schemas']['WebDavSettings'];
type SandboxSettings = components['schemas']['SandboxSettings'];

/**
 * Default OCAPI resources to grant the client ID access to.
 * These enable common CI/CD operations like code deployment and job execution.
 */
export const DEFAULT_OCAPI_RESOURCES: NonNullable<OcapiSettings[number]['resources']> = [
  {resource_id: '/code_versions', methods: ['get'], read_attributes: '(**)', write_attributes: '(**)'},
  {resource_id: '/code_versions/*', methods: ['patch', 'delete'], read_attributes: '(**)', write_attributes: '(**)'},
  {resource_id: '/jobs/*/executions', methods: ['post'], read_attributes: '(**)', write_attributes: '(**)'},
  {resource_id: '/jobs/*/executions/*', methods: ['get'], read_attributes: '(**)', write_attributes: '(**)'},
  {resource_id: '/sites/*/cartridges', methods: ['post'], read_attributes: '(**)', write_attributes: '(**)'},
];

/**
 * Default WebDAV permissions to grant the client ID.
 * These enable common operations like code upload and data import/export.
 */
export const DEFAULT_WEBDAV_PERMISSIONS: WebDavSettings[number]['permissions'] = [
  {path: '/impex', operations: ['read_write']},
  {path: '/cartridges', operations: ['read_write']},
  {path: '/static', operations: ['read_write']},
];

/**
 * Options for {@link buildSandboxSettings}.
 */
export interface BuildSandboxSettingsOptions {
  /**
   * Client ID to grant default OCAPI/WebDAV permissions. When provided (and no
   * custom settings are supplied), the defaults are applied for this client.
   */
  clientId?: string;
  /**
   * Custom OCAPI settings array that fully replaces {@link DEFAULT_OCAPI_RESOURCES}.
   */
  ocapiSettings?: OcapiSettings;
  /**
   * Custom WebDAV settings array that fully replaces {@link DEFAULT_WEBDAV_PERMISSIONS}.
   */
  webdavSettings?: WebDavSettings;
}

/**
 * Builds the sandbox `settings` object granting OCAPI and WebDAV permissions to
 * a client ID. New sandboxes have no API permissions by default, so the client
 * used to create the sandbox (e.g. for code deployment) must be granted access
 * explicitly or subsequent operations will fail with authorization errors.
 *
 * When `ocapiSettings`/`webdavSettings` are provided they fully replace the
 * defaults. Otherwise, when a `clientId` is provided, the client is granted the
 * default resources/permissions.
 *
 * @returns The settings object, or `undefined` when there is nothing to set
 *   (no client ID and no custom settings).
 *
 * @example
 * const settings = buildSandboxSettings({clientId: config.values.clientId});
 * await odsClient.POST('/sandboxes', {body: {realm, ttl, settings}});
 */
export function buildSandboxSettings(options: BuildSandboxSettingsOptions): SandboxSettings | undefined {
  const hasCustomOcapi = options.ocapiSettings !== undefined;
  const hasCustomWebdav = options.webdavSettings !== undefined;
  const {clientId} = options;

  // Nothing to apply: no custom settings and no client ID for defaults.
  if (!hasCustomOcapi && !hasCustomWebdav && !clientId) {
    return undefined;
  }

  const ocapi: OcapiSettings = hasCustomOcapi
    ? options.ocapiSettings!
    : clientId
      ? [{client_id: clientId, resources: DEFAULT_OCAPI_RESOURCES}]
      : [];

  const webdav: WebDavSettings = hasCustomWebdav
    ? options.webdavSettings!
    : clientId
      ? [{client_id: clientId, permissions: DEFAULT_WEBDAV_PERMISSIONS}]
      : [];

  return {ocapi, webdav};
}
