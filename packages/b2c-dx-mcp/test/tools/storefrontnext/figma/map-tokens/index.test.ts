/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  mapFigmaTokensToTheme,
  type MapTokensToThemeInput,
} from '../../../../../src/tools/storefrontnext/figma/map-tokens/index.js';
import {writeFileSync, mkdirSync, rmSync} from 'node:fs';
import {join} from 'node:path';

function createTestCSSFile(content: string): string {
  const testDir = join(process.cwd(), 'test-temp-integration');
  mkdirSync(testDir, {recursive: true});
  const testFile = join(testDir, 'app.css');
  writeFileSync(testFile, content, 'utf8');
  return testFile;
}

function cleanupTestFiles() {
  const testDir = join(process.cwd(), 'test-temp-integration');
  try {
    rmSync(testDir, {recursive: true, force: true});
  } catch {
    // Ignore cleanup errors
  }
}

describe('map-tokens-to-theme integration', () => {
  afterEach(() => {
    cleanupTestFiles();
  });

  describe('tool execution', () => {
    it('should execute the tool and return formatted results', () => {
      const css = `
                :root {
                    --primary: #2563eb;
                    --secondary: #64748b;
                }
            `;
      const testFile = createTestCSSFile(css);

      const input: MapTokensToThemeInput = {
        figmaTokens: [
          {
            name: 'Primary',
            value: '#2563eb',
            type: 'color',
            description: 'Primary brand color',
          },
        ],
        themeFilePath: testFile,
      };

      const result = mapFigmaTokensToTheme(input);

      expect(result).to.include('Figma Design Tokens');
      expect(result).to.include('Primary');
    });

    it('should show exact matches in summary', () => {
      const css = `
                :root {
                    --primary: #2563eb;
                }
            `;
      const testFile = createTestCSSFile(css);

      const input: MapTokensToThemeInput = {
        figmaTokens: [
          {
            name: 'Primary',
            value: '#2563eb',
            type: 'color',
          },
        ],
        themeFilePath: testFile,
      };

      const result = mapFigmaTokensToTheme(input);

      expect(result).to.include('**Exact Matches**: 1');
      expect(result).to.include('✅ Exact Matches');
    });

    it('should show fuzzy matches in summary', () => {
      const css = `
                :root {
                    --primary: #2560e0;
                }
            `;
      const testFile = createTestCSSFile(css);

      const input: MapTokensToThemeInput = {
        figmaTokens: [
          {
            name: 'Primary Button',
            value: '#2563eb',
            type: 'color',
          },
        ],
        themeFilePath: testFile,
      };

      const result = mapFigmaTokensToTheme(input);

      expect(result).to.include('Fuzzy Matches');
    });

    it('should show recommendations for new tokens', () => {
      const css = `
                :root {
                    --primary: #2563eb;
                }
            `;
      const testFile = createTestCSSFile(css);

      const input: MapTokensToThemeInput = {
        figmaTokens: [
          {
            name: 'Brand Purple',
            value: '#9333ea',
            type: 'color',
          },
        ],
        themeFilePath: testFile,
      };

      const result = mapFigmaTokensToTheme(input);

      expect(result).to.include('Recommendations');
      expect(result).to.include('Create New Tokens');
    });

    it('should display warnings for unresolved tokens', () => {
      const css = `
                :root {
                    --primary: var(--nonexistent);
                    --secondary: #64748b;
                }
            `;
      const testFile = createTestCSSFile(css);

      const input: MapTokensToThemeInput = {
        figmaTokens: [
          {
            name: 'Secondary',
            value: '#64748b',
            type: 'color',
          },
        ],
        themeFilePath: testFile,
      };

      const result = mapFigmaTokensToTheme(input);

      expect(result).to.include('Warnings');
      expect(result).to.include('undefined variable');
    });

    it('should handle multiple tokens with mixed results', () => {
      const css = `
                :root {
                    --primary: #2563eb;
                    --secondary: #64748b;
                }
            `;
      const testFile = createTestCSSFile(css);

      const input: MapTokensToThemeInput = {
        figmaTokens: [
          {
            name: 'Primary',
            value: '#2563eb',
            type: 'color',
          },
          {
            name: 'Secondary',
            value: '#64748b',
            type: 'color',
          },
          {
            name: 'Accent',
            value: '#9333ea',
            type: 'color',
          },
        ],
        themeFilePath: testFile,
      };

      const result = mapFigmaTokensToTheme(input);

      expect(result).to.include('**Total Tokens**: 3');
      expect(result).to.include('**Exact Matches**: 2');
      expect(result).to.include('**No Matches**: 1');
    });

    it('should provide usage instructions', () => {
      const css = `
                :root {
                    --primary: #2563eb;
                }
            `;
      const testFile = createTestCSSFile(css);

      const input: MapTokensToThemeInput = {
        figmaTokens: [
          {
            name: 'Primary',
            value: '#2563eb',
            type: 'color',
          },
        ],
        themeFilePath: testFile,
      };

      const result = mapFigmaTokensToTheme(input);

      expect(result).to.include('Usage Instructions');
      expect(result).to.include('Using Matched Tokens in Components');
    });

    it('should return error message when theme file not found', () => {
      const input: MapTokensToThemeInput = {
        figmaTokens: [
          {
            name: 'Primary',
            value: '#2563eb',
            type: 'color',
          },
        ],
        themeFilePath: '/nonexistent/path/app.css',
      };

      const result = mapFigmaTokensToTheme(input);

      expect(result).to.include('Error');
      expect(result).to.include('Theme file not found');
    });
  });

  describe('detailed match output', () => {
    it('should show token details including resolved values', () => {
      const css = `
                :root {
                    --blue-500: #2563eb;
                    --primary: var(--blue-500);
                }
            `;
      const testFile = createTestCSSFile(css);

      const input: MapTokensToThemeInput = {
        figmaTokens: [
          {
            name: 'Primary',
            value: '#2563eb',
            type: 'color',
          },
        ],
        themeFilePath: testFile,
      };

      const result = mapFigmaTokensToTheme(input);

      expect(result).to.include('Matched Token');
      expect(result).to.include('Resolved Value');
    });

    it('should show confidence scores', () => {
      const css = `
                :root {
                    --primary: #2560e0;
                }
            `;
      const testFile = createTestCSSFile(css);

      const input: MapTokensToThemeInput = {
        figmaTokens: [
          {
            name: 'Primary Button',
            value: '#2563eb',
            type: 'color',
          },
        ],
        themeFilePath: testFile,
      };

      const result = mapFigmaTokensToTheme(input);

      expect(result).to.include('Confidence');
      expect(result).to.match(/\d+%/);
    });

    it('should show alternative suggestions', () => {
      const css = `
                :root {
                    --primary: #2563eb;
                    --accent: #3b82f6;
                    --info: #0ea5e9;
                }
            `;
      const testFile = createTestCSSFile(css);

      const input: MapTokensToThemeInput = {
        figmaTokens: [
          {
            name: 'Blue',
            value: '#2563eb',
            type: 'color',
          },
        ],
        themeFilePath: testFile,
      };

      const result = mapFigmaTokensToTheme(input);

      expect(result).to.include('--primary');
    });
  });

  describe('token type handling', () => {
    it('should handle spacing tokens', () => {
      const css = `
                :root {
                    --spacing-large: 24px;
                }
            `;
      const testFile = createTestCSSFile(css);

      const input: MapTokensToThemeInput = {
        figmaTokens: [
          {
            name: 'Large Spacing',
            value: '24px',
            type: 'spacing',
          },
        ],
        themeFilePath: testFile,
      };

      const result = mapFigmaTokensToTheme(input);

      expect(result).to.include('Large Spacing');
      expect(result).to.include('spacing');
    });

    it('should handle radius tokens', () => {
      const css = `
                :root {
                    --radius-md: 0.375rem;
                }
            `;
      const testFile = createTestCSSFile(css);

      const input: MapTokensToThemeInput = {
        figmaTokens: [
          {
            name: 'Medium Radius',
            value: '0.375rem',
            type: 'radius',
          },
        ],
        themeFilePath: testFile,
      };

      const result = mapFigmaTokensToTheme(input);

      expect(result).to.include('Medium Radius');
      expect(result).to.include('radius');
    });

    it('should handle mixed token types', () => {
      const css = `
                :root {
                    --primary: #2563eb;
                    --spacing-large: 24px;
                    --radius-md: 0.375rem;
                }
            `;
      const testFile = createTestCSSFile(css);

      const input: MapTokensToThemeInput = {
        figmaTokens: [
          {
            name: 'Primary',
            value: '#2563eb',
            type: 'color',
          },
          {
            name: 'Large Spacing',
            value: '24px',
            type: 'spacing',
          },
          {
            name: 'Medium Radius',
            value: '0.375rem',
            type: 'radius',
          },
        ],
        themeFilePath: testFile,
      };

      const result = mapFigmaTokensToTheme(input);

      expect(result).to.include('**Total Tokens**: 3');
    });
  });
});
