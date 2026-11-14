/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {BaseCommand, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {controllerEndpoints, endpointIssues} from '@salesforce/b2c-tooling-sdk/project-index';
import {t, withDocs} from '../../i18n/index.js';
import {displayPath, loadProjectIndex} from '../../utils/project/index.js';

/** One row of `b2c project endpoints`. */
export interface EndpointSummary {
  id: string;
  controller: string;
  action: string;
  kind: 'sfra' | 'sg-controller';
  cartridge: string;
  file: string;
  methods: string[];
  https: boolean;
  loginRequired: boolean;
  csrf: string;
  issues: string[];
}

const COLUMNS: Record<string, ColumnDef<EndpointSummary>> = {
  id: {header: 'Endpoint', get: (e) => e.id},
  methods: {header: 'Methods', get: (e) => (e.methods.includes('ANY') ? 'any' : e.methods.join('/'))},
  https: {header: 'HTTPS', get: (e) => (e.https ? 'yes' : '')},
  login: {header: 'Login', get: (e) => (e.loginRequired ? 'yes' : '')},
  csrf: {header: 'CSRF', get: (e) => e.csrf},
  cartridge: {header: 'Cartridge', get: (e) => e.cartridge},
  file: {header: 'File', get: (e) => e.file, extended: true},
  issues: {header: 'Issues', get: (e) => e.issues.join(' ')},
};

const tableRenderer = new TableRenderer(COLUMNS);

export default class ProjectEndpoints extends BaseCommand<typeof ProjectEndpoints> {
  static args = {
    filter: Args.string({
      description: 'Only endpoints whose ID contains this text (case-insensitive), for example "Cart-"',
    }),
  };

  static description = withDocs(
    t(
      'commands.project.endpoints.description',
      'List storefront controller endpoints (SFRA and SiteGenesis) with the methods they accept and their HTTPS, login, and CSRF protection, composed across the cartridge path',
    ),
    '/cli/project.html#b2c-project-endpoints',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> Cart-',
    '<%= config.bin %> <%= command.id %> --issues',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    issues: Flags.boolean({
      description: 'Only endpoints with issues (POST without a CSRF check, dropped security middleware)',
      default: false,
    }),
    extended: Flags.boolean({char: 'x', description: 'Show extended columns (file)', default: false}),
  };

  protected operations = {loadProjectIndex};

  async run(): Promise<{endpoints: EndpointSummary[]}> {
    const {args, flags} = await this.parse(ProjectEndpoints);
    const index = this.operations.loadProjectIndex(this.resolvedConfig.values.cartridges);
    const filter = args.filter?.toLowerCase();
    const endpoints = controllerEndpoints(index)
      .map<EndpointSummary>((e) => ({
        id: e.id,
        controller: e.controller,
        action: e.action,
        kind: e.kind as EndpointSummary['kind'],
        cartridge: e.cartridge,
        file: displayPath(index, e.cartridge, e.relPath, e.line),
        methods: e.methods,
        https: e.https,
        loginRequired: e.loginRequired,
        csrf: e.csrf,
        issues: endpointIssues(e),
      }))
      .filter((e) => (!filter || e.id.toLowerCase().includes(filter)) && (!flags.issues || e.issues.length > 0));

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
    const columns = [
      'id',
      'methods',
      'https',
      'login',
      'csrf',
      'cartridge',
      ...(flags.extended ? ['file'] : []),
      'issues',
    ];
    tableRenderer.render(endpoints, columns);
    return {endpoints};
  }
}
