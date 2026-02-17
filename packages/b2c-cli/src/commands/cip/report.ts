/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {withDocs} from '../../i18n/index.js';

/**
 * Default report command - shows topic help for CIP report subcommands.
 */
export default class CipReportIndex extends BaseCommand<typeof CipReportIndex> {
  static description = withDocs('Run curated CIP analytics reports', '/cli/cip.html#b2c-cip-report');

  static examples = [
    '<%= config.bin %> cip report --help',
    '<%= config.bin %> cip report sales-analytics --site-id Sites-SiteGenesis-Site',
    '<%= config.bin %> cip report sales-analytics --site-id Sites-SiteGenesis-Site --sql',
  ];

  async run(): Promise<void> {
    await this.config.runCommand('help', ['cip', 'report']);
  }
}
