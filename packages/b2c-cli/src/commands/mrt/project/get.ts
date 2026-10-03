/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, ux} from '@oclif/core';
import cliui from 'cliui';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getProjectWithBackend, type MrtProjectView} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

/**
 * Print project details in a formatted display.
 */
function printProjectDetails(project: MrtProjectView): void {
  const ui = cliui({width: process.stdout.columns || 80});
  const labelWidth = 16;

  ui.div('');
  ui.div({text: 'Name:', width: labelWidth}, {text: project.name});
  ui.div({text: 'ID:', width: labelWidth}, {text: project.id});

  if (project.organization) {
    ui.div({text: 'Organization:', width: labelWidth}, {text: project.organization});
  }

  if (project.type) {
    ui.div({text: 'Type:', width: labelWidth}, {text: project.type});
  }

  if (project.status) {
    ui.div({text: 'Status:', width: labelWidth}, {text: project.status});
  }

  if (project.region) {
    ui.div({text: 'Region:', width: labelWidth}, {text: project.region});
  }

  if (project.url) {
    ui.div({text: 'URL:', width: labelWidth}, {text: project.url});
  }

  if (project.sites && project.sites.length > 0) {
    ui.div({text: 'Sites:', width: labelWidth}, {text: project.sites.join(', ')});
  }

  if (project.createdAt) {
    ui.div({text: 'Created:', width: labelWidth}, {text: new Date(project.createdAt).toLocaleString()});
  }

  if (project.updatedAt) {
    ui.div({text: 'Updated:', width: labelWidth}, {text: new Date(project.updatedAt).toLocaleString()});
  }

  ui.div({text: 'Backend:', width: labelWidth}, {text: project.backend});

  ux.stdout(ui.toString());
}

/**
 * Get details of an MRT project.
 */
export default class MrtProjectGet extends MrtCommand<typeof MrtProjectGet> {
  static aliases = ['mrt:storefront:get'];

  static args = {
    slug: Args.string({
      description: 'Project slug (or provide it via --project / --storefront / -p / -s)',
      required: false,
    }),
  };

  static description = withDocs(
    t('commands.mrt.project.get.description', 'Get details of a Managed Runtime project'),
    '/cli/mrt.html#b2c-mrt-project-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> my-storefront',
    '<%= config.bin %> <%= command.id %> --project my-storefront',
    '<%= config.bin %> <%= command.id %> --storefront my-storefront --mrt-backend scapi',
    '<%= config.bin %> <%= command.id %> --storefront my-storefront --json',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  protected operations = {
    getProjectWithBackend,
  };

  async run(): Promise<unknown> {
    const slug = this.resolveProjectSlug(this.args.slug);
    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    this.log(t('commands.mrt.project.get.fetching', 'Fetching project "{{slug}}"...', {slug}));

    const result = await this.operations.getProjectWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: slug,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Getting project via backend'),
    });

    if (!this.jsonEnabled()) {
      printProjectDetails(result.project);
    }

    // Under --json, emit the backend's native project response verbatim.
    return result.raw;
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
