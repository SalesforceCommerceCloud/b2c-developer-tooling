/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {mergeJson, insertAfter, insertBefore, appendContent, prependContent} from '../../src/scaffold/merge.js';

describe('scaffold/merge', () => {
  describe('mergeJson', () => {
    it('should merge objects at root level', () => {
      const existing = JSON.stringify({a: 1, b: 2});
      const newContent = JSON.stringify({c: 3});
      const result = JSON.parse(mergeJson(existing, newContent));

      expect(result).to.deep.equal({a: 1, b: 2, c: 3});
    });

    it('should merge arrays by appending unique items', () => {
      const existing = JSON.stringify({items: [1, 2, 3]});
      const newContent = JSON.stringify({items: [3, 4, 5]});
      const result = JSON.parse(mergeJson(existing, newContent));

      expect(result.items).to.deep.equal([1, 2, 3, 4, 5]);
    });

    it('should merge at a specific JSON path', () => {
      const existing = JSON.stringify({
        hooks: [{name: 'existing'}],
      });
      const newContent = JSON.stringify([{name: 'new'}]);
      const result = JSON.parse(mergeJson(existing, newContent, {jsonPath: 'hooks'}));

      expect(result.hooks).to.deep.equal([{name: 'existing'}, {name: 'new'}]);
    });

    it('should create path if it does not exist', () => {
      const existing = JSON.stringify({});
      const newContent = JSON.stringify([{id: 'step1'}]);
      const result = JSON.parse(mergeJson(existing, newContent, {jsonPath: 'step-types'}));

      expect(result['step-types']).to.deep.equal([{id: 'step1'}]);
    });

    it('should create nested path', () => {
      const existing = JSON.stringify({});
      const newContent = JSON.stringify({value: 'test'});
      const result = JSON.parse(mergeJson(existing, newContent, {jsonPath: 'a.b.c'}));

      expect(result.a.b.c).to.deep.equal({value: 'test'});
    });

    it('should deep merge nested objects', () => {
      const existing = JSON.stringify({
        config: {a: 1, b: {x: 1}},
      });
      const newContent = JSON.stringify({
        config: {c: 3, b: {y: 2}},
      });
      const result = JSON.parse(mergeJson(existing, newContent));

      expect(result.config).to.deep.equal({a: 1, b: {x: 1, y: 2}, c: 3});
    });

    it('should accept object as newContent', () => {
      const existing = JSON.stringify({a: 1});
      const newContent = {b: 2};
      const result = JSON.parse(mergeJson(existing, newContent));

      expect(result).to.deep.equal({a: 1, b: 2});
    });
  });

  describe('insertAfter', () => {
    it('should insert content after marker with proper newlines', () => {
      const existing = 'line1\nMARKER\nline3';
      const result = insertAfter(existing, 'inserted', 'MARKER');
      // Existing has newline after MARKER, content inserted, newline before remaining content
      expect(result).to.equal('line1\nMARKER\ninserted\nline3');
    });

    it('should throw if marker not found', () => {
      const existing = 'line1\nline2';

      expect(() => insertAfter(existing, 'content', 'MISSING')).to.throw('Marker not found');
    });

    it('should handle marker at end of file', () => {
      const existing = 'line1\nMARKER';
      const result = insertAfter(existing, 'inserted', 'MARKER');

      expect(result).to.equal('line1\nMARKER\ninserted');
    });

    it('should handle content that already ends with newline', () => {
      const existing = 'before\nMARKER\nafter';
      const result = insertAfter(existing, 'inserted\n', 'MARKER');
      // Content ends with newline, next line is preserved
      expect(result).to.equal('before\nMARKER\ninserted\nafter');
    });
  });

  describe('insertBefore', () => {
    it('should insert content before marker with newline', () => {
      const existing = 'line1\nMARKER\nline3';
      const result = insertBefore(existing, 'inserted', 'MARKER');
      // Content gets newline after since it doesn't end with one
      expect(result).to.equal('line1\ninserted\nMARKER\nline3');
    });

    it('should throw if marker not found', () => {
      const existing = 'line1\nline2';

      expect(() => insertBefore(existing, 'content', 'MISSING')).to.throw('Marker not found');
    });

    it('should handle marker at start of file', () => {
      const existing = 'MARKER\nline2';
      const result = insertBefore(existing, 'inserted', 'MARKER');
      // Content gets newline after it, no newline before since at start
      expect(result).to.equal('inserted\nMARKER\nline2');
    });

    it('should not add extra newline if content ends with one', () => {
      const existing = 'before\nMARKER\nafter';
      const result = insertBefore(existing, 'inserted\n', 'MARKER');
      // Content ends with newline, so no extra newline needed
      expect(result).to.equal('before\ninserted\nMARKER\nafter');
    });
  });

  describe('appendContent', () => {
    it('should append content to end of file', () => {
      const existing = 'line1\nline2';
      const result = appendContent(existing, 'line3');

      expect(result).to.equal('line1\nline2\nline3');
    });

    it('should handle empty existing content', () => {
      const existing = '';
      const result = appendContent(existing, 'content');

      expect(result).to.equal('content');
    });

    it('should not add extra newline if existing ends with newline', () => {
      const existing = 'line1\n';
      const result = appendContent(existing, 'line2');

      expect(result).to.equal('line1\nline2');
    });
  });

  describe('prependContent', () => {
    it('should prepend content to start of file', () => {
      const existing = 'line2\nline3';
      const result = prependContent(existing, 'line1');

      expect(result).to.equal('line1\nline2\nline3');
    });

    it('should handle empty existing content', () => {
      const existing = '';
      const result = prependContent(existing, 'content');

      expect(result).to.equal('content');
    });

    it('should not add extra newline if new content ends with newline', () => {
      const existing = 'line2';
      const result = prependContent(existing, 'line1\n');

      expect(result).to.equal('line1\nline2');
    });
  });
});
