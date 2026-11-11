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
  /**
   * Which downstream resources will be preserved (SCAPI backend only). All
   * `false` means a full teardown — the historical default. A flag flips to
   * `true` here when the user passed its `--no-delete-*` form.
   */
  preserved: {
    mrtEnv: boolean;
    amSlasClients: boolean;
    ecdnRouting: boolean;
  };
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
    '<%= config.bin %> <%= command.id %> my-old-project --mrt-backend scapi --no-delete-mrt-env',
    '<%= config.bin %> <%= command.id %> my-old-project --mrt-backend scapi --no-delete-am-slas-clients --no-delete-ecdn-routing',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
    'delete-mrt-env': Flags.boolean({
      description:
        "Delete the project's Managed Runtime environments and deployments. SCAPI backend only. Default: true. " +
        'Pass --no-delete-mrt-env to preserve MRT resources after the project is removed.',
      default: true,
      allowNo: true,
    }),
    'delete-am-slas-clients': Flags.boolean({
      description:
        "Delete the project's Account Manager and SLAS clients. SCAPI backend only. Default: true. " +
        'Pass --no-delete-am-slas-clients to preserve the AM/SLAS clients after the project is removed.',
      default: true,
      allowNo: true,
    }),
    'delete-ecdn-routing': Flags.boolean({
      description:
        "Delete the project's eCDN routing. SCAPI backend only. Default: true. " +
        'Pass --no-delete-ecdn-routing to preserve eCDN routing after the project is removed.',
      default: true,
      allowNo: true,
    }),
  };

  protected operations = {
    deleteProjectWithBackend,
  };

  async run(): Promise<DeleteResult> {
    // Prevent deletion in safe mode
    this.assertDestructiveOperationAllowed('delete MRT project');

    const slug = this.resolveProjectSlug(this.args.slug);
    const {
      force,
      'delete-mrt-env': deleteMrtEnv,
      'delete-am-slas-clients': deleteAmSlasClients,
      'delete-ecdn-routing': deleteEcdnRouting,
    } = this.flags;

    const preserved = {
      mrtEnv: !deleteMrtEnv,
      amSlasClients: !deleteAmSlasClients,
      ecdnRouting: !deleteEcdnRouting,
    };

    // Confirm deletion unless --force is specified
    if (!force && !this.jsonEnabled()) {
      const confirmed = await confirm(this.buildConfirmPrompt(slug, preserved));

      if (!confirmed) {
        this.log(t('commands.mrt.project.delete.cancelled', 'Deletion cancelled.'));
        return {slug, deleted: false, preserved};
      }
    }

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    this.log(t('commands.mrt.project.delete.deleting', 'Deleting project "{{slug}}"...', {slug}));

    // The resolved backend is surfaced via `onResolve` (debug log) only — it is
    // deliberately kept out of the `--json` payload so the legacy `--json`
    // output stays byte-identical and matches the rest of the MRT commands.
    const {backend} = await this.operations.deleteProjectWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: slug,
      // Forward only opt-outs; when the user left the flag at its default
      // (true) we omit it so the SCAPI server-side default is the single
      // source of truth.
      deleteMrtEnv: deleteMrtEnv ? undefined : false,
      deleteAmSlasClients: deleteAmSlasClients ? undefined : false,
      deleteEcdnRouting: deleteEcdnRouting ? undefined : false,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (resolved) => this.logger.debug({backend: resolved}, '[MRT] Deleting project via backend'),
    });

    if (backend === 'legacy') {
      const ignored: string[] = [];
      if (!deleteMrtEnv) {
        ignored.push('--no-delete-mrt-env');
      }
      if (!deleteAmSlasClients) {
        ignored.push('--no-delete-am-slas-clients');
      }
      if (!deleteEcdnRouting) {
        ignored.push('--no-delete-ecdn-routing');
      }
      if (ignored.length > 0) {
        this.warn(
          `The legacy MRT backend does not support granular-delete opt-outs; ignored ${ignored.join(', ')}. ` +
            `All downstream resources were torn down. Use --mrt-backend scapi to preserve selected resources.`,
        );
      }
    }

    this.log(t('commands.mrt.project.delete.success', 'Project "{{slug}}" deleted successfully.', {slug}));

    return {slug, deleted: true, preserved};
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }

  private buildConfirmPrompt(slug: string, preserved: {mrtEnv: boolean; amSlasClients: boolean; ecdnRouting: boolean}) {
    const anyPreserved = preserved.mrtEnv || preserved.amSlasClients || preserved.ecdnRouting;
    const base = t('commands.mrt.project.delete.confirm', 'Are you sure you want to delete project "{{slug}}"?', {
      slug,
    });
    if (!anyPreserved) {
      return base;
    }
    const rows = [
      `  - Storefront record       [delete]`,
      `  - MRT env + deployments   [${preserved.mrtEnv ? 'preserve' : 'delete'}]`,
      `  - AM/SLAS clients         [${preserved.amSlasClients ? 'preserve' : 'delete'}]`,
      `  - eCDN routing            [${preserved.ecdnRouting ? 'preserve' : 'delete'}]`,
    ].join('\n');
    return `${base}\nThe following will happen:\n${rows}`;
  }
}
