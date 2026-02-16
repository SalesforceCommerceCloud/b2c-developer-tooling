/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {parseJSONOutput, runCLI, runCLIWithRetry, TIMEOUTS} from './test-utils.js';

/**
 * E2E Tests for MRT (Managed Runtime) Lifecycle
 *
 * Tests MRT operations including:
 * 1. User profile and API key management
 * 2. Organization listing
 * 3. Project operations (list, get)
 * 4. Environment operations (list, get)
 * 5. Environment variables (list, set, delete)
 * 6. Bundle operations (list, history)
 * 7. Project member operations (list)
 *
 * Note: These tests are READ-HEAVY to avoid creating/deleting real MRT resources in CI.
 * Write operations (create project, deploy bundle) are tested with mock data where possible.
 */
describe('MRT Lifecycle E2E Tests', function () {
  this.timeout(TIMEOUTS.DEFAULT * 10); // 5 minutes for MRT operations
  this.retries(2); // Retry failed tests for network resilience

  // Pass MRT cloud origin to all CLI commands
  // Build env object without undefined values to satisfy Record<string, string>
  const MRT_TEST_ENV: Record<string, string> = {
    ...(process.env.SFCC_MRT_CLOUD_ORIGIN ? {SFCC_MRT_CLOUD_ORIGIN: process.env.SFCC_MRT_CLOUD_ORIGIN} : {}),
  };

  let projectSlug: string;
  let hasProject = false;

  before(async function () {
    // Check required environment variables for MRT
    // Either SFCC_MRT_API_KEY as env var OR ~/.mobify file must exist
    const hasMrtApiKey = Boolean(process.env.SFCC_MRT_API_KEY);

    if (!hasMrtApiKey) {
      // Try to check if ~/.mobify exists (CLI will auto-detect it)
      try {
        const testResult = await runCLI(['mrt', 'user', 'profile', '--json'], {
          timeout: 10_000,
          env: MRT_TEST_ENV,
        });
        if (testResult.exitCode !== 0) {
          const errorText = String(testResult.stderr || testResult.stdout || '');
          if (errorText.includes('MRT API key required') || errorText.includes('api_key')) {
            console.log('⚠ SFCC_MRT_API_KEY not set and ~/.mobify not configured, skipping MRT E2E tests');
            this.skip();
          }
        }
      } catch {
        console.log('⚠ MRT authentication not configured, skipping MRT E2E tests');
        this.skip();
      }
    }

    // Try to get a project from environment or discover one
    if (process.env.SFCC_MRT_PROJECT) {
      projectSlug = process.env.SFCC_MRT_PROJECT;
      hasProject = true;
      console.log(`✓ Using MRT project from env: ${projectSlug}`);
    } else {
      // Try to discover a project
      try {
        const result = await runCLI(['mrt', 'project', 'list', '--json'], {
          timeout: TIMEOUTS.DEFAULT,
          env: MRT_TEST_ENV,
        });
        if (result.exitCode === 0) {
          const response = parseJSONOutput(result);
          if (response.projects && response.projects.length > 0) {
            projectSlug = response.projects[0].slug;
            hasProject = true;
            console.log(`✓ Discovered MRT project: ${projectSlug}`);
          } else {
            console.log('⚠ No MRT projects found, some tests will be skipped');
          }
        }
      } catch {
        console.log('⚠ Could not discover MRT project, some tests will be skipped');
      }
    }
  });

  describe('Step 1: User Profile', () => {
    it('should retrieve user profile', async function () {
      const result = await runCLIWithRetry(['mrt', 'user', 'profile', '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });

      expect(result.exitCode, `Profile command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      // Response is a flat object, not nested under "user"
      expect(response).to.have.property('uuid');
      expect(response).to.have.property('email');
      expect(response).to.have.property('first_name');
    });

    it('should retrieve email preferences', async function () {
      const result = await runCLIWithRetry(['mrt', 'user', 'email-prefs', '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });

      expect(result.exitCode, `Email prefs command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      // Response is a flat object with preference fields
      expect(response).to.have.property('node_deprecation_notifications');
      expect(response).to.have.property('created_at');
      expect(response).to.have.property('updated_at');
    });
  });

  describe('Step 2: Organizations', () => {
    it('should list organizations', async function () {
      const result = await runCLIWithRetry(['mrt', 'org', 'list', '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });

      expect(result.exitCode, `Org list command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      expect(response).to.have.property('organizations');
      expect(response.organizations).to.be.an('array');
    });

    it('should get B2C connection for organization', async function () {
      // First get an org slug
      const listResult = await runCLI(['mrt', 'org', 'list', '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });
      expect(listResult.exitCode).to.equal(0);

      const listResponse = parseJSONOutput(listResult);
      if (!listResponse.organizations || listResponse.organizations.length === 0) {
        this.skip();
      }

      const orgSlug = listResponse.organizations[0].slug;

      const result = await runCLIWithRetry(['mrt', 'org', 'b2c', orgSlug, '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });

      // Skip if 404 (some orgs may not have B2C connection configured)
      if (result.exitCode !== 0) {
        const errorText = String(result.stderr || result.stdout || '');
        if (errorText.includes('404') || errorText.includes('Not found')) {
          console.log('  ⚠ B2C info not available for this org, skipping');
          this.skip();
        }
      }

      expect(result.exitCode, `Org B2C command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      expect(response).to.have.property('is_b2c_customer');
    });
  });

  describe('Step 3: Projects', () => {
    it('should list projects', async function () {
      const result = await runCLIWithRetry(['mrt', 'project', 'list', '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });

      expect(result.exitCode, `Project list command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      expect(response).to.have.property('projects');
      expect(response.projects).to.be.an('array');
    });

    it('should get specific project', async function () {
      if (!hasProject) {
        console.log('  ⚠ No project available, skipping test');
        this.skip();
      }

      // Fixed: slug is a positional argument, not a flag
      const result = await runCLIWithRetry(['mrt', 'project', 'get', projectSlug, '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });

      expect(result.exitCode, `Project get command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      // Response is a flat object, not nested under "project"
      expect(response).to.have.property('slug').that.equals(projectSlug);
      expect(response).to.have.property('name');
    });
  });

  describe('Step 4: Project Members', () => {
    it('should list project members', async function () {
      if (!hasProject) {
        console.log('  ⚠ No project available, skipping test');
        this.skip();
      }

      const result = await runCLIWithRetry(['mrt', 'project', 'member', 'list', '--project', projectSlug, '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });

      expect(result.exitCode, `Member list command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      expect(response).to.have.property('members');
      expect(response.members).to.be.an('array');

      if (response.members.length > 0) {
        expect(response.members[0]).to.have.property('email');
        expect(response.members[0]).to.have.property('role');
      }
    });

    it('should get specific project member', async function () {
      if (!hasProject) {
        console.log('  ⚠ No project available, skipping test');
        this.skip();
      }

      // First get a member email
      const listResult = await runCLI(['mrt', 'project', 'member', 'list', '--project', projectSlug, '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });
      expect(listResult.exitCode).to.equal(0);

      const listResponse = parseJSONOutput(listResult);
      if (!listResponse.members || listResponse.members.length === 0) {
        console.log('  ⚠ No members found, skipping test');
        this.skip();
      }

      const memberEmail = listResponse.members[0].email;

      const result = await runCLIWithRetry(
        ['mrt', 'project', 'member', 'get', memberEmail, '--project', projectSlug, '--json'],
        {timeout: TIMEOUTS.DEFAULT, env: MRT_TEST_ENV},
      );

      expect(result.exitCode, `Member get command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      // Response is a flat object, not nested under "member"
      expect(response).to.have.property('email').that.equals(memberEmail);
      expect(response).to.have.property('role');
    });
  });

  describe('Step 5: Environments', () => {
    let environmentName: string;

    it('should list environments for project', async function () {
      if (!hasProject) {
        console.log('  ⚠ No project available, skipping test');
        this.skip();
      }

      const result = await runCLIWithRetry(['mrt', 'env', 'list', '--project', projectSlug, '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });

      expect(result.exitCode, `Env list command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      expect(response).to.have.property('environments');
      expect(response.environments).to.be.an('array');

      if (response.environments.length > 0) {
        environmentName = response.environments[0].slug; // Use slug for commands
        expect(response.environments[0]).to.have.property('slug');
        expect(response.environments[0]).to.have.property('name');
      }
    });

    it('should get specific environment', async function () {
      if (!hasProject) {
        console.log('  ⚠ No project available, skipping test');
        this.skip();
      }

      // First ensure we have an environment
      const listResult = await runCLI(['mrt', 'env', 'list', '--project', projectSlug, '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });
      expect(listResult.exitCode).to.equal(0);

      const listResponse = parseJSONOutput(listResult);
      if (!listResponse.environments || listResponse.environments.length === 0) {
        console.log('  ⚠ No environments found, skipping test');
        this.skip();
      }

      environmentName = listResponse.environments[0].slug; // Use slug, not name

      const result = await runCLIWithRetry(
        ['mrt', 'env', 'get', '--project', projectSlug, '--environment', environmentName, '--json'],
        {timeout: TIMEOUTS.DEFAULT, env: MRT_TEST_ENV},
      );

      expect(result.exitCode, `Env get command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      // Response is a flat object, not nested under "environment"
      expect(response).to.have.property('slug').that.equals(environmentName);
      expect(response).to.have.property('name');
    });

    it('should get B2C connection for environment', async function () {
      if (!hasProject) {
        console.log('  ⚠ No project available, skipping test');
        this.skip();
      }

      // Get first environment
      const listResult = await runCLI(['mrt', 'env', 'list', '--project', projectSlug, '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });
      expect(listResult.exitCode).to.equal(0);

      const listResponse = parseJSONOutput(listResult);
      if (!listResponse.environments || listResponse.environments.length === 0) {
        console.log('  ⚠ No environments found, skipping test');
        this.skip();
      }

      environmentName = listResponse.environments[0].slug;

      const result = await runCLIWithRetry(
        ['mrt', 'env', 'b2c', '--project', projectSlug, '--environment', environmentName, '--json'],
        {timeout: TIMEOUTS.DEFAULT, env: MRT_TEST_ENV},
      );

      // Skip if 404 (some environments may not have B2C connection configured)
      if (result.exitCode !== 0) {
        const errorText = String(result.stderr || result.stdout || '');
        if (
          errorText.includes('404') ||
          errorText.includes('Not found') ||
          errorText.includes('No B2CTargetInfo matches the given query') ||
          errorText.includes('Failed to get B2C target info')
        ) {
          console.log('  ⚠ B2C target info not available for this environment, skipping');
          this.skip();
        }
      }

      expect(result.exitCode, `Env B2C command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      expect(response).to.have.property('b2cTargetInfo');
    });
  });

  describe('Step 6: Environment Variables', () => {
    const testVarKey = `E2E_TEST_VAR_${Date.now()}`;
    const testVarValue = 'e2e-test-value';
    let environmentName: string;
    let varCreated = false;

    before(async function () {
      if (!hasProject) {
        this.skip();
      }

      // Get first environment for testing
      const listResult = await runCLI(['mrt', 'env', 'list', '--project', projectSlug, '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });

      if (listResult.exitCode === 0) {
        const listResponse = parseJSONOutput(listResult);
        if (listResponse.environments && listResponse.environments.length > 0) {
          environmentName = listResponse.environments[0].slug; // Use slug for commands
        } else {
          this.skip();
        }
      } else {
        this.skip();
      }
    });

    after(async function () {
      // Cleanup: delete test variable if created
      if (varCreated && environmentName) {
        try {
          await runCLI(
            ['mrt', 'env', 'var', 'delete', testVarKey, '--project', projectSlug, '--environment', environmentName],
            {timeout: TIMEOUTS.DEFAULT, env: MRT_TEST_ENV},
          );
          console.log(`  🧹 Cleaned up test environment variable: ${testVarKey}`);
        } catch {
          // Ignore cleanup errors
        }
      }
    });

    it('should list environment variables', async function () {
      const result = await runCLIWithRetry(
        ['mrt', 'env', 'var', 'list', '--project', projectSlug, '--environment', environmentName, '--json'],
        {timeout: TIMEOUTS.DEFAULT, env: MRT_TEST_ENV},
      );

      expect(result.exitCode, `Env var list command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      expect(response).to.have.property('variables');
      expect(response.variables).to.be.an('array');
    });

    it('should set environment variable', async function () {
      const result = await runCLIWithRetry(
        [
          'mrt',
          'env',
          'var',
          'set',
          `${testVarKey}=${testVarValue}`,
          '--project',
          projectSlug,
          '--environment',
          environmentName,
          '--json',
        ],
        {timeout: TIMEOUTS.DEFAULT, env: MRT_TEST_ENV},
      );

      expect(result.exitCode, `Env var set command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      // Response has "variables" object (plural), not "variable"
      expect(response).to.have.property('variables');
      expect(response.variables).to.have.property(testVarKey).that.equals(testVarValue);
      expect(response).to.have.property('project').that.equals(projectSlug);
      expect(response).to.have.property('environment').that.equals(environmentName);

      varCreated = true;
    });

    it('should delete environment variable', async function () {
      if (!varCreated) {
        this.skip();
      }

      const result = await runCLIWithRetry(
        [
          'mrt',
          'env',
          'var',
          'delete',
          testVarKey,
          '--project',
          projectSlug,
          '--environment',
          environmentName,
          '--json',
        ],
        {timeout: TIMEOUTS.DEFAULT, env: MRT_TEST_ENV},
      );

      // In some environments, the delete operation can be retried by Mocha.
      // If a previous attempt already deleted the variable, the backend will
      // return an error indicating that the variable does not exist. Treat
      // this specific case as acceptable instead of failing the test.
      if (result.exitCode !== 0) {
        const errorText = String(result.stderr || result.stdout || '');
        if (errorText.includes('does not exist')) {
          console.log(
            `  ⚠ Environment variable ${testVarKey} was already deleted (does not exist), treating as success`,
          );
          varCreated = false;
          return;
        }
      }

      expect(result.exitCode, `Env var delete command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      // Response has {key, project, environment}, not {success: true}
      expect(response).to.have.property('key').that.equals(testVarKey);
      expect(response).to.have.property('project').that.equals(projectSlug);
      expect(response).to.have.property('environment').that.equals(environmentName);

      varCreated = false; // Mark as cleaned up
    });

    it('should verify environment variable was deleted', async function () {
      const result = await runCLIWithRetry(
        ['mrt', 'env', 'var', 'list', '--project', projectSlug, '--environment', environmentName, '--json'],
        {timeout: TIMEOUTS.DEFAULT, verbose: true, env: MRT_TEST_ENV},
      );

      expect(result.exitCode).to.equal(0);

      const response = parseJSONOutput(result);
      const foundVar = response.variables.find((v: {key: string}) => v.key === testVarKey);
      expect(foundVar, `Test variable ${testVarKey} should be deleted`).to.not.exist;
    });
  });

  describe('Step 7: Environment Redirects', () => {
    let environmentName: string;

    before(async function () {
      if (!hasProject) {
        this.skip();
      }

      // Get first environment
      const listResult = await runCLI(['mrt', 'env', 'list', '--project', projectSlug, '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });

      if (listResult.exitCode === 0) {
        const listResponse = parseJSONOutput(listResult);
        if (listResponse.environments && listResponse.environments.length > 0) {
          environmentName = listResponse.environments[0].slug; // Use slug
        } else {
          this.skip();
        }
      } else {
        this.skip();
      }
    });

    it('should list environment redirects', async function () {
      const result = await runCLIWithRetry(
        ['mrt', 'env', 'redirect', 'list', '--project', projectSlug, '--environment', environmentName, '--json'],
        {timeout: TIMEOUTS.DEFAULT, env: MRT_TEST_ENV},
      );

      expect(result.exitCode, `Redirect list command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      expect(response).to.have.property('redirects');
      expect(response.redirects).to.be.an('array');
    });
  });

  describe('Step 8: Environment Access Control', () => {
    let environmentName: string;

    before(async function () {
      if (!hasProject) {
        this.skip();
      }

      // Get first environment
      const listResult = await runCLI(['mrt', 'env', 'list', '--project', projectSlug, '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });

      if (listResult.exitCode === 0) {
        const listResponse = parseJSONOutput(listResult);
        if (listResponse.environments && listResponse.environments.length > 0) {
          environmentName = listResponse.environments[0].slug; // Use slug
        } else {
          this.skip();
        }
      } else {
        this.skip();
      }
    });

    it('should list access control settings', async function () {
      const result = await runCLIWithRetry(
        ['mrt', 'env', 'access-control', 'list', '--project', projectSlug, '--environment', environmentName, '--json'],
        {timeout: TIMEOUTS.DEFAULT, env: MRT_TEST_ENV},
      );

      expect(result.exitCode, `Access control list command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      // Response is a paginated list with headers array
      expect(response).to.have.property('headers');
      expect(response.headers).to.be.an('array');
    });
  });

  describe('Step 9: Bundles', () => {
    it('should list bundles for project', async function () {
      if (!hasProject) {
        console.log('  ⚠ No project available, skipping test');
        this.skip();
      }

      const result = await runCLIWithRetry(['mrt', 'bundle', 'list', '--project', projectSlug, '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });

      expect(result.exitCode, `Bundle list command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      expect(response).to.have.property('bundles');
      expect(response.bundles).to.be.an('array');

      if (response.bundles.length > 0) {
        expect(response.bundles[0]).to.have.property('id');
        expect(response.bundles[0]).to.have.property('message');
      }
    });

    it('should view deployment history for environment', async function () {
      if (!hasProject) {
        console.log('  ⚠ No project available, skipping test');
        this.skip();
      }

      // Get first environment
      const envListResult = await runCLI(['mrt', 'env', 'list', '--project', projectSlug, '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });
      expect(envListResult.exitCode).to.equal(0);

      const envListResponse = parseJSONOutput(envListResult);
      if (!envListResponse.environments || envListResponse.environments.length === 0) {
        console.log('  ⚠ No environments found, skipping test');
        this.skip();
      }

      const environmentName = envListResponse.environments[0].slug; // Use slug

      const result = await runCLIWithRetry(
        ['mrt', 'bundle', 'history', '--project', projectSlug, '--environment', environmentName, '--json'],
        {timeout: TIMEOUTS.DEFAULT, env: MRT_TEST_ENV},
      );

      expect(result.exitCode, `Bundle history command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      expect(response).to.have.property('deployments');
      expect(response.deployments).to.be.an('array');
    });
  });

  describe('Step 10: Project Notifications', () => {
    it('should list project notifications', async function () {
      if (!hasProject) {
        console.log('  ⚠ No project available, skipping test');
        this.skip();
      }

      const result = await runCLIWithRetry(
        ['mrt', 'project', 'notification', 'list', '--project', projectSlug, '--json'],
        {
          timeout: TIMEOUTS.DEFAULT,
          env: MRT_TEST_ENV,
        },
      );

      expect(result.exitCode, `Notification list command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      expect(response).to.have.property('notifications');
      expect(response.notifications).to.be.an('array');
    });

    it('should get specific notification if any exist', async function () {
      if (!hasProject) {
        console.log('  ⚠ No project available, skipping test');
        this.skip();
      }

      // First get list of notifications
      const listResult = await runCLI(['mrt', 'project', 'notification', 'list', '--project', projectSlug, '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });
      expect(listResult.exitCode).to.equal(0);

      const listResponse = parseJSONOutput(listResult);
      if (!listResponse.notifications || listResponse.notifications.length === 0) {
        console.log('  ⚠ No notifications found, skipping test');
        this.skip();
      }

      const notificationId = listResponse.notifications[0].id;

      const result = await runCLIWithRetry(
        [
          'mrt',
          'project',
          'notification',
          'get',
          '--project',
          projectSlug,
          '--notification-id',
          notificationId,
          '--json',
        ],
        {timeout: TIMEOUTS.DEFAULT, env: MRT_TEST_ENV},
      );

      expect(result.exitCode, `Notification get command failed: ${result.stderr}`).to.equal(0);

      const response = parseJSONOutput(result);
      expect(response).to.have.property('notification');
      expect(response.notification).to.have.property('id').that.equals(notificationId);
    });
  });

  describe('Step 11: Error Handling', () => {
    it('should fail gracefully with invalid project', async function () {
      // Fixed: slug is a positional argument, not a flag
      const result = await runCLI(['mrt', 'project', 'get', 'nonexistent-project-12345', '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });

      expect(result.exitCode, 'Command should fail for invalid project').to.not.equal(0);

      const errorText = result.stderr || result.stdout;
      expect(errorText).to.include('error');
    });

    it('should fail gracefully with invalid environment', async function () {
      if (!hasProject) {
        this.skip();
      }

      const result = await runCLI(['mrt', 'env', 'get', 'nonexistent-env-12345', '--project', projectSlug, '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: MRT_TEST_ENV,
      });

      expect(result.exitCode, 'Command should fail for invalid environment').to.not.equal(0);

      const errorText = String(result.stderr || result.stdout || '');
      // We only require that some diagnostic message is shown; it may be a warning
      // from oclif rather than containing the literal word "error".
      expect(errorText.trim().length > 0, 'Expected diagnostic output for invalid environment').to.be.true;
    });

    it('should require authentication', async function () {
      // Run without API key to test auth failure
      const result = await runCLI(['mrt', 'project', 'list', '--json'], {
        timeout: TIMEOUTS.DEFAULT,
        env: {
          SFCC_MRT_API_KEY: '',
          ...(process.env.SFCC_MRT_CLOUD_ORIGIN ? {SFCC_MRT_CLOUD_ORIGIN: process.env.SFCC_MRT_CLOUD_ORIGIN} : {}),
        }, // Override API key to empty while preserving cloud origin if set
      });

      expect(result.exitCode, 'Command should fail without API key').to.not.equal(0);

      const errorText = result.stderr || result.stdout;
      expect(errorText).to.match(/api.?key|authentication|unauthorized/i);
    });
  });
});
