/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Flags} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, type OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../i18n/index.js';

type SystemInfoSpec = OdsComponents['schemas']['SystemInfoSpec'];

type SystemInfoResponse = OdsComponents['schemas']['SystemInfoResponse'];

/**
 * List inbound and outbound IP addresses for ODS sandboxes.
 */
export default class SandboxIps extends OdsCommand<typeof SandboxIps> {
  static aliases = ['ods:ips'];

  static description = withDocs(
    t('commands.sandbox.ips.description', 'List inbound and outbound IP addresses for ODS sandboxes'),
    '/cli/sandbox.html#b2c-sandbox-ips',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
    '<%= config.bin %> <%= command.id %> --realm zzzz',
    '<%= config.bin %> <%= command.id %> -r zzzz --json',
  ];

  static flags = {
    realm: Flags.string({
      char: 'r',
      description: 'Realm ID (four-letter ID) to get IP details for',
    }),
  } as const;

  async run(): Promise<SystemInfoResponse | SystemInfoSpec | undefined> {
    const {flags} = await this.parse(SandboxIps);
    const host = this.odsHost;

    this.log(t('commands.sandbox.ips.fetching', 'Fetching sandbox IP information from {{host}}...', {host}));

    const result: {
      data?: SystemInfoResponse;
      error?: unknown;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response?: any;
    } = await (flags.realm
      ? this.odsClient.GET('/realms/{realm}/system', {
          params: {path: {realm: flags.realm}},
        })
      : this.odsClient.GET('/system', {}));

    if (result.error) {
      this.error(
        t('commands.sandbox.ips.error', 'Failed to fetch sandbox IP information: {{message}}', {
          message: getApiErrorMessage(result.error, result.response),
        }),
      );
    }

    const data = (result.data as SystemInfoResponse | undefined)?.data;

    if (!data) {
      this.log(t('commands.sandbox.ips.noData', 'No system information was returned.'));
      return undefined;
    }

    if (this.jsonEnabled()) {
      return result.data as SystemInfoResponse;
    }

    this.printIps(data, flags.realm);

    return data;
  }

  private printIps(system: SystemInfoSpec, realm?: string): void {
    const context = realm ? t('commands.sandbox.ips.realmLabel', ' (for realm {{realm}})', {realm}) : '';

    console.log(t('commands.sandbox.ips.inboundHeader', 'Inbound IP addresses{{context}}:', {context}));
    for (const ip of system.inboundIps ?? []) {
      console.log(`  - ${ip}`);
    }

    console.log();

    console.log(t('commands.sandbox.ips.outboundHeader', 'Outbound IP addresses{{context}}:', {context}));
    for (const ip of system.outboundIps ?? []) {
      console.log(`  - ${ip}`);
    }

    if (system.sandboxIps && system.sandboxIps.length > 0) {
      console.log();

      console.log(t('commands.sandbox.ips.sandboxHeader', 'Sandbox IP addresses{{context}}:', {context}));
      for (const ip of system.sandboxIps) {
        console.log(`  - ${ip}`);
      }
    }
  }
}
