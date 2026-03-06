/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../i18n/index.js';

type SandboxModel = OdsComponents['schemas']['SandboxModel'];

/**
 * Command to get details of a specific sandbox.
 */
export default class SandboxGet extends OdsCommand<typeof SandboxGet> {
  static aliases = ['ods:get'];

  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID or realm-instance, e.g., abcd-123)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.sandbox.get.description', 'Get details of a specific sandbox'),
    '/cli/sandbox.html#b2c-sandbox-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> abc12345-1234-1234-1234-abc123456789',
    '<%= config.bin %> <%= command.id %> zzzv-123',
    '<%= config.bin %> <%= command.id %> zzzv_123 --json',
    '<%= config.bin %> <%= command.id %> zzzv_123 --clone-details',
  ];

  static flags = {
    'clone-details': Flags.boolean({
      description: 'Include detailed clone information if the sandbox was created by cloning',
      default: false,
    }),
  };

  async run(): Promise<SandboxModel> {
    const sandboxId = await this.resolveSandboxId(this.args.sandboxId);

    this.log(t('commands.sandbox.get.fetching', 'Fetching sandbox {{sandboxId}}...', {sandboxId}));

    const params: {path: {sandboxId: string}; query?: {expand: 'clonedetails'[]}} = {
      path: {sandboxId},
    };

    if (this.flags['clone-details']) {
      params.query = {expand: ['clonedetails']};
    }

    const result = await this.odsClient.GET('/sandboxes/{sandboxId}', {params});

    if (!result.data?.data) {
      this.error(
        t('commands.sandbox.get.error', 'Failed to fetch sandbox: {{message}}', {
          message: result.response?.statusText || 'Sandbox not found',
        }),
      );
    }

    const sandbox = result.data.data;

    if (this.jsonEnabled()) {
      return sandbox;
    }

    this.printSandboxDetails(sandbox);

    return sandbox;
  }

  private buildCloneFields(sandbox: SandboxModel): [string, string | undefined][] {
    const cloneFields: [string, string | undefined][] = [
      ['Cloned From', sandbox.clonedFrom],
      ['Source Instance ID', sandbox.sourceInstanceIdentifier],
    ];

    if (sandbox.cloneDetails) {
      const details = sandbox.cloneDetails;
      cloneFields.push(
        ['Clone ID', details.cloneId],
        ['Status', details.status],
        ['Target Profile', details.targetProfile],
        ['Created At', details.createdAt ? new Date(details.createdAt).toLocaleString() : undefined],
        ['Progress', details.progressPercentage ? `${details.progressPercentage}%` : undefined],
        ['Elapsed Time (sec)', details.elapsedTimeInSec?.toString()],
        ['Custom Code Version', details.customCodeVersion],
        ['Storefront Count', details.storefrontCount?.toString()],
      );
    }

    return cloneFields;
  }

  private buildSandboxFields(sandbox: SandboxModel): [string, string | undefined][] {
    return [
      ['ID', sandbox.id],
      ['Realm', sandbox.realm],
      ['Instance', sandbox.instance],
      ['State', sandbox.state],
      ['Resource Profile', sandbox.resourceProfile],
      ['Enabled', sandbox.enabled?.toString()],
      ['Auto Scheduled', sandbox.autoScheduled?.toString()],
      ['Hostname', sandbox.hostName],
      ['Created At', sandbox.createdAt ? new Date(sandbox.createdAt).toLocaleString() : undefined],
      ['Created By', sandbox.createdBy],
      ['EOL', sandbox.eol ? new Date(sandbox.eol).toLocaleString() : undefined],
      ['App Version', sandbox.versions?.app],
      ['Web Version', sandbox.versions?.web],
    ];
  }

  private printCloneDetailsSection(ui: ReturnType<typeof cliui>, sandbox: SandboxModel): void {
    if (!sandbox.clonedFrom && !sandbox.sourceInstanceIdentifier && !sandbox.cloneDetails) return;

    ui.div({text: '', padding: [0, 0, 0, 0]});
    ui.div({text: 'Clone Details', padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    const cloneFields = this.buildCloneFields(sandbox);
    this.printFieldsSection(ui, cloneFields, 25);
  }

  private printFieldsSection(
    ui: ReturnType<typeof cliui>,
    fields: [string, string | undefined][],
    width: number,
  ): void {
    for (const [label, value] of fields) {
      if (value !== undefined) {
        ui.div({text: `${label}:`, width, padding: [0, 2, 0, 0]}, {text: value, padding: [0, 0, 0, 0]});
      }
    }
  }

  private printLinksSection(ui: ReturnType<typeof cliui>, sandbox: SandboxModel): void {
    if (!sandbox.links) return;

    ui.div({text: '', padding: [0, 0, 0, 0]});
    ui.div({text: 'Links', padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    const links: [string, string | undefined][] = [
      ['Business Manager', sandbox.links.bm],
      ['OCAPI', sandbox.links.ocapi],
      ['Impex', sandbox.links.impex],
      ['Code', sandbox.links.code],
      ['Logs', sandbox.links.logs],
    ];

    this.printFieldsSection(ui, links, 20);
  }

  private printSandboxDetails(sandbox: SandboxModel): void {
    const ui = cliui({width: process.stdout.columns || 80});

    ui.div({text: 'Sandbox Details', padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    const fields = this.buildSandboxFields(sandbox);
    this.printFieldsSection(ui, fields, 20);
    this.printTagsAndEmails(ui, sandbox);
    this.printCloneDetailsSection(ui, sandbox);
    this.printLinksSection(ui, sandbox);

    ux.stdout(ui.toString());
  }

  private printTagsAndEmails(ui: ReturnType<typeof cliui>, sandbox: SandboxModel): void {
    if (sandbox.tags && sandbox.tags.length > 0) {
      ui.div({text: 'Tags:', width: 20, padding: [0, 2, 0, 0]}, {text: sandbox.tags.join(', '), padding: [0, 0, 0, 0]});
    }

    if (sandbox.emails && sandbox.emails.length > 0) {
      ui.div(
        {text: 'Emails:', width: 20, padding: [0, 2, 0, 0]},
        {text: sandbox.emails.join(', '), padding: [0, 0, 0, 0]},
      );
    }
  }
}
