/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {Hook} from '@oclif/core';

/**
 * Auto-install handler for JIT plugins declared in `oclif.jitPlugins`.
 *
 * `@oclif/core` fires `jit_plugin_not_installed` when a user invokes a command
 * that belongs to a JIT plugin which has not yet been installed. Without a hook
 * registered for this event, oclif falls through to `command_not_found` and the
 * user sees a "command not found" error. We delegate to the public
 * `plugins:install --jit` command so the version specifier from
 * `package.json#oclif.jitPlugins` is honored (a dist-tag like `latest` or a
 * semver range), and oclif's own `loadPluginsAndCommands({force: true})` call
 * after this hook returns picks up the freshly-installed plugin.
 */
const hook: Hook<'jit_plugin_not_installed'> = async function ({pluginName, pluginVersion}) {
  this.log(`Installing ${pluginName}@${pluginVersion}...`);
  await this.config.runCommand('plugins:install', [pluginName, '--jit']);
};

export default hook;
