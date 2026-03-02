/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, Errors} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../../i18n/index.js';

/**
 * Command to create a sandbox clone.
 */
export default class CloneCreate extends OdsCommand<typeof CloneCreate> {
  static aliases = ['ods:clone:create'];

  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID or friendly format like realm-instance) to clone from',
      required: true,
    }),
  };

  static description = t('commands.clone.create.description', 'Create a new sandbox clone from an existing sandbox');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> <sandboxId>',
    '<%= config.bin %> <%= command.id %> <sandboxId> --target-profile large',
    '<%= config.bin %> <%= command.id %> <sandboxId> --ttl 48',
    '<%= config.bin %> <%= command.id %> <sandboxId> --target-profile large --ttl 48 --emails dev@example.com,qa@example.com',
  ];

  static flags = {
    'target-profile': Flags.string({
      description: 'Resource profile for the cloned sandbox (defaults to source sandbox profile)',
      required: false,
      options: ['medium', 'large', 'xlarge', 'xxlarge'],
    }),
    emails: Flags.string({
      description: 'Comma-separated list of notification email addresses',
      required: false,
      multiple: true,
    }),
    ttl: Flags.integer({
      description:
        'Time to live in hours (0 or negative = infinite, minimum 24 hours). Values between 1-23 are not allowed.',
      required: false,
      default: 24,
    }),
  };

  async run(): Promise<{cloneId?: string}> {
    const {sandboxId: rawSandboxId} = this.args;
    const {'target-profile': targetProfileFlag, emails, ttl} = this.flags;

    // Validate TTL
    if (ttl > 0 && ttl < 24) {
      throw new Errors.CLIError(
        t(
          'commands.clone.create.invalidTTL',
          'TTL must be 0 or negative (infinite), or 24 hours or greater. Values between 1-23 are not allowed. Received: {{ttl}}',
          {ttl},
        ),
      );
    }

    // Resolve sandbox ID (handles both UUID and friendly format)
    const sandboxId = await this.resolveSandboxId(rawSandboxId);

    // Determine target profile - fetch from source sandbox if not provided
    let targetProfile = targetProfileFlag;

    if (!targetProfile) {
      this.log(t('commands.clone.create.fetchingSource', 'Fetching source sandbox profile...'));

      const sourceResult = await this.odsClient.GET('/sandboxes/{sandboxId}', {
        params: {path: {sandboxId}},
      });

      if (!sourceResult.data?.data?.resourceProfile) {
        this.error(
          t(
            'commands.clone.create.noSourceProfile',
            'Unable to determine source sandbox profile. Please specify --target-profile explicitly.',
          ),
        );
      }

      targetProfile = sourceResult.data.data.resourceProfile;

      if (!this.jsonEnabled()) {
        this.log(
          t('commands.clone.create.usingSourceProfile', 'Using source sandbox profile: {{profile}}', {
            profile: targetProfile,
          }),
        );
      }
    }

    // Validate that profile is one of the allowed values
    const validProfiles = ['medium', 'large', 'xlarge', 'xxlarge'];
    if (!validProfiles.includes(targetProfile)) {
      this.error(
        t(
          'commands.clone.create.invalidProfile',
          'Invalid target profile "{{profile}}". Must be one of: {{validProfiles}}',
          {profile: targetProfile, validProfiles: validProfiles.join(', ')},
        ),
      );
    }

    this.log(t('commands.clone.create.creating', 'Creating sandbox clone...'));

    // Prepare request body
    const requestBody: {
      targetProfile?: 'large' | 'medium' | 'xlarge' | 'xxlarge';
      emails?: string[];
      ttl: number;
    } = {
      targetProfile: targetProfile as 'large' | 'medium' | 'xlarge' | 'xxlarge',
      ttl,
    };

    if (emails && emails.length > 0) {
      requestBody.emails = emails.flatMap((email) => email.split(',').map((e) => e.trim()));
    }

    const result = await this.odsClient.POST('/sandboxes/{sandboxId}/clones', {
      params: {
        path: {sandboxId},
      },
      body: requestBody,
    });

    if (!result.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(t('commands.clone.create.error', 'Failed to create sandbox clone: {{message}}', {message}));
    }

    const cloneId = result.data.data?.cloneId;

    if (this.jsonEnabled()) {
      return {cloneId};
    }

    this.log(t('commands.clone.create.success', '✓ Sandbox clone creation started successfully'));
    this.log(t('commands.clone.create.cloneId', 'Clone ID: {{cloneId}}', {cloneId}));
    this.log(
      t(
        'commands.clone.create.checkStatus',
        '\nTo check the clone status, run:\n  <%= config.bin %> ods clone get {{sandboxId}} {{cloneId}}',
        {sandboxId, cloneId},
      ),
    );

    return {cloneId};
  }
}
