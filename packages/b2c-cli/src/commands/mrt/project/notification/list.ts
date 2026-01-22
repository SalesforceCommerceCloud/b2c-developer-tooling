/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {MrtCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  listNotifications,
  type ListNotificationsResult,
  type MrtNotification,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t} from '../../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<MrtNotification>> = {
  id: {
    header: 'ID',
    get: (n) => n.id ?? '-',
  },
  targets: {
    header: 'Targets',
    get: (n) => n.targets?.join(', ') ?? '-',
  },
  recipients: {
    header: 'Recipients',
    get: (n) => n.recipients?.join(', ') ?? '-',
  },
  events: {
    header: 'Events',
    get(n) {
      const events: string[] = [];
      if (n.deployment_start) events.push('start');
      if (n.deployment_success) events.push('success');
      if (n.deployment_failed) events.push('failed');
      return events.join(', ') || '-';
    },
  },
};

const DEFAULT_COLUMNS = ['id', 'targets', 'recipients', 'events'];

/**
 * List notifications for an MRT project.
 */
export default class MrtNotificationList extends MrtCommand<typeof MrtNotificationList> {
  static description = t(
    'commands.mrt.notification.list.description',
    'List notifications for a Managed Runtime project',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront',
    '<%= config.bin %> <%= command.id %> -p my-storefront --target staging',
    '<%= config.bin %> <%= command.id %> -p my-storefront --json',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    limit: Flags.integer({
      description: 'Maximum number of results to return',
    }),
    offset: Flags.integer({
      description: 'Offset for pagination',
    }),
    target: Flags.string({
      description: 'Filter by target slug',
    }),
  };

  async run(): Promise<ListNotificationsResult> {
    this.requireMrtCredentials();

    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const {limit, offset, target} = this.flags;

    this.log(t('commands.mrt.notification.list.fetching', 'Fetching notifications for {{project}}...', {project}));

    const result = await listNotifications(
      {
        projectSlug: project,
        limit,
        offset,
        targetSlug: target,
        origin: this.resolvedConfig.values.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      if (result.notifications.length === 0) {
        this.log(t('commands.mrt.notification.list.empty', 'No notifications found.'));
      } else {
        this.log(t('commands.mrt.notification.list.count', 'Found {{count}} notification(s):', {count: result.count}));
        createTable(COLUMNS).render(result.notifications, DEFAULT_COLUMNS);
      }
    }

    return result;
  }
}
