/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './scapi-experiences.generated.js';
import {buildScapiClient, type ScapiClientConfig} from './scapi-client-factory.js';
import type {ScopeCascade} from './middleware.js';

export type {paths, components};
export type ScapiExperiencesClient = Client<paths>;
export type ScapiExperiencesError = components['schemas']['ErrorResponse'];

export type ExperiencePageType = components['schemas']['PageType'];
export type ExperienceComponentType = components['schemas']['ComponentType'];
export type ExperienceAttributeDefinition = components['schemas']['AttributeDefinition'];
export type ExperienceAttributeDefinitionGroup = components['schemas']['AttributeDefinitionGroup'];
export type ExperienceRegionDefinition = components['schemas']['RegionDefinition'];
export type ExperienceAspectType = components['schemas']['AspectType'];
export type ExperienceLocalizedText = components['schemas']['LocalizedText'];
export type ExperiencePage = components['schemas']['Page'];
export type ExperienceContentAsset = components['schemas']['ContentAsset'];
export type ExperienceContentFolder = components['schemas']['ContentFolder'];
export type ExperienceContentFolderAssignment = components['schemas']['ContentFolderAssignment'];
export type ExperienceSlot = components['schemas']['Slot'];
export type ExperienceSlotConfiguration = components['schemas']['SlotConfiguration'];
export type ExperienceSearchRequest = components['schemas']['SearchRequest'];

/**
 * Request body for `PUT /pages/{pageId}`.
 *
 * The generated `PageRequest` types `data` as `Record<string, never>` (the
 * spec declares a free-form object without properties), which makes it
 * unusable for real attribute values. This hand-written shape mirrors the
 * spec with `data` widened to `Record<string, unknown>`.
 */
export interface ExperiencePageRequest {
  id: string;
  typeId: string;
  name: string;
  aspectTypeId?: string;
  description?: string;
  pageTitle?: string;
  pageDescription?: string;
  pageKeywords?: string;
  thumbnail?: string;
  data?: Record<string, unknown>;
  regions?: ExperienceRegionRequest[];
  [key: `c_${string}`]: unknown;
}

/** A region in a {@link ExperiencePageRequest}. */
export interface ExperienceRegionRequest {
  id: string;
  components?: ExperienceComponentRequest[];
}

/** A component in a {@link ExperienceRegionRequest}. Layout components nest `regions`. */
export interface ExperienceComponentRequest {
  id: string;
  typeId: string;
  name?: string;
  data?: Record<string, unknown>;
  visible?: boolean;
  localized?: boolean;
  designMetadata?: Record<string, unknown>;
  regions?: ExperienceRegionRequest[];
}

/**
 * Per-operation scope cascade for the SCAPI Experiences API.
 *
 * Reads accept either `sfcc.experiences.rw` or `sfcc.experiences`, so they try
 * `rw` first and fall back to read-only. Writes (and `getContentFolder`, which
 * the platform restricts to `rw`) use the rw tier exclusively.
 */
export const SCAPI_EXPERIENCES_CASCADE: ScopeCascade = {
  read: [['sfcc.experiences.rw'], ['sfcc.experiences']],
  write: [['sfcc.experiences.rw']],
};

/** Scopes accepted by Experiences API reads (rw first), for error hints. */
export const SCAPI_EXPERIENCES_SCOPES = ['sfcc.experiences.rw', 'sfcc.experiences'];

export type ScapiExperiencesClientConfig = ScapiClientConfig;

/**
 * Creates a typed client for the SCAPI Admin Experiences API
 * (`experience/experiences/v1`): Page Designer page push, page and component
 * type metadata, library content assets and folders, and content slots.
 */
export function createScapiExperiencesClient(
  config: ScapiExperiencesClientConfig,
  auth: AuthStrategy,
): ScapiExperiencesClient {
  return buildScapiClient<paths>(
    {
      pathSegment: 'experience/experiences/v1',
      domainKey: 'scapi-experiences',
      scopeCascade: SCAPI_EXPERIENCES_CASCADE,
      logPrefix: 'SCAPI-EXPERIENCES',
    },
    config,
    auth,
  );
}
