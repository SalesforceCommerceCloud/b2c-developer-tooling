/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {BaseCommand, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  customApiGroups,
  type CustomApiGroup,
  type IndexedCustomApiEndpoint,
} from '@salesforce/b2c-tooling-sdk/project-index';
import {t, withDocs} from '../../i18n/index.js';
import {displayPath, loadProjectIndex} from '../../utils/project/index.js';

type Row = IndexedCustomApiEndpoint & {implementationPath?: string; apiIssue?: string};

const COLUMNS: Record<string, ColumnDef<Row>> = {
  api: {header: 'API', get: (r) => r.api},
  endpoint: {header: 'Endpoint', get: (r) => r.endpoint},
  route: {header: 'Route', get: (r) => [r.method, r.path].filter(Boolean).join(' ')},
  security: {header: 'Security', get: (r) => [...(r.security ?? []), ...(r.scopes ?? [])].join(' ')},
  cartridge: {header: 'Cartridge', get: (r) => r.cartridge},
  implementation: {header: 'Implementation', get: (r) => r.implementationPath ?? '', extended: true},
  issues: {header: 'Issues', get: (r) => [r.apiIssue, ...r.problems].filter(Boolean).join(' ')},
};

const tableRenderer = new TableRenderer(COLUMNS);

export default class ProjectApis extends BaseCommand<typeof ProjectApis> {
  static args = {
    filter: Args.string({description: 'Only APIs or endpoints whose name contains this text'}),
  };

  static description = withDocs(
    t(
      'commands.project.apis.description',
      'List Custom API endpoints with the route, security scheme, and scopes from schema.yaml, the implementing function, and wiring problems',
    ),
    '/cli/project.html#b2c-project-apis',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> loyalty --json'];

  static flags = {
    ...BaseCommand.baseFlags,
    issues: Flags.boolean({description: 'Only APIs or endpoints with problems', default: false}),
    extended: Flags.boolean({char: 'x', description: 'Show extended columns (implementation)', default: false}),
  };

  protected operations = {loadProjectIndex};

  async run(): Promise<{apis: CustomApiGroup[]}> {
    const {args, flags} = await this.parse(ProjectApis);
    const index = this.operations.loadProjectIndex(this.resolvedConfig.values.cartridges);
    const filter = args.filter?.toLowerCase();
    const apis = customApiGroups(index)
      .map((g) => ({
        ...g,
        endpoints: g.endpoints.filter(
          (e) =>
            (!filter || g.api.toLowerCase().includes(filter) || e.endpoint.toLowerCase().includes(filter)) &&
            (!flags.issues || g.issue || e.problems.length > 0),
        ),
      }))
      .filter((g) => g.endpoints.length > 0);

    if (this.jsonEnabled()) return {apis};
    if (apis.length === 0) {
      this.log(t('commands.project.apis.none', 'No matching Custom API endpoints.'));
      return {apis};
    }
    const rows: Row[] = apis.flatMap((g) =>
      g.endpoints.map((e) => ({
        ...e,
        ...(g.issue ? {apiIssue: g.issue} : {}),
        ...(e.implementationFile
          ? {
              implementationPath: displayPath(
                index,
                e.cartridge,
                e.implementationFile.relPath,
                e.implementationFile.line,
              ),
            }
          : {}),
      })),
    );
    tableRenderer.render(rows, [
      'api',
      'endpoint',
      'route',
      'security',
      'cartridge',
      ...(flags.extended ? ['implementation'] : []),
      'issues',
    ]);
    return {apis};
  }
}
