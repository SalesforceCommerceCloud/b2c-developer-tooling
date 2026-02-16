/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, type OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';
import open from 'open';

type SandboxAliasModel = OdsComponents['schemas']['SandboxAliasModel'];

/**
 * Command to create a sandbox alias.
 */
export default class SandboxAliasCreate extends OdsCommand<typeof SandboxAliasCreate> {
  static aliases = ['ods:alias:create'];

  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID or realm-instance, e.g., abcd-123)',
      required: true,
    }),
    hostname: Args.string({
      description: 'Hostname alias to register (e.g., my-store.example.com)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.sandbox.alias.create.description', 'Create a hostname alias for a sandbox'),
    '/cli/sandbox.html#b2c-sandbox-alias-create',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> zzzv-123 my-store.example.com',
    '<%= config.bin %> <%= command.id %> zzzv-123 secure-store.example.com --unique',
    '<%= config.bin %> <%= command.id %> zzzv-123 secure-store.example.com --unique --letsencrypt',
    '<%= config.bin %> <%= command.id %> zzzv-123 my-store.example.com --json',
  ];

  static flags = {
    unique: Flags.boolean({
      char: 'u',
      description: "Make the alias unique (required for Let's Encrypt certificates)",
      default: false,
    }),
    letsencrypt: Flags.boolean({
      description: "Request a Let's Encrypt certificate for this alias (requires --unique)",
      default: false,
      dependsOn: ['unique'],
    }),
    'no-open': Flags.boolean({
      description: 'Do not open registration URL in browser (for non-unique aliases)',
      default: false,
    }),
  };

  async run(): Promise<SandboxAliasModel> {
    const {sandboxId, hostname} = this.args;
    const {unique, letsencrypt, 'no-open': noOpen} = this.flags;

    const resolvedSandboxId = await this.resolveSandboxId(sandboxId);

    this.log(
      t('commands.sandbox.alias.create.creating', 'Creating alias {{hostname}} for sandbox {{sandboxId}}...', {
        hostname,
        sandboxId,
      }),
    );

    const result = await this.odsClient.POST('/sandboxes/{sandboxId}/aliases', {
      params: {
        path: {sandboxId: resolvedSandboxId},
      },
      body: {
        name: hostname,
        unique,
        requestLetsEncryptCertificate: letsencrypt,
      },
    });

    if (!result.data?.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(
        t('commands.sandbox.alias.create.error', 'Failed to create alias: {{message}}', {
          message,
        }),
      );
    }

    const alias = result.data.data as SandboxAliasModel;

    if (!this.jsonEnabled()) {
      this.log(t('commands.sandbox.alias.create.success', 'Alias created successfully'));
      this.log('');
      this.log(`ID:       ${alias.id}`);
      this.log(`Hostname: ${alias.name}`);
      this.log(`Status:   ${alias.status}`);

      if (unique && alias.domainVerificationRecord) {
        this.log('');
        this.log(t('commands.sandbox.alias.create.verification', '⚠️  DNS Verification Required:'));
        this.log(
          t(
            'commands.sandbox.alias.create.verification_instructions',
            'Add this TXT record to your DNS configuration:',
          ),
        );
        this.log(`  ${alias.domainVerificationRecord}`);
        this.log('');
        this.log(t('commands.sandbox.alias.create.verification_wait', 'The alias will activate after DNS propagation'));
      }

      if (!unique && alias.registration && !noOpen) {
        this.log('');
        this.log(t('commands.sandbox.alias.create.registration', 'Opening alias registration in browser...'));
        await open(alias.registration);
      }
    }

    return alias;
  }
}
