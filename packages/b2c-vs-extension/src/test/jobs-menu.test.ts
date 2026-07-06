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
    commands: Array<{command: string; title: string; icon?: string}>;
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
  /**
   * Multi-map — a single command can appear more than once in `view/item/context`
   * with different `when` clauses (e.g. `b2c-dx.jobs.run` is offered on both
   * execution rows AND workspace-job rows, each with its own context value).
   * Tests read this list and assert `some(...)` rather than deduping by command,
   * which would silently drop everything past the first entry.
   */
  let contextEntries: Record<string, MenuEntry[]>;

  suiteSetup(() => {
    pkg = loadPackageJson();
    contextEntries = {};
    for (const entry of pkg.contributes.menus['view/item/context']) {
      if (entry.command?.startsWith('b2c-dx.jobs.') && entry.when?.includes('b2cJobsExplorer')) {
        (contextEntries[entry.command] ??= []).push(entry);
      }
    }
  });

  function anyEntryMatches(command: string, viewItem: string): boolean {
    const entries = contextEntries[command] ?? [];
    return entries.some((entry) => whenClauseMatches(entry.when, viewItem));
  }

  test('jobs view lives under the primary b2c-dx container and is collapsed by default', () => {
    const b2cDxViews = pkg.contributes.views['b2c-dx'] ?? [];
    const jobsView = b2cDxViews.find((view) => view.id === 'b2cJobsExplorer');
    assert.ok(jobsView, 'b2cJobsExplorer view should live under the b2c-dx container');
    assert.strictEqual(
      (jobsView as {name?: string}).name,
      'Jobs',
      'b2cJobsExplorer should be labeled "Jobs" — the view surfaces workspace jobs alongside history in one tree',
    );
    assert.strictEqual(
      jobsView!.visibility,
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
      'b2c-dx.jobs.openFiltersActive',
      'b2c-dx.jobs.clearAllFilters',
      'b2c-dx.jobs.refresh',
      'b2c-dx.jobs.setStatusFilter',
      'b2c-dx.jobs.setHistoryFilters',
      'b2c-dx.jobs.setNameFilter',
      'b2c-dx.jobs.toggleAutoRefresh',
      'b2c-dx.jobs.toggleGrouping',
      'b2c-dx.jobs.toggleGroupingChronological',
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
      // Right-click action on Workspace Jobs rows — jumps to the declaring
      // jobs.xml at the matching <job> block so users can inspect/edit the
      // definition without hunting for the file.
      'b2c-dx.jobs.openDefinitionFile',
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
      // Alias command that only exists to render a different title-bar icon
      // when filters are active; the primary `openFilters` handles palette access.
      'b2c-dx.jobs.openFiltersActive',
      // Only invoked from the empty-state tree row; palette entry would be a dead-end.
      'b2c-dx.jobs.clearAllFilters',
      // Right-click-only action; requires a workspace-job node to know which
      // jobs.xml to open, so a bare palette invocation would be a dead-end.
      'b2c-dx.jobs.openDefinitionFile',
      // Alias command that only exists to render a different title-bar icon
      // when grouping is on; the primary `toggleGrouping` handles palette access.
      'b2c-dx.jobs.toggleGroupingChronological',
    ]) {
      assert.ok(hiddenInPalette.has(command), `${command} should be hidden from command palette`);
    }
  });

  test('grouping title-bar icon swaps between list-flat and list-tree based on current mode', () => {
    const titleEntries = pkg.contributes.menus['view/title'].filter((entry) => entry.when?.includes('b2cJobsExplorer'));
    const flatEntry = titleEntries.find((entry) => entry.command === 'b2c-dx.jobs.toggleGrouping');
    const treeEntry = titleEntries.find((entry) => entry.command === 'b2c-dx.jobs.toggleGroupingChronological');
    assert.ok(flatEntry, 'chronological-mode icon entry must exist');
    assert.ok(treeEntry, 'grouped-mode icon entry must exist');
    // list-flat is shown while chronological (action = switch to grouped);
    // list-tree is shown while grouped (action = switch back to chronological).
    assert.ok(
      flatEntry.when?.includes('b2c-dx.jobs.groupingMode != groupByJobId'),
      'chronological variant must be gated when NOT grouped',
    );
    assert.ok(
      treeEntry.when?.includes('b2c-dx.jobs.groupingMode == groupByJobId'),
      'grouped variant must be gated when grouped',
    );
    const flatCmd = pkg.contributes.commands.find((c) => c.command === 'b2c-dx.jobs.toggleGrouping');
    const treeCmd = pkg.contributes.commands.find((c) => c.command === 'b2c-dx.jobs.toggleGroupingChronological');
    assert.strictEqual(flatCmd?.icon, '$(list-flat)');
    assert.strictEqual(treeCmd?.icon, '$(list-tree)');
  });

  test('filter title-bar icon swaps between filled and outlined based on active filters', () => {
    const titleEntries = pkg.contributes.menus['view/title'].filter((entry) => entry.when?.includes('b2cJobsExplorer'));
    const outlineEntry = titleEntries.find((entry) => entry.command === 'b2c-dx.jobs.openFilters');
    const filledEntry = titleEntries.find((entry) => entry.command === 'b2c-dx.jobs.openFiltersActive');
    assert.ok(outlineEntry, 'outlined filter icon entry must exist');
    assert.ok(filledEntry, 'filled filter icon entry must exist');
    assert.ok(
      outlineEntry.when?.includes('!b2c-dx.jobs.hasActiveFilters'),
      'outlined variant must be gated on !hasActiveFilters',
    );
    assert.ok(
      filledEntry.when?.includes('b2c-dx.jobs.hasActiveFilters') &&
        !filledEntry.when.includes('!b2c-dx.jobs.hasActiveFilters'),
      'filled variant must be gated on hasActiveFilters',
    );
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
      assert.ok(titleCommands.has(command), `${command} should appear in the Jobs title bar`);
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

  test('workspace-job rows expose Run and Open jobs.xml on right-click', () => {
    // Workspace jobs are declared in a cartridge's jobs.xml but may not yet be
    // registered in Business Manager. The right-click menu is the primary
    // affordance for running them — the extension auto-deploys the definition
    // when BM doesn't know it yet — and for jumping to the source file for
    // inspection/edit.
    const workspaceEntries = pkg.contributes.menus['view/item/context'].filter(
      (entry) => entry.when?.includes('viewItem == workspaceJob') && entry.when?.includes('b2cJobsExplorer'),
    );
    const commands = new Set(workspaceEntries.map((entry) => entry.command));
    assert.ok(commands.has('b2c-dx.jobs.run'), 'Run must be on the workspace-job right-click menu');
    assert.ok(
      commands.has('b2c-dx.jobs.openDefinitionFile'),
      'Open jobs.xml must be on the workspace-job right-click menu',
    );
  });

  test('jobs context menu visibility aligns with execution states', () => {
    // Run is offered on both execution rows (chronological feed) AND workspace-job
    // rows — anyEntryMatches() checks every declared `when` clause for the command.
    assert.ok(anyEntryMatches('b2c-dx.jobs.run', 'jobExecution-running'));
    assert.ok(anyEntryMatches('b2c-dx.jobs.run', 'jobExecution-completed'));

    // Scaffold and deploy actions are no longer surfaced on the Job History
    // tree — they belong on cartridges / via the palette.
    assert.ok(
      !contextEntries['b2c-dx.jobs.createScaffold'],
      'createScaffold should not be in the Job History context menu',
    );

    assert.ok(anyEntryMatches('b2c-dx.jobs.stop', 'jobExecution-running'));
    assert.ok(!anyEntryMatches('b2c-dx.jobs.stop', 'jobExecution-completed'));
    assert.ok(!anyEntryMatches('b2c-dx.jobs.stop', 'jobExecution-failed'));

    assert.ok(anyEntryMatches('b2c-dx.jobs.openFailureLog', 'jobExecution-failed'));
    assert.ok(!anyEntryMatches('b2c-dx.jobs.openFailureLog', 'jobExecution-running'));
  });
});
