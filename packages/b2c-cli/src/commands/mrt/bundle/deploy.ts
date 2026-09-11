/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  pushBundle,
  deployMrtBundle,
  waitForEnv,
  waitForDeploymentScapi,
  DEFAULT_SSR_PARAMETERS,
  type PushResult,
  type MrtEnvironment,
  type ScapiMrtConnection,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';
import {
  parseGlobPatterns,
  parseSsrParams,
  isMrtAuthError,
  MRT_PROJECT_SUGGESTION,
} from '../../../utils/mrt/bundle-flags.js';

/** A completed SCAPI deployment, as returned by the by-ID poll on `--wait`. */
type ScapiDeploymentResult = Awaited<ReturnType<typeof waitForDeploymentScapi>>;

/**
 * Deploy a bundle to Managed Runtime.
 *
 * Without bundleId: Creates a bundle from the local build directory and uploads it.
 * Optionally deploys to a target environment if --environment is specified.
 * The local-build path is legacy-pinned (bundle upload is not part of the SCAPI
 * MRT surface yet), so it runs against the MRT Cloud API regardless of backend.
 *
 * With bundleId: Deploys an existing bundle to the specified environment. This
 * path is backend-aware — it honors `--mrt-backend` (auto/legacy/scapi).
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
    '<%= config.bin %> <%= command.id %> 12345 --project my-storefront --environment staging --wait',
    '<%= config.bin %> <%= command.id %> 12345 -p my-storefront -e staging --mrt-backend scapi --wait',
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
      description: 'Glob patterns for server-only files (comma-separated or JSON array, only for local builds)',
    }),
    'ssr-shared': Flags.string({
      description: 'Glob patterns for shared files (comma-separated or JSON array, only for local builds)',
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
    wait: Flags.boolean({
      char: 'w',
      description: 'Wait for the deployment to complete before returning',
      default: false,
    }),
    'poll-interval': Flags.integer({
      description: 'Polling interval in seconds when using --wait',
      default: 30,
      dependsOn: ['wait'],
    }),
    timeout: Flags.integer({
      description: 'Maximum time to wait in seconds when using --wait (0 for no timeout)',
      default: 600,
      dependsOn: ['wait'],
    }),
  };

  protected operations = {
    pushBundle,
    deployMrtBundle,
    waitForEnv,
    waitForDeploymentScapi,
  };

  async run(): Promise<unknown> {
    const {bundleId} = this.args;

    if (bundleId !== undefined) {
      return this.deployExistingBundle(bundleId);
    }
    return this.pushLocalBuild();
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }

  /**
   * Deploy an existing bundle to an environment. Backend-aware: honors
   * `--mrt-backend` and, on `--wait`, polls whichever backend served the deploy.
   *
   * Returns the backend's native response so `--json` stays backend-specific:
   * without `--wait`, the raw create result (legacy MRT Cloud API / SCAPI
   * Storefront Deployments); with `--wait`, the polled environment (legacy) or
   * completed deployment (SCAPI).
   */
  private async deployExistingBundle(bundleId: number): Promise<unknown> {
    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }
    if (!environment) {
      this.error(
        'MRT environment is required when deploying an existing bundle. Provide --environment flag, set MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.mrt.bundle.deploy.deploying', 'Deploying bundle {{bundleId}} to {{project}}/{{environment}}...', {
          bundleId,
          project,
          environment,
        }),
      );
    }

    try {
      const result = await this.operations.deployMrtBundle({
        preference,
        scapiConnection,
        legacyAuth,
        projectSlug: project,
        targetSlug: environment,
        bundleId,
        origin: this.resolvedConfig.values.mrtOrigin,
        onResolve: (backend) => this.logger.debug({backend}, '[MRT] Deploying bundle via backend'),
      });

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
        if (!this.flags.wait) {
          this.log(
            t(
              'commands.mrt.bundle.deploy.note',
              'Note: Deployments are asynchronous. Use "b2c mrt env get" or the Runtime Admin dashboard to check status.',
            ),
          );
        }
      }

      for (const w of result.warnings ?? []) this.warn(w);

      if (this.flags.wait) {
        if (result.backend === 'scapi') {
          if (result.deploymentId) {
            return this.waitForScapiDeploymentById(scapiConnection!, project, environment, result.deploymentId);
          }
          this.warn(
            '--wait was specified but the SCAPI deployment did not return a deployment ID; cannot poll for completion.',
          );
          return result.raw;
        }
        return this.waitForDeployment(project, environment);
      }

      return result.raw;
    } catch (error) {
      if (error instanceof Error) {
        const message = t('commands.mrt.bundle.deploy.deployFailed', 'Failed to create deployment: {{message}}', {
          message: error.message,
        });
        // `MRT_PROJECT_SUGGESTION` points at `b2c mrt project list`, a legacy MRT
        // Cloud API command — only relevant when the legacy backend served the
        // request. Under explicit `--mrt-backend scapi` the failure is a SCAPI
        // one, so appending it would send the user down the wrong path.
        if (isMrtAuthError(error) && preference !== 'scapi') {
          this.error(`${message}\n\n${MRT_PROJECT_SUGGESTION}`);
        }
        this.error(message);
      }
      throw error;
    }
  }

  /**
   * Push a local build to create a new bundle. Legacy-pinned: bundle upload is
   * not part of the SCAPI MRT surface, so a single command never mixes
   * backends. Explicit `--mrt-backend scapi` errors here; `auto` warns and
   * proceeds on the legacy MRT Cloud API.
   */
  private async pushLocalBuild(): Promise<MrtEnvironment | PushResult> {
    this.guardUnsupportedByScapiMrt('pushing a local build');
    this.requireMrtCredentials();

    const {mrtProject: project, mrtEnvironment: target} = this.resolvedConfig.values;
    const {message} = this.flags;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const buildDir = this.flags['build-dir'];
    const ssrOnly = this.flags['ssr-only'] ? parseGlobPatterns(this.flags['ssr-only']) : undefined;
    const ssrShared = this.flags['ssr-shared'] ? parseGlobPatterns(this.flags['ssr-shared']) : undefined;

    // Build SSR parameters from flags
    const ssrParameters: Record<string, unknown> = parseSsrParams(this.flags['ssr-param']);

    // --node-version is a convenience flag for SSRFunctionNodeVersion
    if (this.flags['node-version']) {
      ssrParameters.SSRFunctionNodeVersion = this.flags['node-version'];
    }

    if (!this.jsonEnabled()) {
      this.log(t('commands.mrt.bundle.deploy.pushing', 'Pushing bundle to {{project}}...', {project}));

      if (target) {
        this.log(
          t('commands.mrt.bundle.deploy.willDeploy', 'Bundle will be deployed to {{environment}}', {
            environment: target,
          }),
        );
      }
    }

    try {
      const result = await this.operations.pushBundle(
        {
          projectSlug: project,
          target,
          message,
          buildDirectory: buildDir,
          projectDirectory: this.resolvedConfig.values.projectDirectory,
          ssrOnly,
          ssrShared,
          ssrParameters,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      // Consolidated success output
      if (!this.jsonEnabled()) {
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
      }

      for (const w of result.warnings ?? []) this.warn(w);

      if (this.flags.wait) {
        if (!target) {
          this.warn('--wait was specified but no environment target was provided. Skipping wait.');
          return result;
        }
        return this.waitForDeployment(project, target);
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        const message = t('commands.mrt.bundle.deploy.pushFailed', 'Push failed: {{message}}', {
          message: error.message,
        });
        if (isMrtAuthError(error)) {
          this.error(`${message}\n\n${MRT_PROJECT_SUGGESTION}`);
        }
        this.error(message);
      }
      throw error;
    }
  }

  /**
   * Wait for a legacy deployment to complete by polling the environment state.
   */
  private async waitForDeployment(project: string, environment: string): Promise<MrtEnvironment> {
    if (!this.jsonEnabled()) {
      this.log(
        t('commands.mrt.bundle.deploy.waiting', 'Waiting for deployment to complete on {{environment}}...', {
          environment,
        }),
      );
    }

    const envResult = await this.operations.waitForEnv(
      {
        projectSlug: project,
        slug: environment,
        origin: this.resolvedConfig.values.mrtOrigin,
        pollIntervalSeconds: this.flags['poll-interval'],
        timeoutSeconds: this.flags.timeout,
        onPoll: (info) => {
          if (!this.jsonEnabled()) {
            this.log(
              t('commands.mrt.bundle.deploy.state', '[{{elapsed}}s] State: {{state}}', {
                elapsed: String(info.elapsedSeconds),
                state: info.state,
              }),
            );
          }
        },
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.mrt.bundle.deploy.deployComplete', 'Deployment complete. Environment is {{state}}.', {
          state: envResult.state ?? 'unknown',
        }),
      );
    }

    return envResult;
  }

  /**
   * Wait for a SCAPI deployment to complete by polling it by ID (the backend
   * that served a SCAPI deploy pins this strategy).
   */
  private async waitForScapiDeploymentById(
    conn: ScapiMrtConnection,
    storefrontId: string,
    environmentId: string,
    deploymentId: string,
  ): Promise<ScapiDeploymentResult> {
    if (!this.jsonEnabled()) {
      this.log(
        t('commands.mrt.bundle.deploy.waiting', 'Waiting for deployment to complete on {{environment}}...', {
          environment: environmentId,
        }),
      );
    }

    const deployment = await this.operations.waitForDeploymentScapi(conn, {
      storefrontId,
      environmentId,
      deploymentId,
      pollIntervalSeconds: this.flags['poll-interval'],
      timeoutSeconds: this.flags.timeout,
      onPoll: (info) => {
        if (!this.jsonEnabled()) {
          const pct = typeof info.percentage === 'number' ? ` (${info.percentage}%)` : '';
          const desc = info.description ? ` — ${info.description}` : '';
          this.log(
            t('commands.mrt.bundle.deploy.scapiState', '[{{elapsed}}s] Status: {{status}}{{detail}}', {
              elapsed: String(info.elapsedSeconds),
              status: info.status,
              detail: `${pct}${desc}`,
            }),
          );
        }
      },
    });

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.mrt.bundle.deploy.scapiDeployComplete', 'Deployment complete. Status: {{status}}.', {
          status: deployment.status ?? 'unknown',
        }),
      );
    }

    return deployment;
  }
}
