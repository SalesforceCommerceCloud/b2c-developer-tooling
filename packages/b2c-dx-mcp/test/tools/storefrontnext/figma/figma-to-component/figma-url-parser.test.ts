/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {parseFigmaUrl} from '../../../../../src/tools/storefrontnext/figma/figma-to-component/figma-url-parser.js';

describe('parseFigmaUrl', () => {
  describe('Valid URLs', () => {
    it('parses Figma design URL with node-id', () => {
      const url = 'https://figma.com/design/abc123/MyFile?node-id=1-2';
      const result = parseFigmaUrl(url);

      expect(result).to.deep.equal({
        fileKey: 'abc123',
        nodeId: '1:2',
      });
    });

    it('parses Figma file URL with node-id', () => {
      const url = 'https://figma.com/file/xyz789/AnotherFile?node-id=10-20';
      const result = parseFigmaUrl(url);

      expect(result).to.deep.equal({
        fileKey: 'xyz789',
        nodeId: '10:20',
      });
    });
  });

  describe('Invalid URLs', () => {
    it('throws error for non-Figma URL', () => {
      const url = 'https://example.com/design/abc123/MyFile?node-id=1-2';

      expect(() => parseFigmaUrl(url)).to.throw('URL must be from figma.com');
    });

    it('throws error when node-id parameter is missing', () => {
      const url = 'https://figma.com/design/abc123/MyFile';

      expect(() => parseFigmaUrl(url)).to.throw(
        'Could not extract node-id from URL. Expected query parameter: ?node-id=1-2',
      );
    });

    it('throws error for malformed URL', () => {
      const url = 'not-a-valid-url';

      expect(() => parseFigmaUrl(url)).to.throw('Invalid URL format');
    });

    it('throws error when URL path does not match /design/ or /file/ pattern', () => {
      const url = 'https://figma.com/board/abc123/MyBoard?node-id=1-2';

      expect(() => parseFigmaUrl(url)).to.throw('Could not extract fileKey from URL');
    });
  });
});
