/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Args, Flags} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, type OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

type RealmConfigurationUpdateRequestModel = OdsComponents['schemas']['RealmConfigurationUpdateRequestModel'];
type RealmConfigurationResponse = OdsComponents['schemas']['RealmConfigurationResponse'];

/**
 * Update realm-level ODS configuration (TTL and schedulers).
 */
export default class SandboxRealmUpdate extends OdsCommand<typeof SandboxRealmUpdate> {
  static aliases = ['ods:realm:update', 'realm:update'];

  static args = {
    realm: Args.string({
      description: 'Realm ID (four-letter ID) to update',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.realm.update.description', 'Update realm configuration'),
    '/cli/realm.html#b2c-realm-update',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> zzzz --max-sandbox-ttl 72',
    '<%= config.bin %> <%= command.id %> zzzz --default-sandbox-ttl 24',
    '<%= config.bin %> <%= command.id %> zzzz --start-scheduler \'{"weekdays":["MONDAY"],"time":"08:00:00Z"}\'',
    '<%= config.bin %> <%= command.id %> zzzz --stop-scheduler "null"',
  ];

  static flags = {
    'max-sandbox-ttl': Flags.integer({
      description: 'Maximum sandbox TTL in hours (0 for unlimited, subject to quotas)',
    }),
    'default-sandbox-ttl': Flags.integer({
      description: 'Default sandbox TTL in hours when no TTL is specified at creation',
    }),
    'start-scheduler': Flags.string({
      description:
        'Start schedule JSON for sandboxes in this realm (use "null" to remove). Format: {"weekdays":[...],"time":"..."}',
    }),
    'stop-scheduler': Flags.string({
      description:
        'Stop schedule JSON for sandboxes in this realm (use "null" to remove). Format: {"weekdays":[...],"time":"..."}',
    }),
  } as const;

  async run(): Promise<RealmConfigurationResponse | undefined> {
    const {args, flags} = await this.parse(SandboxRealmUpdate);

    const realm = args.realm;
    const host = this.odsHost;

    const hasAnyUpdateFlag =
      flags['max-sandbox-ttl'] !== undefined ||
      flags['default-sandbox-ttl'] !== undefined ||
      flags['start-scheduler'] !== undefined ||
      flags['stop-scheduler'] !== undefined;

    if (!hasAnyUpdateFlag) {
      this.error(
        t(
          'commands.realm.update.noChanges',
          'No update flags specified. Use --max-sandbox-ttl, --default-sandbox-ttl, --start-scheduler, or --stop-scheduler.',
        ),
      );
    }

    this.log(
      t('commands.realm.update.updating', 'Updating realm {{realm}} on {{host}}...', {
        realm,
        host,
      }),
    );

    const body: RealmConfigurationUpdateRequestModel = {};

    if (flags['max-sandbox-ttl'] !== undefined || flags['default-sandbox-ttl'] !== undefined) {
      body.sandbox = body.sandbox ?? {};
      body.sandbox.sandboxTTL = body.sandbox.sandboxTTL ?? {};

      if (flags['max-sandbox-ttl'] !== undefined) {
        body.sandbox.sandboxTTL.maximum = flags['max-sandbox-ttl'];
      }

      if (flags['default-sandbox-ttl'] !== undefined) {
        body.sandbox.sandboxTTL.defaultValue = flags['default-sandbox-ttl'];
      }
    }

    // Helper to parse scheduler flags (JSON or "null")
    const parseScheduler = (value: string | undefined) => {
      if (!value) return;
      if (value === 'null') return null;

      try {
        return JSON.parse(value) as OdsComponents['schemas']['WeekdaySchedule'];
      } catch {
        this.error(
          t('commands.realm.update.schedulerParseError', 'Invalid JSON for scheduler. Use valid JSON or "null".'),
        );
      }
    };

    const startScheduler = parseScheduler(flags['start-scheduler']);
    const stopScheduler = parseScheduler(flags['stop-scheduler']);

    if (startScheduler !== undefined) {
      body.sandbox = body.sandbox ?? {};
      // null removes the existing schedule
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body.sandbox.startScheduler = startScheduler as any;
    }

    if (stopScheduler !== undefined) {
      body.sandbox = body.sandbox ?? {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body.sandbox.stopScheduler = stopScheduler as any;
    }

    const result = await this.odsClient.PATCH('/realms/{realm}/configuration', {
      params: {path: {realm}},
      body,
    });

    if (result.error) {
      this.error(
        t('commands.realm.update.error', 'Failed to update realm {{realm}}: {{message}}', {
          realm,
          message: getApiErrorMessage(result.error, result.response),
        }),
      );
    }

    if (this.jsonEnabled()) {
      return result.data as RealmConfigurationResponse | undefined;
    }

    this.log(
      t('commands.realm.update.success', 'Successfully updated realm {{realm}}.', {
        realm,
      }),
    );

    return result.data as RealmConfigurationResponse | undefined;
  }
}
