import {ux} from '@oclif/core';
import cliui from 'cliui';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../i18n/index.js';

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
export default class OdsInfo extends OdsCommand<typeof OdsInfo> {
  static description = t('commands.ods.info.description', 'Display ODS user and system information');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
    '<%= config.bin %> <%= command.id %> --host admin.eu01.dx.commercecloud.salesforce.com',
  ];

  async run(): Promise<OdsInfoResponse> {
    const host = this.odsHost;

    this.log(t('commands.ods.info.fetching', 'Fetching ODS information from {{host}}...', {host}));

    // Fetch user info and system info in parallel
    const [userResult, systemResult] = await Promise.all([
      this.odsClient.GET('/me', {}),
      this.odsClient.GET('/system', {}),
    ]);

    if (!userResult.data) {
      this.error(
        t('commands.ods.info.userError', 'Failed to fetch user info: {{message}}', {
          message: userResult.response?.statusText || 'Unknown error',
        }),
      );
    }

    if (!systemResult.data) {
      this.error(
        t('commands.ods.info.systemError', 'Failed to fetch system info: {{message}}', {
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

    if (info.user?.user) {
      ui.div(
        {text: 'Name:', width: 20, padding: [0, 2, 0, 0]},
        {text: info.user.user.name || '-', padding: [0, 0, 0, 0]},
      );
      ui.div(
        {text: 'Email:', width: 20, padding: [0, 2, 0, 0]},
        {text: info.user.user.email || '-', padding: [0, 0, 0, 0]},
      );
      ui.div(
        {text: 'User ID:', width: 20, padding: [0, 2, 0, 0]},
        {text: info.user.user.id || '-', padding: [0, 0, 0, 0]},
      );
    }

    if (info.user?.client) {
      ui.div(
        {text: 'Client ID:', width: 20, padding: [0, 2, 0, 0]},
        {text: info.user.client.id || '-', padding: [0, 0, 0, 0]},
      );
    }

    if (info.user?.roles && info.user.roles.length > 0) {
      ui.div(
        {text: 'Roles:', width: 20, padding: [0, 2, 0, 0]},
        {text: info.user.roles.join(', '), padding: [0, 0, 0, 0]},
      );
    }

    if (info.user?.realms && info.user.realms.length > 0) {
      ui.div(
        {text: 'Realms:', width: 20, padding: [0, 2, 0, 0]},
        {text: info.user.realms.join(', '), padding: [0, 0, 0, 0]},
      );
    }

    if (info.user?.sandboxes && info.user.sandboxes.length > 0) {
      ui.div(
        {text: 'Sandboxes:', width: 20, padding: [0, 2, 0, 0]},
        {text: info.user.sandboxes.length.toString(), padding: [0, 0, 0, 0]},
      );
    }

    // System Info Section
    ui.div({text: '', padding: [0, 0, 0, 0]});
    ui.div({text: 'System Information', padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(40), padding: [0, 0, 0, 0]});

    if (info.system?.region) {
      ui.div({text: 'Region:', width: 20, padding: [0, 2, 0, 0]}, {text: info.system.region, padding: [0, 0, 0, 0]});
    }

    if (info.system?.inboundIps && info.system.inboundIps.length > 0) {
      ui.div(
        {text: 'Inbound IPs:', width: 20, padding: [0, 2, 0, 0]},
        {text: info.system.inboundIps.join(', '), padding: [0, 0, 0, 0]},
      );
    }

    if (info.system?.outboundIps && info.system.outboundIps.length > 0) {
      ui.div(
        {text: 'Outbound IPs:', width: 20, padding: [0, 2, 0, 0]},
        {text: info.system.outboundIps.join(', '), padding: [0, 0, 0, 0]},
      );
    }

    if (info.system?.sandboxIps && info.system.sandboxIps.length > 0) {
      ui.div(
        {text: 'Sandbox IPs:', width: 20, padding: [0, 2, 0, 0]},
        {
          text: info.system.sandboxIps.slice(0, 5).join(', ') + (info.system.sandboxIps.length > 5 ? '...' : ''),
          padding: [0, 0, 0, 0],
        },
      );
    }

    ux.stdout(ui.toString());
  }
}
