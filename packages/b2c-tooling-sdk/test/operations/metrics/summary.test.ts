/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {summarizeSeriesData} from '@salesforce/b2c-tooling-sdk';

describe('operations/metrics summarizeSeriesData', () => {
  it('summarizes points and orders first/last by timestamp', () => {
    const summary = summarizeSeriesData([
      {timestamp: 300, value: 1},
      {timestamp: 100, value: 2},
      {timestamp: 200, value: 6},
    ]);
    expect(summary).to.deep.equal({
      points: 3,
      sum: 9,
      min: 1,
      max: 6,
      avg: 3,
      maxAt: new Date(200).toISOString(),
      firstAt: new Date(100).toISOString(),
      lastAt: new Date(300).toISOString(),
    });
  });

  it('returns only a zero count for placeholder series', () => {
    expect(summarizeSeriesData([])).to.deep.equal({points: 0});
  });
});
