/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {updateProjectWithBackend, type MrtProjectView} from '@salesforce/b2c-tooling-sdk/operations/mrt';
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

const SSR_ARCHITECTURES = ['x86', 'arm64'] as const;

type SsrArchitecture = (typeof SSR_ARCHITECTURES)[number];

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

  if (project.region) {
    ui.div({text: 'Region:', width: labelWidth}, {text: project.region});
  }

  if (project.url) {
    ui.div({text: 'URL:', width: labelWidth}, {text: project.url});
  }

  if (project.sites && project.sites.length > 0) {
    ui.div({text: 'Sites:', width: labelWidth}, {text: project.sites.join(', ')});
  }

  if (project.updatedAt) {
    ui.div({text: 'Updated:', width: labelWidth}, {text: new Date(project.updatedAt).toLocaleString()});
  }

  ui.div({text: 'Backend:', width: labelWidth}, {text: project.backend});

  ux.stdout(ui.toString());
}

/**
 * Update an MRT project.
 */
export default class MrtProjectUpdate extends MrtCommand<typeof MrtProjectUpdate> {
  static aliases = ['mrt:storefront:update'];

  static args = {
    slug: Args.string({
      description: 'Project slug (or provide it via --project / --storefront / -p / -s)',
      required: false,
    }),
  };

  static description = withDocs(
    t('commands.mrt.project.update.description', 'Update a Managed Runtime project'),
    '/cli/mrt.html#b2c-mrt-project-update',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> my-storefront --name "New Name"',
    '<%= config.bin %> <%= command.id %> --project my-storefront --region eu-west-1',
    '<%= config.bin %> <%= command.id %> my-storefront --site RefArch --site OtherSite --mrt-backend scapi',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'New name for the project (legacy backend only)',
    }),
    url: Flags.string({
      description: 'New URL for the project (legacy backend only)',
    }),
    region: Flags.string({
      char: 'r',
      description: 'New default AWS region for new environments',
      options: SSR_REGIONS as unknown as string[],
    }),
    site: Flags.string({
      description:
        'Site ID assigned to the storefront (SCAPI backend only; repeatable). Replaces the full assigned-sites set.',
      multiple: true,
    }),
    'ssr-architecture': Flags.string({
      description: 'Default SSR architecture for new environments (SCAPI backend only)',
      options: SSR_ARCHITECTURES as unknown as string[],
    }),
    'allow-cookies': Flags.boolean({
      description: 'Whether cookies are allowed for the storefront (SCAPI backend only)',
      allowNo: true,
    }),
    'preserve-proxy-user-agent': Flags.boolean({
      description: "Whether the end-user's User-Agent is preserved through proxies (SCAPI backend only)",
      allowNo: true,
    }),
  };

  protected operations = {
    updateProjectWithBackend,
  };

  async run(): Promise<unknown> {
    const slug = this.resolveProjectSlug(this.args.slug);
    const {
      name,
      url,
      region,
      site,
      'ssr-architecture': ssrArchitecture,
      'allow-cookies': allowCookies,
      'preserve-proxy-user-agent': preserveProxyUserAgent,
    } = this.flags;

    const nothingToUpdate =
      !name &&
      !url &&
      !region &&
      (!site || site.length === 0) &&
      ssrArchitecture === undefined &&
      allowCookies === undefined &&
      preserveProxyUserAgent === undefined;
    if (nothingToUpdate) {
      this.error(
        'At least one updatable field must be provided (--name, --url, --region, --site, --ssr-architecture, ' +
          '--allow-cookies, or --preserve-proxy-user-agent).',
      );
    }

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    this.log(t('commands.mrt.project.update.updating', 'Updating project "{{slug}}"...', {slug}));

    const result = await this.operations.updateProjectWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: slug,
      name,
      url,
      ssrRegion: region as SsrRegion | undefined,
      sites: site,
      ssrArchitecture: ssrArchitecture as SsrArchitecture | undefined,
      allowCookies,
      preserveProxyUserAgent,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Updating project via backend'),
    });

    if (!this.jsonEnabled()) {
      this.log(t('commands.mrt.project.update.success', 'Project updated successfully.'));
      printProjectDetails(result.project);
    }

    // Under --json, emit the backend's native update response verbatim.
    return result.raw;
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
