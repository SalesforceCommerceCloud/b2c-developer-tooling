/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t, withDocs} from '../../i18n/index.js';

// TODO: Implement cap list when the CommerceFeatureState OCAPI endpoint is confirmed.
// Installed apps are tracked in the CommerceFeatureState custom object per-site.
// See: isv_dev_guide.md Section 10.2

export default class CapList extends BaseCommand<typeof CapList> {
  static description = withDocs(
    t('commands.cap.list.description', 'List installed Commerce Apps on a B2C Commerce instance'),
    '/cli/cap.html#b2c-cap-list',
  );

  static examples = ['<%= config.bin %> <%= command.id %>'];

  async run(): Promise<void> {
    this.error(
      t(
        'commands.cap.list.notImplemented',
        'cap list is not yet implemented. Installed apps are tracked in the CommerceFeatureState custom object — OCAPI endpoint TBD.',
      ),
    );
  }
}
