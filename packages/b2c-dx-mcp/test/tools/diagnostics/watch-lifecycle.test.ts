/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {ServerContext} from '../../../src/server-context.js';
import {createLogsWatchTool} from '../../../src/tools/diagnostics/logs-watch.js';
import {createMrtLogsWatchTool} from '../../../src/tools/diagnostics/mrt-logs-watch.js';

for (const createTool of [createLogsWatchTool, createMrtLogsWatchTool]) {
  describe(`${createTool.name} lifecycle dispatch`, () => {
    it('lists and stops without loading configuration, including repeated cleanup', async () => {
      const context = new ServerContext();
      const load = sinon.stub().throws(new Error('Configuration is unavailable'));
      const tool = createTool(load, context);
      try {
        expect((await tool.handler({action: 'list'})).isError).not.to.equal(true);
        expect((await tool.handler({action: 'stop', watch_id: 'already-stopped'})).isError).not.to.equal(true);
        expect((await tool.handler({action: 'stop', watch_id: 'already-stopped'})).isError).not.to.equal(true);
        expect(load.called).to.equal(false);
      } finally {
        await context.destroyAll();
      }
    });

    it('rejects missing actions and conflicting action inputs before loading configuration', async () => {
      const load = sinon.stub().throws(new Error('Must not load configuration'));
      const tool = createTool(load);
      const requests = [
        {},
        {action: 'unknown'},
        {action: 'stop'},
        {action: 'stop', watch_id: ''},
        {action: 'list', watch_id: 'x'},
        {action: 'start', watch_id: 'x'},
        {action: 'stop', watch_id: 'x', projectDirectory: '/other-project'},
        {action: 'list', search: 'error'},
      ];
      const responses = await Promise.all(requests.map(async (request) => tool.handler(request)));
      expect(responses.every((response) => response.isError)).to.equal(true);
      expect(load.called).to.equal(false);
    });
  });
}
