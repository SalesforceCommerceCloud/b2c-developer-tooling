/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import {CipWebviewManager} from '../../cip-analytics/cip-webview-manager.js';

suite('CipWebviewManager.formatConnectionError', () => {
  test('429 yields rate-limit guidance', () => {
    const m = CipWebviewManager.formatConnectionError(new Error('Request failed: HTTP 429'));
    assert.match(m, /Rate-limited by CIP/);
  });

  test('"Too Many Requests" body also yields rate-limit guidance', () => {
    const m = CipWebviewManager.formatConnectionError('Server returned: Too Many Requests');
    assert.match(m, /Rate-limited by CIP/);
  });

  test('invalid_scope is mapped to the tenant/access guidance', () => {
    const m = CipWebviewManager.formatConnectionError(new Error('oauth: invalid_scope'));
    assert.match(m, /Invalid tenant ID or no CIP access/);
  });

  test('Authentication / 401 is mapped to OAuth guidance', () => {
    const a = CipWebviewManager.formatConnectionError(new Error('Authentication failed'));
    assert.match(a, /Check OAuth credentials/);
    const b = CipWebviewManager.formatConnectionError(new Error('Server replied 401 Unauthorized'));
    assert.match(b, /Check OAuth credentials/);
  });

  test('timeout / ETIMEDOUT yields timeout guidance', () => {
    const t = CipWebviewManager.formatConnectionError(new Error('socket timeout'));
    assert.match(t, /CIP may not be provisioned yet/);
    const u = CipWebviewManager.formatConnectionError(new Error('connect ETIMEDOUT 1.2.3.4'));
    assert.match(u, /CIP may not be provisioned yet/);
  });

  test('ENOTFOUND / ECONNREFUSED yields network guidance', () => {
    const m = CipWebviewManager.formatConnectionError(new Error('getaddrinfo ENOTFOUND host'));
    assert.match(m, /Cannot reach CIP host/);
  });

  test('falls back to "Connection failed: <message>"', () => {
    const m = CipWebviewManager.formatConnectionError(new Error('plain old boom'));
    assert.equal(m, 'Connection failed: plain old boom');
  });

  test('accepts non-Error values via String coercion', () => {
    const m = CipWebviewManager.formatConnectionError('weird literal');
    assert.equal(m, 'Connection failed: weird literal');
  });
});
