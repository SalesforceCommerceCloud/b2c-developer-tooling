/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {Client} from '@modelcontextprotocol/client';
import {InMemoryTransport, type ElicitResult} from '@modelcontextprotocol/server';
import {serveStdio} from '@modelcontextprotocol/server/stdio';
import {B2CDxMcpServer} from '../src/server.js';
import {BrowserLoginContinuations, openBrowserForTool} from '../src/utils/browser-login.js';

const LOGIN_URL = 'https://account.example.com/dwsso/oauth2/authorize?client_id=test';

/**
 * Registers a tool that, like a WebDAV call without a session, starts a browser
 * login and waits for the redirect before answering.
 */
function addLoginTool(server: B2CDxMcpServer) {
  const tool = {calls: 0, cancelled: undefined as string | undefined, redirect(_token: string) {}};
  server.addTool('webdav_list', 'Test', {}, async () => {
    tool.calls++;
    const token = await new Promise<string>((resolve, reject) => {
      tool.redirect = resolve;
      void openBrowserForTool(LOGIN_URL, {
        cancel(reason) {
          tool.cancelled = reason;
          reject(new Error(reason));
        },
      });
    });
    return {content: [{type: 'text', text: `listed with ${token}`}]};
  });
  return tool;
}

for (const mode of ['legacy', '2026-07-28'] as const) {
  describe(`Browser login URL elicitation (${mode})`, () => {
    let client: Client;
    let handle: {close(): Promise<void>};

    // Serve like the stdio command does, so the connection negotiates either era.
    async function connect(capabilities: Record<string, unknown>) {
      const tool = {current: undefined as ReturnType<typeof addLoginTool> | undefined};
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      handle = serveStdio(
        () => {
          const server = new B2CDxMcpServer({name: 'login-test', version: '1'}, {capabilities: {tools: {}}});
          tool.current = addLoginTool(server);
          return server;
        },
        {transport: serverTransport},
      );
      client = new Client(
        {name: 'login-test', version: '1'},
        {versionNegotiation: mode === 'legacy' ? {mode: 'legacy'} : {mode: {pin: mode}}, capabilities},
      );
      await client.connect(clientTransport);
      return {
        get calls() {
          return tool.current!.calls;
        },
        get cancelled() {
          return tool.current!.cancelled;
        },
        redirect: (token: string) => tool.current!.redirect(token),
      };
    }

    afterEach(async () => {
      await client.close();
      await handle.close();
    });

    it('asks the client to open the login URL and finishes the original call', async () => {
      const tool = await connect({elicitation: {url: {}}});
      const prompts: Array<{message: string; mode?: string; url?: string}> = [];
      client.setRequestHandler('elicitation/create', async (request): Promise<ElicitResult> => {
        prompts.push(request.params as {message: string; mode?: string; url?: string});
        // The user opens the URL and signs in; the redirect reaches the server's loopback.
        setTimeout(() => tool.redirect('user-token'), 10);
        return {action: 'accept'};
      });

      const result = await client.callTool({name: 'webdav_list', arguments: {}});

      expect(result.content).to.deep.equal([{type: 'text', text: 'listed with user-token'}]);
      expect(prompts).to.have.length(1);
      expect(prompts[0].mode).to.equal('url');
      expect(prompts[0].url).to.equal(LOGIN_URL);
      expect(prompts[0].message).to.include('Account Manager');
      expect(tool.calls).to.equal(1);
    });

    it('cancels the login when the user declines', async () => {
      const tool = await connect({elicitation: {url: {}}});
      client.setRequestHandler('elicitation/create', async () => ({action: 'decline'}));

      const result = await client.callTool({name: 'webdav_list', arguments: {}});

      expect(result.isError).to.equal(true);
      expect(JSON.stringify(result.content)).to.include('Account Manager login declined.');
      expect(tool.cancelled).to.equal('Account Manager login declined.');
      expect(tool.calls).to.equal(1);
    });
  });
}

describe('BrowserLoginContinuations', () => {
  it('runs the handler directly when the client cannot open URLs', async () => {
    const continuations = new BrowserLoginContinuations();
    const result = await continuations.run(false, async () => ({content: [{type: 'text', text: 'ok'}]}));
    expect(result).to.deep.equal({content: [{type: 'text', text: 'ok'}]});
  });

  it('passes through results of calls that never start a login', async () => {
    const continuations = new BrowserLoginContinuations();
    const result = await continuations.run(true, async () => ({content: [{type: 'text', text: 'ok'}]}));
    expect(result).to.deep.equal({content: [{type: 'text', text: 'ok'}]});
  });

  it('rejects unknown continuations without running anything', async () => {
    const continuations = new BrowserLoginContinuations();
    expect(continuations.isContinuation('am-login.unknown')).to.equal(true);
    expect(continuations.isContinuation('scapi-state')).to.equal(false);
    const result = await continuations.resume('am-login.unknown');
    expect(result.isError).to.equal(true);
  });
});
