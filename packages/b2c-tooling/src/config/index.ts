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
