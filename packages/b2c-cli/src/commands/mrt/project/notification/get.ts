/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, ux} from '@oclif/core';
import cliui from 'cliui';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getNotification, type MrtNotification} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

/**
 * Print notification details in a formatted table.
 */
function printNotificationDetails(notification: MrtNotification, project: string): void {
  const ui = cliui({width: process.stdout.columns || 80});
  const labelWidth = 16;

  const events: string[] = [];
  if (notification.deployment_start) events.push('start');
  if (notification.deployment_success) events.push('success');
  if (notification.deployment_failed) events.push('failed');

  ui.div('');
  ui.div({text: 'ID:', width: labelWidth}, {text: notification.id ?? ''});
  ui.div({text: 'Project:', width: labelWidth}, {text: project});
  ui.div({text: 'Targets:', width: labelWidth}, {text: notification.targets?.join(', ') ?? '-'});
  ui.div({text: 'Recipients:', width: labelWidth}, {text: notification.recipients?.join(', ') ?? '-'});
  ui.div({text: 'Events:', width: labelWidth}, {text: events.join(', ') || '-'});

  if (notification.created_at) {
    ui.div({text: 'Created:', width: labelWidth}, {text: new Date(notification.created_at).toLocaleString()});
  }

  if (notification.updated_at) {
    ui.div({text: 'Updated:', width: labelWidth}, {text: new Date(notification.updated_at).toLocaleString()});
  }

  ux.stdout(ui.toString());
}

/**
 * Get details of a notification.
 */
export default class MrtNotificationGet extends MrtCommand<typeof MrtNotificationGet> {
  static args = {
    id: Args.string({
      description: 'Notification ID',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.mrt.notification.get.description', 'Get details of a Managed Runtime notification'),
    '/cli/mrt.html#b2c-mrt-project-notification-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> abc-123 --project my-storefront',
    '<%= config.bin %> <%= command.id %> abc-123 -p my-storefront --json',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  async run(): Promise<MrtNotification> {
    this.requireMrtCredentials();

    const {id} = this.args;
    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    this.log(t('commands.mrt.notification.get.fetching', 'Fetching notification {{id}}...', {id}));

    try {
      const result = await getNotification(
        {
          projectSlug: project,
          notificationId: id,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        printNotificationDetails(result, project);
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.notification.get.failed', 'Failed to get notification: {{message}}', {
            message: error.message,
          }),
        );
      }
      throw error;
    }
  }
}
