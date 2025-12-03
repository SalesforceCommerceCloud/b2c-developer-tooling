import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {OdsCommand} from '@salesforce/b2c-tooling/cli';
import type {OdsComponents} from '@salesforce/b2c-tooling';
import {t} from '../../i18n/index.js';

type SandboxModel = OdsComponents['schemas']['SandboxModel'];
type SandboxResourceProfile = OdsComponents['schemas']['SandboxResourceProfile'];
type SandboxState = OdsComponents['schemas']['SandboxState'];

/** States that indicate sandbox creation has completed (success or failure) */
const TERMINAL_STATES = new Set<SandboxState>(['deleted', 'failed', 'started']);

/**
 * Command to create a new on-demand sandbox.
 */
export default class OdsCreate extends OdsCommand<typeof OdsCreate> {
  static description = t('commands.ods.create.description', 'Create a new on-demand sandbox');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --realm abcd',
    '<%= config.bin %> <%= command.id %> --realm abcd --ttl 48',
    '<%= config.bin %> <%= command.id %> --realm abcd --profile large',
    '<%= config.bin %> <%= command.id %> --realm abcd --auto-scheduled',
    '<%= config.bin %> <%= command.id %> --realm abcd --wait',
    '<%= config.bin %> <%= command.id %> --realm abcd --wait --poll-interval 15',
    '<%= config.bin %> <%= command.id %> --realm abcd --json',
  ];

  static flags = {
    realm: Flags.string({
      char: 'r',
      description: 'Realm ID (four-letter ID)',
      required: true,
    }),
    ttl: Flags.integer({
      description: 'Time to live in hours (0 for infinite)',
      default: 24,
    }),
    profile: Flags.string({
      description: 'Resource profile (medium, large, xlarge, xxlarge)',
      default: 'medium',
      options: ['medium', 'large', 'xlarge', 'xxlarge'],
    }),
    'auto-scheduled': Flags.boolean({
      description: 'Enable automatic start/stop scheduling',
      default: false,
    }),
    wait: Flags.boolean({
      char: 'w',
      description: 'Wait for the sandbox to reach started or failed state before returning',
      default: false,
    }),
    'poll-interval': Flags.integer({
      description: 'Polling interval in seconds when using --wait',
      default: 10,
      dependsOn: ['wait'],
    }),
    timeout: Flags.integer({
      description: 'Maximum time to wait in seconds when using --wait (0 for no timeout)',
      default: 600,
      dependsOn: ['wait'],
    }),
  };

  async run(): Promise<SandboxModel> {
    const realm = this.flags.realm;
    const profile = this.flags.profile as SandboxResourceProfile;
    const ttl = this.flags.ttl;
    const autoScheduled = this.flags['auto-scheduled'];
    const wait = this.flags.wait;
    const pollInterval = this.flags['poll-interval'];
    const timeout = this.flags.timeout;

    this.log(t('commands.ods.create.creating', 'Creating sandbox in realm {{realm}}...', {realm}));
    this.log(t('commands.ods.create.profile', 'Profile: {{profile}}', {profile}));
    this.log(t('commands.ods.create.ttl', 'TTL: {{ttl}} hours', {ttl: ttl === 0 ? 'infinite' : String(ttl)}));

    const result = await this.odsClient.POST('/sandboxes', {
      body: {
        realm,
        ttl,
        resourceProfile: profile,
        autoScheduled,
        analyticsEnabled: false,
      },
    });

    if (!result.data?.data) {
      const errorResponse = result.error as OdsComponents['schemas']['ErrorResponse'] | undefined;
      const errorMessage = errorResponse?.error?.message || result.response?.statusText || 'Unknown error';
      this.error(
        t('commands.ods.create.error', 'Failed to create sandbox: {{message}}', {
          message: errorMessage,
        }),
      );
    }

    let sandbox = result.data.data;

    this.log('');
    this.log(t('commands.ods.create.success', 'Sandbox created successfully!'));

    if (wait && sandbox.id) {
      this.log('');
      sandbox = await this.waitForSandbox(sandbox.id, pollInterval, timeout);
    }

    if (this.jsonEnabled()) {
      return sandbox;
    }

    this.printSandboxSummary(sandbox);

    return sandbox;
  }

  private printSandboxSummary(sandbox: SandboxModel): void {
    const ui = cliui({width: process.stdout.columns || 80});

    ui.div({text: '', padding: [0, 0, 0, 0]});

    const fields: [string, string | undefined][] = [
      ['ID', sandbox.id],
      ['Realm', sandbox.realm],
      ['Instance', sandbox.instance],
      ['State', sandbox.state],
      ['Profile', sandbox.resourceProfile],
      ['Hostname', sandbox.hostName],
    ];

    for (const [label, value] of fields) {
      if (value !== undefined) {
        ui.div({text: `${label}:`, width: 15, padding: [0, 2, 0, 0]}, {text: value, padding: [0, 0, 0, 0]});
      }
    }

    if (sandbox.links?.bm) {
      ui.div({text: '', padding: [0, 0, 0, 0]});
      ui.div({text: 'BM URL:', width: 15, padding: [0, 2, 0, 0]}, {text: sandbox.links.bm, padding: [0, 0, 0, 0]});
    }

    ux.stdout(ui.toString());
  }

  /**
   * Sleep for a given number of milliseconds.
   */
  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Polls for sandbox status until it reaches a terminal state.
   * @param sandboxId - The sandbox ID to poll
   * @param pollIntervalSeconds - Interval between polls in seconds
   * @param timeoutSeconds - Maximum time to wait (0 for no timeout)
   * @returns The final sandbox state
   */
  private async waitForSandbox(
    sandboxId: string,
    pollIntervalSeconds: number,
    timeoutSeconds: number,
  ): Promise<SandboxModel> {
    const startTime = Date.now();
    const pollIntervalMs = pollIntervalSeconds * 1000;
    const timeoutMs = timeoutSeconds * 1000;
    let lastState: SandboxState | undefined;

    this.log(t('commands.ods.create.waiting', 'Waiting for sandbox to be ready...'));

    while (true) {
      // Check for timeout
      if (timeoutSeconds > 0 && Date.now() - startTime > timeoutMs) {
        this.error(
          t('commands.ods.create.timeout', 'Timeout waiting for sandbox after {{seconds}} seconds', {
            seconds: String(timeoutSeconds),
          }),
        );
      }

      // eslint-disable-next-line no-await-in-loop
      const result = await this.odsClient.GET('/sandboxes/{sandboxId}', {
        params: {
          path: {sandboxId},
        },
      });

      if (!result.data?.data) {
        this.error(
          t('commands.ods.create.pollError', 'Failed to fetch sandbox status: {{message}}', {
            message: result.response?.statusText || 'Unknown error',
          }),
        );
      }

      const sandbox = result.data.data;
      const currentState = sandbox.state as SandboxState;

      // Log state changes
      if (currentState !== lastState) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        this.log(
          t('commands.ods.create.stateChange', '[{{elapsed}}s] State: {{state}}', {
            elapsed: String(elapsed),
            state: currentState || 'unknown',
          }),
        );
        lastState = currentState;
      }

      // Check for terminal states
      if (currentState && TERMINAL_STATES.has(currentState)) {
        switch (currentState) {
          case 'deleted': {
            this.error(t('commands.ods.create.deleted', 'Sandbox was deleted'));
            break;
          }
          case 'failed': {
            this.error(t('commands.ods.create.failed', 'Sandbox creation failed'));
            break;
          }
          case 'started': {
            this.log('');
            this.log(t('commands.ods.create.ready', 'Sandbox is now ready!'));
            break;
          }
        }
        return sandbox;
      }

      // Wait before next poll
      // eslint-disable-next-line no-await-in-loop
      await this.sleep(pollIntervalMs);
    }
  }
}
