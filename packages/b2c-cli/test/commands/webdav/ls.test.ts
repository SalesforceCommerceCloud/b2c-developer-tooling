/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import WebDavLs from '../../../src/commands/webdav/ls.js';
import {isolateConfig, restoreConfig} from '../../helpers/config-isolation.js';
import {stubParse} from '../../helpers/stub-parse.js';

describe('webdav ls', () => {
  let config: Config;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  it('filters out the queried directory entry and returns result in JSON mode', async () => {
    const command: any = new WebDavLs([], config);

    stubParse(command, {root: 'impex'}, {path: 'src/instance'});
    await command.init();

    sinon.stub(command, 'ensureWebDavAuth').returns(void 0);
    sinon.stub(command, 'buildPath').returns('Impex/src/instance');
    sinon.stub(command, 'jsonEnabled').returns(true);

    const entries = [
      {
        href: 'https://example.com/Impex/src/instance/',
        isCollection: true,
      },
      {
        href: 'https://example.com/Impex/src/instance/file.txt',
        isCollection: false,
        contentLength: 5,
      },
    ];

    const propfind = sinon.stub().resolves(entries);
    sinon.stub(command, 'instance').get(() => ({
      webdav: {
        propfind,
      },
    }));

    const result = await command.run();

    expect(propfind.calledOnceWithExactly('Impex/src/instance', '1')).to.equal(true);
    expect(result.path).to.equal('Impex/src/instance');
    expect(result.count).to.equal(1);
    expect(result.entries).to.have.lengthOf(1);
    expect(result.entries[0].href).to.include('file.txt');
  });

  it('returns empty entries when only the queried directory exists', async () => {
    const command: any = new WebDavLs([], config);

    stubParse(command, {root: 'impex'}, {path: 'src/instance'});
    await command.init();

    sinon.stub(command, 'ensureWebDavAuth').returns(void 0);
    sinon.stub(command, 'buildPath').returns('Impex/src/instance');
    sinon.stub(command, 'jsonEnabled').returns(true);

    const propfind = sinon.stub().resolves([
      {
        href: 'https://example.com/Impex/src/instance',
        isCollection: true,
      },
    ]);

    sinon.stub(command, 'instance').get(() => ({
      webdav: {
        propfind,
      },
    }));

    const result = await command.run();

    expect(result.count).to.equal(0);
    expect(result.entries).to.deep.equal([]);
  });
});
