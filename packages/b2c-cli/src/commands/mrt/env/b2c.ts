/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {MrtCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  getB2CTargetInfo,
  setB2CTargetInfo,
  updateB2CTargetInfo,
  type B2CTargetInfo,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

type InfoEntry = {field: string; value: string};

const COLUMNS: Record<string, ColumnDef<InfoEntry>> = {
  field: {
    header: 'Field',
    get: (e) => e.field,
  },
  value: {
    header: 'Value',
    get: (e) => e.value,
  },
};

const DEFAULT_COLUMNS = ['field', 'value'];

/**
 * Get or update B2C Commerce info for a target/environment.
 */
export default class MrtB2CTargetInfo extends MrtCommand<typeof MrtB2CTargetInfo> {
  static description = withDocs(
    t('commands.mrt.b2c.target-info.description', 'Get or update B2C Commerce connection for a target/environment'),
    '/cli/mrt.html#b2c-mrt-env-b2c',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production --instance-id aaaa_prd',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production --instance-id aaaa_prd --sites RefArch,SiteGenesis',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production --json',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    'instance-id': Flags.string({
      description: 'B2C Commerce instance ID to connect',
    }),
    sites: Flags.string({
      description: 'Comma-separated list of site IDs to connect',
    }),
    'clear-sites': Flags.boolean({
      description: 'Clear the sites list',
      default: false,
    }),
  };

  async run(): Promise<B2CTargetInfo> {
    this.requireMrtCredentials();

    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }
    if (!environment) {
      this.error(
        'MRT environment is required. Provide --environment flag, set SFCC_MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }

    const instanceId = this.flags['instance-id'];
    const sitesStr = this.flags.sites;
    const clearSites = this.flags['clear-sites'];

    // If instance-id is provided, set or update the target info
    if (instanceId) {
      this.log(
        t('commands.mrt.b2c.target-info.setting', 'Setting B2C info for {{project}}/{{environment}}...', {
          project,
          environment,
        }),
      );

      const sites = clearSites ? null : sitesStr ? sitesStr.split(',').map((s) => s.trim()) : undefined;

      const info = await setB2CTargetInfo(
        {
          projectSlug: project,
          targetSlug: environment,
          instanceId,
          sites,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(t('commands.mrt.b2c.target-info.updated', 'B2C target info updated successfully.'));
        this.displayInfo(info);
      }

      return info;
    }

    // If only sites or clear-sites is provided, update
    if (sitesStr !== undefined || clearSites) {
      this.log(
        t('commands.mrt.b2c.target-info.updating', 'Updating B2C info for {{project}}/{{environment}}...', {
          project,
          environment,
        }),
      );

      const sites = clearSites ? null : sitesStr ? sitesStr.split(',').map((s) => s.trim()) : undefined;

      const info = await updateB2CTargetInfo(
        {
          projectSlug: project,
          targetSlug: environment,
          sites,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(t('commands.mrt.b2c.target-info.updated', 'B2C target info updated successfully.'));
        this.displayInfo(info);
      }

      return info;
    }

    // Otherwise, get the current info
    this.log(
      t('commands.mrt.b2c.target-info.fetching', 'Fetching B2C info for {{project}}/{{environment}}...', {
        project,
        environment,
      }),
    );

    const info = await getB2CTargetInfo(
      {
        projectSlug: project,
        targetSlug: environment,
        origin: this.resolvedConfig.values.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      this.displayInfo(info);
    }

    return info;
  }

  private displayInfo(info: B2CTargetInfo): void {
    const entries: InfoEntry[] = [
      {field: 'Instance ID', value: info.instance_id ?? '-'},
      {field: 'Sites', value: info.sites && info.sites.length > 0 ? info.sites.join(', ') : 'None'},
    ];
    createTable(COLUMNS).render(entries, DEFAULT_COLUMNS);
  }
}
