/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {setEnvVarsWithBackend} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

/**
 * Set environment variables on an MRT project environment.
 */
export default class MrtEnvVarSet extends MrtCommand<typeof MrtEnvVarSet> {
  static args = {
    variables: Args.string({
      description: 'Environment variables in KEY=value format',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.mrt.env.var.set.description', 'Set environment variables on a Managed Runtime environment'),
    '/cli/mrt.html#b2c-mrt-env-var-set',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> MY_VAR=value --project acme-storefront --environment production',
    '<%= config.bin %> <%= command.id %> API_KEY=secret DEBUG=true -p my-project -e staging',
    '<%= config.bin %> <%= command.id %> "MESSAGE=hello world" -p my-project -e production',
    '<%= config.bin %> <%= command.id %> API_KEY=secret -p my-project -e staging --mrt-backend scapi',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  // Allow multiple arguments
  static strict = false;

  protected operations = {
    setEnvVarsWithBackend,
  };

  async run(): Promise<{variables: Record<string, string>; project: string; environment: string}> {
    const {argv} = await this.parse(MrtEnvVarSet);
    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }
    if (!environment) {
      this.error(
        'MRT environment is required. Provide --environment flag, set MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }

    // Parse KEY=value arguments
    const variables: Record<string, string> = {};
    const keys: string[] = [];

    for (const arg of argv as string[]) {
      const eqIndex = arg.indexOf('=');
      if (eqIndex === -1) {
        this.error(
          t('commands.mrt.env.var.set.invalidFormat', 'Invalid format: {{arg}}. Use KEY=value format.', {arg}),
        );
      }

      const key = arg.slice(0, eqIndex);
      const value = arg.slice(eqIndex + 1);

      if (!key) {
        this.error(t('commands.mrt.env.var.set.emptyKey', 'Empty key in: {{arg}}', {arg}));
      }

      variables[key] = value;
      keys.push(key);
    }

    if (keys.length === 0) {
      this.error(t('commands.mrt.env.var.set.noVariables', 'No environment variables provided. Use KEY=value format.'));
    }

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    // The resolved backend is surfaced via `onResolve` (debug log) only — it is
    // deliberately kept out of the `--json` payload so the legacy `--json`
    // output stays byte-identical and matches `mrt env var list` / `bundle deploy`.
    await this.operations.setEnvVarsWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      environment,
      variables,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (resolved) =>
        this.logger.debug({backend: resolved}, '[MRT] Setting environment variables via backend'),
    });

    // Under --json, emit only the result object: the human success message
    // routes through the logger (stderr) and would otherwise interleave with the
    // JSON. Mirrors `mrt env var list` / `mrt bundle deploy`.
    if (!this.jsonEnabled()) {
      if (keys.length === 1) {
        this.log(
          t('commands.mrt.env.var.set.successSingle', 'Set {{key}} on {{project}}/{{environment}}', {
            key: keys[0],
            project,
            environment,
          }),
        );
      } else {
        this.log(
          t('commands.mrt.env.var.set.successMultiple', 'Set {{count}} variables on {{project}}/{{environment}}', {
            count: keys.length,
            project,
            environment,
          }),
        );
      }
    }

    return {variables, project, environment};
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
