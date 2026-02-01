/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  kebabCase,
  camelCase,
  pascalCase,
  snakeCase,
  createTemplateHelpers,
  createTemplateContext,
  renderTemplate,
  renderPathTemplate,
  ScaffoldEngine,
} from '../../src/scaffold/engine.js';

describe('scaffold/engine', () => {
  describe('case conversion functions', () => {
    describe('kebabCase', () => {
      it('should convert camelCase to kebab-case', () => {
        expect(kebabCase('cartridgeName')).to.equal('cartridge-name');
        expect(kebabCase('myApiEndpoint')).to.equal('my-api-endpoint');
      });

      it('should convert PascalCase to kebab-case', () => {
        expect(kebabCase('CartridgeName')).to.equal('cartridge-name');
      });

      it('should convert spaces to hyphens', () => {
        expect(kebabCase('my cartridge name')).to.equal('my-cartridge-name');
      });

      it('should convert underscores to hyphens', () => {
        expect(kebabCase('my_cartridge_name')).to.equal('my-cartridge-name');
      });
    });

    describe('camelCase', () => {
      it('should convert kebab-case to camelCase', () => {
        expect(camelCase('cartridge-name')).to.equal('cartridgeName');
      });

      it('should convert snake_case to camelCase', () => {
        expect(camelCase('cartridge_name')).to.equal('cartridgeName');
      });

      it('should convert spaces to camelCase', () => {
        expect(camelCase('cartridge name')).to.equal('cartridgeName');
      });

      it('should lowercase first character', () => {
        expect(camelCase('CartridgeName')).to.equal('cartridgeName');
      });
    });

    describe('pascalCase', () => {
      it('should convert kebab-case to PascalCase', () => {
        expect(pascalCase('cartridge-name')).to.equal('CartridgeName');
      });

      it('should convert camelCase to PascalCase', () => {
        expect(pascalCase('cartridgeName')).to.equal('CartridgeName');
      });
    });

    describe('snakeCase', () => {
      it('should convert camelCase to snake_case', () => {
        expect(snakeCase('cartridgeName')).to.equal('cartridge_name');
      });

      it('should convert kebab-case to snake_case', () => {
        expect(snakeCase('cartridge-name')).to.equal('cartridge_name');
      });

      it('should convert spaces to underscores', () => {
        expect(snakeCase('cartridge name')).to.equal('cartridge_name');
      });
    });
  });

  describe('createTemplateHelpers', () => {
    it('should create helpers with current year', () => {
      const helpers = createTemplateHelpers();
      expect(helpers.year).to.equal(new Date().getFullYear());
    });

    it('should create helpers with current date', () => {
      const helpers = createTemplateHelpers();
      expect(helpers.date).to.match(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should create helpers with uuid function', () => {
      const helpers = createTemplateHelpers();
      const uuid1 = helpers.uuid();
      const uuid2 = helpers.uuid();
      expect(uuid1).to.match(/^[0-9a-f-]{36}$/);
      expect(uuid1).to.not.equal(uuid2);
    });

    it('should create helpers with case functions', () => {
      const helpers = createTemplateHelpers();
      expect(helpers.kebabCase('testName')).to.equal('test-name');
      expect(helpers.camelCase('test-name')).to.equal('testName');
      expect(helpers.pascalCase('test-name')).to.equal('TestName');
      expect(helpers.snakeCase('testName')).to.equal('test_name');
    });
  });

  describe('createTemplateContext', () => {
    it('should merge variables with helpers', () => {
      const context = createTemplateContext({
        cartridgeName: 'app_custom',
        includeTests: true,
      });
      expect(context.cartridgeName).to.equal('app_custom');
      expect(context.includeTests).to.equal(true);
      expect(context.kebabCase).to.be.a('function');
      expect(context.year).to.be.a('number');
    });
  });

  describe('renderTemplate', () => {
    it('should render EJS template with variables', () => {
      const context = createTemplateContext({
        name: 'test',
      });
      const result = renderTemplate('Hello, <%= name %>!', context);
      expect(result).to.equal('Hello, test!');
    });

    it('should render EJS template with helpers', () => {
      const context = createTemplateContext({
        name: 'testName',
      });
      const result = renderTemplate('Kebab: <%= kebabCase(name) %>', context);
      expect(result).to.equal('Kebab: test-name');
    });

    it('should handle conditionals', () => {
      const context = createTemplateContext({
        includeTests: true,
      });
      const result = renderTemplate('<% if (includeTests) { %>Tests included<% } %>', context);
      expect(result).to.equal('Tests included');
    });
  });

  describe('renderPathTemplate', () => {
    it('should render path variables', () => {
      const context = createTemplateContext({
        cartridgeName: 'app_custom',
        moduleName: 'myModule',
      });
      const result = renderPathTemplate('{{cartridgeName}}/cartridge/{{moduleName}}.js', context);
      expect(result).to.equal('app_custom/cartridge/myModule.js');
    });

    it('should render path with helper functions', () => {
      const context = createTemplateContext({
        moduleName: 'MyModule',
      });
      const result = renderPathTemplate('{{kebabCase moduleName}}.js', context);
      expect(result).to.equal('my-module.js');
    });

    it('should preserve unmatched placeholders', () => {
      const context = createTemplateContext({});
      const result = renderPathTemplate('{{unknownVar}}/file.js', context);
      expect(result).to.equal('{{unknownVar}}/file.js');
    });
  });

  describe('ScaffoldEngine', () => {
    it('should create engine with variables', () => {
      const engine = new ScaffoldEngine({
        cartridgeName: 'app_custom',
      });
      const context = engine.getContext();
      expect(context.cartridgeName).to.equal('app_custom');
    });

    it('should render templates', () => {
      const engine = new ScaffoldEngine({
        name: 'test',
      });
      const result = engine.render('Hello, <%= name %>!');
      expect(result).to.equal('Hello, test!');
    });

    it('should render paths', () => {
      const engine = new ScaffoldEngine({
        cartridgeName: 'app_custom',
      });
      const result = engine.renderPath('{{cartridgeName}}/cartridge');
      expect(result).to.equal('app_custom/cartridge');
    });
  });
});
