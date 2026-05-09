/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Transitional helpers that exist only to bridge the OCAPI → SCAPI
 * migration. Everything in this module is scheduled for deletion when
 * OCAPI is removed.
 *
 * @module compat
 */
export {BackendDispatcher} from './dispatcher.js';
export type {ApiBackendPreference, ResolvedBackend, DispatchBranches} from './dispatcher.js';
