/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {JobCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  discoverLocalApps,
  listInstalledApps,
  type CommerceFeatureState,
  type LocalCommerceApp,
  type ListInstalledAppsResult,
} from '@salesforce/b2c-tooling-sdk/operations/cap';
import {t, withDocs} from '../../i18n/index.js';

const LOCAL_COLUMNS: Record<string, ColumnDef<LocalCommerceApp>> = {
  path: {
    header: 'Path',
    get: (app) => app.path,
  },
  id: {
    header: 'ID',
    get: (app) => app.manifest.id,
  },
  name: {
    header: 'Name',
    get: (app) => app.manifest.name,
  },
  version: {
    header: 'Version',
    get: (app) => app.manifest.version,
  },
  domain: {
    header: 'Domain',
    get: (app) => app.manifest.domain,
  },
};

const LOCAL_DEFAULT_COLUMNS = ['id', 'name', 'version', 'domain', 'path'];

const REMOTE_COLUMNS: Record<string, ColumnDef<CommerceFeatureState>> = {
  siteId: {
    header: 'Site ID',
    get: (s) => s.siteId,
  },
  featureName: {
    header: 'App',
    get: (s) => s.featureName,
  },
  installStatus: {
    header: 'Install Status',
    get: (s) => s.installStatus,
  },
  configStatus: {
    header: 'Config Status',
    get: (s) => s.configStatus,
  },
  version: {
    header: 'Version',
    get: (s) => s.featureVersionId,
  },
  domain: {
    header: 'Domain',
    get: (s) => s.featureDomain,
  },
  installedAt: {
    header: 'Installed At',
    get: (s) => s.installedAt,
  },
};

const REMOTE_DEFAULT_COLUMNS = ['siteId', 'featureName', 'installStatus', 'configStatus', 'version', 'installedAt'];

export default class CapList extends JobCommand<typeof CapList> {
  static description = withDocs(
    t('commands.cap.list.description', 'List Commerce Apps locally or installed on a B2C Commerce instance'),
    '/cli/cap.html#b2c-cap-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --local',
    '<%= config.bin %> <%= command.id %> --local --project-directory ./my-workspace',
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --site RefArch',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...JobCommand.baseFlags,
    local: Flags.boolean({
      char: 'l',
      description: 'List locally detected Commerce App Packages (no instance required)',
      default: false,
    }),
    site: Flags.string({
      char: 's',
      description: 'Site IDs to query (comma-separated). If omitted, queries all sites.',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    timeout: Flags.integer({
      char: 't',
      description: 'Timeout in seconds (default: no timeout)',
    }),
  };

  protected operations = {
    discoverLocalApps,
    listInstalledApps,
  };

  async run(): Promise<ListInstalledAppsResult | LocalCommerceApp[]> {
    const {local, site, timeout} = this.flags;

    if (local) {
      return this.runLocal();
    }

    return this.runRemote(site, timeout);
  }

  private async runLocal(): Promise<LocalCommerceApp[]> {
    const searchPath = this.resolvedConfig.values.projectDirectory || process.cwd();

    this.log(
      t('commands.cap.list.discovering', 'Discovering Commerce App Packages in {{path}}...', {path: searchPath}),
    );

    const apps = await this.operations.discoverLocalApps(searchPath);

    if (apps.length === 0) {
      this.log(t('commands.cap.list.noLocalApps', 'No Commerce App Packages found.'));
      return apps;
    }

    this.log(t('commands.cap.list.foundLocal', 'Found {{count}} Commerce App Package(s):', {count: apps.length}));

    if (!this.jsonEnabled()) {
      createTable(LOCAL_COLUMNS).render(apps, LOCAL_DEFAULT_COLUMNS);
    }

    return apps;
  }

  private async runRemote(site: string[] | undefined, timeout: number | undefined): Promise<ListInstalledAppsResult> {
    this.requireOAuthCredentials();
    this.requireWebDavCredentials();

    const hostname = this.resolvedConfig.values.hostname!;

    this.log(t('commands.cap.list.fetching', 'Fetching installed Commerce Apps from {{hostname}}...', {hostname}));

    const result = await this.operations.listInstalledApps(this.instance, {
      sites: site,
      waitOptions: {
        timeout: timeout ? timeout * 1000 : undefined,
        onProgress: (exec, elapsed) => {
          if (!this.jsonEnabled()) {
            const elapsedSec = Math.floor(elapsed / 1000);
            this.log(
              t('commands.cap.list.progress', '  Status: {{status}} ({{elapsed}}s elapsed)', {
                status: exec.execution_status,
                elapsed: elapsedSec.toString(),
              }),
            );
          }
        },
      },
    });

    if (result.usedStub) {
      this.warn(
        t('commands.cap.list.stubWarning', 'commerce_feature_states export is not yet supported — showing stub data.'),
      );
    }

    if (result.states.length === 0) {
      this.log(t('commands.cap.list.noInstalledApps', 'No installed Commerce Apps found.'));
      return result;
    }

    this.log(
      t('commands.cap.list.foundRemote', 'Found {{count}} installed Commerce App(s):', {
        count: result.states.length,
      }),
    );

    if (!this.jsonEnabled()) {
      createTable(REMOTE_COLUMNS).render(result.states, REMOTE_DEFAULT_COLUMNS);
    }

    return result;
  }
}
