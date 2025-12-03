import {Flags} from '@oclif/core';
import {JobCommand} from '@salesforce/b2c-tooling/cli';
import {
  siteArchiveExportToPath,
  JobExecutionError,
  type SiteArchiveExportResult,
  type ExportDataUnitsConfiguration,
} from '@salesforce/b2c-tooling/operations/jobs';
import {t} from '../../i18n/index.js';

export default class JobExport extends JobCommand<typeof JobExport> {
  static description = t('commands.job.export.description', 'Job execution and site archive import/export (IMPEX)');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --global-data meta_data',
    '<%= config.bin %> <%= command.id %> --site RefArch --site-data content,site_preferences',
    '<%= config.bin %> <%= command.id %> --catalog storefront-catalog',
    '<%= config.bin %> <%= command.id %> --data-units \'{"global_data":{"meta_data":true}}\'',
    '<%= config.bin %> <%= command.id %> --output ./exports --no-download',
  ];

  static flags = {
    ...JobCommand.baseFlags,
    output: Flags.string({
      char: 'o',
      description: 'Output path (directory or .zip file)',
      default: './export',
    }),
    site: Flags.string({
      description: 'Site IDs to export (comma-separated)',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    'site-data': Flags.string({
      description: 'Site data units to export (comma-separated: content,site_preferences,etc.)',
    }),
    catalog: Flags.string({
      description: 'Catalog IDs to export (comma-separated)',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    library: Flags.string({
      description: 'Library IDs to export (comma-separated)',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    'inventory-list': Flags.string({
      description: 'Inventory list IDs to export (comma-separated)',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    'price-book': Flags.string({
      description: 'Price book IDs to export (comma-separated)',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    'global-data': Flags.string({
      description: 'Global data units to export (comma-separated: meta_data,custom_types,etc.)',
    }),
    'data-units': Flags.string({
      char: 'd',
      description: 'Full data units configuration as JSON string',
    }),
    'keep-archive': Flags.boolean({
      char: 'k',
      description: 'Keep archive on instance after download',
      default: false,
    }),
    'no-download': Flags.boolean({
      description: 'Do not download the archive (leave on instance)',
      default: false,
    }),
    'zip-only': Flags.boolean({
      description: 'Save as zip file without extracting',
      default: false,
    }),
    timeout: Flags.integer({
      char: 't',
      description: 'Timeout in seconds (default: no timeout)',
    }),
    'show-log': Flags.boolean({
      description: 'Show job log on failure',
      default: true,
    }),
  };

  async run(): Promise<SiteArchiveExportResult & {localPath?: string}> {
    this.requireOAuthCredentials();
    this.requireWebDavCredentials();

    const {
      output,
      site,
      'site-data': siteData,
      catalog,
      library,
      'inventory-list': inventoryList,
      'price-book': priceBook,
      'global-data': globalData,
      'data-units': dataUnitsJson,
      'keep-archive': keepArchive,
      'no-download': noDownload,
      'zip-only': zipOnly,
      timeout,
      'show-log': showLog,
    } = this.flags;

    const hostname = this.resolvedConfig.hostname!;

    // Build data units configuration
    const dataUnits = this.buildDataUnits({
      dataUnitsJson,
      site,
      siteData,
      catalog,
      library,
      inventoryList,
      priceBook,
      globalData,
    });

    if (Object.keys(dataUnits).length === 0) {
      this.error(
        t(
          'commands.job.export.noDataUnits',
          'No data units specified. Use --global-data, --site, --catalog, etc. or --data-units',
        ),
      );
    }

    this.log(
      t('commands.job.export.exporting', 'Exporting data from {{hostname}}...', {
        hostname,
      }),
    );

    this.log(t('commands.job.export.dataUnits', 'Data units: {{dataUnits}}', {dataUnits: JSON.stringify(dataUnits)}));

    try {
      const result = await siteArchiveExportToPath(this.instance, dataUnits, output, {
        keepArchive: keepArchive || noDownload,
        extractZip: !zipOnly,
        waitOptions: {
          timeout: timeout ? timeout * 1000 : undefined,
          onProgress: (exec, elapsed) => {
            if (!this.jsonEnabled()) {
              const elapsedSec = Math.floor(elapsed / 1000);
              this.log(
                t('commands.job.export.progress', '  Status: {{status}} ({{elapsed}}s elapsed)', {
                  status: exec.execution_status,
                  elapsed: elapsedSec.toString(),
                }),
              );
            }
          },
        },
      });

      const durationSec = result.execution.duration ? (result.execution.duration / 1000).toFixed(1) : 'N/A';
      this.log(
        t('commands.job.export.completed', 'Export completed: {{status}} (duration: {{duration}}s)', {
          status: result.execution.exit_status?.code || result.execution.execution_status,
          duration: durationSec,
        }),
      );

      if (result.localPath) {
        this.log(
          t('commands.job.export.savedTo', 'Saved to: {{path}}', {
            path: result.localPath,
          }),
        );
      }

      if (result.archiveKept) {
        this.log(
          t('commands.job.export.archiveKept', 'Archive kept at: Impex/src/instance/{{filename}}', {
            filename: result.archiveFilename,
          }),
        );
      }

      return result;
    } catch (error) {
      if (error instanceof JobExecutionError) {
        if (showLog) {
          await this.showJobLog(error.execution);
        }
        this.error(
          t('commands.job.export.failed', 'Export failed: {{status}}', {
            status: error.execution.exit_status?.code || 'ERROR',
          }),
        );
      }
      if (error instanceof Error) {
        this.error(
          t('commands.job.export.error', 'Export error: {{message}}', {
            message: error.message,
          }),
        );
      }
      throw error;
    }
  }

  private buildDataUnits(params: {
    dataUnitsJson?: string;
    site?: string[];
    siteData?: string;
    catalog?: string[];
    library?: string[];
    inventoryList?: string[];
    priceBook?: string[];
    globalData?: string;
  }): Partial<ExportDataUnitsConfiguration> {
    // If JSON is provided, use it directly
    if (params.dataUnitsJson) {
      try {
        return JSON.parse(params.dataUnitsJson) as Partial<ExportDataUnitsConfiguration>;
      } catch {
        this.error(
          t('commands.job.export.invalidJson', 'Invalid JSON for --data-units: {{json}}', {
            json: params.dataUnitsJson,
          }),
        );
      }
    }

    const dataUnits: Partial<ExportDataUnitsConfiguration> = {};

    // Sites
    if (params.site && params.site.length > 0) {
      dataUnits.sites = {};
      const siteDataUnits = this.parseSiteDataUnits(params.siteData);

      for (const siteId of params.site) {
        dataUnits.sites[siteId] = siteDataUnits || {all: true};
      }
    }

    // Catalogs
    if (params.catalog && params.catalog.length > 0) {
      dataUnits.catalogs = {};
      for (const catalogId of params.catalog) {
        dataUnits.catalogs[catalogId] = true;
      }
    }

    // Libraries
    if (params.library && params.library.length > 0) {
      dataUnits.libraries = {};
      for (const libraryId of params.library) {
        dataUnits.libraries[libraryId] = true;
      }
    }

    // Inventory lists (API uses snake_case keys)
    if (params.inventoryList && params.inventoryList.length > 0) {
      // eslint-disable-next-line camelcase
      dataUnits.inventory_lists = {};
      for (const listId of params.inventoryList) {
        dataUnits.inventory_lists[listId] = true;
      }
    }

    // Price books (API uses snake_case keys)
    if (params.priceBook && params.priceBook.length > 0) {
      // eslint-disable-next-line camelcase
      dataUnits.price_books = {};
      for (const bookId of params.priceBook) {
        dataUnits.price_books[bookId] = true;
      }
    }

    // Global data (API uses snake_case keys)
    if (params.globalData) {
      // eslint-disable-next-line camelcase
      dataUnits.global_data = this.parseGlobalDataUnits(params.globalData);
    }

    return dataUnits;
  }

  private parseGlobalDataUnits(globalData: string): Record<string, boolean> {
    const units = globalData.split(',').map((s) => s.trim());
    const result: Record<string, boolean> = {};

    for (const unit of units) {
      result[unit] = true;
    }

    return result;
  }

  private parseSiteDataUnits(siteData?: string): Record<string, boolean> | undefined {
    if (!siteData) return undefined;

    const units = siteData.split(',').map((s) => s.trim());
    const result: Record<string, boolean> = {};

    for (const unit of units) {
      result[unit] = true;
    }

    return result;
  }
}
