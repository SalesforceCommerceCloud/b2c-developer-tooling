/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, ux} from '@oclif/core';
import cliui from 'cliui';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, type OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

type SandboxOperationModel = OdsComponents['schemas']['SandboxOperationModel'];

/**
 * Show details for a single sandbox operation (ODS API GET /sandboxes/{id}/operations/{operationId}).
 */
export default class SandboxOperationsGet extends OdsCommand<typeof SandboxOperationsGet> {
  static aliases = ['ods:operations:get'];

  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID or realm-instance, e.g., zzzz-001)',
      required: true,
    }),
    operationId: Args.string({
      description: 'Operation UUID returned when the operation was started',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.sandbox.operations.get.description', 'Show details for a specific sandbox operation by ID'),
    '/cli/sandbox.html#b2c-sandbox-operations-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> zzzz-001 550e8400-e29b-41d4-a716-446655440000',
    '<%= config.bin %> <%= command.id %> zzzz-001 550e8400-e29b-41d4-a716-446655440000 --json',
  ];

  async run(): Promise<SandboxOperationModel | undefined> {
    const sandboxId = await this.resolveSandboxId(this.args.sandboxId);
    const {operationId} = this.args;

    this.log(
      t('commands.sandbox.operations.get.fetching', 'Fetching operation {{operationId}} for sandbox {{sandboxId}}...', {
        operationId,
        sandboxId: this.args.sandboxId,
      }),
    );

    const result = await this.odsClient.GET('/sandboxes/{sandboxId}/operations/{operationId}', {
      params: {
        path: {sandboxId, operationId},
      },
    });

    if (result.error) {
      this.error(
        t('commands.sandbox.operations.get.error', 'Failed to fetch sandbox operation: {{message}}', {
          message: getApiErrorMessage(result.error, result.response),
        }),
      );
    }

    const payload = result.data;
    const op = payload?.data;
    if (!op) {
      this.log(t('commands.sandbox.operations.get.noData', 'No operation details were returned.'));
      return undefined;
    }

    if (this.jsonEnabled()) {
      return op;
    }

    this.printOperation(op);
    return op;
  }

  private printOperation(op: SandboxOperationModel): void {
    const ui = cliui({width: process.stdout.columns || 80});
    ui.div({text: 'Operation Details', padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    const fields: [string, string | undefined][] = [
      ['Operation ID', op.id],
      ['Type', op.operation],
      ['Op state', op.operationState],
      ['Outcome', op.status],
      ['Sandbox state', op.sandboxState],
      ['Created', op.createdAt ? new Date(op.createdAt).toLocaleString() : undefined],
      ['By', op.operationBy],
    ];
    const labelWidth = 20;
    for (const [label, value] of fields) {
      if (value !== undefined) {
        ui.div({text: `${label}:`, width: labelWidth, padding: [0, 2, 0, 0]}, {text: value, padding: [0, 0, 0, 0]});
      }
    }
    ux.stdout(ui.toString());
  }
}
