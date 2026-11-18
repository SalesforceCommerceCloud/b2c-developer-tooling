/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {Telemetry} from '@salesforce/b2c-tooling-sdk/telemetry';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';

describe('test-utils/config-isolation', () => {
  const keys = ['SFCC_DISABLE_TELEMETRY', 'SF_DISABLE_TELEMETRY'] as const;
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  });

  afterEach(() => {
    restoreConfig();
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  // Test setup and CI disable telemetry with SFCC_DISABLE_TELEMETRY, which the
  // SFCC_* isolation would otherwise strip, letting command tests send real events.
  it('keeps telemetry disabled while SFCC_* variables are isolated', () => {
    process.env.SFCC_DISABLE_TELEMETRY = 'true';
    delete process.env.SF_DISABLE_TELEMETRY;
    isolateConfig();
    expect(Telemetry.isDisabled()).to.equal(true);
  });

  it('restores the previous SFCC_DISABLE_TELEMETRY value', () => {
    process.env.SFCC_DISABLE_TELEMETRY = 'true';
    isolateConfig();
    restoreConfig();
    expect(process.env.SFCC_DISABLE_TELEMETRY).to.equal('true');
  });
});
