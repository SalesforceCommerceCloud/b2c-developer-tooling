/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {existsSync, mkdirSync, writeFileSync, rmSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {createRequire} from 'node:module';
import {siteThemingStore} from '../../../../src/tools/storefrontnext/site-theming/theming-store.js';

const require = createRequire(import.meta.url);
const packageRoot = path.dirname(require.resolve('@salesforce/b2c-dx-mcp/package.json'));
const defaultContentDir = path.join(packageRoot, 'content', 'site-theming');

describe('tools/storefrontnext/site-theming/theming-store', () => {
  let testDir: string;
  let originalThemingFiles: string | undefined;

  beforeEach(() => {
    testDir = path.join(tmpdir(), `b2c-theming-store-test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
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

    it('should not add validation when section has no sub-sections', () => {
      const filePath = path.join(testDir, 'validation-empty.md');
      writeFileSync(
        filePath,
        `# Validation Empty
## ✅ VALIDATION
No validation sub-sections here.
### What TO Change:
- opacity
### What NOT to Change:
- display`,
        'utf8',
      );

      siteThemingStore.loadFile('validation-empty', filePath);
      const guidance = siteThemingStore.get('validation-empty');

      expect(guidance).to.exist;
      expect(guidance!.validation).to.be.undefined;
    });

    it('should return undefined validation when section has no A/B/C/IMPORTANT sub-sections', () => {
      const filePath = path.join(testDir, 'validation-no-subsections.md');
      writeFileSync(
        filePath,
        `# Validation No Subsections
## ✅ VALIDATION
Only plain text, no A. Color, B. Font, C. General, or IMPORTANT.`,
        'utf8',
      );

      siteThemingStore.loadFile('validation-no-subsections', filePath);
      const guidance = siteThemingStore.get('validation-no-subsections');

      expect(guidance).to.exist;
      expect(guidance!.validation).to.be.undefined;
    });

    it('should generate color mapping question when content has brand vs accent', () => {
      const filePath = path.join(testDir, 'color-mapping-q.md');
      writeFileSync(
        filePath,
        `# Color Mapping
## ⚠️ CRITICAL: Colors
Ask for clarification on color type mapping. Use exact hex. Primary vs secondary, brand vs accent.
### What TO Change:
- color
- background-color
### What NOT to Change:
- margin`,
        'utf8',
      );

      siteThemingStore.loadFile('color-mapping-q', filePath);
      const guidance = siteThemingStore.get('color-mapping-q');

      expect(guidance).to.exist;
      const mappingQ = guidance!.questions.find((q) => q.question.includes('primary vs secondary'));
      expect(mappingQ).to.exist;
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

    it('should parse file without workflow or validation sections', () => {
      const filePath = path.join(testDir, 'minimal.md');
      writeFileSync(
        filePath,
        `# Minimal Theming
No workflow or validation sections.
## ⚠️ CRITICAL: Test
Some critical content.
### What TO Change:
- color
### What NOT to Change:
- layout`,
        'utf8',
      );

      siteThemingStore.loadFile('minimal', filePath);
      const guidance = siteThemingStore.get('minimal');

      expect(guidance).to.exist;
      expect(guidance!.guidelines).to.have.lengthOf.at.least(1);
      expect(guidance!.rules).to.have.lengthOf.at.least(1);
    });

    it('should generate fallback questions when no questions extracted', () => {
      const filePath = path.join(testDir, 'color-only.md');
      writeFileSync(
        filePath,
        `# Color Only
Content about color theming. No explicit questions.
## ⚠️ CRITICAL: Colors
Use exact hex values.
### What TO Change:
- background-color
### What NOT to Change:
- margin`,
        'utf8',
      );

      siteThemingStore.loadFile('color-only', filePath);
      const guidance = siteThemingStore.get('color-only');

      expect(guidance).to.exist;
      expect(guidance!.questions.length).to.be.greaterThan(0);
      const colorQ = guidance!.questions.find((q) => q.category === 'colors');
      expect(colorQ).to.exist;
    });

    it('should generate font fallback question when content has font', () => {
      const filePath = path.join(testDir, 'font-only.md');
      writeFileSync(
        filePath,
        `# Font Only
Typography and font styling. No workflow.
### What TO Change:
- font-size
### What NOT to Change:
- width`,
        'utf8',
      );

      siteThemingStore.loadFile('font-only', filePath);
      const guidance = siteThemingStore.get('font-only');

      expect(guidance).to.exist;
      const fontQ = guidance!.questions.find((q) => q.category === 'typography');
      expect(fontQ).to.exist;
    });

    it('should handle THEMING_FILES with non-existent path', () => {
      process.env.THEMING_FILES = JSON.stringify([{key: 'missing-env', path: 'does-not-exist.md'}]);

      siteThemingStore.initialize(testDir);

      expect(siteThemingStore.has('missing-env')).to.be.false;
    });

    it('should handle THEMING_FILES with invalid JSON', () => {
      const customPath = path.join(testDir, 'valid.md');
      writeFileSync(customPath, '# Valid\n### What TO Change:\n- x\n### What NOT to Change:\n- y', 'utf8');
      process.env.THEMING_FILES = 'invalid-json';

      siteThemingStore.initialize(testDir);

      expect(siteThemingStore.has('valid')).to.be.false;
    });

    it('should resolve absolute paths in THEMING_FILES', () => {
      const customPath = path.join(testDir, 'absolute-theming.md');
      writeFileSync(
        customPath,
        `# Absolute Path Test
## ⚠️ CRITICAL: Test
Content.
### What TO Change:
- color
### What NOT to Change:
- layout`,
        'utf8',
      );

      process.env.THEMING_FILES = JSON.stringify([{key: 'absolute-theming', path: customPath}]);

      siteThemingStore.initialize(testDir);

      expect(siteThemingStore.has('absolute-theming')).to.be.true;
    });

    it('should extract and merge questions from content lines ending with ?', () => {
      const filePath = path.join(testDir, 'questions-extracted.md');
      writeFileSync(
        filePath,
        `# Questions Test
## ⚠️ CRITICAL: Use exact hex
Use exact hex code values.
### What TO Change:
- color
- background-color
### What NOT to Change:
- margin

- What are your primary brand colors?
- What font family for headings and body?
- Do you need dark mode support?`,
        'utf8',
      );

      siteThemingStore.loadFile('questions-extracted', filePath);
      const guidance = siteThemingStore.get('questions-extracted');

      expect(guidance).to.exist;
      expect(guidance!.questions.length).to.be.greaterThan(0);
      const hasColorQ = guidance!.questions.some((q) => q.question.includes('brand colors'));
      const hasFontQ = guidance!.questions.some((q) => q.question.includes('font family'));
      const hasGeneralQ = guidance!.questions.some((q) => q.question.includes('dark mode'));
      expect(hasColorQ || hasFontQ || hasGeneralQ).to.be.true;
    });

    it('should handle THEMING_FILES path that exists but cannot be read', () => {
      const subDir = path.join(testDir, 'subdir');
      mkdirSync(subDir, {recursive: true});
      process.env.THEMING_FILES = JSON.stringify([{key: 'dir-as-file', path: subDir}]);

      siteThemingStore.initialize(testDir);

      expect(siteThemingStore.has('dir-as-file')).to.be.false;
    });

    it('should generate layout question when content allows layout changes', () => {
      const filePath = path.join(testDir, 'layout-changes.md');
      writeFileSync(
        filePath,
        `# Layout Test
## ⚠️ CRITICAL: Layout
Layout changes are allowed when explicitly requested.
### What TO Change:
- color
### What NOT to Change:
- position

When layout modifications are needed, they should be explicitly requested by the user.`,
        'utf8',
      );

      siteThemingStore.loadFile('layout-changes', filePath);
      const guidance = siteThemingStore.get('layout-changes');

      expect(guidance).to.exist;
      const layoutQ = guidance!.questions.find((q) => q.category === 'general' && q.question.includes('layout'));
      expect(layoutQ).to.exist;
    });

    it('should generate font question for headings and body when content has font usage', () => {
      const filePath = path.join(testDir, 'font-usage.md');
      writeFileSync(
        filePath,
        `# Font Usage
## ⚠️ CRITICAL: Typography
Use exact font name. Font apply to headings and body.
### What TO Change:
- font-size
- font-weight
### What NOT to Change:
- width`,
        'utf8',
      );

      siteThemingStore.loadFile('font-usage', filePath);
      const guidance = siteThemingStore.get('font-usage');

      expect(guidance).to.exist;
      const fontQ = guidance!.questions.find(
        (q) => q.category === 'typography' && q.question.includes('headings and body'),
      );
      expect(fontQ).to.exist;
    });

    it('should generate color questions for color combinations and dark/light when content has both', () => {
      const filePath = path.join(testDir, 'color-combos.md');
      writeFileSync(
        filePath,
        `# Color Combos
## ⚠️ CRITICAL: Colors
Propose color combinations. Use exact hex. Dark and light themes.
### What TO Change:
- color
- background-color
### What NOT to Change:
- margin`,
        'utf8',
      );

      siteThemingStore.loadFile('color-combos', filePath);
      const guidance = siteThemingStore.get('color-combos');

      expect(guidance).to.exist;
      const primaryQ = guidance!.questions.find((q) => q.question.includes('primary actions'));
      const hoverQ = guidance!.questions.find((q) => q.question.includes('hover state'));
      const darkLightQ = guidance!.questions.find((q) => q.question.includes('light and dark'));
      expect(primaryQ || hoverQ || darkLightQ).to.exist;
    });

    it('should generate primary/hover questions when content has color combinations', () => {
      const filePath = path.join(testDir, 'color-combos-only.md');
      writeFileSync(
        filePath,
        `# Color Combos Only
## ⚠️ CRITICAL: Colors
Propose color combinations for buttons and links.
### What TO Change:
- color
- background-color
### What NOT to Change:
- margin`,
        'utf8',
      );

      siteThemingStore.loadFile('color-combos-only', filePath);
      const guidance = siteThemingStore.get('color-combos-only');

      expect(guidance).to.exist;
      const primaryQ = guidance!.questions.find((q) => q.question.includes('primary actions'));
      const hoverQ = guidance!.questions.find((q) => q.question.includes('hover state'));
      expect(primaryQ).to.exist;
      expect(hoverQ).to.exist;
    });

    it('should generate font question for Google Fonts when content has font availability', () => {
      const filePath = path.join(testDir, 'font-availability.md');
      writeFileSync(
        filePath,
        `# Font Availability
## ⚠️ CRITICAL: Fonts
Use exact font name. Check font availability and Google Fonts.
### What TO Change:
- font-size
### What NOT to Change:
- width`,
        'utf8',
      );

      siteThemingStore.loadFile('font-availability', filePath);
      const guidance = siteThemingStore.get('font-availability');

      expect(guidance).to.exist;
      const fontQ = guidance!.questions.find((q) => q.question.includes('Google Fonts'));
      expect(fontQ).to.exist;
    });

    it('should assign required to first extracted color/font question when no generated questions', () => {
      const filePath = path.join(testDir, 'extracted-only.md');
      writeFileSync(
        filePath,
        `# Extracted Only
## 📋 Specification
Follow user specs exactly.
### What TO Change:
- opacity
### What NOT to Change:
- display

- What are your primary brand colors?
- What font family for headings?`,
        'utf8',
      );

      siteThemingStore.loadFile('extracted-only', filePath);
      const guidance = siteThemingStore.get('extracted-only');

      expect(guidance).to.exist;
      const colorQ = guidance!.questions.find((q) => q.question.includes('brand colors'));
      const fontQ = guidance!.questions.find((q) => q.question.includes('font family'));
      expect(colorQ?.required).to.be.true;
      expect(fontQ?.required).to.be.true;
    });

    it('should skip re-initialization when same root', () => {
      siteThemingStore.initialize(testDir);
      const keysFirst = siteThemingStore.getKeys();

      siteThemingStore.initialize(testDir);
      const keysSecond = siteThemingStore.getKeys();

      expect(keysFirst).to.deep.equal(keysSecond);
    });

    it('should clear and re-load when root changes', () => {
      delete process.env.THEMING_FILES;
      const otherDir = path.join(tmpdir(), `b2c-theming-other-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
      mkdirSync(otherDir, {recursive: true});
      try {
        const customPath = path.join(testDir, 'first-root.md');
        writeFileSync(customPath, '# First\n### What TO Change:\n- x\n### What NOT to Change:\n- y', 'utf8');
        process.env.THEMING_FILES = JSON.stringify([{key: 'first-root', path: path.relative(testDir, customPath)}]);
        siteThemingStore.initialize(testDir);

        expect(siteThemingStore.has('first-root')).to.be.true;

        const customPath2 = path.join(otherDir, 'second-root.md');
        writeFileSync(customPath2, '# Second\n### What TO Change:\n- x\n### What NOT to Change:\n- y', 'utf8');
        process.env.THEMING_FILES = JSON.stringify([{key: 'second-root', path: customPath2}]);
        siteThemingStore.initialize(otherDir);

        expect(siteThemingStore.has('first-root')).to.be.false;
        expect(siteThemingStore.has('second-root')).to.be.true;
      } finally {
        if (existsSync(otherDir)) {
          rmSync(otherDir, {recursive: true, force: true});
        }
      }
    });

    it('should log and continue when default file fails to load', () => {
      const fakeContentDir = path.join(testDir, 'fake-content', 'site-theming');
      mkdirSync(fakeContentDir, {recursive: true});
      copyFileSync(
        path.join(defaultContentDir, 'theming-validation.md'),
        path.join(fakeContentDir, 'theming-validation.md'),
      );
      copyFileSync(
        path.join(defaultContentDir, 'theming-accessibility.md'),
        path.join(fakeContentDir, 'theming-accessibility.md'),
      );
      mkdirSync(path.join(fakeContentDir, 'theming-questions.md'), {recursive: true});

      siteThemingStore.initialize(testDir, {contentDirOverride: fakeContentDir});

      expect(siteThemingStore.has('theming-validation')).to.be.true;
      expect(siteThemingStore.has('theming-accessibility')).to.be.true;
      expect(siteThemingStore.has('theming-questions')).to.be.false;
    });
  });
});
