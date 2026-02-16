/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs';
import {Args, Flags} from '@oclif/core';
import {withDocs} from '../../i18n/index.js';
import {CipCommand} from '../../utils/cip/command.js';
import {renderTable, toCsv, type CipOutputFormat} from '../../utils/cip/format.js';

interface CipQueryCommandResult {
  columns: string[];
  rowCount: number;
  rows: Array<Record<string, unknown>>;
  sql: string;
}

export default class CipQuery extends CipCommand<typeof CipQuery> {
  static args = {
    sql: Args.string({
      description: 'SQL query text',
      required: false,
    }),
  };

  static description = withDocs('Execute raw SQL against CIP analytics', '/cli/cip.html#b2c-cip-query');

  static enableJsonFlag = true;

  static flags = {
    ...CipCommand.baseFlags,
    file: Flags.string({
      char: 'f',
      description: 'Read SQL query from file',
      helpGroup: 'QUERY',
    }),
    stdin: Flags.boolean({
      description: 'Read SQL query from stdin',
      default: false,
      helpGroup: 'QUERY',
    }),
  };

  async run(): Promise<CipQueryCommandResult> {
    const sql = this.resolveSql();

    this.requireCipCredentials();
    const client = this.getCipClient();
    const result = await client.query(sql, {fetchSize: this.flags['fetch-size']});
    const output: CipQueryCommandResult = {
      columns: result.columns,
      rows: result.rows,
      rowCount: result.rowCount,
      sql,
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

  private renderRows(columns: string[], rows: Array<Record<string, unknown>>, format: CipOutputFormat): void {
    if (format === 'csv') {
      process.stdout.write(`${toCsv(columns, rows)}\n`);
      return;
    }

    renderTable(columns, rows);
  }

  private resolveSql(): string {
    const positionalSql = this.args.sql;
    const hasPositional = Boolean(positionalSql);
    const hasFile = Boolean(this.flags.file);
    const hasStdin = this.flags.stdin === true;

    if (hasStdin && hasFile) {
      this.error('Use either --stdin or --file, not both.');
    }

    if (!hasStdin && hasFile && hasPositional) {
      this.error('Use either a positional SQL argument or --file, not both.');
    }

    if (!hasStdin && !hasFile && !hasPositional) {
      this.error('No SQL provided. Pass SQL as an argument, or use --file / --stdin.');
    }

    const rawSql = hasStdin
      ? fs.readFileSync(0, 'utf8')
      : hasFile
        ? fs.readFileSync(this.flags.file as string, 'utf8')
        : positionalSql;

    if (!rawSql || rawSql.trim().length === 0) {
      this.error('SQL input is empty.');
    }

    let sql = rawSql;
    if (this.flags.from) {
      sql = sql.replaceAll('<FROM>', this.flags.from);
    }
    if (this.flags.to) {
      sql = sql.replaceAll('<TO>', this.flags.to);
    }

    return sql.trim();
  }
}
