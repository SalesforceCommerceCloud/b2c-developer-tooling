/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  createRedirect,
  type MrtRedirect,
  type RedirectHttpStatusCode,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

/**
 * Create a redirect for an MRT environment.
 */
export default class MrtRedirectCreate extends MrtCommand<typeof MrtRedirectCreate> {
  static description = withDocs(
    t('commands.mrt.redirect.create.description', 'Create a redirect for a Managed Runtime environment'),
    '/cli/mrt.html#b2c-mrt-env-redirect-create',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront --environment staging --from /old --to /new',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging --from /sale --to /summer-sale --status 302',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging --from "/a/*" --to /b --forward-wildcard',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    from: Flags.string({
      description: 'Source path to redirect from',
      required: true,
    }),
    to: Flags.string({
      description: 'Destination URL to redirect to',
      required: true,
    }),
    status: Flags.integer({
      description: 'HTTP status code (301 or 302)',
      options: ['301', '302'],
      default: 301,
    }),
    'forward-querystring': Flags.boolean({
      description: 'Forward query string parameters',
      default: false,
    }),
    'forward-wildcard': Flags.boolean({
      description: 'Forward wildcard path portion',
      default: false,
    }),
  };

  async run(): Promise<MrtRedirect> {
    this.requireMrtCredentials();

    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }
    if (!environment) {
      this.error(
        'MRT environment is required. Provide --environment flag, set SFCC_MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }

    const {
      from: fromPath,
      to: toUrl,
      status,
      'forward-querystring': forwardQs,
      'forward-wildcard': forwardWildcard,
    } = this.flags;

    this.log(
      t('commands.mrt.redirect.create.creating', 'Creating redirect {{from}} -> {{to}}...', {
        from: fromPath,
        to: toUrl,
      }),
    );

    try {
      const result = await createRedirect(
        {
          projectSlug: project,
          targetSlug: environment,
          fromPath,
          toUrl,
          httpStatusCode: status as RedirectHttpStatusCode,
          forwardQuerystring: forwardQs || undefined,
          forwardWildcard: forwardWildcard || undefined,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(
          t('commands.mrt.redirect.create.success', 'Redirect created: {{from}} -> {{to}}', {
            from: fromPath,
            to: toUrl,
          }),
        );
        this.log(
          t(
            'commands.mrt.redirect.create.note',
            'Note: Changes may take up to 20 minutes to take effect on your site.',
          ),
        );
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.redirect.create.failed', 'Failed to create redirect: {{message}}', {message: error.message}),
        );
      }
      throw error;
    }
  }
}
