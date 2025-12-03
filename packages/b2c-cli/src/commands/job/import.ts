import {Args, Flags} from '@oclif/core';
import {JobCommand} from '@salesforce/b2c-tooling/cli';
import {
  siteArchiveImport,
  JobExecutionError,
  type SiteArchiveImportResult,
} from '@salesforce/b2c-tooling/operations/jobs';
import {t} from '../../i18n/index.js';

export default class JobImport extends JobCommand<typeof JobImport> {
  static args = {
    target: Args.string({
      description: 'Directory, zip file, or remote filename to import',
      required: true,
    }),
  };

  static description = t(
    'commands.job.import.description',
    'Import a site archive to a B2C Commerce instance using sfcc-site-archive-import job',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> ./my-site-data',
    '<%= config.bin %> <%= command.id %> ./export.zip',
    '<%= config.bin %> <%= command.id %> ./my-site-data --keep-archive',
    '<%= config.bin %> <%= command.id %> existing-archive.zip --remote',
  ];

  static flags = {
    ...JobCommand.baseFlags,
    'keep-archive': Flags.boolean({
      char: 'k',
      description: 'Keep archive on instance after import',
      default: false,
    }),
    remote: Flags.boolean({
      char: 'r',
      description: 'Target is a filename already on the instance (in Impex/src/instance/)',
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

  async run(): Promise<SiteArchiveImportResult> {
    this.requireOAuthCredentials();
    this.requireWebDavCredentials();

    const {target} = this.args;
    const {'keep-archive': keepArchive, remote, timeout, 'show-log': showLog} = this.flags;

    const hostname = this.resolvedConfig.hostname!;

    if (remote) {
      this.log(
        t('commands.job.import.importingRemote', 'Importing {{target}} from {{hostname}}...', {
          target,
          hostname,
        }),
      );
    } else {
      this.log(
        t('commands.job.import.importing', 'Importing {{target}} to {{hostname}}...', {
          target,
          hostname,
        }),
      );
    }

    try {
      const importTarget = remote ? {remoteFilename: target} : target;

      const result = await siteArchiveImport(this.instance, importTarget, {
        keepArchive,
        waitOptions: {
          timeout: timeout ? timeout * 1000 : undefined,
          onProgress: (exec, elapsed) => {
            if (!this.jsonEnabled()) {
              const elapsedSec = Math.floor(elapsed / 1000);
              this.log(
                t('commands.job.import.progress', '  Status: {{status}} ({{elapsed}}s elapsed)', {
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
        t('commands.job.import.completed', 'Import completed: {{status}} (duration: {{duration}}s)', {
          status: result.execution.exit_status?.code || result.execution.execution_status,
          duration: durationSec,
        }),
      );

      if (result.archiveKept) {
        this.log(
          t('commands.job.import.archiveKept', 'Archive kept at: Impex/src/instance/{{filename}}', {
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
          t('commands.job.import.failed', 'Import failed: {{status}}', {
            status: error.execution.exit_status?.code || 'ERROR',
          }),
        );
      }
      if (error instanceof Error) {
        this.error(
          t('commands.job.import.error', 'Import error: {{message}}', {
            message: error.message,
          }),
        );
      }
      throw error;
    }
  }
}
