/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../../utils/ecdn/index.js';
import {t} from '../../../../i18n/index.js';

type PageShieldScriptResponse = CdnZonesComponents['schemas']['PageShieldScriptResponse'];

/**
 * Response type for the get command.
 */
interface GetOutput {
  script: PageShieldScriptResponse;
}

/**
 * Command to get details of a Page Shield script.
 */
export default class EcdnPageShieldScriptsGet extends EcdnZoneCommand<typeof EcdnPageShieldScriptsGet> {
  static description = t('commands.ecdn.page-shield.scripts.get.description', 'Get details of a Page Shield script');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --script-id 12345678901234asdfasfasdf',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --script-id 12345678901234asdfasfasdf --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'script-id': Flags.string({
      description: t('flags.scriptId.description', 'Page Shield script ID'),
      required: true,
    }),
  };

  async run(): Promise<GetOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const scriptId = this.flags['script-id'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.page-shield.scripts.get.fetching', 'Fetching Page Shield script...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET(
      '/organizations/{organizationId}/zones/{zoneId}/page-shield/scripts/{scriptId}',
      {
        params: {
          path: {organizationId, zoneId, scriptId},
        },
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.page-shield.scripts.get.error', 'Failed to fetch Page Shield script: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const script = data?.data;
    if (!script) {
      this.error(t('commands.ecdn.page-shield.scripts.get.noData', 'No script data returned from API'));
    }

    const output: GetOutput = {script};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 22;

    ui.div('');
    ui.div({text: 'Page Shield Script:', padding: [0, 0, 1, 0]});
    ui.div({text: 'Script ID:', width: labelWidth}, {text: script.id || '-'});
    ui.div({text: 'URL:', width: labelWidth}, {text: script.url || '-'});
    ui.div({text: 'Host:', width: labelWidth}, {text: script.host || '-'});
    ui.div({text: 'Status:', width: labelWidth}, {text: script.status || '-'});

    if (script.firstSeenAt) {
      ui.div({text: 'First Seen:', width: labelWidth}, {text: script.firstSeenAt});
    }
    if (script.lastSeenAt) {
      ui.div({text: 'Last Seen:', width: labelWidth}, {text: script.lastSeenAt});
    }
    if (script.hash) {
      ui.div({text: 'Hash:', width: labelWidth}, {text: script.hash});
    }

    ui.div('');
    ui.div({text: 'Security Scores:', padding: [0, 0, 0, 0]});
    ui.div(
      {text: 'Malware Score:', width: labelWidth},
      {text: script.malwareScore === undefined ? '-' : String(script.malwareScore)},
    );
    ui.div(
      {text: 'MageCart Score:', width: labelWidth},
      {text: script.mageCartScore === undefined ? '-' : String(script.mageCartScore)},
    );
    ui.div(
      {text: 'Obfuscation Score:', width: labelWidth},
      {text: script.obfuscationScore === undefined ? '-' : String(script.obfuscationScore)},
    );
    ui.div(
      {text: 'Dataflow Score:', width: labelWidth},
      {text: script.dataflowScore === undefined ? '-' : String(script.dataflowScore)},
    );
    ui.div(
      {text: 'Crypto Mining Score:', width: labelWidth},
      {text: script.cryptoMiningScore === undefined ? '-' : String(script.cryptoMiningScore)},
    );
    ui.div(
      {text: 'JS Integrity Score:', width: labelWidth},
      {text: script.jsIntegrityScore === undefined ? '-' : String(script.jsIntegrityScore)},
    );

    if (script.domainReportedMalicious) {
      ui.div({text: 'Domain Malicious:', width: labelWidth}, {text: 'yes'});
    }
    if (script.urlReportedMalicious) {
      ui.div({text: 'URL Malicious:', width: labelWidth}, {text: 'yes'});
    }

    if (script.pageUrls && script.pageUrls.length > 0) {
      ui.div('');
      ui.div({text: 'Page URLs:', padding: [0, 0, 0, 0]});
      for (const pageUrl of script.pageUrls.slice(0, 5)) {
        ui.div({text: `  ${pageUrl}`});
      }
      if (script.pageUrls.length > 5) {
        ui.div({text: `  ... and ${script.pageUrls.length - 5} more`});
      }
    }

    ux.stdout(ui.toString());

    return output;
  }
}
