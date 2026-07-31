/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {t} from '../../src/i18n/index.js';

describe('setup skills translations', () => {
  it('renders the mixed-source download message without a version placeholder', () => {
    expect(t('commands.setup.skills.downloading', 'Downloading skills...')).to.equal('Downloading skills...');
  });

  it('interpolates release and repository download messages', () => {
    expect(
      t('commands.setup.skills.downloadingRelease', 'Downloading skills from release {{version}}...', {
        version: '1.2.3',
      }),
    ).to.equal('Downloading skills from release 1.2.3...');
    expect(
      t('commands.setup.skills.downloadingRepo', 'Downloading skills from repository ({{ref}})...', {
        ref: 'main',
      }),
    ).to.equal('Downloading skills from repository (main)...');
  });
});
