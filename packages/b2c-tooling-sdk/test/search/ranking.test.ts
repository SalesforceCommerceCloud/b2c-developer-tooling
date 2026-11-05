/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';

import {createRankedIndex, expandQueryTerm, synonymTermBoost} from '../../src/search/ranking.js';

describe('search/ranking', () => {
  describe('expandQueryTerm', () => {
    it('lowercases terms without synonyms', () => {
      expect(expandQueryTerm('Bundle')).to.deep.equal(['bundle']);
    });

    it('expands a synonym, keeping the typed term first', () => {
      expect(expandQueryTerm('Limits')).to.deep.equal(['limits', 'limitation', 'constraint', 'quota']);
      expect(expandQueryTerm('constraint')).to.deep.equal(['constraint', 'limit', 'limitation', 'quota']);
    });
  });

  describe('synonymTermBoost', () => {
    it('keeps full weight for the typed term and down-weights its expansions', () => {
      const terms = ['mrt', ...expandQueryTerm('limits')];
      expect(synonymTermBoost('mrt', 0, terms)).to.equal(1);
      expect(synonymTermBoost('limits', 1, terms)).to.equal(1);
      expect(synonymTermBoost('constraint', 3, terms)).to.be.lessThan(1);
    });
  });

  describe('createRankedIndex', () => {
    const index = createRankedIndex([
      {id: 'overview', title: 'Managed Runtime Overview', headings: 'Environments • Constraints'},
      {id: 'limits', title: 'Managed Runtime Limits'},
      {id: 'unrelated', title: 'Product Search'},
    ]);

    it('finds a document through a synonym of the query term', () => {
      const ids = index.search('managed runtime limits').map((r) => r.id);
      expect(ids).to.include('overview');
    });

    it('ranks the literal match above the synonym match', () => {
      const ids = index.search('managed runtime limits').map((r) => r.id);
      expect(ids.indexOf('limits')).to.be.lessThan(ids.indexOf('overview'));
    });
  });
});
