/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as assert from 'assert';
import {
  CLONE_IN_PROGRESS_STATES,
  TRANSITIONAL_STATES,
  computeSandboxDisplay,
  getActiveCloneSourceIds,
  getRealmInstanceId,
  type SandboxLike,
} from './sandbox-clone-helpers.js';

function sandbox(partial: Partial<SandboxLike> & {id: string}): SandboxLike {
  return {...partial};
}

suite('sandbox-clone-helpers', () => {
  suite('getRealmInstanceId', () => {
    test('joins realm and instance', () => {
      assert.strictEqual(getRealmInstanceId(sandbox({id: 'x', realm: 'zzzz', instance: '004'})), 'zzzz-004');
    });

    test('returns undefined when either field is missing', () => {
      assert.strictEqual(getRealmInstanceId(sandbox({id: 'x', realm: 'zzzz'})), undefined);
      assert.strictEqual(getRealmInstanceId(sandbox({id: 'x', instance: '004'})), undefined);
      assert.strictEqual(getRealmInstanceId(sandbox({id: 'x'})), undefined);
    });
  });

  suite('getActiveCloneSourceIds', () => {
    test('collects clonedFrom when target is in a clone-in-setup state', () => {
      const list: SandboxLike[] = [
        sandbox({id: 'src', realm: 'zzzz', instance: '004', state: 'started'}),
        sandbox({id: 'tgt', realm: 'zzzz', instance: '005', state: 'cloning', clonedFrom: 'zzzz-004'}),
      ];
      const sources = getActiveCloneSourceIds(list);
      assert.deepStrictEqual([...sources], ['zzzz-004']);
    });

    test('treats creating + clonedFrom as in-progress', () => {
      const list: SandboxLike[] = [
        sandbox({id: 'tgt', realm: 'zzzz', instance: '005', state: 'creating', clonedFrom: 'zzzz-004'}),
      ];
      assert.ok(getActiveCloneSourceIds(list).has('zzzz-004'));
    });

    test('treats failed + clonedFrom as in-progress (clone setting up)', () => {
      const list: SandboxLike[] = [
        sandbox({id: 'tgt', realm: 'zzzz', instance: '005', state: 'failed', clonedFrom: 'zzzz-004'}),
      ];
      assert.ok(getActiveCloneSourceIds(list).has('zzzz-004'));
    });

    test('ignores cloned sandboxes that are already started', () => {
      const list: SandboxLike[] = [
        sandbox({id: 'tgt', realm: 'zzzz', instance: '005', state: 'started', clonedFrom: 'zzzz-004'}),
      ];
      assert.strictEqual(getActiveCloneSourceIds(list).size, 0);
    });

    test('ignores sandboxes without clonedFrom', () => {
      const list: SandboxLike[] = [sandbox({id: 'src', realm: 'zzzz', instance: '004', state: 'cloning'})];
      assert.strictEqual(getActiveCloneSourceIds(list).size, 0);
    });

    test('handles empty clonedFrom string as absent', () => {
      const list: SandboxLike[] = [
        sandbox({id: 'tgt', realm: 'zzzz', instance: '005', state: 'failed', clonedFrom: ''}),
      ];
      assert.strictEqual(getActiveCloneSourceIds(list).size, 0);
    });
  });

  suite('computeSandboxDisplay', () => {
    test('regular started sandbox', () => {
      const d = computeSandboxDisplay(sandbox({id: 'x', state: 'started'}), false);
      assert.strictEqual(d.displayState, 'started');
      assert.strictEqual(d.contextValue, 'sandbox-started');
      assert.strictEqual(d.isClone, false);
      assert.strictEqual(d.isCloneInSetup, false);
      assert.strictEqual(d.showAsCloning, false);
      assert.strictEqual(d.tooltipStateLine, 'started');
    });

    test('regular stopped sandbox', () => {
      const d = computeSandboxDisplay(sandbox({id: 'x', state: 'stopped'}), false);
      assert.strictEqual(d.displayState, 'stopped');
      assert.strictEqual(d.contextValue, 'sandbox-stopped');
    });

    test('uppercase state is normalized to lowercase', () => {
      const d = computeSandboxDisplay(sandbox({id: 'x', state: 'STARTED'}), false);
      assert.strictEqual(d.displayState, 'started');
      assert.strictEqual(d.contextValue, 'sandbox-started');
    });

    test('missing state renders as unknown', () => {
      const d = computeSandboxDisplay(sandbox({id: 'x'}), false);
      assert.strictEqual(d.displayState, 'unknown');
      assert.strictEqual(d.contextValue, 'sandbox-unknown');
      assert.strictEqual(d.tooltipStateLine, undefined);
    });

    test('cloned sandbox in failed state is "setting up"', () => {
      const d = computeSandboxDisplay(sandbox({id: 'x', state: 'failed', clonedFrom: 'zzzz-004'}), false);
      assert.strictEqual(d.displayState, 'setting up');
      assert.strictEqual(d.contextValue, 'sandbox-settingup-cloned');
      assert.strictEqual(d.isClone, true);
      assert.strictEqual(d.isCloneInSetup, true);
      assert.strictEqual(d.tooltipStateLine, 'setting up (clone in progress)');
    });

    test('cloned sandbox in other states uses that state and carries -cloned suffix', () => {
      const d = computeSandboxDisplay(sandbox({id: 'x', state: 'started', clonedFrom: 'zzzz-004'}), false);
      assert.strictEqual(d.displayState, 'started');
      assert.strictEqual(d.contextValue, 'sandbox-started-cloned');
      assert.strictEqual(d.isClone, true);
      assert.strictEqual(d.isCloneInSetup, false);
    });

    test('source of in-progress clone renders as "cloning"', () => {
      const d = computeSandboxDisplay(sandbox({id: 'x', state: 'started'}), true);
      assert.strictEqual(d.displayState, 'cloning');
      assert.strictEqual(d.contextValue, 'sandbox-cloning');
      assert.strictEqual(d.showAsCloning, true);
      assert.strictEqual(d.tooltipStateLine, 'started (clone in progress)');
    });

    test('source flag on a stopped source still shows cloning', () => {
      const d = computeSandboxDisplay(sandbox({id: 'x', state: 'stopped'}), true);
      assert.strictEqual(d.displayState, 'cloning');
      assert.strictEqual(d.contextValue, 'sandbox-cloning');
      assert.strictEqual(d.tooltipStateLine, 'stopped (clone in progress)');
    });

    test('cloned + failed takes precedence over isCloneSource=true', () => {
      // A sandbox that is itself a clone-in-setup should render as "setting up" even if
      // somehow also flagged as a source (defensive: these cases shouldn't co-occur).
      const d = computeSandboxDisplay(sandbox({id: 'x', state: 'failed', clonedFrom: 'zzzz-004'}), true);
      assert.strictEqual(d.displayState, 'setting up');
      assert.strictEqual(d.contextValue, 'sandbox-settingup-cloned');
      assert.strictEqual(d.isCloneInSetup, true);
      assert.strictEqual(d.showAsCloning, false);
    });

    test('empty clonedFrom string does not make sandbox a clone', () => {
      const d = computeSandboxDisplay(sandbox({id: 'x', state: 'started', clonedFrom: ''}), false);
      assert.strictEqual(d.isClone, false);
      assert.strictEqual(d.contextValue, 'sandbox-started');
    });
  });

  suite('state sets', () => {
    test('CLONE_IN_PROGRESS_STATES contains the expected states', () => {
      assert.ok(CLONE_IN_PROGRESS_STATES.has('cloning'));
      assert.ok(CLONE_IN_PROGRESS_STATES.has('creating'));
      assert.ok(CLONE_IN_PROGRESS_STATES.has('failed'));
    });

    test('TRANSITIONAL_STATES includes cloning (so realm polling keeps running)', () => {
      assert.ok(TRANSITIONAL_STATES.has('cloning'));
      assert.ok(TRANSITIONAL_STATES.has('creating'));
      assert.ok(TRANSITIONAL_STATES.has('starting'));
      assert.ok(TRANSITIONAL_STATES.has('stopping'));
      assert.ok(TRANSITIONAL_STATES.has('deleting'));
    });

    test('TRANSITIONAL_STATES does not include terminal states', () => {
      assert.ok(!TRANSITIONAL_STATES.has('started'));
      assert.ok(!TRANSITIONAL_STATES.has('stopped'));
      assert.ok(!TRANSITIONAL_STATES.has('failed'));
    });
  });
});
