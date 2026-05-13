/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createHash, randomBytes} from 'node:crypto';
import {createServer, type IncomingMessage, type ServerResponse} from 'node:http';
import type {Socket} from 'node:net';
import {URL} from 'node:url';

import {Flags} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {DEFAULT_ACCOUNT_MANAGER_HOST} from '@salesforce/b2c-tooling-sdk';
import {decodeJWT} from '@salesforce/b2c-tooling-sdk/auth';

const POC_CLIENT_ID = 'a40a7a9b-e854-4aa6-8078-d5f79872aa65';
const DEFAULT_PORT = 8080;

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/=+$/, '').replaceAll('+', '-').replaceAll('/', '_');
}

function generatePkcePair(): {verifier: string; challenge: string} {
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash('sha256').update(verifier).digest());
  return {verifier, challenge};
}

async function openBrowser(url: string): Promise<void> {
  try {
    const open = await import('open');
    await open.default(url);
  } catch {
    // ignore — URL is printed to console as a fallback
  }
}

interface AuthCodeResult {
  code: string;
  state: string;
}

function waitForAuthCode(port: number, expectedState: string): Promise<AuthCodeResult> {
  return new Promise((resolve, reject) => {
    const sockets: Set<Socket> = new Set();
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const requestUrl = new URL(req.url || '/', `http://localhost:${port}`);
      const code = requestUrl.searchParams.get('code');
      const state = requestUrl.searchParams.get('state') ?? '';
      const error = requestUrl.searchParams.get('error');
      const errorDescription = requestUrl.searchParams.get('error_description');

      if (error) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end(`Authentication failed: ${errorDescription ?? error}`);
        reject(new Error(`OAuth error: ${errorDescription ?? error}`));
        cleanup();
        return;
      }

      if (!code) {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Waiting for authorization code...');
        return;
      }

      if (state !== expectedState) {
        res.writeHead(400, {'Content-Type': 'text/plain'});
        res.end('State mismatch.');
        reject(new Error('OAuth state mismatch — aborting'));
        cleanup();
        return;
      }

      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Authorization code received. You may close this window.');
      resolve({code, state});
      cleanup();
    });

    function cleanup() {
      setTimeout(() => {
        server.close();
        for (const s of sockets) s.destroy();
      }, 100);
    }

    server.on('connection', (socket) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
    });

    server.on('error', (err) => reject(err));
    server.listen(port);
  });
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  [key: string]: unknown;
}

export default class AuthPkce extends BaseCommand<typeof AuthPkce> {
  static description = 'POC: OAuth Authorization Code + PKCE flow against Account Manager';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
    'account-manager-host': Flags.string({
      description: `Account Manager hostname (default: ${DEFAULT_ACCOUNT_MANAGER_HOST})`,
      env: 'SFCC_ACCOUNT_MANAGER_HOST',
    }),
    'auth-scope': Flags.string({
      description: 'OAuth scopes to request (comma-separated, repeatable)',
      env: 'SFCC_OAUTH_SCOPES',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    'client-id': Flags.string({
      description: 'OAuth client ID (defaults to POC public client)',
      default: POC_CLIENT_ID,
    }),
    port: Flags.integer({
      description: `Local redirect port (default ${DEFAULT_PORT})`,
      default: DEFAULT_PORT,
    }),
  };

  async run(): Promise<void> {
    const clientId = this.flags['client-id'];
    const port = this.flags.port;
    const host = this.flags['account-manager-host'] ?? DEFAULT_ACCOUNT_MANAGER_HOST;
    const scopes = this.flags['auth-scope'] as string[] | undefined;
    const redirectUri = `http://localhost:${port}`;

    const {verifier, challenge} = generatePkcePair();
    const state = base64url(randomBytes(16));

    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
    });
    if (scopes && scopes.length > 0) {
      authParams.set('scope', scopes.join(' '));
    }

    const authorizeUrl = `https://${host}/dwsso/oauth2/authorize?${authParams.toString()}`;

    this.log(`Authorize URL: ${authorizeUrl}`);
    this.log(`Listening on ${redirectUri}`);
    this.log('Opening browser...');

    const codePromise = waitForAuthCode(port, state);
    await openBrowser(authorizeUrl);

    const {code} = await codePromise;
    this.log(`Got authorization code (${code.slice(0, 8)}...). Exchanging for token.`);

    const tokenUrl = `https://${host}/dwsso/oauth2/access_token`;
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: verifier,
    });

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: tokenBody.toString(),
    });

    const rawText = await tokenRes.text();
    if (!tokenRes.ok) {
      this.error(`Token exchange failed (${tokenRes.status}): ${rawText}`);
    }

    let parsed: TokenResponse;
    try {
      parsed = JSON.parse(rawText) as TokenResponse;
    } catch {
      this.error(`Could not parse token response: ${rawText}`);
    }

    this.log('');
    this.log('=== Raw Token Response Headers ===');
    for (const [key, value] of tokenRes.headers.entries()) {
      this.log(`${key}: ${value}`);
    }

    this.log('');
    this.log('=== Raw Token Response Body ===');
    this.log(JSON.stringify(parsed, null, 2));

    this.logDecodedToken('access_token', parsed.access_token);
    if (parsed.refresh_token) {
      this.logDecodedToken('refresh_token', parsed.refresh_token);
    }
    if (parsed.id_token) {
      this.logDecodedToken('id_token', parsed.id_token);
    }
  }

  private logDecodedToken(label: string, token: string): void {
    this.log('');
    this.log(`=== Decoded ${label} ===`);
    try {
      const decoded = decodeJWT(token);
      this.log('header:');
      this.log(JSON.stringify(decoded.header, null, 2));
      this.log('payload:');
      this.log(JSON.stringify(decoded.payload, null, 2));
    } catch (error) {
      this.log(`(not a JWT or could not decode: ${(error as Error).message})`);
    }
  }
}
