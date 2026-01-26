/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {createPathNormalizer, extractPaths} from '@salesforce/b2c-tooling-sdk/operations/logs';

describe('operations/logs/path-normalizer', () => {
  describe('createPathNormalizer', () => {
    it('normalizes paths in parentheses', () => {
      const normalize = createPathNormalizer({cartridgePath: './cartridges'})!;
      const input = 'Error occurred (app_storefront/cartridge/controllers/Home.js:45)';
      const expected = 'Error occurred (./cartridges/app_storefront/cartridge/controllers/Home.js:45)';

      expect(normalize(input)).to.equal(expected);
    });

    it('normalizes paths in single quotes', () => {
      const normalize = createPathNormalizer({cartridgePath: './cartridges'})!;
      const input = "Loading module 'app_site/cartridge/scripts/utils.js'";
      const expected = "Loading module './cartridges/app_site/cartridge/scripts/utils.js'";

      expect(normalize(input)).to.equal(expected);
    });

    it('normalizes paths in double quotes', () => {
      const normalize = createPathNormalizer({cartridgePath: './cartridges'})!;
      const input = 'Loading module "app_site/cartridge/scripts/utils.js"';
      const expected = 'Loading module "./cartridges/app_site/cartridge/scripts/utils.js"';

      expect(normalize(input)).to.equal(expected);
    });

    it('normalizes stack trace paths', () => {
      const normalize = createPathNormalizer({cartridgePath: './cartridges'})!;
      const input = 'Stack trace: at app_storefront/cartridge/controllers/Home.js:45:12';
      const expected = 'Stack trace: at ./cartridges/app_storefront/cartridge/controllers/Home.js:45:12';

      expect(normalize(input)).to.equal(expected);
    });

    it('handles multiple paths in one message', () => {
      const normalize = createPathNormalizer({cartridgePath: './cartridges'})!;
      const input =
        "Error in (app_storefront/cartridge/controllers/Home.js:45) called from 'app_site/cartridge/scripts/helpers.js:10'";
      const expected =
        "Error in (./cartridges/app_storefront/cartridge/controllers/Home.js:45) called from './cartridges/app_site/cartridge/scripts/helpers.js:10'";

      expect(normalize(input)).to.equal(expected);
    });

    it('handles absolute cartridge paths', () => {
      const normalize = createPathNormalizer({cartridgePath: '/Users/dev/project/cartridges'})!;
      const input = 'Error occurred (app_storefront/cartridge/controllers/Home.js:45)';
      const expected = 'Error occurred (/Users/dev/project/cartridges/app_storefront/cartridge/controllers/Home.js:45)';

      expect(normalize(input)).to.equal(expected);
    });

    it('strips trailing slashes from cartridge path', () => {
      const normalize = createPathNormalizer({cartridgePath: './cartridges/'})!;
      const input = 'Error occurred (app_storefront/cartridge/controllers/Home.js:45)';
      const expected = 'Error occurred (./cartridges/app_storefront/cartridge/controllers/Home.js:45)';

      expect(normalize(input)).to.equal(expected);
    });

    it('does not modify messages without cartridge paths', () => {
      const normalize = createPathNormalizer({cartridgePath: './cartridges'})!;
      const input = 'This is a regular error message without paths';

      expect(normalize(input)).to.equal(input);
    });

    it('handles paths with hyphens and underscores in cartridge names', () => {
      const normalize = createPathNormalizer({cartridgePath: './cartridges'})!;
      const input = 'Error in (app_storefront-base_v2/cartridge/controllers/Home.js:45)';
      const expected = 'Error in (./cartridges/app_storefront-base_v2/cartridge/controllers/Home.js:45)';

      expect(normalize(input)).to.equal(expected);
    });
  });

  describe('extractPaths', () => {
    it('extracts paths from parentheses', () => {
      const paths = extractPaths('Error occurred (app_storefront/cartridge/controllers/Home.js:45)');

      expect(paths).to.deep.equal(['app_storefront/cartridge/controllers/Home.js:45']);
    });

    it('extracts paths from quotes', () => {
      const paths = extractPaths("Loading 'app_site/cartridge/scripts/utils.js'");

      expect(paths).to.deep.equal(['app_site/cartridge/scripts/utils.js']);
    });

    it('extracts paths from stack traces', () => {
      const paths = extractPaths('Stack trace: at app_storefront/cartridge/controllers/Home.js:45:12');

      expect(paths).to.deep.equal(['app_storefront/cartridge/controllers/Home.js:45:12']);
    });

    it('extracts multiple unique paths', () => {
      const paths = extractPaths(
        "Error in (app_storefront/cartridge/controllers/Home.js:45) from 'app_site/cartridge/scripts/helpers.js:10'",
      );

      expect(paths).to.have.length(2);
      expect(paths).to.include('app_storefront/cartridge/controllers/Home.js:45');
      expect(paths).to.include('app_site/cartridge/scripts/helpers.js:10');
    });

    it('returns empty array when no paths found', () => {
      const paths = extractPaths('Regular error message without paths');

      expect(paths).to.deep.equal([]);
    });

    it('deduplicates repeated paths', () => {
      const paths = extractPaths(
        '(app_storefront/cartridge/controllers/Home.js:45) and again (app_storefront/cartridge/controllers/Home.js:45)',
      );

      expect(paths).to.deep.equal(['app_storefront/cartridge/controllers/Home.js:45']);
    });
  });
});
