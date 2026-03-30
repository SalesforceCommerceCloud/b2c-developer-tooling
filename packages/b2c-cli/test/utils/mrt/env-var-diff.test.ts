/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {filterByPrefix, computeEnvVarDiff, formatEnvVarDiffSummary} from '../../../src/utils/mrt/env-var-diff.js';

describe('utils/mrt/env-var-diff', () => {
  describe('filterByPrefix', () => {
    it('filters out vars whose keys start with excluded prefixes', () => {
      const vars = new Map([
        ['PUBLIC__app__site__locale', 'en-US'],
        ['MRT_PROJECT', 'my-project'],
        ['MRT_TARGET', 'staging'],
        ['SOME_VAR', 'value'],
      ]);
      const result = filterByPrefix(vars, ['MRT_']);
      expect(result.has('PUBLIC__app__site__locale')).to.be.true;
      expect(result.has('SOME_VAR')).to.be.true;
      expect(result.has('MRT_PROJECT')).to.be.false;
      expect(result.has('MRT_TARGET')).to.be.false;
    });

    it('supports multiple exclude prefixes', () => {
      const vars = new Map([
        ['SFCC_API_KEY', 'secret'],
        ['MRT_PROJECT', 'my-project'],
        ['PUBLIC__foo', 'bar'],
      ]);
      const result = filterByPrefix(vars, ['SFCC_', 'MRT_']);
      expect(result.has('PUBLIC__foo')).to.be.true;
      expect(result.has('SFCC_API_KEY')).to.be.false;
      expect(result.has('MRT_PROJECT')).to.be.false;
    });

    it('returns all vars when exclude list is empty', () => {
      const vars = new Map([
        ['FOO', 'bar'],
        ['BAZ', 'qux'],
      ]);
      const result = filterByPrefix(vars, []);
      expect(result.size).to.equal(2);
    });

    it('returns empty map for empty input', () => {
      expect(filterByPrefix(new Map(), ['MRT_']).size).to.equal(0);
    });

    it('returns empty map when all vars match a prefix', () => {
      const vars = new Map([
        ['MRT_A', '1'],
        ['MRT_B', '2'],
      ]);
      expect(filterByPrefix(vars, ['MRT_']).size).to.equal(0);
    });
  });

  describe('computeEnvVarDiff', () => {
    it('classifies local-only vars as add', () => {
      const local = new Map([['NEW_VAR', 'value']]);
      const remote = new Map<string, string>();
      const diff = computeEnvVarDiff(local, remote);
      expect(diff.add).to.deep.include({key: 'NEW_VAR', value: 'value'});
      expect(diff.update).to.have.lengthOf(0);
      expect(diff.unchanged).to.have.lengthOf(0);
      expect(diff.remoteOnly).to.have.lengthOf(0);
    });

    it('classifies vars present in both with different values as update', () => {
      const local = new Map([['EXISTING', 'new-value']]);
      const remote = new Map([['EXISTING', 'old-value']]);
      const diff = computeEnvVarDiff(local, remote);
      expect(diff.update).to.deep.include({key: 'EXISTING', value: 'new-value', oldValue: 'old-value'});
      expect(diff.add).to.have.lengthOf(0);
    });

    it('classifies vars present in both with same values as unchanged', () => {
      const local = new Map([['SAME', 'value']]);
      const remote = new Map([['SAME', 'value']]);
      const diff = computeEnvVarDiff(local, remote);
      expect(diff.unchanged).to.deep.include({key: 'SAME', value: 'value'});
      expect(diff.add).to.have.lengthOf(0);
      expect(diff.update).to.have.lengthOf(0);
    });

    it('classifies remote-only vars as remoteOnly', () => {
      const local = new Map<string, string>();
      const remote = new Map([['REMOTE_ONLY', 'value']]);
      const diff = computeEnvVarDiff(local, remote);
      expect(diff.remoteOnly).to.deep.include({key: 'REMOTE_ONLY', value: 'value'});
    });

    it('handles all four categories together', () => {
      const local = new Map([
        ['ADD_VAR', 'new'],
        ['UPDATE_VAR', 'updated'],
        ['SAME_VAR', 'same'],
      ]);
      const remote = new Map([
        ['UPDATE_VAR', 'old'],
        ['SAME_VAR', 'same'],
        ['REMOTE_ONLY_VAR', 'remote'],
      ]);
      const diff = computeEnvVarDiff(local, remote);
      expect(diff.add).to.have.lengthOf(1);
      expect(diff.update).to.have.lengthOf(1);
      expect(diff.unchanged).to.have.lengthOf(1);
      expect(diff.remoteOnly).to.have.lengthOf(1);
    });

    it('returns all-empty diff when both maps are empty', () => {
      const diff = computeEnvVarDiff(new Map(), new Map());
      expect(diff.add).to.have.lengthOf(0);
      expect(diff.update).to.have.lengthOf(0);
      expect(diff.unchanged).to.have.lengthOf(0);
      expect(diff.remoteOnly).to.have.lengthOf(0);
    });

    it('returns all-unchanged when local and remote are identical', () => {
      const vars = new Map([['A', '1'], ['B', '2']]);
      const diff = computeEnvVarDiff(vars, vars);
      expect(diff.unchanged).to.have.lengthOf(2);
      expect(diff.add).to.have.lengthOf(0);
      expect(diff.update).to.have.lengthOf(0);
    });
  });

  describe('formatEnvVarDiffSummary', () => {
    it('produces "nothing to sync" message when no add or update', () => {
      const diff = {
        add: [],
        update: [],
        unchanged: [{key: 'SAME', value: 'v'}],
        remoteOnly: [],
      };
      const summary = formatEnvVarDiffSummary(diff);
      expect(summary).to.match(/nothing to sync|no changes|up.?to.?date/i);
    });

    it('includes add entries with + marker', () => {
      const diff = {
        add: [{key: 'NEW_VAR', value: 'new-value'}],
        update: [],
        unchanged: [],
        remoteOnly: [],
      };
      const summary = formatEnvVarDiffSummary(diff);
      expect(summary).to.include('NEW_VAR');
      expect(summary).to.match(/\+/);
    });

    it('includes update entries with ~ marker', () => {
      const diff = {
        add: [],
        update: [{key: 'UPD_VAR', value: 'new', oldValue: 'old'}],
        unchanged: [],
        remoteOnly: [],
      };
      const summary = formatEnvVarDiffSummary(diff);
      expect(summary).to.include('UPD_VAR');
      expect(summary).to.match(/~/);
    });

    it('includes unchanged entries as context', () => {
      const diff = {
        add: [{key: 'ADD_VAR', value: 'v'}],
        update: [],
        unchanged: [{key: 'SAME_VAR', value: 'v'}],
        remoteOnly: [],
      };
      const summary = formatEnvVarDiffSummary(diff);
      expect(summary).to.include('SAME_VAR');
    });

    it('includes remote-only entries with a note that they are not deleted', () => {
      const diff = {
        add: [{key: 'ADD_VAR', value: 'v'}],
        update: [],
        unchanged: [],
        remoteOnly: [{key: 'REMOTE_VAR', value: 'v'}],
      };
      const summary = formatEnvVarDiffSummary(diff);
      expect(summary).to.include('REMOTE_VAR');
    });

    it('shows values in the output', () => {
      const diff = {
        add: [{key: 'API_KEY', value: 'secret-123'}],
        update: [],
        unchanged: [],
        remoteOnly: [],
      };
      const summary = formatEnvVarDiffSummary(diff);
      expect(summary).to.include('secret-123');
    });

    it('shows old and new values for updates', () => {
      const diff = {
        add: [],
        update: [{key: 'FOO', value: 'new-val', oldValue: 'old-val'}],
        unchanged: [],
        remoteOnly: [],
      };
      const summary = formatEnvVarDiffSummary(diff);
      expect(summary).to.include('old-val');
      expect(summary).to.include('new-val');
    });
  });
});
