/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import {B2CExtensionConfig} from '../config-provider.js';
import type {WorkspaceInstanceSelection} from '../instance-selection.js';

function createMemoryMemento(initial: Record<string, unknown> = {}): vscode.Memento {
  const values = new Map(Object.entries(initial));
  return {
    keys: () => [...values.keys()],
    get: <T>(key: string, defaultValue?: T) => (values.has(key) ? (values.get(key) as T) : defaultValue),
    update: async (key: string, value: unknown) => {
      if (value === undefined) values.delete(key);
      else values.set(key, value);
    },
  } as vscode.Memento;
}

function waitForReset(provider: B2CExtensionConfig): Promise<void> {
  return new Promise((resolve) => {
    const disposable = provider.onDidReset(() => {
      disposable.dispose();
      resolve();
    });
  });
}

suite('B2CExtensionConfig workspace discovery', () => {
  let ambientEnvironment: NodeJS.ProcessEnv;
  let log: vscode.OutputChannel;
  let settingsRoot: string;

  suiteSetup(() => {
    log = vscode.window.createOutputChannel('B2C Config Provider Tests');
  });

  suiteTeardown(() => {
    log.dispose();
  });

  setup(() => {
    settingsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-vscode-config-test-'));
    ambientEnvironment = {
      B2C_CONFIG_DIR: path.join(settingsRoot, 'settings'),
      MRT_CREDENTIALS_FILE: path.join(settingsRoot, 'missing.mobify'),
    };
    fs.mkdirSync(path.join(ambientEnvironment.B2C_CONFIG_DIR!, 'b2c'), {recursive: true});
  });

  teardown(() => {
    fs.rmSync(settingsRoot, {recursive: true, force: true});
  });

  test('selects the expected project root for the open workspace shape', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    assert.ok(workspaceFolders?.length, 'test workspace should be open');

    let expected = workspaceFolders[0].uri.fsPath;
    if (workspaceFolders[0].name === 'nested-workspace') {
      expected = path.join(expected, 'sfra');
    } else if (workspaceFolders[0].name === 'first-workspace-folder') {
      expected = path.join(expected, 'projects', 'sfra');
    }
    const provider = new B2CExtensionConfig(log, undefined, ambientEnvironment);

    try {
      await provider.ensureResolved();
      assert.strictEqual(provider.getWorkingDirectory(), expected);
    } finally {
      provider.dispose();
    }
  });

  test('a pinned root overrides multi-root workspace ordering', async function () {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length < 2) {
      this.skip();
      return;
    }

    const pinnedRoot = workspaceFolders[1].uri.fsPath;
    const workspaceState = {
      keys: () => ['b2c-dx.projectRoot'],
      get: (key: string) => (key === 'b2c-dx.projectRoot' ? pinnedRoot : undefined),
      update: async () => {},
    } as vscode.Memento;
    const provider = new B2CExtensionConfig(log, workspaceState, ambientEnvironment);

    try {
      await provider.ensureResolved();
      assert.strictEqual(provider.getWorkingDirectory(), pinnedRoot);
      assert.strictEqual(provider.isProjectRootPinned(), true);
    } finally {
      provider.dispose();
    }
  });

  test('honors SFCC_CONFIG (global dw.json path) over the workspace dw.json', async () => {
    // Regression: the extension previously ignored SFCC_CONFIG (a dw.json *path*,
    // as exposed by the CLI's --config flag) and only ever loaded a dw.json from
    // the workspace folder. A project relying on a global dw.json via SFCC_CONFIG
    // resolved to "No B2C Commerce instance configured".
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sfcc-config-'));
    const globalDwJson = path.join(dir, 'dw.json');
    fs.writeFileSync(globalDwJson, JSON.stringify({hostname: 'global-config.invalid', username: 'u', password: 'p'}));

    const provider = new B2CExtensionConfig(log, undefined, {...ambientEnvironment, SFCC_CONFIG: globalDwJson});

    try {
      await provider.ensureResolved();
      const instance = provider.getInstance();
      assert.ok(instance, 'expected an instance resolved from SFCC_CONFIG');
      assert.strictEqual(
        instance.config.hostname,
        'global-config.invalid',
        JSON.stringify(provider.getConfig()?.sources),
      );
      assert.strictEqual(provider.getConfigError(), null);
    } finally {
      provider.dispose();
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  test('loads all supported variables and relative SFCC_CONFIG from a selected project .env', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-project-env-'));
    fs.writeFileSync(
      path.join(dir, 'selected.dw.json'),
      JSON.stringify({hostname: 'file.invalid', username: 'file-user', password: 'file-password'}),
    );
    fs.writeFileSync(
      path.join(dir, '.env'),
      'SFCC_CONFIG=./selected.dw.json\nSFCC_SERVER=project-env.invalid\nSFCC_CODE_VERSION=env-version\nB2C_TEST_PROJECT_ONLY_VARIABLE=available\n',
    );
    const provider = new B2CExtensionConfig(log, undefined, ambientEnvironment);

    try {
      const config = await provider.resolveForDirectory(dir);
      assert.strictEqual(config.values.hostname, 'project-env.invalid');
      assert.strictEqual(config.values.codeVersion, 'env-version');
      assert.ok(
        config.sources.some(
          (source) => source.name === 'DwJsonSource' && source.location === path.join(dir, 'selected.dw.json'),
        ),
        JSON.stringify(config.sources),
      );
      assert.strictEqual(
        process.env.B2C_TEST_PROJECT_ONLY_VARIABLE,
        undefined,
        'project variables must remain scoped to the project',
      );
    } finally {
      provider.dispose();
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  test('uses the shared global default when the selected project has no dw.json', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-global-default-'));
    const projectDirectory = path.join(dir, 'project');
    const globalConfigPath = path.join(dir, 'shared.dw.json');
    fs.mkdirSync(projectDirectory);
    fs.writeFileSync(globalConfigPath, JSON.stringify({hostname: 'shared-default.invalid'}));
    const environment: NodeJS.ProcessEnv = {...ambientEnvironment, SFCC_CONFIG: undefined};
    const settingsDirectory = path.join(environment.B2C_CONFIG_DIR!, 'b2c');
    fs.mkdirSync(settingsDirectory, {recursive: true});
    fs.writeFileSync(
      path.join(settingsDirectory, 'settings.json'),
      JSON.stringify({defaultConfigPath: globalConfigPath}),
    );
    const provider = new B2CExtensionConfig(log, undefined, environment);

    try {
      const config = await provider.resolveForDirectory(projectDirectory);
      assert.strictEqual(config.values.hostname, 'shared-default.invalid');
    } finally {
      provider.dispose();
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  test('uses a workspace-selected global instance without changing the shared default', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-workspace-instance-'));
    const projectDirectory = path.join(dir, 'project');
    const globalConfigPath = path.join(dir, 'shared.dw.json');
    fs.mkdirSync(projectDirectory);
    fs.writeFileSync(
      globalConfigPath,
      JSON.stringify({
        configs: [
          {name: 'default-instance', hostname: 'default.invalid', active: true},
          {name: 'workspace-instance', hostname: 'workspace.invalid'},
        ],
      }),
    );
    const environment: NodeJS.ProcessEnv = {...ambientEnvironment, SFCC_CONFIG: undefined};
    fs.writeFileSync(
      path.join(environment.B2C_CONFIG_DIR!, 'b2c', 'settings.json'),
      JSON.stringify({defaultConfigPath: globalConfigPath}),
    );
    const selected: WorkspaceInstanceSelection = {name: 'workspace-instance', location: globalConfigPath};
    const workspaceState = {
      keys: () => ['b2c-dx.workspaceInstance'],
      get: <T>(key: string) => (key === 'b2c-dx.workspaceInstance' ? (selected as T) : undefined),
      update: async () => {},
    } as vscode.Memento;
    const provider = new B2CExtensionConfig(log, workspaceState, environment);

    try {
      const config = await provider.resolveForDirectory(projectDirectory);
      assert.strictEqual(config.values.hostname, 'workspace.invalid');
      assert.strictEqual(config.values.instanceName, 'workspace-instance');
      assert.deepStrictEqual(provider.getWorkspaceInstanceSelection(), selected);

      const persisted = JSON.parse(fs.readFileSync(globalConfigPath, 'utf8'));
      assert.strictEqual(persisted.configs[0].active, true);
      assert.strictEqual(persisted.configs[1].active, undefined);
    } finally {
      provider.dispose();
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  const resolutionCases: Array<{
    name: string;
    projectConfig?: Record<string, unknown>;
    projectEnvironment?: string;
    globalConfig?: Record<string, unknown>;
    expectedHostname: string;
  }> = [
    {
      name: 'resolves a simple project configuration',
      projectConfig: {hostname: 'project.invalid'},
      expectedHostname: 'project.invalid',
    },
    {
      name: 'resolves project environment values without a configuration file',
      projectEnvironment: 'SFCC_SERVER=environment.invalid\nSFCC_CODE_VERSION=environment-version\n',
      expectedHostname: 'environment.invalid',
    },
    {
      name: 'prefers a simple project configuration over the shared default',
      projectConfig: {hostname: 'project.invalid'},
      globalConfig: {configs: [{name: 'global', hostname: 'global.invalid', active: true}]},
      expectedHostname: 'project.invalid',
    },
    {
      name: 'uses the shared default when the project root is explicitly inactive',
      projectConfig: {hostname: 'inactive-project.invalid', active: false},
      globalConfig: {configs: [{name: 'global', hostname: 'global.invalid', active: true}]},
      expectedHostname: 'global.invalid',
    },
    {
      name: 'resolves the default from a shared multi-instance configuration alone',
      globalConfig: {
        configs: [
          {name: 'development', hostname: 'development.invalid', active: true},
          {name: 'staging', hostname: 'staging.invalid'},
        ],
      },
      expectedHostname: 'development.invalid',
    },
  ];

  for (const scenario of resolutionCases) {
    test(scenario.name, async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-resolution-matrix-'));
      const projectDirectory = path.join(dir, 'project');
      fs.mkdirSync(projectDirectory);
      if (scenario.projectConfig) {
        fs.writeFileSync(path.join(projectDirectory, 'dw.json'), JSON.stringify(scenario.projectConfig));
      }
      if (scenario.projectEnvironment) {
        fs.writeFileSync(path.join(projectDirectory, '.env'), scenario.projectEnvironment);
      }
      if (scenario.globalConfig) {
        const globalConfigPath = path.join(dir, 'shared.json');
        fs.writeFileSync(globalConfigPath, JSON.stringify(scenario.globalConfig));
        fs.writeFileSync(
          path.join(ambientEnvironment.B2C_CONFIG_DIR!, 'b2c', 'settings.json'),
          JSON.stringify({defaultConfigPath: globalConfigPath}),
        );
      }
      const provider = new B2CExtensionConfig(log, createMemoryMemento(), ambientEnvironment);

      try {
        const config = await provider.resolveForDirectory(projectDirectory);
        assert.strictEqual(config.values.hostname, scenario.expectedHostname);
      } finally {
        provider.dispose();
        fs.rmSync(dir, {recursive: true, force: true});
      }
    });
  }

  test('persists a shared instance selection, survives reload, and follows the default without file changes', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-workspace-selection-lifecycle-'));
    const projectDirectory = path.join(dir, 'project');
    const globalConfigPath = path.join(dir, 'shared.json');
    fs.mkdirSync(projectDirectory);
    const originalContent = `${JSON.stringify(
      {
        configs: [
          {name: 'development', hostname: 'development.invalid', active: true},
          {name: 'staging', hostname: 'staging.invalid'},
        ],
      },
      null,
      2,
    )}\n`;
    fs.writeFileSync(globalConfigPath, originalContent);
    fs.writeFileSync(
      path.join(ambientEnvironment.B2C_CONFIG_DIR!, 'b2c', 'settings.json'),
      JSON.stringify({defaultConfigPath: globalConfigPath}),
    );
    const workspaceState = createMemoryMemento();
    let provider = new B2CExtensionConfig(log, workspaceState, ambientEnvironment);

    try {
      let config = await provider.resolveForDirectory(projectDirectory);
      assert.strictEqual(config.values.instanceName, 'development');

      let reset = waitForReset(provider);
      await provider.selectInstanceForWorkspace({name: 'staging', location: globalConfigPath});
      await reset;
      config = await provider.resolveForDirectory(projectDirectory);
      assert.strictEqual(config.values.instanceName, 'staging');
      assert.strictEqual(fs.readFileSync(globalConfigPath, 'utf8'), originalContent);

      provider.dispose();
      provider = new B2CExtensionConfig(log, workspaceState, ambientEnvironment);
      config = await provider.resolveForDirectory(projectDirectory);
      assert.strictEqual(config.values.instanceName, 'staging');

      reset = waitForReset(provider);
      await provider.followDefaultInstance();
      await reset;
      config = await provider.resolveForDirectory(projectDirectory);
      assert.strictEqual(config.values.instanceName, 'development');
      assert.strictEqual(provider.getWorkspaceInstanceSelection(), undefined);
      assert.strictEqual(fs.readFileSync(globalConfigPath, 'utf8'), originalContent);
    } finally {
      provider.dispose();
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  test('uses the selected source when local and shared instances have the same name', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-exact-instance-source-'));
    const projectDirectory = path.join(dir, 'project');
    const globalConfigPath = path.join(dir, 'shared.json');
    fs.mkdirSync(projectDirectory);
    fs.writeFileSync(
      path.join(projectDirectory, 'dw.json'),
      JSON.stringify({configs: [{name: 'shared', hostname: 'project.invalid'}]}),
    );
    fs.writeFileSync(
      globalConfigPath,
      JSON.stringify({configs: [{name: 'shared', hostname: 'global.invalid', active: true}]}),
    );
    fs.writeFileSync(
      path.join(ambientEnvironment.B2C_CONFIG_DIR!, 'b2c', 'settings.json'),
      JSON.stringify({defaultConfigPath: globalConfigPath}),
    );
    const workspaceState = createMemoryMemento({
      'b2c-dx.workspaceInstance': {name: 'shared', location: globalConfigPath},
    });
    const provider = new B2CExtensionConfig(log, workspaceState, ambientEnvironment);

    try {
      const config = await provider.resolveForDirectory(projectDirectory);
      assert.strictEqual(config.values.hostname, 'global.invalid');
    } finally {
      provider.dispose();
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  test('reports a stale workspace selection instead of falling back to another instance', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-stale-workspace-instance-'));
    const projectDirectory = path.join(dir, 'project');
    const globalConfigPath = path.join(dir, 'shared.json');
    fs.mkdirSync(projectDirectory);
    fs.writeFileSync(
      globalConfigPath,
      JSON.stringify({configs: [{name: 'development', hostname: 'development.invalid', active: true}]}),
    );
    const workspaceState = createMemoryMemento({
      'b2c-dx.workspaceInstance': {name: 'removed', location: globalConfigPath},
    });
    const provider = new B2CExtensionConfig(log, workspaceState, ambientEnvironment);

    try {
      await assert.rejects(
        provider.resolveForDirectory(projectDirectory),
        /Selected instance "removed" is no longer available/,
      );
    } finally {
      provider.dispose();
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });
});
