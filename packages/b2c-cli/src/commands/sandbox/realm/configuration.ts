/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Args} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, type OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

type RealmConfigurationModel = OdsComponents['schemas']['RealmConfigurationModel'];
type RealmConfigurationResponse = OdsComponents['schemas']['RealmConfigurationResponse'];

/**
 * Get realm sandbox configuration.
 */
export default class SandboxRealmConfiguration extends OdsCommand<typeof SandboxRealmConfiguration> {
  static aliases = ['ods:realm:configuration'];

  static args = {
    realm: Args.string({
      description: 'Realm ID (four-letter ID)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.realm.configuration.description', 'Get sandbox configuration for a realm'),
    '/cli/realm.html#b2c-realm-configuration',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> zzzz', '<%= config.bin %> <%= command.id %> zzzz --json'];

  async run(): Promise<RealmConfigurationModel | RealmConfigurationResponse | undefined> {
    const {args} = await this.parse(SandboxRealmConfiguration);
    const realm = args.realm;

    this.log(t('commands.realm.configuration.fetching', 'Fetching configuration for realm {{realm}}...', {realm}));

    const result = await this.odsClient.GET('/realms/{realm}/configuration', {
      params: {path: {realm}},
    });

    if (result.error) {
      this.error(
        t('commands.realm.configuration.error', 'Failed to fetch configuration for realm {{realm}}: {{message}}', {
          realm,
          message: getApiErrorMessage(result.error, result.response),
        }),
      );
    }

    const data = (result.data as RealmConfigurationResponse | undefined)?.data;
    if (!data) {
      this.log(t('commands.realm.configuration.noData', 'No configuration data was returned for this realm.'));
      return undefined;
    }

    if (this.jsonEnabled()) {
      return result.data as RealmConfigurationResponse;
    }

    this.printConfiguration(data);
    return data;
  }

  private printConfiguration(configuration: RealmConfigurationModel): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cfg = configuration as any;

    console.log('Realm Configuration');
    console.log('───────────────────');

    const maxTtlRaw = cfg.sandbox?.sandboxTTL?.maximum as number | undefined;
    const maxTtlDisplay = maxTtlRaw === undefined ? undefined : maxTtlRaw >= 2_147_483_647 ? '0' : String(maxTtlRaw);

    const rows: Array<[string, string | undefined]> = [
      ['Enabled', cfg.enabled === undefined ? undefined : String(cfg.enabled)],
      ['Emails', Array.isArray(cfg.emails) ? cfg.emails.join(', ') : undefined],
      ['Limits Enabled', cfg.sandbox?.limitsEnabled === undefined ? undefined : String(cfg.sandbox.limitsEnabled)],
      [
        'Total Sandboxes',
        cfg.sandbox?.totalNumberOfSandboxes === undefined ? undefined : String(cfg.sandbox.totalNumberOfSandboxes),
      ],
      ['Max Sandbox TTL', maxTtlDisplay],
      [
        'Default Sandbox TTL',
        cfg.sandbox?.sandboxTTL?.defaultValue === undefined ? undefined : String(cfg.sandbox.sandboxTTL.defaultValue),
      ],
      [
        'Local Users Allowed',
        cfg.sandbox?.localUsersAllowed === undefined ? undefined : String(cfg.sandbox.localUsersAllowed),
      ],
    ];

    for (const [label, value] of rows) {
      if (value !== undefined) {
        console.log(`${label}: ${value}`);
      }
    }

    if (cfg.sandbox?.startScheduler) {
      console.log(`Start Scheduler: ${JSON.stringify(cfg.sandbox.startScheduler)}`);
    }

    if (cfg.sandbox?.stopScheduler) {
      console.log(`Stop Scheduler: ${JSON.stringify(cfg.sandbox.stopScheduler)}`);
    }
  }
}
