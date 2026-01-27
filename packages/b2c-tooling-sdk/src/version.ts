/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * SDK version information and User-Agent string.
 *
 * @module version
 */
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
// Use the package.json exports path to resolve correctly from both src/ and dist/
const pkg = require('@salesforce/b2c-tooling-sdk/package.json') as {name: string; version: string};

/**
 * The SDK package name.
 */
export const SDK_NAME = pkg.name;

/**
 * The SDK package version.
 */
export const SDK_VERSION = pkg.version;

/**
 * Default User-Agent string for the SDK.
 *
 * Format: `b2c-tooling-sdk/0.1.0`
 */
export const SDK_USER_AGENT = `${SDK_NAME.replace(/^@salesforce\//, '')}/${SDK_VERSION}`;
