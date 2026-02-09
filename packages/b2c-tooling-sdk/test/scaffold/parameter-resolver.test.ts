/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  resolveScaffoldParameters,
  parseParameterOptions,
  getParameterSchemas,
  type Scaffold,
} from '../../src/scaffold/index.js';

describe('scaffold/parameter-resolver', () => {
  describe('parseParameterOptions', () => {
    it('should parse key=value pairs', () => {
      const result = parseParameterOptions(['name=test', 'description=hello world']);
      expect(result).to.deep.equal({
        name: 'test',
        description: 'hello world',
      });
    });

    it('should handle boolean true values', () => {
      const result = parseParameterOptions(['enabled=true', 'disabled=false']);
      expect(result).to.deep.equal({
        enabled: true,
        disabled: false,
      });
    });

    it('should handle flag-style booleans without values', () => {
      const result = parseParameterOptions(['verbose', 'debug']);
      expect(result).to.deep.equal({
        verbose: true,
        debug: true,
      });
    });

    it('should handle values with equals signs', () => {
      const result = parseParameterOptions(['formula=a=b+c']);
      expect(result).to.deep.equal({
        formula: 'a=b+c',
      });
    });

    it('should parse multi-choice values as arrays when scaffold provided', () => {
      const scaffold = {
        manifest: {
          parameters: [{name: 'features', type: 'multi-choice'}],
        },
      } as Scaffold;
      const result = parseParameterOptions(['features=a,b,c'], scaffold);
      expect(result).to.deep.equal({
        features: ['a', 'b', 'c'],
      });
    });

    it('should not split comma values for regular strings', () => {
      const scaffold = {
        manifest: {
          parameters: [{name: 'name', type: 'string'}],
        },
      } as Scaffold;
      const result = parseParameterOptions(['name=a,b,c'], scaffold);
      expect(result).to.deep.equal({
        name: 'a,b,c',
      });
    });

    it('should handle empty input', () => {
      const result = parseParameterOptions([]);
      expect(result).to.deep.equal({});
    });
  });

  describe('resolveScaffoldParameters', () => {
    const createTestScaffold = (parameters: Scaffold['manifest']['parameters']): Scaffold => ({
      id: 'test-scaffold',
      manifest: {
        name: 'test-scaffold',
        displayName: 'Test Scaffold',
        description: 'Test scaffold',
        category: 'cartridge',
        parameters,
      },
      path: '/test',
      filesPath: '/test/files',
      source: 'built-in',
    });

    it('should pass through provided variables', async () => {
      const scaffold = createTestScaffold([{name: 'name', type: 'string', prompt: 'Name?', required: true}]);

      const result = await resolveScaffoldParameters(scaffold, {
        providedVariables: {name: 'test-value'},
      });

      expect(result.variables).to.deep.equal({name: 'test-value'});
      expect(result.missingParameters).to.have.lengthOf(0);
      expect(result.errors).to.have.lengthOf(0);
    });

    it('should track missing required parameters', async () => {
      const scaffold = createTestScaffold([{name: 'name', type: 'string', prompt: 'Name?', required: true}]);

      const result = await resolveScaffoldParameters(scaffold, {});

      expect(result.missingParameters).to.have.lengthOf(1);
      expect(result.missingParameters[0].name).to.equal('name');
    });

    it('should apply defaults when useDefaults is true', async () => {
      const scaffold = createTestScaffold([
        {name: 'name', type: 'string', prompt: 'Name?', required: true, default: 'default-name'},
      ]);

      const result = await resolveScaffoldParameters(scaffold, {
        useDefaults: true,
      });

      expect(result.variables).to.deep.equal({name: 'default-name'});
      expect(result.missingParameters).to.have.lengthOf(0);
    });

    it('should not apply defaults when useDefaults is false', async () => {
      const scaffold = createTestScaffold([
        {name: 'name', type: 'string', prompt: 'Name?', required: true, default: 'default-name'},
      ]);

      const result = await resolveScaffoldParameters(scaffold, {
        useDefaults: false,
      });

      expect(result.variables).to.not.have.property('name');
      expect(result.missingParameters).to.have.lengthOf(1);
    });

    it('should skip conditional parameters when condition is false', async () => {
      const scaffold = createTestScaffold([
        {name: 'type', type: 'choice', prompt: 'Type?', required: true, choices: [{value: 'a', label: 'A'}]},
        {name: 'advanced', type: 'string', prompt: 'Advanced?', required: true, when: 'type=b'},
      ]);

      const result = await resolveScaffoldParameters(scaffold, {
        providedVariables: {type: 'a'},
      });

      expect(result.variables).to.deep.equal({type: 'a'});
      expect(result.missingParameters).to.have.lengthOf(0);
    });

    it('should evaluate conditional parameters when condition is true', async () => {
      const scaffold = createTestScaffold([
        {name: 'type', type: 'choice', prompt: 'Type?', required: true, choices: [{value: 'b', label: 'B'}]},
        {name: 'advanced', type: 'string', prompt: 'Advanced?', required: true, when: 'type=b'},
      ]);

      const result = await resolveScaffoldParameters(scaffold, {
        providedVariables: {type: 'b'},
      });

      expect(result.missingParameters).to.have.lengthOf(1);
      expect(result.missingParameters[0].name).to.equal('advanced');
    });

    it('should validate against hook-points source (allows any)', async () => {
      const scaffold = createTestScaffold([
        {name: 'hook', type: 'choice', prompt: 'Hook?', required: true, source: 'hook-points'},
      ]);

      const result = await resolveScaffoldParameters(scaffold, {
        providedVariables: {hook: 'dw.order.calculate'},
      });

      expect(result.variables).to.deep.equal({hook: 'dw.order.calculate'});
      expect(result.errors).to.have.lengthOf(0);
    });
  });

  describe('getParameterSchemas', () => {
    it('should return parameter schemas with static choices', async () => {
      const scaffold: Scaffold = {
        id: 'test',
        manifest: {
          name: 'test',
          displayName: 'Test',
          description: 'Test',
          category: 'cartridge',
          parameters: [
            {
              name: 'type',
              type: 'choice',
              prompt: 'Type?',
              required: true,
              choices: [
                {value: 'a', label: 'Option A'},
                {value: 'b', label: 'Option B'},
              ],
            },
          ],
        },
        path: '/test',
        filesPath: '/test/files',
        source: 'built-in',
      };

      const schemas = await getParameterSchemas(scaffold);

      expect(schemas).to.have.lengthOf(1);
      expect(schemas[0].parameter.name).to.equal('type');
      expect(schemas[0].resolvedChoices).to.deep.equal([
        {value: 'a', label: 'Option A'},
        {value: 'b', label: 'Option B'},
      ]);
    });

    it('should resolve hook-points source', async () => {
      const scaffold: Scaffold = {
        id: 'test',
        manifest: {
          name: 'test',
          displayName: 'Test',
          description: 'Test',
          category: 'cartridge',
          parameters: [
            {
              name: 'hook',
              type: 'choice',
              prompt: 'Hook?',
              required: true,
              source: 'hook-points',
            },
          ],
        },
        path: '/test',
        filesPath: '/test/files',
        source: 'built-in',
      };

      const schemas = await getParameterSchemas(scaffold);

      expect(schemas).to.have.lengthOf(1);
      expect(schemas[0].resolvedChoices).to.be.an('array');
      expect(schemas[0].resolvedChoices!.length).to.be.greaterThan(0);
      expect(schemas[0].resolvedChoices!.some((c) => c.value === 'dw.order.calculate')).to.be.true;
    });

    it('should report warning for remote source without b2cInstance', async () => {
      const scaffold: Scaffold = {
        id: 'test',
        manifest: {
          name: 'test',
          displayName: 'Test',
          description: 'Test',
          category: 'cartridge',
          parameters: [
            {
              name: 'site',
              type: 'choice',
              prompt: 'Site?',
              required: true,
              source: 'sites',
            },
          ],
        },
        path: '/test',
        filesPath: '/test/files',
        source: 'built-in',
      };

      const schemas = await getParameterSchemas(scaffold);

      expect(schemas).to.have.lengthOf(1);
      expect(schemas[0].warning).to.include('requires B2C instance');
      expect(schemas[0].resolvedChoices).to.deep.equal([]);
    });
  });
});
