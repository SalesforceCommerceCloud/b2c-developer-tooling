/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import {createServer, type Server} from 'node:https';
import type {AddressInfo, Socket} from 'node:net';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {OAuthStrategy} from '../../src/auth/oauth.js';
import {
  createApiWebSocket,
  createHttpClient,
  createWebDavDispatcher,
  getApiDispatcher,
  getApiFetch,
} from '../../src/clients/http-transport.js';
import {createLoggingToken} from '../../src/operations/mrt/tail-logs.js';
import {withScopes} from '../../src/clients/scapi-backend-utils.js';
import {buildAuthConfigFromNormalized, createInstanceFromConfig} from '../../src/config/mapping.js';
import {ResolvedConfigImpl} from '../../src/config/resolved-config.js';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), '../fixtures/jwt');

const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const FAKE_TOKEN = `${encode({alg: 'none'})}.${encode({sub: 'test'})}.sig`;

let clientCounter = 0;
/** Unique client IDs keep the module-level token cache from leaking between tests. */
function nextClientId(): string {
  clientCounter += 1;
  return `transport-test-${clientCounter}`;
}

function isCertificateError(error: unknown): boolean {
  const cause = (error as {cause?: {code?: string}}).cause;
  return /CERT|SELF_SIGNED/.test(cause?.code ?? '');
}

describe('clients/http-transport', () => {
  describe('getApiFetch', () => {
    it('uses the default transport unless selfSignedApi is set', () => {
      expect(getApiFetch(undefined)).to.equal(getApiFetch({}));
      expect(getApiFetch({selfSignedApi: false})).to.equal(getApiFetch({}));
      expect(getApiFetch({selfSignedApi: true})).to.not.equal(getApiFetch({}));
    });
  });

  describe('getApiDispatcher', () => {
    it('returns a dispatcher only when selfSignedApi is set', () => {
      expect(getApiDispatcher(undefined)).to.be.undefined;
      expect(getApiDispatcher({selfSignedApi: false})).to.be.undefined;
      expect(getApiDispatcher({selfSignedApi: true})).to.not.be.undefined;
    });
  });

  describe('createWebDavDispatcher', () => {
    it('returns undefined without TLS options', () => {
      expect(createWebDavDispatcher(undefined)).to.be.undefined;
    });
  });

  describe('config scoping', () => {
    it('carries selfSignedApi from config into the instance OAuth strategy and its scoped copies', () => {
      const instance = createInstanceFromConfig({
        hostname: 'localhost',
        shortCode: 'abc123',
        tenantId: 'zzzz_001',
        clientId: 'client',
        clientSecret: 'secret',
        selfSignedApi: true,
      });
      const auth = instance.scapiClientConfig!.auth;

      expect(auth.selfSignedApi).to.equal(true);
      expect(withScopes(auth, ['sfcc.jobs']).selfSignedApi).to.equal(true);
    });

    it('carries selfSignedApi into the MRT API key strategy', () => {
      const config = new ResolvedConfigImpl({mrtApiKey: 'key', selfSignedApi: true}, [], []);
      expect(config.createMrtAuth().selfSignedApi).to.equal(true);
      expect(new ResolvedConfigImpl({mrtApiKey: 'key'}, [], []).createMrtAuth().selfSignedApi).to.be.undefined;
    });

    it('carries selfSignedApi into ResolvedConfig.createOAuth strategies', () => {
      const config = new ResolvedConfigImpl({clientId: 'client', clientSecret: 'secret', selfSignedApi: true}, [], []);
      expect(config.createOAuth().selfSignedApi).to.equal(true);
      expect(config.createOAuth({allowedMethods: ['user']}).selfSignedApi).to.equal(true);
    });

    it('leaves strategies strict when selfSignedApi is not set', () => {
      const authConfig = buildAuthConfigFromNormalized({clientId: 'client', clientSecret: 'secret', selfSigned: true});
      expect(authConfig.oauth?.selfSignedApi).to.be.undefined;
    });
  });

  describe('against a self-signed server', () => {
    let server: Server;
    const sockets = new Set<Socket>();
    let host: string;
    let baseUrl: string;

    before(async () => {
      server = createServer(
        {
          cert: fs.readFileSync(path.join(fixtures, 'test-cert.pem')),
          key: fs.readFileSync(path.join(fixtures, 'test-key.pem')),
        },
        (req, res) => {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            res.writeHead(200, {'Content-Type': 'application/json'});
            if (req.url?.includes('/oauth2/access_token')) {
              res.end(JSON.stringify({access_token: FAKE_TOKEN, expires_in: 1800}));
              return;
            }
            if (req.url?.endsWith('/jwt/')) {
              res.end(JSON.stringify({token: `logging:${req.headers.authorization}`}));
              return;
            }
            res.end(JSON.stringify({method: req.method, path: req.url, body, auth: req.headers.authorization ?? null}));
          });
        },
      );
      server.on('secureConnection', (socket) => sockets.add(socket));
      // Minimal WebSocket handshake so WebSocket TLS can be exercised.
      server.on('upgrade', (req, socket) => {
        const accept = createHash('sha1')
          .update(`${req.headers['sec-websocket-key']}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
          .digest('base64');
        socket.end(
          `HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`,
        );
      });
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      host = `127.0.0.1:${(server.address() as AddressInfo).port}`;
      baseUrl = `https://${host}`;
    });

    after(async () => {
      const closed = new Promise<void>((resolve) => server.close(() => resolve()));
      // Pooled keep-alive and upgraded connections would otherwise hold the server open.
      for (const socket of sockets) socket.destroy();
      await closed;
    });

    it('rejects the certificate by default', async () => {
      try {
        await getApiFetch(undefined)(`${baseUrl}/ping`);
        expect.fail('expected certificate error');
      } catch (error) {
        expect(isCertificateError(error)).to.equal(true);
      }
    });

    it('accepts the certificate with selfSignedApi and returns a global Response', async () => {
      const request = new Request(`${baseUrl}/token`, {
        method: 'POST',
        headers: {Authorization: 'Basic abc'},
        body: 'grant_type=client_credentials',
      });

      const response = await getApiFetch({selfSignedApi: true})(request);

      expect(response).to.be.instanceOf(Response);
      expect(await response.json()).to.deep.equal({
        method: 'POST',
        path: '/token',
        body: 'grant_type=client_credentials',
        auth: 'Basic abc',
      });
    });

    it('applies the auth strategy transport to clients and token requests', async () => {
      const auth = new OAuthStrategy({
        clientId: nextClientId(),
        clientSecret: 'secret',
        accountManagerHost: host,
        selfSignedApi: true,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = createHttpClient<any>({baseUrl}, auth);
      client.use({
        async onRequest({request}) {
          request.headers.set('Authorization', await auth.getAuthorizationHeader());
          return request;
        },
      });

      const {data, response} = await client.GET('/sites', {});

      expect(response.status).to.equal(200);
      expect(data).to.include({method: 'GET', path: '/sites', auth: `Bearer ${FAKE_TOKEN}`});
    });

    it('applies the MRT API key strategy transport to logging token requests', async () => {
      const auth = new ResolvedConfigImpl({mrtApiKey: 'key', selfSignedApi: true}, [], []).createMrtAuth();

      const token = await createLoggingToken({projectSlug: 'p', environmentSlug: 'e', origin: baseUrl}, auth);

      expect(token).to.equal('logging:Bearer key');
    });

    it('opens API WebSockets with the strategy transport', async () => {
      const open = (options: {selfSignedApi?: boolean}) =>
        new Promise<string>((resolve) => {
          const ws = createApiWebSocket(`wss://${host}/`, options);
          ws.addEventListener('open', () => {
            ws.close();
            resolve('open');
          });
          ws.addEventListener('error', () => resolve('error'));
        });

      expect(await open({selfSignedApi: true})).to.equal('open');
      expect(await open({})).to.equal('error');
    });

    it('does not relax TLS for strategies built without selfSignedApi', async () => {
      const relaxed = new OAuthStrategy({
        clientId: nextClientId(),
        clientSecret: 'secret',
        accountManagerHost: host,
        selfSignedApi: true,
      });
      await relaxed.getAuthorizationHeader();

      const strict = new OAuthStrategy({clientId: nextClientId(), clientSecret: 'secret', accountManagerHost: host});
      try {
        await strict.getAuthorizationHeader();
        expect.fail('expected certificate error');
      } catch (error) {
        expect(isCertificateError(error) || /certificate|TLS/i.test(String(error))).to.equal(true);
      }
    });
  });
});
