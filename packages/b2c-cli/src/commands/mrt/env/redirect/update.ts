/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {updateRedirectWithBackend, type RedirectHttpStatusCode} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

/**
 * Update a redirect for an MRT environment (partial — only supplied fields change).
 */
export default class MrtRedirectUpdate extends MrtCommand<typeof MrtRedirectUpdate> {
  static args = {
    identifier: Args.string({
      // Legacy keys a redirect by its source path (from_path); SCAPI keys it by
      // its UUID. Accept whichever the resolved backend expects.
      description: 'Redirect identifier: the source path (legacy) or the redirect UUID (SCAPI)',
      required: true,
    }),
  };

  static description = withDocs(
    t(
      'commands.mrt.redirect.update.description',
      'Update a redirect for a Managed Runtime environment (only the supplied fields change)',
    ),
    '/cli/mrt.html#b2c-mrt-env-redirect-update',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> /old-page --project my-storefront --environment staging --to /new-page',
    '<%= config.bin %> <%= command.id %> /old-page -p my-storefront -e staging --status 302',
    '<%= config.bin %> <%= command.id %> /old-page -p my-storefront -e staging --no-forward-querystring',
    '<%= config.bin %> <%= command.id %> 3f9b1c2d-4e5f-6a7b-8c9d-0e1f2a3b4c5d -p my-storefront -e staging --to /new --mrt-backend scapi',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    to: Flags.string({
      description: 'New destination URL to redirect to',
    }),
    status: Flags.integer({
      description: 'HTTP status code (301 or 302)',
      options: ['301', '302'],
    }),
    'forward-querystring': Flags.boolean({
      description: 'Forward query string parameters (use --no-forward-querystring to disable)',
      allowNo: true,
    }),
    'forward-wildcard': Flags.boolean({
      description: 'Forward wildcard path portion (use --no-forward-wildcard to disable)',
      allowNo: true,
    }),
  };

  protected operations = {
    updateRedirectWithBackend,
  };

  async run(): Promise<unknown> {
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

    const {
      to: destination,
      status,
      'forward-querystring': forwardQuerystring,
      'forward-wildcard': forwardWildcard,
    } = this.flags;

    // A partial update needs at least one field to change. oclif leaves an
    // un-passed boolean (with allowNo) and un-passed string/integer as undefined.
    if (
      destination === undefined &&
      status === undefined &&
      forwardQuerystring === undefined &&
      forwardWildcard === undefined
    ) {
      this.error(
        t(
          'commands.mrt.redirect.update.noChanges',
          'Provide at least one field to update (--to, --status, --forward-querystring, or --forward-wildcard).',
        ),
      );
    }

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    this.log(t('commands.mrt.redirect.update.updating', 'Updating redirect {{identifier}}...', {identifier}));

    const result = await this.operations.updateRedirectWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      environment,
      identifier,
      destination,
      httpStatusCode: status as RedirectHttpStatusCode | undefined,
      forwardQuerystring,
      forwardWildcard,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Updating redirect via backend'),
    });

    if (!this.jsonEnabled()) {
      this.log(t('commands.mrt.redirect.update.success', 'Redirect {{identifier}} updated.', {identifier}));
      this.log(
        t('commands.mrt.redirect.update.note', 'Note: Changes may take up to 20 minutes to take effect on your site.'),
      );
    }

    // Under --json, emit the backend's native update response verbatim.
    return result.raw;
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
