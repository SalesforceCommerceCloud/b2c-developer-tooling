/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  validateScaffoldManifest,
  evaluateCondition,
  validateParameters,
  isValidScaffoldName,
  isValidParameterName,
} from '../../src/scaffold/validators.js';
import type {ScaffoldManifest} from '../../src/scaffold/types.js';

describe('scaffold/validators', () => {
  describe('validateScaffoldManifest', () => {
    const validManifest = {
      name: 'test-scaffold',
      displayName: 'Test Scaffold',
      description: 'A test scaffold',
      category: 'cartridge',
      parameters: [],
    };

    it('should accept a valid manifest', () => {
      const errors = validateScaffoldManifest(validManifest);
      expect(errors).to.be.empty;
    });

    it('should reject null manifest', () => {
      const errors = validateScaffoldManifest(null);
      expect(errors).to.include('Manifest must be an object');
    });

    it('should reject missing name', () => {
      const manifest = {...validManifest, name: undefined};
      const errors = validateScaffoldManifest(manifest);
      expect(errors).to.include('Manifest must have a "name" field (string)');
    });

    it('should reject invalid name format', () => {
      const manifest = {...validManifest, name: 'InvalidName'};
      const errors = validateScaffoldManifest(manifest);
      expect(errors).to.include('Manifest "name" must be kebab-case (lowercase letters, numbers, hyphens)');
    });

    it('should reject missing category', () => {
      const manifest = {...validManifest, category: undefined};
      const errors = validateScaffoldManifest(manifest);
      expect(errors).to.include('Manifest must have a "category" field (string)');
    });

    it('should accept any category string', () => {
      const manifest = {...validManifest, category: 'custom-category'};
      const errors = validateScaffoldManifest(manifest);
      expect(errors).to.be.empty;
    });

    it('should validate parameter definitions', () => {
      const manifest = {
        ...validManifest,
        parameters: [
          {
            name: 'testParam',
            prompt: 'Enter a value',
            type: 'string',
            required: true,
          },
        ],
      };
      const errors = validateScaffoldManifest(manifest);
      expect(errors).to.be.empty;
    });

    it('should reject parameters with reserved names', () => {
      const manifest = {
        ...validManifest,
        parameters: [
          {
            name: 'kebabCase',
            prompt: 'Enter a value',
            type: 'string',
            required: true,
          },
        ],
      };
      const errors = validateScaffoldManifest(manifest);
      expect(errors.some((e) => e.includes('reserved name'))).to.be.true;
    });

    it('should reject choice parameters without choices or source', () => {
      const manifest = {
        ...validManifest,
        parameters: [
          {
            name: 'testChoice',
            prompt: 'Select an option',
            type: 'choice',
            required: true,
          },
        ],
      };
      const errors = validateScaffoldManifest(manifest);
      expect(errors.some((e) => e.includes('must have a "choices" array or a "source" field'))).to.be.true;
    });

    it('should accept choice parameters with source instead of choices', () => {
      const manifest = {
        ...validManifest,
        parameters: [
          {
            name: 'testChoice',
            prompt: 'Select an option',
            type: 'choice',
            required: true,
            source: 'cartridges',
          },
        ],
      };
      const errors = validateScaffoldManifest(manifest);
      expect(errors).to.be.empty;
    });

    it('should accept valid source values', () => {
      const manifest = {
        ...validManifest,
        parameters: [
          {
            name: 'cartridgeName',
            prompt: 'Select cartridge',
            type: 'string',
            required: true,
            source: 'cartridges',
          },
          {
            name: 'hookPoint',
            prompt: 'Select hook',
            type: 'string',
            required: true,
            source: 'hook-points',
          },
          {
            name: 'siteId',
            prompt: 'Select site',
            type: 'choice',
            required: true,
            source: 'sites',
          },
        ],
      };
      const errors = validateScaffoldManifest(manifest);
      expect(errors).to.be.empty;
    });

    it('should reject invalid source values', () => {
      const manifest = {
        ...validManifest,
        parameters: [
          {
            name: 'testParam',
            prompt: 'Select something',
            type: 'string',
            required: true,
            source: 'invalid-source',
          },
        ],
      };
      const errors = validateScaffoldManifest(manifest);
      expect(errors.some((e) => e.includes('"source" must be one of'))).to.be.true;
    });
  });

  describe('evaluateCondition', () => {
    it('should return true for undefined condition', () => {
      expect(evaluateCondition(undefined, {})).to.be.true;
    });

    it('should evaluate equality condition', () => {
      expect(evaluateCondition('foo=bar', {foo: 'bar'})).to.be.true;
      expect(evaluateCondition('foo=bar', {foo: 'baz'})).to.be.false;
    });

    it('should evaluate negation condition', () => {
      expect(evaluateCondition('!foo', {})).to.be.true;
      expect(evaluateCondition('!foo', {foo: ''})).to.be.true;
      expect(evaluateCondition('!foo', {foo: 'value'})).to.be.false;
    });

    it('should evaluate truthy condition', () => {
      expect(evaluateCondition('foo', {foo: 'value'})).to.be.true;
      expect(evaluateCondition('foo', {foo: true})).to.be.true;
      expect(evaluateCondition('foo', {foo: ''})).to.be.false;
      expect(evaluateCondition('foo', {})).to.be.false;
    });

    it('should handle array values in equality check', () => {
      expect(evaluateCondition('tags=api', {tags: ['api', 'rest']})).to.be.true;
      expect(evaluateCondition('tags=web', {tags: ['api', 'rest']})).to.be.false;
    });
  });

  describe('validateParameters', () => {
    const manifest: ScaffoldManifest = {
      name: 'test',
      displayName: 'Test',
      description: 'Test',
      category: 'cartridge',
      parameters: [
        {
          name: 'requiredString',
          prompt: 'Enter value',
          type: 'string',
          required: true,
        },
        {
          name: 'optionalString',
          prompt: 'Enter optional value',
          type: 'string',
          required: false,
          default: 'default-value',
        },
        {
          name: 'booleanParam',
          prompt: 'Yes or no?',
          type: 'boolean',
          required: false,
          default: true,
        },
        {
          name: 'patternParam',
          prompt: 'Enter pattern value',
          type: 'string',
          required: false,
          pattern: '^[a-z]+$',
          validationMessage: 'Must be lowercase letters only',
        },
      ],
    };

    it('should validate required parameters', () => {
      const result = validateParameters(manifest, {});
      expect(result.valid).to.be.false;
      expect(result.errors).to.have.lengthOf(1);
      expect(result.errors[0].parameter).to.equal('requiredString');
    });

    it('should accept valid parameters', () => {
      const result = validateParameters(manifest, {requiredString: 'value'});
      expect(result.valid).to.be.true;
      expect(result.values.requiredString).to.equal('value');
    });

    it('should use defaults for missing optional parameters', () => {
      const result = validateParameters(manifest, {requiredString: 'value'});
      expect(result.values.optionalString).to.equal('default-value');
      expect(result.values.booleanParam).to.equal(true);
    });

    it('should validate pattern constraints', () => {
      const result = validateParameters(manifest, {
        requiredString: 'value',
        patternParam: 'INVALID',
      });
      expect(result.valid).to.be.false;
      expect(result.errors.some((e) => e.parameter === 'patternParam')).to.be.true;
    });

    it('should accept valid pattern values', () => {
      const result = validateParameters(manifest, {
        requiredString: 'value',
        patternParam: 'lowercase',
      });
      expect(result.valid).to.be.true;
    });

    it('should normalize boolean string values', () => {
      const result = validateParameters(manifest, {
        requiredString: 'value',
        booleanParam: 'false',
      });
      expect(result.valid).to.be.true;
      expect(result.values.booleanParam).to.equal(false);
    });
  });

  describe('isValidScaffoldName', () => {
    it('should accept valid kebab-case names', () => {
      expect(isValidScaffoldName('cartridge')).to.be.true;
      expect(isValidScaffoldName('custom-api')).to.be.true;
      expect(isValidScaffoldName('page-designer-component')).to.be.true;
      expect(isValidScaffoldName('a')).to.be.true;
    });

    it('should reject invalid names', () => {
      expect(isValidScaffoldName('Invalid')).to.be.false;
      expect(isValidScaffoldName('with_underscore')).to.be.false;
      expect(isValidScaffoldName('123-starts-with-number')).to.be.false;
      expect(isValidScaffoldName('-starts-with-hyphen')).to.be.false;
    });
  });

  describe('isValidParameterName', () => {
    it('should accept valid camelCase names', () => {
      expect(isValidParameterName('cartridgeName')).to.be.true;
      expect(isValidParameterName('apiType')).to.be.true;
      expect(isValidParameterName('a')).to.be.true;
    });

    it('should reject invalid names', () => {
      expect(isValidParameterName('Invalid')).to.be.false;
      expect(isValidParameterName('with-hyphen')).to.be.false;
      expect(isValidParameterName('with_underscore')).to.be.false;
    });

    it('should reject reserved names', () => {
      expect(isValidParameterName('kebabCase')).to.be.false;
      expect(isValidParameterName('camelCase')).to.be.false;
      expect(isValidParameterName('year')).to.be.false;
      expect(isValidParameterName('uuid')).to.be.false;
    });
  });
});
