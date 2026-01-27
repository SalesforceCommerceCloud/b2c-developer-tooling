/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as readline from 'node:readline';
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {deleteNotification} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

/**
 * Prompt for confirmation.
 */
async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Delete a notification from an MRT project.
 */
export default class MrtNotificationDelete extends MrtCommand<typeof MrtNotificationDelete> {
  static args = {
    id: Args.string({
      description: 'Notification ID to delete',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.mrt.notification.delete.description', 'Delete a notification from a Managed Runtime project'),
    '/cli/mrt.html#b2c-mrt-project-notification-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> abc-123 --project my-storefront',
    '<%= config.bin %> <%= command.id %> abc-123 -p my-storefront --force',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  async run(): Promise<{id: string; deleted: boolean}> {
    this.requireMrtCredentials();

    const {id} = this.args;
    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const {force} = this.flags;

    // Confirm deletion unless --force is specified
    if (!force && !this.jsonEnabled()) {
      const confirmed = await confirm(
        t('commands.mrt.notification.delete.confirm', 'Are you sure you want to delete notification {{id}}?', {id}),
      );
      if (!confirmed) {
        this.log(t('commands.mrt.notification.delete.cancelled', 'Deletion cancelled.'));
        return {id, deleted: false};
      }
    }

    this.log(t('commands.mrt.notification.delete.deleting', 'Deleting notification {{id}}...', {id}));

    try {
      await deleteNotification(
        {
          projectSlug: project,
          notificationId: id,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(t('commands.mrt.notification.delete.success', 'Notification {{id}} deleted.', {id}));
      }

      return {id, deleted: true};
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.notification.delete.failed', 'Failed to delete notification: {{message}}', {
            message: error.message,
          }),
        );
      }
      throw error;
    }
  }
}
