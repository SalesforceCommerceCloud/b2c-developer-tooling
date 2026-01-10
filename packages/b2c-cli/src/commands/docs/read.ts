/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {marked} from 'marked';
// eslint-disable-next-line import/namespace -- marked-terminal CJS module causes parser issues
import {markedTerminal} from 'marked-terminal';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {readDocByQuery, type DocEntry} from '@salesforce/b2c-tooling-sdk/operations/docs';
import {t} from '../../i18n/index.js';

interface ReadDocsResult {
  entry: DocEntry;
  content: string;
}

// Configure marked with terminal renderer
marked.use(
  markedTerminal({
    width: 80,
    reflowText: true,
    tableOptions: {
      wordWrap: true,
      colWidths: [35, 45],
    },
  }),
);

export default class DocsRead extends BaseCommand<typeof DocsRead> {
  static args = {
    query: Args.string({
      description: 'Search query for documentation (class name, module path, or partial match)',
      required: true,
    }),
  };

  static description = t('commands.docs.read.description', 'Read Script API documentation for a class or module');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> ProductMgr',
    '<%= config.bin %> <%= command.id %> dw.catalog.ProductMgr',
    '<%= config.bin %> <%= command.id %> "dw system Status"',
    '<%= config.bin %> <%= command.id %> ProductMgr --raw',
    '<%= config.bin %> <%= command.id %> ProductMgr --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    raw: Flags.boolean({
      char: 'r',
      description: 'Output raw markdown without terminal formatting',
      default: false,
    }),
  };

  async run(): Promise<ReadDocsResult> {
    const {query} = this.args;
    const {raw} = this.flags;

    const result = readDocByQuery(query);

    if (!result) {
      this.error(t('commands.docs.read.notFound', 'No documentation found matching: {{query}}', {query}), {
        suggestions: ['Try a broader search term', 'Use "b2c docs search <query>" to see available matches'],
      });
    }

    if (this.jsonEnabled()) {
      return result;
    }

    // Determine if we should render markdown for terminal
    const useRaw = raw || !process.stdout.isTTY;

    if (useRaw) {
      process.stdout.write(result.content);
    } else {
      const rendered = marked.parse(result.content);
      process.stdout.write(rendered as string);
    }

    return result;
  }
}
