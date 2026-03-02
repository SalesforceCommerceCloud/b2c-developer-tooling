/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  parseThemeFile,
  findThemeFilePath,
  getColorTokens,
  getSpacingTokens,
  getRadiusTokens,
} from '../../../../../src/tools/storefrontnext/figma/map-tokens/css-parser.js';
import {writeFileSync, mkdirSync, rmSync} from 'node:fs';
import {join} from 'node:path';

// Helper to create a temporary CSS file for testing
function createTestCSSFile(content: string): string {
  const testDir = join(process.cwd(), 'test-temp');
  mkdirSync(testDir, {recursive: true});
  const testFile = join(testDir, 'test-app.css');
  writeFileSync(testFile, content, 'utf8');
  return testFile;
}

// Cleanup temp files
function cleanupTestFiles() {
  const testDir = join(process.cwd(), 'test-temp');
  try {
    rmSync(testDir, {recursive: true, force: true});
  } catch {
    // Ignore cleanup errors
  }
}

describe('css-parser', () => {
  afterEach(() => {
    cleanupTestFiles();
  });

  describe('parseThemeFile', () => {
    it('should parse light theme tokens from :root', () => {
      const css = `
                :root {
                    --primary: #2563eb;
                    --secondary: #64748b;
                }
            `;
      const testFile = createTestCSSFile(css);

      const result = parseThemeFile(testFile);

      expect(result.tokens.length).to.equal(2);
      expect(result.lightTokens.size).to.equal(2);
      expect(result.lightTokens.get('--primary')?.value).to.equal('#2563eb');
      expect(result.lightTokens.get('--primary')?.theme).to.equal('light');
    });

    it('should parse dark theme tokens from .dark selector', () => {
      const css = `
                .dark {
                    --primary: #1e40af;
                    --secondary: #475569;
                }
            `;
      const testFile = createTestCSSFile(css);

      const result = parseThemeFile(testFile);

      expect(result.tokens.length).to.equal(2);
      expect(result.darkTokens.size).to.equal(2);
      expect(result.darkTokens.get('--primary')?.value).to.equal('#1e40af');
      expect(result.darkTokens.get('--primary')?.theme).to.equal('dark');
    });

    it('should parse shared tokens from @theme inline', () => {
      const css = `
                @theme inline {
                    --spacing-base: 16px;
                    --radius-md: 0.375rem;
                }
            `;
      const testFile = createTestCSSFile(css);

      const result = parseThemeFile(testFile);

      expect(result.tokens.length).to.equal(2);
      expect(result.sharedTokens.size).to.equal(2);
      expect(result.sharedTokens.get('--spacing-base')?.theme).to.equal('shared');
    });

    it('should correctly determine token types', () => {
      const css = `
                :root {
                    --color-primary: #2563eb;
                    --spacing-large: 24px;
                    --radius-sm: 0.25rem;
                    --opacity-50: 0.5;
                }
            `;
      const testFile = createTestCSSFile(css);

      const result = parseThemeFile(testFile);

      expect(result.lightTokens.get('--color-primary')?.type).to.equal('color');
      expect(result.lightTokens.get('--spacing-large')?.type).to.equal('spacing');
      expect(result.lightTokens.get('--radius-sm')?.type).to.equal('radius');
      expect(result.lightTokens.get('--opacity-50')?.type).to.equal('opacity');
    });

    it('should classify font-size and font-family tokens', () => {
      const css = `
                :root {
                    --font-size-base: 1rem;
                    --font-family-sans: 'Inter', sans-serif;
                }
            `;
      const testFile = createTestCSSFile(css);

      const result = parseThemeFile(testFile);

      expect(result.lightTokens.get('--font-size-base')?.type).to.equal('fontSize');
      expect(result.lightTokens.get('--font-family-sans')?.type).to.equal('fontFamily');
    });

    it('should resolve var() references', () => {
      const css = `
                :root {
                    --blue-500: #2563eb;
                    --primary: var(--blue-500);
                }
            `;
      const testFile = createTestCSSFile(css);

      const result = parseThemeFile(testFile);

      const primaryToken = result.lightTokens.get('--primary');
      expect(primaryToken?.value).to.equal('var(--blue-500)');
      expect(primaryToken?.resolvedValue).to.equal('#2563eb');
    });

    it('should handle nested var() references', () => {
      const css = `
                :root {
                    --base-color: #2563eb;
                    --blue-500: var(--base-color);
                    --primary: var(--blue-500);
                }
            `;
      const testFile = createTestCSSFile(css);

      const result = parseThemeFile(testFile);

      const primaryToken = result.lightTokens.get('--primary');
      expect(primaryToken?.resolvedValue).to.equal('#2563eb');
    });

    it('should warn about unresolved var() references', () => {
      const css = `
                :root {
                    --primary: var(--nonexistent);
                    --secondary: #64748b;
                }
            `;
      const testFile = createTestCSSFile(css);

      const result = parseThemeFile(testFile);

      expect(result.warnings.length).to.be.greaterThan(0);
      expect(result.warnings[0]).to.include('--nonexistent');
      expect(result.warnings[0]).to.include('undefined variable');
    });

    it('should skip tokens with unresolved references', () => {
      const css = `
                :root {
                    --primary: var(--nonexistent);
                    --secondary: #64748b;
                }
            `;
      const testFile = createTestCSSFile(css);

      const result = parseThemeFile(testFile);

      // Only the resolved token should be present
      expect(result.tokens.length).to.equal(1);
      expect(result.lightTokens.has('--primary')).to.equal(false);
      expect(result.lightTokens.has('--secondary')).to.equal(true);
    });

    it('should report count of skipped tokens', () => {
      const css = `
                :root {
                    --primary: var(--missing1);
                    --secondary: var(--missing2);
                    --tertiary: #64748b;
                }
            `;
      const testFile = createTestCSSFile(css);

      const result = parseThemeFile(testFile);

      expect(result.warnings.some((w) => w.includes('Skipped 2 token(s)'))).to.equal(true);
    });

    it('should handle mixed light and dark themes', () => {
      const css = `
                :root {
                    --primary: #2563eb;
                }
                .dark {
                    --primary: #1e40af;
                }
            `;
      const testFile = createTestCSSFile(css);

      const result = parseThemeFile(testFile);

      expect(result.tokens.length).to.equal(2);
      expect(result.lightTokens.get('--primary')?.value).to.equal('#2563eb');
      expect(result.darkTokens.get('--primary')?.value).to.equal('#1e40af');
    });

    it('should throw error for non-existent file', () => {
      expect(() => parseThemeFile('/nonexistent/path/app.css')).to.throw('Theme file not found');
    });
  });

  describe('token filter functions', () => {
    it('should filter color tokens', () => {
      const css = `
                :root {
                    --color-primary: #2563eb;
                    --spacing-large: 24px;
                    --radius-sm: 0.25rem;
                }
            `;
      const testFile = createTestCSSFile(css);

      const result = parseThemeFile(testFile);
      const colorTokens = getColorTokens(result);

      expect(colorTokens.length).to.equal(1);
      expect(colorTokens[0].name).to.equal('--color-primary');
    });

    it('should filter spacing tokens', () => {
      const css = `
                :root {
                    --color-primary: #2563eb;
                    --spacing-large: 24px;
                    --gap-small: 8px;
                }
            `;
      const testFile = createTestCSSFile(css);

      const result = parseThemeFile(testFile);
      const spacingTokens = getSpacingTokens(result);

      expect(spacingTokens.length).to.equal(2);
    });

    it('should filter radius tokens', () => {
      const css = `
                :root {
                    --color-primary: #2563eb;
                    --radius-sm: 0.25rem;
                    --radius-lg: 0.5rem;
                }
            `;
      const testFile = createTestCSSFile(css);

      const result = parseThemeFile(testFile);
      const radiusTokens = getRadiusTokens(result);

      expect(radiusTokens.length).to.equal(2);
    });
  });

  describe('data-theme selectors', () => {
    it('should parse light tokens from [data-theme="light"] selector', () => {
      const css = `
                [data-theme="light"] {
                    --primary: #2563eb;
                }
            `;
      const testFile = createTestCSSFile(css);

      const result = parseThemeFile(testFile);

      expect(result.lightTokens.size).to.equal(1);
      expect(result.lightTokens.get('--primary')?.theme).to.equal('light');
    });

    it('should parse light tokens from single-quoted data-theme selector', () => {
      const css = `
                [data-theme='light'] {
                    --primary: #2563eb;
                }
            `;
      const testFile = createTestCSSFile(css);

      const result = parseThemeFile(testFile);

      expect(result.lightTokens.size).to.equal(1);
      expect(result.lightTokens.get('--primary')?.theme).to.equal('light');
    });

    it('should parse dark tokens from [data-theme="dark"] selector', () => {
      const css = `
                [data-theme="dark"] {
                    --primary: #1e40af;
                }
            `;
      const testFile = createTestCSSFile(css);

      const result = parseThemeFile(testFile);

      expect(result.darkTokens.size).to.equal(1);
      expect(result.darkTokens.get('--primary')?.theme).to.equal('dark');
    });
  });

  describe('findThemeFilePath', () => {
    it('should return null when no workspaceRoot is provided', () => {
      const result = findThemeFilePath();

      expect(result).to.equal(null);
    });

    it('should return null when no app.css exists in workspace', () => {
      const result = findThemeFilePath('/nonexistent/workspace');

      expect(result).to.equal(null);
    });

    it('should find app.css in src/ directory', () => {
      const testDir = join(process.cwd(), 'test-temp');
      const srcDir = join(testDir, 'src');
      mkdirSync(srcDir, {recursive: true});
      writeFileSync(join(srcDir, 'app.css'), ':root { --x: 1; }', 'utf8');

      const result = findThemeFilePath(testDir);

      expect(result).to.equal(join(testDir, 'src/app.css'));
    });

    it('should find app.css in root directory when src/app.css does not exist', () => {
      const testDir = join(process.cwd(), 'test-temp');
      mkdirSync(testDir, {recursive: true});
      writeFileSync(join(testDir, 'app.css'), ':root { --x: 1; }', 'utf8');

      const result = findThemeFilePath(testDir);

      expect(result).to.equal(join(testDir, 'app.css'));
    });
  });

  describe('parseThemeFile workspace discovery', () => {
    it('should throw when no themeFilePath and no workspaceRoot are provided', () => {
      expect(() => parseThemeFile()).to.throw('Theme file (app.css) not found');
    });

    it('should throw when workspaceRoot has no app.css', () => {
      expect(() => parseThemeFile(undefined, '/nonexistent/workspace')).to.throw('Theme file (app.css) not found');
    });

    it('should auto-discover and parse app.css from workspaceRoot', () => {
      const testDir = join(process.cwd(), 'test-temp');
      const srcDir = join(testDir, 'src');
      mkdirSync(srcDir, {recursive: true});
      writeFileSync(join(srcDir, 'app.css'), ':root { --color-primary: #2563eb; }', 'utf8');

      const result = parseThemeFile(undefined, testDir);

      expect(result.lightTokens.size).to.equal(1);
      expect(result.lightTokens.get('--color-primary')?.value).to.equal('#2563eb');
    });
  });
});
