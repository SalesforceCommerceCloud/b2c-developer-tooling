/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import {
  BaseCommand,
  CommandSearchIndex,
  TableRenderer,
  columnFlagsFor,
  selectColumns,
  type ColumnDef,
  type CommandSearchResult,
} from '@salesforce/b2c-tooling-sdk/cli';
import {t} from '../../i18n/index.js';

interface SearchCommandsResponse {
  query: string;
  topic?: string;
  total: number;
  results: CommandSearchResult[];
}

const COLUMNS: Record<string, ColumnDef<CommandSearchResult>> = {
  command: {
    header: 'Command',
    get: (r) => r.command,
  },
  summary: {
    header: 'Summary',
    get: (r) => (r.deprecated ? `(deprecated) ${r.summary}` : r.summary),
  },
  topic: {
    header: 'Topic',
    get: (r) => r.topic,
  },
  example: {
    header: 'Example',
    get: (r) => r.examples[0] ?? '',
  },
  score: {
    header: 'Match',
    get: (r) => r.score.toFixed(1),
  },
};

const DEFAULT_COLUMNS = ['command', 'summary'];

const tableRenderer = new TableRenderer(COLUMNS);

export default class CommandsSearch extends BaseCommand<typeof CommandsSearch> {
  static args = {
    query: Args.string({
      description: 'What you want to do (matches command names, summaries, descriptions, topics, and flags)',
      required: true,
    }),
  };

  static description = t(
    'commands.commands.search.description',
    'Search CLI commands by task or keyword. Use "docs search" to search B2C Commerce documentation instead.',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> "deploy cartridges"',
    '<%= config.bin %> <%= command.id %> "reset sandbox" --json',
    '<%= config.bin %> <%= command.id %> logs --limit 5',
    '<%= config.bin %> <%= command.id %> "environment variables" --topic mrt',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({
      char: 'l',
      description: 'Maximum number of results to display',
      default: 10,
      min: 1,
    }),
    topic: Flags.string({
      char: 't',
      description: 'Restrict results to commands under a topic (e.g. "mrt" or "mrt env")',
    }),
    ...columnFlagsFor(COLUMNS),
  };

  async run(): Promise<SearchCommandsResponse> {
    const {query} = this.args;
    const {limit, topic} = this.flags;

    const index = new CommandSearchIndex(this.config.commands, this.config.topics);
    const results = index.search(query, {bin: this.config.bin, limit, topic});

    const response: SearchCommandsResponse = {
      query,
      ...(topic && {topic}),
      total: results.length,
      results,
    };

    if (this.jsonEnabled()) {
      return response;
    }

    if (results.length === 0) {
      ux.stdout(
        t(
          'commands.commands.search.noResults',
          'No commands found matching: {{query}}\nTo search documentation instead, run: {{bin}} docs search {{quoted}}\nTo browse topics, run: {{bin}} --help',
          {query, bin: this.config.bin, quoted: JSON.stringify(query)},
        ),
      );
      return response;
    }

    tableRenderer.render(results, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));

    this.log(
      t(
        'commands.commands.search.hint',
        'Run "<command> --help" for usage. Search documentation with "{{bin}} docs search <query>".',
        {bin: this.config.bin},
      ),
    );

    return response;
  }
}
