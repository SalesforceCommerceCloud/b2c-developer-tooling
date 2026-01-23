/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {wrapExpression} from '@salesforce/b2c-tooling-sdk/operations/script';

describe('operations/script/eval', () => {
  describe('wrapExpression', () => {
    it('returns simple expressions unchanged', () => {
      const expr = '1+1';
      expect(wrapExpression(expr)).to.equal('1+1');
    });

    it('returns single function call unchanged', () => {
      const expr = 'dw.system.Site.getCurrent().getName()';
      expect(wrapExpression(expr)).to.equal('dw.system.Site.getCurrent().getName()');
    });

    it('returns single expression with whitespace unchanged', () => {
      const expr = '  dw.system.Site.getCurrent()  ';
      expect(wrapExpression(expr)).to.equal('dw.system.Site.getCurrent()');
    });

    it('wraps multi-statement code with semicolons', () => {
      const expr = 'var x = 1; x + 1';
      const wrapped = wrapExpression(expr);
      expect(wrapped).to.match(/^\(new Function\('.*'\)\)\(\)$/);
      expect(wrapped).to.include('return x + 1');
    });

    it('wraps multi-line code', () => {
      const expr = `var site = dw.system.Site.getCurrent();
site.getName()`;
      const wrapped = wrapExpression(expr);
      expect(wrapped).to.match(/^\(new Function\('.*'\)\)\(\)$/);
      expect(wrapped).to.include('return site.getName()');
    });

    it('does not add return to variable declarations', () => {
      const expr = 'var x = 1; var y = 2';
      const wrapped = wrapExpression(expr);
      // Should not add return before var declaration
      expect(wrapped).not.to.include('return var');
    });

    it('escapes single quotes in multi-statement code', () => {
      const expr = "var x = 'hello'; x";
      const wrapped = wrapExpression(expr);
      expect(wrapped).to.include("\\'hello\\'");
    });

    it('escapes backslashes in multi-statement code', () => {
      const expr = 'var x = "a\\nb"; x';
      const wrapped = wrapExpression(expr);
      // Backslash should be escaped
      expect(wrapped).to.include('\\\\n');
    });

    it('handles code that already has return statement', () => {
      const expr = 'var x = 1; return x + 1';
      const wrapped = wrapExpression(expr);
      expect(wrapped).to.match(/^\(new Function\('.*'\)\)\(\)$/);
      // Should not add double return
      expect(wrapped.match(/return/g)?.length).to.equal(1);
    });

    it('handles empty expressions', () => {
      expect(wrapExpression('')).to.equal('');
      expect(wrapExpression('   ')).to.equal('');
    });

    it('handles expression ending with semicolon', () => {
      const expr = 'var x = 1; x;';
      const wrapped = wrapExpression(expr);
      expect(wrapped).to.match(/^\(new Function\('.*'\)\)\(\)$/);
      expect(wrapped).to.include('return x;');
    });
  });
});
