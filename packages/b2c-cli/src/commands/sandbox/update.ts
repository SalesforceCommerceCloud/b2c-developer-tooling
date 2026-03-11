/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, type OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../i18n/index.js';

type SandboxModel = OdsComponents['schemas']['SandboxModel'];
type SandboxUpdateRequestModel = OdsComponents['schemas']['SandboxUpdateRequestModel'];

/**
 * Command to update an on-demand sandbox.
 */
export default class SandboxUpdate extends OdsCommand<typeof SandboxUpdate> {
  static aliases = ['ods:update'];

  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID or realm-instance, e.g., abcd-123)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.sandbox.update.description', 'Update a sandbox (extend TTL, change scheduling, update tags or emails)'),
    '/cli/sandbox.html#b2c-sandbox-update',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> zzzv-123 --ttl 48',
    '<%= config.bin %> <%= command.id %> zzzv-123 --ttl 0',
    '<%= config.bin %> <%= command.id %> zzzv-123 --auto-scheduled',
    '<%= config.bin %> <%= command.id %> zzzv-123 --no-auto-scheduled',
    '<%= config.bin %> <%= command.id %> zzzv-123 --tags tag1,tag2',
    '<%= config.bin %> <%= command.id %> zzzv-123 --emails user@example.com,dev@example.com',
    '<%= config.bin %> <%= command.id %> zzzv-123 --ttl 48 --tags ci,nightly --json',
  ];

  static flags = {
    ttl: Flags.integer({
      description: 'Number of hours to add to sandbox lifetime (0 or less for infinite)',
    }),
    'auto-scheduled': Flags.boolean({
      description: 'Enable or disable automatic start/stop scheduling',
      allowNo: true,
    }),
    tags: Flags.string({
      description: 'Comma-separated list of tags',
    }),
    emails: Flags.string({
      description: 'Comma-separated list of notification email addresses',
    }),
  };

  async run(): Promise<SandboxModel> {
    const sandboxId = await this.resolveSandboxId(this.args.sandboxId);
    const {ttl, 'auto-scheduled': autoScheduled, tags, emails} = this.flags;

    // Require at least one update flag
    if (ttl === undefined && autoScheduled === undefined && tags === undefined && emails === undefined) {
      this.error('At least one update flag is required. Use --ttl, --auto-scheduled, --tags, or --emails.');
    }

    const body: SandboxUpdateRequestModel = {};

    if (ttl !== undefined) {
      body.ttl = ttl;
    }

    if (autoScheduled !== undefined) {
      body.autoScheduled = autoScheduled;
    }

    if (tags !== undefined) {
      body.tags = tags.split(',').map((tag) => tag.trim());
    }

    if (emails !== undefined) {
      body.emails = emails.split(',').map((email) => email.trim());
    }

    this.log(t('commands.sandbox.update.updating', 'Updating sandbox {{sandboxId}}...', {sandboxId}));

    const result = await this.odsClient.PATCH('/sandboxes/{sandboxId}', {
      params: {
        path: {sandboxId},
      },
      body,
    });

    if (!result.data?.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(`Failed to update sandbox: ${message}`);
    }

    const sandbox = result.data.data;

    this.log(t('commands.sandbox.update.success', 'Sandbox updated successfully'));

    if (this.jsonEnabled()) {
      return sandbox;
    }

    this.printSandboxSummary(sandbox);

    return sandbox;
  }

  private printSandboxSummary(sandbox: SandboxModel): void {
    const ui = cliui({width: process.stdout.columns || 80});

    const fields: [string, string | undefined][] = [
      ['ID', sandbox.id],
      ['Realm', sandbox.realm],
      ['Instance', sandbox.instance],
      ['State', sandbox.state],
      ['Auto Scheduled', sandbox.autoScheduled?.toString()],
      ['EOL', sandbox.eol ? new Date(sandbox.eol).toLocaleString() : undefined],
    ];

    if (sandbox.tags && sandbox.tags.length > 0) {
      fields.push(['Tags', sandbox.tags.join(', ')]);
    }

    if (sandbox.emails && sandbox.emails.length > 0) {
      fields.push(['Emails', sandbox.emails.join(', ')]);
    }

    for (const [label, value] of fields) {
      if (value !== undefined) {
        ui.div({text: `${label}:`, width: 20, padding: [0, 2, 0, 0]}, {text: value, padding: [0, 0, 0, 0]});
      }
    }

    ux.stdout(ui.toString());
  }
}
