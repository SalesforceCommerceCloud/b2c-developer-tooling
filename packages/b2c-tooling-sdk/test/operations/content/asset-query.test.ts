/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {extractAssetPaths} from '@salesforce/b2c-tooling-sdk/operations/content';

describe('operations/content/asset-query', () => {
  describe('extractAssetPaths', () => {
    it('extracts a value at a simple path', () => {
      const data = {image: {path: '/images/hero.jpg'}};
      const result = extractAssetPaths(data, ['image.path']);

      expect(result).to.deep.equal(['/images/hero.jpg']);
    });

    it('extracts a value at a nested path', () => {
      const data = {banner: {image: {path: '/images/banner.png'}}};
      const result = extractAssetPaths(data, ['banner.image.path']);

      expect(result).to.deep.equal(['/images/banner.png']);
    });

    it('extracts values from multiple queries', () => {
      const data = {
        hero: {src: '/images/hero.jpg'},
        logo: {src: '/images/logo.png'},
      };
      const result = extractAssetPaths(data, ['hero.src', 'logo.src']);

      expect(result).to.deep.equal(['/images/hero.jpg', '/images/logo.png']);
    });

    it('traverses arrays with wildcard *', () => {
      const data = {
        slides: [{image: {src: '/images/a.jpg'}}, {image: {src: '/images/b.jpg'}}, {image: {src: '/images/c.jpg'}}],
      };
      const result = extractAssetPaths(data, ['slides.*.image.src']);

      expect(result).to.deep.equal(['/images/a.jpg', '/images/b.jpg', '/images/c.jpg']);
    });

    it('returns empty array when an intermediate segment is missing', () => {
      const data = {banner: {title: 'Hello'}};
      const result = extractAssetPaths(data, ['banner.image.path']);

      expect(result).to.deep.equal([]);
    });

    it('returns empty array when an intermediate segment is null', () => {
      const data = {banner: {image: null}};
      const result = extractAssetPaths(data, ['banner.image.path']);

      expect(result).to.deep.equal([]);
    });

    it('returns empty array for an empty data object', () => {
      const result = extractAssetPaths({}, ['image.path']);

      expect(result).to.deep.equal([]);
    });

    it('returns empty array for an empty queries array', () => {
      const data = {image: {path: '/images/hero.jpg'}};
      const result = extractAssetPaths(data, []);

      expect(result).to.deep.equal([]);
    });

    it('does not include non-string terminal values', () => {
      const data = {
        count: {value: 42},
        flag: {value: true},
        nested: {value: {deeper: 'something'}},
      };
      const result = extractAssetPaths(data, ['count.value', 'flag.value', 'nested.value']);

      expect(result).to.deep.equal([]);
    });

    it('does not include empty string values', () => {
      const data = {image: {path: ''}};
      const result = extractAssetPaths(data, ['image.path']);

      expect(result).to.deep.equal([]);
    });
  });
});
