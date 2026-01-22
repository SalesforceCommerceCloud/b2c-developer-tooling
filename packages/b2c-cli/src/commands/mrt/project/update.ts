/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {updateProject, type MrtProjectUpdate as MrtProjectUpdateType} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t} from '../../../i18n/index.js';

/**
 * Valid AWS regions for MRT projects.
 */
const SSR_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-south-1',
  'ap-south-2',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-southeast-3',
  'ap-northeast-1',
  'ap-northeast-3',
  'ca-central-1',
  'eu-central-1',
  'eu-central-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'eu-south-1',
  'il-central-1',
  'me-central-1',
  'sa-east-1',
] as const;

type SsrRegion = (typeof SSR_REGIONS)[number];

/**
 * Print project details in a formatted display.
 */
function printProjectDetails(project: MrtProjectUpdateType): void {
  const ui = cliui({width: process.stdout.columns || 80});
  const labelWidth = 16;

  ui.div('');
  ui.div({text: 'Name:', width: labelWidth}, {text: project.name});
  ui.div({text: 'Slug:', width: labelWidth}, {text: project.slug ?? ''});
  ui.div({text: 'Organization:', width: labelWidth}, {text: project.organization ?? ''});

  if (project.ssr_region) {
    ui.div({text: 'Region:', width: labelWidth}, {text: project.ssr_region});
  }

  if (project.url) {
    ui.div({text: 'URL:', width: labelWidth}, {text: project.url});
  }

  if (project.updated_at) {
    ui.div({text: 'Updated:', width: labelWidth}, {text: new Date(project.updated_at).toLocaleString()});
  }

  ux.stdout(ui.toString());
}

/**
 * Update an MRT project.
 */
export default class MrtProjectUpdate extends MrtCommand<typeof MrtProjectUpdate> {
  static args = {
    slug: Args.string({
      description: 'Project slug',
      required: true,
    }),
  };

  static description = t('commands.mrt.project.update.description', 'Update a Managed Runtime project');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> my-storefront --name "New Name"',
    '<%= config.bin %> <%= command.id %> my-storefront --region eu-west-1',
    '<%= config.bin %> <%= command.id %> my-storefront --url https://example.com',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'New name for the project',
    }),
    url: Flags.string({
      description: 'New URL for the project',
    }),
    region: Flags.string({
      char: 'r',
      description: 'New default AWS region for new environments',
      options: SSR_REGIONS as unknown as string[],
    }),
  };

  async run(): Promise<MrtProjectUpdateType> {
    this.requireMrtCredentials();

    const {slug} = this.args;
    const {name, url, region} = this.flags;

    if (!name && !url && !region) {
      this.error('At least one of --name, --url, or --region must be provided.');
    }

    this.log(t('commands.mrt.project.update.updating', 'Updating project "{{slug}}"...', {slug}));

    try {
      const result = await updateProject(
        {
          projectSlug: slug,
          name,
          url,
          ssrRegion: region as SsrRegion | undefined,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (this.jsonEnabled()) {
        return result;
      }

      this.log(t('commands.mrt.project.update.success', 'Project updated successfully.'));
      printProjectDetails(result);

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.project.update.failed', 'Failed to update project: {{message}}', {message: error.message}),
        );
      }
      throw error;
    }
  }
}
