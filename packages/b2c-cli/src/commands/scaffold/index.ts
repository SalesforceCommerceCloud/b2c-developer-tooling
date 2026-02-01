/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';
import {Args, Flags} from '@oclif/core';
import {checkbox, confirm, input, select} from '@inquirer/prompts';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  createScaffoldRegistry,
  evaluateCondition,
  generateFromScaffold,
  type Scaffold,
  type ScaffoldGenerateResult,
  type ScaffoldParameter,
} from '@salesforce/b2c-tooling-sdk/scaffold';
import {t, withDocs} from '../../i18n/index.js';

/**
 * Response type for the scaffold command.
 */
interface GenerateResponse {
  scaffold: string;
  outputDir: string;
  dryRun: boolean;
  files: Array<{
    path: string;
    action: string;
    skipReason?: string;
  }>;
  postInstructions?: string;
}

/**
 * Default scaffold command - shorthand for `scaffold generate`.
 *
 * This allows users to run `b2c scaffold cartridge` instead of
 * `b2c scaffold generate cartridge`.
 */
export default class ScaffoldIndex extends BaseCommand<typeof ScaffoldIndex> {
  static args = {
    scaffoldId: Args.string({
      description: 'Scaffold ID to generate',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.scaffold.index.description', 'Generate a project scaffold (shorthand for scaffold generate)'),
    '/cli/scaffold.html#b2c-scaffold',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> cartridge',
    '<%= config.bin %> <%= command.id %> cartridge --name app_custom',
    '<%= config.bin %> <%= command.id %> custom-api --option apiName=my-api',
    '<%= config.bin %> <%= command.id %> cartridge --dry-run',
  ];

  static flags = {
    'dry-run': Flags.boolean({
      description: 'Preview files without writing them',
      default: false,
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Skip prompts, use defaults, and overwrite existing files',
      default: false,
    }),
    name: Flags.string({
      char: 'n',
      description: 'Primary name parameter (shorthand for --option name=VALUE)',
    }),
    option: Flags.string({
      description: 'Parameter value in key=value format (can be repeated)',
      multiple: true,
    }),
    output: Flags.string({
      char: 'o',
      default: '.',
      description: 'Output directory (defaults to current directory)',
    }),
  };

  async run(): Promise<GenerateResponse> {
    const {scaffoldId} = this.args;
    const registry = createScaffoldRegistry();

    // Find the scaffold
    const scaffold = await registry.getScaffold(scaffoldId, {
      projectRoot: process.cwd(),
    });

    if (!scaffold) {
      this.error(t('commands.scaffold.generate.scaffoldNotFound', 'Scaffold not found: {{id}}', {id: scaffoldId}));
    }

    // Parse option flags into variables
    const variables = this.parseOptions();

    // Handle --name shorthand for the first string parameter
    if (this.flags.name) {
      const firstStringParam = scaffold.manifest.parameters.find((p) => p.type === 'string');
      if (firstStringParam) {
        variables[firstStringParam.name] = this.flags.name;
      }
    }

    // Collect missing parameters interactively (unless --force)
    const resolvedVariables = await this.collectParameters(scaffold, variables);

    const outputDir = path.resolve(this.flags.output);
    const dryRun = this.flags['dry-run'];
    const force = this.flags.force;

    if (dryRun) {
      this.log(t('commands.scaffold.generate.dryRun', 'Dry run - no files will be written'));
    }

    this.log(
      t('commands.scaffold.generate.generating', 'Generating {{scaffold}} scaffold...', {
        scaffold: scaffold.manifest.displayName,
      }),
    );

    // Generate the scaffold
    let result: ScaffoldGenerateResult;
    try {
      result = await generateFromScaffold(scaffold, {
        dryRun,
        force,
        outputDir,
        variables: resolvedVariables,
      });
    } catch (error) {
      this.error(
        t('commands.scaffold.generate.error', 'Failed to generate scaffold: {{message}}', {
          message: (error as Error).message,
        }),
      );
    }

    const response: GenerateResponse = {
      dryRun,
      files: result.files.map((f) => ({
        action: f.action,
        path: f.path,
        skipReason: f.skipReason,
      })),
      outputDir,
      postInstructions: result.postInstructions,
      scaffold: scaffoldId,
    };

    if (this.jsonEnabled()) {
      return response;
    }

    // Display results
    const created = result.files.filter((f) => f.action === 'created' || f.action === 'overwritten');
    const skipped = result.files.filter((f) => f.action === 'skipped');

    if (created.length > 0) {
      this.log('');
      this.log(
        t('commands.scaffold.generate.success', 'Successfully generated {{count}} file(s):', {
          count: created.length,
        }),
      );
      for (const file of created) {
        this.log(`  ${file.action === 'overwritten' ? '(overwritten)' : '+'} ${file.path}`);
      }
    }

    if (skipped.length > 0) {
      this.log('');
      this.log(t('commands.scaffold.generate.skipped', 'Skipped {{count}} file(s):', {count: skipped.length}));
      for (const file of skipped) {
        this.log(`  - ${file.path}${file.skipReason ? ` (${file.skipReason})` : ''}`);
      }
    }

    // Show post-instructions
    if (result.postInstructions) {
      this.log('');
      this.log(result.postInstructions);
    }

    return response;
  }

  /**
   * Collect missing parameters interactively.
   */
  private async collectParameters(
    scaffold: Scaffold,
    existingVariables: Record<string, boolean | string | string[]>,
  ): Promise<Record<string, boolean | string | string[]>> {
    const variables = {...existingVariables};
    const force = this.flags.force;
    const isTTY = process.stdin.isTTY && process.stdout.isTTY;
    const interactive = !force && isTTY;

    for (const param of scaffold.manifest.parameters) {
      // Check if conditional parameter should be evaluated
      if (param.when && !evaluateCondition(param.when, variables)) {
        continue;
      }

      // Skip if already provided
      if (variables[param.name] !== undefined) {
        continue;
      }

      // Use default if not interactive
      if (!interactive) {
        if (param.default !== undefined) {
          variables[param.name] = param.default;
        } else if (param.required) {
          this.error(`Missing required parameter: ${param.name}`);
        }
        continue;
      }

      // Prompt for value (sequential prompting is intentional)
      // eslint-disable-next-line no-await-in-loop
      const value = await this.promptForParameter(param);
      if (value !== undefined) {
        variables[param.name] = value;
      }
    }

    return variables;
  }

  /**
   * Parse --option flags into a variables object.
   */
  private parseOptions(): Record<string, boolean | string | string[]> {
    const variables: Record<string, boolean | string | string[]> = {};
    const options = this.flags.option || [];

    for (const opt of options) {
      const eqIndex = opt.indexOf('=');
      if (eqIndex === -1) {
        // Treat as boolean true
        variables[opt] = true;
      } else {
        const key = opt.slice(0, Math.max(0, eqIndex));
        const value = opt.slice(Math.max(0, eqIndex + 1));
        // Handle boolean strings
        if (value === 'true') {
          variables[key] = true;
        } else if (value === 'false') {
          variables[key] = false;
        } else {
          variables[key] = value;
        }
      }
    }

    return variables;
  }

  /**
   * Prompt for a single parameter value.
   */
  private async promptForParameter(param: ScaffoldParameter): Promise<boolean | string | string[] | undefined> {
    switch (param.type) {
      case 'boolean': {
        return confirm({
          default: param.default as boolean | undefined,
          message: param.prompt,
        });
      }

      case 'choice': {
        if (!param.choices || param.choices.length === 0) {
          return undefined;
        }
        return select({
          choices: param.choices.map((c) => ({
            name: c.label,
            value: c.value,
          })),
          default: param.default as string | undefined,
          message: param.prompt,
        });
      }

      case 'multi-choice': {
        if (!param.choices || param.choices.length === 0) {
          return [];
        }
        return checkbox({
          choices: param.choices.map((c) => ({
            name: c.label,
            value: c.value,
          })),
          message: param.prompt,
        });
      }

      case 'string': {
        const value = await input({
          default: param.default as string | undefined,
          message: param.prompt,
          required: param.required,
          validate(val) {
            if (param.required && !val) {
              return 'This field is required';
            }
            if (param.pattern && val) {
              const regex = new RegExp(param.pattern);
              if (!regex.test(val)) {
                return param.validationMessage || `Value does not match pattern: ${param.pattern}`;
              }
            }
            return true;
          },
        });
        return value || undefined;
      }

      default: {
        return undefined;
      }
    }
  }
}
