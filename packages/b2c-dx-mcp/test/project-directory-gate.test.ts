/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {z} from 'zod';
import {Client} from '@modelcontextprotocol/client';
import {InMemoryTransport, type ElicitResult} from '@modelcontextprotocol/server';
import {serveStdio} from '@modelcontextprotocol/server/stdio';
import {B2CDxMcpServer} from '../src/server.js';
import {parseRoots} from '../src/utils/project-directory-gate.js';

describe('parseRoots', () => {
  it('accepts file URIs and bare absolute paths, ignoring other roots', () => {
    const local = path.resolve('/work/site');
    expect(
      parseRoots({
        roots: [
          {uri: pathToFileURL(local).href},
          {uri: local},
          {uri: 'https://example.com/repo'},
          {uri: 'relative/dir'},
          {},
        ],
      }),
    ).to.deep.equal([local, local]);
    expect(parseRoots(undefined)).to.deep.equal([]);
  });
});

for (const mode of ['legacy', '2026-07-28'] as const) {
  describe(`projectDirectory approval (${mode})`, () => {
    let base: string;
    let project: string;
    let outside: string;
    let client: Client;
    let handle: {close(): Promise<void>};
    let calls: string[];
    let prompts: string[];

    async function connect(options: {
      approve?: ElicitResult['action'];
      configured?: string;
      elicitation?: boolean;
      roots?: Array<{uri: string}>;
    }) {
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      handle = serveStdio(
        () => {
          const server = new B2CDxMcpServer(
            {name: 'gate-test', version: '1'},
            {capabilities: {tools: {}}, projectDirectory: options.configured},
          );
          server.addTool('probe', 'Test tool', {projectDirectory: z.string().optional()}, async (args) => {
            calls.push(String(args.projectDirectory));
            return {content: [{type: 'text', text: 'ran'}]};
          });
          return server;
        },
        {transport: serverTransport},
      );
      client = new Client(
        {name: 'gate-test', version: '1'},
        {
          versionNegotiation: mode === 'legacy' ? {mode: 'legacy'} : {mode: {pin: mode}},
          capabilities: {
            ...(options.roots && {roots: {}}),
            ...(options.elicitation !== false && {elicitation: {form: {}}}),
          },
        },
      );
      if (options.roots) {
        const roots = options.roots;
        client.setRequestHandler('roots/list', async () => ({roots}) as never);
      }
      if (options.elicitation !== false) {
        client.setRequestHandler('elicitation/create', async (request): Promise<ElicitResult> => {
          prompts.push((request.params as {message: string}).message);
          return {action: options.approve ?? 'accept'};
        });
      }
      await client.connect(clientTransport);
    }

    const call = (projectDirectory: string) => client.callTool({name: 'probe', arguments: {projectDirectory}});

    beforeEach(() => {
      base = mkdtempSync(path.join(tmpdir(), 'gate-test-'));
      project = path.join(base, 'project');
      outside = path.join(base, 'other');
      calls = [];
      prompts = [];
    });

    afterEach(async () => {
      await client.close();
      await handle.close();
      rmSync(base, {recursive: true, force: true});
    });

    it('accepts any directory when no project folder is known', async () => {
      await connect({});
      const result = await call(outside);
      expect(result.isError).to.not.equal(true);
      expect(calls).to.deep.equal([outside]);
      expect(prompts).to.deep.equal([]);
    });

    it('accepts a directory inside a client root without asking', async () => {
      await connect({roots: [{uri: pathToFileURL(project).href}]});
      await call(path.join(project, 'storefront'));
      expect(calls).to.deep.equal([path.join(project, 'storefront')]);
      expect(prompts).to.deep.equal([]);
    });

    it('asks once for a directory outside the roots and remembers the approval', async () => {
      await connect({roots: [{uri: pathToFileURL(project).href}]});
      const first = await call(outside);
      const second = await call(path.join(outside, 'nested'));
      expect(first.isError).to.not.equal(true);
      expect(second.isError).to.not.equal(true);
      expect(calls).to.deep.equal([outside, path.join(outside, 'nested')]);
      expect(prompts).to.have.length(1);
      expect(prompts[0]).to.include(outside).and.include(project);
    });

    it('rejects a declined directory without running the tool', async () => {
      await connect({approve: 'decline', roots: [{uri: pathToFileURL(project).href}]});
      const result = await call(outside);
      expect(result.isError).to.equal(true);
      expect(JSON.stringify(result.content)).to.include('declined');
      expect(calls).to.deep.equal([]);
    });

    it('bounds the argument by the configured project directory', async () => {
      await connect({configured: project, elicitation: false});
      await call(project);
      const result = await call(outside);
      expect(calls).to.deep.equal([project]);
      expect(result.isError).to.equal(true);
      expect(JSON.stringify(result.content)).to.include('--project-directory');
    });

    if (mode === 'legacy') {
      it('accepts roots sent as bare paths', async () => {
        await connect({roots: [{uri: project}]});
        await call(project);
        await call(outside);
        expect(calls).to.deep.equal([project, outside]);
        expect(prompts).to.have.length(1);
      });
    }
  });
}
