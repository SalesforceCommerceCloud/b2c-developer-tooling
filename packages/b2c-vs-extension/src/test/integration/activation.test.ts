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
}
interface PackageJson {
  contributes: {
    commands: ContributedCommand[];
    views: Record<string, ContributedView[]>;
    debuggers: Array<{type: string}>;
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
  test('every contributed command is registered', async () => {
    const registered = new Set(await vscode.commands.getCommands(true));
    const missing = pkg.contributes.commands.filter((c) => !registered.has(c.command));
    assert.deepStrictEqual(
      missing.map((c) => c.command),
      [],
      'all contributed commands must be registered after activation',
    );
  });

  test('declared debug type matches the script debugger', () => {
    const types = pkg.contributes.debuggers.map((d) => d.type);
    assert.ok(types.includes('b2c-script'), 'b2c-script debug type must be declared');
  });

  test('every contributed view has an auto-registered focus command', async () => {
    const registered = new Set(await vscode.commands.getCommands(true));
    const viewIds = Object.values(pkg.contributes.views).flatMap((views) => views.map((v) => v.id));
    assert.ok(viewIds.length > 0, 'expected at least one contributed view');

    // VS Code auto-registers `<viewId>.focus` for every declared view.
    const missing = viewIds.filter((id) => !registered.has(`${id}.focus`));
    assert.deepStrictEqual(missing, [], 'every declared view must have an auto-generated focus command');
  });
});
