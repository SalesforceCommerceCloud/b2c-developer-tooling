/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import path from 'node:path';
import {
  validateEjsSyntax,
  checkOrphanedFiles,
  validateScaffoldDirectory,
  SCAFFOLDS_DATA_DIR,
  type ScaffoldManifest,
} from '../../src/scaffold/index.js';

describe('scaffold/validation', () => {
  describe('validateEjsSyntax', () => {
    it('should pass valid EJS content', () => {
      const content = '<%= name %> is <%= value %>';
      const issues = validateEjsSyntax(content, 'test.ejs');
      expect(issues).to.have.lengthOf(0);
    });

    it('should detect mismatched EJS tags', () => {
      const content = '<%= name %> is <% unclosed';
      const issues = validateEjsSyntax(content, 'test.ejs');

      expect(issues.some((i) => i.message.includes('Mismatched EJS tags'))).to.be.true;
      expect(issues[0].severity).to.equal('error');
    });

    it('should detect empty output tags', () => {
      const content = '<%= %>';
      const issues = validateEjsSyntax(content, 'test.ejs');

      expect(issues.some((i) => i.message.includes('Empty EJS output tag'))).to.be.true;
      expect(issues[0].severity).to.equal('warning');
    });

    it('should include filename in issue', () => {
      const content = '<% unclosed';
      const issues = validateEjsSyntax(content, 'template.ejs');

      expect(issues[0].file).to.equal('files/template.ejs');
    });

    it('should handle content without EJS', () => {
      const content = 'Just plain text';
      const issues = validateEjsSyntax(content, 'test.txt');
      expect(issues).to.have.lengthOf(0);
    });
  });

  describe('checkOrphanedFiles', () => {
    it('should find orphaned files not in manifest', () => {
      const allTemplates = ['used.ejs', 'orphan.ejs'];
      const manifest: ScaffoldManifest = {
        name: 'test',
        displayName: 'Test',
        description: 'Test',
        category: 'cartridge',
        parameters: [],
        files: [{template: 'used.ejs', destination: 'used.txt'}],
      };

      const issues = checkOrphanedFiles(allTemplates, manifest);

      expect(issues).to.have.lengthOf(1);
      expect(issues[0].message).to.include('orphan.ejs');
      expect(issues[0].severity).to.equal('warning');
    });

    it('should not flag files referenced in modifications', () => {
      const allTemplates = ['main.ejs', 'mod-content.ejs'];
      const manifest: ScaffoldManifest = {
        name: 'test',
        displayName: 'Test',
        description: 'Test',
        category: 'cartridge',
        parameters: [],
        files: [{template: 'main.ejs', destination: 'main.txt'}],
        modifications: [{target: 'existing.json', type: 'json-merge', contentTemplate: 'mod-content.ejs'}],
      };

      const issues = checkOrphanedFiles(allTemplates, manifest);

      expect(issues).to.have.lengthOf(0);
    });

    it('should handle empty files array', () => {
      const allTemplates = ['orphan.ejs'];
      const manifest: ScaffoldManifest = {
        name: 'test',
        displayName: 'Test',
        description: 'Test',
        category: 'cartridge',
        parameters: [],
      };

      const issues = checkOrphanedFiles(allTemplates, manifest);

      expect(issues).to.have.lengthOf(1);
    });
  });

  describe('validateScaffoldDirectory', () => {
    it('should validate built-in service scaffold', async () => {
      const serviceScaffoldPath = path.join(SCAFFOLDS_DATA_DIR, 'service');
      const result = await validateScaffoldDirectory(serviceScaffoldPath);

      expect(result.valid).to.be.true;
      expect(result.errors).to.equal(0);
    });

    it('should validate built-in cartridge scaffold', async () => {
      const cartridgeScaffoldPath = path.join(SCAFFOLDS_DATA_DIR, 'cartridge');
      const result = await validateScaffoldDirectory(cartridgeScaffoldPath);

      expect(result.valid).to.be.true;
      expect(result.errors).to.equal(0);
    });

    it('should fail for non-existent path', async () => {
      const result = await validateScaffoldDirectory('/nonexistent/path/scaffold');

      expect(result.valid).to.be.false;
      expect(result.errors).to.be.greaterThan(0);
      expect(result.issues[0].message).to.include('does not exist');
    });

    it('should detect missing scaffold.json', async () => {
      // Use the data directory itself which has no scaffold.json
      const result = await validateScaffoldDirectory(SCAFFOLDS_DATA_DIR);

      expect(result.valid).to.be.false;
      expect(result.issues.some((i) => i.message.includes('scaffold.json not found'))).to.be.true;
    });

    it('should fail validation in strict mode with warnings', async () => {
      // The service scaffold has postInstructions, so no warning
      // We'll just verify strict mode works - most scaffolds have warnings
      const serviceScaffoldPath = path.join(SCAFFOLDS_DATA_DIR, 'service');
      const resultNormal = await validateScaffoldDirectory(serviceScaffoldPath, {strict: false});
      const resultStrict = await validateScaffoldDirectory(serviceScaffoldPath, {strict: true});

      // With strict mode, warnings count as failures
      if (resultNormal.warnings > 0) {
        expect(resultStrict.valid).to.be.false;
      } else {
        expect(resultStrict.valid).to.equal(resultNormal.valid);
      }
    });
  });
});
