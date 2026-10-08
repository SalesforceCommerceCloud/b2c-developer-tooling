/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {ConfigSourceInfo, ConfigWarning, InstanceInfo, NormalizedConfig} from '@salesforce/b2c-tooling-sdk/config';
import * as assert from 'assert';
import * as path from 'path';
import {
  acceptInstancePickerSelection,
  buildEnvFilePickerEntries,
  buildInstancePickerEntries,
  createWorkspaceInstanceSelection,
  describeInstanceStatus,
  findInstanceNameRange,
  getInstanceConfigurationScope,
  isEnvFileCandidate,
  isWorkspaceInstanceSelected,
  toEnvFileSelection,
  triggerInstancePickerButton,
  type InstancePickerSelectionActions,
} from '../instance-selection.js';

function instance(name: string, location?: string): InstanceInfo {
  return {name, location, source: 'DwJsonSource'};
}

function recordingActions(calls: Array<{action: string; selection?: unknown}>): InstancePickerSelectionActions {
  return {
    followDefault: async () => {
      calls.push({action: 'follow'});
    },
    inspect: async () => {
      calls.push({action: 'inspect'});
    },
    selectEnvFile: async (selection) => {
      calls.push({action: 'envFile', selection});
    },
    selectForWorkspace: async (selection) => {
      calls.push({action: 'select', selection});
    },
    selectNone: async () => {
      calls.push({action: 'none'});
    },
  };
}

function status(
  sources: ConfigSourceInfo[],
  values: NormalizedConfig,
  options: Partial<Parameters<typeof describeInstanceStatus>[1]> = {},
  warnings: ConfigWarning[] = [],
) {
  return describeInstanceStatus(
    {sources, values, warnings},
    {envFileSelection: undefined, instanceDisabled: false, workspaceSelected: false, ...options},
  );
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

  test('persists a source-and-name identity for plugin source instances', () => {
    const plugin: InstanceInfo = {name: 'staging', source: 'yaml-config', location: 'b2c.yaml'};
    const selected = createWorkspaceInstanceSelection(plugin);

    assert.deepStrictEqual(selected, {name: 'staging', source: 'yaml-config'});
    assert.strictEqual(isWorkspaceInstanceSelected(plugin, selected), true);
    assert.strictEqual(isWorkspaceInstanceSelected({...plugin, source: 'vault'}, selected), false);
    assert.strictEqual(isWorkspaceInstanceSelected(instance('staging', '/project/dw.json'), selected), false);
    // A saved dw.json selection never matches a same-name plugin instance.
    assert.strictEqual(isWorkspaceInstanceSelected(plugin, {name: 'staging', location: 'b2c.yaml'}), false);
  });

  test('groups plugin source instances by source after dw.json', () => {
    const entries = buildInstancePickerEntries(
      [
        {name: 'yaml-a', source: 'yaml-config', active: true},
        instance('local', '/project/dw.json'),
        {name: 'vault-a', source: 'vault'},
        {name: 'yaml-b', source: 'yaml-config'},
      ],
      {name: 'yaml-b', source: 'yaml-config'},
      {name: 'local', location: '/project/dw.json'},
      undefined,
    );

    assert.deepStrictEqual(
      entries
        .filter((entry) => entry.kind === 'separator' || entry.kind === 'instance')
        .map((entry) => [entry.kind, entry.scope, entry.source, entry.instance?.name, entry.selected, entry.default]),
      [
        ['separator', 'project', undefined, undefined, undefined, undefined],
        ['instance', 'project', undefined, 'local', false, true],
        ['separator', 'source', 'yaml-config', undefined, undefined, undefined],
        ['instance', 'source', 'yaml-config', 'yaml-a', false, true],
        ['instance', 'source', 'yaml-config', 'yaml-b', true, false],
        ['separator', 'source', 'vault', undefined, undefined, undefined],
        ['instance', 'source', 'vault', 'vault-a', false, false],
      ],
    );
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
      {envFiles: buildEnvFilePickerEntries(['/project/.env'], undefined, '/project')},
    );

    assert.deepStrictEqual(
      entries.map((entry) => [entry.kind, entry.scope, entry.instance?.name, entry.selected, entry.default]),
      [
        ['inspect', undefined, undefined, undefined, undefined],
        ['follow', undefined, undefined, undefined, undefined],
        ['none', undefined, undefined, false, undefined],
        ['separator', 'project', undefined, undefined, undefined],
        ['instance', 'project', 'local', false, false],
        ['separator', 'global', undefined, undefined, undefined],
        ['instance', 'global', 'default', false, true],
        ['instance', 'global', 'selected', true, false],
        ['separator', 'envFile', undefined, undefined, undefined],
        ['envFile', 'envFile', undefined, true, undefined],
        ['envFile', 'envFile', undefined, false, undefined],
      ],
    );
    assert.strictEqual(entries.find((entry) => entry.kind === 'follow')?.description, 'Use default');
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

    assert.strictEqual(
      entries.find((entry) => entry.kind === 'follow')?.description,
      'Currently following the default',
    );
    assert.strictEqual(defaultEntry?.selected, true);
    assert.strictEqual(defaultEntry?.default, true);
  });

  test('accepting an instance selects it for the workspace and does not follow the default', async () => {
    const calls: Array<{action: string; selection?: unknown}> = [];
    await acceptInstancePickerSelection(
      {instance: instance('development', '/config/shared.json')},
      recordingActions(calls),
    );

    assert.deepStrictEqual(calls, [
      {
        action: 'select',
        selection: {name: 'development', location: path.resolve('/config/shared.json')},
      },
    ]);
  });

  test('accepting Follow Default invokes only the follow action', async () => {
    const calls: Array<{action: string; selection?: unknown}> = [];
    await acceptInstancePickerSelection({action: 'follow'}, recordingActions(calls));

    assert.deepStrictEqual(calls, [{action: 'follow'}]);
  });

  test('accepting Inspect, None or an env file row invokes only that action', async () => {
    const calls: Array<{action: string; selection?: unknown}> = [];
    const envFile = {kind: 'file' as const, path: '/project/.env.staging', label: '.env.staging', selected: false};
    await acceptInstancePickerSelection({action: 'inspect'}, recordingActions(calls));
    await acceptInstancePickerSelection({action: 'none'}, recordingActions(calls));
    await acceptInstancePickerSelection({envFile}, recordingActions(calls));

    assert.deepStrictEqual(calls, [
      {action: 'inspect'},
      {action: 'none'},
      {action: 'envFile', selection: '/project/.env.staging'},
    ]);
  });

  test('maps env file rows to saved selections', () => {
    assert.strictEqual(toEnvFileSelection({kind: 'default', label: '.env (default)', selected: true}), undefined);
    assert.strictEqual(toEnvFileSelection({kind: 'none', label: 'None', selected: false}), null);
    assert.strictEqual(
      toEnvFileSelection({kind: 'file', path: '/project/.env.local', label: '.env.local', selected: false}),
      '/project/.env.local',
    );
  });

  test('accepting the unnamed default entry follows the default', async () => {
    const calls: Array<{action: string; selection?: unknown}> = [];
    await acceptInstancePickerSelection({instance: instance('', '/project/dw.json')}, recordingActions(calls));

    assert.deepStrictEqual(calls, [{action: 'follow'}]);
  });

  test('omits the env file section when there are no env files', () => {
    const entries = buildInstancePickerEntries([instance('dev', '/project/dw.json')], undefined, undefined, undefined);

    assert.strictEqual(
      entries.some((entry) => entry.kind === 'envFile'),
      false,
    );
  });

  test('marks None as selected and nothing else when the instance is disabled', () => {
    const projectPath = '/project/dw.json';
    const entries = buildInstancePickerEntries(
      [instance('dev', projectPath)],
      undefined,
      {name: 'dev', location: projectPath},
      undefined,
      {instanceDisabled: true},
    );

    assert.strictEqual(entries.find((entry) => entry.kind === 'none')?.selected, true);
    assert.strictEqual(entries.find((entry) => entry.instance?.name === 'dev')?.selected, false);
    assert.strictEqual(entries.find((entry) => entry.kind === 'follow')?.description, 'Use dev');
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

suite('env file selection', () => {
  test('offers .env and .env.* files but not templates', () => {
    assert.strictEqual(isEnvFileCandidate('.env'), true);
    assert.strictEqual(isEnvFileCandidate('.env.staging'), true);
    assert.strictEqual(isEnvFileCandidate('.env.example'), false);
    assert.strictEqual(isEnvFileCandidate('.env.default'), false);
    assert.strictEqual(isEnvFileCandidate('.env.sample'), false);
    assert.strictEqual(isEnvFileCandidate('.envrc'), false);
  });

  test('lists the default, other candidates and None with the current selection marked', () => {
    const project = path.resolve('/project');
    const entries = buildEnvFilePickerEntries(
      [path.join(project, '.env'), path.join(project, '.env.staging')],
      path.join(project, '.env.staging'),
      project,
    );

    assert.deepStrictEqual(
      entries.map((entry) => [entry.kind, entry.label, entry.selected]),
      [
        ['default', '.env (default)', false],
        ['file', '.env.staging', true],
        ['none', 'None', false],
      ],
    );
  });

  test('keeps a missing selected file visible', () => {
    const project = path.resolve('/project');
    const entries = buildEnvFilePickerEntries([], path.join(project, '.env.gone'), project);

    assert.deepStrictEqual(
      entries.map((entry) => [entry.kind, entry.label, entry.selected]),
      [
        ['default', 'Default (.env, not found)', false],
        ['file', '.env.gone (missing)', true],
        ['none', 'None', false],
      ],
    );
  });
});

suite('instance status', () => {
  const projectDwJson = path.resolve('/project/dw.json');
  const globalDwJson = path.resolve('/config/dw.json');
  const envFile = path.resolve('/project/.env.staging');

  test('labels an unnamed project entry honestly instead of using the global active name', () => {
    const result = status([{name: 'DwJsonSource', location: projectDwJson, fields: ['hostname', 'clientId']}], {
      hostname: 'project.example.com',
      clientId: 'abc',
    });

    assert.strictEqual(result.label, 'project dw.json (unnamed)');
    assert.strictEqual(result.text, '$(cloud) project dw.json (unnamed)');
    assert.strictEqual(result.warning, false);
  });

  test('uses the resolved instance name and names the env file that supplies settings', () => {
    const result = status(
      [
        {name: 'DwJsonSource', location: projectDwJson, fields: ['hostname', 'instanceName']},
        {name: 'StorefrontNextEnvSource', location: envFile, fields: ['siteId']},
      ],
      {hostname: 'stg.example.com', instanceName: 'stg', siteId: 'RefArch'},
      {envFile, envFileSelection: envFile},
    );

    assert.strictEqual(result.text, '$(cloud) stg | .env.staging');
    assert.ok(result.tooltip.includes('Storefront Next fallback (.env.staging): siteId'), result.tooltip.join('\n'));
  });

  test('labels an instance supplied by a plugin config source', () => {
    const result = status(
      [{name: 'yaml-config', location: '/project/b2c.yaml', fields: ['hostname', 'instanceName']}],
      {hostname: 'yaml.example.com', instanceName: 'staging'},
      {workspaceSelected: true},
    );

    assert.strictEqual(result.label, 'staging');
    assert.ok(
      result.tooltip.includes('Instance: yaml-config (selected for this workspace)'),
      result.tooltip.join('\n'),
    );
  });

  test('names the default .env only when it supplies used settings', () => {
    const defaultEnv = path.resolve('/project/.env');
    const inPlay = status(
      [
        {name: 'DotenvFile', location: defaultEnv, fields: ['codeVersion']},
        {name: 'DwJsonSource', location: projectDwJson, fields: ['hostname', 'instanceName']},
      ],
      {hostname: 'stg.example.com', instanceName: 'stg', codeVersion: 'v1'},
      {envFile: defaultEnv},
    );
    const unused = status(
      [
        {name: 'DwJsonSource', location: projectDwJson, fields: ['hostname', 'instanceName', 'siteId']},
        {name: 'StorefrontNextEnvSource', location: defaultEnv, fields: ['siteId'], fieldsIgnored: ['siteId']},
      ],
      {hostname: 'stg.example.com', instanceName: 'stg', siteId: 'RefArch'},
      {envFile: defaultEnv},
    );

    assert.strictEqual(inPlay.text, '$(cloud) stg | .env');
    assert.strictEqual(unused.text, '$(cloud) stg');
  });

  test('always names an explicitly selected env file', () => {
    const result = status(
      [{name: 'DwJsonSource', location: projectDwJson, fields: ['hostname', 'instanceName']}],
      {hostname: 'stg.example.com', instanceName: 'stg'},
      {envFile, envFileSelection: envFile},
    );

    assert.strictEqual(result.text, '$(cloud) stg | .env.staging');
  });

  test('warns when the selected env file could not be used', () => {
    const defaultEnv = path.resolve('/project/.env');
    const result = status(
      [{name: 'DwJsonSource', location: projectDwJson, fields: ['hostname', 'instanceName']}],
      {hostname: 'stg.example.com', instanceName: 'stg'},
      {envFile: defaultEnv, envFileSelection: envFile, envFileProblem: `Env file not found: ${envFile}`},
    );

    assert.strictEqual(result.text, '$(cloud) stg | .env $(warning)');
    assert.ok(result.tooltip.includes(`Env file problem: Env file not found: ${envFile}`), result.tooltip.join('\n'));
  });

  test('labels a global unnamed entry as global', () => {
    const result = status([{name: 'DwJsonSource', scope: 'global', location: globalDwJson, fields: ['hostname']}], {
      hostname: 'global.example.com',
    });

    assert.strictEqual(result.label, 'global dw.json (unnamed)');
  });

  test('warns when the env file overrides fields of the selected instance', () => {
    const result = status(
      [
        {name: 'DotenvFile', location: envFile, fields: ['clientId']},
        {
          name: 'DwJsonSource',
          location: projectDwJson,
          fields: ['hostname', 'instanceName', 'clientId'],
          fieldsIgnored: ['clientId'],
        },
      ],
      {hostname: 'stg.example.com', instanceName: 'stg', clientId: 'from-env'},
      {envFile, envFileSelection: envFile, workspaceSelected: true},
    );

    assert.strictEqual(result.text, '$(cloud) stg | .env.staging $(warning)');
    assert.ok(result.tooltip.includes('Overrides from .env.staging: clientId'), result.tooltip.join('\n'));
  });

  test('labels by env file when it replaces the dw.json entry and derives the tenant', () => {
    const result = status(
      [
        {name: 'DotenvFile', location: envFile, fields: ['hostname', 'clientId']},
        {name: 'DwJsonSource', location: projectDwJson, fields: [], fieldsIgnored: ['hostname', 'instanceName']},
        {name: 'SandboxHostname', location: 'derived from hostname', fields: ['tenantId']},
      ],
      {hostname: 'zzpq-013.dx.commercecloud.salesforce.com', clientId: 'abc', tenantId: 'zzpq_013'},
      {envFile, envFileSelection: envFile},
      [{code: 'HOSTNAME_MISMATCH', message: 'mismatch', details: {source: 'DwJsonSource'}}],
    );

    assert.strictEqual(result.text, '$(cloud) .env.staging $(warning)');
    assert.ok(
      result.tooltip.includes('dw.json ignored: hostname from .env.staging differs'),
      result.tooltip.join('\n'),
    );
    assert.ok(result.tooltip.includes('Derived from hostname: tenantId'), result.tooltip.join('\n'));
  });

  test('labels by the hostname derived from a Storefront Next tenant', () => {
    const defaultEnv = path.resolve('/project/.env');
    const result = status(
      [
        {name: 'StorefrontNextEnvSource', location: defaultEnv, fields: ['tenantId', 'shortCode']},
        {
          name: 'SandboxTenantId',
          location: 'derived from tenant ID bjgk_005',
          fields: ['hostname'],
          derivedFrom: {field: 'tenantId', source: 'StorefrontNextEnvSource', location: defaultEnv},
        },
      ],
      {hostname: 'bjgk-005.dx.commercecloud.salesforce.com', tenantId: 'bjgk_005', shortCode: 'abc'},
      {envFile: defaultEnv},
    );

    assert.strictEqual(result.text, '$(cloud) bjgk-005.dx.commercecloud.salesforce.com | .env');
    assert.ok(
      result.tooltip.includes('Host: bjgk-005.dx.commercecloud.salesforce.com (derived from tenant ID in .env)'),
      result.tooltip.join('\n'),
    );
  });

  test('describes disabled instance and env file selections in the tooltip', () => {
    const result = status(
      [{name: 'EnvSource', location: 'environment variables', fields: ['hostname']}],
      {hostname: 'shell.example.com'},
      {envFileSelection: null, instanceDisabled: true},
    );

    assert.strictEqual(result.text, '$(cloud) shell.example.com');
    assert.ok(result.tooltip.includes('Instance: None (dw.json not used)'));
    assert.ok(result.tooltip.includes('Env file: None'));
  });
});
