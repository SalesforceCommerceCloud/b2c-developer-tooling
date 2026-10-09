/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {deleteRedirectWithBackend} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';
import {confirm} from '../../../../prompts.js';

/**
 * Delete a redirect from an MRT environment.
 */
export default class MrtRedirectDelete extends MrtCommand<typeof MrtRedirectDelete> {
  static args = {
    identifier: Args.string({
      // Legacy keys a redirect by its source path (from_path); SCAPI keys it by
      // its UUID. Accept whichever the resolved backend expects.
      description: 'Redirect identifier: the source path (legacy) or the redirect UUID (SCAPI)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.mrt.redirect.delete.description', 'Delete a redirect from a Managed Runtime environment'),
    '/cli/mrt.html#b2c-mrt-env-redirect-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> /old-page --project my-storefront --environment staging',
    '<%= config.bin %> <%= command.id %> /old-page -p my-storefront -e staging --force',
    '<%= config.bin %> <%= command.id %> 3f9b1c2d-4e5f-6a7b-8c9d-0e1f2a3b4c5d -p my-storefront -e staging --mrt-backend scapi',
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
    deleteRedirectWithBackend,
  };

  async run(): Promise<{identifier: string; fromPath: string; deleted: boolean}> {
    // Prevent deletion in safe mode
    this.assertDestructiveOperationAllowed('delete redirect');

    const {identifier} = this.args;
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

    const {force} = this.flags;

    // Confirm deletion unless --force is specified
    if (!force && !this.jsonEnabled()) {
      const confirmed = await confirm(
        t('commands.mrt.redirect.delete.confirm', 'Are you sure you want to delete redirect "{{identifier}}"?', {
          identifier,
        }),
      );
      if (!confirmed) {
        this.log(t('commands.mrt.redirect.delete.cancelled', 'Deletion cancelled.'));
        // `fromPath` mirrors `identifier` for backward compatibility with scripts
        // that read the legacy `--json` key (the source path on legacy).
        return {identifier, fromPath: identifier, deleted: false};
      }
    }

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    this.log(t('commands.mrt.redirect.delete.deleting', 'Deleting redirect {{identifier}}...', {identifier}));

    await this.operations.deleteRedirectWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      environment,
      identifier,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Deleting redirect via backend'),
    });

    if (!this.jsonEnabled()) {
      this.log(t('commands.mrt.redirect.delete.success', 'Redirect {{identifier}} deleted.', {identifier}));
    }

    return {identifier, fromPath: identifier, deleted: true};
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
