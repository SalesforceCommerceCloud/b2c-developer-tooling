import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {InstanceCommand} from '@salesforce/b2c-tooling/cli';
import {
  searchJobExecutions,
  type JobExecutionSearchResult,
  type JobExecution,
} from '@salesforce/b2c-tooling/operations/jobs';
import {t} from '../../i18n/index.js';

export default class JobSearch extends InstanceCommand<typeof JobSearch> {
  static description = t('commands.job.search.description', 'Search for job executions on a B2C Commerce instance');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --job-id my-custom-job',
    '<%= config.bin %> <%= command.id %> --status RUNNING,PENDING',
    '<%= config.bin %> <%= command.id %> --count 50',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...InstanceCommand.baseFlags,
    'job-id': Flags.string({
      char: 'j',
      description: 'Filter by job ID',
    }),
    status: Flags.string({
      description: 'Filter by status (comma-separated: RUNNING,PENDING,OK,ERROR)',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    count: Flags.integer({
      char: 'n',
      description: 'Maximum number of results',
      default: 25,
    }),
    start: Flags.integer({
      description: 'Starting index for pagination',
      default: 0,
    }),
    'sort-by': Flags.string({
      description: 'Sort by field',
      options: ['start_time', 'end_time', 'job_id', 'status'],
      default: 'start_time',
    }),
    'sort-order': Flags.string({
      description: 'Sort order',
      options: ['asc', 'desc'],
      default: 'desc',
    }),
  };

  async run(): Promise<JobExecutionSearchResult> {
    this.requireOAuthCredentials();

    const {'job-id': jobId, status, count, start, 'sort-by': sortBy, 'sort-order': sortOrder} = this.flags;

    this.log(
      t('commands.job.search.searching', 'Searching job executions on {{hostname}}...', {
        hostname: this.resolvedConfig.hostname!,
      }),
    );

    const results = await searchJobExecutions(this.instance, {
      jobId,
      status,
      count,
      start,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    // JSON output handled by oclif
    if (this.jsonEnabled()) {
      return results;
    }

    // Human-readable output
    if (results.total === 0) {
      ux.stdout(t('commands.job.search.noResults', 'No job executions found.'));
      return results;
    }

    this.log(
      t('commands.job.search.found', 'Found {{total}} job execution(s) (showing {{count}})', {
        total: results.total,
        count: results.hits.length,
      }),
    );

    this.printExecutionsTable(results.hits);

    return results;
  }

  private printExecutionsTable(executions: JobExecution[]): void {
    const ui = cliui({width: process.stdout.columns || 120});

    // Header
    ui.div(
      {text: 'Execution ID', width: 38, padding: [0, 1, 0, 0]},
      {text: 'Job ID', width: 30, padding: [0, 1, 0, 0]},
      {text: 'Status', width: 12, padding: [0, 1, 0, 0]},
      {text: 'Start Time', width: 20, padding: [0, 0, 0, 0]},
    );

    // Separator
    ui.div({text: '─'.repeat(100), padding: [0, 0, 0, 0]});

    // Rows
    for (const exec of executions) {
      const status = exec.exitStatus || exec.executionStatus;
      const startTime = exec.startTime ? exec.startTime.toISOString().replace('T', ' ').slice(0, 19) : 'N/A';

      ui.div(
        {text: exec.id, width: 38, padding: [0, 1, 0, 0]},
        {text: exec.jobId, width: 30, padding: [0, 1, 0, 0]},
        {text: status, width: 12, padding: [0, 1, 0, 0]},
        {text: startTime, width: 20, padding: [0, 0, 0, 0]},
      );
    }

    ux.stdout(ui.toString());
  }
}
