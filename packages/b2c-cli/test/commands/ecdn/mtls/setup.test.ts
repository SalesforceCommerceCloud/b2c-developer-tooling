/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {afterEach, beforeEach} from 'mocha';
import EcdnMtlsSetup from '../../../../src/commands/ecdn/mtls/setup.js';
import {
  createIsolatedConfigHooks,
  createTestCommand,
  expectError,
  makeCommandThrowOnError,
} from '../../../helpers/test-setup.js';

describe('ecdn mtls setup', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  it('requires an interactive terminal', async () => {
    const command: any = await createTestCommand(EcdnMtlsSetup, hooks.getConfig(), {'tenant-id': 'zzxy_prd'}, {});
    makeCommandThrowOnError(command);
    const original = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
    Object.defineProperty(process.stdin, 'isTTY', {value: false, configurable: true});
    try {
      await expectError(() => command.run(), /ecdn mtls create --generate/);
    } finally {
      if (original) Object.defineProperty(process.stdin, 'isTTY', original);
      else delete (process.stdin as {isTTY?: boolean}).isTTY;
    }
  });
});
