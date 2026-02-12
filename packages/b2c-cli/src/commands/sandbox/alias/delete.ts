/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';
import {confirm} from '@inquirer/prompts';

/**
 * Command to delete a sandbox alias.
 */
export default class SandboxAliasDelete extends OdsCommand<typeof SandboxAliasDelete> {
  static aliases = ['ods:alias:delete'];

  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID or realm-instance, e.g., abcd-123)',
      required: true,
    }),
    aliasId: Args.string({
      description: 'Alias ID to delete',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.sandbox.alias.delete.description', 'Delete a hostname alias from a sandbox'),
    '/cli/sandbox.html#b2c-sandbox-alias-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> zzzv-123 alias-uuid-here',
    '<%= config.bin %> <%= command.id %> zzzv-123 alias-uuid-here --force',
    '<%= config.bin %> <%= command.id %> abc12345-1234-1234-1234-abc123456789 alias-uuid-here --json',
  ];

  static flags = {
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  async run(): Promise<{success: boolean; message: string}> {
    const {sandboxId, aliasId} = this.args;
    const {force} = this.flags;

    const resolvedSandboxId = await this.resolveSandboxId(sandboxId);

    // Confirmation prompt (skip if --force or --json)
    if (!force && !this.jsonEnabled()) {
      const confirmed = await confirm({
        message: t('commands.sandbox.alias.delete.confirm', 'Delete alias {{aliasId}}?', {aliasId}),
        default: false,
      });

      if (!confirmed) {
        this.log(t('commands.sandbox.alias.delete.cancelled', 'Delete cancelled'));
        return {success: false, message: 'Cancelled by user'};
      }
    }

    this.log(
      t('commands.sandbox.alias.delete.deleting', 'Deleting alias {{aliasId}} from sandbox {{sandboxId}}...', {
        aliasId,
        sandboxId,
      }),
    );

    const result = await this.odsClient.DELETE('/sandboxes/{sandboxId}/aliases/{sandboxAliasId}', {
      params: {
        path: {sandboxId: resolvedSandboxId, sandboxAliasId: aliasId},
      },
    });

    if (result.response?.status !== 404 && result.error) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(
        t('commands.sandbox.alias.delete.error', 'Failed to delete alias: {{message}}', {
          message,
        }),
      );
    }

    const message = t('commands.sandbox.alias.delete.success', 'Alias deleted successfully');
    this.log(message);

    return {success: true, message};
  }
}
