/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {Config} from '@oclif/core';
import sinon from 'sinon';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from './stub-parse.js';

export function createIsolatedEnvHooks(): {
  beforeEach: () => void;
  afterEach: () => void;
} {
  return {
    beforeEach() {
      isolateConfig();
    },
    afterEach() {
      sinon.restore();
      restoreConfig();
    },
  };
}

export function createIsolatedConfigHooks(): {
  beforeEach: () => Promise<void>;
  afterEach: () => void;
  getConfig: () => Config;
} {
  let config: Config;

  return {
    async beforeEach() {
      isolateConfig();
      const {Config} = await import('@oclif/core');
      config = await Config.load();
    },
    afterEach() {
      sinon.restore();
      restoreConfig();
    },
    getConfig: () => config,
  };
}

export async function createTestCommand<T extends {init: () => Promise<void>}>(
  CommandClass: new (argv: string[], config: Config) => T,
  config: Config,
  flags: Record<string, unknown> = {},
  args: Record<string, unknown> = {},
): Promise<T> {
  const command: any = new CommandClass([], config);
  stubParse(command, flags, args);
  await command.init();
  return command as T;
}
