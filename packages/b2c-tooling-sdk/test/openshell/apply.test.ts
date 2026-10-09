/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  applyOpenShellSetup,
  buildOpenShellSetup,
  OpenShellCommandError,
  writeOpenShellFiles,
  type CommandResult,
  type CommandRunner,
} from '@salesforce/b2c-tooling-sdk/openshell';

const CONFIG = {
  hostname: 'abcd-001.dx.commercecloud.salesforce.com',
  clientId: 'my-client',
  clientSecret: 'real-secret',
  username: 'user@example.com',
  password: 'real-access-key',
};
const OPTIONS = {image: 'b2c-test:1', dockerfile: 'FROM scratch\n'};
const SECRETS = {SFCC_CLIENT_SECRET: 'real-secret', SFCC_PASSWORD: 'real-access-key'};

interface Call {
  args: string[];
  command: string;
  env?: Record<string, string>;
}

/** Mock runner: `exists` lists `command args...` prefixes that succeed; everything else not listed fails. */
function mockRunner(exists: string[]): {calls: Call[]; run: CommandRunner} {
  const calls: Call[] = [];
  const run: CommandRunner = async (command, args, env) => {
    calls.push({command, args, env});
    const line = [command, ...args].join(' ');
    const isCheck =
      line.startsWith('docker image inspect') ||
      line.startsWith('openshell profile export') ||
      line.startsWith('openshell provider get') ||
      line.startsWith('openshell sandbox get');
    const ok = !isCheck || exists.some((e) => line.startsWith(e));
    const result: CommandResult = {
      code: ok ? 0 : 1,
      stdout: line.startsWith('openshell profile export') ? '{"resource_version": 3}' : '',
      stderr: '',
    };
    return result;
  };
  return {calls, run};
}

describe('openshell/apply', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'b2c-openshell-'));
  });
  afterEach(async () => {
    await fs.rm(dir, {recursive: true, force: true});
  });

  describe('writeOpenShellFiles', () => {
    it('writes profiles, policy, Dockerfile, and setup script without secrets', async () => {
      const setup = buildOpenShellSetup(CONFIG);
      const files = await writeOpenShellFiles(setup, dir, OPTIONS);

      expect(Object.keys(files.profiles)).to.deep.equal(['b2c-client-secret', 'b2c-webdav-access-key']);
      expect(await fs.readFile(files.policy, 'utf8')).to.equal(setup.policy);
      expect(await fs.readFile(files.dockerfile, 'utf8')).to.equal(OPTIONS.dockerfile);
      const script = await fs.readFile(files.script, 'utf8');
      expect(script).to.include('openshell sandbox create \\\n  --name b2c-abcd-001');
      expect(script).to.include('--credential SFCC_CLIENT_SECRET');
      for (const file of [files.policy, files.script, ...Object.values(files.profiles)]) {
        const content = await fs.readFile(file, 'utf8');
        expect(content).to.not.include('real-secret').and.not.include('real-access-key');
      }
    });

    it('keeps an edited policy unless forced', async () => {
      const setup = buildOpenShellSetup(CONFIG);
      await fs.writeFile(path.join(dir, 'policy.yaml'), 'edited');

      const kept = await writeOpenShellFiles(setup, dir, OPTIONS);
      expect(kept).to.include({policyWritten: false, policyDiffers: true});
      expect(await fs.readFile(kept.policy, 'utf8')).to.equal('edited');

      const forced = await writeOpenShellFiles(setup, dir, {...OPTIONS, force: true});
      expect(forced).to.include({policyWritten: true, policyDiffers: false});
      expect(await writeOpenShellFiles(setup, dir, OPTIONS)).to.include({policyWritten: false, policyDiffers: false});
      expect(await fs.readFile(forced.policy, 'utf8')).to.equal(setup.policy);
    });
  });

  describe('applyOpenShellSetup', () => {
    it('creates everything on a fresh gateway, passing secrets only via env', async () => {
      const setup = buildOpenShellSetup(CONFIG);
      const files = await writeOpenShellFiles(setup, dir, OPTIONS);
      const {calls, run} = mockRunner([]);

      const steps = await applyOpenShellSetup(setup, files, {...OPTIONS, secrets: SECRETS, run});

      expect(steps.map((s) => s.description)).to.deep.equal([
        'Build image b2c-test:1',
        'Import profile b2c-client-secret',
        'Import profile b2c-webdav-access-key',
        'Create provider b2c-abcd-001-client-secret',
        'Create provider b2c-abcd-001-webdav',
        'Create sandbox b2c-abcd-001',
      ]);
      for (const call of calls) {
        expect(call.args.join(' ')).to.not.include('real-secret').and.not.include('real-access-key');
      }
      const provider = calls.find((c) => c.args.includes('b2c-abcd-001-client-secret') && c.args[1] === 'create');
      expect(provider?.env).to.deep.equal({SFCC_CLIENT_SECRET: 'real-secret'});
    });

    it('updates existing resources and applies the policy to an existing sandbox', async () => {
      const setup = buildOpenShellSetup(CONFIG);
      const files = await writeOpenShellFiles(setup, dir, OPTIONS);
      const {calls, run} = mockRunner([
        'docker image inspect',
        'openshell profile export',
        'openshell provider get',
        'openshell sandbox get',
      ]);

      const steps = await applyOpenShellSetup(setup, files, {...OPTIONS, secrets: SECRETS, run});

      expect(steps.map((s) => s.description)).to.deep.equal([
        'Update profile b2c-client-secret',
        'Update profile b2c-webdav-access-key',
        'Update provider b2c-abcd-001-client-secret',
        'Update provider b2c-abcd-001-webdav',
        'Apply policy to sandbox b2c-abcd-001',
      ]);
      const update = calls.find((c) => c.args[1] === 'update' && c.args[0] === 'profile');
      expect(update?.args.at(-1)).to.equal('b2c-client-secret');
      // The temporary update file carrying resource_version is removed
      expect(await fs.readdir(path.join(dir, 'profiles'))).to.deep.equal([
        'b2c-client-secret.yaml',
        'b2c-webdav-access-key.yaml',
      ]);
    });

    it('uploads forwarded Safety Mode rules', async () => {
      const setup = buildOpenShellSetup(CONFIG, {safety: {rules: [{command: 'sandbox:delete', action: 'block'}]}});
      const files = await writeOpenShellFiles(setup, dir, OPTIONS);
      expect(await fs.readFile(files.safetyConfig!, 'utf8')).to.equal(setup.safetyConfig);
      expect(await fs.readFile(files.script, 'utf8'))
        .to.include('--upload')
        .and.include(':/sandbox/.b2c/safety.json');

      const fresh = mockRunner([]);
      await applyOpenShellSetup(setup, files, {...OPTIONS, secrets: SECRETS, run: fresh.run});
      const create = fresh.calls.find((c) => c.args[0] === 'sandbox' && c.args[1] === 'create');
      expect(create?.args).to.include.members([
        '--upload',
        `${files.safetyConfig}:/sandbox/.b2c/safety.json`,
        '--no-git-ignore',
      ]);

      const existing = mockRunner(['docker image inspect', 'openshell sandbox get']);
      await applyOpenShellSetup(setup, files, {...OPTIONS, secrets: SECRETS, run: existing.run});
      expect(existing.calls.at(-1)?.args).to.deep.equal([
        'sandbox',
        'upload',
        '--no-git-ignore',
        'b2c-abcd-001',
        files.safetyConfig,
        '/sandbox/.b2c/safety.json',
      ]);

      // Removed again once there is nothing to forward
      const plain = await writeOpenShellFiles(buildOpenShellSetup(CONFIG), dir, OPTIONS);
      expect(plain.safetyConfig).to.equal(undefined);
      expect(await fs.readdir(dir)).to.not.include('safety.json');
    });

    it('recreates an existing sandbox when asked', async () => {
      const setup = buildOpenShellSetup(CONFIG);
      const files = await writeOpenShellFiles(setup, dir, OPTIONS);
      const {run} = mockRunner(['docker image inspect', 'openshell sandbox get']);

      const steps = await applyOpenShellSetup(setup, files, {...OPTIONS, secrets: SECRETS, recreate: true, run});

      expect(steps.slice(-2).map((s) => s.description)).to.deep.equal([
        'Delete sandbox b2c-abcd-001',
        'Create sandbox b2c-abcd-001',
      ]);
    });

    it('skips the build and the sandbox when asked', async () => {
      const setup = buildOpenShellSetup(CONFIG);
      const files = await writeOpenShellFiles(setup, dir, OPTIONS);
      const {calls, run} = mockRunner([]);

      const steps = await applyOpenShellSetup(setup, files, {
        ...OPTIONS,
        secrets: SECRETS,
        build: false,
        sandbox: false,
        run,
      });

      expect(steps.map((s) => s.description)).to.not.include('Build image b2c-test:1');
      expect(calls.some((c) => c.args[0] === 'sandbox')).to.equal(false);
    });

    it('fails when the gateway is unreachable', async () => {
      const setup = buildOpenShellSetup(CONFIG);
      const files = await writeOpenShellFiles(setup, dir, OPTIONS);
      const run: CommandRunner = async () => ({code: 1, stdout: '', stderr: 'no gateway'});

      try {
        await applyOpenShellSetup(setup, files, {...OPTIONS, secrets: SECRETS, run});
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).to.be.instanceOf(OpenShellCommandError);
        expect((error as OpenShellCommandError).command).to.equal('openshell status');
      }
    });

    it('fails when a secret is missing', async () => {
      const setup = buildOpenShellSetup(CONFIG);
      const files = await writeOpenShellFiles(setup, dir, OPTIONS);
      const {run} = mockRunner([]);

      try {
        await applyOpenShellSetup(setup, files, {...OPTIONS, secrets: {SFCC_CLIENT_SECRET: 'x'}, run});
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.equal('No value for SFCC_PASSWORD');
      }
    });
  });
});
