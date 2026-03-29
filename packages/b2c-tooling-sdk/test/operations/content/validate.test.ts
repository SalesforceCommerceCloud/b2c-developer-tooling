/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {expect} from 'chai';
import {
  CONTENT_SCHEMA_TYPES,
  MetaDefinitionDetectionError,
  detectMetaDefinitionType,
  detectTypeFromData,
  detectTypeFromPath,
  validateMetaDefinition,
  validateMetaDefinitionFile,
} from '@salesforce/b2c-tooling-sdk/operations/content';

function writeTempJson(data: unknown, filename = 'test.json'): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-test-'));
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
  return filePath;
}

describe('content metadefinition validation', () => {
  describe('detectTypeFromPath', () => {
    it('detects pagetype from experience/pages/ path', () => {
      expect(detectTypeFromPath('cartridge/experience/pages/storePage.json')).to.equal('pagetype');
    });

    it('detects componenttype from experience/components/ path', () => {
      expect(detectTypeFromPath('cartridge/experience/components/banner.json')).to.equal('componenttype');
    });

    it('detects componenttype from nested component path', () => {
      expect(detectTypeFromPath('cartridge/experience/components/assets/hero.json')).to.equal('componenttype');
    });

    it('returns null for unknown path', () => {
      expect(detectTypeFromPath('some/other/path.json')).to.equal(null);
    });

    it('handles Windows-style paths', () => {
      expect(detectTypeFromPath('cartridge\\experience\\pages\\storePage.json')).to.equal('pagetype');
    });
  });

  describe('detectTypeFromData', () => {
    it('detects pagetype from region_definitions', () => {
      expect(detectTypeFromData({region_definitions: []})).to.equal('pagetype');
    });

    it('detects componenttype from region_definitions + group', () => {
      expect(detectTypeFromData({region_definitions: [], group: 'mygroup', attribute_definition_groups: []})).to.equal(
        'componenttype',
      );
    });

    it('detects aspecttype from supported_object_types', () => {
      expect(detectTypeFromData({supported_object_types: ['product']})).to.equal('aspecttype');
    });

    it('detects image from path property', () => {
      expect(detectTypeFromData({path: '/images/hero.jpg'})).to.equal('image');
    });

    it('detects customeditortype from resources', () => {
      expect(detectTypeFromData({resources: {}})).to.equal('customeditortype');
    });

    it('detects contentassetcomponentconfig from data_binding', () => {
      expect(detectTypeFromData({data_binding: {}, visibility: []})).to.equal('contentassetcomponentconfig');
    });

    it('detects contentassetpageconfig from visibility alone', () => {
      expect(detectTypeFromData({visibility: []})).to.equal('contentassetpageconfig');
    });

    it('detects cmsrecord from attributes + type', () => {
      expect(detectTypeFromData({attributes: {}, type: 'cms_content_type'})).to.equal('cmsrecord');
    });

    it('returns null for empty object', () => {
      expect(detectTypeFromData({})).to.equal(null);
    });
  });

  describe('detectMetaDefinitionType', () => {
    it('prefers file path over data heuristics', () => {
      // Data looks like pagetype, but path says componenttype
      const data = {region_definitions: []};
      expect(detectMetaDefinitionType(data, 'cartridge/experience/components/foo.json')).to.equal('componenttype');
    });

    it('falls back to data when path is unknown', () => {
      expect(detectMetaDefinitionType({region_definitions: []}, 'some/path.json')).to.equal('pagetype');
    });

    it('falls back to data when no path provided', () => {
      expect(detectMetaDefinitionType({region_definitions: []})).to.equal('pagetype');
    });
  });

  describe('validateMetaDefinition', () => {
    it('validates a valid pagetype', () => {
      const data = {
        name: 'Home Page',
        description: 'A landing page',
        region_definitions: [
          {
            id: 'hero',
            name: 'Hero Section',
          },
        ],
      };
      const result = validateMetaDefinition(data, {type: 'pagetype'});
      expect(result.valid).to.equal(true);
      expect(result.schemaType).to.equal('pagetype');
      expect(result.errors).to.have.lengthOf(0);
    });

    it('validates a valid componenttype', () => {
      const data = {
        name: 'Banner',
        group: 'content',
        region_definitions: [],
        attribute_definition_groups: [
          {
            id: 'main',
            attribute_definitions: [
              {
                id: 'heading',
                name: 'Heading',
                type: 'string',
              },
            ],
          },
        ],
      };
      const result = validateMetaDefinition(data, {type: 'componenttype'});
      expect(result.valid).to.equal(true);
      expect(result.schemaType).to.equal('componenttype');
    });

    it('validates a valid aspecttype', () => {
      const data = {
        name: 'Color',
        attribute_definitions: [
          {
            id: 'color',
            name: 'Color',
            type: 'string',
          },
        ],
        supported_object_types: ['product'],
      };
      const result = validateMetaDefinition(data, {type: 'aspecttype'});
      expect(result.valid).to.equal(true);
    });

    it('validates a valid image', () => {
      const data = {
        path: '/images/hero.jpg',
        focal_point: {x: 0.5, y: 0.5},
      };
      const result = validateMetaDefinition(data, {type: 'image'});
      expect(result.valid).to.equal(true);
    });

    it('reports errors for invalid pagetype (missing region_definitions)', () => {
      const data = {name: 'Bad Page'};
      const result = validateMetaDefinition(data, {type: 'pagetype'});
      expect(result.valid).to.equal(false);
      expect(result.errors.length).to.be.greaterThan(0);
      expect(result.errors.some((e) => e.message.includes('region_definitions'))).to.equal(true);
    });

    it('reports errors for additional properties', () => {
      const data = {
        region_definitions: [],
        unknown_property: 'should fail',
      };
      const result = validateMetaDefinition(data, {type: 'pagetype'});
      expect(result.valid).to.equal(false);
      expect(result.errors.some((e) => e.message.includes('additional property'))).to.equal(true);
    });

    it('auto-detects schema type when not specified', () => {
      const data = {
        region_definitions: [{id: 'main', name: 'Main'}],
      };
      const result = validateMetaDefinition(data);
      expect(result.valid).to.equal(true);
      expect(result.schemaType).to.equal('pagetype');
    });

    it('validates $ref resolution across schemas', () => {
      // arch_type is defined in common.json and referenced by pagetype.json
      const data = {
        arch_type: 'headless',
        region_definitions: [{id: 'main', name: 'Main'}],
      };
      const result = validateMetaDefinition(data, {type: 'pagetype'});
      expect(result.valid).to.equal(true);
    });

    it('reports error for invalid $ref value', () => {
      const data = {
        arch_type: 'invalid_value',
        region_definitions: [{id: 'main', name: 'Main'}],
      };
      const result = validateMetaDefinition(data, {type: 'pagetype'});
      expect(result.valid).to.equal(false);
    });

    it('throws MetaDefinitionDetectionError for undetectable data', () => {
      expect(() => validateMetaDefinition({foo: 'bar'})).to.throw(MetaDefinitionDetectionError);
    });
  });

  describe('validateMetaDefinitionFile', () => {
    it('validates a valid file', () => {
      const filePath = writeTempJson({region_definitions: [{id: 'main', name: 'Main'}]});
      const result = validateMetaDefinitionFile(filePath, {type: 'pagetype'});
      expect(result.valid).to.equal(true);
      expect(result.filePath).to.equal(path.resolve(filePath));
    });

    it('returns parse error for invalid JSON', () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-test-'));
      const filePath = path.join(dir, 'bad.json');
      fs.writeFileSync(filePath, '{ invalid json }', 'utf-8');

      const result = validateMetaDefinitionFile(filePath, {type: 'pagetype'});
      expect(result.valid).to.equal(false);
      expect(result.errors[0].message).to.include('Invalid JSON');
    });

    it('detects type from file path convention', () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-test-'));
      const pagesDir = path.join(dir, 'experience', 'pages');
      fs.mkdirSync(pagesDir, {recursive: true});
      const filePath = path.join(pagesDir, 'home.json');
      fs.writeFileSync(filePath, JSON.stringify({region_definitions: [{id: 'main', name: 'Main'}]}), 'utf-8');

      const result = validateMetaDefinitionFile(filePath);
      expect(result.valid).to.equal(true);
      expect(result.schemaType).to.equal('pagetype');
    });

    it('throws MetaDefinitionDetectionError for undetectable file', () => {
      const filePath = writeTempJson({foo: 'bar'});
      expect(() => validateMetaDefinitionFile(filePath)).to.throw(MetaDefinitionDetectionError);
    });
  });

  describe('CONTENT_SCHEMA_TYPES', () => {
    it('contains expected types', () => {
      expect(CONTENT_SCHEMA_TYPES).to.include('pagetype');
      expect(CONTENT_SCHEMA_TYPES).to.include('componenttype');
      expect(CONTENT_SCHEMA_TYPES).to.include('aspecttype');
      expect(CONTENT_SCHEMA_TYPES).to.include('image');
      expect(CONTENT_SCHEMA_TYPES).to.have.lengthOf(9);
    });
  });
});
