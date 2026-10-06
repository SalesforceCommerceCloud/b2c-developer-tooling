/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createProjectWithBackend, type MrtProjectView} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

/**
 * Valid AWS regions for MRT projects (hyphenated legacy form; the SCAPI backend
 * converts to its underscored form internally).
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

// Mirrors the SCAPI Storefronts `StorefrontCreateType` enum, which currently
// allows only `storefront_next`: "Only `storefront_next` is currently supported
// by the create-new-storefront flow." The broader `StorefrontType` enum
// (`pwa_kit`, `headless`, `unknown`) describes *existing* storefronts for
// read/categorization and is not accepted on create, so we deliberately do not
// expose those here — passing one would be rejected by the gateway.
const STOREFRONT_TYPES = ['storefront_next'] as const;

type StorefrontCreateType = (typeof STOREFRONT_TYPES)[number];

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

  ui.div({text: 'Backend:', width: labelWidth}, {text: project.backend});

  ux.stdout(ui.toString());
}

/**
 * Create a new MRT project.
 */
export default class MrtProjectCreate extends MrtCommand<typeof MrtProjectCreate> {
  static aliases = ['mrt:storefront:create'];

  static args = {
    name: Args.string({
      description: 'Project name',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.mrt.project.create.description', 'Create a new Managed Runtime project'),
    '/cli/mrt.html#b2c-mrt-project-create',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> "My Storefront" --organization my-org',
    '<%= config.bin %> <%= command.id %> "My Storefront" -o my-org --storefront my-storefront',
    '<%= config.bin %> <%= command.id %> "My Storefront" -o my-org --region us-east-1',
    '<%= config.bin %> <%= command.id %> "My Storefront" --site RefArch --mrt-backend scapi',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    organization: Flags.string({
      char: 'o',
      description: 'Organization slug to create the project in (required for the legacy backend)',
    }),
    url: Flags.string({
      description: 'Project URL (legacy backend only)',
    }),
    region: Flags.string({
      char: 'r',
      description: 'Default AWS region for new environments (legacy backend only)',
      options: SSR_REGIONS as unknown as string[],
    }),
    type: Flags.string({
      description: 'Storefront type (SCAPI backend only)',
      options: STOREFRONT_TYPES as unknown as string[],
      default: 'storefront_next',
    }),
    site: Flags.string({
      description: 'Site ID to assign to the storefront (SCAPI backend only; repeatable, at least one required)',
      multiple: true,
    }),
  };

  protected operations = {
    createProjectWithBackend,
  };

  async run(): Promise<unknown> {
    const {name} = this.args;
    const {organization, url, region, type, site} = this.flags;
    // The new project's slug comes from the shared --project / --storefront (-p / -s)
    // flag; when omitted the legacy MRT API auto-generates one from the name (SCAPI
    // always generates the storefront ID).
    const slug = this.resolvedConfig.values.mrtProject;

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();
    // Whether the resolved preference + config will route this run to SCAPI, so
    // required fields can be validated against the backend that actually runs.
    const scapi = preference === 'scapi' || (preference === 'auto' && Boolean(scapiConnection));

    // Validate the required fields for the backend that will actually run.
    if (scapi) {
      if (!site || site.length === 0) {
        this.error('The SCAPI MRT backend requires at least one --site to create a storefront.');
      }
    } else if (!organization) {
      this.error('The legacy MRT backend requires --organization to create a project.');
    }

    this.log(t('commands.mrt.project.create.creating', 'Creating project "{{name}}"...', {name}));

    const result = await this.operations.createProjectWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      name,
      slug,
      organization,
      url,
      ssrRegion: region as SsrRegion | undefined,
      type: type as StorefrontCreateType | undefined,
      sites: site,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Creating project via backend'),
    });

    if (!this.jsonEnabled()) {
      this.log(t('commands.mrt.project.create.success', 'Project created successfully.'));
      printProjectDetails(result.project);
    }

    // Under --json, emit the backend's native create response verbatim.
    return result.raw;
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
