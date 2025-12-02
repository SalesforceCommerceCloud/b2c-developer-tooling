import * as readline from 'node:readline';
import {Args, Flags} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling/cli';
import type {OdsComponents} from '@salesforce/b2c-tooling';
import {t} from '../../i18n/index.js';

/**
 * Simple confirmation prompt.
 */
async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  return new Promise((resolve) => {
    rl.question(`${message} `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Command to delete an on-demand sandbox.
 */
export default class OdsDelete extends OdsCommand<typeof OdsDelete> {
  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID)',
      required: true,
    }),
  };

  static description = t('commands.ods.delete.description', 'Delete an on-demand sandbox');

  static examples = [
    '<%= config.bin %> <%= command.id %> abc12345-1234-1234-1234-abc123456789',
    '<%= config.bin %> <%= command.id %> abc12345-1234-1234-1234-abc123456789 --force',
  ];

  static flags = {
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const sandboxId = this.args.sandboxId;

    // Get sandbox details first to show in confirmation
    const getResult = await this.odsClient.GET('/sandboxes/{sandboxId}', {
      params: {
        path: {sandboxId},
      },
    });

    if (!getResult.data?.data) {
      this.error(t('commands.ods.delete.notFound', 'Sandbox not found: {{sandboxId}}', {sandboxId}));
    }

    const sandbox = getResult.data.data;
    const sandboxInfo = `${sandbox.realm}/${sandbox.instance || sandboxId}`;

    // Confirm deletion unless --force is used
    if (!this.flags.force) {
      const confirmed = await confirm(
        t('commands.ods.delete.confirm', 'Are you sure you want to delete sandbox "{{sandboxInfo}}"? (y/n)', {
          sandboxInfo,
        }),
      );

      if (!confirmed) {
        this.log(t('commands.ods.delete.cancelled', 'Deletion cancelled'));
        return;
      }
    }

    this.log(t('commands.ods.delete.deleting', 'Deleting sandbox {{sandboxInfo}}...', {sandboxInfo}));

    const result = await this.odsClient.DELETE('/sandboxes/{sandboxId}', {
      params: {
        path: {sandboxId},
      },
    });

    if (result.response.status !== 202) {
      const errorResponse = result.error as OdsComponents['schemas']['ErrorResponse'] | undefined;
      const errorMessage = errorResponse?.error?.message || result.response?.statusText || 'Unknown error';
      this.error(
        t('commands.ods.delete.error', 'Failed to delete sandbox: {{message}}', {
          message: errorMessage,
        }),
      );
    }

    this.log(t('commands.ods.delete.success', 'Sandbox deletion initiated. The sandbox will be removed shortly.'));
  }
}
