/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createCertificate, type MrtCertificateListCreate} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

export default class MrtOrgCertCreate extends MrtCommand<typeof MrtOrgCertCreate> {
  static args = {
    domain: Args.string({
      description: 'Domain for the certificate (e.g. shop.example.com)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.mrt.org.cert.create.description', 'Create a custom domain certificate for an organization'),
    '/cli/mrt.html#b2c-mrt-org-cert-create',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> shop.example.com --org my-org'];

  static flags = {
    ...MrtCommand.baseFlags,
    org: Flags.string({description: 'Organization slug', required: true}),
  };

  async run(): Promise<MrtCertificateListCreate> {
    this.requireMrtCredentials();

    const {domain} = this.args;
    const {org} = this.flags;

    const cert = await createCertificate(
      {organizationSlug: org, domainName: domain, origin: this.resolvedConfig.values.mrtOrigin},
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.mrt.org.cert.create.success', 'Certificate created (id={{id}}) for {{domain}}.', {
          id: String(cert.id ?? '?'),
          domain,
        }),
      );
      if (cert.validation_record) {
        this.log(
          t(
            'commands.mrt.org.cert.create.validationRecord',
            'Add the following DNS record to validate this certificate:\n  {{record}}',
            {record: cert.validation_record},
          ),
        );
      }
    }

    return cert;
  }
}
