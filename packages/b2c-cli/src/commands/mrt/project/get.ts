/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, ux} from '@oclif/core';
import cliui from 'cliui';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getProject, type MrtProjectUpdate} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

/**
 * Print project details in a formatted display.
 */
function printProjectDetails(project: MrtProjectUpdate): void {
  const ui = cliui({width: process.stdout.columns || 80});
  const labelWidth = 16;

  ui.div('');
  ui.div({text: 'Name:', width: labelWidth}, {text: project.name});
  ui.div({text: 'Slug:', width: labelWidth}, {text: project.slug ?? ''});
  ui.div({text: 'Organization:', width: labelWidth}, {text: project.organization ?? ''});
  ui.div({text: 'Type:', width: labelWidth}, {text: project.project_type ?? '-'});
  ui.div({text: 'Status:', width: labelWidth}, {text: project.deletion_status ?? 'active'});

  if (project.ssr_region) {
    ui.div({text: 'Region:', width: labelWidth}, {text: project.ssr_region});
  }

  if (project.url) {
    ui.div({text: 'URL:', width: labelWidth}, {text: project.url});
  }

  if (project.created_at) {
    ui.div({text: 'Created:', width: labelWidth}, {text: new Date(project.created_at).toLocaleString()});
  }

  if (project.updated_at) {
    ui.div({text: 'Updated:', width: labelWidth}, {text: new Date(project.updated_at).toLocaleString()});
  }

  ux.stdout(ui.toString());
}

/**
 * Get details of an MRT project.
 */
export default class MrtProjectGet extends MrtCommand<typeof MrtProjectGet> {
  static args = {
    slug: Args.string({
      description: 'Project slug',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.mrt.project.get.description', 'Get details of a Managed Runtime project'),
    '/cli/mrt.html#b2c-mrt-project-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> my-storefront',
    '<%= config.bin %> <%= command.id %> my-storefront --json',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  async run(): Promise<MrtProjectUpdate> {
    this.requireMrtCredentials();

    const {slug} = this.args;

    this.log(t('commands.mrt.project.get.fetching', 'Fetching project "{{slug}}"...', {slug}));

    try {
      const result = await getProject(
        {
          projectSlug: slug,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (this.jsonEnabled()) {
        return result;
      }

      printProjectDetails(result);

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.project.get.failed', 'Failed to get project: {{message}}', {message: error.message}),
        );
      }
      throw error;
    }
  }
}
