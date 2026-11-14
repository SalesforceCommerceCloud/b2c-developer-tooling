/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import {Flags, ux} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  SECURITY_SEVERITIES,
  isAtLeastSeverity,
  scanSecurity,
  toSarif,
  type SecurityFinding,
  type SecurityScanResult,
  type SecuritySeverity,
} from '@salesforce/b2c-tooling-sdk/security';
import {t, withDocs} from '../../i18n/index.js';
import {loadBaseline, ruleFilterFlags} from '../../utils/security/index.js';

const SEVERITY_COLORS: Record<SecuritySeverity, string> = {
  critical: 'red',
  high: 'red',
  medium: 'yellow',
  low: 'cyan',
  info: 'dim',
};

/** JSON output of `b2c security scan`. */
export interface SecurityScanResponse extends SecurityScanResult {
  summary: {
    open: number;
    suppressed: number;
    baselined: number;
    bySeverity: Record<SecuritySeverity, number>;
    baselineFile?: string;
    failed: boolean;
  };
}

export default class SecurityScan extends BaseCommand<typeof SecurityScan> {
  static description = withDocs(
    t(
      'commands.security.scan.description',
      '[PREVIEW] Scan cartridge code for security problems such as open redirects, query injection, weak cryptography, and hardcoded credentials',
    ),
    '/cli/security.html#b2c-security-scan',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> cartridges/app_custom',
    '<%= config.bin %> <%= command.id %> --severity medium --fail-on high',
    '<%= config.bin %> <%= command.id %> --format sarif --output security.sarif',
    '<%= config.bin %> <%= command.id %> --rule open-redirect --rule object-query-injection',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    ...ruleFilterFlags,
    format: Flags.string({
      description: 'Report format: table (readable), json, or sarif (for GitHub code scanning)',
      options: ['table', 'json', 'sarif'],
      default: 'table',
    }),
    output: Flags.string({
      description: 'Write the json or sarif report to this file instead of standard output',
    }),
    severity: Flags.string({
      description: 'Only report findings at or above this severity',
      options: [...SECURITY_SEVERITIES],
    }),
    'fail-on': Flags.string({
      description: 'Exit with an error when open findings at or above this severity remain ("none" never fails)',
      options: [...SECURITY_SEVERITIES, 'none'],
      default: 'low',
    }),
    baseline: Flags.string({
      description: 'Baseline file of accepted findings (defaults to .b2c-security-baseline.json when present)',
    }),
    'show-suppressed': Flags.boolean({
      description: 'Also list findings that are suppressed inline or in the baseline',
      default: false,
    }),
  };

  // Accept several paths.
  static strict = false;

  protected operations = {scanSecurity};

  async run(): Promise<SecurityScanResponse> {
    const {argv, flags} = await this.parse(SecurityScan);
    const cwd = process.cwd();

    let baselineInfo: ReturnType<typeof loadBaseline>;
    try {
      baselineInfo = loadBaseline(flags.baseline, cwd);
    } catch (error) {
      this.error((error as Error).message);
    }

    let result: SecurityScanResult;
    try {
      result = this.operations.scanSecurity({
        root: cwd,
        paths: argv as string[],
        rules: flags.rule,
        excludeRules: flags['exclude-rule'],
        minSeverity: flags.severity as SecuritySeverity | undefined,
        baseline: baselineInfo.baseline,
      });
    } catch (error) {
      this.error((error as Error).message);
    }

    const open = result.findings.filter((f) => !f.suppression && !f.baselined);
    const failOn = flags['fail-on'];
    const failed = failOn !== 'none' && open.some((f) => isAtLeastSeverity(f.severity, failOn as SecuritySeverity));
    const bySeverity = Object.fromEntries(
      SECURITY_SEVERITIES.map((s) => [s, open.filter((f) => f.severity === s).length]),
    ) as Record<SecuritySeverity, number>;
    const response: SecurityScanResponse = {
      ...result,
      summary: {
        open: open.length,
        suppressed: result.findings.filter((f) => f.suppression).length,
        baselined: result.findings.filter((f) => f.baselined && !f.suppression).length,
        bySeverity,
        baselineFile: baselineInfo.file,
        failed,
      },
    };

    if (this.jsonEnabled() || flags.format !== 'table') {
      const report =
        flags.format === 'sarif' && !this.jsonEnabled()
          ? JSON.stringify(toSarif(result.findings, result.rules, {toolVersion: this.config.version}), null, 2)
          : JSON.stringify(response, null, 2);
      if (flags.output) {
        fs.writeFileSync(flags.output, report + '\n');
        if (!this.jsonEnabled())
          this.logToStderr(t('commands.security.scan.wrote', 'Wrote {{file}}', {file: flags.output}));
      } else if (!this.jsonEnabled()) {
        ux.stdout(report);
      }
      if (failed) process.exitCode = 1;
      return response;
    }

    this.printTable(result, flags['show-suppressed'] ? result.findings : open);
    this.printSummary(response);
    if (failed) {
      this.error(
        t('commands.security.scan.failed', 'Found open security findings at or above "{{severity}}" severity.', {
          severity: failOn,
        }),
        {exit: 1},
      );
    }
    return response;
  }

  private printSummary(response: SecurityScanResponse): void {
    const {summary, filesScanned, errors} = response;
    const counts = SECURITY_SEVERITIES.filter((s) => summary.bySeverity[s] > 0)
      .map((s) => `${summary.bySeverity[s]} ${s}`)
      .join(', ');
    ux.stdout('');
    ux.stdout(
      t(
        'commands.security.scan.summary',
        '{{open}} open finding(s){{counts}} in {{files}} file(s); {{suppressed}} suppressed, {{baselined}} baselined.',
        {
          open: summary.open,
          counts: counts ? ` (${counts})` : '',
          files: filesScanned,
          suppressed: summary.suppressed,
          baselined: summary.baselined,
        },
      ),
    );
    if (summary.baselineFile) {
      ux.stdout(
        t('commands.security.scan.baselineUsed', 'Baseline: {{file}}', {
          file: path.relative(process.cwd(), summary.baselineFile),
        }),
      );
    }
    if (errors.length > 0) {
      ux.stdout(
        t(
          'commands.security.scan.parseErrors',
          '{{count}} file(s) could not be parsed and were skipped (legacy .ds files with type annotations, for example). Use --json to list them.',
          {count: errors.length},
        ),
      );
    }
    if (filesScanned === 0) {
      this.warn(
        t(
          'commands.security.scan.noFiles',
          'No cartridge scripts found. Run this in a project that contains cartridges (folders with a .project file), or pass paths.',
        ),
      );
    }
  }

  private printTable(result: SecurityScanResult, findings: SecurityFinding[]): void {
    let currentFile: string | undefined;
    for (const f of findings) {
      if (f.location.file !== currentFile) {
        currentFile = f.location.file;
        ux.stdout('');
        ux.stdout(ux.colorize('bold', currentFile));
      }
      const where = `${f.location.startLine}:${f.location.startColumn}`.padEnd(8);
      const severity = ux.colorize(SEVERITY_COLORS[f.severity], f.severity.padEnd(8));
      const tag = f.suppression ? ' [suppressed]' : f.baselined ? ' [baselined]' : '';
      ux.stdout(`  ${where}${severity}${f.ruleId.padEnd(24)} ${f.message}${tag}`);
    }
    if (findings.length > 0 && result.rules.length > 0) {
      ux.stdout('');
      ux.stdout(
        t('commands.security.scan.docsHint', 'Rule details and fixes: b2c security rules, or {{url}}', {
          url: findings[0].docsUrl.split('#')[0],
        }),
      );
    }
  }
}
