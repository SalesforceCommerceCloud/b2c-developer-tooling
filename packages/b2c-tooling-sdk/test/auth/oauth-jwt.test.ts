/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {JwtOAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';

// ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test certificate paths
const TEST_FIXTURES_DIR = path.join(__dirname, '../fixtures/jwt');
const TEST_CERT_PATH = path.join(TEST_FIXTURES_DIR, 'test-cert.pem');
const TEST_KEY_PATH = path.join(TEST_FIXTURES_DIR, 'test-key.pem');
const ENCRYPTED_CERT_PATH = path.join(TEST_FIXTURES_DIR, 'encrypted-cert.pem');
const ENCRYPTED_KEY_PATH = path.join(TEST_FIXTURES_DIR, 'encrypted-key.pem');

const AM_HOST = 'account.demandware.com';
const AM_URL = `https://${AM_HOST}/dwsso/oauth2/access_token`;
const TEST_API_URL = 'https://api.test.com/endpoint';

/**
 * Creates a mock JWT access token for testing.
 * Returns a valid JWT structure that can be decoded by the SDK.
 */
function createMockAccessToken(sub = 'test-client', scope = 'mail roles'): string {
  const header = Buffer.from(JSON.stringify({alg: 'RS256', typ: 'JWT'})).toString('base64');
  const payload = Buffer.from(
    JSON.stringify({
      sub,
      scope,
      exp: Math.floor(Date.now() / 1000) + 1800,
    }),
  ).toString('base64');
  return `${header}.${payload}.mock-signature`;
}

describe('auth/oauth-jwt', () => {
  const server = setupServer();

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  afterEach(() => {
    server.resetHandlers();
    // Clear token cache between tests
    const dummy = new JwtOAuthStrategy({
      clientId: 'test-client',
      certPath: TEST_CERT_PATH,
      keyPath: TEST_KEY_PATH,
      accountManagerHost: AM_HOST,
    });
    dummy.invalidateToken();
  });

  after(() => {
    server.close();
  });

  describe('Configuration Validation', () => {
    it('should throw error if clientId is missing', () => {
      expect(() => {
        new JwtOAuthStrategy({
          clientId: '',
          certPath: TEST_CERT_PATH,
          keyPath: TEST_KEY_PATH,
          accountManagerHost: AM_HOST,
        });
      }).to.throw('JWT authentication requires clientId');
    });

    it('should throw error if certPath is missing', () => {
      expect(() => {
        new JwtOAuthStrategy({
          clientId: 'test-client',
          certPath: '',
          keyPath: TEST_KEY_PATH,
          accountManagerHost: AM_HOST,
        });
      }).to.throw('JWT authentication requires certificate path');
    });

    it('should throw error if keyPath is missing', () => {
      expect(() => {
        new JwtOAuthStrategy({
          clientId: 'test-client',
          certPath: TEST_CERT_PATH,
          keyPath: '',
          accountManagerHost: AM_HOST,
        });
      }).to.throw('JWT authentication requires private key path');
    });

    it('should throw error if accountManagerHost is missing', () => {
      expect(() => {
        new JwtOAuthStrategy({
          clientId: 'test-client',
          certPath: TEST_CERT_PATH,
          keyPath: TEST_KEY_PATH,
          accountManagerHost: '',
        });
      }).to.throw('JWT authentication requires accountManagerHost');
    });

    it('should throw error if cert file does not exist', () => {
      expect(() => {
        new JwtOAuthStrategy({
          clientId: 'test-client',
          certPath: '/nonexistent/cert.pem',
          keyPath: TEST_KEY_PATH,
          accountManagerHost: AM_HOST,
        });
      }).to.throw('JWT certificate file not found');
    });

    it('should throw error if key file does not exist', () => {
      expect(() => {
        new JwtOAuthStrategy({
          clientId: 'test-client',
          certPath: TEST_CERT_PATH,
          keyPath: '/nonexistent/key.pem',
          accountManagerHost: AM_HOST,
        });
      }).to.throw('JWT private key file not found');
    });

    it('should throw error if certificate format is invalid', () => {
      const invalidCertPath = path.join(TEST_FIXTURES_DIR, 'invalid-cert.txt');
      fs.writeFileSync(invalidCertPath, 'not a certificate');

      try {
        expect(() => {
          new JwtOAuthStrategy({
            clientId: 'test-client',
            certPath: invalidCertPath,
            keyPath: TEST_KEY_PATH,
            accountManagerHost: AM_HOST,
          });
        }).to.throw('Invalid certificate format');
      } finally {
        fs.unlinkSync(invalidCertPath);
      }
    });

    it('should throw error if private key format is invalid', () => {
      const invalidKeyPath = path.join(TEST_FIXTURES_DIR, 'invalid-key.txt');
      fs.writeFileSync(invalidKeyPath, 'not a key');

      try {
        expect(() => {
          new JwtOAuthStrategy({
            clientId: 'test-client',
            certPath: TEST_CERT_PATH,
            keyPath: invalidKeyPath,
            accountManagerHost: AM_HOST,
          });
        }).to.throw('Invalid private key format');
      } finally {
        fs.unlinkSync(invalidKeyPath);
      }
    });

    it('should accept valid configuration', () => {
      expect(() => {
        new JwtOAuthStrategy({
          clientId: 'test-client',
          certPath: TEST_CERT_PATH,
          keyPath: TEST_KEY_PATH,
          accountManagerHost: AM_HOST,
        });
      }).to.not.throw();
    });

    it('should accept encrypted key with passphrase', () => {
      expect(() => {
        new JwtOAuthStrategy({
          clientId: 'test-client',
          certPath: ENCRYPTED_CERT_PATH,
          keyPath: ENCRYPTED_KEY_PATH,
          passphrase: 'testpass123',
          accountManagerHost: AM_HOST,
        });
      }).to.not.throw();
    });

    it('should throw error for encrypted key without passphrase', () => {
      expect(() => {
        new JwtOAuthStrategy({
          clientId: 'test-client',
          certPath: ENCRYPTED_CERT_PATH,
          keyPath: ENCRYPTED_KEY_PATH,
          accountManagerHost: AM_HOST,
        });
      }).to.throw(/JWT private key|Invalid JWT private key/);
    });

    it('should throw error for wrong passphrase', () => {
      expect(() => {
        new JwtOAuthStrategy({
          clientId: 'test-client',
          certPath: ENCRYPTED_CERT_PATH,
          keyPath: ENCRYPTED_KEY_PATH,
          passphrase: 'wrong-password',
          accountManagerHost: AM_HOST,
        });
      }).to.throw('Invalid passphrase for encrypted JWT private key');
    });
  });

  describe('JWT Generation and Token Request', () => {
    it('should generate a valid JWT with 3 parts (header.payload.signature)', async () => {
      let capturedJwt = '';

      server.use(
        http.post(AM_URL, async ({request}) => {
          const body = await request.text();
          const params = new URLSearchParams(body);
          capturedJwt = params.get('client_assertion') || '';

          return HttpResponse.json({
            access_token: createMockAccessToken(),
            expires_in: 1800,
          });
        }),
        http.get(TEST_API_URL, () => HttpResponse.text('success')),
      );

      const strategy = new JwtOAuthStrategy({
        clientId: 'test-client',
        certPath: TEST_CERT_PATH,
        keyPath: TEST_KEY_PATH,
        accountManagerHost: AM_HOST,
      });

      await strategy.fetch(TEST_API_URL);

      expect(capturedJwt.split('.')).to.have.lengthOf(3);
    });

    it('should generate JWT with correct header (RS256, JWT)', async () => {
      let capturedJwt = '';

      server.use(
        http.post(AM_URL, async ({request}) => {
          const body = await request.text();
          const params = new URLSearchParams(body);
          capturedJwt = params.get('client_assertion') || '';

          return HttpResponse.json({
            access_token: createMockAccessToken(),
            expires_in: 1800,
          });
        }),
        http.get(TEST_API_URL, () => HttpResponse.text('success')),
      );

      const strategy = new JwtOAuthStrategy({
        clientId: 'test-client',
        certPath: TEST_CERT_PATH,
        keyPath: TEST_KEY_PATH,
        accountManagerHost: AM_HOST,
      });

      await strategy.fetch(TEST_API_URL);

      const [headerB64] = capturedJwt.split('.');
      const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());

      expect(header).to.deep.equal({
        alg: 'RS256',
        typ: 'JWT',
      });
    });

    it('should generate JWT with correct payload claims (iss, sub, aud, exp)', async () => {
      let capturedJwt = '';

      server.use(
        http.post(AM_URL, async ({request}) => {
          const body = await request.text();
          const params = new URLSearchParams(body);
          capturedJwt = params.get('client_assertion') || '';

          return HttpResponse.json({
            access_token: createMockAccessToken(),
            expires_in: 1800,
          });
        }),
        http.get(TEST_API_URL, () => HttpResponse.text('success')),
      );

      const strategy = new JwtOAuthStrategy({
        clientId: 'test-client-123',
        certPath: TEST_CERT_PATH,
        keyPath: TEST_KEY_PATH,
        accountManagerHost: AM_HOST,
      });

      const beforeTime = Math.floor(Date.now() / 1000);
      await strategy.fetch(TEST_API_URL);
      const afterTime = Math.floor(Date.now() / 1000);

      const [, payloadB64] = capturedJwt.split('.');
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());

      expect(payload.iss).to.equal('test-client-123');
      expect(payload.sub).to.equal('test-client-123');
      expect(payload.aud).to.equal(AM_URL);
      expect(payload.exp).to.be.at.least(beforeTime + 60);
      expect(payload.exp).to.be.at.most(afterTime + 60);
    });

    it('should use Base64URL encoding (no + / = characters)', async () => {
      let capturedJwt = '';

      server.use(
        http.post(AM_URL, async ({request}) => {
          const body = await request.text();
          const params = new URLSearchParams(body);
          capturedJwt = params.get('client_assertion') || '';

          return HttpResponse.json({
            access_token: createMockAccessToken(),
            expires_in: 1800,
          });
        }),
        http.get(TEST_API_URL, () => HttpResponse.text('success')),
      );

      const strategy = new JwtOAuthStrategy({
        clientId: 'test-client',
        certPath: TEST_CERT_PATH,
        keyPath: TEST_KEY_PATH,
        accountManagerHost: AM_HOST,
      });

      await strategy.fetch(TEST_API_URL);

      // Base64URL should not contain + / or =
      expect(capturedJwt).to.not.match(/[+/=]/);
    });

    it('should send JWT in POST body (not Authorization header)', async () => {
      let capturedAuthHeader: string | null = null;
      let capturedBody = '';

      server.use(
        http.post(AM_URL, async ({request}) => {
          capturedAuthHeader = request.headers.get('authorization');
          capturedBody = await request.text();

          return HttpResponse.json({
            access_token: createMockAccessToken(),
            expires_in: 1800,
          });
        }),
        http.get(TEST_API_URL, () => HttpResponse.text('success')),
      );

      const strategy = new JwtOAuthStrategy({
        clientId: 'test-client',
        certPath: TEST_CERT_PATH,
        keyPath: TEST_KEY_PATH,
        accountManagerHost: AM_HOST,
      });

      await strategy.fetch(TEST_API_URL);

      // Should NOT have Authorization header
      expect(capturedAuthHeader).to.be.null;

      // Should have JWT in body
      expect(capturedBody).to.include('client_assertion=');
    });

    it('should include required OAuth parameters', async () => {
      let capturedBody = '';

      server.use(
        http.post(AM_URL, async ({request}) => {
          capturedBody = await request.text();

          return HttpResponse.json({
            access_token: createMockAccessToken(),
            expires_in: 1800,
          });
        }),
        http.get(TEST_API_URL, () => HttpResponse.text('success')),
      );

      const strategy = new JwtOAuthStrategy({
        clientId: 'test-client',
        certPath: TEST_CERT_PATH,
        keyPath: TEST_KEY_PATH,
        accountManagerHost: AM_HOST,
      });

      await strategy.fetch(TEST_API_URL);

      const params = new URLSearchParams(capturedBody);

      expect(params.get('grant_type')).to.equal('client_credentials');
      expect(params.get('client_assertion_type')).to.equal('urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
      expect(params.get('client_assertion')).to.exist;
    });

    it('should include scopes if configured', async () => {
      let capturedBody = '';

      server.use(
        http.post(AM_URL, async ({request}) => {
          capturedBody = await request.text();

          return HttpResponse.json({
            access_token: createMockAccessToken(),
            expires_in: 1800,
          });
        }),
        http.get(TEST_API_URL, () => HttpResponse.text('success')),
      );

      const strategy = new JwtOAuthStrategy({
        clientId: 'test-client',
        certPath: TEST_CERT_PATH,
        keyPath: TEST_KEY_PATH,
        accountManagerHost: AM_HOST,
        scopes: ['mail', 'roles', 'tenantFilter'],
      });

      await strategy.fetch(TEST_API_URL);

      const params = new URLSearchParams(capturedBody);
      expect(params.get('scope')).to.equal('mail roles tenantFilter');
    });

    it('should inject Bearer token in API request Authorization header', async () => {
      let apiAuthHeader: string | null = null;

      server.use(
        http.post(AM_URL, () =>
          HttpResponse.json({
            access_token: createMockAccessToken(),
            expires_in: 1800,
          }),
        ),
        http.get(TEST_API_URL, ({request}) => {
          apiAuthHeader = request.headers.get('authorization');
          return HttpResponse.text('success');
        }),
      );

      const strategy = new JwtOAuthStrategy({
        clientId: 'test-client',
        certPath: TEST_CERT_PATH,
        keyPath: TEST_KEY_PATH,
        accountManagerHost: AM_HOST,
      });

      await strategy.fetch(TEST_API_URL);

      expect(apiAuthHeader).to.match(/^Bearer .+/);
    });

    it('should return access token via getAuthorizationHeader', async () => {
      server.use(
        http.post(AM_URL, () =>
          HttpResponse.json({
            access_token: createMockAccessToken(),
            expires_in: 1800,
          }),
        ),
      );

      const strategy = new JwtOAuthStrategy({
        clientId: 'test-client',
        certPath: TEST_CERT_PATH,
        keyPath: TEST_KEY_PATH,
        accountManagerHost: AM_HOST,
      });

      const authHeader = await strategy.getAuthorizationHeader();

      expect(authHeader).to.match(/^Bearer .+/);
    });

    it('should return full token response via getTokenResponse', async () => {
      server.use(
        http.post(AM_URL, () =>
          HttpResponse.json({
            access_token: createMockAccessToken('test-client', 'mail roles'),
            expires_in: 1800,
          }),
        ),
      );

      const strategy = new JwtOAuthStrategy({
        clientId: 'test-client',
        certPath: TEST_CERT_PATH,
        keyPath: TEST_KEY_PATH,
        accountManagerHost: AM_HOST,
      });

      const tokenResponse = await strategy.getTokenResponse();

      expect(tokenResponse.accessToken).to.exist;
      expect(tokenResponse.expires).to.be.instanceOf(Date);
      expect(tokenResponse.scopes).to.include('mail');
      expect(tokenResponse.scopes).to.include('roles');
    });
  });

  describe('Error Handling', () => {
    it('should throw error on 401 response (unregistered certificate)', async () => {
      server.use(
        http.post(AM_URL, () =>
          HttpResponse.text('Invalid JWT signature', {
            status: 401,
            statusText: 'Unauthorized',
          }),
        ),
      );

      const strategy = new JwtOAuthStrategy({
        clientId: 'test-client',
        certPath: TEST_CERT_PATH,
        keyPath: TEST_KEY_PATH,
        accountManagerHost: AM_HOST,
      });

      try {
        await strategy.fetch(TEST_API_URL);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('JWT authentication failed (401)');
        expect(error.message).to.include('unregistered certificate');
      }
    });

    it('should throw error on 400 response', async () => {
      server.use(
        http.post(AM_URL, () =>
          HttpResponse.text('invalid_request', {
            status: 400,
            statusText: 'Bad Request',
          }),
        ),
      );

      const strategy = new JwtOAuthStrategy({
        clientId: 'test-client',
        certPath: TEST_CERT_PATH,
        keyPath: TEST_KEY_PATH,
        accountManagerHost: AM_HOST,
      });

      try {
        await strategy.fetch(TEST_API_URL);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('JWT authentication failed (400)');
      }
    });

    it('should throw error if response has no access_token', async () => {
      server.use(http.post(AM_URL, () => HttpResponse.json({})));

      const strategy = new JwtOAuthStrategy({
        clientId: 'test-client',
        certPath: TEST_CERT_PATH,
        keyPath: TEST_KEY_PATH,
        accountManagerHost: AM_HOST,
      });

      try {
        await strategy.fetch(TEST_API_URL);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('No access token in response');
      }
    });
  });

  describe('Token Caching', () => {
    it('should cache token after first request', async () => {
      let tokenRequestCount = 0;

      server.use(
        http.post(AM_URL, () => {
          tokenRequestCount++;
          return HttpResponse.json({
            access_token: createMockAccessToken(),
            expires_in: 1800,
          });
        }),
        http.get(TEST_API_URL, () => HttpResponse.text('success')),
      );

      const strategy = new JwtOAuthStrategy({
        clientId: 'test-client',
        certPath: TEST_CERT_PATH,
        keyPath: TEST_KEY_PATH,
        accountManagerHost: AM_HOST,
      });

      // First call - should request token
      await strategy.fetch(TEST_API_URL);
      expect(tokenRequestCount).to.equal(1);

      // Second call - should use cached token
      await strategy.fetch(TEST_API_URL);
      expect(tokenRequestCount).to.equal(1);
    });

    it('should invalidate cache when invalidateToken is called', async () => {
      let tokenRequestCount = 0;

      server.use(
        http.post(AM_URL, () => {
          tokenRequestCount++;
          return HttpResponse.json({
            access_token: createMockAccessToken(`test-client-${tokenRequestCount}`),
            expires_in: 1800,
          });
        }),
        http.get(TEST_API_URL, () => HttpResponse.text('success')),
      );

      const strategy = new JwtOAuthStrategy({
        clientId: 'test-client',
        certPath: TEST_CERT_PATH,
        keyPath: TEST_KEY_PATH,
        accountManagerHost: AM_HOST,
      });

      // First call
      await strategy.fetch(TEST_API_URL);
      expect(tokenRequestCount).to.equal(1);

      // Invalidate cache
      strategy.invalidateToken();

      // Should request new token
      await strategy.fetch(TEST_API_URL);
      expect(tokenRequestCount).to.equal(2);
    });

    it('should not cache on error response', async () => {
      let tokenRequestCount = 0;

      server.use(
        http.post(AM_URL, () => {
          tokenRequestCount++;
          return HttpResponse.text('error', {status: 401});
        }),
      );

      const strategy = new JwtOAuthStrategy({
        clientId: 'test-client',
        certPath: TEST_CERT_PATH,
        keyPath: TEST_KEY_PATH,
        accountManagerHost: AM_HOST,
      });

      // First failed attempt
      try {
        await strategy.fetch(TEST_API_URL);
      } catch {
        // Expected
      }
      expect(tokenRequestCount).to.equal(1);

      // Second attempt - should try again (not cached)
      try {
        await strategy.fetch(TEST_API_URL);
      } catch {
        // Expected
      }
      expect(tokenRequestCount).to.equal(2);
    });
  });
});
