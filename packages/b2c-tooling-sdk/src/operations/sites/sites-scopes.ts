/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * SCAPI Sites scopes named in OCAPI-deprecation error messages, derived from
 * the canonical cascade so they can't drift. Sites operations are read-only,
 * so the read cascade (rw then ro) is the relevant set.
 *
 * @module operations/sites/sites-scopes
 */
import {SCAPI_SITES_CASCADE} from '../../clients/scapi-sites.js';

/** Distinct sites read scopes (e.g. `['sfcc.sites.rw', 'sfcc.sites']`). */
export const SCAPI_SITES_READ_AND_RW_SCOPES = [...new Set(SCAPI_SITES_CASCADE.read.flat())];
