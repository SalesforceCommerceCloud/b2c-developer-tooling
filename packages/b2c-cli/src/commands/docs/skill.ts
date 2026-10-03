/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {BaseCommand, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  GuidanceError,
  type GuidanceCatalog,
  type GuidancePage,
  type GuidanceRead,
  type GuidanceSummary,
} from '@salesforce/b2c-tooling-sdk/guidance';
import {t} from '../../i18n/index.js';
import {DEFAULT_SKILL_COLLECTION, loadSkillCatalog, skillArgument, skillForCommand} from '../../lib/skills.js';

type SkillResult = GuidancePage | GuidanceRead;

function firstSentence(text: string): string {
  const match = /^.+?[.!?](?=\s|$)/s.exec(text.trim());
  return (match?.[0] ?? text).replaceAll(/\s+/g, ' ');
}

const COLUMNS: Record<string, ColumnDef<GuidanceSummary>> = {
  skill: {
    header: 'Skill',
    get: (entry) => skillArgument(entry.id),
  },
  description: {
    header: 'Description',
    get: (entry) => firstSentence(entry.description),
  },
};

const tableRenderer = new TableRenderer(COLUMNS);

export default class DocsSkill extends BaseCommand<typeof DocsSkill> {
  static args = {};

  static description = t(
    'commands.docs.skill.description',
    'List, search, or read the agent skills bundled with the CLI. Pass a skill name, or a command or topic (e.g. "code deploy") to read the skill that covers it; anything else is searched.',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> code deploy',
    '<%= config.bin %> <%= command.id %> b2c-sandbox',
    '<%= config.bin %> <%= command.id %> b2c-mrt --file references/ENVIRONMENTS.md',
    '<%= config.bin %> <%= command.id %> --search "site import"',
    '<%= config.bin %> <%= command.id %> --collection storefront-next',
    '<%= config.bin %> <%= command.id %> --all --search "custom api"',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    all: Flags.boolean({
      description: 'Use every bundled collection instead of only --collection',
      default: false,
    }),
    collection: Flags.string({
      char: 'c',
      description: 'Skill collection (e.g. b2c-cli, b2c, b2c-ops, storefront-next)',
      default: DEFAULT_SKILL_COLLECTION,
    }),
    file: Flags.string({
      description: 'Read a reference file of the skill instead of SKILL.md (e.g. references/API.md)',
    }),
    limit: Flags.integer({
      char: 'l',
      description: 'Maximum number of search results (1-20)',
      default: 10,
      min: 1,
      max: 20,
    }),
    search: Flags.boolean({
      char: 's',
      description: 'Search skills with the arguments as the query instead of resolving a skill',
      default: false,
    }),
    section: Flags.string({
      description: 'Read only one section (heading ID) of the file',
    }),
  };

  static strict = false;

  protected catalogLoader: () => GuidanceCatalog | undefined = loadSkillCatalog;

  async run(): Promise<SkillResult> {
    const {argv} = await this.parse(DocsSkill);
    const query = (argv as string[]).join(' ').trim();
    const {all, file, limit, search, section} = this.flags;
    const collection = all ? undefined : this.flags.collection;

    const catalog = this.catalogLoader();
    if (!catalog) {
      this.error(
        t(
          'commands.docs.skill.unavailable',
          'Bundled skills are unavailable; rebuild or reinstall the CLI. Skills are also published at https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills',
        ),
      );
    }

    try {
      if (!query) {
        if (file || section) {
          this.error(t('commands.docs.skill.nameRequired', 'Specify a skill to read with --file or --section.'));
        }
        return this.list(catalog, collection);
      }

      const id = search ? undefined : this.resolve(catalog, query, collection);
      if (!id) {
        if (file || section) {
          this.error(
            t(
              'commands.docs.skill.notFound',
              'No skill found for: {{query}}. Search with: {{bin}} docs skill --search {{quoted}}',
              {
                query,
                bin: this.config.bin,
                quoted: JSON.stringify(query),
              },
            ),
          );
        }
        return this.search(catalog, query, collection, limit);
      }

      return this.read(catalog, id, file, section);
    } catch (error) {
      if (!(error instanceof GuidanceError)) throw error;
      const sections = error.sections?.map((s) => `  ${s.id}  (${s.title})`) ?? [];
      this.error(sections.length > 0 ? `${error.message}\nSections:\n${sections.join('\n')}` : error.message);
    }
  }

  private list(catalog: GuidanceCatalog, collection: string | undefined): GuidancePage {
    const entries: GuidanceSummary[] = [];
    let page = catalog.read({collection}) as GuidancePage;
    entries.push(...page.entries);
    while (page.nextOffset !== undefined) {
      page = catalog.read({collection, offset: page.nextOffset}) as GuidancePage;
      entries.push(...page.entries);
    }
    const result: GuidancePage = {
      kind: 'directory',
      collections: page.collections,
      entries,
      total: page.total,
      offset: 0,
    };

    if (this.jsonEnabled()) return result;

    tableRenderer.render(entries, ['skill', 'description']);
    this.log(
      t('commands.docs.skill.listHint', '{{count}} skills. Read one with "{{bin}} docs skill <skill>".', {
        count: entries.length,
        bin: this.config.bin,
      }),
    );
    return result;
  }

  private read(catalog: GuidanceCatalog, id: string, file?: string, section?: string): GuidanceRead {
    const result = catalog.read({id, file, section}) as GuidanceRead;
    if (this.jsonEnabled()) return result;

    process.stdout.write(result.content.endsWith('\n') ? result.content : `${result.content}\n`);
    const arg = skillArgument(result.id);
    if (result.references.length > 0) {
      this.logToStderr(
        t('commands.docs.skill.references', '\nReferences (read with "{{bin}} docs skill {{arg}} --file <path>"):', {
          bin: this.config.bin,
          arg,
        }),
      );
      for (const reference of result.references) this.logToStderr(`  ${reference}`);
    }
    return result;
  }

  /**
   * Resolves arguments to a skill ID: an exact ID or skill name, then a command
   * or topic mapped to its skill. Returns `undefined` to fall back to search.
   */
  private resolve(catalog: GuidanceCatalog, query: string, collection: string | undefined): string | undefined {
    const collections = collection
      ? [collection]
      : (catalog.read({limit: 1}) as GuidancePage).collections.map((c) => c.id);
    const inScope = (id: string) => catalog.has(id) && (!collection || id.startsWith(`${collection}/`));

    if (inScope(query)) return query;
    const name = query.replaceAll(/\s+/g, '-');
    for (const candidate of collections.flatMap((c) => [`${c}/${name}`, `${c}/b2c-${name}`])) {
      if (inScope(candidate)) return candidate;
    }

    const commandId = query.replace(new RegExp(`^${this.config.bin}\\s+`), '').replaceAll(/\s+/g, ':');
    const known = this.config.findCommand(commandId) ?? this.config.findTopic(commandId);
    if (!known) return undefined;
    const skill = skillForCommand(commandId, (id) => catalog.has(id));
    return skill && inScope(skill) ? skill : undefined;
  }

  private search(catalog: GuidanceCatalog, query: string, collection: string | undefined, limit: number): GuidancePage {
    const result = catalog.read({query, collection, limit}) as GuidancePage;
    if (this.jsonEnabled()) return result;

    if (result.entries.length === 0) {
      ux.stdout(
        t(
          'commands.docs.skill.noResults',
          'No skills found matching: {{query}}\nTo search commands, run: {{bin}} commands search {{quoted}}\nTo search documentation, run: {{bin}} docs search {{quoted}}',
          {query, bin: this.config.bin, quoted: JSON.stringify(query)},
        ),
      );
      return result;
    }

    tableRenderer.render(result.entries, ['skill', 'description']);
    this.log(
      t('commands.docs.skill.searchHint', 'Read a skill with "{{bin}} docs skill <skill>".', {bin: this.config.bin}),
    );
    return result;
  }
}
