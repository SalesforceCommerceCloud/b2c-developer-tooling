/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createNotification, type MrtNotification} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

// A notification "target" is a list of environment/target slugs — the same domain
// as the base --environment flag, but multi-valued. These commands never read the
// inherited single-value --environment, and its --target alias would collide with
// this command's own --target. Drop the inherited flag and let --target carry the
// environment vocabulary via its --environment / -e aliases instead.
const {environment: _omitEnvironment, ...baseFlagsWithoutEnvironment} = MrtCommand.baseFlags;

/**
 * Create a notification for an MRT project.
 */
export default class MrtNotificationCreate extends MrtCommand<typeof MrtNotificationCreate> {
  static aliases = ['mrt:storefront:notification:create'];

  // Cast: the runtime object legitimately omits `environment`; MrtCommand's narrow
  // baseFlags type still lists it (a required prop the static-side check enforces),
  // but this command never reads `this.flags.environment`.
  static baseFlags = baseFlagsWithoutEnvironment as typeof MrtCommand.baseFlags;

  static description = withDocs(
    t('commands.mrt.notification.create.description', 'Create a notification for a Managed Runtime project'),
    '/cli/mrt.html#b2c-mrt-project-notification-create',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront --target staging --recipient team@example.com --on-start --on-failed',
    '<%= config.bin %> <%= command.id %> -p my-storefront --target staging --target production --recipient ops@example.com',
  ];

  static flags = {
    target: Flags.string({
      char: 't',
      aliases: ['environment'],
      charAliases: ['e'],
      description:
        'Target environment slug for this notification (aliases: --environment, -e; can be specified multiple times)',
      multiple: true,
      required: true,
    }),
    recipient: Flags.string({
      char: 'r',
      description: 'Email recipient for this notification (can be specified multiple times)',
      multiple: true,
      required: true,
    }),
    'on-start': Flags.boolean({
      description: 'Trigger notification when deployment starts',
      default: false,
    }),
    'on-success': Flags.boolean({
      description: 'Trigger notification when deployment succeeds',
      default: false,
    }),
    'on-failed': Flags.boolean({
      description: 'Trigger notification when deployment fails',
      default: false,
    }),
  };

  async run(): Promise<MrtNotification> {
    this.requireMrtCredentials();

    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const {
      target: targets,
      recipient: recipients,
      'on-start': onStart,
      'on-success': onSuccess,
      'on-failed': onFailed,
    } = this.flags;

    this.log(t('commands.mrt.notification.create.creating', 'Creating notification for {{project}}...', {project}));

    try {
      const result = await createNotification(
        {
          projectSlug: project,
          targets,
          recipients,
          deploymentStart: onStart || undefined,
          deploymentSuccess: onSuccess || undefined,
          deploymentFailed: onFailed || undefined,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(
          t('commands.mrt.notification.create.success', 'Notification created with ID {{id}}.', {
            id: result.id ?? 'unknown',
          }),
        );
        this.log(t('commands.mrt.notification.create.targets', 'Targets: {{targets}}', {targets: targets.join(', ')}));
        this.log(
          t('commands.mrt.notification.create.recipients', 'Recipients: {{recipients}}', {
            recipients: recipients.join(', '),
          }),
        );
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.notification.create.failed', 'Failed to create notification: {{message}}', {
            message: error.message,
          }),
        );
      }
      throw error;
    }
  }
}
