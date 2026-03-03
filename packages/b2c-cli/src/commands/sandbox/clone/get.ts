/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, ux} from '@oclif/core';
import cliui from 'cliui';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, type OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../../i18n/index.js';

type SandboxCloneGetModel = OdsComponents['schemas']['SandboxCloneGetModel'];

/**
 * Command to get details of a specific sandbox clone.
 */
export default class CloneGet extends OdsCommand<typeof CloneGet> {
  static aliases = ['ods:clone:get'];

  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID or friendly format like realm-instance)',
      required: true,
    }),
    cloneId: Args.string({
      description: 'Clone ID in format realm-instance-timestamp (e.g., aaaa-002-1642780893121)',
      required: true,
    }),
  };

  static description = t('commands.clone.get.description', 'Get detailed information about a specific sandbox clone');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> <sandboxId> <cloneId>',
    '<%= config.bin %> <%= command.id %> abcd-123 aaaa-002-1642780893121',
  ];

  async run(): Promise<{data?: SandboxCloneGetModel}> {
    const {sandboxId: rawSandboxId, cloneId} = this.args;

    // Resolve sandbox ID (handles both UUID and friendly format)
    const sandboxId = await this.resolveSandboxId(rawSandboxId);

    this.log(t('commands.clone.get.fetching', 'Fetching clone details...'));

    const result = await this.odsClient.GET('/sandboxes/{sandboxId}/clones/{cloneId}', {
      params: {
        path: {sandboxId, cloneId},
      },
    });

    if (!result.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(t('commands.clone.get.error', 'Failed to get clone details: {{message}}', {message}));
    }

    const clone = result.data.data;

    if (this.jsonEnabled()) {
      return {data: clone};
    }

    this.printCloneDetails(clone);

    return {data: clone};
  }

  private buildCloneFields(clone: SandboxCloneGetModel | undefined): [string, string | undefined][] {
    return [
      ['Clone ID', clone?.cloneId],
      ['Source Instance', clone?.sourceInstance],
      ['Source Instance ID', clone?.sourceInstanceId],
      ['Target Instance', clone?.targetInstance],
      ['Target Instance ID', clone?.targetInstanceId],
      ['Realm', clone?.realm],
      ['Status', clone?.status],
      ['Progress', clone?.progressPercentage === undefined ? '-' : `${clone.progressPercentage}%`],
      ['Created At', clone?.createdAt ? new Date(clone.createdAt).toLocaleString() : undefined],
      ['Custom Code Version', clone?.customCodeVersion],
      ['Storefront Count', clone?.storefrontCount?.toString()],
      ['Filesystem Usage Size', clone?.filesystemUsageSize?.toString()],
      ['Database Transfer Size', clone?.databaseTransferSize?.toString()],
    ];
  }

  private printCloneDetails(clone: SandboxCloneGetModel | undefined): void {
    const ui = cliui({width: process.stdout.columns || 80});

    ui.div({text: 'Clone Details', padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    const fields = this.buildCloneFields(clone);

    for (const [label, value] of fields) {
      if (value !== undefined) {
        ui.div({text: `${label}:`, width: 25, padding: [0, 2, 0, 0]}, {text: value, padding: [0, 0, 0, 0]});
      }
    }

    ux.stdout(ui.toString());
  }
}
