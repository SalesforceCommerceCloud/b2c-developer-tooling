/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {MrtCommand, printFieldsBlock} from '@salesforce/b2c-tooling-sdk/cli';
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
      printFieldsBlock('Certificate', [
        ['ID', cert.id?.toString()],
        ['Domain', cert.domain_name],
        ['Validation Status', cert.validation_status],
        ['Validation Record', cert.validation_record],
        ['Validation Requested', cert.validation_requested_at],
        ['Expires', cert.expires_at],
        ['Renewal Status', cert.renewal_status as null | string | undefined],
        ['Renewal Eligibility', cert.renewal_eligibility as null | string | undefined],
      ]);
    }

    return cert;
  }
}
