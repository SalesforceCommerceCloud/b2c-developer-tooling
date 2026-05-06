/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getCertificate, type MrtCertificate} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

export default class MrtOrgCertGet extends MrtCommand<typeof MrtOrgCertGet> {
  static args = {
    certId: Args.integer({description: 'Certificate ID', required: true}),
  };

  static description = withDocs(
    t('commands.mrt.org.cert.get.description', 'Get details for a custom domain certificate'),
    '/cli/mrt.html#b2c-mrt-org-cert-get',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> 123 --org my-org'];

  static flags = {
    ...MrtCommand.baseFlags,
    org: Flags.string({description: 'Organization slug', required: true}),
  };

  async run(): Promise<MrtCertificate> {
    this.requireMrtCredentials();

    const {certId} = this.args;
    const {org} = this.flags;

    const cert = await getCertificate(
      {organizationSlug: org, certId, origin: this.resolvedConfig.values.mrtOrigin},
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      const ui = cliui({width: process.stdout.columns || 80});
      const w = 24;
      ui.div('');
      ui.div({text: 'ID:', width: w}, {text: cert.id?.toString() ?? '-'});
      ui.div({text: 'Domain:', width: w}, {text: cert.domain_name ?? '-'});
      ui.div({text: 'Validation Status:', width: w}, {text: cert.validation_status ?? '-'});
      ui.div({text: 'Validation Record:', width: w}, {text: cert.validation_record ?? '-'});
      ui.div({text: 'Validation Requested:', width: w}, {text: cert.validation_requested_at ?? '-'});
      ui.div({text: 'Expires:', width: w}, {text: cert.expires_at ?? '-'});
      ui.div({text: 'Renewal Status:', width: w}, {text: (cert.renewal_status as null | string) ?? '-'});
      ui.div({text: 'Renewal Eligibility:', width: w}, {text: (cert.renewal_eligibility as null | string) ?? '-'});
      ux.stdout(ui.toString());
    }

    return cert;
  }
}
