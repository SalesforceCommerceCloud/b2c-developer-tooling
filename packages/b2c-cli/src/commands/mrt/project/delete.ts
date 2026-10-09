/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {deleteProjectWithBackend} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';
import {confirm} from '../../../prompts.js';

/**
 * Delete result for JSON output.
 */
interface DeleteResult {
  slug: string;
  deleted: boolean;
}

/**
 * Delete an MRT project.
 */
export default class MrtProjectDelete extends MrtCommand<typeof MrtProjectDelete> {
  static aliases = ['mrt:storefront:delete'];

  static args = {
    slug: Args.string({
      description: 'Project slug (or provide it via --project / --storefront / -p / -s)',
      required: false,
    }),
  };

  static description = withDocs(
    t('commands.mrt.project.delete.description', 'Delete a Managed Runtime project'),
    '/cli/mrt.html#b2c-mrt-project-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> my-old-project',
    '<%= config.bin %> <%= command.id %> --project my-old-project --force',
    '<%= config.bin %> <%= command.id %> my-old-project --mrt-backend scapi --force',
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
    deleteProjectWithBackend,
  };

  async run(): Promise<DeleteResult> {
    // Prevent deletion in safe mode
    this.assertDestructiveOperationAllowed('delete MRT project');

    const slug = this.resolveProjectSlug(this.args.slug);
    const {force} = this.flags;

    // Confirm deletion unless --force is specified
    if (!force && !this.jsonEnabled()) {
      const confirmed = await confirm(
        t('commands.mrt.project.delete.confirm', 'Are you sure you want to delete project "{{slug}}"?', {slug}),
      );

      if (!confirmed) {
        this.log(t('commands.mrt.project.delete.cancelled', 'Deletion cancelled.'));
        return {slug, deleted: false};
      }
    }

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    this.log(t('commands.mrt.project.delete.deleting', 'Deleting project "{{slug}}"...', {slug}));

    // The resolved backend is surfaced via `onResolve` (debug log) only — it is
    // deliberately kept out of the `--json` payload so the legacy `--json`
    // output stays byte-identical and matches the rest of the MRT commands.
    await this.operations.deleteProjectWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: slug,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Deleting project via backend'),
    });

    this.log(t('commands.mrt.project.delete.success', 'Project "{{slug}}" deleted successfully.', {slug}));

    return {slug, deleted: true};
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
