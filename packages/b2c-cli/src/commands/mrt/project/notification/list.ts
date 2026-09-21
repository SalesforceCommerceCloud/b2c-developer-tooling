/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {
  MrtCommand,
  TableRenderer,
  columnFlagsFor,
  selectColumns,
  type ColumnDef,
} from '@salesforce/b2c-tooling-sdk/cli';
import {
  listNotifications,
  type ListNotificationsResult,
  type MrtNotification,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<MrtNotification>> = {
  id: {
    header: 'ID',
    get: (n) => n.id ?? '-',
  },
  environments: {
    header: 'Environments',
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

const DEFAULT_COLUMNS = ['id', 'environments', 'recipients', 'events'];

const tableRenderer = new TableRenderer(COLUMNS);

// This command filters by a single environment slug, not the base single-value
// --environment config value. Drop the inherited flag so we can define our own
// --environment filter (with --target / -t retained as aliases for back-compat)
// without it colliding with the base flag or leaking MRT_ENVIRONMENT into the filter.
const {environment: _omitEnvironment, ...baseFlagsWithoutEnvironment} = MrtCommand.baseFlags;

/**
 * List notifications for an MRT project.
 */
export default class MrtNotificationList extends MrtCommand<typeof MrtNotificationList> {
  static aliases = ['mrt:storefront:notification:list'];

  // Cast: the runtime object legitimately omits `environment`; MrtCommand's narrow
  // baseFlags type still lists it (a required prop the static-side check enforces),
  // but this command defines its own `--environment` filter instead.
  static baseFlags = baseFlagsWithoutEnvironment as typeof MrtCommand.baseFlags;

  static description = withDocs(
    t('commands.mrt.notification.list.description', 'List notifications for a Managed Runtime project'),
    '/cli/mrt.html#b2c-mrt-project-notification-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront',
    '<%= config.bin %> <%= command.id %> -p my-storefront --environment staging',
    '<%= config.bin %> <%= command.id %> -p my-storefront --json',
  ];

  static flags = {
    limit: Flags.integer({
      description: 'Maximum number of results to return',
    }),
    offset: Flags.integer({
      description: 'Offset for pagination',
    }),
    environment: Flags.string({
      char: 'e',
      aliases: ['target'],
      charAliases: ['t'],
      description: 'Filter by environment slug (aliases: --target, -t)',
    }),
    ...columnFlagsFor(COLUMNS),
  };

  async run(): Promise<ListNotificationsResult> {
    this.requireMrtCredentials();

    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const {limit, offset, environment} = this.flags;

    this.log(t('commands.mrt.notification.list.fetching', 'Fetching notifications for {{project}}...', {project}));

    const result = await listNotifications(
      {
        projectSlug: project,
        limit,
        offset,
        targetSlug: environment,
        origin: this.resolvedConfig.values.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      if (result.notifications.length === 0) {
        this.log(t('commands.mrt.notification.list.empty', 'No notifications found.'));
      } else {
        this.log(t('commands.mrt.notification.list.count', 'Found {{count}} notification(s):', {count: result.count}));
        tableRenderer.render(
          result.notifications,
          selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)),
        );
      }
    }

    return result;
  }
}
