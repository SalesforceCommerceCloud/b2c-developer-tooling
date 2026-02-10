/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import cliui from 'cliui';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../i18n/index.js';

type UserInfoSpec = OdsComponents['schemas']['UserInfoSpec'];
type SystemInfoSpec = OdsComponents['schemas']['SystemInfoSpec'];

/**
 * Combined response type for the info command.
 */
interface OdsInfoResponse {
  user: undefined | UserInfoSpec;
  system: SystemInfoSpec | undefined;
}

/**
 * Command to display ODS user and system information.
 * Combines data from getUserInfo and getSystemInfo API endpoints.
 */
export default class SandboxInfo extends OdsCommand<typeof SandboxInfo> {
  static aliases = ['ods:info'];

  static description = withDocs(
    t('commands.sandbox.info.description', 'Display sandbox user and system information'),
    '/cli/sandbox.html#b2c-sandbox-info',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
    '<%= config.bin %> <%= command.id %> --host admin.eu01.dx.commercecloud.salesforce.com',
  ];

  async run(): Promise<OdsInfoResponse> {
    const host = this.odsHost;

    this.log(t('commands.sandbox.info.fetching', 'Fetching ODS information from {{host}}...', {host}));

    // Fetch user info and system info in parallel
    const [userResult, systemResult] = await Promise.all([
      this.odsClient.GET('/me', {}),
      this.odsClient.GET('/system', {}),
    ]);

    if (!userResult.data) {
      this.error(
        t('commands.sandbox.info.userError', 'Failed to fetch user info: {{message}}', {
          message: userResult.response?.statusText || 'Unknown error',
        }),
      );
    }

    if (!systemResult.data) {
      this.error(
        t('commands.sandbox.info.systemError', 'Failed to fetch system info: {{message}}', {
          message: systemResult.response?.statusText || 'Unknown error',
        }),
      );
    }

    const response: OdsInfoResponse = {
      user: userResult.data.data,
      system: systemResult.data.data,
    };

    // In JSON mode, just return the data
    if (this.jsonEnabled()) {
      return response;
    }

    // Human-readable output
    this.printInfo(response);

    return response;
  }

  private printInfo(info: OdsInfoResponse): void {
    const ui = cliui({width: process.stdout.columns || 80});

    // User Info Section
    ui.div({text: 'User Information', padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(40), padding: [0, 0, 0, 0]});
    this.renderUserInfo(ui, info.user);

    // System Info Section
    ui.div({text: '', padding: [0, 0, 0, 0]});
    ui.div({text: 'System Information', padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(40), padding: [0, 0, 0, 0]});
    this.renderSystemInfo(ui, info.system);

    ux.stdout(ui.toString());
  }

  private renderArrayField(ui: ReturnType<typeof cliui>, label: string, values: string[] | undefined): void {
    if (values && values.length > 0) {
      this.renderField(ui, label, values.join(', '));
    }
  }

  private renderField(ui: ReturnType<typeof cliui>, label: string, value: string): void {
    ui.div({text: label, width: 20, padding: [0, 2, 0, 0]}, {text: value, padding: [0, 0, 0, 0]});
  }

  private renderSystemInfo(ui: ReturnType<typeof cliui>, system: SystemInfoSpec | undefined): void {
    if (!system) return;

    if (system.region) {
      this.renderField(ui, 'Region:', system.region);
    }

    this.renderArrayField(ui, 'Inbound IPs:', system.inboundIps);
    this.renderArrayField(ui, 'Outbound IPs:', system.outboundIps);

    // Sandbox IPs with truncation
    if (system.sandboxIps && system.sandboxIps.length > 0) {
      const truncated = system.sandboxIps.length > 5;
      const displayValue = system.sandboxIps.slice(0, 5).join(', ') + (truncated ? '...' : '');
      this.renderField(ui, 'Sandbox IPs:', displayValue);
    }
  }

  private renderUserInfo(ui: ReturnType<typeof cliui>, user: undefined | UserInfoSpec): void {
    if (!user) return;

    // User details
    if (user.user) {
      this.renderField(ui, 'Name:', user.user.name || '-');
      this.renderField(ui, 'Email:', user.user.email || '-');
      this.renderField(ui, 'User ID:', user.user.id || '-');
    }

    // Client info
    if (user.client) {
      this.renderField(ui, 'Client ID:', user.client.id || '-');
    }

    // Arrays with length checks
    this.renderArrayField(ui, 'Roles:', user.roles);
    this.renderArrayField(ui, 'Realms:', user.realms);
    if (user.sandboxes && user.sandboxes.length > 0) {
      this.renderField(ui, 'Sandboxes:', user.sandboxes.length.toString());
    }
  }
}
