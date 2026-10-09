/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {runCommand} from '@oclif/test';
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';
import {createIsolatedEnvHooks} from '../../helpers/test-setup.js';

describe('setup get/set/unset', () => {
  const hooks = createIsolatedEnvHooks();
  let directory: string;
  let dwJsonPath: string;
  let envPath: string;

  beforeEach(() => {
    hooks.beforeEach();
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-setup-config-field-'));
    dwJsonPath = path.join(directory, 'dw.json');
    envPath = path.join(directory, '.env');
    fs.writeFileSync(
      dwJsonPath,
      JSON.stringify({configs: [{name: 'staging', hostname: 'staging.example.com', active: true}]}),
    );
    fs.writeFileSync(envPath, 'SFCC_CLIENT_ID=abc\n');
  });

  afterEach(() => {
    hooks.afterEach();
    fs.rmSync(directory, {recursive: true, force: true});
  });

  /** Run like a fresh process: the CLI applies the .env file to process.env, so restore it afterwards. */
  async function run(...args: string[]) {
    const [topic, command, ...rest] = args;
    const environment = {...process.env};
    try {
      return await runCommand([`${topic}:${command}`, ...rest, '--config', dwJsonPath, '--dotenv-file', envPath]);
    } finally {
      for (const key of Object.keys(process.env)) if (!(key in environment)) delete process.env[key];
    }
  }

  function readDwJson(): Record<string, any> {
    return JSON.parse(fs.readFileSync(dwJsonPath, 'utf8')).configs[0];
  }

  it('sets a key=value pair in the selected dw.json instance and reads it back', async () => {
    const set = await run('setup', 'set', 'scapi-schemas=./scapi-schemas', '--json');
    expect(set.error).to.be.undefined;
    expect(JSON.parse(set.stdout)).to.include({source: 'DwJsonSource', instance: 'staging', location: dwJsonPath});
    expect(readDwJson()['scapi-schemas']).to.deep.equal(['./scapi-schemas']);

    const get = await run('setup', 'get', 'scapi-schemas');
    expect(get.error).to.be.undefined;
    expect(get.stdout.trim()).to.equal('["./scapi-schemas"]');
    expect(get.stderr).to.include('DwJsonSource');
  });

  it('stores JSON values as objects', async () => {
    const {error} = await run('setup', 'set', 'safety', '{"level":"NO_DELETE"}');
    expect(error).to.be.undefined;
    expect(readDwJson().safety).to.deep.equal({level: 'NO_DELETE'});
  });

  it('writes fields supplied by the .env file there', async () => {
    const {error} = await run('setup', 'set', 'client-id', 'xyz');
    expect(error).to.be.undefined;
    expect(fs.readFileSync(envPath, 'utf8')).to.equal('SFCC_CLIENT_ID=xyz\n');
    expect(readDwJson()['client-id']).to.be.undefined;
  });

  it('masks sensitive values unless --unmask', async () => {
    await run('setup', 'set', 'client-secret', 'supersecretvalue123');
    expect(fs.readFileSync(envPath, 'utf8')).to.include('SFCC_CLIENT_SECRET=supersecretvalue123');

    const masked = await run('setup', 'get', 'client-secret', '--json');
    expect(JSON.parse(masked.stdout).value).to.equal('supe...REDACTED');
    const unmasked = await run('setup', 'get', 'client-secret', '--unmask', '--json');
    expect(JSON.parse(unmasked.stdout).value).to.equal('supersecretvalue123');
  });

  it('refuses invalid values without writing', async () => {
    const {error} = await run('setup', 'set', 'auto-upload', 'maybe');
    expect(error?.message).to.include('auto-upload');
    expect(readDwJson()).to.not.have.property('auto-upload');
  });

  it('refuses to write values from the shell environment', async () => {
    process.env.SFCC_CODE_VERSION = 'from-shell';
    const {error} = await run('setup', 'set', 'code-version', 'v2');
    expect(error?.message).to.include("can't be written");
    expect(readDwJson()).to.not.have.property('code-version');
  });

  it('unsets a field and reports a lower-priority fallback', async () => {
    fs.writeFileSync(envPath, 'SFCC_CODE_VERSION=env\n');
    fs.writeFileSync(
      dwJsonPath,
      JSON.stringify({
        configs: [{name: 'staging', hostname: 'staging.example.com', active: true, 'code-version': 'dw'}],
      }),
    );
    const {error, stdout} = await run('setup', 'unset', 'code-version', '--json');
    expect(error).to.be.undefined;
    expect(JSON.parse(stdout)).to.include({source: 'DotenvFile', fallback: 'DwJsonSource'});
    expect(fs.readFileSync(envPath, 'utf8')).to.equal('');
  });

  it('rejects an empty value and points to unset', async () => {
    const {error} = await run('setup', 'set', 'code-version=');
    expect(error?.message).to.include('b2c setup unset code-version');
    expect(readDwJson()).to.not.have.property('code-version');
  });

  it('writes the global default dw.json inside the isolated config directory', async () => {
    // Without --config the CLI falls back to settings.json's defaultConfigPath;
    // isolateConfig() points B2C_CONFIG_DIR at a temp directory so that is never the real one.
    const configDirectory = process.env.B2C_CONFIG_DIR!;
    expect(configDirectory.startsWith(os.tmpdir()) || configDirectory.startsWith(fs.realpathSync(os.tmpdir()))).to.be
      .true;
    const globalPath = path.join(directory, 'global-dw.json');
    fs.writeFileSync(globalPath, JSON.stringify({name: 'global', hostname: 'global.example.com', active: true}));
    fs.mkdirSync(configDirectory, {recursive: true});
    fs.writeFileSync(path.join(configDirectory, 'settings.json'), JSON.stringify({defaultConfigPath: globalPath}));
    delete process.env.SFCC_CONFIG;

    fs.rmSync(dwJsonPath);

    const environment = {...process.env};
    try {
      const {error, stdout} = await runCommand([
        'setup:set',
        'code-version',
        'v9',
        '--project-directory',
        directory,
        '--dotenv-file',
        envPath,
        '--json',
      ]);
      expect(error).to.be.undefined;
      expect(JSON.parse(stdout)).to.include({instance: 'global', location: globalPath});
    } finally {
      for (const key of Object.keys(process.env)) if (!(key in environment)) delete process.env[key];
    }
    expect(JSON.parse(fs.readFileSync(globalPath, 'utf8'))['code-version']).to.equal('v9');
  });

  it('fails for an unset key', async () => {
    const {error} = await run('setup', 'get', 'code-version');
    expect(error?.message).to.include('not set');
  });
});
