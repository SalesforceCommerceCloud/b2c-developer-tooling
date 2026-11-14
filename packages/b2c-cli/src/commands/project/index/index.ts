/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import {Args, Flags, ux} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {ProjectIndex} from '@salesforce/b2c-tooling-sdk/project-index';
import {t, withDocs} from '../../../i18n/index.js';
import {loadProjectIndex} from '../../../utils/project/index.js';

export default class ProjectIndexCommand extends BaseCommand<typeof ProjectIndexCommand> {
  static args = {
    paths: Args.string({
      description: 'Additional directories to search for cartridges (the current directory is always searched)',
    }),
  };

  static description = withDocs(
    t(
      'commands.project.index.description',
      'Build the project index: controller endpoints composed across the cartridge path, hooks, Custom APIs, and job steps, as JSON',
    ),
    '/cli/project.html#b2c-project-index',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
    '<%= config.bin %> <%= command.id %> --output project-index.json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    output: Flags.string({description: 'Write the index JSON to this file'}),
  };

  static strict = false;

  protected operations = {loadProjectIndex};

  async run(): Promise<ProjectIndex> {
    const {argv, flags} = await this.parse(ProjectIndexCommand);
    const index = this.operations.loadProjectIndex(this.resolvedConfig.values.cartridges, argv as string[]);
    if (flags.output) {
      fs.writeFileSync(flags.output, JSON.stringify(index, null, 2) + '\n');
    }
    if (this.jsonEnabled()) return index;

    const controllers = index.endpoints.filter((e) => e.kind !== 'pipeline').length;
    ux.stdout(
      t(
        'commands.project.index.summary',
        '{{cartridges}} cartridge(s): {{endpoints}} controller endpoint(s), {{hooks}} hook registration(s), {{apis}} Custom API endpoint(s), {{steps}} job step type(s).',
        {
          cartridges: index.cartridges.length,
          endpoints: controllers,
          hooks: index.hooks.length,
          apis: index.customApis.length,
          steps: index.jobSteps.length,
        },
      ),
    );
    ux.stdout(
      t('commands.project.index.order', 'Cartridge path: {{path}}', {
        path: index.cartridges.map((c) => c.name).join(':') || '(none)',
      }),
    );
    if (index.errors.length > 0) {
      ux.stdout(
        t('commands.project.index.errors', '{{count}} file(s) could not be parsed. Use --json to list them.', {
          count: index.errors.length,
        }),
      );
    }
    if (flags.output) ux.stdout(t('commands.project.index.wrote', 'Wrote {{file}}', {file: flags.output}));
    return index;
  }
}
