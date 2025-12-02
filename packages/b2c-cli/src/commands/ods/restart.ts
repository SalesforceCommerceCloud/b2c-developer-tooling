import {Args} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling/cli';
import type {OdsComponents} from '@salesforce/b2c-tooling';
import {t} from '../../i18n/index.js';

type SandboxOperationModel = OdsComponents['schemas']['SandboxOperationModel'];

/**
 * Command to restart an on-demand sandbox.
 */
export default class OdsRestart extends OdsCommand<typeof OdsRestart> {
  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID)',
      required: true,
    }),
  };

  static description = t('commands.ods.restart.description', 'Restart an on-demand sandbox');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> abc12345-1234-1234-1234-abc123456789',
    '<%= config.bin %> <%= command.id %> abc12345-1234-1234-1234-abc123456789 --json',
  ];

  async run(): Promise<SandboxOperationModel> {
    const sandboxId = this.args.sandboxId;

    this.log(t('commands.ods.restart.restarting', 'Restarting sandbox {{sandboxId}}...', {sandboxId}));

    const result = await this.odsClient.POST('/sandboxes/{sandboxId}/operations', {
      params: {
        path: {sandboxId},
      },
      body: {
        operation: 'restart',
      },
    });

    if (!result.data?.data) {
      const errorResponse = result.error as OdsComponents['schemas']['ErrorResponse'] | undefined;
      const errorMessage = errorResponse?.error?.message || result.response?.statusText || 'Unknown error';
      this.error(
        t('commands.ods.restart.error', 'Failed to restart sandbox: {{message}}', {
          message: errorMessage,
        }),
      );
    }

    const operation = result.data.data;

    this.log(
      t('commands.ods.restart.success', 'Restart operation {{operationState}}. Sandbox state: {{sandboxState}}', {
        operationState: operation.operationState,
        sandboxState: operation.sandboxState || 'unknown',
      }),
    );

    return operation;
  }
}
