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
}

interface PackageJson {
  contributes: {
    commands: Array<{command: string; title: string}>;
    views: Record<string, Array<{id: string}>>;
    menus: {'view/item/context': MenuEntry[]; commandPalette: MenuEntry[]};
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
    // Key by command for the History view only. Some commands (e.g. run) are
    // contributed to both the History and Definitions views; the execution-state
    // assertions below target the History contributions.
    for (const entry of pkg.contributes.menus['view/item/context']) {
      if (entry.command?.startsWith('b2c-dx.jobs.') && entry.when?.includes('b2cJobsExplorer')) {
        contextEntries[entry.command] = entry;
      }
    }
  });

  test('job history view and settings are declared', () => {
    const views = Object.values(pkg.contributes.views).flatMap((items) => items);
    assert.ok(
      views.some((view) => view.id === 'b2cJobsExplorer'),
      'b2cJobsExplorer view should be declared',
    );
    assert.ok(
      views.some((view) => view.id === 'b2cJobDefinitionsExplorer'),
      'b2cJobDefinitionsExplorer view should be declared',
    );

    assert.ok(
      Object.hasOwn(pkg.contributes.configuration.properties, 'b2c-dx.features.jobsExplorer'),
      'job history feature flag should be declared',
    );
    assert.ok(
      Object.hasOwn(pkg.contributes.configuration.properties, 'b2c-dx.jobs.refreshInterval'),
      'jobs refresh interval setting should be declared',
    );
    assert.ok(
      Object.hasOwn(pkg.contributes.configuration.properties, 'b2c-dx.jobs.discoveryExecutionScanLimit'),
      'jobs discovery scan limit setting should be declared',
    );
    assert.ok(
      Object.hasOwn(pkg.contributes.configuration.properties, 'b2c-dx.jobs.historyLimit'),
      'jobs history limit setting should be declared',
    );
    assert.ok(
      Object.hasOwn(pkg.contributes.configuration.properties, 'b2c-dx.jobs.defaultStatusFilter'),
      'jobs default status filter setting should be declared',
    );
    assert.ok(
      Object.hasOwn(pkg.contributes.configuration.properties, 'b2c-dx.jobs.knownJobIds'),
      'jobs known job IDs setting should be declared',
    );
    assert.ok(
      Object.hasOwn(pkg.contributes.configuration.properties, 'b2c-dx.jobs.definitionGlobs'),
      'jobs definition globs setting should be declared',
    );
  });

  test('jobs commands are declared and hidden from command palette where appropriate', () => {
    const expectedCommands = [
      'b2c-dx.jobs.openFilters',
      'b2c-dx.jobs.refresh',
      'b2c-dx.jobs.setStatusFilter',
      'b2c-dx.jobs.setHistoryFilters',
      'b2c-dx.jobs.openHistoryTable',
      'b2c-dx.jobs.exportFilteredHistory',
      'b2c-dx.jobs.importSiteArchive',
      'b2c-dx.jobs.exportSiteArchive',
      'b2c-dx.jobs.run',
      'b2c-dx.jobs.createScaffold',
      'b2c-dx.jobs.deployScaffold',
      'b2c-dx.jobs.rerun',
      'b2c-dx.jobs.stop',
      'b2c-dx.jobs.viewExecutionDetails',
      'b2c-dx.jobs.openExecutionInBM',
      'b2c-dx.jobs.openExecutionLog',
      'b2c-dx.jobs.openFailureLog',
      'b2c-dx.jobs.refreshDefinitions',
      'b2c-dx.jobs.deployDefinition',
      'b2c-dx.jobs.openDefinitionFile',
      'b2c-dx.jobs.openBmDefinitions',
    ];

    for (const command of expectedCommands) {
      assert.ok(
        pkg.contributes.commands.some((item) => item.command === command),
        `${command} should be declared in contributes.commands`,
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
      'b2c-dx.jobs.openExecutionInBM',
      'b2c-dx.jobs.openExecutionLog',
      'b2c-dx.jobs.openFailureLog',
      'b2c-dx.jobs.deployDefinition',
      'b2c-dx.jobs.openDefinitionFile',
    ]) {
      assert.ok(hiddenInPalette.has(command), `${command} should be hidden from command palette`);
    }
  });

  test('job definitions context menu visibility aligns with node types', () => {
    const runWhen = contextEntries['b2c-dx.jobs.run']?.when;
    // Run is shared between History (job-*) and Definitions (jobDefinition) views;
    // assert the History clause still matches and a Definitions clause exists.
    const definitionsEntries = pkg.contributes.menus['view/item/context'].filter((entry) =>
      entry.when?.includes('b2cJobDefinitionsExplorer'),
    );
    assert.ok(
      definitionsEntries.some((entry) => entry.command === 'b2c-dx.jobs.run' && entry.when?.includes('jobDefinition')),
      'Run should be available on jobDefinition nodes',
    );
    assert.ok(
      definitionsEntries.some(
        (entry) => entry.command === 'b2c-dx.jobs.deployDefinition' && entry.when?.includes('jobDefinition'),
      ),
      'Deploy Definition should be available on jobDefinition nodes',
    );
    assert.ok(
      definitionsEntries.some(
        (entry) => entry.command === 'b2c-dx.jobs.openDefinitionFile' && entry.when?.includes('jobStepType'),
      ),
      'Open Definition File should be available on jobStepType nodes',
    );
    assert.ok(runWhen, 'run command should still have a History when-clause');
  });

  test('jobs context menu visibility aligns with execution states', () => {
    const runWhen = contextEntries['b2c-dx.jobs.run']?.when;
    assert.ok(whenClauseMatches(runWhen, 'job-running'));
    assert.ok(whenClauseMatches(runWhen, 'job-completed'));

    const createScaffoldWhen = contextEntries['b2c-dx.jobs.createScaffold']?.when;
    assert.ok(whenClauseMatches(createScaffoldWhen, 'job-running'));
    assert.ok(whenClauseMatches(createScaffoldWhen, 'job-completed'));

    const deployScaffoldWhen = contextEntries['b2c-dx.jobs.deployScaffold']?.when;
    assert.ok(whenClauseMatches(deployScaffoldWhen, 'job-running'));
    assert.ok(whenClauseMatches(deployScaffoldWhen, 'job-completed'));

    const stopWhen = contextEntries['b2c-dx.jobs.stop']?.when;
    assert.ok(whenClauseMatches(stopWhen, 'jobExecution-running'));
    assert.ok(!whenClauseMatches(stopWhen, 'jobExecution-completed'));
    assert.ok(!whenClauseMatches(stopWhen, 'jobExecution-failed'));

    const failureLogWhen = contextEntries['b2c-dx.jobs.openFailureLog']?.when;
    assert.ok(whenClauseMatches(failureLogWhen, 'jobExecution-failed'));
    assert.ok(!whenClauseMatches(failureLogWhen, 'jobExecution-running'));
  });
});
