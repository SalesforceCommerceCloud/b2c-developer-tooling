/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, ux} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  controllerEndpoints,
  endpointIssues,
  middlewareLabel,
  securityRole,
  type IndexedEndpoint,
} from '@salesforce/b2c-tooling-sdk/project-index';
import {t, withDocs} from '../../i18n/index.js';
import {displayPath, loadProjectIndex} from '../../utils/project/index.js';

export default class ProjectEndpoint extends BaseCommand<typeof ProjectEndpoint> {
  static args = {
    id: Args.string({description: 'Endpoint ID (Controller-Action), for example Cart-AddProduct', required: true}),
  };

  static description = withDocs(
    t(
      'commands.project.endpoint.description',
      'Show what runs for one storefront endpoint: its middleware and handlers in order, the cartridge each comes from, and the statements across cartridges that built it',
    ),
    '/cli/project.html#b2c-project-endpoint',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> Cart-AddProduct',
    '<%= config.bin %> <%= command.id %> Account-SaveProfile --json',
  ];

  static flags = {...BaseCommand.baseFlags};

  protected operations = {loadProjectIndex};

  async run(): Promise<{endpoint: IndexedEndpoint; issues: string[]}> {
    const {args} = await this.parse(ProjectEndpoint);
    const index = this.operations.loadProjectIndex(this.resolvedConfig.values.cartridges);
    const endpoints = controllerEndpoints(index);
    const endpoint = endpoints.find((e) => e.id.toLowerCase() === args.id.toLowerCase());
    if (!endpoint) {
      const needle = args.id.toLowerCase();
      const similar = endpoints.filter((e) => e.id.toLowerCase().includes(needle.split('-')[0])).slice(0, 8);
      this.error(t('commands.project.endpoint.notFound', 'Endpoint "{{id}}" not found.', {id: args.id}), {
        suggestions:
          similar.length > 0
            ? [`Did you mean: ${similar.map((e) => e.id).join(', ')}`]
            : ['List endpoints with: b2c project endpoints'],
      });
    }
    const issues = endpointIssues(endpoint);
    if (this.jsonEnabled()) return {endpoint, issues};

    const methods = endpoint.methods.includes('ANY') ? 'any method' : endpoint.methods.join('/');
    ux.stdout(ux.colorize('bold', `${endpoint.id}`) + ` (${endpoint.kind === 'sfra' ? 'SFRA' : 'SiteGenesis'})`);
    ux.stdout(`  Served by:  ${displayPath(index, endpoint.cartridge, endpoint.relPath, endpoint.line)}`);
    ux.stdout(
      `  Accepts:    ${methods} · HTTPS ${endpoint.https ? 'required' : 'not required'} · login ${endpoint.loginRequired ? 'required' : 'not required'} · CSRF ${endpoint.csrf}`,
    );
    for (const issue of issues) ux.stdout(ux.colorize('yellow', `  ⚠ ${issue}`));

    if (endpoint.kind === 'sg-controller') {
      ux.stdout(`  Guard:      guard.ensure([${(endpoint.filters ?? []).map((f) => `'${f}'`).join(', ')}])`);
      return {endpoint, issues};
    }

    ux.stdout('');
    ux.stdout(t('commands.project.endpoint.runs', 'Runs (in order):'));
    for (const [i, m] of (endpoint.chain ?? []).entries()) {
      const label =
        m.id === 'function'
          ? 'Handler'
          : `${middlewareLabel(m.id)}${middlewareLabel(m.id) === m.id ? '' : ` (${m.id})`}`;
      const origin = [m.via, m.cartridge].filter(Boolean).join(' · ');
      const impl = m.source ? `  → ${displayPath(index, m.source.cartridge, m.source.relPath)}` : '';
      ux.stdout(
        `  ${String(i + 1).padStart(2)}. ${label.padEnd(44)} ${origin.padEnd(28)} ${displayPath(index, m.cartridge, m.relPath, m.line)}${impl}`,
      );
    }

    ux.stdout('');
    ux.stdout(t('commands.project.endpoint.definedBy', 'Defined by:'));
    for (const step of endpoint.steps ?? []) {
      const lost = (step.dropped ?? []).map((id) => securityRole(id) ?? id);
      const note = lost.length > 0 ? ux.colorize('yellow', `  dropped: ${lost.join(', ')}`) : '';
      ux.stdout(
        `  server.${step.method.padEnd(8)} ${step.cartridge.padEnd(28)} ${displayPath(index, step.cartridge, step.relPath, step.line)}${note}`,
      );
    }
    return {endpoint, issues};
  }
}
