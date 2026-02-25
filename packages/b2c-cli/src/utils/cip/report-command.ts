/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Command, Flags} from '@oclif/core';
import {
  buildCipReportSql,
  executeCipReport,
  getCipReportByName,
  type CipReportDefinition,
  type CipReportParamDefinition,
} from '@salesforce/b2c-tooling-sdk';
import {CipCommand} from './command.js';
import {renderTable, toCsv, type CipOutputFormat} from './format.js';

function camelToKebab(str: string): string {
  return str.replaceAll(/[A-Z]/gu, (match) => `-${match.toLowerCase()}`);
}

interface CipReportDescribeOutput {
  description: string;
  name: string;
  parameters: CipReportParamDefinition[];
}

interface CipReportQueryOutput {
  columns: string[];
  reportName: string;
  rowCount: number;
  rows: Array<Record<string, unknown>>;
}

interface CipReportSqlOutput {
  reportName: string;
  sql: string;
}

export function isLikelyQualifiedCipSiteId(siteId: string): boolean {
  return siteId.startsWith('Sites-') && siteId.endsWith('-Site');
}

export abstract class CipReportCommand<T extends typeof Command> extends CipCommand<T> {
  static reportFlags = {
    describe: Flags.boolean({
      description: 'Show report details and expected parameters',
      exclusive: ['sql'],
      helpGroup: 'QUERY',
    }),
    sql: Flags.boolean({
      description: 'Print generated SQL and exit',
      exclusive: ['describe'],
      helpGroup: 'QUERY',
    }),
  };

  protected abstract readonly reportName: string;

  protected getBaseReportParams(): Record<string, string> {
    const params: Record<string, string> = {};

    if (this.flags.from) {
      params.from = this.flags.from;
    }

    if (this.flags.to) {
      params.to = this.flags.to;
    }

    const flags = this.flags as Record<string, unknown>;

    if (typeof flags['site-id'] === 'string' && flags['site-id'].length > 0) {
      params.siteId = flags['site-id'];
    }

    if (typeof flags.limit === 'number') {
      params.limit = String(flags.limit);
    }

    return params;
  }

  protected abstract getReportParams(): Record<string, string>;

  async run(): Promise<CipReportDescribeOutput | CipReportQueryOutput | CipReportSqlOutput> {
    this.validateCipAuthMethods();

    const report = this.getReportDefinition();
    const flags = this.flags as Record<string, unknown>;

    if (flags.describe === true) {
      return this.describeReport(report);
    }

    const params = this.getReportParams();
    this.warnIfSiteIdLooksUnqualified(params);

    const sqlResult = buildCipReportSql(this.reportName, params);
    if (flags.sql === true) {
      process.stdout.write(`${sqlResult.sql}\n`);
      return {
        reportName: sqlResult.report.name,
        sql: sqlResult.sql,
      };
    }

    this.requireCipCredentials();

    const client = this.getCipClient();
    const result = await executeCipReport(client, this.reportName, {
      fetchSize: this.flags['fetch-size'],
      params,
    });

    const output: CipReportQueryOutput = {
      columns: result.columns,
      reportName: result.reportName,
      rowCount: result.rowCount,
      rows: result.rows,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    if (this.flags.format === 'json') {
      process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
      return output;
    }

    this.renderRows(result.columns, result.rows, this.flags.format as CipOutputFormat);
    return output;
  }

  private describeReport(report: CipReportDefinition): CipReportDescribeOutput {
    const output: CipReportDescribeOutput = {
      description: report.description,
      name: report.name,
      parameters: report.parameters,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    this.log(`${report.name}: ${report.description}`);
    if (report.parameters.length === 0) {
      this.log('No parameters.');
      return output;
    }

    this.renderRows(
      ['flag', 'type', 'required', 'description'],
      report.parameters.map((parameter) => ({
        description: parameter.description,
        flag: `--${camelToKebab(parameter.name)}`,
        required: parameter.required ? 'yes' : 'no',
        type: parameter.type,
      })),
      'table',
    );

    return output;
  }

  private getReportDefinition(): CipReportDefinition {
    const report = getCipReportByName(this.reportName);
    if (!report) {
      this.error(`Unknown CIP report: ${this.reportName}`);
    }

    return report;
  }

  private renderRows(columns: string[], rows: Array<Record<string, unknown>>, format: CipOutputFormat): void {
    if (format === 'csv') {
      process.stdout.write(`${toCsv(columns, rows)}\n`);
      return;
    }

    renderTable(columns, rows);
  }

  private warnIfSiteIdLooksUnqualified(params: Record<string, string>): void {
    const siteId = params.siteId;
    if (!siteId) {
      return;
    }

    if (!isLikelyQualifiedCipSiteId(siteId)) {
      this.warn(
        `The siteId "${siteId}" does not match the typical CIP format "Sites-{siteId}-Site". Continuing with the provided value.`,
      );
    }
  }
}
