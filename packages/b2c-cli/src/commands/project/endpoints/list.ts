/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {BaseCommand, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {endpointSummaries, type EndpointSummary} from '@salesforce/b2c-tooling-sdk/project-index';
import {t, withDocs} from '../../../i18n/index.js';
import {displayPath, loadProjectIndex, projectRoot} from '../../../utils/project/index.js';

/** One row of `b2c project endpoints list`: the SDK summary with a display path. */
export type EndpointListRow = EndpointSummary & {file: string};

const COLUMNS: Record<string, ColumnDef<EndpointListRow>> = {
  id: {header: 'Endpoint', get: (e) => e.id},
  methods: {header: 'Methods', get: (e) => (e.methods.includes('ANY') ? 'any' : e.methods.join('/'))},
  cartridge: {header: 'Cartridge', get: (e) => e.cartridge},
  cartridges: {header: 'Changed by', get: (e) => e.cartridges.filter((c) => c !== e.cartridge).join(', ')},
  middleware: {header: 'Middleware', get: (e) => e.middleware.join(', '), extended: true},
  file: {header: 'File', get: (e) => e.file, extended: true},
};

const tableRenderer = new TableRenderer(COLUMNS);

export default class ProjectEndpointsList extends BaseCommand<typeof ProjectEndpointsList> {
  static args = {
    filter: Args.string({
      description: 'Only endpoints whose ID contains this text (case-insensitive), for example "Cart-"',
    }),
  };

  static description = withDocs(
    t(
      'commands.project.endpoints.list.description',
      '[PREVIEW] List storefront controller endpoints (SFRA and SiteGenesis), composed across the cartridge path. Use "endpoints get" for what runs for one',
    ),
    '/cli/project.html#b2c-project-endpoints-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> Cart-',
    '<%= config.bin %> <%= command.id %> --cartridge int_paypal',
    '<%= config.bin %> <%= command.id %> --uses csrfProtection.validateAjaxRequest',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    cartridge: Flags.string({
      description: 'Only endpoints this cartridge defines or changes (append, prepend, replace)',
    }),
    uses: Flags.string({
      description: 'Only endpoints whose middleware includes this text, for example "userLoggedIn" or "csrf"',
    }),
    extended: Flags.boolean({char: 'x', description: 'Show extended columns (middleware, file)', default: false}),
  };

  protected operations = {loadProjectIndex};

  async run(): Promise<{endpoints: EndpointListRow[]}> {
    const {args, flags} = await this.parse(ProjectEndpointsList);
    const index = this.operations.loadProjectIndex(
      this.resolvedConfig.values.cartridges,
      [],
      projectRoot(this.resolvedConfig),
      this.resolvedConfig.values.siteId,
    );
    const endpoints = endpointSummaries(index, {filter: args.filter, cartridge: flags.cartridge, uses: flags.uses}).map(
      (e) => ({...e, file: displayPath(index, e.cartridge, e.relPath, e.line)}),
    );

    if (this.jsonEnabled()) return {endpoints};
    if (endpoints.length === 0) {
      this.log(
        index.cartridges.length === 0
          ? t(
              'commands.project.noCartridges',
              'No cartridges found. Run this in a project that contains cartridges (folders with a .project file).',
            )
          : t('commands.project.endpoints.none', 'No matching endpoints.'),
      );
      return {endpoints};
    }
    tableRenderer.render(endpoints, [
      'id',
      'methods',
      'cartridge',
      'cartridges',
      ...(flags.extended ? ['middleware', 'file'] : []),
    ]);
    return {endpoints};
  }
}
