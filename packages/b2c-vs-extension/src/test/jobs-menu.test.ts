/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';

const PACKAGE_JSON_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'package.json');

interface MenuEntry {
  command?: string;
  when?: string;
  group?: string;
}

interface PackageJson {
  contributes: {
    commands: Array<{command: string; title: string}>;
    views: Record<string, Array<{id: string; visibility?: string}>>;
    menus: {
      'view/item/context': MenuEntry[];
      'view/title': MenuEntry[];
      commandPalette: MenuEntry[];
    };
    configuration: {
      properties: Record<string, unknown>;
    };
  };
}

function loadPackageJson(): PackageJson {
  return JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
}

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

function whenClauseMatches(whenClause: string | undefined, viewItem: string): boolean {
  if (!whenClause) return false;
  const regex = extractViewItemRegex(whenClause);
  if (regex) return regex.test(viewItem);
  const eq = extractViewItemEquals(whenClause);
  if (eq) return eq === viewItem;
  return false;
}

suite('jobs menu contributions (package.json)', () => {
  let pkg: PackageJson;
  let contextEntries: Record<string, MenuEntry>;

  suiteSetup(() => {
    pkg = loadPackageJson();
    contextEntries = {};
    for (const entry of pkg.contributes.menus['view/item/context']) {
      if (entry.command?.startsWith('b2c-dx.jobs.') && entry.when?.includes('b2cJobsExplorer')) {
        contextEntries[entry.command] = entry;
      }
    }
  });

  test('job history view lives under the primary b2c-dx container and is collapsed by default', () => {
    const b2cDxViews = pkg.contributes.views['b2c-dx'] ?? [];
    const historyView = b2cDxViews.find((view) => view.id === 'b2cJobsExplorer');
    assert.ok(historyView, 'b2cJobsExplorer view should live under the b2c-dx container');
    assert.strictEqual(
      historyView!.visibility,
      'collapsed',
      'b2cJobsExplorer should be collapsed by default to stay out of the way until the user opens it',
    );

    // The Job Definitions view was retired during the W-23195590 rework; the
    // scaffold action moved into the Cartridges explorer.
    const allViews = Object.values(pkg.contributes.views).flatMap((items) => items);
    assert.ok(
      !allViews.some((view) => view.id === 'b2cJobDefinitionsExplorer'),
      'b2cJobDefinitionsExplorer should no longer be declared',
    );

    // The dedicated "B2C-DX Operations" container that held the old two-view
    // layout has also been removed.
    assert.ok(
      !Object.prototype.hasOwnProperty.call(pkg.contributes.views, 'b2c-dx-operations'),
      'b2c-dx-operations container should no longer be declared',
    );
  });

  test('jobs settings are declared', () => {
    const expectedSettings = [
      'b2c-dx.features.jobsExplorer',
      'b2c-dx.jobs.refreshInterval',
      'b2c-dx.jobs.discoveryExecutionScanLimit',
      'b2c-dx.jobs.defaultStatusFilter',
      'b2c-dx.jobs.defaultGrouping',
      'b2c-dx.jobs.autoRefresh',
      'b2c-dx.jobs.knownJobIds',
    ];
    for (const setting of expectedSettings) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(pkg.contributes.configuration.properties, setting),
        `${setting} should be declared`,
      );
    }

    // Definition-discovery globs and the per-job history-limit are gone —
    // definitions are no longer surfaced from a workspace-glob scan and the
    // chronological feed renders flat (no per-job drill-down).
    for (const removed of ['b2c-dx.jobs.definitionGlobs', 'b2c-dx.jobs.historyLimit']) {
      assert.ok(
        !Object.prototype.hasOwnProperty.call(pkg.contributes.configuration.properties, removed),
        `${removed} should no longer be declared`,
      );
    }

    // defaultGrouping must default to the BM-style timeline so the view feels
    // familiar to anyone coming from Business Manager. Grouping is opt-in via
    // the title-bar toggle.
    const grouping = pkg.contributes.configuration.properties['b2c-dx.jobs.defaultGrouping'] as {
      default?: string;
      enum?: string[];
    };
    assert.strictEqual(grouping.default, 'chronological', 'defaultGrouping must default to chronological');
    assert.deepStrictEqual(
      grouping.enum,
      ['chronological', 'groupByJobId'],
      'defaultGrouping enum must offer both views',
    );
  });

  test('default status filter covers the BM-style timeline view', () => {
    const statusFilter = pkg.contributes.configuration.properties['b2c-dx.jobs.defaultStatusFilter'] as {
      default?: string;
      enum?: string[];
    };
    assert.strictEqual(
      statusFilter.default,
      'all',
      "defaultStatusFilter must default to 'all' so the view isn't empty on first load",
    );
    assert.ok(statusFilter.enum?.includes('all'), "defaultStatusFilter enum must include 'all'");

    const autoRefresh = pkg.contributes.configuration.properties['b2c-dx.jobs.autoRefresh'] as {
      default?: boolean;
    };
    assert.strictEqual(
      autoRefresh.default,
      false,
      'autoRefresh must default to false — view auto-loads once, then only re-fetches when the user opts in',
    );
  });

  test('jobs commands are declared and hidden from command palette where appropriate', () => {
    const expectedCommands = [
      'b2c-dx.jobs.openFilters',
      'b2c-dx.jobs.refresh',
      'b2c-dx.jobs.setStatusFilter',
      'b2c-dx.jobs.setHistoryFilters',
      'b2c-dx.jobs.setNameFilter',
      'b2c-dx.jobs.toggleAutoRefresh',
      'b2c-dx.jobs.toggleGrouping',
      'b2c-dx.jobs.importSiteArchive',
      'b2c-dx.jobs.exportSiteArchive',
      'b2c-dx.jobs.run',
      'b2c-dx.jobs.createScaffold',
      'b2c-dx.jobs.rerun',
      'b2c-dx.jobs.stop',
      'b2c-dx.jobs.viewExecutionDetails',
      'b2c-dx.jobs.openExecutionInBM',
      'b2c-dx.jobs.openExecutionLog',
      'b2c-dx.jobs.openFailureLog',
      'b2c-dx.jobs.openBmDefinitions',
    ];
    for (const command of expectedCommands) {
      assert.ok(
        pkg.contributes.commands.some((item) => item.command === command),
        `${command} should be declared in contributes.commands`,
      );
    }

    // The webview, definitions tree, and standalone jobs.xml deploy flow are
    // all gone; their commands must be too. Job deployment now flows through
    // the cartridge deploy pipeline.
    const removedCommands = [
      'b2c-dx.jobs.openHistoryTable',
      'b2c-dx.jobs.refreshDefinitions',
      'b2c-dx.jobs.deployScaffold',
      'b2c-dx.jobs.deployDefinition',
      'b2c-dx.jobs.openDefinitionFile',
    ];
    for (const command of removedCommands) {
      assert.ok(
        !pkg.contributes.commands.some((item) => item.command === command),
        `${command} should no longer be declared`,
      );
    }

    const hiddenInPalette = new Set(
      pkg.contributes.menus.commandPalette
        .filter((entry) => entry.when === 'false' && entry.command?.startsWith('b2c-dx.jobs.'))
        .map((entry) => entry.command!),
    );
    for (const command of [
      'b2c-dx.jobs.rerun',
      'b2c-dx.jobs.stop',
      'b2c-dx.jobs.viewExecutionDetails',
      'b2c-dx.jobs.openExecutionLog',
      'b2c-dx.jobs.openFailureLog',
    ]) {
      assert.ok(hiddenInPalette.has(command), `${command} should be hidden from command palette`);
    }
  });

  test('job history title bar exposes the expected actions', () => {
    const titleEntries = pkg.contributes.menus['view/title'].filter((entry) => entry.when?.includes('b2cJobsExplorer'));
    const titleCommands = new Set(titleEntries.map((entry) => entry.command));
    for (const command of [
      'b2c-dx.jobs.refresh',
      'b2c-dx.jobs.enableAutoRefresh',
      'b2c-dx.jobs.disableAutoRefresh',
      'b2c-dx.jobs.toggleGrouping',
      'b2c-dx.jobs.setNameFilter',
      'b2c-dx.jobs.openBmDefinitions',
      'b2c-dx.jobs.run',
    ]) {
      assert.ok(titleCommands.has(command), `${command} should appear in the Job History title bar`);
    }

    // The two state-specific commands must be gated on opposite sides of the
    // autoRefreshEnabled context so exactly one icon is visible at any time.
    const enableEntry = titleEntries.find((entry) => entry.command === 'b2c-dx.jobs.enableAutoRefresh');
    const disableEntry = titleEntries.find((entry) => entry.command === 'b2c-dx.jobs.disableAutoRefresh');
    assert.ok(
      enableEntry?.when?.includes('!b2c-dx.jobs.autoRefreshEnabled'),
      'Enable variant must be gated on !autoRefreshEnabled',
    );
    assert.ok(
      disableEntry?.when?.includes('b2c-dx.jobs.autoRefreshEnabled') &&
        !disableEntry.when.includes('!b2c-dx.jobs.autoRefreshEnabled'),
      'Disable variant must be gated on autoRefreshEnabled',
    );
  });

  test('Create Job Scaffold is offered from the Cartridges explorer right-click menu', () => {
    const cartridgeEntries = pkg.contributes.menus['view/item/context'].filter((entry) =>
      entry.when?.includes('b2cCartridgeExplorer'),
    );
    assert.ok(
      cartridgeEntries.some(
        (entry) => entry.command === 'b2c-dx.jobs.createScaffold' && whenClauseMatches(entry.when, 'cartridge'),
      ),
      'createScaffold should be available on cartridge nodes inside the Cartridges explorer',
    );
  });

  test('jobs context menu visibility aligns with execution states', () => {
    const runWhen = contextEntries['b2c-dx.jobs.run']?.when;
    // Run is now offered on execution rows directly (the chronological feed
    // is the only level in the tree).
    assert.ok(whenClauseMatches(runWhen, 'jobExecution-running'));
    assert.ok(whenClauseMatches(runWhen, 'jobExecution-completed'));

    // Scaffold and deploy actions are no longer surfaced on the Job History
    // tree — they belong on cartridges / via the palette.
    assert.ok(
      !contextEntries['b2c-dx.jobs.createScaffold'],
      'createScaffold should not be in the Job History context menu',
    );

    const stopWhen = contextEntries['b2c-dx.jobs.stop']?.when;
    assert.ok(whenClauseMatches(stopWhen, 'jobExecution-running'));
    assert.ok(!whenClauseMatches(stopWhen, 'jobExecution-completed'));
    assert.ok(!whenClauseMatches(stopWhen, 'jobExecution-failed'));

    const failureLogWhen = contextEntries['b2c-dx.jobs.openFailureLog']?.when;
    assert.ok(whenClauseMatches(failureLogWhen, 'jobExecution-failed'));
    assert.ok(!whenClauseMatches(failureLogWhen, 'jobExecution-running'));
  });
});
