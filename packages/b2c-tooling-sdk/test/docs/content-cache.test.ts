/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';

import {
  clearContentCache,
  getCachedContent,
  setCachedContent,
  DEFAULT_CACHE_TTL_MS,
} from '@salesforce/b2c-tooling-sdk/docs';

describe('docs: online content cache', () => {
  // Use a unique URL per test so the on-disk cache (shared OS cache dir) never
  // collides across runs; clear the in-memory tier before each.
  beforeEach(() => clearContentCache(false));

  it('returns undefined on a miss', () => {
    expect(getCachedContent(`https://example.test/miss-${Date.now()}-${Math.round(performance.now())}.md`)).to.equal(
      undefined,
    );
  });

  it('round-trips content through the cache (memory + disk)', () => {
    const url = `https://example.test/roundtrip-${process.pid}-${performance.now()}.md`;
    setCachedContent(url, '# Hello\n\nbody');
    expect(getCachedContent(url)).to.equal('# Hello\n\nbody');
  });

  it('treats a disk entry older than the TTL as a miss', () => {
    const url = `https://example.test/ttl-${process.pid}-${performance.now()}.md`;
    setCachedContent(url, 'stale');
    // In-memory always hits, so clear it to force the disk path, then use a 0ms TTL.
    clearContentCache(false);
    expect(getCachedContent(url, 0)).to.equal(undefined);
  });

  it('clearContentCache(false) drops the in-memory tier but keeps disk', () => {
    const url = `https://example.test/mem-${process.pid}-${performance.now()}.md`;
    setCachedContent(url, 'persisted');
    clearContentCache(false);
    // Still resolvable from disk within the default TTL.
    expect(getCachedContent(url, DEFAULT_CACHE_TTL_MS)).to.equal('persisted');
  });
});
