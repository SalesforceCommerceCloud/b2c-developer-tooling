/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import {Flags} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createBaseline, scanSecurity, type SecurityBaseline} from '@salesforce/b2c-tooling-sdk/security';
import {t, withDocs} from '../../i18n/index.js';
import {DEFAULT_BASELINE_FILE, ruleFilterFlags} from '../../utils/security/index.js';
import {projectRoot} from '../../utils/project/index.js';

export default class SecurityBaselineCommand extends BaseCommand<typeof SecurityBaselineCommand> {
  static description = withDocs(
    t(
      'commands.security.baseline.description',
      '[PREVIEW] Record current security findings in a baseline file so "b2c security scan" reports only new ones',
    ),
    '/cli/security.html#b2c-security-baseline',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> cartridges --output security-baseline.json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    ...ruleFilterFlags,
    output: Flags.string({
      description: `Baseline file to write (default: ${DEFAULT_BASELINE_FILE} in the project directory)`,
    }),
  };

  static strict = false;

  protected operations = {scanSecurity};

  async run(): Promise<{file: string; findings: number; baseline: SecurityBaseline}> {
    const {argv, flags} = await this.parse(SecurityBaselineCommand);
    const root = projectRoot(this.resolvedConfig);
    const output = flags.output ?? path.join(root, DEFAULT_BASELINE_FILE);
    let baseline: SecurityBaseline;
    try {
      const result = this.operations.scanSecurity({
        root,
        paths: argv as string[],
        rules: flags.rule,
        excludeRules: flags['exclude-rule'],
        ignore: flags.ignore,
        cartridgePath: this.resolvedConfig.values.cartridges,
        siteId: this.resolvedConfig.values.siteId,
      });
      baseline = createBaseline(result.findings);
    } catch (error) {
      this.error((error as Error).message);
    }
    fs.writeFileSync(output, JSON.stringify(baseline, null, 2) + '\n');
    if (!this.jsonEnabled()) {
      this.log(
        t(
          'commands.security.baseline.wrote',
          'Wrote {{count}} finding(s) to {{file}}. Commit it so scans report only new findings.',
          {
            count: baseline.findings.length,
            file: path.relative(process.cwd(), output) || output,
          },
        ),
      );
    }
    return {file: output, findings: baseline.findings.length, baseline};
  }
}
