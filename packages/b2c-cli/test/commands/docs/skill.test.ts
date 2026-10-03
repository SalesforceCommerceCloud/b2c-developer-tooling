/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {fileURLToPath} from 'node:url';
import {Config, ux} from '@oclif/core';
import type {GuidancePage, GuidanceRead} from '@salesforce/b2c-tooling-sdk/guidance';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import DocsSkill from '../../../src/commands/docs/skill.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../helpers/test-setup.js';

describe('docs skill', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  // Load the real CLI package so topics resolve against actual commands.
  let cliConfig: Config;

  before(async () => {
    cliConfig = await Config.load({root: fileURLToPath(new URL('../../..', import.meta.url))});
  });

  async function run(argv: string[], flags: Record<string, unknown> = {}): Promise<GuidancePage | GuidanceRead> {
    const command: any = await createTestCommand(
      DocsSkill,
      cliConfig,
      {collection: 'b2c-cli', limit: 10, all: false, search: false, json: true, ...flags},
      {},
      argv,
    );
    return runSilent(() => command.run());
  }

  it('lists every skill in the default collection', async () => {
    const result = (await run([])) as GuidancePage;

    expect(result.kind).to.equal('directory');
    expect(result.entries.length).to.equal(result.total);
    expect(result.entries.length).to.be.greaterThan(20);
    for (const entry of result.entries) expect(entry.id).to.match(/^b2c-cli\//);
  });

  it('reads a skill by name, with or without the b2c- prefix', async () => {
    expect(((await run(['b2c-sandbox'])) as GuidanceRead).id).to.equal('b2c-cli/b2c-sandbox');
    expect(((await run(['sandbox'])) as GuidanceRead).id).to.equal('b2c-cli/b2c-sandbox');
  });

  it('reads the skill for a command or topic', async () => {
    const result = (await run(['code', 'deploy'])) as GuidanceRead;

    expect(result.kind).to.equal('read');
    expect(result.id).to.equal('b2c-cli/b2c-code');
    expect(result.content).to.include('name: b2c-code');
    expect(((await run(['auth', 'login'])) as GuidanceRead).id).to.equal('b2c-cli/b2c-config');
  });

  it('reads reference files', async () => {
    const skill = (await run(['b2c-mrt'])) as GuidanceRead;
    const reference = (await run(['b2c-mrt'], {file: skill.references[0]})) as GuidanceRead;

    expect(reference.uri).to.equal(`skill://b2c-cli/b2c-mrt/${skill.references[0]}`);
  });

  it('falls back to search when nothing resolves', async () => {
    const result = (await run(['site', 'archive', 'import'])) as GuidancePage;

    expect(result.kind).to.equal('search');
    expect(result.entries.map((e) => e.id)).to.include('b2c-cli/b2c-site-import-export');
  });

  it('searches with --search even when a skill name matches', async () => {
    const result = (await run(['code'], {search: true})) as GuidancePage;

    expect(result.kind).to.equal('search');
  });

  it('scopes to another collection or all collections', async () => {
    const other = (await run([], {collection: 'storefront-next'})) as GuidancePage;
    for (const entry of other.entries) expect(entry.id).to.match(/^storefront-next\//);

    const all = (await run(['custom', 'api'], {all: true, search: true})) as GuidancePage;
    expect(new Set(all.entries.map((e) => e.id.split('/')[0])).size).to.be.greaterThan(1);
  });

  describe('human-readable output', () => {
    async function runHuman(argv: string[], flags: Record<string, unknown> = {}) {
      const command: any = await createTestCommand(
        DocsSkill,
        cliConfig,
        {collection: 'b2c-cli', limit: 10, all: false, search: false, ...flags},
        {},
        argv,
      );
      sinon.stub(command, 'jsonEnabled').returns(false);
      const stdout = sinon.stub(ux, 'stdout');
      const write = sinon.stub(process.stdout, 'write').returns(true);
      const stderr = sinon.stub(command, 'logToStderr');
      sinon.stub(command, 'log');
      try {
        await command.run();
      } finally {
        write.restore();
      }
      return {
        stdout: stdout
          .getCalls()
          .map((c) => String(c.args[0]))
          .join('\n'),
        written: write
          .getCalls()
          .map((c) => String(c.args[0]))
          .join(''),
        stderr: stderr
          .getCalls()
          .map((c) => String(c.args[0]))
          .join('\n'),
      };
    }

    it('renders the skill list as a table', async () => {
      const {stdout} = await runHuman([]);

      expect(stdout).to.include('b2c-code');
      expect(stdout).to.include('Skill');
    });

    it('writes skill content to stdout and references to stderr', async () => {
      const {written, stderr} = await runHuman(['b2c-mrt']);

      expect(written).to.include('name: b2c-mrt');
      expect(stderr).to.include('--file <path>');
    });

    it('renders search results', async () => {
      expect((await runHuman(['site import'], {search: true})).stdout).to.include('b2c-site-import-export');
    });

    it('suggests other searches when nothing matches', async () => {
      expect((await runHuman(['zzqqxxyy'], {search: true})).stdout).to.include('commands search');
    });
  });

  it('lists available sections when a section is missing', async () => {
    const command: any = await createTestCommand(
      DocsSkill,
      cliConfig,
      {collection: 'b2c-cli', limit: 10, all: false, search: false, json: true, section: 'nope'},
      {},
      ['b2c-code'],
    );
    const errorStub = sinon.stub(command, 'error').throws(new Error('stop'));

    try {
      await command.run();
      expect.fail('expected an error');
    } catch (error) {
      expect((error as Error).message).to.equal('stop');
    }
    expect(String(errorStub.firstCall.args[0])).to.include('Sections:');
  });

  it('requires a skill for --file', async () => {
    const command: any = await createTestCommand(
      DocsSkill,
      cliConfig,
      {collection: 'b2c-cli', limit: 10, all: false, search: false, json: true, file: 'x.md'},
      {},
      [],
    );
    const errorStub = sinon.stub(command, 'error').throws(new Error('stop'));

    try {
      await command.run();
      expect.fail('expected an error');
    } catch (error) {
      expect((error as Error).message).to.equal('stop');
    }
    expect(String(errorStub.firstCall.args[0])).to.include('Specify a skill');
  });

  it('errors when the skill bundle is missing', async () => {
    const command: any = await createTestCommand(DocsSkill, cliConfig, {collection: 'b2c-cli', json: true});
    command.catalogLoader = () => undefined;
    const errorStub = sinon.stub(command, 'error').throws(new Error('stop'));

    try {
      await command.run();
      expect.fail('expected an error');
    } catch (error) {
      expect((error as Error).message).to.equal('stop');
    }
    expect(String(errorStub.firstCall.args[0])).to.include('unavailable');
  });
});
