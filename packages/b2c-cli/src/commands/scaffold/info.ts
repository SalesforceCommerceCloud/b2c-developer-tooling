/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, ux} from '@oclif/core';
import cliui from 'cliui';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createScaffoldRegistry, type ScaffoldManifest} from '@salesforce/b2c-tooling-sdk/scaffold';
import {t, withDocs} from '../../i18n/index.js';

/**
 * Response type for the info command.
 */
interface ScaffoldInfoResponse {
  id: string;
  source: string;
  manifest: ScaffoldManifest;
  path: string;
}

/**
 * Command to show detailed information about a scaffold.
 */
export default class ScaffoldInfo extends BaseCommand<typeof ScaffoldInfo> {
  static args = {
    scaffoldId: Args.string({
      description: 'Scaffold ID to get info for',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.scaffold.info.description', 'Show detailed information about a scaffold'),
    '/cli/scaffold.html#b2c-scaffold-info',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> cartridge',
    '<%= config.bin %> <%= command.id %> custom-api --json',
  ];

  async run(): Promise<ScaffoldInfoResponse> {
    const {scaffoldId} = this.args;
    const registry = createScaffoldRegistry();

    const scaffold = await registry.getScaffold(scaffoldId, {
      projectRoot: process.cwd(),
    });

    if (!scaffold) {
      this.error(t('commands.scaffold.info.scaffoldNotFound', 'Scaffold not found: {{id}}', {id: scaffoldId}));
    }

    const response: ScaffoldInfoResponse = {
      id: scaffold.id,
      source: scaffold.source,
      manifest: scaffold.manifest,
      path: scaffold.path,
    };

    if (this.jsonEnabled()) {
      return response;
    }

    // Display formatted output
    const ui = cliui({width: process.stdout.columns || 80});

    // Header
    ui.div({text: `\n${scaffold.manifest.displayName}`, padding: [0, 0, 0, 0]});
    ui.div({text: '='.repeat(scaffold.manifest.displayName.length), padding: [0, 0, 1, 0]});

    // Basic info
    ui.div({text: 'ID:', width: 15, padding: [0, 2, 0, 0]}, {text: scaffold.id});
    ui.div({text: 'Category:', width: 15, padding: [0, 2, 0, 0]}, {text: scaffold.manifest.category});
    ui.div({text: 'Source:', width: 15, padding: [0, 2, 0, 0]}, {text: scaffold.source});
    ui.div({text: 'Description:', width: 15, padding: [0, 2, 0, 0]}, {text: scaffold.manifest.description});

    if (scaffold.manifest.tags && scaffold.manifest.tags.length > 0) {
      ui.div({text: 'Tags:', width: 15, padding: [0, 2, 0, 0]}, {text: scaffold.manifest.tags.join(', ')});
    }

    // Parameters
    if (scaffold.manifest.parameters.length > 0) {
      ui.div({text: '\nParameters:', padding: [1, 0, 0, 0]});
      ui.div({text: '-'.repeat(11), padding: [0, 0, 1, 0]});

      for (const param of scaffold.manifest.parameters) {
        const required = param.required ? ' (required)' : '';
        const defaultVal = param.default === undefined ? '' : ` [default: ${param.default}]`;
        const conditional = param.when ? ` [when: ${param.when}]` : '';

        ui.div(
          {text: `  ${param.name}`, width: 25, padding: [0, 2, 0, 0]},
          {text: `${param.type}${required}${defaultVal}${conditional}`},
        );
        ui.div({text: '', width: 25, padding: [0, 2, 0, 0]}, {text: param.prompt});

        if (param.choices && param.choices.length > 0) {
          ui.div(
            {text: '', width: 25, padding: [0, 2, 0, 0]},
            {text: `Choices: ${param.choices.map((c) => c.value).join(', ')}`},
          );
        }
      }
    }

    // Usage example
    ui.div({text: '\nUsage:', padding: [1, 0, 0, 0]});
    ui.div({text: '------', padding: [0, 0, 1, 0]});

    const requiredParams = scaffold.manifest.parameters
      .filter((p) => p.required && !p.when)
      .map((p) => `--option ${p.name}=<value>`)
      .join(' ');

    ui.div({text: `  b2c scaffold generate ${scaffold.id} ${requiredParams}`, padding: [0, 0, 0, 0]});

    // Post instructions
    if (scaffold.manifest.postInstructions) {
      ui.div({text: '\nPost-generation instructions:', padding: [1, 0, 0, 0]});
      ui.div({text: '-----------------------------', padding: [0, 0, 1, 0]});
      ui.div({text: '  (shown after generation completes)', padding: [0, 0, 0, 0]});
    }

    ux.stdout(ui.toString());

    return response;
  }
}
