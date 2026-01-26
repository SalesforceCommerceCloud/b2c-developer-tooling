/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createProject, type MrtProject} from '@salesforce/b2c-tooling-sdk/operations/mrt';
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
function printProjectDetails(project: MrtProject): void {
  const ui = cliui({width: process.stdout.columns || 80});
  const labelWidth = 16;

  ui.div('');
  ui.div({text: 'Name:', width: labelWidth}, {text: project.name});
  ui.div({text: 'Slug:', width: labelWidth}, {text: project.slug ?? ''});
  ui.div({text: 'Organization:', width: labelWidth}, {text: project.organization});

  if (project.ssr_region) {
    ui.div({text: 'Region:', width: labelWidth}, {text: project.ssr_region});
  }

  if (project.url) {
    ui.div({text: 'URL:', width: labelWidth}, {text: project.url});
  }

  if (project.created_at) {
    ui.div({text: 'Created:', width: labelWidth}, {text: new Date(project.created_at).toLocaleString()});
  }

  ux.stdout(ui.toString());
}

/**
 * Create a new MRT project.
 */
export default class MrtProjectCreate extends MrtCommand<typeof MrtProjectCreate> {
  static args = {
    name: Args.string({
      description: 'Project name',
      required: true,
    }),
  };

  static description = t('commands.mrt.project.create.description', 'Create a new Managed Runtime project');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> "My Storefront" --organization my-org',
    '<%= config.bin %> <%= command.id %> "My Storefront" -o my-org --slug my-storefront',
    '<%= config.bin %> <%= command.id %> "My Storefront" -o my-org --region us-east-1',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    organization: Flags.string({
      char: 'o',
      description: 'Organization slug to create the project in',
      required: true,
    }),
    slug: Flags.string({
      char: 's',
      description: 'Project slug (auto-generated if not provided)',
    }),
    url: Flags.string({
      description: 'Project URL',
    }),
    region: Flags.string({
      char: 'r',
      description: 'Default AWS region for new environments',
      options: SSR_REGIONS as unknown as string[],
    }),
  };

  async run(): Promise<MrtProject> {
    this.requireMrtCredentials();

    const {name} = this.args;
    const {organization, slug, url, region} = this.flags;

    this.log(
      t('commands.mrt.project.create.creating', 'Creating project "{{name}}" in {{organization}}...', {
        name,
        organization,
      }),
    );

    try {
      const result = await createProject(
        {
          name,
          organization,
          slug,
          url,
          ssrRegion: region as SsrRegion | undefined,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (this.jsonEnabled()) {
        return result;
      }

      this.log(t('commands.mrt.project.create.success', 'Project created successfully.'));
      printProjectDetails(result);

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.project.create.failed', 'Failed to create project: {{message}}', {message: error.message}),
        );
      }
      throw error;
    }
  }
}
