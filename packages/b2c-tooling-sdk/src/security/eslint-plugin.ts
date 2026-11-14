/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {ScriptRule} from './rule.js';
import {SCRIPT_RULES} from './rules/index.js';

/**
 * The built-in security rules as an ESLint v9 plugin, also loadable by oxlint
 * through `jsPlugins`. Rules are named `b2c-security/<rule-id>`.
 */
const plugin: {meta: {name: string}; rules: Record<string, ScriptRule>} = {
  meta: {name: 'b2c-security'},
  rules: Object.fromEntries(SCRIPT_RULES.map((r) => [r.meta.b2c.id, r])),
};

export default plugin;
