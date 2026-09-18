/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import type {IdeContext} from './ide-context.js';

/** Private, per-window connection from the Commerce MCP process to live IDE state. */
export async function startIdeContextBridge(readContext: () => Promise<IdeContext>): Promise<{
  url: string;
  token: string;
  dispose(): Promise<void>;
}> {
  const token = randomBytes(32).toString('hex');
  let host = '';
  const server = createServer({requestTimeout: 10_000, headersTimeout: 10_000}, (request, response) => {
    if (
      request.headers.host !== host ||
      request.headers.origin ||
      request.headers.authorization !== `Bearer ${token}`
    ) {
      response.writeHead(403).end();
      return;
    }
    if (request.url !== '/context') {
      response.writeHead(404).end();
      return;
    }
    if (request.method !== 'GET') {
      response.writeHead(405, {Allow: 'GET'}).end();
      return;
    }
    const timer = setTimeout(() => {
      if (!response.writableEnded && !response.destroyed) response.writeHead(504).end();
    }, 10_000);
    response.on('close', () => clearTimeout(timer));
    void readContext()
      .then((context) => {
        if (!response.writableEnded && !response.destroyed) {
          response
            .writeHead(200, {'Content-Type': 'application/json', 'Cache-Control': 'no-store'})
            .end(JSON.stringify(context));
        }
      })
      .catch(() => {
        if (!response.writableEnded && !response.destroyed) response.writeHead(503).end();
      })
      .finally(() => clearTimeout(timer));
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve();
    });
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not start B2C IDE context bridge');
  host = `127.0.0.1:${address.port}`;
  return {
    url: `http://${host}/context`,
    token,
    async dispose() {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
