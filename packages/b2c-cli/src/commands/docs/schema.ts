/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {readSchemaByQuery, listSchemas, type SchemaEntry} from '@salesforce/b2c-tooling-sdk/operations/docs';
import {t} from '../../i18n/index.js';

interface SchemaResult {
  entry: SchemaEntry;
  content: string;
}

interface ListResult {
  entries: SchemaEntry[];
}

export default class DocsSchema extends BaseCommand<typeof DocsSchema> {
  static args = {
    query: Args.string({
      description: 'Schema name or partial match (e.g., "catalog", "order")',
      required: false,
    }),
  };

  static description = t('commands.docs.schema.description', 'Read an XSD schema file');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> catalog',
    '<%= config.bin %> <%= command.id %> order',
    '<%= config.bin %> <%= command.id %> --list',
    '<%= config.bin %> <%= command.id %> catalog --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    list: Flags.boolean({
      char: 'l',
      description: 'List all available schemas',
      default: false,
    }),
  };

  protected operations = {
    listSchemas,
    readSchemaByQuery,
  };

  async run(): Promise<ListResult | SchemaResult> {
    const {query} = this.args;
    const {list} = this.flags;

    // List mode
    if (list) {
      const entries = this.operations.listSchemas();

      if (this.jsonEnabled()) {
        return {entries};
      }

      this.log(t('commands.docs.schema.available', 'Available schemas:'));
      for (const entry of entries) {
        this.log(`  ${entry.id}`);
      }
      this.log('');
      this.log(t('commands.docs.schema.count', '{{count}} schemas available', {count: entries.length}));

      return {entries};
    }

    // Read mode requires query
    if (!query) {
      this.error(t('commands.docs.schema.queryRequired', 'Schema name is required. Use --list to see all schemas.'));
    }

    const result = this.operations.readSchemaByQuery(query);

    if (!result) {
      this.error(t('commands.docs.schema.notFound', 'No schema found matching: {{query}}', {query}), {
        suggestions: ['Try a broader search term', 'Use "b2c docs schema --list" to see available schemas'],
      });
    }

    if (this.jsonEnabled()) {
      return result;
    }

    // Output the schema content
    process.stdout.write(result.content);

    return result;
  }
}
