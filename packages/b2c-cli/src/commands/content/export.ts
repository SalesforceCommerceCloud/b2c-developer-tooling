/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import {JobCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  LibraryNode,
  exportContent,
  fetchContentLibrary,
  type ContentExportResult,
} from '@salesforce/b2c-tooling-sdk/operations/content';

export default class ContentExport extends JobCommand<typeof ContentExport> {
  static args = {
    pages: Args.string({
      description: 'Content IDs to export (pages, content assets, or components)',
      required: true,
    }),
  };

  static description = 'Export Page Designer pages with components and assets from a content library';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --library SharedLibrary homepage',
    '<%= config.bin %> <%= command.id %> --library SharedLibrary homepage about-us',
    '<%= config.bin %> <%= command.id %> --library SharedLibrary "hero-.*" --regex',
    '<%= config.bin %> <%= command.id %> --library RefArch --site-library homepage -o ./export',
    '<%= config.bin %> <%= command.id %> --library SharedLibrary homepage --json',
    '<%= config.bin %> <%= command.id %> --library SharedLibrary homepage --dry-run',
  ];

  static flags = {
    ...JobCommand.baseFlags,
    library: Flags.string({
      description: 'Library ID or site ID (also configurable via dw.json "content-library")',
    }),
    output: Flags.string({
      char: 'o',
      description: 'Output directory',
    }),
    'site-library': Flags.boolean({
      description: 'Library is a site-private library',
      default: false,
    }),
    'asset-query': Flags.string({
      char: 'q',
      description: 'JSON dot-paths for asset extraction',
      multiple: true,
      default: ['image.path'],
    }),
    regex: Flags.boolean({
      char: 'r',
      description: 'Treat page IDs as regular expressions',
      default: false,
    }),
    folder: Flags.string({
      description: 'Filter by folder classification',
      multiple: true,
    }),
    offline: Flags.boolean({
      description: 'Skip asset downloads',
      default: false,
    }),
    'library-file': Flags.string({
      description: 'Use a local library XML file instead of fetching from instance',
    }),
    'keep-orphans': Flags.boolean({
      description: 'Include orphan components in export',
      default: false,
    }),
    'show-tree': Flags.boolean({
      description: 'Display tree structure of exported content',
      default: true,
    }),
    timeout: Flags.integer({
      description: 'Export job timeout in seconds',
    }),
    'dry-run': Flags.boolean({
      description: 'Preview export without downloading assets or writing files',
      default: false,
    }),
  };

  // Allow multiple page arguments
  static strict = false;

  protected operations = {
    exportContent,
    fetchContentLibrary,
  };

  async run(): Promise<ContentExportResult> {
    const {argv, flags} = await this.parse(ContentExport);
    const pageIds = argv as string[];
    const outputPath = flags.output ?? `content-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;

    if (pageIds.length === 0) {
      this.error('At least one content ID is required.');
    }

    const libraryId = flags.library ?? this.resolvedConfig.values.contentLibrary;
    if (!libraryId) {
      this.error('Library is required. Set via --library flag or "content-library" in dw.json.');
    }

    if (!flags['library-file']) {
      this.requireOAuthCredentials();
    }

    const waitOptions = flags.timeout ? {timeout: flags.timeout * 1000} : undefined;

    if (flags['dry-run']) {
      const {library} = await this.operations.fetchContentLibrary(this.instance, libraryId, {
        libraryFile: flags['library-file'],
        isSiteLibrary: flags['site-library'],
        assetQuery: flags['asset-query'],
        keepOrphans: flags['keep-orphans'],
        waitOptions,
      });

      // Build matchers from content IDs
      const matchers: Array<RegExp | string> = flags.regex ? pageIds.map((p) => new RegExp(p)) : pageIds;

      function matchesId(id: string): boolean {
        return matchers.some((m) => (m instanceof RegExp ? m.test(id) : id === m));
      }

      // Filter root children (pages/content) by ID and optionally by folder
      library.filter((node) => {
        if (node.type !== 'PAGE' && node.type !== 'CONTENT') {
          return false;
        }

        if (!matchesId(node.id)) {
          return false;
        }

        if (flags.folder && flags.folder.length > 0) {
          const xmlData = node.xml;
          if (!xmlData) return false;

          const folderLinks = xmlData['folder-links'] as Array<Record<string, unknown>> | undefined;
          const classificationLink = folderLinks?.find(
            (l) => (l['classification-link'] as Array<Record<string, unknown>>)?.[0],
          );
          const linkEl = (
            classificationLink?.['classification-link'] as Array<Record<string, unknown>> | undefined
          )?.[0] as Record<string, unknown> | undefined;
          const folderId = (linkEl?.$ as Record<string, string> | undefined)?.['folder-id'];

          if (!folderId || !flags.folder.includes(folderId)) {
            return false;
          }
        }

        return true;
      });

      // Promote matching components to root level
      const allNodes = [...library.nodes({traverseHidden: true, callbackHidden: true})];
      for (const node of allNodes) {
        if (node.type === 'COMPONENT' && matchesId(node.id)) {
          library.promoteToRoot(node as LibraryNode);
        }
      }

      // Count pages, content, and components
      let pageCount = 0;
      let contentCount = 0;
      let componentCount = 0;
      const assetPaths: string[] = [];

      library.traverse(
        (node) => {
          switch (node.type) {
            case 'COMPONENT': {
              componentCount++;
              break;
            }
            case 'CONTENT': {
              contentCount++;
              break;
            }
            case 'PAGE': {
              pageCount++;
              break;
            }
            case 'STATIC': {
              assetPaths.push(node.id);
              break;
            }
          }
        },
        {traverseHidden: false},
      );

      if (flags['show-tree']) {
        ux.stdout(library.getTreeString({colorize: ux.colorize}));
      }

      this.log(formatSummary('Dry run', pageCount, contentCount, componentCount, assetPaths.length, outputPath));

      return {
        library,
        outputPath,
        downloadedAssets: [],
        failedAssets: [],
        pageCount,
        contentCount,
        componentCount,
      };
    }

    const result = await this.operations.exportContent(this.instance, pageIds, libraryId, outputPath, {
      isSiteLibrary: flags['site-library'],
      assetQuery: flags['asset-query'],
      libraryFile: flags['library-file'],
      offline: flags.offline,
      folders: flags.folder,
      regex: flags.regex,
      keepOrphans: flags['keep-orphans'],
      waitOptions,
      onAssetProgress: (asset, index, total, success) => {
        this.log(`  [${index + 1}/${total}] ${asset} ${success ? '✓' : '✗'}`);
      },
    });

    if (flags['show-tree']) {
      ux.stdout(result.library.getTreeString({colorize: ux.colorize}));
    }

    this.log(
      formatSummary(
        'Exported',
        result.pageCount,
        result.contentCount,
        result.componentCount,
        result.downloadedAssets.length,
        result.outputPath,
      ),
    );

    return result;
  }
}

const pluralS = (n: number) => (n === 1 ? '' : 's');

function formatSummary(
  prefix: string,
  pages: number,
  content: number,
  components: number,
  assets: number,
  outputPath: string,
): string {
  const parts: string[] = [];
  if (pages > 0) parts.push(`${pages} page${pluralS(pages)}`);
  if (content > 0) parts.push(`${content} content asset${pluralS(content)}`);
  if (components > 0) parts.push(`${components} component${pluralS(components)}`);
  if (assets > 0) parts.push(`${assets} static asset${pluralS(assets)}`);
  const suffix = prefix === 'Dry run' ? `would be exported to ${outputPath}` : `to ${outputPath}`;
  return parts.length > 0 ? `${prefix}: ${parts.join(', ')} ${suffix}` : `${prefix}: nothing to export`;
}
