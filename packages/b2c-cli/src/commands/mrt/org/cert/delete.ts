/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {deleteCertificate} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';
import {confirm} from '../../../../prompts.js';

export default class MrtOrgCertDelete extends MrtCommand<typeof MrtOrgCertDelete> {
  static args = {
    certId: Args.integer({description: 'Certificate ID to delete', required: true}),
  };

  static description = withDocs(
    t('commands.mrt.org.cert.delete.description', 'Delete a custom domain certificate'),
    '/cli/mrt.html#b2c-mrt-org-cert-delete',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> 123 --org my-org'];

  static flags = {
    ...MrtCommand.baseFlags,
    org: Flags.string({description: 'Organization slug', required: true}),
    force: Flags.boolean({char: 'f', description: 'Skip confirmation prompt', default: false}),
  };

  async run(): Promise<{certId: number; deleted: boolean}> {
    this.requireMrtCredentials();

    const {certId} = this.args;
    const {org, force} = this.flags;

    if (!force && !this.jsonEnabled()) {
      const confirmed = await confirm(
        t('commands.mrt.org.cert.delete.confirm', 'Delete certificate {{id}} from {{org}}?', {
          id: String(certId),
          org,
        }),
      );
      if (!confirmed) {
        this.log(t('commands.mrt.org.cert.delete.cancelled', 'Cancelled.'));
        return {certId, deleted: false};
      }
    }

    await deleteCertificate(
      {organizationSlug: org, certId, origin: this.resolvedConfig.values.mrtOrigin},
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      this.log(t('commands.mrt.org.cert.delete.success', 'Certificate {{id}} deleted.', {id: String(certId)}));
    }

    return {certId, deleted: true};
  }
}
