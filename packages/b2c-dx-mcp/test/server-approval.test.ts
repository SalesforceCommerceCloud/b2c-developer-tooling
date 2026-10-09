/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {useFakeTimers} from 'sinon';
import {Client} from '@modelcontextprotocol/client';
import {InMemoryTransport, inputRequired, type ElicitResult} from '@modelcontextprotocol/server';
import {B2CDxMcpServer} from '../src/server.js';

describe('Legacy approval deadline', () => {
  for (const cancel of [false, true]) {
    it(`waits indefinitely and still supports ${cancel ? 'cancellation' : 'approval'}`, async () => {
      const server = new B2CDxMcpServer({name: 'approval-test', version: '1'});
      const client = new Client(
        {name: 'approval-test', version: '1'},
        {versionNegotiation: {mode: 'legacy'}, capabilities: {elicitation: {form: {}}}},
      );
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      let prompted!: () => void;
      const promptReceived = new Promise<void>((resolve) => {
        prompted = resolve;
      });
      let approve!: (result: ElicitResult) => void;
      const decision = new Promise<ElicitResult>((resolve) => {
        approve = resolve;
      });
      let resumed = false;
      server.addTool('approve', 'Test approval', {}, async (_args, context) => {
        if (context?.inputResponses) {
          resumed = true;
          return {content: [{type: 'text', text: 'approved'}]};
        }
        return {
          ...inputRequired({
            requestState: 'retained',
            inputRequests: {
              approval: inputRequired.elicit({
                message: 'Approve?',
                requestedSchema: {type: 'object', properties: {approve: {type: 'boolean'}}},
              }),
            },
          }),
          content: [],
        };
      });
      client.setRequestHandler('elicitation/create', async () => {
        prompted();
        return decision;
      });
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      const clock = useFakeTimers({toFake: ['Date', 'setTimeout', 'clearTimeout']});
      const controller = new AbortController();
      try {
        let settled = false;
        const result = client
          .callTool({name: 'approve', arguments: {}}, {signal: controller.signal, timeout: 10 * 24 * 60 * 60 * 1000})
          .then(
            (value) => {
              settled = true;
              return value;
            },
            (error: unknown) => {
              settled = true;
              return error;
            },
          );
        await promptReceived;
        await clock.tickAsync(7 * 24 * 60 * 60 * 1000);
        expect(settled).to.equal(false);
        expect(resumed).to.equal(false);
        if (cancel) {
          controller.abort();
          await clock.tickAsync(0);
          expect(await result).to.be.instanceOf(Error);
          expect(resumed).to.equal(false);
        } else {
          approve({action: 'accept', content: {approve: true}});
          expect(await result).to.deep.equal({content: [{type: 'text', text: 'approved'}]});
          expect(resumed).to.equal(true);
        }
      } finally {
        controller.abort();
        approve({action: 'cancel'});
        clock.restore();
        await client.close();
        await server.close();
      }
    });
  }
});
