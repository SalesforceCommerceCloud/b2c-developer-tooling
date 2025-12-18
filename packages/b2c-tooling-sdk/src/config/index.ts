/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Configuration loading utilities.
 *
 * This module provides utilities for loading B2C Commerce configuration,
 * primarily from dw.json files.
 *
 * @module config
 */
export {loadDwJson, findDwJson} from './dw-json.js';
export type {DwJsonConfig, DwJsonMultiConfig, LoadDwJsonOptions} from './dw-json.js';
