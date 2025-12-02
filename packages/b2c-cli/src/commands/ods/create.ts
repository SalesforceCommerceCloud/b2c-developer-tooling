import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {OdsCommand} from '@salesforce/b2c-tooling/cli';
import type {OdsComponents} from '@salesforce/b2c-tooling';
import {t} from '../../i18n/index.js';

type SandboxModel = OdsComponents['schemas']['SandboxModel'];
type SandboxResourceProfile = OdsComponents['schemas']['SandboxResourceProfile'];

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
  };

  async run(): Promise<SandboxModel> {
    const realm = this.flags.realm;
    const profile = this.flags.profile as SandboxResourceProfile;
    const ttl = this.flags.ttl;
    const autoScheduled = this.flags['auto-scheduled'];

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

    const sandbox = result.data.data;

    this.log('');
    this.log(t('commands.ods.create.success', 'Sandbox created successfully!'));

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
}
