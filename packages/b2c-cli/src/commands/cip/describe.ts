/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Args, Flags} from '@oclif/core';
import {describeCipTable} from '@salesforce/b2c-tooling-sdk';
import {withDocs} from '../../i18n/index.js';
import {CipCommand} from '../../utils/cip/command.js';
import {renderTable, toCsv, type CipOutputFormat} from '../../utils/cip/format.js';

const {from: _unusedFrom, to: _unusedTo, ...cipMetadataFlags} = CipCommand.baseFlags;

interface CipDescribeCommandResult {
  columnCount: number;
  columns: Array<{
    column: string;
    dataType: string;
    isNullable: boolean;
    position: number;
  }>;
  tableName: string;
  tableSchema: string;
}

export default class CipDescribe extends CipCommand<typeof CipDescribe> {
  static args = {
    table: Args.string({
      description: 'Table name to describe',
      required: true,
    }),
  };

  static description = withDocs('Describe columns for a CIP table', '/cli/cip.html#b2c-cip-describe');

  static enableJsonFlag = true;

  static flags = {
    ...cipMetadataFlags,
    schema: Flags.string({
      description: 'Metadata schema name',
      default: 'warehouse',
      helpGroup: 'QUERY',
    }),
  };

  async run(): Promise<CipDescribeCommandResult> {
    this.requireCipCredentials();

    const client = this.getCipClient();
    const result = await describeCipTable(client, this.args.table, {
      fetchSize: this.flags['fetch-size'],
      schema: this.flags.schema,
    });

    if (result.columnCount === 0) {
      this.error(`No columns found for table "${this.args.table}" in schema "${this.flags.schema}".`);
    }

    const rows = result.columns.map((column) => ({
      column: column.columnName,
      dataType: column.dataType,
      isNullable: column.isNullable,
      position: column.ordinalPosition,
    }));

    const output: CipDescribeCommandResult = {
      columnCount: result.columnCount,
      columns: rows,
      tableName: result.tableName,
      tableSchema: result.tableSchema,
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

  private renderRows(rows: CipDescribeCommandResult['columns'], format: CipOutputFormat): void {
    const columns = ['column', 'dataType', 'isNullable'];
    if (format === 'csv') {
      process.stdout.write(`${toCsv(columns, rows)}\n`);
      return;
    }

    renderTable(columns, rows);
  }
}
