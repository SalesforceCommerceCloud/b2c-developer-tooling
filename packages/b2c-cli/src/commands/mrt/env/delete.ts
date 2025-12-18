import * as readline from 'node:readline';
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {deleteEnv} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t} from '../../../i18n/index.js';

/**
 * Simple confirmation prompt.
 */
async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  return new Promise((resolve) => {
    rl.question(`${message} `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Delete an environment (target) from a Managed Runtime project.
 */
export default class MrtEnvDelete extends MrtCommand<typeof MrtEnvDelete> {
  static args = {
    slug: Args.string({
      description: 'Environment slug/identifier to delete',
      required: true,
    }),
  };

  static description = t('commands.mrt.env.delete.description', 'Delete a Managed Runtime environment');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> feature-test --project my-storefront',
    '<%= config.bin %> <%= command.id %> old-staging -p my-storefront --force',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  async run(): Promise<{slug: string; project: string}> {
    this.requireMrtCredentials();

    const {slug} = this.args;
    const {mrtProject: project} = this.resolvedConfig;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const {force} = this.flags;

    // Confirm deletion unless --force is used
    if (!force && !this.jsonEnabled()) {
      const confirmed = await confirm(
        t(
          'commands.mrt.env.delete.confirm',
          'Are you sure you want to delete environment "{{slug}}" from {{project}}? (y/n)',
          {
            slug,
            project,
          },
        ),
      );

      if (!confirmed) {
        this.log(t('commands.mrt.env.delete.cancelled', 'Deletion cancelled.'));
        return {slug, project};
      }
    }

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.mrt.env.delete.deleting', 'Deleting environment "{{slug}}" from {{project}}...', {slug, project}),
      );
    }

    try {
      await deleteEnv(
        {
          projectSlug: project,
          slug,
          origin: this.resolvedConfig.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(
          t('commands.mrt.env.delete.success', 'Environment "{{slug}}" deleted from {{project}}.', {
            slug,
            project,
          }),
        );
      }

      return {slug, project};
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.env.delete.failed', 'Failed to delete environment: {{message}}', {message: error.message}),
        );
      }
      throw error;
    }
  }
}
