/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';
import * as vscode from 'vscode';

const EXTENSION_ID = 'Salesforce.b2c-vs-extension';

interface ContributedCommand {
  command: string;
  title?: string;
}
interface ContributedView {
  id: string;
  name: string;
  when?: string;
}
interface PackageJson {
  contributes: {
    commands: ContributedCommand[];
    views: Record<string, ContributedView[]>;
    debuggers: Array<{type: string}>;
    menus?: {commandPalette?: Array<{command: string; when?: string}>};
    walkthroughs?: Array<{id: string; when?: string}>;
  };
}

function loadPackageJson(): PackageJson {
  // Compiled file at out/test/integration/<file>.js → package.json is 3 levels up.
  const here = path.dirname(fileURLToPath(import.meta.url));
  const pkgPath = path.resolve(here, '..', '..', '..', 'package.json');
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
}

suite('extension activation', () => {
  let pkg: PackageJson;

  suiteSetup(async () => {
    pkg = loadPackageJson();
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `extension ${EXTENSION_ID} must be discoverable in the test host`);
    await ext!.activate();
  });

  test('extension activates without throwing', () => {
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext?.isActive, 'extension should be active after suiteSetup activate()');
  });

  // This is the workhorse check. The extension's top-level try/catch
  // (extension.ts:117-136) registers only two stub commands on failure
  // (promptAgent, listWebDav), so any swallowed activation error
  // surfaces here as a flood of missing commands.
  //
  // Feature-gated commands are only registered when their `features.*` setting
  // is enabled. Some features default OFF, so their commands are legitimately
  // absent — exclude them by command-id prefix when the feature is disabled in
  // the test host's effective config.
  test('every contributed command is registered', async () => {
    const config = vscode.workspace.getConfiguration('b2c-dx');
    // command-id prefix -> features.* flag that gates it
    const featureGatedPrefixes: Array<{prefix: string; feature: string}> = [
      {prefix: 'b2c-dx.jobs.', feature: 'features.jobsExplorer'},
      {prefix: 'b2c-dx.export.', feature: 'features.exportExplorer'},
      {prefix: 'b2c-dx.cipAnalytics.', feature: 'features.cipAnalytics'},
    ];
    const disabledPrefixes = featureGatedPrefixes
      .filter(({feature}) => !config.get<boolean>(feature, false))
      .map(({prefix}) => prefix);
    const isFromDisabledFeature = (command: string) => disabledPrefixes.some((p) => command.startsWith(p));

    const registered = new Set(await vscode.commands.getCommands(true));
    const missing = pkg.contributes.commands.filter(
      (c) => !registered.has(c.command) && !isFromDisabledFeature(c.command),
    );
    assert.deepStrictEqual(
      missing.map((c) => c.command),
      [],
      'all contributed commands (from enabled features) must be registered after activation',
    );
  });

  test('declared debug type matches the script debugger', () => {
    const types = pkg.contributes.debuggers.map((d) => d.type);
    assert.ok(types.includes('b2c-script'), 'b2c-script debug type must be declared');
  });

  // Preview features are gated so they are invisible (no view, no palette
  // command) unless their b2c-dx.features.* setting is enabled. Assert the
  // manifest wiring structurally so it can't silently regress.
  test('preview-feature views are gated by their feature setting', () => {
    const gated: Record<string, string> = {
      b2cJobsExplorer: 'config.b2c-dx.features.jobsExplorer',
      b2cExportExplorer: 'config.b2c-dx.features.exportExplorer',
      b2cCipAnalytics: 'config.b2c-dx.features.cipAnalytics',
    };
    const allViews = Object.values(pkg.contributes.views).flatMap((v) => v);
    for (const [id, expected] of Object.entries(gated)) {
      const view = allViews.find((v) => v.id === id);
      assert.ok(view, `view ${id} must exist`);
      assert.strictEqual(view!.when, expected, `view ${id} must be gated by ${expected}`);
    }
  });

  test('preview-feature palette commands are gated by their feature setting', () => {
    const palette: Array<{command: string; when?: string}> = pkg.contributes.menus?.commandPalette ?? [];
    const whenFor = (cmd: string) => palette.find((e) => e.command === cmd)?.when;
    const cases: Array<[string, string]> = [
      ['b2c-dx.jobs.run', 'config.b2c-dx.features.jobsExplorer'],
      ['b2c-dx.jobs.refresh', 'config.b2c-dx.features.jobsExplorer'],
      ['b2c-dx.export.run', 'config.b2c-dx.features.exportExplorer'],
      ['b2c-dx.cipAnalytics.queryBuilder', 'config.b2c-dx.features.cipAnalytics'],
      ['b2c-dx.onboarding.open', 'config.b2c-dx.features.onboarding'],
    ];
    for (const [cmd, expected] of cases) {
      assert.strictEqual(whenFor(cmd), expected, `${cmd} must be palette-gated by ${expected}`);
    }
  });

  test('onboarding walkthrough is gated by its feature setting', () => {
    const walkthrough = (pkg.contributes.walkthroughs ?? []).find((w) => w.id === 'b2c-dx.gettingStarted');
    assert.ok(walkthrough, 'the b2c-dx.gettingStarted walkthrough must exist');
    assert.strictEqual(
      walkthrough!.when,
      'config.b2c-dx.features.onboarding',
      'the onboarding walkthrough must be gated by config.b2c-dx.features.onboarding',
    );
  });

  test('every contributed view has an auto-registered focus command', async () => {
    const registered = new Set(await vscode.commands.getCommands(true));
    // A view gated by a `when: config.b2c-dx.features.X` clause is not
    // instantiated (and gets no `.focus` command) when that feature is disabled.
    // The three preview features default off, so exclude any view whose when
    // clause references a currently-disabled feature.
    const config = vscode.workspace.getConfiguration();
    const viewIsActive = (view: {when?: string}): boolean => {
      const match = view.when?.match(/config\.(b2c-dx\.features\.[A-Za-z]+)/);
      if (!match) return true;
      return config.get<boolean>(match[1], false);
    };
    const viewIds = Object.values(pkg.contributes.views)
      .flatMap((views) => views)
      .filter(viewIsActive)
      .map((v) => v.id);
    assert.ok(viewIds.length > 0, 'expected at least one active contributed view');

    // VS Code auto-registers `<viewId>.focus` for every active declared view.
    const missing = viewIds.filter((id) => !registered.has(`${id}.focus`));
    assert.deepStrictEqual(missing, [], 'every active declared view must have an auto-generated focus command');
  });
});
