/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Args, ux} from '@oclif/core';
import cliui from 'cliui';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, type OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

type RealmConfigurationModel = OdsComponents['schemas']['RealmConfigurationModel'];
type RealmModel = OdsComponents['schemas']['RealmModel'];

/**
 * Get details of a specific realm.
 */
export default class SandboxRealmGet extends OdsCommand<typeof SandboxRealmGet> {
  static aliases = ['ods:realm:get', 'realm:get'];

  static args = {
    realm: Args.string({
      description: 'Realm ID (four-letter ID)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.realm.get.description', 'Get details of a specific realm'),
    '/cli/realm.html#b2c-realm-get',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> zzzz', '<%= config.bin %> <%= command.id %> zzzz --json'];

  static flags = {} as const;

  async run(): Promise<{
    realm: RealmModel;
    configuration?: RealmConfigurationModel;
  }> {
    const {args} = await this.parse(SandboxRealmGet);
    const realm = args.realm;
    const host = this.odsHost;

    this.log(t('commands.realm.get.fetching', 'Fetching realm {{realm}} from {{host}}...', {realm, host}));

    // Fetch full realm info (metadata + configuration + accountdetails)
    const result = await this.odsClient.GET('/realms/{realm}', {
      params: {
        path: {realm},
        query: {expand: ['configuration', 'accountdetails']},
      },
    });

    if (!result.data?.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(
        t('commands.realm.get.error', 'Failed to fetch realm {{realm}}: {{message}}', {
          realm,
          message,
        }),
      );
    }

    const realmInfo = result.data.data as RealmModel;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const configuration = (realmInfo as any).configuration as RealmConfigurationModel | undefined;

    const response = {realm: realmInfo, configuration};

    if (this.jsonEnabled()) {
      return response;
    }

    this.printRealmDetails(realmInfo, configuration);

    return response;
  }

  private addFieldRows(ui: ReturnType<typeof cliui>, fields: [string, string | undefined][]): void {
    for (const [label, value] of fields) {
      if (value !== undefined) {
        ui.div({text: `${label}:`, width: 25, padding: [0, 2, 0, 0]}, {text: value, padding: [0, 0, 0, 0]});
      }
    }
  }

  private printRealmDetails(realm: RealmModel, config?: RealmConfigurationModel): void {
    const ui = cliui({width: process.stdout.columns || 80});

    ui.div({text: 'Realm Details', padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const realmAny = realm as any;

    const metaFields: [string, string | undefined][] = [
      ['Realm ID', realmAny.id ?? realmAny.realmCode ?? realmAny.realm],
      ['Name', realmAny.name],
      ['Enabled', realmAny.enabled === undefined ? undefined : String(realmAny.enabled)],
    ];
    this.addFieldRows(ui, metaFields);

    // Configuration block (if available via expand)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const configAny = (config as any) ?? realmAny.configuration;

    if (configAny) {
      ui.div({text: '', padding: [1, 0, 0, 0]});
      ui.div({text: 'Realm Configuration', padding: [0, 0, 0, 0]});
      ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

      const maxTtlRaw = configAny.sandbox?.sandboxTTL?.maximum as number | undefined;
      const maxTtlDisplay = maxTtlRaw === undefined ? undefined : maxTtlRaw >= 2_147_483_647 ? '0' : String(maxTtlRaw);

      const configFields: [string, string | undefined][] = [
        ['Emails', Array.isArray(configAny.emails) ? configAny.emails.join(', ') : undefined],
        [
          'Limits Enabled',
          configAny.sandbox?.limitsEnabled === undefined ? undefined : String(configAny.sandbox.limitsEnabled),
        ],
        [
          'Total Sandboxes',
          configAny.sandbox?.totalNumberOfSandboxes === undefined
            ? undefined
            : String(configAny.sandbox.totalNumberOfSandboxes),
        ],
        ['Max Sandbox TTL', maxTtlDisplay],
        [
          'Default Sandbox TTL',
          configAny.sandbox?.sandboxTTL?.defaultValue === undefined
            ? undefined
            : String(configAny.sandbox.sandboxTTL.defaultValue),
        ],
        [
          'Local Users Allowed',
          configAny.sandbox?.localUsersAllowed === undefined ? undefined : String(configAny.sandbox.localUsersAllowed),
        ],
      ];
      this.addFieldRows(ui, configFields);
    }

    // Schedulers
    if (configAny?.sandbox?.startScheduler) {
      ui.div(
        {text: 'Start Scheduler:', width: 25, padding: [0, 2, 0, 0]},
        {
          text: JSON.stringify(configAny.sandbox.startScheduler),
          padding: [0, 0, 0, 0],
        },
      );
    }

    if (configAny?.sandbox?.stopScheduler) {
      ui.div(
        {text: 'Stop Scheduler:', width: 25, padding: [0, 2, 0, 0]},
        {
          text: JSON.stringify(configAny.sandbox.stopScheduler),
          padding: [0, 0, 0, 0],
        },
      );
    }

    // Realm usage is now provided by the dedicated `realm usage` command.

    ux.stdout(ui.toString());
  }
}
