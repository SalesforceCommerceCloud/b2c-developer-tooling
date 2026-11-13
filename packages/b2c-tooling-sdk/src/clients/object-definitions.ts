/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Object Definitions API client for B2C Commerce.
 *
 * Typed client for the SCAPI Object Definitions API (`/dx/object-definitions/v1`),
 * which manages system object types, their attribute definitions, and attribute
 * groups.
 *
 * Scopes: `sfcc.object-definitions` (read) and `sfcc.object-definitions.rw`
 * (read-write). Attribute and attribute group search require the read-write
 * scope, so the read cascade tries `.rw` first.
 *
 * @module clients/object-definitions
 */
import type {Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './object-definitions.generated.js';
import {buildScapiClient, type ScapiClientConfig} from './scapi-client-factory.js';
import type {ScopeCascade} from './middleware.js';

export type {paths, components};

/** Typed Object Definitions API client. */
export type ObjectDefinitionsClient = Client<paths>;

/** Configuration for {@link createObjectDefinitionsClient}. */
export type ObjectDefinitionsClientConfig = ScapiClientConfig;

/** A system object type definition. */
export type ObjectTypeDefinition = components['schemas']['ObjectTypeDefinition'];
/** An attribute definition of a system object type. */
export type ObjectAttributeDefinition = components['schemas']['ObjectAttributeDefinition'];
/** An attribute group of a system object type. */
export type ObjectAttributeGroup = components['schemas']['ObjectAttributeGroup'];
/** A possible value of an enum attribute definition. */
export type ObjectAttributeValueDefinition = components['schemas']['ObjectAttributeValueDefinition'];
/** Attribute value type (`string`, `enum_of_string`, ...). */
export type ObjectAttributeValueType = components['schemas']['ValueType'];
/** Search request body accepted by the search endpoints. */
export type ObjectDefinitionsSearchRequest = components['schemas']['SearchRequest'];
/** Search query (term, text, bool, filtered, ...). */
export type ObjectDefinitionsQuery = components['schemas']['Query'];

/** Read-write scope for the Object Definitions API. */
export const OBJECT_DEFINITIONS_RW_SCOPE = 'sfcc.object-definitions.rw';
/** Read-only scope for the Object Definitions API. */
export const OBJECT_DEFINITIONS_READ_SCOPE = 'sfcc.object-definitions';

/**
 * Scope cascade for the Object Definitions API. Reads prefer `.rw` because the
 * attribute and group search endpoints (and enum values, which only search
 * returns) require it; plain list/get falls back to the read-only scope.
 */
export const OBJECT_DEFINITIONS_CASCADE: ScopeCascade = {
  read: [[OBJECT_DEFINITIONS_RW_SCOPE], [OBJECT_DEFINITIONS_READ_SCOPE]],
  write: [[OBJECT_DEFINITIONS_RW_SCOPE]],
};

/**
 * Creates a typed Object Definitions API client.
 *
 * @example
 * ```ts
 * const client = createObjectDefinitionsClient({shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}, auth);
 * const {data} = await client.GET('/organizations/{organizationId}/system/object-types/{objectType}', {
 *   params: {path: {organizationId: 'f_ecom_zzxy_prd', objectType: 'Product'}},
 * });
 * ```
 */
export function createObjectDefinitionsClient(
  config: ObjectDefinitionsClientConfig,
  auth: AuthStrategy,
): ObjectDefinitionsClient {
  return buildScapiClient<paths>(
    {
      pathSegment: 'dx/object-definitions/v1',
      domainKey: 'object-definitions',
      scopeCascade: OBJECT_DEFINITIONS_CASCADE,
      logPrefix: 'OBJECT-DEFINITIONS',
    },
    config,
    auth,
  );
}
