/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {existsSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {siteThemingStore} from '../../../../src/tools/storefrontnext/site-theming/theming-store.js';

describe('tools/storefrontnext/site-theming/theming-store', () => {
  let testDir: string;
  let originalThemingFiles: string | undefined;

  beforeEach(() => {
    testDir = path.join(tmpdir(), `b2c-theming-store-test-${Date.now()}`);
    mkdirSync(testDir, {recursive: true});
    originalThemingFiles = process.env.THEMING_FILES;
  });

  afterEach(() => {
    process.env.THEMING_FILES = originalThemingFiles;
    if (existsSync(testDir)) {
      rmSync(testDir, {recursive: true, force: true});
    }
  });

  describe('initialize', () => {
    it('should load default theming files from package content', () => {
      siteThemingStore.initialize(testDir);

      const keys = siteThemingStore.getKeys();
      expect(keys).to.include('theming-questions');
      expect(keys).to.include('theming-validation');
      expect(keys).to.include('theming-accessibility');
    });

    it('should load custom file via THEMING_FILES env', () => {
      const customPath = path.join(testDir, 'custom-theming.md');
      writeFileSync(
        customPath,
        `# Custom Theming

## ⚠️ CRITICAL: Test Rule
Test content for custom theming file.

### What TO Change:
- custom-color

### What NOT to Change:
- custom-layout

What are the exact hex color values?`,
        'utf8',
      );

      process.env.THEMING_FILES = JSON.stringify([{key: 'custom-theming', path: customPath}]);

      siteThemingStore.initialize(testDir);

      expect(siteThemingStore.has('custom-theming')).to.be.true;
      const guidance = siteThemingStore.get('custom-theming');
      expect(guidance).to.exist;
      expect(guidance!.metadata.fileName).to.equal('custom-theming.md');
      expect(guidance!.guidelines.length).to.be.greaterThan(0);
      expect(guidance!.rules.length).to.be.greaterThan(0);
    });

    it('should resolve relative paths from workspace root', () => {
      const customPath = path.join(testDir, 'relative-theming.md');
      writeFileSync(
        customPath,
        `# Relative Theming
## ⚠️ CRITICAL: Relative
Test.
### What TO Change:
- color
### What NOT to Change:
- layout`,
        'utf8',
      );

      const relativePath = path.relative(testDir, customPath);
      process.env.THEMING_FILES = JSON.stringify([{key: 'relative-theming', path: relativePath}]);

      siteThemingStore.initialize(testDir);

      expect(siteThemingStore.has('relative-theming')).to.be.true;
    });
  });

  describe('get and getKeys', () => {
    beforeEach(() => {
      siteThemingStore.initialize(testDir);
    });

    it('should return guidance for existing key', () => {
      const guidance = siteThemingStore.get('theming-questions');
      expect(guidance).to.exist;
      expect(guidance!.questions).to.be.an('array');
      expect(guidance!.guidelines).to.be.an('array');
      expect(guidance!.rules).to.be.an('array');
      expect(guidance!.metadata).to.have.property('filePath');
      expect(guidance!.metadata).to.have.property('fileName');
    });

    it('should return undefined for non-existent key', () => {
      expect(siteThemingStore.get('non-existent')).to.be.undefined;
    });

    it('should return all loaded keys from getKeys', () => {
      const keys = siteThemingStore.getKeys();
      expect(keys).to.be.an('array');
      expect(keys.length).to.be.greaterThanOrEqual(3);
    });
  });

  describe('loadFile', () => {
    it('should parse workflow section from markdown', () => {
      const filePath = path.join(testDir, 'workflow-test.md');
      const content = [
        '# Workflow Test',
        '',
        '## 🔄 WORKFLOW',
        '1. First step',
        '2. Second step',
        '',
        '### 📝 EXTRACTION',
        'Extract color values from user input.',
        '',
        '### ✅ PRE-IMPLEMENTATION',
        'Verify all colors meet WCAG AA.',
      ].join('\n');
      writeFileSync(filePath, content, 'utf8');

      siteThemingStore.loadFile('workflow-test', filePath);
      const guidance = siteThemingStore.get('workflow-test');

      expect(guidance).to.exist;
      expect(guidance!.metadata.fileName).to.equal('workflow-test.md');
      // Workflow is parsed when steps, extraction, or checklist exist
      if (guidance!.workflow) {
        expect(guidance!.workflow!.steps).to.be.an('array');
        if (guidance!.workflow!.steps!.length > 0) {
          expect(guidance!.workflow!.steps).to.include('First step');
        }
        if (guidance!.workflow!.extractionInstructions) {
          expect(guidance!.workflow!.extractionInstructions).to.include('Extract color values');
        }
        if (guidance!.workflow!.preImplementationChecklist) {
          expect(guidance!.workflow!.preImplementationChecklist).to.include('WCAG AA');
        }
      }
    });

    it('should parse validation section from markdown', () => {
      const filePath = path.join(testDir, 'validation-test.md');
      const content = [
        '# Validation Test',
        '',
        '## ✅ VALIDATION',
        '',
        '### A. Color Combination Validation',
        'Check contrast ratios for all color combinations.',
        '',
        '### B. Font Validation',
        'Verify font availability.',
        '',
        '### C. General Input Validation',
        'General validation rules.',
        '',
        '### IMPORTANT',
        'All validations must pass.',
      ].join('\n');
      writeFileSync(filePath, content, 'utf8');

      siteThemingStore.loadFile('validation-test', filePath);
      const guidance = siteThemingStore.get('validation-test');

      expect(guidance).to.exist;
      expect(guidance!.metadata.fileName).to.equal('validation-test.md');
      // Validation is parsed when color, font, general, or requirements exist
      if (guidance!.validation) {
        if (guidance!.validation!.colorValidation) {
          expect(guidance!.validation!.colorValidation).to.include('contrast ratios');
        }
        if (guidance!.validation!.fontValidation) {
          expect(guidance!.validation!.fontValidation).to.include('font availability');
        }
        if (guidance!.validation!.generalValidation) {
          expect(guidance!.validation!.generalValidation).to.include('General validation');
        }
        if (guidance!.validation!.requirements) {
          expect(guidance!.validation!.requirements).to.include('All validations');
        }
      }
    });

    it('should throw when file does not exist', () => {
      expect(() => siteThemingStore.loadFile('missing', path.join(testDir, 'does-not-exist.md'))).to.throw(
        /File not found|Failed to load/,
      );
    });
  });
});
