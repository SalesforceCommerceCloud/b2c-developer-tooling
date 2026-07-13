/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Flags, ux} from '@oclif/core';
import {listCipReports, type CipReportDefinition} from '@salesforce/b2c-tooling-sdk';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {withDocs} from '../../../i18n/index.js';
import {renderTable, writeCsv, writeJson} from '../../../utils/cip/format.js';

interface CipReportListRow {
  category: string;
  name: string;
  description: string;
  required_params: string;
  [key: string]: unknown;
}

interface CipReportListResult {
  reportCount: number;
  reports: CipReportListRow[];
}

function toRow(report: CipReportDefinition): CipReportListRow {
  const required = report.parameters
    .filter((parameter) => parameter.required)
    .map((parameter) => parameter.name)
    .join(', ');

  return {
    category: report.category,
    name: report.name,
    description: report.description,
    required_params: required,
  };
}

/**
 * Lists the curated CIP report catalog grouped by category. Requires no credentials —
 * it reads the static report definitions from the SDK so users (and agents) can
 * discover available reports, their categories, and required parameters.
 */
export default class CipReportList extends BaseCommand<typeof CipReportList> {
  static description = withDocs('List curated CIP reports grouped by category', '/cli/cip.html#b2c-cip-report-list');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> cip report list',
    '<%= config.bin %> cip report list --category "Technical Analytics"',
    '<%= config.bin %> cip report list --json',
  ];

  static flags = {
    category: Flags.string({
      description: 'Filter to a single report category (case-insensitive)',
      helpGroup: 'QUERY',
    }),
    format: Flags.string({
      description: 'Output format',
      options: ['table', 'json', 'csv'],
      default: 'table',
      helpGroup: 'QUERY',
    }),
  };

  async run(): Promise<CipReportListResult> {
    const categoryFilter = this.flags.category?.toLowerCase();
    const reports = listCipReports()
      .filter((report) => !categoryFilter || report.category.toLowerCase() === categoryFilter)
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

    const rows = reports.map((report) => toRow(report));
    const output: CipReportListResult = {reportCount: rows.length, reports: rows};

    if (this.jsonEnabled()) {
      return output;
    }

    if (this.flags.format === 'json') {
      writeJson(output);
      return output;
    }

    if (this.flags.format === 'csv') {
      writeCsv(['category', 'name', 'description', 'required_params'], rows);
      return output;
    }

    this.renderGroupedTable(reports);
    return output;
  }

  private renderGroupedTable(reports: CipReportDefinition[]): void {
    if (reports.length === 0) {
      ux.stdout('No reports match the requested category.');
      return;
    }

    const categories = [...new Set(reports.map((report) => report.category))];
    for (const category of categories) {
      const inCategory = reports.filter((report) => report.category === category);
      ux.stdout(`\n${category}`);
      renderTable(
        ['name', 'required', 'description'],
        inCategory.map((report) => ({
          name: report.name,
          required: report.parameters
            .filter((parameter) => parameter.required)
            .map((parameter) => `--${parameter.name.replaceAll(/[A-Z]/gu, (match) => `-${match.toLowerCase()}`)}`)
            .join(' '),
          description: report.description,
        })) as Array<Record<string, unknown>>,
      );
    }
  }
}

export type {CipReportListResult, CipReportListRow};
