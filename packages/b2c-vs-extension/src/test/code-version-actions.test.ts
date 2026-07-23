/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as assert from 'assert';
import {getActivationCandidates, getPostDeployActions} from '../code-sync/code-version-actions.js';

suite('code version actions', () => {
  test('omits activate when the deployment target is already active', () => {
    assert.deepStrictEqual(
      getPostDeployActions(true).map((item) => item.action),
      ['none', 'reload'],
    );
  });

  test('offers activate when the deployment target is not known to be active', () => {
    assert.deepStrictEqual(
      getPostDeployActions(false).map((item) => item.action),
      ['none', 'activate', 'reload'],
    );
  });

  test('excludes the active version and invalid entries from activation candidates', () => {
    const candidates = getActivationCandidates([
      {id: 'active', active: true},
      {id: 'inactive', active: false},
      {active: false},
    ]);

    assert.deepStrictEqual(
      candidates.map((version) => version.id),
      ['inactive'],
    );
  });
});
