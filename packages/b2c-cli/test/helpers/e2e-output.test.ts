/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {parseJSONErrorOutput} from '../functional/e2e/test-utils.js';

describe('E2E JSON error output', () => {
  const error = {error: {message: 'Failed to get SLAS client', code: 1}};

  it('extracts the error between pretty debug messages on stderr', () => {
    const stderr = [
      '[01:22:34.090] DEBUG: Loading configuration',
      '    command: "slas:client:get"',
      JSON.stringify(error),
      '[01:22:34.100] DEBUG: Finished command',
    ].join('\r\n');

    expect(parseJSONErrorOutput({stderr, stdout: ''})).to.deep.equal(error);
  });

  it('distinguishes JSON log entries from the CLI error envelope', () => {
    const stderr = [
      JSON.stringify(error),
      JSON.stringify({level: 20, error: {message: 'Diagnostic context'}, msg: 'Cleanup'}),
    ].join('\n');

    expect(parseJSONErrorOutput({stderr, stdout: ''})).to.deep.equal(error);
  });

  it('accepts a standalone formatted JSON error', () => {
    expect(parseJSONErrorOutput({stderr: JSON.stringify(error, null, 2), stdout: ''})).to.deep.equal(error);
  });

  it('checks stdout when stderr contains only diagnostics', () => {
    expect(
      parseJSONErrorOutput({stderr: '[13:00:00] DEBUG: Starting command', stdout: JSON.stringify(error)}),
    ).to.deep.equal(error);
  });

  it('rejects diagnostics or malformed JSON without a CLI error envelope', () => {
    for (const stderr of ['', '[13:00:00] DEBUG: Starting command', '{"error":', 'null']) {
      expect(() => parseJSONErrorOutput({stderr, stdout: ''})).to.throw('Command did not return a JSON error object');
    }
  });
});
