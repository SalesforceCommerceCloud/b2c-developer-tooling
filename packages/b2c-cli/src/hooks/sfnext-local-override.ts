/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Plugin} from '@oclif/core';
import type {Config, Hook} from '@oclif/core';
import {existsSync} from 'node:fs';
import {dirname, join, parse} from 'node:path';

const SFNEXT_PLUGIN_NAME = '@salesforce/storefront-next-dev';

/**
 * Walks up from `start` looking for `node_modules/<pkg>/package.json` and returns
 * the absolute path to the package root if found, otherwise undefined.
 */
function findProjectLocalPackageRoot(start: string, pkg: string): string | undefined {
  const root = parse(start).root;
  let dir = start;
  while (true) {
    const candidate = join(dir, 'node_modules', pkg);
    if (existsSync(join(candidate, 'package.json'))) {
      return candidate;
    }

    if (dir === root) return undefined;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

const hook: Hook<'init'> = async function ({config, id}) {
  // Cheap guard: only do work for sfnext-namespaced commands. Topic separator is a
  // space at runtime, but oclif normalises ids to colon-separated form.
  if (!id || (id !== 'sfnext' && !id.startsWith('sfnext:'))) return;

  try {
    const localRoot = findProjectLocalPackageRoot(process.cwd(), SFNEXT_PLUGIN_NAME);
    if (!localRoot) return;

    const existing = config.plugins.get(SFNEXT_PLUGIN_NAME);
    if (existing && existing.root === localRoot) return;

    const plugin = new Plugin({
      name: SFNEXT_PLUGIN_NAME,
      root: localRoot,
      type: 'link',
    });
    await plugin.load();
    config.plugins.set(plugin.name, plugin);
    // The Config interface in @oclif/core does not expose loadPluginsAndCommands,
    // but the underlying class implementation does. We need to call it so the
    // newly-registered plugin's commands and topics become discoverable on this
    // already-initialized Config (init hooks fire after the initial command/topic
    // discovery pass).
    const reloadable = config as Config & {
      loadPluginsAndCommands?: (opts: {force: boolean}) => Promise<void>;
    };
    if (typeof reloadable.loadPluginsAndCommands === 'function') {
      await reloadable.loadPluginsAndCommands({force: true});
    }

    this.debug(`loaded project-local ${SFNEXT_PLUGIN_NAME} from ${localRoot} (overriding any JIT copy)`);
  } catch (error) {
    this.warn(`Failed to load project-local ${SFNEXT_PLUGIN_NAME}: ${(error as Error).message}`);
  }
};

export default hook;
