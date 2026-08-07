/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import type {MetricCategory} from '../../../src/operations/metrics/index.js';
import {parseSeriesTags, type MetricsTagContext, type MetricSeriesTags} from '../../../src/operations/metrics/tags.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GOLDEN_PATH = path.resolve(__dirname, '../../../specs/metrics-tags.golden.json');

interface GoldenTestCase {
  category: MetricCategory;
  metricId: string;
  seriesId: string;
  context: MetricsTagContext;
  expectedTags: MetricSeriesTags;
  description?: string;
}

interface GoldenFixture {
  version: string;
  generatedAt: string;
  description: string;
  testCases: GoldenTestCase[];
}

describe('parseSeriesTags (golden fixture)', () => {
  let fixture: GoldenFixture;

  before(() => {
    const raw = fs.readFileSync(GOLDEN_PATH, 'utf-8');
    fixture = JSON.parse(raw);
  });

  it('should have a valid golden fixture', () => {
    expect(fixture.version).to.equal('1.0.0');
    expect(fixture.testCases).to.be.an('array').with.length.greaterThan(0);
  });

  for (const tc of JSON.parse(fs.readFileSync(GOLDEN_PATH, 'utf-8')).testCases as GoldenTestCase[]) {
    it(tc.description ?? `${tc.category}:${tc.metricId} "${tc.seriesId}"`, () => {
      const actual = parseSeriesTags({
        category: tc.category,
        metricId: tc.metricId,
        seriesId: tc.seriesId,
        context: tc.context,
      });
      expect(actual).to.deep.equal(tc.expectedTags);
    });
  }
});
