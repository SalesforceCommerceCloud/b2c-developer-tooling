/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {updateNotification, type MrtNotification} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

/**
 * Update a notification in an MRT project.
 */
export default class MrtNotificationUpdate extends MrtCommand<typeof MrtNotificationUpdate> {
  static args = {
    id: Args.string({
      description: 'Notification ID',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.mrt.notification.update.description', 'Update a Managed Runtime notification'),
    '/cli/mrt.html#b2c-mrt-project-notification-update',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> abc-123 --project my-storefront --on-start --on-failed',
    '<%= config.bin %> <%= command.id %> abc-123 -p my-storefront --recipient new-team@example.com',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    target: Flags.string({
      char: 't',
      description: 'Target slug to associate with this notification (can be specified multiple times)',
      multiple: true,
    }),
    recipient: Flags.string({
      char: 'r',
      description: 'Email recipient for this notification (can be specified multiple times)',
      multiple: true,
    }),
    'on-start': Flags.boolean({
      description: 'Trigger notification when deployment starts',
      allowNo: true,
    }),
    'on-success': Flags.boolean({
      description: 'Trigger notification when deployment succeeds',
      allowNo: true,
    }),
    'on-failed': Flags.boolean({
      description: 'Trigger notification when deployment fails',
      allowNo: true,
    }),
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

    const {
      target: targets,
      recipient: recipients,
      'on-start': onStart,
      'on-success': onSuccess,
      'on-failed': onFailed,
    } = this.flags;

    this.log(t('commands.mrt.notification.update.updating', 'Updating notification {{id}}...', {id}));

    try {
      const result = await updateNotification(
        {
          projectSlug: project,
          notificationId: id,
          targets,
          recipients,
          deploymentStart: onStart,
          deploymentSuccess: onSuccess,
          deploymentFailed: onFailed,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(t('commands.mrt.notification.update.success', 'Notification {{id}} updated.', {id}));
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.notification.update.failed', 'Failed to update notification: {{message}}', {
            message: error.message,
          }),
        );
      }
      throw error;
    }
  }
}
