/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import {buildInstallCliActions, type ToolDetectionResult} from '../walkthrough/toolDetection.js';

/** Minimal ToolDetectionResult builder for the CLI-step action logic. */
function result(over: Partial<ToolDetectionResult>): ToolDetectionResult {
  const tool = (name: string, installed: boolean, version?: string) => ({name, installed, version, label: name});
  return {
    node: tool('node', true, '20.0.0'),
    npm: tool('npm', true, '10.0.0'),
    homebrew: tool('homebrew', false),
    npx: tool('npx', true, '10.0.0'),
    b2cCli: tool('b2c-cli', true, '1.2.3'),
    ...over,
  };
}

suite('walkthrough install-cli — Update CLI action state', () => {
  test('CLI up to date: Update is present but DISABLED with a tooltip', () => {
    const actions = buildInstallCliActions(result({b2cCliOutdated: false, b2cCliLatest: '1.2.3'}));
    const update = actions.find((a) => a.command === 'b2c-dx.cli.update')!;
    assert.ok(update, 'update action still rendered');
    assert.equal(update.disabled, true, 'update is disabled when up to date');
    assert.equal(update.label, 'Up to date');
    assert.match(update.tooltip ?? '', /latest version|no update/i);
    assert.notEqual(update.primary, true, 'up-to-date update is not the primary CTA');
    // Verify CLI is the primary action in the up-to-date case.
    const verify = actions.find((a) => a.command === 'b2c-dx.cli.verify')!;
    assert.equal(verify.primary, true);
  });

  test('update available: Update CLI is enabled and primary', () => {
    const actions = buildInstallCliActions(result({b2cCliOutdated: true, b2cCliLatest: '2.0.0'}));
    const update = actions.find((a) => a.command === 'b2c-dx.cli.update')!;
    assert.equal(update.label, 'Update CLI');
    assert.notEqual(update.disabled, true, 'update is actionable when a newer version exists');
    assert.equal(update.primary, true, 'update is the primary CTA when outdated');
  });

  test('latest version unknown: Update stays ENABLED (do not block an unverified update)', () => {
    // b2cCliOutdated undefined => we could not resolve the latest version.
    const actions = buildInstallCliActions(result({b2cCliOutdated: undefined, b2cCliLatest: undefined}));
    const update = actions.find((a) => a.command === 'b2c-dx.cli.update')!;
    assert.equal(update.label, 'Update CLI');
    assert.notEqual(update.disabled, true, 'unknown-latest keeps update enabled');
  });

  test('CLI not installed: no Update action, install path offered', () => {
    const actions = buildInstallCliActions(result({b2cCli: {name: 'b2c-cli', installed: false, label: 'b2c-cli'}}));
    assert.ok(!actions.some((a) => a.command === 'b2c-dx.cli.update'), 'no Update CLI when nothing is installed');
    assert.ok(
      actions.some((a) => a.command === 'b2c-dx.cli.installNpm' && a.primary),
      'npm install is the primary CTA',
    );
    assert.ok(actions.some((a) => a.command === 'b2c-dx.cli.recheck'));
  });

  test('not installed, no npm but Homebrew present: brew install is primary', () => {
    const actions = buildInstallCliActions(
      result({
        b2cCli: {name: 'b2c-cli', installed: false, label: 'b2c-cli'},
        npm: {name: 'npm', installed: false, label: 'npm'},
        homebrew: {name: 'homebrew', installed: true, version: '4.0.0', label: 'homebrew'},
      }),
    );
    assert.ok(actions.some((a) => a.command === 'b2c-dx.cli.installBrew' && a.primary));
  });
});
