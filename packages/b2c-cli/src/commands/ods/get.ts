import {Args, ux} from '@oclif/core';
import cliui from 'cliui';
import {OdsCommand} from '@salesforce/b2c-tooling/cli';
import type {OdsComponents} from '@salesforce/b2c-tooling';
import {t} from '../../i18n/index.js';

type SandboxModel = OdsComponents['schemas']['SandboxModel'];

/**
 * Command to get details of a specific sandbox.
 */
export default class OdsGet extends OdsCommand<typeof OdsGet> {
  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID)',
      required: true,
    }),
  };

  static description = t('commands.ods.get.description', 'Get details of a specific sandbox');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> abc12345-1234-1234-1234-abc123456789',
    '<%= config.bin %> <%= command.id %> abc12345-1234-1234-1234-abc123456789 --json',
  ];

  async run(): Promise<SandboxModel> {
    const sandboxId = this.args.sandboxId;

    this.log(t('commands.ods.get.fetching', 'Fetching sandbox {{sandboxId}}...', {sandboxId}));

    const result = await this.odsClient.GET('/sandboxes/{sandboxId}', {
      params: {
        path: {sandboxId},
      },
    });

    if (!result.data?.data) {
      this.error(
        t('commands.ods.get.error', 'Failed to fetch sandbox: {{message}}', {
          message: result.response?.statusText || 'Sandbox not found',
        }),
      );
    }

    const sandbox = result.data.data;

    if (this.jsonEnabled()) {
      return sandbox;
    }

    this.printSandboxDetails(sandbox);

    return sandbox;
  }

  private printSandboxDetails(sandbox: SandboxModel): void {
    const ui = cliui({width: process.stdout.columns || 80});

    ui.div({text: 'Sandbox Details', padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    const fields: [string, string | undefined][] = [
      ['ID', sandbox.id],
      ['Realm', sandbox.realm],
      ['Instance', sandbox.instance],
      ['State', sandbox.state],
      ['Resource Profile', sandbox.resourceProfile],
      ['Enabled', sandbox.enabled?.toString()],
      ['Auto Scheduled', sandbox.autoScheduled?.toString()],
      ['Hostname', sandbox.hostName],
      ['Created At', sandbox.createdAt ? new Date(sandbox.createdAt).toLocaleString() : undefined],
      ['Created By', sandbox.createdBy],
      ['EOL', sandbox.eol ? new Date(sandbox.eol).toLocaleString() : undefined],
      ['App Version', sandbox.versions?.app],
      ['Web Version', sandbox.versions?.web],
    ];

    for (const [label, value] of fields) {
      if (value !== undefined) {
        ui.div({text: `${label}:`, width: 20, padding: [0, 2, 0, 0]}, {text: value, padding: [0, 0, 0, 0]});
      }
    }

    // Tags
    if (sandbox.tags && sandbox.tags.length > 0) {
      ui.div({text: 'Tags:', width: 20, padding: [0, 2, 0, 0]}, {text: sandbox.tags.join(', '), padding: [0, 0, 0, 0]});
    }

    // Emails
    if (sandbox.emails && sandbox.emails.length > 0) {
      ui.div(
        {text: 'Emails:', width: 20, padding: [0, 2, 0, 0]},
        {text: sandbox.emails.join(', '), padding: [0, 0, 0, 0]},
      );
    }

    // Links
    if (sandbox.links) {
      ui.div({text: '', padding: [0, 0, 0, 0]});
      ui.div({text: 'Links', padding: [1, 0, 0, 0]});
      ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

      const links: [string, string | undefined][] = [
        ['Business Manager', sandbox.links.bm],
        ['OCAPI', sandbox.links.ocapi],
        ['Impex', sandbox.links.impex],
        ['Code', sandbox.links.code],
        ['Logs', sandbox.links.logs],
      ];

      for (const [label, value] of links) {
        if (value) {
          ui.div({text: `${label}:`, width: 20, padding: [0, 2, 0, 0]}, {text: value, padding: [0, 0, 0, 0]});
        }
      }
    }

    ux.stdout(ui.toString());
  }
}
