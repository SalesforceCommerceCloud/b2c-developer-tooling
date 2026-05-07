/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {restartCertificateValidation, type MrtCertificate} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

export default class MrtOrgCertRestartValidation extends MrtCommand<typeof MrtOrgCertRestartValidation> {
  static args = {
    certId: Args.integer({description: 'Certificate ID', required: true}),
  };

  static description = withDocs(
    t(
      'commands.mrt.org.cert.restartValidation.description',
      'Restart validation for a certificate that has not yet been validated',
    ),
    '/cli/mrt.html#b2c-mrt-org-cert-restart-validation',
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

    const cert = await restartCertificateValidation(
      {organizationSlug: org, certId, origin: this.resolvedConfig.values.mrtOrigin},
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.mrt.org.cert.restartValidation.success', 'Validation restarted for certificate {{id}}.', {
          id: String(certId),
        }),
      );
      if (cert.validation_record) {
        this.log(
          t('commands.mrt.org.cert.restartValidation.record', 'New validation record:\n  {{record}}', {
            record: cert.validation_record,
          }),
        );
      }
    }

    return cert;
  }
}
