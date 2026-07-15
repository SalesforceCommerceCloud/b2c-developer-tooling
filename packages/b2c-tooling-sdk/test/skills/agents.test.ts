/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as os from 'node:os';
import * as path from 'node:path';
import {expect} from 'chai';
import {
  IDE_CONFIGS,
  ALL_IDE_TYPES,
  getSkillInstallPath,
  getIdeDisplayName,
  getIdeDocsUrl,
} from '../../src/skills/agents.js';
import type {IdeType} from '../../src/skills/types.js';

const home = os.homedir();

describe('skills/agents', () => {
  describe('IDE_CONFIGS and ALL_IDE_TYPES', () => {
    it('has a config entry for every type in ALL_IDE_TYPES', () => {
      for (const ide of ALL_IDE_TYPES) {
        expect(IDE_CONFIGS[ide], `config for ${ide}`).to.exist;
        expect(IDE_CONFIGS[ide].id).to.equal(ide);
      }
    });

    it('lists exactly the keys of IDE_CONFIGS (no orphans in either direction)', () => {
      expect([...ALL_IDE_TYPES].sort()).to.deep.equal((Object.keys(IDE_CONFIGS) as IdeType[]).sort());
    });

    it('gives every IDE a non-empty displayName and both install paths', () => {
      for (const ide of ALL_IDE_TYPES) {
        const config = IDE_CONFIGS[ide];
        expect(config.displayName, `${ide} displayName`).to.be.a('string').and.not.be.empty;
        expect(config.paths.projectDir, `${ide} projectDir`).to.be.a('string').and.not.be.empty;
        expect(config.paths.globalDir, `${ide} globalDir`).to.be.a('string').and.not.be.empty;
      }
    });
  });

  describe('gemini-cli entry', () => {
    it('is registered', () => {
      expect(ALL_IDE_TYPES).to.include('gemini-cli');
    });

    it('installs to .gemini/skills (project) and ~/.gemini/skills (global)', () => {
      const config = IDE_CONFIGS['gemini-cli'];
      expect(config.displayName).to.equal('Gemini CLI');
      expect(config.paths.projectDir).to.equal('.gemini/skills');
      expect(config.paths.globalDir).to.equal(path.join(home, '.gemini/skills'));
      expect(config.docsUrl).to.equal('https://google-gemini.github.io/gemini-cli/');
    });
  });

  describe('antigravity entry', () => {
    it('is registered', () => {
      expect(ALL_IDE_TYPES).to.include('antigravity');
    });

    it('installs to .agents/skills (project) and ~/.gemini/config/skills (global)', () => {
      const config = IDE_CONFIGS['antigravity'];
      expect(config.displayName).to.equal('Google Antigravity');
      expect(config.paths.projectDir).to.equal('.agents/skills');
      expect(config.paths.globalDir).to.equal(path.join(home, '.gemini/config/skills'));
      expect(config.docsUrl).to.equal('https://antigravity.google/docs/skills');
    });

    it('uses a different global path than gemini-cli despite sharing the ~/.gemini root', () => {
      expect(IDE_CONFIGS['antigravity'].paths.globalDir).to.not.equal(IDE_CONFIGS['gemini-cli'].paths.globalDir);
    });
  });

  describe('getSkillInstallPath', () => {
    it('resolves project-scope paths for gemini-cli', () => {
      const p = getSkillInstallPath('gemini-cli', 'b2c-onboarding', {global: false, projectRoot: '/proj'});
      expect(p).to.equal(path.join('/proj', '.gemini/skills', 'b2c-onboarding'));
    });

    it('resolves global-scope paths for gemini-cli', () => {
      const p = getSkillInstallPath('gemini-cli', 'b2c-onboarding', {global: true});
      expect(p).to.equal(path.join(home, '.gemini/skills', 'b2c-onboarding'));
    });

    it('resolves project-scope paths for antigravity', () => {
      const p = getSkillInstallPath('antigravity', 'b2c-onboarding', {global: false, projectRoot: '/proj'});
      expect(p).to.equal(path.join('/proj', '.agents/skills', 'b2c-onboarding'));
    });

    it('resolves global-scope paths for antigravity', () => {
      const p = getSkillInstallPath('antigravity', 'b2c-onboarding', {global: true});
      expect(p).to.equal(path.join(home, '.gemini/config/skills', 'b2c-onboarding'));
    });
  });

  describe('getIdeDisplayName / getIdeDocsUrl', () => {
    it('returns display names for the new IDEs', () => {
      expect(getIdeDisplayName('gemini-cli')).to.equal('Gemini CLI');
      expect(getIdeDisplayName('antigravity')).to.equal('Google Antigravity');
    });

    it('returns docs URLs for the new IDEs', () => {
      expect(getIdeDocsUrl('gemini-cli')).to.equal('https://google-gemini.github.io/gemini-cli/');
      expect(getIdeDocsUrl('antigravity')).to.equal('https://antigravity.google/docs/skills');
    });
  });
});
