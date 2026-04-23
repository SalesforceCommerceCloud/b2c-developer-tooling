/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import {SKILL_SOURCES, getSkillSource, ALL_SKILL_SETS} from '../../src/skills/sources.js';

describe('skill sources', () => {
  describe('SKILL_SOURCES', () => {
    it('contains b2c as release-artifact', () => {
      const source = SKILL_SOURCES['b2c'];
      expect(source.type).to.equal('release-artifact');
      expect(source.assetName).to.equal('b2c-skills.zip');
      expect(source.tagPattern).to.be.a('function');
      expect(source.tagPattern!('1.2.3')).to.equal('b2c-agent-plugins@1.2.3');
    });

    it('contains b2c-cli as release-artifact', () => {
      const source = SKILL_SOURCES['b2c-cli'];
      expect(source.type).to.equal('release-artifact');
      expect(source.assetName).to.equal('b2c-cli-skills.zip');
    });

    it('contains cap-dev as repo-contents', () => {
      const source = SKILL_SOURCES['cap-dev'];
      expect(source.type).to.equal('repo-contents');
      expect(source.repo).to.equal('SalesforceCommerceCloud/commerce-apps');
      expect(source.ref).to.equal('main');
      expect(source.skillsPath).to.equal('.claude/skills');
    });
  });

  describe('getSkillSource', () => {
    it('returns source config for known skill set', () => {
      const source = getSkillSource('b2c');
      expect(source.id).to.equal('b2c');
    });

    it('throws for unknown skill set', () => {
      expect(() => getSkillSource('unknown' as any)).to.throw('Unknown skill set: unknown');
    });
  });

  describe('ALL_SKILL_SETS', () => {
    it('contains all registered skill sets', () => {
      expect(ALL_SKILL_SETS).to.include('b2c');
      expect(ALL_SKILL_SETS).to.include('b2c-cli');
      expect(ALL_SKILL_SETS).to.include('cap-dev');
      expect(ALL_SKILL_SETS).to.have.lengthOf(3);
    });
  });

  describe('tagPattern strips v prefix', () => {
    it('handles versions with v prefix', () => {
      const source = SKILL_SOURCES['b2c'];
      expect(source.tagPattern!('v1.0.0')).to.equal('b2c-agent-plugins@1.0.0');
    });

    it('handles versions without v prefix', () => {
      const source = SKILL_SOURCES['b2c'];
      expect(source.tagPattern!('2.0.0')).to.equal('b2c-agent-plugins@2.0.0');
    });
  });
});
