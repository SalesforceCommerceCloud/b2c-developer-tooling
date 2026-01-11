/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Example B2C CLI plugin demonstrating custom configuration sources.
 *
 * This plugin shows how to use the `b2c:config-sources` hook to provide
 * custom ConfigSource implementations that integrate with the B2C CLI
 * configuration resolution system.
 *
 * ## Installation
 *
 * ```bash
 * b2c plugins link ./packages/b2c-plugin-example-config
 * ```
 *
 * ## Usage
 *
 * Create a `.env.b2c` file in your project root:
 *
 * ```
 * HOSTNAME=example.sandbox.us03.dx.commercecloud.salesforce.com
 * CLIENT_ID=your-client-id
 * CLIENT_SECRET=your-client-secret
 * CODE_VERSION=version1
 * ```
 *
 * The plugin will automatically load these values when running CLI commands.
 *
 * @module b2c-plugin-example-config
 */
export {EnvFileSource} from './sources/env-file-source.js';
