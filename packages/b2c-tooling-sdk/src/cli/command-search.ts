/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Full-text search over CLI command metadata.
 *
 * Lets users (and especially AI agents) find the right command for a task
 * ("deploy cartridges", "tail logs", "reset sandbox") without walking the help
 * tree. Complements documentation search (`b2c docs search`), which covers the
 * Script API, SCAPI/OCAPI references, guides, and job steps rather than commands.
 *
 * The input shape is a structural subset of oclif's `Command.Loadable` and
 * `Topic`, so `config.commands` / `config.topics` can be passed directly.
 *
 * @module cli/command-search
 */
import MiniSearch from 'minisearch';

/** Minimal flag metadata used for indexing (subset of oclif `Flag.Cached`). */
export interface SearchableFlag {
  char?: string;
  description?: string;
  helpGroup?: string;
  hidden?: boolean;
  summary?: string;
}

/** Example definition (oclif accepts strings or `{command, description}`). */
export type SearchableExample = string | {command: string; description: string};

/** Minimal command metadata used for indexing (subset of oclif `Command.Loadable`). */
export interface SearchableCommand {
  id: string;
  aliases?: string[];
  deprecationOptions?: unknown;
  description?: string;
  examples?: SearchableExample[];
  flags?: Record<string, SearchableFlag>;
  hidden?: boolean;
  state?: string;
  summary?: string;
}

/** Minimal topic metadata (subset of oclif `Topic`). */
export interface SearchableTopic {
  name: string;
  description?: string;
  hidden?: boolean;
}

export interface CommandSearchOptions {
  /** CLI binary name used to render display commands and examples. Defaults to `b2c`. */
  bin?: string;
  /** Maximum results to return. Defaults to 10. */
  limit?: number;
  /** Restrict results to commands under this topic (e.g. `mrt` or `mrt env`). */
  topic?: string;
}

export interface CommandSearchResult {
  /** Runnable command with spaces (e.g. `b2c code deploy`). */
  command: string;
  /** oclif command id (e.g. `code:deploy`). */
  id: string;
  /** One-line summary. */
  summary: string;
  /** Top-level topic (e.g. `code`). */
  topic: string;
  /** Relevance score (higher is better). */
  score: number;
  /** Rendered examples (up to 3). */
  examples: string[];
  aliases?: string[];
  /** True when the command is deprecated; deprecated commands rank lower. */
  deprecated?: boolean;
  /** Command state such as `beta`, when set. */
  state?: string;
}

interface IndexedCommand {
  id: string;
  command: string;
  summary: string;
  description: string;
  aliases: string;
  topics: string;
  flags: string;
}

/** Flags added by base command classes carry a helpGroup and add noise to ranking. */
const IGNORED_FLAGS = new Set(['help', 'json', 'jsonl']);

/** Deprecated commands still match, but rank below their replacements. */
const DEPRECATED_SCORE_FACTOR = 0.5;

const MAX_EXAMPLES = 3;

function firstLine(text: string | undefined): string {
  return (
    (text ?? '')
      .split('\n')
      .find((line) => line.trim())
      ?.trim() ?? ''
  );
}

function toDisplay(id: string): string {
  return id.replaceAll(':', ' ');
}

function isDeprecated(command: SearchableCommand): boolean {
  return command.state === 'deprecated' || Boolean(command.deprecationOptions);
}

function flagText(flags: Record<string, SearchableFlag> | undefined): string {
  if (!flags) return '';
  const parts: string[] = [];
  for (const [name, flag] of Object.entries(flags)) {
    if (flag.hidden || flag.helpGroup || IGNORED_FLAGS.has(name)) continue;
    parts.push(name.replaceAll('-', ' '), flag.summary ?? '', firstLine(flag.description));
  }
  return parts.filter(Boolean).join(' ');
}

function topicText(id: string, topics: Map<string, string>): string {
  const segments = id.split(':');
  const parts: string[] = [];
  for (let i = 1; i < segments.length; i++) {
    const description = topics.get(segments.slice(0, i).join(':'));
    if (description) parts.push(description);
  }
  return parts.join(' ');
}

function renderExample(example: SearchableExample, bin: string, id: string): string {
  const raw = typeof example === 'string' ? example : example.command;
  return raw
    .replaceAll(/<%=\s*config\.bin\s*%>/g, bin)
    .replaceAll(/<%=\s*command\.id\s*%>/g, toDisplay(id))
    .trim();
}

/**
 * Searchable index over CLI commands.
 *
 * @example
 * ```typescript
 * import {CommandSearchIndex} from '@salesforce/b2c-tooling-sdk/cli';
 *
 * // Inside an oclif command:
 * const index = new CommandSearchIndex(this.config.commands, this.config.topics);
 * const results = index.search('deploy cartridges', {bin: this.config.bin});
 * ```
 */
export class CommandSearchIndex {
  private readonly commands: Map<string, SearchableCommand>;
  private readonly index: MiniSearch<IndexedCommand>;

  constructor(commands: readonly SearchableCommand[], topics: readonly SearchableTopic[] = []) {
    const topicDescriptions = new Map(
      topics.filter((t) => !t.hidden).map((t) => [t.name.replaceAll(' ', ':'), firstLine(t.description)]),
    );

    // oclif lists each alias as its own command entry (id = alias). Index only
    // canonical commands; aliases are indexed and reported on the canonical entry.
    this.commands = new Map();
    for (const command of commands) {
      if (command.hidden || command.aliases?.includes(command.id) || this.commands.has(command.id)) continue;
      this.commands.set(command.id, command);
    }

    this.index = new MiniSearch<IndexedCommand>({
      idField: 'id',
      fields: ['command', 'summary', 'aliases', 'description', 'topics', 'flags'],
      searchOptions: {
        boost: {command: 8, summary: 5, aliases: 4, description: 2, topics: 1.5, flags: 1},
        fuzzy: 0.2,
        prefix: true,
      },
    });
    this.index.addAll(
      [...this.commands.values()].map((command) => ({
        id: command.id,
        command: toDisplay(command.id),
        summary: command.summary ?? firstLine(command.description),
        description: command.description ?? '',
        aliases: (command.aliases ?? []).map((a) => toDisplay(a)).join(' '),
        topics: topicText(command.id, topicDescriptions),
        flags: flagText(command.flags),
      })),
    );
  }

  /** Number of indexed (non-hidden) commands. */
  get size(): number {
    return this.commands.size;
  }

  /**
   * Search commands by free-text query.
   *
   * @param query - Free-text query (e.g. `deploy cartridges`, `sandbox reset`)
   * @param options - Result limit, topic filter, and binary name
   * @returns Matching commands, best first
   */
  search(query: string, options: CommandSearchOptions = {}): CommandSearchResult[] {
    const bin = options.bin ?? 'b2c';
    const limit = options.limit ?? 10;
    const topicPrefix = options.topic?.trim().replaceAll(/\s+/g, ':');
    const inTopic = (id: string) => !topicPrefix || id === topicPrefix || id.startsWith(`${topicPrefix}:`);

    const results: CommandSearchResult[] = [];
    for (const hit of this.index.search(query.trim())) {
      const command = this.commands.get(hit.id as string);
      if (!command || !inTopic(command.id)) continue;
      const deprecated = isDeprecated(command);
      results.push({
        command: `${bin} ${toDisplay(command.id)}`,
        id: command.id,
        summary: command.summary ?? firstLine(command.description),
        topic: command.id.split(':')[0],
        score: Math.round(hit.score * (deprecated ? DEPRECATED_SCORE_FACTOR : 1) * 100) / 100,
        examples: (command.examples ?? []).slice(0, MAX_EXAMPLES).map((e) => renderExample(e, bin, command.id)),
        ...(command.aliases?.length ? {aliases: command.aliases.map((a) => toDisplay(a))} : {}),
        ...(deprecated ? {deprecated: true} : {}),
        ...(command.state && command.state !== 'deprecated' ? {state: command.state} : {}),
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }
}
