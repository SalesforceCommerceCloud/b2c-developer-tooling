/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

// Compiled test file lives at out/test/<file>.js; package.json is 2 levels up.
const PACKAGE_JSON_PATH = path.resolve(__dirname, '..', '..', 'package.json');

interface MenuEntry {
  command?: string;
  submenu?: string;
  when?: string;
  group?: string;
}

interface PackageJson {
  contributes: {
    commands: Array<{command: string; title: string}>;
    menus: {'view/item/context': MenuEntry[]; commandPalette: MenuEntry[]};
  };
}

function loadPackageJson(): PackageJson {
  return JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
}

function getSandboxMenuEntries(pkg: PackageJson): Record<string, MenuEntry> {
  const entries: Record<string, MenuEntry> = {};
  for (const entry of pkg.contributes.menus['view/item/context']) {
    if (entry.command && entry.command.startsWith('b2c-dx.sandbox.')) {
      entries[entry.command] = entry;
    }
  }
  return entries;
}

/** Extract the `viewItem =~ /.../ ` regex from a when clause. Returns null if the clause is not a regex. */
function extractViewItemRegex(whenClause: string | undefined): RegExp | null {
  if (!whenClause) return null;
  const match = whenClause.match(/viewItem =~ \/(.+?)\/(?=\s|$|&|\))/);
  return match ? new RegExp(match[1]) : null;
}

function extractViewItemEquals(whenClause: string | undefined): string | null {
  if (!whenClause) return null;
  const match = whenClause.match(/viewItem == ([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/** Does the when clause accept a given viewItem context value? */
function whenClauseMatches(whenClause: string | undefined, viewItem: string): boolean {
  if (!whenClause) return false;
  const regex = extractViewItemRegex(whenClause);
  if (regex) return regex.test(viewItem);
  const eq = extractViewItemEquals(whenClause);
  if (eq) return eq === viewItem;
  return false;
}

suite('sandbox menu contributions (package.json)', () => {
  let pkg: PackageJson;
  let menu: Record<string, MenuEntry>;

  suiteSetup(() => {
    pkg = loadPackageJson();
    menu = getSandboxMenuEntries(pkg);
  });

  suite('command registration', () => {
    test('Clone Sandbox command is declared', () => {
      const cmd = pkg.contributes.commands.find((c) => c.command === 'b2c-dx.sandbox.clone');
      assert.ok(cmd, 'b2c-dx.sandbox.clone must be declared in contributes.commands');
      assert.strictEqual(cmd?.title, 'Clone Sandbox');
    });

    test('View Clone Details command is declared', () => {
      const cmd = pkg.contributes.commands.find((c) => c.command === 'b2c-dx.sandbox.viewCloneDetails');
      assert.ok(cmd, 'b2c-dx.sandbox.viewCloneDetails must be declared in contributes.commands');
      assert.strictEqual(cmd?.title, 'View Clone Details');
    });

    test('both new commands are hidden from the Command Palette', () => {
      const paletteHidden = pkg.contributes.menus.commandPalette.filter(
        (e) =>
          (e.command === 'b2c-dx.sandbox.clone' || e.command === 'b2c-dx.sandbox.viewCloneDetails') &&
          e.when === 'false',
      );
      assert.strictEqual(paletteHidden.length, 2, 'both clone-related commands must be hidden from palette');
    });
  });

  suite('Clone Sandbox visibility', () => {
    const when = () => menu['b2c-dx.sandbox.clone']?.when;

    test('is shown for started sandboxes', () => {
      assert.ok(whenClauseMatches(when(), 'sandbox-started'));
      assert.ok(whenClauseMatches(when(), 'sandbox-started-cloned'));
    });

    test('is shown for stopped sandboxes', () => {
      assert.ok(whenClauseMatches(when(), 'sandbox-stopped'));
      assert.ok(whenClauseMatches(when(), 'sandbox-stopped-cloned'));
    });

    test('is hidden for cloning / settingup / other transitional states', () => {
      assert.ok(!whenClauseMatches(when(), 'sandbox-cloning'));
      assert.ok(!whenClauseMatches(when(), 'sandbox-cloning-cloned'));
      assert.ok(!whenClauseMatches(when(), 'sandbox-settingup'));
      assert.ok(!whenClauseMatches(when(), 'sandbox-settingup-cloned'));
      assert.ok(!whenClauseMatches(when(), 'sandbox-creating'));
      assert.ok(!whenClauseMatches(when(), 'sandbox-starting'));
      assert.ok(!whenClauseMatches(when(), 'sandbox-stopping'));
      assert.ok(!whenClauseMatches(when(), 'sandbox-deleting'));
      assert.ok(!whenClauseMatches(when(), 'sandbox-failed'));
      assert.ok(!whenClauseMatches(when(), 'sandbox-unknown'));
    });
  });

  suite('View Clone Details visibility', () => {
    const when = () => menu['b2c-dx.sandbox.viewCloneDetails']?.when;

    test('is shown only when the sandbox is a clone (has -cloned suffix)', () => {
      assert.ok(whenClauseMatches(when(), 'sandbox-started-cloned'));
      assert.ok(whenClauseMatches(when(), 'sandbox-stopped-cloned'));
      assert.ok(whenClauseMatches(when(), 'sandbox-settingup-cloned'));
      assert.ok(whenClauseMatches(when(), 'sandbox-cloning-cloned'));
    });

    test('is hidden for non-cloned sandboxes', () => {
      assert.ok(!whenClauseMatches(when(), 'sandbox-started'));
      assert.ok(!whenClauseMatches(when(), 'sandbox-stopped'));
      assert.ok(!whenClauseMatches(when(), 'sandbox-cloning'));
      assert.ok(!whenClauseMatches(when(), 'sandbox-failed'));
    });
  });

  suite('Start/Stop/Restart still match -cloned variants', () => {
    test('Start matches both sandbox-stopped and sandbox-stopped-cloned', () => {
      const when = menu['b2c-dx.sandbox.start']?.when;
      assert.ok(whenClauseMatches(when, 'sandbox-stopped'));
      assert.ok(whenClauseMatches(when, 'sandbox-stopped-cloned'));
      assert.ok(!whenClauseMatches(when, 'sandbox-started'));
    });

    test('Stop matches both sandbox-started and sandbox-started-cloned', () => {
      const when = menu['b2c-dx.sandbox.stop']?.when;
      assert.ok(whenClauseMatches(when, 'sandbox-started'));
      assert.ok(whenClauseMatches(when, 'sandbox-started-cloned'));
      assert.ok(!whenClauseMatches(when, 'sandbox-stopped'));
    });

    test('Restart matches both sandbox-started and sandbox-started-cloned', () => {
      const when = menu['b2c-dx.sandbox.restart']?.when;
      assert.ok(whenClauseMatches(when, 'sandbox-started'));
      assert.ok(whenClauseMatches(when, 'sandbox-started-cloned'));
    });
  });

  suite('Open BM / Extend Expiration / Delete hide during cloning & settingup', () => {
    const hiddenForStates = ['cloning', 'cloning-cloned', 'settingup', 'settingup-cloned'];
    const visibleForStates = ['started', 'started-cloned', 'stopped', 'stopped-cloned', 'failed'];

    for (const cmd of ['b2c-dx.sandbox.openBM', 'b2c-dx.sandbox.extendExpiration', 'b2c-dx.sandbox.delete']) {
      test(`${cmd} is hidden while cloning/settingup`, () => {
        const when = menu[cmd]?.when;
        for (const s of hiddenForStates) {
          assert.ok(!whenClauseMatches(when, `sandbox-${s}`), `${cmd} should be hidden for sandbox-${s}`);
        }
      });

      test(`${cmd} is visible for regular states`, () => {
        const when = menu[cmd]?.when;
        for (const s of visibleForStates) {
          assert.ok(whenClauseMatches(when, `sandbox-${s}`), `${cmd} should be visible for sandbox-${s}`);
        }
      });
    }
  });

  suite('View Details remains available in all sandbox states', () => {
    const when = () => menu['b2c-dx.sandbox.viewDetails']?.when;

    test('shown for every sandbox context value', () => {
      for (const s of [
        'started',
        'stopped',
        'cloning',
        'settingup',
        'creating',
        'starting',
        'stopping',
        'deleting',
        'failed',
        'unknown',
        'started-cloned',
        'settingup-cloned',
      ]) {
        assert.ok(whenClauseMatches(when(), `sandbox-${s}`), `View Details should show for sandbox-${s}`);
      }
    });
  });
});
