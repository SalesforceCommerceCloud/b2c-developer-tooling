/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import {Args, Flags, ux} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  ExperiencesUnavailableError,
  Library,
  PagePushError,
  catalogFromExperienceTypes,
  catalogFromLocalCartridges,
  fetchExperienceTypes,
  libraryPageToPageRequest,
  mergeTypeCatalogs,
  pushPage,
  validatePageRequest,
  type ExperiencePageRequest,
  type PageDesignerTypeCatalog,
  type PageValidationResult,
} from '@salesforce/b2c-tooling-sdk/operations/content';

export interface ContentPushPageResult {
  pageId: string;
  source: string;
  status: 'created' | 'failed' | 'invalid' | 'updated' | 'validated';
  errors?: PageValidationResult['errors'];
  warnings?: PageValidationResult['warnings'];
  message?: string;
}

export interface ContentPushResponse {
  siteId: string;
  dryRun: boolean;
  pages: ContentPushPageResult[];
}

interface PageInput {
  page: ExperiencePageRequest;
  source: string;
}

/**
 * Reads page bodies from a JSON file (one page object or an array of pages) or
 * an exported library XML file (every page, or only `pageIds`).
 */
export async function readPageInputs(file: string, pageIds?: string[]): Promise<PageInput[]> {
  const text = await fs.promises.readFile(file, 'utf8');
  const rel = file;

  if (file.toLowerCase().endsWith('.xml')) {
    const library = await Library.parse(text);
    const pages = library.tree.children.filter(
      (n) => n.type === 'PAGE' && (!pageIds || pageIds.length === 0 || pageIds.includes(n.id)),
    );
    return pages.map((n) => ({page: libraryPageToPageRequest(n), source: `${rel}#${n.id}`}));
  }

  const parsed = JSON.parse(text) as ExperiencePageRequest | ExperiencePageRequest[];
  const list = Array.isArray(parsed) ? parsed : [parsed];
  return list
    .filter((p) => !pageIds || pageIds.length === 0 || pageIds.includes(p?.id))
    .map((p) => ({page: p, source: rel}));
}

/**
 * The platform validates an update against the existing page's type and
 * ignores a changed `typeId`, so a region error naming another type means the
 * page already exists with that type.
 */
export function typeMismatchHint(message: string, typeId: string | undefined): string {
  const match = message.match(/not found in page type '([^']+)'/);
  if (!match || !typeId || match[1] === typeId) return '';
  return ` (page "${typeId}" was requested, but the page already exists with type "${match[1]}"; an existing page's type cannot be changed, so use a new page ID)`;
}

export default class ContentPush extends InstanceCommand<typeof ContentPush> {
  static args = {
    files: Args.string({
      description: 'Page JSON file(s) (Experiences API page body) or exported library XML file(s)',
      required: true,
    }),
  };

  static description =
    'Create or update Page Designer pages on an instance through the Experiences API, validating them against the deployed page and component types first';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> pages/campaign.json --site-id RefArch',
    '<%= config.bin %> <%= command.id %> pages/campaign.json --dry-run',
    '<%= config.bin %> <%= command.id %> ./export/library.xml --page homepage',
    '<%= config.bin %> <%= command.id %> pages/campaign.json --local-types ./cartridges',
  ];

  static flags = {
    'site-id': Flags.string({
      description: 'Site the pages belong to; defaults to siteId from configuration',
    }),
    page: Flags.string({
      description: 'Only push these page IDs from the input files',
      multiple: true,
      multipleNonGreedy: true,
    }),
    'dry-run': Flags.boolean({
      description: 'Validate against the instance types without pushing',
      default: false,
    }),
    validate: Flags.boolean({
      description: 'Validate pages against page and component types before pushing',
      default: true,
      allowNo: true,
    }),
    'local-types': Flags.string({
      description:
        'Directory with cartridge experience/ meta definitions; local types override instance types (for types not yet deployed)',
      multiple: true,
    }),
    force: Flags.boolean({
      description: 'Push pages even when validation reports errors',
      default: false,
    }),
  };

  // Allow multiple file arguments
  static strict = false;

  protected operations = {
    catalogFromLocalCartridges,
    fetchExperienceTypes,
    pushPage,
    readPageInputs,
  };

  async run(): Promise<ContentPushResponse> {
    const {argv} = await this.parse(ContentPush);
    const files = argv as string[];
    this.requireOAuthCredentials();
    const siteId = this.flagOrConfig(this.flags['site-id'], 'siteId');
    if (!siteId) {
      this.error('Site ID is required. Use --site-id or set siteId in your configuration.');
    }
    const dryRun = this.flags['dry-run'];
    const shouldValidate = this.flags.validate || dryRun;

    const inputs: PageInput[] = [];
    for (const file of files) {
      if (!fs.existsSync(file)) this.error(`File not found: ${file}`);
      try {
        // eslint-disable-next-line no-await-in-loop
        inputs.push(...(await this.operations.readPageInputs(file, this.flags.page)));
      } catch (error) {
        this.error(`${file}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (inputs.length === 0) {
      this.error(this.flags.page ? `No pages matching ${this.flags.page.join(', ')} found.` : 'No pages found.');
    }

    let catalog: PageDesignerTypeCatalog | undefined;
    try {
      if (shouldValidate) {
        const live = catalogFromExperienceTypes(await this.operations.fetchExperienceTypes(this.instance, {siteId}));
        const localDirs = this.flags['local-types'] ?? [];
        catalog =
          localDirs.length > 0
            ? mergeTypeCatalogs(live, await this.operations.catalogFromLocalCartridges(localDirs))
            : live;
      }
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError) this.error(error.message);
      throw error;
    }

    const results: ContentPushPageResult[] = [];
    for (const {page, source} of inputs) {
      const pageId = page?.id ?? '(no id)';
      const result: ContentPushPageResult = {pageId, source, status: 'validated'};
      results.push(result);

      if (catalog) {
        const validation = validatePageRequest(page, catalog);
        if (validation.errors.length > 0) result.errors = validation.errors;
        if (validation.warnings.length > 0) result.warnings = validation.warnings;
        if (!validation.valid && !this.flags.force) {
          result.status = 'invalid';
          continue;
        }
      }
      if (dryRun) continue;

      try {
        // Sequential on purpose: keeps output ordered and avoids bursts against the API.
        // eslint-disable-next-line no-await-in-loop
        const pushed = await this.operations.pushPage(this.instance, page, {siteId});
        result.status = pushed.status;
        if (pushed.status === 'updated' && pushed.page.typeId && pushed.page.typeId !== page.typeId) {
          result.warnings = [
            ...(result.warnings ?? []),
            {
              severity: 'warning',
              path: '/typeId',
              message: `Page already exists with type "${pushed.page.typeId}"; the type of an existing page cannot be changed`,
            },
          ];
        }
      } catch (error) {
        if (error instanceof ExperiencesUnavailableError) this.error(error.message);
        if (error instanceof PagePushError) {
          result.status = 'failed';
          result.message = error.message + typeMismatchHint(error.message, page.typeId);
          continue;
        }
        throw error;
      }
    }

    const response: ContentPushResponse = {siteId, dryRun, pages: results};
    const failed = results.some((r) => r.status === 'failed' || r.status === 'invalid');

    if (this.jsonEnabled()) {
      if (failed) process.exitCode = 1;
      return response;
    }

    this.printResults(results, dryRun);
    if (failed) {
      this.error('One or more pages were not pushed.', {exit: 1});
    }
    return response;
  }

  private printResults(results: ContentPushPageResult[], dryRun: boolean): void {
    const lines: string[] = [];
    for (const r of results) {
      const label =
        r.status === 'created' || r.status === 'updated'
          ? ux.colorize('green', r.status)
          : r.status === 'validated'
            ? ux.colorize('green', 'valid')
            : ux.colorize('red', r.status);
      lines.push(`${r.pageId} (${r.source}): ${label}`);
      for (const e of r.errors ?? []) lines.push(`  ${ux.colorize('red', 'error')} ${e.path || '/'}: ${e.message}`);
      for (const w of r.warnings ?? [])
        lines.push(`  ${ux.colorize('yellow', 'warning')} ${w.path || '/'}: ${w.message}`);
      if (r.message) lines.push(`  ${r.message}`);
    }
    const pushed = results.filter((r) => r.status === 'created' || r.status === 'updated').length;
    if (pushed > 0) {
      lines.push(
        '',
        `${pushed} page(s) saved. New pages are offline until you set them online in Business Manager; changes to an online page are live right away.`,
      );
    } else if (dryRun) {
      lines.push('', 'Dry run: nothing was pushed.');
    }
    ux.stdout(lines.join('\n'));
  }
}
