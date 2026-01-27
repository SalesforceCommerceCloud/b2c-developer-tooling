/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {MrtCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {getB2COrgInfo, type B2COrgInfo} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

type InfoEntry = {field: string; value: string};

const COLUMNS: Record<string, ColumnDef<InfoEntry>> = {
  field: {
    header: 'Field',
    get: (e) => e.field,
  },
  value: {
    header: 'Value',
    get: (e) => e.value,
  },
};

const DEFAULT_COLUMNS = ['field', 'value'];

/**
 * Get B2C Commerce info for an organization.
 */
export default class MrtB2COrgInfo extends MrtCommand<typeof MrtB2COrgInfo> {
  static args = {
    organization: Args.string({
      description: 'Organization slug',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.mrt.b2c.org-info.description', 'Get B2C Commerce instances connected to an organization'),
    '/cli/mrt.html#b2c-mrt-org-b2c',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> my-org', '<%= config.bin %> <%= command.id %> my-org --json'];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  async run(): Promise<B2COrgInfo> {
    this.requireMrtCredentials();

    const {organization} = this.args;

    this.log(
      t('commands.mrt.b2c.org-info.fetching', 'Fetching B2C info for organization {{org}}...', {org: organization}),
    );

    const info = await getB2COrgInfo(
      {
        organizationSlug: organization,
        origin: this.resolvedConfig.values.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      const entries: InfoEntry[] = [
        {field: 'B2C Customer', value: info.is_b2c_customer ? 'Yes' : 'No'},
        {field: 'Instances', value: info.instances.length > 0 ? info.instances.join(', ') : 'None'},
      ];
      createTable(COLUMNS).render(entries, DEFAULT_COLUMNS);
    }

    return info;
  }
}
