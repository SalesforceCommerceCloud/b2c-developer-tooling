/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {render} from 'ink';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {AuthConfig} from '@salesforce/b2c-tooling-sdk';

import {App} from '../tui/app.js';

/**
 * Interactive TUI for B2C Commerce operations.
 * Provides a k9s-style terminal interface for managing sandboxes.
 */
export default class UiCommand extends OdsCommand<typeof UiCommand> {
  static description = 'Interactive TUI for B2C Commerce';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --realm abcd',
    '<%= config.bin %> <%= command.id %> --filter-params "state=started"',
  ];

  static flags = {
    realm: Flags.string({
      char: 'r',
      description: 'Filter by realm ID (four-letter ID)',
    }),
    'filter-params': Flags.string({
      description: 'Raw filter parameters (e.g., "realm=abcd&state=started&resourceProfile=medium")',
    }),
  };

  async run(): Promise<void> {
    const realm = this.flags.realm;
    const rawFilterParams = this.flags['filter-params'];

    // Build filter params string
    let filterParams: string | undefined;
    if (realm || rawFilterParams) {
      const parts: string[] = [];
      if (realm) {
        parts.push(`realm=${realm}`);
      }
      if (rawFilterParams) {
        parts.push(rawFilterParams);
      }
      filterParams = parts.join('&');
    }

    // Build auth config for WebDAV operations
    const config = this.resolvedConfig.values;
    const authConfig: AuthConfig = {
      oauth: config.clientId
        ? {
            accountManagerHost: config.accountManagerHost,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            scopes: config.scopes,
          }
        : undefined,
    };

    // Render the Ink app with the configured ODS client and auth
    const {waitUntilExit} = render(
      <App authConfig={authConfig} filterParams={filterParams} odsClient={this.odsClient} realm={realm} />,
    );

    // Wait for the app to exit
    await waitUntilExit();
  }
}
