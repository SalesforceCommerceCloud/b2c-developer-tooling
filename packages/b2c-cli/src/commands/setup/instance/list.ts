/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import {BaseCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {DwJsonSource, type InstanceInfo} from '@salesforce/b2c-tooling-sdk/config';
import {withDocs} from '../../../i18n/index.js';

/**
 * Table columns for instance listing.
 */
const COLUMNS: Record<string, ColumnDef<InstanceInfo>> = {
  name: {
    header: 'Name',
    get: (i) => i.name,
  },
  hostname: {
    header: 'Hostname',
    get: (i) => i.hostname || '-',
  },
  source: {
    header: 'Source',
    get: (i) => i.source,
  },
  active: {
    header: 'Active',
    get: (i) => (i.active ? '✓' : ''),
  },
};

const DEFAULT_COLUMNS = ['name', 'hostname', 'source', 'active'];

/**
 * JSON output structure for the list command.
 */
interface InstanceListResponse {
  instances: InstanceInfo[];
  count: number;
}

/**
 * List all configured B2C Commerce instances.
 */
export default class SetupInstanceList extends BaseCommand<typeof SetupInstanceList> {
  static description = withDocs('List configured B2C Commerce instances', '/cli/setup.html#b2c-setup-instance-list');

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> --json'];

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<InstanceListResponse> {
    // Get instances from all sources that support listing
    const source = new DwJsonSource();
    const instances = source.listInstances({
      configPath: this.flags.config,
    });

    const result: InstanceListResponse = {
      instances,
      count: instances.length,
    };

    // In JSON mode, just return the data
    if (this.jsonEnabled()) {
      return result;
    }

    // Human-readable table output
    if (instances.length === 0) {
      ux.stdout('No instances configured. Use `b2c setup instance create` to add one.');
      return result;
    }

    ux.stdout('');
    ux.stdout('Instances');
    ux.stdout('─'.repeat(60));

    createTable(COLUMNS).render(instances, DEFAULT_COLUMNS);

    return result;
  }
}
