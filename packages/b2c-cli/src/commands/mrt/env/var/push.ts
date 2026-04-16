/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {parseEnv} from 'node:util';
import {Flags, ux} from '@oclif/core';
import {confirm} from '@inquirer/prompts';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {listEnvVars, setEnvVar, setEnvVars} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';
import {filterByPrefix, computeEnvVarDiff, formatEnvVarDiffSummary} from '../../../../utils/mrt/env-var-diff.js';

/**
 * Push local .env file variables to an MRT project environment.
 *
 * Environment variables read:
 *   MRT_PROJECT       (optional) - MRT project slug, overridden by --project flag
 *   MRT_ENVIRONMENT   (optional) - MRT environment, overridden by --environment flag
 */
export default class MrtEnvVarPush extends MrtCommand<typeof MrtEnvVarPush> {
  static description = withDocs(
    t('commands.mrt.env.var.push.description', 'Push local .env file variables to a Managed Runtime environment'),
    '/cli/mrt.html#b2c-mrt-env-var-push',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project acme-storefront --environment production',
    '<%= config.bin %> <%= command.id %> -p my-project -e staging --yes',
    '<%= config.bin %> <%= command.id %> --file config/.env --exclude-prefix INTERNAL_ -p my-project -e staging',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    file: Flags.string({
      char: 'f',
      description: t('commands.mrt.env.var.push.fileFlag', 'Path to the .env file to push'),
      default: '.env',
    }),
    'exclude-prefix': Flags.string({
      description: t(
        'commands.mrt.env.var.push.excludePrefixFlag',
        'Exclude variables whose keys start with this prefix (repeatable)',
      ),
      multiple: true,
      default: ['MRT_'],
    }),
    yes: Flags.boolean({
      char: 'y',
      description: t('commands.mrt.env.var.push.yesFlag', 'Skip confirmation prompt'),
      default: false,
    }),
  };

  protected operations = {
    listEnvVars,
    setEnvVar,
    setEnvVars,
    readEnvFile: (path: string): string => readFileSync(path, 'utf8'),
  };

  async run(): Promise<{pushed: number; failed: number; skipped: number}> {
    const {flags} = await this.parse(MrtEnvVarPush);
    const envFilePath = resolve(flags.file);

    // Step 1: Read and parse .env file
    let rawContent: string;
    try {
      rawContent = this.operations.readEnvFile(envFilePath);
    } catch (error_) {
      const error = error_ as NodeJS.ErrnoException;
      if (error.code === 'ENOENT') {
        this.error(t('commands.mrt.env.var.push.fileNotFound', '.env file not found: {{path}}', {path: envFilePath}));
      }
      throw error_;
    }

    const parsed = parseEnv(rawContent);

    // Step 2: Filter out excluded prefixes
    const localVars = filterByPrefix(
      new Map(Object.entries(parsed).filter((e): e is [string, string] => e[1] !== undefined)),
      flags['exclude-prefix'],
    );

    // Step 3: Validate MRT target
    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        t(
          'commands.mrt.env.var.push.missingProject',
          'MRT project is required. Provide --project flag, set MRT_PROJECT, or set mrtProject in dw.json.',
        ),
      );
    }
    if (!environment) {
      this.error(
        t(
          'commands.mrt.env.var.push.missingEnvironment',
          'MRT environment is required. Provide --environment flag, set MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
        ),
      );
    }

    // Step 4: Fetch current remote env vars
    this.requireMrtCredentials();
    const {mrtOrigin: origin} = this.resolvedConfig.values;
    const auth = this.getMrtAuth();

    ux.stdout(
      t('commands.mrt.env.var.push.fetching', 'Fetching remote env vars for {{project}}/{{environment}}...', {
        project,
        environment,
      }),
    );
    const {variables: remoteVariables} = await this.operations.listEnvVars(
      {projectSlug: project, environment, origin},
      auth,
    );
    const remoteVars = new Map(remoteVariables.map((v) => [v.name, v.value]));

    // Step 5: Compute diff
    const diff = computeEnvVarDiff(localVars, remoteVars);
    const toSync = [...diff.add, ...diff.update];

    // Step 6: Display summary
    ux.stdout('');
    ux.stdout(formatEnvVarDiffSummary(diff));

    if (toSync.length === 0) {
      return {pushed: 0, failed: 0, skipped: diff.remoteOnly.length};
    }

    // Step 7: Confirm unless --yes
    if (!flags.yes) {
      const message = t(
        'commands.mrt.env.var.push.confirm',
        'Push {{count}} variable(s) ({{add}} new, {{update}} updated) to {{project}}/{{environment}}?',
        {
          count: toSync.length,
          add: diff.add.length,
          update: diff.update.length,
          project,
          environment,
        },
      );
      const confirmed = await confirm({message, default: false});
      if (!confirmed) {
        ux.stdout(t('commands.mrt.env.var.push.aborted', 'Aborted.'));
        return {pushed: 0, failed: 0, skipped: diff.remoteOnly.length};
      }
    }

    // Step 8: Push variables — try batch first, fall back to individual calls
    let pushed = 0;
    let failed = 0;

    const baseParams = {projectSlug: project, environment, origin};

    try {
      const variables = Object.fromEntries(toSync.map(({key, value}) => [key, value]));
      await this.operations.setEnvVars({...baseParams, variables}, auth);
      for (const {key} of toSync) {
        ux.stdout(t('commands.mrt.env.var.push.varSuccess', '  ✓ {{key}}', {key}));
      }
      pushed = toSync.length;
    } catch {
      this.warn(t('commands.mrt.env.var.push.batchFailed', 'Batch push failed, retrying variables individually...'));
      const results = await Promise.allSettled(
        toSync.map(({key, value}) => this.operations.setEnvVar({...baseParams, key, value}, auth)),
      );

      for (const [index, result] of results.entries()) {
        const {key} = toSync[index];
        if (result.status === 'fulfilled') {
          ux.stdout(t('commands.mrt.env.var.push.varSuccess', '  ✓ {{key}}', {key}));
          pushed++;
        } else {
          this.warn(
            t('commands.mrt.env.var.push.varFailed', '  ✗ {{key}}: {{message}}', {
              key,
              message: (result.reason as Error).message,
            }),
          );
          failed++;
        }
      }
    }

    // Step 9: Summary
    ux.stdout('');
    ux.stdout(
      t(
        'commands.mrt.env.var.push.summary',
        'Summary: {{pushed}} pushed, {{failed}} failed, {{skipped}} remote-only (not deleted)',
        {
          pushed,
          failed,
          skipped: diff.remoteOnly.length,
        },
      ),
    );

    return {pushed, failed, skipped: diff.remoteOnly.length};
  }
}
