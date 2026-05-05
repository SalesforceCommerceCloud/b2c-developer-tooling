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

type SandboxAliasModel = OdsComponents['schemas']['SandboxAliasModel'];

/**
 * Get details for a single sandbox hostname alias (ODS API GET /sandboxes/{sandboxId}/aliases/{sandboxAliasId}).
 */
export default class SandboxAliasGet extends OdsCommand<typeof SandboxAliasGet> {
  static aliases = ['ods:alias:get'];

  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID or realm-instance, e.g., abcd-123)',
      required: true,
    }),
    aliasId: Args.string({
      description: 'Alias UUID',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.sandbox.alias.get.description', 'Show details for a specific sandbox hostname alias'),
    '/cli/sandbox.html#b2c-sandbox-alias-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> zzzv-123 alias-uuid-here',
    '<%= config.bin %> <%= command.id %> abc12345-1234-1234-1234-abc123456789 alias-uuid-here --json',
  ];

  async run(): Promise<SandboxAliasModel | undefined> {
    const sandboxId = await this.resolveSandboxId(this.args.sandboxId);
    const {aliasId} = this.args;

    this.log(
      t('commands.sandbox.alias.get.fetching', 'Fetching alias {{aliasId}} for sandbox {{sandboxId}}...', {
        aliasId,
        sandboxId: this.args.sandboxId,
      }),
    );

    const result = await this.odsClient.GET('/sandboxes/{sandboxId}/aliases/{sandboxAliasId}', {
      params: {
        path: {sandboxId, sandboxAliasId: aliasId},
      },
    });

    if (result.error) {
      this.error(
        t('commands.sandbox.alias.get.error', 'Failed to fetch alias: {{message}}', {
          message: getApiErrorMessage(result.error, result.response),
        }),
      );
    }

    const alias = result.data?.data;
    if (!alias) {
      this.log(t('commands.sandbox.alias.get.noData', 'No alias details were returned.'));
      return undefined;
    }

    if (this.jsonEnabled()) {
      return alias;
    }

    this.printAlias(alias);
    return alias;
  }

  private printAlias(alias: SandboxAliasModel): void {
    const ui = cliui({width: process.stdout.columns || 80});
    ui.div({text: 'Alias Details', padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    const labelWidth = 22;
    const rows: [string, string | undefined][] = [
      ['ID', alias.id],
      ['Hostname', alias.name],
      ['Status', alias.status],
      ['Unique', alias.unique === undefined ? undefined : String(alias.unique)],
      ['Sandbox ID', alias.sandboxId],
      [
        'Let’s Encrypt',
        alias.requestLetsEncryptCertificate === undefined ? undefined : String(alias.requestLetsEncryptCertificate),
      ],
      ['DNS verification (TXT)', alias.domainVerificationRecord],
      ['Registration URL', alias.registration],
    ];

    for (const [label, value] of rows) {
      if (value !== undefined) {
        ui.div({text: `${label}:`, width: labelWidth, padding: [0, 2, 0, 0]}, {text: value, padding: [0, 0, 0, 0]});
      }
    }

    if (alias.cookie) {
      const c = alias.cookie;
      ui.div(
        {text: 'Cookie:', width: labelWidth, padding: [0, 2, 0, 0]},
        {text: `${c.name}=${c.value}${c.path ? ` (path: ${c.path})` : ''}`, padding: [0, 0, 0, 0]},
      );
    }

    ux.stdout(ui.toString());
  }
}
