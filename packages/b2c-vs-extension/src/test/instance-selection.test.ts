/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {InstanceInfo} from '@salesforce/b2c-tooling-sdk/config';
import * as assert from 'assert';
import * as path from 'path';
import {
  acceptInstancePickerSelection,
  buildInstancePickerEntries,
  createWorkspaceInstanceSelection,
  findInstanceNameRange,
  getInstanceConfigurationScope,
  isWorkspaceInstanceSelected,
  triggerInstancePickerButton,
} from '../instance-selection.js';

function instance(name: string, location?: string): InstanceInfo {
  return {name, location, source: 'DwJsonSource'};
}

suite('instance selection', () => {
  test('persists a file-and-name identity for workspace selection', () => {
    const selected = createWorkspaceInstanceSelection(instance('development', './config/global.json'));

    assert.deepStrictEqual(selected, {
      name: 'development',
      location: path.resolve('./config/global.json'),
    });
  });

  test('does not conflate same-name instances from different configuration files', () => {
    const selected = createWorkspaceInstanceSelection(instance('development', '/config/global.json'));

    assert.strictEqual(isWorkspaceInstanceSelected(instance('development', '/project/config.json'), selected), false);
    assert.strictEqual(isWorkspaceInstanceSelected(instance('development', '/config/global.json'), selected), true);
  });

  test('requires a source location for workspace selection', () => {
    assert.strictEqual(createWorkspaceInstanceSelection(instance('development')), undefined);
  });

  test('identifies global and project configuration entries', () => {
    const defaultPath = '/config/global.json';

    assert.strictEqual(getInstanceConfigurationScope(instance('global', defaultPath), defaultPath), 'global');
    assert.strictEqual(
      getInstanceConfigurationScope(instance('project', '/project/config.json'), defaultPath),
      'project',
    );
  });

  test('builds independent workspace-selection and default markers', () => {
    const projectPath = '/project/dw.json';
    const globalPath = '/config/shared.json';
    const local = instance('local', projectPath);
    const sharedDefault = instance('default', globalPath);
    const sharedSelected = instance('selected', globalPath);
    const entries = buildInstancePickerEntries(
      [local, sharedDefault, sharedSelected],
      {name: 'selected', location: globalPath},
      {name: 'default', location: globalPath},
      globalPath,
    );

    assert.deepStrictEqual(
      entries.map((entry) => [entry.kind, entry.scope, entry.instance?.name, entry.selected, entry.default]),
      [
        ['follow', undefined, undefined, undefined, undefined],
        ['separator', 'project', undefined, undefined, undefined],
        ['instance', 'project', 'local', false, false],
        ['separator', 'global', undefined, undefined, undefined],
        ['instance', 'global', 'default', false, true],
        ['instance', 'global', 'selected', true, false],
      ],
    );
    assert.strictEqual(entries[0].description, 'Use default');
  });

  test('marks the default as selected while the workspace follows it', () => {
    const globalPath = '/config/shared.json';
    const entries = buildInstancePickerEntries(
      [instance('default', globalPath)],
      undefined,
      {name: 'default', location: globalPath},
      globalPath,
    );
    const defaultEntry = entries.find((entry) => entry.instance?.name === 'default');

    assert.strictEqual(entries[0].description, 'Currently following the default');
    assert.strictEqual(defaultEntry?.selected, true);
    assert.strictEqual(defaultEntry?.default, true);
  });

  test('accepting an instance selects it for the workspace and does not follow the default', async () => {
    const calls: Array<{action: string; selection?: unknown}> = [];
    await acceptInstancePickerSelection(
      {instance: instance('development', '/config/shared.json')},
      {
        followDefault: async () => {
          calls.push({action: 'follow'});
        },
        selectForWorkspace: async (selection) => {
          calls.push({action: 'select', selection});
        },
      },
    );

    assert.deepStrictEqual(calls, [
      {
        action: 'select',
        selection: {name: 'development', location: path.resolve('/config/shared.json')},
      },
    ]);
  });

  test('accepting Follow Default invokes only the follow action', async () => {
    const calls: string[] = [];
    await acceptInstancePickerSelection(
      {action: 'follow'},
      {
        followDefault: async () => {
          calls.push('follow');
        },
        selectForWorkspace: async () => {
          calls.push('select');
        },
      },
    );

    assert.deepStrictEqual(calls, ['follow']);
  });

  test('instance row buttons invoke only their explicit action', async () => {
    const selectedInstance = instance('development', '/config/shared.json');
    const calls: string[] = [];
    const actions = {
      openConfiguration: async () => {
        calls.push('open');
      },
      setDefault: async () => {
        calls.push('set-default');
        return false;
      },
    };

    const changedDefault = await triggerInstancePickerButton('setDefault', selectedInstance, actions);
    assert.strictEqual(changedDefault, false, 'a cancelled default change keeps the picker open');
    assert.deepStrictEqual(calls, ['set-default']);

    calls.length = 0;
    const openedConfiguration = await triggerInstancePickerButton('openConfiguration', selectedInstance, actions);
    assert.strictEqual(openedConfiguration, true);
    assert.deepStrictEqual(calls, ['open']);
  });

  test('finds the exact named entry in a multi-instance configuration', () => {
    const text = JSON.stringify(
      {
        configs: [
          {name: 'development', hostname: 'development.invalid'},
          {name: 'staging', hostname: 'staging.invalid'},
        ],
      },
      null,
      2,
    );
    const range = findInstanceNameRange(text, 'staging');

    assert.ok(range);
    assert.strictEqual(text.slice(range.start, range.end), '"staging"');
  });

  test('finds named root entries and JSON-escaped instance names', () => {
    const name = 'developer "one"';
    const text = JSON.stringify({name, hostname: 'development.invalid'}, null, 2);
    const range = findInstanceNameRange(text, name);

    assert.ok(range);
    assert.strictEqual(text.slice(range.start, range.end), JSON.stringify(name));
    assert.strictEqual(findInstanceNameRange(text, 'missing'), undefined);
  });
});
