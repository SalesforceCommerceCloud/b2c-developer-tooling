import {Flags, ux} from '@oclif/core';
import {InstanceCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  searchJobExecutions,
  type JobExecutionSearchResult,
  type JobExecution,
} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import {t} from '../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<JobExecution>> = {
  id: {
    header: 'Execution ID',
    get: (e) => e.id ?? '-',
  },
  jobId: {
    header: 'Job ID',
    get: (e) => e.job_id ?? '-',
  },
  status: {
    header: 'Status',
    get: (e) => e.exit_status?.code || e.execution_status || '-',
  },
  startTime: {
    header: 'Start Time',
    get: (e) => (e.start_time ? new Date(e.start_time).toISOString().replace('T', ' ').slice(0, 19) : '-'),
  },
};

const DEFAULT_COLUMNS = ['id', 'jobId', 'status', 'startTime'];

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

    createTable(COLUMNS).render(results.hits, DEFAULT_COLUMNS);

    return results;
  }
}
