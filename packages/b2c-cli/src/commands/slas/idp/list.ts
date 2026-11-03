/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {TableRenderer, columnFlagsFor, selectColumns, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {SlasClientCommand, formatApiError, isSlasNotFound} from '../../../utils/slas/client.js';
import {redactIdp, type IdentityProvider} from '../../../utils/slas/idp.js';
import {t, withDocs} from '../../../i18n/index.js';

interface IdpListOutput {
  idps: IdentityProvider[];
}

const COLUMNS: Record<string, ColumnDef<IdentityProvider>> = {
  name: {header: 'Name', get: (i) => i.name ?? ''},
  provider: {header: 'Provider', get: (i) => i.idpOrigin ?? ''},
  preferred: {header: 'Preferred', get: (i) => String(i.isPreferred ?? false)},
  clientId: {header: 'Client ID', get: (i) => i.clientId ?? ''},
  redirectUrl: {header: 'Redirect URL', get: (i) => i.redirectUrl ?? ''},
  scopes: {header: 'Scopes', get: (i) => (i.scopes ?? []).join(' ')},
};

const DEFAULT_COLUMNS = ['name', 'provider', 'preferred', 'clientId'];

const tableRenderer = new TableRenderer(COLUMNS);

export default class SlasIdpList extends SlasClientCommand<typeof SlasIdpList> {
  static description = withDocs(
    t('commands.slas.idp.list.description', 'List the identity providers configured for a SLAS tenant'),
    '/cli/slas.html#b2c-slas-idp-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123',
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123 --json',
  ];

  static flags = {
    ...SlasClientCommand.baseFlags,
    ...columnFlagsFor(COLUMNS),
    'show-secret': Flags.boolean({
      description: 'Include IDP client secrets in JSON output',
      default: false,
    }),
  };

  async run(): Promise<IdpListOutput> {
    this.requireOAuthCredentials();
    const tenantId = this.requireTenantId();
    const slasClient = this.getSlasClient();

    const {data, error, response} = await slasClient.GET('/tenants/{tenantId}/idps', {
      params: {path: {tenantId}},
    });

    // SLAS answers 404 when a tenant has no identity providers.
    if (error && !isSlasNotFound(error, response, 'IdpNotFoundException')) {
      this.error(
        t('commands.slas.idp.list.error', 'Failed to list identity providers: {{message}}', {
          message: formatApiError(error, response),
        }),
      );
    }

    const idps = (error ? [] : (data?.data ?? [])).map((idp) => redactIdp(idp, this.flags['show-secret']));
    const output: IdpListOutput = {idps};

    if (this.jsonEnabled()) return output;

    if (idps.length === 0) {
      this.log(t('commands.slas.idp.list.none', 'No identity providers found.'));
      return output;
    }

    tableRenderer.render(idps, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));
    return output;
  }
}
