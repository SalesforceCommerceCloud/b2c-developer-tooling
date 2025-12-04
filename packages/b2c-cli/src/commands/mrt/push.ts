import {Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling/cli';
import {pushBundle, DEFAULT_SSR_PARAMETERS, type PushResult} from '@salesforce/b2c-tooling/operations/mrt';
import {t} from '../../i18n/index.js';

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

/**
 * Push a bundle to Managed Runtime.
 *
 * Creates a bundle from the build directory and uploads it to the specified
 * MRT project. Optionally deploys the bundle to a target environment.
 */
export default class MrtPush extends MrtCommand<typeof MrtPush> {
  static description = t('commands.mrt.push.description', 'Push a bundle to Managed Runtime');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront',
    '<%= config.bin %> <%= command.id %> --project my-storefront --environment staging',
    '<%= config.bin %> <%= command.id %> --project my-storefront --environment production --message "Release v1.0.0"',
    '<%= config.bin %> <%= command.id %> --project my-storefront --build-dir ./dist',
    '<%= config.bin %> <%= command.id %> --project my-storefront --node-version 20.x',
    '<%= config.bin %> <%= command.id %> --project my-storefront --ssr-param SSRProxyPath=/api',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    project: Flags.string({
      char: 'p',
      description: 'MRT project slug',
      required: true,
    }),
    environment: Flags.string({
      char: 'e',
      description: 'Environment to deploy to after push (e.g., staging, production)',
    }),
    message: Flags.string({
      char: 'm',
      description: 'Bundle message/description',
    }),
    'build-dir': Flags.string({
      char: 'b',
      description: 'Path to the build directory',
      default: 'build',
    }),
    'ssr-only': Flags.string({
      description: 'Glob patterns for server-only files (comma-separated)',
      default: 'ssr.js,server/**/*',
    }),
    'ssr-shared': Flags.string({
      description: 'Glob patterns for shared files (comma-separated)',
      default: 'static/**/*,client/**/*',
    }),
    'node-version': Flags.string({
      char: 'n',
      description: `Node.js version for SSR runtime (default: ${DEFAULT_SSR_PARAMETERS.SSRFunctionNodeVersion})`,
    }),
    'ssr-param': Flags.string({
      description: 'SSR parameter in key=value format (can be specified multiple times)',
      multiple: true,
      default: [],
    }),
  };

  async run(): Promise<PushResult> {
    this.requireMrtCredentials();

    const {project, environment: target, message} = this.flags;
    const buildDir = this.flags['build-dir'];
    const ssrOnly = this.flags['ssr-only'].split(',').map((s) => s.trim());
    const ssrShared = this.flags['ssr-shared'].split(',').map((s) => s.trim());

    // Build SSR parameters from flags
    const ssrParameters: Record<string, unknown> = parseSsrParams(this.flags['ssr-param']);

    // --node-version is a convenience flag for SSRFunctionNodeVersion
    if (this.flags['node-version']) {
      ssrParameters.SSRFunctionNodeVersion = this.flags['node-version'];
    }

    this.log(t('commands.mrt.push.pushing', 'Pushing bundle to {{project}}...', {project}));

    if (target) {
      this.log(t('commands.mrt.push.willDeploy', 'Bundle will be deployed to {{environment}}', {environment: target}));
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
        },
        this.getMrtAuth(),
      );

      // Consolidated success output
      const deployedMsg = result.deployed && result.target ? ` and deployed to ${result.target}` : '';
      this.log(
        t('commands.mrt.push.success', 'Bundle #{{bundleId}} pushed to {{project}}{{deployed}} ({{message}})', {
          bundleId: String(result.bundleId),
          project: result.projectSlug,
          deployed: deployedMsg,
          message: result.message,
        }),
      );

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(t('commands.mrt.push.failed', 'Push failed: {{message}}', {message: error.message}));
      }
      throw error;
    }
  }
}
