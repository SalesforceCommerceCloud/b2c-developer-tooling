/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Args} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, type OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../i18n/index.js';

type SandboxStorageModel = OdsComponents['schemas']['SandboxStorageModel'];
type SandboxStorageResponse = OdsComponents['schemas']['SandboxStorageResponse'];

/**
 * Show sandbox storage details.
 */
export default class SandboxStorage extends OdsCommand<typeof SandboxStorage> {
  static aliases = ['ods:storage'];

  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID or realm-instance, e.g., zzzz-001)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.sandbox.storage.description', 'Show storage details for a specific sandbox'),
    '/cli/sandbox.html#b2c-sandbox-storage',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> zzzz-001',
    '<%= config.bin %> <%= command.id %> zzzz-001 --json',
  ];

  async run(): Promise<SandboxStorageModel | SandboxStorageResponse | undefined> {
    const {args} = await this.parse(SandboxStorage);
    const sandboxId = await this.resolveSandboxId(args.sandboxId);

    const result = await this.odsClient.GET('/sandboxes/{sandboxId}/storage', {
      params: {
        path: {sandboxId},
      },
    });

    if (result.error) {
      this.error(
        t('commands.sandbox.storage.error', 'Failed to fetch sandbox storage: {{message}}', {
          message: getApiErrorMessage(result.error, result.response),
        }),
      );
    }

    const data = (result.data as SandboxStorageResponse | undefined)?.data;
    if (!data || Object.keys(data).length === 0) {
      this.log(t('commands.sandbox.storage.noData', 'No storage data was returned for this sandbox.'));
      return undefined;
    }

    if (this.jsonEnabled()) {
      return result.data as SandboxStorageResponse;
    }

    this.printStorage(data);
    return data;
  }

  private printStorage(storage: SandboxStorageModel): void {
    console.log('Sandbox Storage');
    console.log('───────────────');
    console.log('Filesystem                Total (MB)  Used (MB)  Used (%)');
    console.log('────────────────────────  ──────────  ─────────  ────────');

    for (const [name, usage] of Object.entries(storage)) {
      const total = usage?.spaceTotal ?? '-';
      const used = usage?.spaceUsed ?? '-';
      const percentage = usage?.percentageUsed ?? '-';

      console.log(
        `${name.padEnd(24)}  ${String(total).padStart(10)}  ${String(used).padStart(9)}  ${String(percentage).padStart(8)}`,
      );
    }
  }
}
