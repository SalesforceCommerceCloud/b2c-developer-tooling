/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  booleanLiteral,
  dateLiteral,
  escapeSqlString,
  integerLiteral,
  isReservedIdentifier,
  quoteIdentifierIfReserved,
  stringInList,
  stringLiteral,
} from '../../../src/operations/cip/sql.js';

describe('operations/cip sql helpers', () => {
  describe('escapeSqlString', () => {
    it('doubles embedded single quotes', () => {
      expect(escapeSqlString("O'Brien")).to.equal("O''Brien");
      expect(escapeSqlString("a'b'c")).to.equal("a''b''c");
    });

    it('leaves quote-free strings unchanged', () => {
      expect(escapeSqlString('Sites-RefArch-Site')).to.equal('Sites-RefArch-Site');
    });
  });

  describe('quoteIdentifierIfReserved / isReservedIdentifier', () => {
    it('quotes Calcite reserved words case-insensitively', () => {
      expect(quoteIdentifierIfReserved('method')).to.equal('"method"');
      expect(quoteIdentifierIfReserved('METHOD')).to.equal('"METHOD"');
      expect(quoteIdentifierIfReserved('date')).to.equal('"date"');
      expect(quoteIdentifierIfReserved('value')).to.equal('"value"');
      expect(quoteIdentifierIfReserved('year')).to.equal('"year"');
      expect(quoteIdentifierIfReserved('user')).to.equal('"user"');
      expect(quoteIdentifierIfReserved('rows')).to.equal('"rows"');
    });

    it('leaves non-reserved identifiers unquoted', () => {
      expect(quoteIdentifierIfReserved('api_name')).to.equal('api_name');
      expect(quoteIdentifierIfReserved('controller_name')).to.equal('controller_name');
      expect(quoteIdentifierIfReserved('query')).to.equal('query');
    });

    it('reports reserved status', () => {
      expect(isReservedIdentifier('method')).to.equal(true);
      expect(isReservedIdentifier('api_name')).to.equal(false);
    });
  });

  describe('stringLiteral', () => {
    it('quotes and escapes', () => {
      expect(stringLiteral('Sites-RefArch-Site')).to.equal("'Sites-RefArch-Site'");
      expect(stringLiteral("O'Brien")).to.equal("'O''Brien'");
    });
  });

  describe('dateLiteral', () => {
    it('accepts YYYY-MM-DD', () => {
      expect(dateLiteral('2026-05-01')).to.equal("'2026-05-01'");
    });

    it('rejects malformed dates', () => {
      expect(() => dateLiteral('2026/05/01')).to.throw('Invalid date');
      expect(() => dateLiteral("2026-05-01'; DROP")).to.throw('Invalid date');
      expect(() => dateLiteral('not-a-date')).to.throw('Invalid date');
    });
  });

  describe('booleanLiteral', () => {
    it('accepts true/false case-insensitively', () => {
      expect(booleanLiteral('true')).to.equal('true');
      expect(booleanLiteral('TRUE')).to.equal('true');
      expect(booleanLiteral('False')).to.equal('false');
    });

    it('rejects non-boolean values', () => {
      expect(() => booleanLiteral('yes')).to.throw('Invalid boolean');
      expect(() => booleanLiteral('1')).to.throw('Invalid boolean');
    });
  });

  describe('integerLiteral', () => {
    it('accepts integers within range', () => {
      expect(integerLiteral('20', 1, 500)).to.equal('20');
      expect(integerLiteral('1', 1, 500)).to.equal('1');
      expect(integerLiteral('500', 1, 500)).to.equal('500');
    });

    it('rejects out-of-range, non-integer, or injection values', () => {
      expect(() => integerLiteral('0', 1, 500)).to.throw('Invalid integer');
      expect(() => integerLiteral('501', 1, 500)).to.throw('Invalid integer');
      expect(() => integerLiteral('1.5', 1, 500)).to.throw('Invalid integer');
      expect(() => integerLiteral('5; DROP', 1, 500)).to.throw('Invalid integer');
      expect(() => integerLiteral('abc', 1, 500)).to.throw('Invalid integer');
    });
  });

  describe('stringInList', () => {
    it('builds an escaped, comma-separated list', () => {
      expect(stringInList(['HIT', 'MISS'])).to.equal("'HIT', 'MISS'");
      expect(stringInList(["a'b"])).to.equal("'a''b'");
    });

    it('throws on empty input', () => {
      expect(() => stringInList([])).to.throw('empty');
    });
  });
});
