/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  pushBundle,
  createDeployment,
  DEFAULT_SSR_PARAMETERS,
  type PushResult,
  type CreateDeploymentResult,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

/**
 * Parses SSR parameter flags into a key-value object.
 * Accepts format: key=value
 */
function parseSsrParams(params: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const param of params) {
    const eqIndex = param.indexOf('=');
    if (eqIndex === -1) {
      throw new Error(`Invalid SSR parameter format: "${param}". Expected key=value format.`);
    }
    const key = param.slice(0, eqIndex);
    const value = param.slice(eqIndex + 1);
    result[key] = value;
  }
  return result;
}

type DeployResult = CreateDeploymentResult | PushResult;

/**
 * Deploy a bundle to Managed Runtime.
 *
 * Without bundleId: Creates a bundle from the local build directory and uploads it.
 * Optionally deploys to a target environment if --environment is specified.
 *
 * With bundleId: Deploys an existing bundle to the specified environment.
 */
export default class MrtBundleDeploy extends MrtCommand<typeof MrtBundleDeploy> {
  static args = {
    bundleId: Args.integer({
      description: 'Bundle ID to deploy (omit to push local build)',
      required: false,
    }),
  };

  static description = withDocs(
    t('commands.mrt.bundle.deploy.description', 'Push a local build or deploy an existing bundle to Managed Runtime'),
    '/cli/mrt.html#b2c-mrt-bundle-deploy',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront',
    '<%= config.bin %> <%= command.id %> --project my-storefront --environment staging',
    '<%= config.bin %> <%= command.id %> --project my-storefront --environment production --message "Release v1.0.0"',
    '<%= config.bin %> <%= command.id %> --project my-storefront --build-dir ./dist',
    '<%= config.bin %> <%= command.id %> --project my-storefront --node-version 20.x',
    '<%= config.bin %> <%= command.id %> --project my-storefront --ssr-param SSRProxyPath=/api',
    '<%= config.bin %> <%= command.id %> 12345 --project my-storefront --environment staging',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    message: Flags.string({
      char: 'm',
      description: 'Bundle message/description (only for local builds)',
    }),
    'build-dir': Flags.string({
      char: 'b',
      description: 'Path to the build directory (only for local builds)',
      default: 'build',
    }),
    'ssr-only': Flags.string({
      description: 'Glob patterns for server-only files (comma-separated, only for local builds)',
      default: 'ssr.js,ssr.mjs,server/**/*',
    }),
    'ssr-shared': Flags.string({
      description: 'Glob patterns for shared files (comma-separated, only for local builds)',
      default: 'static/**/*,client/**/*',
    }),
    'node-version': Flags.string({
      char: 'n',
      description: `Node.js version for SSR runtime (default: ${DEFAULT_SSR_PARAMETERS.SSRFunctionNodeVersion}, only for local builds)`,
    }),
    'ssr-param': Flags.string({
      description: 'SSR parameter in key=value format (can be specified multiple times, only for local builds)',
      multiple: true,
      default: [],
    }),
  };

  async run(): Promise<DeployResult> {
    this.requireMrtCredentials();

    const {bundleId} = this.args;

    if (bundleId !== undefined) {
      return this.deployExistingBundle(bundleId);
    }
    return this.pushLocalBuild();
  }

  /**
   * Deploy an existing bundle to an environment.
   */
  private async deployExistingBundle(bundleId: number): Promise<CreateDeploymentResult> {
    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }
    if (!environment) {
      this.error(
        'MRT environment is required when deploying an existing bundle. Provide --environment flag, set SFCC_MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }

    this.log(
      t('commands.mrt.bundle.deploy.deploying', 'Deploying bundle {{bundleId}} to {{project}}/{{environment}}...', {
        bundleId,
        project,
        environment,
      }),
    );

    try {
      const result = await createDeployment(
        {
          projectSlug: project,
          targetSlug: environment,
          bundleId,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(
          t(
            'commands.mrt.bundle.deploy.deploySuccess',
            'Deployment started. Bundle {{bundleId}} is being deployed to {{environment}}.',
            {
              bundleId,
              environment,
            },
          ),
        );
        this.log(
          t(
            'commands.mrt.bundle.deploy.note',
            'Note: Deployments are asynchronous. Use "b2c mrt env get" or the Runtime Admin dashboard to check status.',
          ),
        );
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.bundle.deploy.deployFailed', 'Failed to create deployment: {{message}}', {
            message: error.message,
          }),
        );
      }
      throw error;
    }
  }

  /**
   * Push a local build to create a new bundle.
   */
  private async pushLocalBuild(): Promise<PushResult> {
    const {mrtProject: project, mrtEnvironment: target} = this.resolvedConfig.values;
    const {message} = this.flags;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const buildDir = this.flags['build-dir'];
    const ssrOnly = this.flags['ssr-only'].split(',').map((s) => s.trim());
    const ssrShared = this.flags['ssr-shared'].split(',').map((s) => s.trim());

    // Build SSR parameters from flags
    const ssrParameters: Record<string, unknown> = parseSsrParams(this.flags['ssr-param']);

    // --node-version is a convenience flag for SSRFunctionNodeVersion
    if (this.flags['node-version']) {
      ssrParameters.SSRFunctionNodeVersion = this.flags['node-version'];
    }

    this.log(t('commands.mrt.bundle.deploy.pushing', 'Pushing bundle to {{project}}...', {project}));

    if (target) {
      this.log(
        t('commands.mrt.bundle.deploy.willDeploy', 'Bundle will be deployed to {{environment}}', {environment: target}),
      );
    }

    try {
      const result = await pushBundle(
        {
          projectSlug: project,
          target,
          message,
          buildDirectory: buildDir,
          ssrOnly,
          ssrShared,
          ssrParameters,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      // Consolidated success output
      const deployedMsg = result.deployed && result.target ? ` and deployed to ${result.target}` : '';
      this.log(
        t(
          'commands.mrt.bundle.deploy.pushSuccess',
          'Bundle #{{bundleId}} pushed to {{project}}{{deployed}} ({{message}})',
          {
            bundleId: String(result.bundleId),
            project: result.projectSlug,
            deployed: deployedMsg,
            message: result.message,
          },
        ),
      );

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(t('commands.mrt.bundle.deploy.pushFailed', 'Push failed: {{message}}', {message: error.message}));
      }
      throw error;
    }
  }
}
