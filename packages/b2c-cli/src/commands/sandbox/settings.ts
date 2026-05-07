/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Args} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, type OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../i18n/index.js';

type SandboxSettings = OdsComponents['schemas']['SandboxSettings'];
type SandboxSettingsResponse = OdsComponents['schemas']['SandboxSettingsResponse'];

/**
 * Show sandbox settings.
 */
export default class SandboxSettingsCommand extends OdsCommand<typeof SandboxSettingsCommand> {
  static aliases = ['ods:settings'];

  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID or realm-instance, e.g., zzzz-001)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.sandbox.settings.description', 'Show settings for a specific sandbox'),
    '/cli/sandbox.html#b2c-sandbox-settings',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> zzzz-001',
    '<%= config.bin %> <%= command.id %> zzzz-001 --json',
  ];

  async run(): Promise<SandboxSettings | SandboxSettingsResponse | undefined> {
    const {args} = await this.parse(SandboxSettingsCommand);
    const sandboxId = await this.resolveSandboxId(args.sandboxId);

    const result = await this.odsClient.GET('/sandboxes/{sandboxId}/settings', {
      params: {
        path: {sandboxId},
      },
    });

    if (result.error) {
      this.error(
        t('commands.sandbox.settings.error', 'Failed to fetch sandbox settings: {{message}}', {
          message: getApiErrorMessage(result.error, result.response),
        }),
      );
    }

    const data = (result.data as SandboxSettingsResponse | undefined)?.data;
    if (!data) {
      this.log(t('commands.sandbox.settings.noData', 'No settings were returned for this sandbox.'));
      return undefined;
    }

    if (this.jsonEnabled()) {
      return result.data as SandboxSettingsResponse;
    }

    this.printSettings(data);
    return data;
  }

  private printSettings(settings: SandboxSettings): void {
    const ocapi = settings.ocapi ?? [];
    const webdav = settings.webdav ?? [];

    console.log('Sandbox Settings');
    console.log('────────────────');
    console.log(`OCAPI client entries: ${ocapi.length}`);
    console.log(`WebDAV client entries: ${webdav.length}`);

    if (ocapi.length > 0) {
      console.log();
      console.log('OCAPI');
      for (const entry of ocapi) {
        const resources = entry.resources?.length ?? 0;
        console.log(`  - ${entry.client_id ?? 'unknown-client'} (${resources} resource rules)`);
      }
    }

    if (webdav.length > 0) {
      console.log();
      console.log('WebDAV');
      for (const entry of webdav) {
        const permissions = entry.permissions?.length ?? 0;
        console.log(`  - ${entry.client_id ?? 'unknown-client'} (${permissions} permission rules)`);
      }
    }
  }
}
