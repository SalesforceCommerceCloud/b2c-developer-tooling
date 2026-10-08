/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {deleteEnvironmentWithBackend} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';
import {confirm} from '../../../prompts.js';

/**
 * Delete an environment (target) from a Managed Runtime project.
 */
export default class MrtEnvDelete extends MrtCommand<typeof MrtEnvDelete> {
  static args = {
    slug: Args.string({
      description: 'Environment slug/identifier to delete (or provide it via --environment / -e)',
      required: false,
    }),
  };

  static description = withDocs(
    t('commands.mrt.env.delete.description', 'Delete a Managed Runtime environment'),
    '/cli/mrt.html#b2c-mrt-env-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> feature-test --project my-storefront',
    '<%= config.bin %> <%= command.id %> old-staging -p my-storefront --force',
    '<%= config.bin %> <%= command.id %> old-staging -p my-storefront --mrt-backend scapi',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  protected operations = {
    confirm,
    deleteEnvironmentWithBackend,
  };

  async run(): Promise<{slug: string; project: string; deleted: boolean}> {
    // Prevent deletion in safe mode
    this.assertDestructiveOperationAllowed('delete MRT environment');

    const slug = this.resolveEnvironmentSlug(this.args.slug);
    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const {force} = this.flags;

    // Confirm deletion unless --force is used
    if (!force && !this.jsonEnabled()) {
      const confirmed = await this.operations.confirm(
        t(
          'commands.mrt.env.delete.confirm',
          'Are you sure you want to delete environment "{{slug}}" from {{project}}?',
          {
            slug,
            project,
          },
        ),
      );

      if (!confirmed) {
        this.log(t('commands.mrt.env.delete.cancelled', 'Deletion cancelled.'));
        return {slug, project, deleted: false};
      }
    }

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    this.log(
      t('commands.mrt.env.delete.deleting', 'Deleting environment "{{slug}}" from {{project}}...', {slug, project}),
    );

    await this.operations.deleteEnvironmentWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      environment: slug,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Deleting environment via backend'),
    });

    this.log(
      t('commands.mrt.env.delete.success', 'Environment "{{slug}}" deleted from {{project}}.', {
        slug,
        project,
      }),
    );

    return {slug, project, deleted: true};
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
