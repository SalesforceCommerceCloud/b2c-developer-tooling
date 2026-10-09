/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {readSchemaByQuery, searchSchemas} from '@salesforce/b2c-tooling-sdk/docs';

describe('docs/schema search', () => {
  it('matches compound schema IDs from spaced or hyphenated queries', () => {
    expect(searchSchemas('gift certificate')[0].entry.id).to.equal('giftcertificate');
    expect(searchSchemas('price-book')[0].entry.id).to.equal('pricebook');
    expect(searchSchemas('customer list', 2).map((result) => result.entry.id)).to.deep.equal([
      'customerlist',
      'customerlist2',
    ]);
  });

  it('tolerates typos and prefixes, best match first', () => {
    expect(searchSchemas('custmer')[0].entry.id).to.equal('customer');
    expect(searchSchemas('promo')[0].entry.id).to.equal('promotion');
    const scores = searchSchemas('payment').map((result) => result.score);
    expect(scores).to.deep.equal([...scores].sort((a, b) => b - a));
    expect(searchSchemas('xyzzy')).to.deep.equal([]);
  });

  it('reads by exact ID first, then by best fuzzy match', () => {
    expect(readSchemaByQuery('search')?.entry.id).to.equal('search');
    const result = readSchemaByQuery('url rules');
    expect(result?.entry.id).to.equal('urlrules');
    expect(result?.content).to.include('<?xml');
    expect(readSchemaByQuery('xyzzy')).to.equal(null);
  });
});
