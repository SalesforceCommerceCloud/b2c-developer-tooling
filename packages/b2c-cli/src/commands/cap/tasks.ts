/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {JobCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {listInstalledApps, type CommerceFeatureState} from '@salesforce/b2c-tooling-sdk/operations/cap';
import {t, withDocs} from '../../i18n/index.js';

interface ConfigTask {
  name: string;
  description: string;
  link: string;
  taskNumber: string;
}

export default class CapTasks extends JobCommand<typeof CapTasks> {
  static args = {
    appName: Args.string({
      description: 'Commerce App feature name (e.g. avalara-tax)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.cap.tasks.description', 'List configuration tasks for an installed Commerce App'),
    '/cli/cap.html#b2c-cap-tasks',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> avalara-tax --site-id RefArch',
    '<%= config.bin %> <%= command.id %> avalara-tax --site-id RefArch --json',
  ];

  static flags = {
    ...JobCommand.baseFlags,
    'site-id': Flags.string({
      char: 's',
      description: 'Site ID to query',
      required: true,
      aliases: ['site'],
    }),
    timeout: Flags.integer({
      char: 't',
      description: 'Timeout in seconds (default: no timeout)',
    }),
  };

  protected operations = {
    listInstalledApps,
  };

  async run(): Promise<{feature: CommerceFeatureState; tasks: ConfigTask[]}> {
    this.requireOAuthCredentials();
    this.requireWebDavCredentials();

    const {appName: name} = this.args;
    const {'site-id': siteId, timeout} = this.flags;
    const hostname = this.resolvedConfig.values.hostname!;

    this.log(
      t('commands.cap.tasks.fetching', 'Fetching configuration tasks for {{name}} on {{hostname}}...', {
        name,
        hostname,
      }),
    );

    const result = await this.operations.listInstalledApps(this.instance, {
      sites: [siteId],
      waitOptions: {
        timeoutSeconds: timeout || undefined,
        onPoll: (info) => {
          if (!this.jsonEnabled()) {
            this.log(
              t('commands.cap.tasks.progress', '  Status: {{status}} ({{elapsed}}s elapsed)', {
                status: info.status,
                elapsed: Math.floor(info.elapsedSeconds).toString(),
              }),
            );
          }
        },
      },
    });

    const feature = result.features.find((f) => f.featureName === name);
    if (!feature) {
      this.error(
        t('commands.cap.tasks.notFound', 'Commerce App "{{name}}" not found on site {{siteId}}', {name, siteId}),
      );
    }

    const tasks = (feature.configTasks ?? []) as ConfigTask[];

    if (tasks.length === 0) {
      this.log(t('commands.cap.tasks.noTasks', 'No configuration tasks found.'));
      return {feature, tasks};
    }

    this.log(
      t('commands.cap.tasks.found', 'Configuration tasks for {{name}} ({{status}}):', {
        name: feature.featureName,
        status: feature.configStatus,
      }),
    );

    if (!this.jsonEnabled()) {
      const bold = '[1m';
      const dim = '[2m';
      const cyan = '[36m';
      const reset = '[0m';

      for (const task of tasks) {
        process.stdout.write(`\n  ${bold}${task.taskNumber}. ${task.name}${reset}\n`);
        process.stdout.write(`     ${dim}${task.description}${reset}\n`);
        process.stdout.write(`     ${cyan}→ https://${hostname}${task.link}${reset}\n`);
      }
    }

    return {feature, tasks};
  }
}
