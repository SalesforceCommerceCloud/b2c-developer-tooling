/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Flags} from '@oclif/core';
import {listCipTables} from '@salesforce/b2c-tooling-sdk';
import {withDocs} from '../../i18n/index.js';
import {CipCommand} from '../../utils/cip/command.js';
import {renderTable, toCsv, type CipOutputFormat} from '../../utils/cip/format.js';

const {from: _unusedFrom, to: _unusedTo, ...cipMetadataFlags} = CipCommand.baseFlags;

interface CipTablesCommandResult {
  schema: string;
  tableCount: number;
  tables: Array<{
    schema: string;
    table: string;
    type: string;
  }>;
}

export default class CipTables extends CipCommand<typeof CipTables> {
  static description = withDocs('List tables from CIP metadata catalog', '/cli/cip.html#b2c-cip-tables');

  static enableJsonFlag = true;

  static flags = {
    ...cipMetadataFlags,
    all: Flags.boolean({
      description: 'Include all table types (default only TABLE)',
      default: false,
      helpGroup: 'QUERY',
    }),
    pattern: Flags.string({
      description: 'Table name pattern (SQL LIKE)',
      helpGroup: 'QUERY',
    }),
    schema: Flags.string({
      description: 'Metadata schema name',
      default: 'warehouse',
      helpGroup: 'QUERY',
    }),
  };

  async run(): Promise<CipTablesCommandResult> {
    this.requireCipCredentials();

    const client = this.getCipClient();
    const result = await listCipTables(client, {
      fetchSize: this.flags['fetch-size'],
      schema: this.flags.schema,
      tableNamePattern: this.flags.pattern,
      tableType: this.flags.all ? undefined : 'TABLE',
    });

    const rows = result.tables.map((table) => ({
      schema: table.tableSchema,
      table: table.tableName,
      type: table.tableType,
    }));

    const output: CipTablesCommandResult = {
      schema: this.flags.schema,
      tableCount: result.tableCount,
      tables: rows,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    if (this.flags.format === 'json') {
      process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
      return output;
    }

    this.renderRows(rows, this.flags.format as CipOutputFormat);
    return output;
  }

  private renderRows(rows: CipTablesCommandResult['tables'], format: CipOutputFormat): void {
    const columns = ['table', 'type'];
    if (format === 'csv') {
      process.stdout.write(`${toCsv(columns, rows)}\n`);
      return;
    }

    renderTable(columns, rows);
  }
}
