/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../i18n/index.js';

type SandboxOperationModel = OdsComponents['schemas']['SandboxOperationModel'];

/**
 * Command to stop an on-demand sandbox.
 */
export default class OdsStop extends OdsCommand<typeof OdsStop> {
  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID)',
      required: true,
    }),
  };

  static description = t('commands.ods.stop.description', 'Stop an on-demand sandbox');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> abc12345-1234-1234-1234-abc123456789',
    '<%= config.bin %> <%= command.id %> abc12345-1234-1234-1234-abc123456789 --json',
  ];

  async run(): Promise<SandboxOperationModel> {
    const sandboxId = this.args.sandboxId;

    this.log(t('commands.ods.stop.stopping', 'Stopping sandbox {{sandboxId}}...', {sandboxId}));

    const result = await this.odsClient.POST('/sandboxes/{sandboxId}/operations', {
      params: {
        path: {sandboxId},
      },
      body: {
        operation: 'stop',
      },
    });

    if (!result.data?.data) {
      const errorResponse = result.error as OdsComponents['schemas']['ErrorResponse'] | undefined;
      const errorMessage = errorResponse?.error?.message || result.response?.statusText || 'Unknown error';
      this.error(
        t('commands.ods.stop.error', 'Failed to stop sandbox: {{message}}', {
          message: errorMessage,
        }),
      );
    }

    const operation = result.data.data;

    this.log(
      t('commands.ods.stop.success', 'Stop operation {{operationState}}. Sandbox state: {{sandboxState}}', {
        operationState: operation.operationState,
        sandboxState: operation.sandboxState || 'unknown',
      }),
    );

    return operation;
  }
}
