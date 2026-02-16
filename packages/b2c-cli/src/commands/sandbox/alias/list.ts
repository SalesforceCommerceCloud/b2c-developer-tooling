/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {OdsCommand, TableRenderer} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, type OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

type SandboxAliasModel = OdsComponents['schemas']['SandboxAliasModel'];

/**
 * Command to list sandbox aliases.
 */
export default class SandboxAliasList extends OdsCommand<typeof SandboxAliasList> {
  static aliases = ['ods:alias:list'];

  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID or realm-instance, e.g., abcd-123)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.sandbox.alias.list.description', 'List all hostname aliases for a sandbox'),
    '/cli/sandbox.html#b2c-sandbox-alias-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> abc12345-1234-1234-1234-abc123456789',
    '<%= config.bin %> <%= command.id %> zzzv-123',
    '<%= config.bin %> <%= command.id %> zzzv-123 --alias-id some-alias-uuid',
    '<%= config.bin %> <%= command.id %> zzzv-123 --json',
  ];

  static flags = {
    'alias-id': Flags.string({
      description: 'Specific alias ID to retrieve (if omitted, lists all aliases)',
      required: false,
    }),
  };

  async run(): Promise<SandboxAliasModel | SandboxAliasModel[]> {
    const {sandboxId} = this.args;
    const {'alias-id': aliasId} = this.flags;

    const resolvedSandboxId = await this.resolveSandboxId(sandboxId);

    // If alias ID provided, get specific alias; otherwise list all
    if (aliasId) {
      return this.showAlias(resolvedSandboxId, aliasId);
    }
    return this.listAllAliases(resolvedSandboxId);
  }

  private async listAllAliases(sandboxId: string): Promise<SandboxAliasModel[]> {
    this.log(
      t('commands.sandbox.alias.list.fetching', 'Fetching aliases for sandbox {{sandboxId}}...', {
        sandboxId: this.args.sandboxId,
      }),
    );

    const result = await this.odsClient.GET('/sandboxes/{sandboxId}/aliases', {
      params: {
        path: {sandboxId},
      },
    });

    if (!result.data?.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(
        t('commands.sandbox.alias.list.error', 'Failed to fetch aliases: {{message}}', {
          message,
        }),
      );
    }

    const aliases = (result.data?.data ?? []) as SandboxAliasModel[];

    if (!this.jsonEnabled()) {
      if (aliases.length === 0) {
        this.log(t('commands.sandbox.alias.list.no_aliases', 'No aliases found'));
      } else {
        this.log(t('commands.sandbox.alias.list.count', 'Found {{count}} alias(es):', {count: aliases.length}));
        const columns = {
          id: {
            header: 'Alias ID',
            get: (row: SandboxAliasModel) => row.id || '-',
          },
          name: {
            header: 'Hostname',
            get: (row: SandboxAliasModel) => row.name,
          },
          status: {
            header: 'Status',
            get: (row: SandboxAliasModel) => row.status || '-',
          },
          unique: {
            header: 'Unique',
            get: (row: SandboxAliasModel) => (row.unique ? 'Yes' : 'No'),
          },
          domainVerificationRecord: {
            header: 'Verification Record',
            get: (row: SandboxAliasModel) => row.domainVerificationRecord || '-',
          },
        };
        const table = new TableRenderer(columns);
        table.render(aliases, ['id', 'name', 'status', 'unique', 'domainVerificationRecord']);
      }
    }

    return aliases;
  }

  private async showAlias(sandboxId: string, aliasId: string): Promise<SandboxAliasModel> {
    this.log(
      t('commands.sandbox.alias.list.fetching_one', 'Fetching alias {{aliasId}} for sandbox {{sandboxId}}...', {
        aliasId,
        sandboxId,
      }),
    );

    const result = await this.odsClient.GET('/sandboxes/{sandboxId}/aliases/{sandboxAliasId}', {
      params: {
        path: {sandboxId, sandboxAliasId: aliasId},
      },
    });

    if (!result.data?.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(
        t('commands.sandbox.alias.list.error_one', 'Failed to fetch alias: {{message}}', {
          message,
        }),
      );
    }

    const alias = result.data.data as SandboxAliasModel;

    if (!this.jsonEnabled()) {
      this.log('');
      this.log(t('commands.sandbox.alias.list.alias_details', 'Alias Details:'));
      this.log('─'.repeat(60));
      this.log(`ID:       ${alias.id}`);
      this.log(`Name:     ${alias.name}`);
      this.log(`Status:   ${alias.status}`);
      if (alias.unique) {
        this.log(`Unique:   ${alias.unique}`);
      }
      if (alias.domainVerificationRecord) {
        this.log(`Verification Record: ${alias.domainVerificationRecord}`);
      }
      if (alias.registration) {
        this.log(`Registration URL: ${alias.registration}`);
      }
    }

    return alias;
  }
}
