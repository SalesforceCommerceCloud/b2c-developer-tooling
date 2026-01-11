/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Hook implementation for b2c:config-sources.
 *
 * This hook is called during CLI command initialization, after flags are parsed
 * but before configuration is resolved. It returns custom ConfigSource instances
 * that will be merged with the default configuration sources.
 */
import type {ConfigSourcesHook} from '@salesforce/b2c-tooling-sdk/cli';
import {EnvFileSource} from '../sources/env-file-source.js';

/**
 * The b2c:config-sources hook handler.
 *
 * This function is called by the B2C CLI when initializing any command.
 * It receives context from the command (like --instance flag) and returns
 * custom ConfigSource instances.
 *
 * @param options - Hook options containing instance name and config path
 * @returns Config sources and their priority
 */
const hook: ConfigSourcesHook = async function (options) {
  this.debug(`b2c:config-sources hook called with instance: ${options.instance}`);

  return {
    sources: [new EnvFileSource()],
    // 'before' = override dw.json/~/.mobify (higher priority)
    // 'after' = fill gaps after dw.json/~/.mobify (lower priority) - this is the default
    priority: 'before',
  };
};

export default hook;
