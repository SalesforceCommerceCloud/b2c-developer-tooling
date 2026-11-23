/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {BaseCommand, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {IndexedJobStep} from '@salesforce/b2c-tooling-sdk/project-index';
import {t, withDocs} from '../../../i18n/index.js';
import {allCartridgesFlag, displayPath, loadProjectIndex, projectRoot} from '../../../utils/project/index.js';

type Row = IndexedJobStep & {implementationPath?: string};

const COLUMNS: Record<string, ColumnDef<Row>> = {
  typeId: {header: 'Step type', get: (r) => r.typeId},
  kind: {header: 'Kind', get: (r) => (r.kind === 'chunk-script-module-step' ? 'chunk' : 'task')},
  cartridge: {header: 'Cartridge', get: (r) => r.cartridge},
  parameters: {header: 'Parameters', get: (r) => r.parameters.map((p) => p.name).join(', ')},
  implementation: {header: 'Implementation', get: (r) => r.implementationPath ?? r.module ?? '', extended: true},
  issues: {header: 'Issues', get: (r) => r.problems.join(' ')},
};

const tableRenderer = new TableRenderer(COLUMNS);

export default class ProjectJobStepsList extends BaseCommand<typeof ProjectJobStepsList> {
  static args = {
    filter: Args.string({description: 'Only step types whose ID contains this text, for example "export"'}),
  };

  static description = withDocs(
    t(
      'commands.project.job-steps.list.description',
      '[PREVIEW] List custom job step types registered in steptypes.json with their parameters and implementing module',
    ),
    '/cli/project.html#b2c-project-job-steps-list',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> export --json'];

  static flags = {
    'all-cartridges': allCartridgesFlag,
    ...BaseCommand.baseFlags,
    cartridge: Flags.string({description: 'Only step types registered by this cartridge'}),
    extended: Flags.boolean({char: 'x', description: 'Show extended columns (implementation)', default: false}),
  };

  protected operations = {loadProjectIndex};

  async run(): Promise<{jobSteps: IndexedJobStep[]}> {
    const {args, flags} = await this.parse(ProjectJobStepsList);
    const index = this.operations.loadProjectIndex(
      this.resolvedConfig.values.cartridges,
      [],
      projectRoot(this.resolvedConfig),
      this.resolvedConfig.values.siteId,
      flags['all-cartridges'],
    );
    const filter = args.filter?.toLowerCase();
    const jobSteps = index.jobSteps
      .filter(
        (s) =>
          (!filter || s.typeId.toLowerCase().includes(filter)) && (!flags.cartridge || s.cartridge === flags.cartridge),
      )
      .sort((a, b) => a.typeId.localeCompare(b.typeId));

    if (this.jsonEnabled()) return {jobSteps};
    if (jobSteps.length === 0) {
      this.log(t('commands.project.job-steps.none', 'No matching custom job steps.'));
      return {jobSteps};
    }
    const rows: Row[] = jobSteps.map((s) => ({
      ...s,
      ...(s.implementationFile
        ? {
            implementationPath: displayPath(
              index,
              s.implementationFile.cartridge,
              s.implementationFile.relPath,
              s.implementationFile.line,
            ),
          }
        : {}),
    }));
    tableRenderer.render(rows, [
      'typeId',
      'kind',
      'cartridge',
      'parameters',
      ...(flags.extended ? ['implementation'] : []),
      'issues',
    ]);
    return {jobSteps};
  }
}
