/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';
import {Args, Flags} from '@oclif/core';
import {JobCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  listInstalledApps,
  pullCommerceApps,
  type PullCommerceAppsResult,
} from '@salesforce/b2c-tooling-sdk/operations/cap';
import {t, withDocs} from '../../i18n/index.js';

export default class CapPull extends JobCommand<typeof CapPull> {
  static args = {
    appName: Args.string({
      description: 'Commerce App feature name to pull (e.g. avalara-tax). If omitted, pulls all registry apps.',
      required: false,
    }),
  };

  static description = withDocs(
    t('commands.cap.pull.description', 'Pull installed Commerce Apps from a B2C Commerce instance'),
    '/cli/cap.html#b2c-cap-pull',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> avalara-tax',
    '<%= config.bin %> <%= command.id %> --site-id RefArch',
    '<%= config.bin %> <%= command.id %> --output ./my-apps',
  ];

  static flags = {
    ...JobCommand.baseFlags,
    'site-id': Flags.string({
      char: 's',
      description: 'Site ID to query for installed apps. If omitted, queries all sites.',
      aliases: ['site'],
    }),
    output: Flags.string({
      char: 'o',
      description: 'Output directory (default: ./commerce-apps)',
      default: 'commerce-apps',
    }),
    timeout: Flags.integer({
      char: 't',
      description: 'Timeout in seconds (default: no timeout)',
    }),
  };

  protected operations = {
    listInstalledApps,
    pullCommerceApps,
  };

  async run(): Promise<PullCommerceAppsResult> {
    this.requireOAuthCredentials();
    this.requireWebDavCredentials();

    const {appName} = this.args;
    const {'site-id': siteId, output, timeout} = this.flags;
    const hostname = this.resolvedConfig.values.hostname!;

    this.log(t('commands.cap.pull.fetching', 'Fetching installed apps from {{hostname}}...', {hostname}));

    const listResult = await this.operations.listInstalledApps(this.instance, {
      sites: siteId ? [siteId] : undefined,
      waitOptions: {
        timeoutSeconds: timeout || undefined,
        onPoll: (info) => {
          if (!this.jsonEnabled()) {
            this.log(
              t('commands.cap.pull.progress', '  Status: {{status}} ({{elapsed}}s elapsed)', {
                status: info.status,
                elapsed: Math.floor(info.elapsedSeconds).toString(),
              }),
            );
          }
        },
      },
    });

    // Deduplicate features by name (same app installed on multiple sites shares the same version)
    const uniqueFeatures = new Map<string, (typeof listResult.features)[0]>();
    for (const f of listResult.features) {
      if (!uniqueFeatures.has(f.featureName)) {
        uniqueFeatures.set(f.featureName, f);
      }
    }

    let toPull: (typeof listResult.features)[0][];
    if (appName) {
      const feature = uniqueFeatures.get(appName);
      if (!feature) {
        this.error(
          t('commands.cap.pull.notFound', 'Commerce App "{{appName}}" not found on {{hostname}}', {
            appName,
            hostname,
          }),
        );
      }
      toPull = [feature];
    } else {
      toPull = [...uniqueFeatures.values()].filter((f) => f.featureSource === 'AppRegistry');
    }

    if (toPull.length === 0) {
      this.log(t('commands.cap.pull.noApps', 'No registry-sourced apps found.'));
      return {pulled: [], failed: []};
    }

    this.log(
      t('commands.cap.pull.pulling', 'Pulling {{count}} app(s)...', {
        count: toPull.length,
      }),
    );

    const result = await this.operations.pullCommerceApps(this.instance, toPull, {
      outputDir: output,
    });

    if (!this.jsonEnabled()) {
      const bold = '[1m';
      const dim = '[2m';
      const cyan = '[36m';
      const yellow = '[33m';
      const red = '[31m';
      const reset = '[0m';

      for (const app of result.pulled) {
        const relativePath = path.relative(process.cwd(), app.extractedPath);
        const sourceNote = app.source === 'github' ? ` ${yellow}(from GitHub)${reset}` : '';
        process.stdout.write(`\n  ${bold}${app.featureName}${reset} v${app.version}${sourceNote}\n`);
        process.stdout.write(`     ${dim}domain: ${app.domain}${reset}\n`);
        process.stdout.write(`     ${cyan}→ ./${relativePath}${reset}\n`);
      }

      for (const fail of result.failed) {
        process.stdout.write(`\n  ${red}${fail.featureName}: ${fail.error}${reset}\n`);
      }

      process.stdout.write('\n');
    }

    return result;
  }
}
