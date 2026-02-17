/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {parseJSONOutput, runCLI, runCLIWithRetry, TIMEOUTS} from './test-utils.js';

/**
 * E2E Tests for Account Manager Operations
 *
 * Tests Account Manager operations including:
 * 1. Organization listing and details
 * 2. User listing and details
 * 3. Role listing and details
 * 4. Role grant/revoke (read-only verification)
 * 5. Error handling
 *
 * Note: These tests are READ-ONLY to avoid creating/deleting real Account Manager
 * resources in CI. User creation/deletion and role modifications are NOT tested
 * to prevent accidental impact on production accounts.
 */
describe('Account Manager Operations E2E Tests', function () {
  this.timeout(TIMEOUTS.DEFAULT * 10); // 5 minutes
  this.retries(2);

  let hasOrgs = false;
  let orgId: string;
  let hasUsers = false;
  let userId: string;
  let hasRoles = false;
  let roleId: string;
  let hasApiClients = false;
  let apiClientId: string;

  // Force client-credentials auth for all AM tests (no browser in CI)
  // Build env object without undefined values to satisfy Record<string, string>
  // Note: Don't pass SFCC_AUTH_METHODS via env as it causes parsing issues
  const AM_AUTH_ENV: Record<string, string> = {
    ...(process.env.SFCC_CLIENT_ID ? {SFCC_CLIENT_ID: process.env.SFCC_CLIENT_ID} : {}),
    ...(process.env.SFCC_CLIENT_SECRET ? {SFCC_CLIENT_SECRET: process.env.SFCC_CLIENT_SECRET} : {}),
  };

  before(async function () {
    // Check required environment variables
    if (!process.env.SFCC_CLIENT_ID || !process.env.SFCC_CLIENT_SECRET) {
      console.log('⚠ Missing OAuth credentials, skipping Account Manager E2E tests');
      this.skip();
    }

    // Check if we have access to organizations
    try {
      const result = await runCLI(['am', 'orgs', 'list', '--json', '--auth-methods', 'client-credentials'], {
        timeout: TIMEOUTS.DEFAULT,
        env: AM_AUTH_ENV,
      });
      if (result.exitCode === 0) {
        const response = parseJSONOutput(result);
        if (response.content && response.content.length > 0) {
          orgId = response.content[0].id;
          hasOrgs = true;
          console.log(`✓ Found ${response.content.length} organization(s)`);
        } else {
          console.log('⚠ No organizations found, some tests will be skipped');
        }
      } else {
        // Check if error is due to auth/permissions
        const errorText = String(result.stderr || result.stdout || '');
        if (errorText.includes('401') || errorText.includes('403') || errorText.includes('unauthorized')) {
          console.log('⚠ Account Manager access denied (401/403), skipping all AM tests');
          console.log('   Your OAuth client may not have Account Manager permissions');
          this.skip(); // Skip entire suite if no access
        } else {
          console.log('⚠ Could not access organizations, some tests will be skipped');
        }
      }
    } catch (error) {
      console.log('⚠ Could not access organizations, some tests will be skipped');
      console.log(`   Error: ${error}`);
    }

    // Check if we have access to users
    try {
      const result = await runCLI(['am', 'users', 'list', '--json', '--auth-methods', 'client-credentials'], {
        timeout: TIMEOUTS.DEFAULT,
        env: AM_AUTH_ENV,
      });
      if (result.exitCode === 0) {
        const response = parseJSONOutput(result);
        if (response.content && response.content.length > 0) {
          userId = response.content[0].mail;
          hasUsers = true;
          console.log(`✓ Found ${response.content.length} user(s)`);
        }
      }
    } catch {
      console.log('⚠ Could not access users, some tests will be skipped');
    }

    // Check if we have access to roles
    try {
      const result = await runCLI(['am', 'roles', 'list', '--json', '--auth-methods', 'client-credentials'], {
        timeout: TIMEOUTS.DEFAULT,
        env: AM_AUTH_ENV,
      });
      if (result.exitCode === 0) {
        const response = parseJSONOutput(result);
        if (response.content && response.content.length > 0) {
          roleId = response.content[0].id;
          hasRoles = true;
          console.log(`✓ Found ${response.content.length} role(s)`);
        }
      }
    } catch {
      console.log('⚠ Could not access roles, some tests will be skipped');
    }

    // Check if we have access to API clients
    try {
      const result = await runCLI(['am', 'clients', 'list', '--json', '--auth-methods', 'client-credentials'], {
        timeout: TIMEOUTS.DEFAULT,
        env: AM_AUTH_ENV,
      });
      if (result.exitCode === 0) {
        const response = parseJSONOutput(result);
        if (response.content && response.content.length > 0) {
          apiClientId = response.content[0].id;
          if (typeof apiClientId === 'string' && apiClientId.length > 0) {
            hasApiClients = true;
            console.log(`✓ Found ${response.content.length} API client(s)`);
          }
        }
      }
    } catch {
      console.log('⚠ Could not access API clients, some tests will be skipped');
    }
  });

  describe('Step 1: Organizations', () => {
    it('should list organizations', async function () {
      const result = await runCLIWithRetry(['am', 'orgs', 'list', '--json', '--auth-methods', 'client-credentials'], {
        timeout: TIMEOUTS.DEFAULT,
        verbose: true,
        env: AM_AUTH_ENV,
      });

      expect(result.exitCode, `Orgs list command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      expect(response).to.have.property('content');
      expect(response.content).to.be.an('array');

      if (response.content.length > 0) {
        expect(response.content[0]).to.have.property('id');
        expect(response.content[0]).to.have.property('name');
      }
    });

    it('should get specific organization', async function () {
      if (!hasOrgs) {
        console.log('  ⚠ No organizations available, skipping test');
        this.skip();
      }

      const result = await runCLIWithRetry(
        ['am', 'orgs', 'get', orgId, '--json', '--auth-methods', 'client-credentials'],
        {
          timeout: TIMEOUTS.DEFAULT,
          verbose: true,
          env: AM_AUTH_ENV,
        },
      );

      // Skip if authentication/permission error (client may not have get permissions)
      if (result.exitCode !== 0) {
        const errorText = String(result.stderr || result.stdout || '');
        if (
          errorText.includes('Authentication invalid') ||
          errorText.includes('Access is denied') ||
          errorText.includes('401') ||
          errorText.includes('403')
        ) {
          console.log('  ⚠ Insufficient permissions for org get, skipping test');
          this.skip();
        }
      }

      expect(result.exitCode, `Org get command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      // Org get --json returns the organization object directly
      expect(response).to.have.property('id').that.equals(orgId);
      expect(response).to.have.property('name');
    });
  });

  describe('Step 2: Users', () => {
    it('should list users', async function () {
      const result = await runCLIWithRetry(['am', 'users', 'list', '--json', '--auth-methods', 'client-credentials'], {
        timeout: TIMEOUTS.DEFAULT,
        verbose: true,
        env: AM_AUTH_ENV,
      });

      expect(result.exitCode, `Users list command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      expect(response).to.have.property('content');
      expect(response.content).to.be.an('array');

      if (response.content.length > 0) {
        expect(response.content[0]).to.have.property('mail');
        const hasIdentifier = response.content[0].id || response.content[0].mail;
        expect(hasIdentifier, 'User should have id or mail').to.exist;
      }
    });

    it('should get specific user', async function () {
      if (!hasUsers) {
        console.log('  ⚠ No users available, skipping test');
        this.skip();
      }

      const result = await runCLIWithRetry(
        ['am', 'users', 'get', userId, '--json', '--auth-methods', 'client-credentials'],
        {
          timeout: TIMEOUTS.DEFAULT,
          verbose: true,
          env: AM_AUTH_ENV,
        },
      );

      expect(result.exitCode, `User get command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      // User get --json returns the user object directly
      expect(response).to.have.property('mail');
    });
  });

  describe('Step 3: Roles', () => {
    it('should list roles', async function () {
      const result = await runCLIWithRetry(['am', 'roles', 'list', '--json', '--auth-methods', 'client-credentials'], {
        timeout: TIMEOUTS.DEFAULT,
        verbose: true,
        env: AM_AUTH_ENV,
      });

      expect(result.exitCode, `Roles list command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      expect(response).to.have.property('content');
      expect(response.content).to.be.an('array');

      if (response.content.length > 0) {
        expect(response.content[0]).to.have.property('id');
        expect(response.content[0]).to.have.property('description');
      }
    });

    it('should get specific role', async function () {
      if (!hasRoles) {
        console.log('  ⚠ No roles available, skipping test');
        this.skip();
      }

      const result = await runCLIWithRetry(
        ['am', 'roles', 'get', roleId, '--json', '--auth-methods', 'client-credentials'],
        {
          timeout: TIMEOUTS.DEFAULT,
          verbose: true,
          env: AM_AUTH_ENV,
        },
      );

      // Skip if authentication/permission error (some roles may be restricted)
      if (result.exitCode !== 0) {
        const errorText = String(result.stderr || result.stdout || '');
        if (
          errorText.includes('Authentication invalid') ||
          errorText.includes('Access is denied') ||
          errorText.includes('401') ||
          errorText.includes('403')
        ) {
          console.log('  ⚠ Insufficient permissions for role get, skipping test');
          this.skip();
        }
      }

      expect(result.exitCode, `Role get command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      // Role get --json returns the role object directly
      expect(response).to.have.property('id').that.equals(roleId);
      expect(response).to.have.property('description');
    });
  });

  describe('Step 4: Error Handling', () => {
    it('should fail gracefully with invalid organization ID', async function () {
      const result = await runCLI(
        ['am', 'orgs', 'get', 'invalid-org-id-12345', '--json', '--auth-methods', 'client-credentials'],
        {
          timeout: TIMEOUTS.DEFAULT,
          env: AM_AUTH_ENV,
        },
      );

      expect(result.exitCode, 'Command should fail for invalid org').to.not.equal(0);

      const errorText = result.stderr || result.stdout;
      expect(errorText).to.include('error');
    });

    it('should fail gracefully with invalid user ID', async function () {
      const result = await runCLI(
        ['am', 'users', 'get', 'nonexistent-user-12345@example.com', '--json', '--auth-methods', 'client-credentials'],
        {
          timeout: TIMEOUTS.DEFAULT,
          env: AM_AUTH_ENV,
        },
      );

      expect(result.exitCode, 'Command should fail for invalid user').to.not.equal(0);

      const errorText = result.stderr || result.stdout;
      expect(errorText).to.include('error');
    });

    it('should require authentication', async function () {
      const result = await runCLI(['am', 'orgs', 'list', '--json', '--auth-methods', 'client-credentials'], {
        timeout: TIMEOUTS.DEFAULT,
        env: {
          SFCC_CLIENT_ID: '',
          SFCC_CLIENT_SECRET: '',
          SFCC_CONFIG: '/nonexistent/dw.json', // Prevent loading dw.json
        },
      });

      expect(result.exitCode, 'Command should fail without credentials').to.not.equal(0);

      const errorText = String(result.stderr || result.stdout || '');
      expect(errorText).to.match(/client.?id|credentials|authentication|unauthorized/i);
    });
  });

  describe('Step 5: JSON Output Structure', () => {
    it('should return valid JSON for all commands', async function () {
      const commands = [
        ['am', 'orgs', 'list'],
        ['am', 'users', 'list'],
        ['am', 'roles', 'list'],
      ];

      // Run all commands in parallel to avoid await-in-loop
      const results = await Promise.all(
        commands.map((cmd) =>
          runCLI([...cmd, '--json', '--auth-methods', 'client-credentials'], {
            timeout: TIMEOUTS.DEFAULT,
            env: AM_AUTH_ENV,
          }),
        ),
      );

      // Validate all results
      for (const [index, cmd] of commands.entries()) {
        const result = results[index];

        if (result.exitCode === 0) {
          // Should be parseable JSON
          expect(() => parseJSONOutput(result), `Command ${cmd.join(' ')} returned invalid JSON`).to.not.throw();
        }
      }
    });
  });

  describe('Step 6: API Clients', () => {
    it('should list API clients', async function () {
      const result = await runCLIWithRetry(
        ['am', 'clients', 'list', '--json', '--auth-methods', 'client-credentials'],
        {
          timeout: TIMEOUTS.DEFAULT,
          verbose: true,
          env: AM_AUTH_ENV,
        },
      );

      // If the command is not available in this CLI build, skip instead of failing
      if (
        result.exitCode === 127 &&
        (String(result.stderr).includes('is not a b2c command') ||
          String(result.stderr).includes('Run b2c help am for a list of available commands'))
      ) {
        console.log('  ⚠ am clients list command not available in this build, skipping test');
        this.skip();
      }

      expect(result.exitCode, `Clients list command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      expect(response).to.have.property('content');
      expect(response.content).to.be.an('array');

      if (response.content.length > 0) {
        expect(response.content[0]).to.have.property('id');
        expect(response.content[0]).to.have.property('name');
      }
    });

    it('should get specific API client', async function () {
      if (!hasApiClients) {
        console.log('  ⚠ No API clients available, skipping test');
        this.skip();
      }

      const result = await runCLIWithRetry(
        ['am', 'clients', 'get', apiClientId, '--json', '--auth-methods', 'client-credentials'],
        {
          timeout: TIMEOUTS.DEFAULT,
          verbose: true,
          env: AM_AUTH_ENV,
        },
      );

      // Skip if authentication/permission error (some API clients may be restricted)
      if (result.exitCode !== 0) {
        const errorText = String(result.stderr || result.stdout || '');
        if (
          errorText.includes('Authentication invalid') ||
          errorText.includes('Access is denied') ||
          errorText.includes('401') ||
          errorText.includes('403')
        ) {
          console.log('  ⚠ Insufficient permissions for API client get, skipping test');
          this.skip();
        }
      }

      expect(result.exitCode, `API client get command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      // Clients get --json returns the client object directly
      expect(response).to.have.property('id').that.equals(apiClientId);
      expect(response).to.have.property('name');
    });
  });
});
