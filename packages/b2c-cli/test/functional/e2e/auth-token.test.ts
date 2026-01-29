/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {execa} from 'execa';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * E2E Tests for Authentication Token Generation
 */
describe('Auth Token E2E Tests', function () {
  this.timeout(120_000); // 2 minutes
  this.retries(2);

  const CLI_BIN = path.resolve(__dirname, '../../../bin/run.js');

  before(function () {
    if (!process.env.SFCC_CLIENT_ID || !process.env.SFCC_CLIENT_SECRET) {
      this.skip();
    }
  });

  async function runCLI(args: string[], env?: Record<string, string>) {
    const result = await execa('node', [CLI_BIN, ...args], {
      env: {
        ...process.env,
        ...env,
        SFCC_LOG_LEVEL: 'silent',
      },
      reject: false,
    });
    return result;
  }

  function decodeJWT(token: string): Record<string, unknown> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    const payload = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(payload);
  }

  it('should generate a valid OAuth token with correct format, scopes, and expiration', async function () {
    const result = await runCLI(['auth:token', '--json']);
    expect(result.exitCode).to.equal(0, `Token generation failed: ${result.stderr}`);
    expect(result.stdout).to.not.be.empty;

    const response = JSON.parse(result.stdout);
    expect(response).to.be.an('object');
    expect(response.accessToken).to.be.a('string').and.not.be.empty;
    expect(response.expires).to.be.a('string');
    expect(response.scopes).to.be.an('array').that.is.not.empty;

    // Validate JWT format
    const payload = decodeJWT(response.accessToken);
    expect(payload.sub).to.exist;
    expect(payload.exp).to.exist;

    // Validate expiration
    const now = Math.floor(Date.now() / 1000);
    expect(payload.exp as number).to.be.greaterThan(now);
    expect((payload.exp as number) - now).to.be.lessThan(86_400);

    // Validate expires field matches exp approximately
    const expiresDate = new Date(response.expires).getTime() / 1000;
    expect(Math.abs(expiresDate - (payload.exp as number))).to.be.lessThan(10);

    // Validate scopes
    expect(payload.scope, 'Token should contain scope claim').to.exist;
    const tokenScopes = Array.isArray(payload.scope) ? payload.scope : (payload.scope as string).split(' ');
    for (const s of response.scopes as string[]) {
      expect(tokenScopes, `Token should include scope "${s}"`).to.include(s);
    }
  });

  describe('Generate Token With Additional Scopes', function () {
    it('should generate a token with allowed additional scopes', async function () {
      // Use only scopes your client actually has
      const extraScopes = ['profile', 'roles'];

      const result = await runCLI(['auth:token', '--scope', extraScopes.join(','), '--json']);

      expect(result.exitCode).to.equal(0, `Token generation with extra scopes failed: ${result.stderr}`);

      const response = JSON.parse(result.stdout);
      const accessToken = response.accessToken as string;
      expect(accessToken).to.be.a('string').and.not.be.empty;
      expect(response.scopes).to.include.members(extraScopes);

      const payload = decodeJWT(accessToken);
      expect(payload.scope).to.exist;

      const tokenScopes = Array.isArray(payload.scope) ? payload.scope : (payload.scope as string).split(' ');

      for (const s of extraScopes) {
        expect(tokenScopes, `Token should include scope "${s}"`).to.include(s);
      }

      console.log(`Token with additional scopes: ${tokenScopes.join(', ')}`);
    });
  });

  describe('Invalid Credentials', function () {
    it('should fail with invalid client credentials', async function () {
      const result = await runCLI(['auth:token', '--json'], {
        SFCC_CLIENT_ID: 'invalid-client-id',
        SFCC_CLIENT_SECRET: 'invalid-client-secret',
      });

      expect(result.exitCode).to.not.equal(0);
      expect(result.stderr).to.not.be.empty;
      expect(result.stderr).to.match(/401|unauthorized|invalid.*client/i);
    });
  });

  describe('JSON Output Structure', function () {
    it('should return correct JSON keys', async function () {
      const result = await runCLI(['auth:token', '--json']);
      const response = JSON.parse(result.stdout);
      expect(response).to.have.all.keys('accessToken', 'expires', 'scopes');
    });
  });

  describe('Default Scopes', function () {
    it('should return default scopes when no scopes are requested', async function () {
      const result = await runCLI(['auth:token', '--json']);
      const response = JSON.parse(result.stdout);
      expect(response.scopes.length).to.be.greaterThan(0);
    });
  });

  describe('Non-JSON Output', function () {
    it('should output raw token in non-JSON mode', async function () {
      const result = await runCLI(['auth:token']);
      expect(result.exitCode).to.equal(0);
      expect(result.stdout).to.match(/^ey[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/); // JWT regex
    });
  });
});
