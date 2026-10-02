/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {cloneRedirectsWithBackend} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';
import {confirm} from '../../../../prompts.js';

/**
 * Clone redirects from one environment to another.
 */
export default class MrtRedirectClone extends MrtCommand<typeof MrtRedirectClone> {
  static description = withDocs(
    t('commands.mrt.redirect.clone.description', 'Clone redirects from one environment to another'),
    '/cli/mrt.html#b2c-mrt-env-redirect-clone',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront --from staging --to production',
    '<%= config.bin %> <%= command.id %> -p my-storefront --from staging --to production --force',
    '<%= config.bin %> <%= command.id %> -p my-storefront --from staging --to production --mrt-backend scapi',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    from: Flags.string({
      description: 'Source environment to clone redirects from',
      required: true,
    }),
    to: Flags.string({
      description: 'Destination environment to clone redirects to',
      required: true,
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  protected operations = {
    cloneRedirectsWithBackend,
  };

  async run(): Promise<unknown> {
    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const {from: sourceEnvironment, to: targetEnvironment, force} = this.flags;

    // Clone copies redirects from a *distinct* source environment. Both backends
    // reject a same-environment clone; reject it up front for a uniform message.
    if (sourceEnvironment === targetEnvironment) {
      this.error(
        t(
          'commands.mrt.redirect.clone.sameSource',
          'The source and destination environments must differ (both are "{{environment}}").',
          {environment: sourceEnvironment},
        ),
      );
    }

    // Confirm clone unless --force is specified
    if (!force && !this.jsonEnabled()) {
      const confirmed = await confirm(
        t(
          'commands.mrt.redirect.clone.confirm',
          'WARNING: This will REPLACE all redirects in {{toTarget}} with redirects from {{fromTarget}}. Continue?',
          {fromTarget: sourceEnvironment, toTarget: targetEnvironment},
        ),
      );
      if (!confirmed) {
        this.log(t('commands.mrt.redirect.clone.cancelled', 'Clone cancelled.'));
        return {cloned: false};
      }
    }

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    this.log(
      t('commands.mrt.redirect.clone.cloning', 'Cloning redirects from {{fromTarget}} to {{toTarget}}...', {
        fromTarget: sourceEnvironment,
        toTarget: targetEnvironment,
      }),
    );

    const result = await this.operations.cloneRedirectsWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      sourceEnvironment,
      targetEnvironment,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Cloning redirects via backend'),
    });

    if (!this.jsonEnabled()) {
      // The legacy backend reports a cloned count; the SCAPI backend returns 201
      // with no body, so phrase the success without a count there.
      if (result.count === null) {
        this.log(
          t('commands.mrt.redirect.clone.successNoCount', 'Cloned redirects from {{fromTarget}} to {{toTarget}}.', {
            fromTarget: sourceEnvironment,
            toTarget: targetEnvironment,
          }),
        );
      } else {
        this.log(
          t(
            'commands.mrt.redirect.clone.success',
            'Cloned {{count}} redirect(s) from {{fromTarget}} to {{toTarget}}.',
            {count: result.count, fromTarget: sourceEnvironment, toTarget: targetEnvironment},
          ),
        );
      }
    }

    // Under --json, emit the backend's native clone response verbatim (the legacy
    // clone result, or `null` for the SCAPI empty 201).
    return result.raw;
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
