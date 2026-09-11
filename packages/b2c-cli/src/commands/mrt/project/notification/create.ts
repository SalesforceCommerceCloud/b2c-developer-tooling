/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createNotification, type MrtNotification} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

// A notification's environments are a list of environment slugs — the same domain
// as the base --environment flag, but multi-valued. This command never reads the
// inherited single-value --environment, and its own multi-valued --environment flag
// would collide with it, so drop the inherited one. The old --target / -t forms are
// retained as aliases for back-compat.
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
    '<%= config.bin %> <%= command.id %> --project my-storefront --environment staging --recipient team@example.com --on-start --on-failed',
    '<%= config.bin %> <%= command.id %> -p my-storefront --environment staging --environment production --recipient ops@example.com',
  ];

  static flags = {
    environment: Flags.string({
      char: 'e',
      aliases: ['target'],
      charAliases: ['t'],
      description: 'Environment slug for this notification (aliases: --target, -t; can be specified multiple times)',
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
      environment: environments,
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
          targets: environments,
          recipients,
          deploymentStart: onStart,
          deploymentSuccess: onSuccess,
          deploymentFailed: onFailed,
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
        this.log(
          t('commands.mrt.notification.create.environments', 'Environments: {{environments}}', {
            environments: environments.join(', '),
          }),
        );
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
