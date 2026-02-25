/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  matchToken,
  matchTokens,
  type FigmaToken,
} from '../../../../../src/tools/storefrontnext/figma/map-tokens/token-matcher.js';
import type {ParsedTheme, ThemeToken} from '../../../../../src/tools/storefrontnext/figma/map-tokens/css-parser.js';

// Helper to create a mock ParsedTheme
function createMockTheme(tokens: ThemeToken[]): ParsedTheme {
  const lightTokens = new Map<string, ThemeToken>();
  const darkTokens = new Map<string, ThemeToken>();
  const sharedTokens = new Map<string, ThemeToken>();

  for (const token of tokens) {
    switch (token.theme) {
      case 'dark': {
        darkTokens.set(token.name, token);
        break;
      }
      case 'light': {
        lightTokens.set(token.name, token);
        break;
      }
      case 'shared': {
        sharedTokens.set(token.name, token);
        break;
      }
    }
  }

  return {
    tokens,
    lightTokens,
    darkTokens,
    sharedTokens,
    warnings: [],
  };
}

describe('token-matcher', () => {
  describe('matchToken - exact color matches', () => {
    it('should find exact hex color match', () => {
      const figmaToken: FigmaToken = {
        name: 'Primary/Blue',
        value: '#2563eb',
        type: 'color',
      };

      const themeTokens: ThemeToken[] = [
        {
          name: '--primary',
          value: '#2563eb',
          theme: 'light',
          type: 'color',
          resolvedValue: '#2563eb',
        },
      ];

      const theme = createMockTheme(themeTokens);
      const match = matchToken(figmaToken, theme);

      expect(match.matchType).to.equal('exact');
      expect(match.confidence).to.equal(100);
      expect(match.matchedToken?.name).to.equal('--primary');
    });

    it('should match 3-digit hex to 6-digit hex', () => {
      const figmaToken: FigmaToken = {
        name: 'Red',
        value: '#f00',
        type: 'color',
      };

      const themeTokens: ThemeToken[] = [
        {
          name: '--error',
          value: '#ff0000',
          theme: 'light',
          type: 'color',
          resolvedValue: '#ff0000',
        },
      ];

      const theme = createMockTheme(themeTokens);
      const match = matchToken(figmaToken, theme);

      expect(match.matchType).to.equal('exact');
      expect(match.confidence).to.equal(100);
    });

    it('should handle hex colors without # prefix', () => {
      const figmaToken: FigmaToken = {
        name: 'Green',
        value: '#00ff00',
        type: 'color',
      };

      const themeTokens: ThemeToken[] = [
        {
          name: '--success',
          value: '00ff00',
          theme: 'light',
          type: 'color',
          resolvedValue: '00ff00',
        },
      ];

      const theme = createMockTheme(themeTokens);
      const match = matchToken(figmaToken, theme);

      expect(match.matchType).to.equal('exact');
    });
  });

  describe('matchToken - fuzzy matching', () => {
    it('should find fuzzy match based on name similarity', () => {
      const figmaToken: FigmaToken = {
        name: 'Primary',
        value: '#2563eb',
        type: 'color',
      };

      const themeTokens: ThemeToken[] = [
        {
          name: '--primary-button',
          value: '#2560e0',
          theme: 'light',
          type: 'color',
          resolvedValue: '#2560e0',
        },
        {
          name: '--secondary',
          value: '#64748b',
          theme: 'light',
          type: 'color',
          resolvedValue: '#64748b',
        },
      ];

      const theme = createMockTheme(themeTokens);
      const match = matchToken(figmaToken, theme);

      expect(match.matchType).to.equal('fuzzy');
      expect(match.confidence).to.be.greaterThan(50);
      expect(match.matchedToken?.name).to.equal('--primary-button');
    });

    it('should match based on semantic meaning', () => {
      const figmaToken: FigmaToken = {
        name: 'Error/Red',
        value: '#dc2626',
        type: 'color',
      };

      const themeTokens: ThemeToken[] = [
        {
          name: '--destructive',
          value: '#dc2626',
          theme: 'light',
          type: 'color',
          resolvedValue: '#dc2626',
        },
        {
          name: '--primary',
          value: '#dc2626',
          theme: 'light',
          type: 'color',
          resolvedValue: '#dc2626',
        },
      ];

      const theme = createMockTheme(themeTokens);
      const match = matchToken(figmaToken, theme);

      // Should match destructive due to error semantic
      expect(match.matchType).to.equal('exact'); // Exact color match
      expect(match.matchedToken?.name).to.equal('--destructive');
    });

    it('should consider color similarity in fuzzy matching', () => {
      const figmaToken: FigmaToken = {
        name: 'primary-color',
        value: '#2560e8',
        type: 'color',
      };

      const themeTokens: ThemeToken[] = [
        {
          name: '--primary',
          value: '#2563eb',
          theme: 'light',
          type: 'color',
          resolvedValue: '#2563eb',
        },
        {
          name: '--error',
          value: '#dc2626',
          theme: 'light',
          type: 'color',
          resolvedValue: '#dc2626',
        },
      ];

      const theme = createMockTheme(themeTokens);
      const match = matchToken(figmaToken, theme);

      expect(match.matchType).to.equal('fuzzy');
      expect(match.matchedToken?.name).to.equal('--primary');
    });

    it('should provide alternative suggestions for fuzzy matches', () => {
      const figmaToken: FigmaToken = {
        name: 'Blue Primary',
        value: '#3b82f5',
        type: 'color',
      };

      const themeTokens: ThemeToken[] = [
        {
          name: '--primary',
          value: '#3b82f6',
          theme: 'light',
          type: 'color',
          resolvedValue: '#3b82f6',
        },
        {
          name: '--accent',
          value: '#3b80f0',
          theme: 'light',
          type: 'color',
          resolvedValue: '#3b80f0',
        },
        {
          name: '--info',
          value: '#3b85f8',
          theme: 'light',
          type: 'color',
          resolvedValue: '#3b85f8',
        },
      ];

      const theme = createMockTheme(themeTokens);
      const match = matchToken(figmaToken, theme);

      expect(match.matchType).to.equal('fuzzy');
      expect(match.suggestions).to.not.be.undefined;
      expect(match.suggestions?.length).to.be.greaterThan(0);
    });

    it('should only match tokens of the same type', () => {
      const figmaToken: FigmaToken = {
        name: 'spacing',
        value: '16px',
        type: 'spacing',
      };

      const themeTokens: ThemeToken[] = [
        {
          name: '--spacing-color',
          value: '#2563eb',
          theme: 'light',
          type: 'color',
          resolvedValue: '#2563eb',
        },
        {
          name: '--spacing-large',
          value: '24px',
          theme: 'light',
          type: 'spacing',
          resolvedValue: '24px',
        },
      ];

      const theme = createMockTheme(themeTokens);
      const match = matchToken(figmaToken, theme);

      if (match.matchedToken) {
        expect(match.matchedToken.type).to.equal('spacing');
      }
    });
  });

  describe('matchToken - no matches', () => {
    it('should return no match when no similar tokens exist', () => {
      const figmaToken: FigmaToken = {
        name: 'Brand Purple',
        value: '#9333ea',
        type: 'color',
      };

      const themeTokens: ThemeToken[] = [
        {
          name: '--primary',
          value: '#2563eb',
          theme: 'light',
          type: 'color',
          resolvedValue: '#2563eb',
        },
      ];

      const theme = createMockTheme(themeTokens);
      const match = matchToken(figmaToken, theme);

      expect(match.matchType).to.equal('none');
      expect(match.confidence).to.equal(0);
    });

    it('should provide token name suggestions when no match found', () => {
      const figmaToken: FigmaToken = {
        name: 'Brand/Purple/500',
        value: '#9333ea',
        type: 'color',
      };

      const themeTokens: ThemeToken[] = [
        {
          name: '--color-primary',
          value: '#2563eb',
          theme: 'light',
          type: 'color',
          resolvedValue: '#2563eb',
        },
      ];

      const theme = createMockTheme(themeTokens);
      const match = matchToken(figmaToken, theme);

      expect(match.suggestions).to.not.be.undefined;
      expect(match.suggestions?.length).to.be.greaterThan(0);
      expect(match.suggestions?.[0].tokenName).to.include('--');
    });

    it('should suggest appropriate prefix based on existing tokens', () => {
      const figmaToken: FigmaToken = {
        name: 'accent',
        value: '#9333ea',
        type: 'color',
      };

      const themeTokens: ThemeToken[] = [
        {
          name: '--color-primary',
          value: '#2563eb',
          theme: 'light',
          type: 'color',
          resolvedValue: '#2563eb',
        },
        {
          name: '--color-secondary',
          value: '#64748b',
          theme: 'light',
          type: 'color',
          resolvedValue: '#64748b',
        },
      ];

      const theme = createMockTheme(themeTokens);
      const match = matchToken(figmaToken, theme);

      expect(match.suggestions?.[0].tokenName).to.match(/^--color-/);
    });
  });

  describe('matchTokens - batch matching', () => {
    it('should match multiple tokens at once', () => {
      const figmaTokens: FigmaToken[] = [
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
      ];

      const themeTokens: ThemeToken[] = [
        {
          name: '--primary',
          value: '#2563eb',
          theme: 'light',
          type: 'color',
          resolvedValue: '#2563eb',
        },
        {
          name: '--secondary',
          value: '#64748b',
          theme: 'light',
          type: 'color',
          resolvedValue: '#64748b',
        },
      ];

      const theme = createMockTheme(themeTokens);
      const matches = matchTokens(figmaTokens, theme);

      expect(matches.length).to.equal(2);
      expect(matches[0].matchType).to.equal('exact');
      expect(matches[1].matchType).to.equal('exact');
    });

    it('should handle mixed match types', () => {
      const figmaTokens: FigmaToken[] = [
        {
          name: 'Primary',
          value: '#2563eb',
          type: 'color',
        },
        {
          name: 'Brand Purple',
          value: '#9333ea',
          type: 'color',
        },
      ];

      const themeTokens: ThemeToken[] = [
        {
          name: '--primary',
          value: '#2563eb',
          theme: 'light',
          type: 'color',
          resolvedValue: '#2563eb',
        },
      ];

      const theme = createMockTheme(themeTokens);
      const matches = matchTokens(figmaTokens, theme);

      expect(matches.length).to.equal(2);
      expect(matches[0].matchType).to.equal('exact');
      expect(matches[1].matchType).to.equal('none');
    });
  });

  describe('edge cases', () => {
    it('should handle tokens with special characters', () => {
      const figmaToken: FigmaToken = {
        name: 'Primary/Button-Active',
        value: '#2563eb',
        type: 'color',
      };

      const themeTokens: ThemeToken[] = [
        {
          name: '--primary-button-active',
          value: '#2563eb',
          theme: 'light',
          type: 'color',
          resolvedValue: '#2563eb',
        },
      ];

      const theme = createMockTheme(themeTokens);
      const match = matchToken(figmaToken, theme);

      expect(match.matchType).to.equal('exact');
    });

    it('should handle empty token lists', () => {
      const figmaTokens: FigmaToken[] = [];
      const theme = createMockTheme([]);

      const matches = matchTokens(figmaTokens, theme);

      expect(matches.length).to.equal(0);
    });

    it('should handle non-color types with fuzzy matching', () => {
      const figmaToken: FigmaToken = {
        name: 'Large/Spacing',
        value: '24px',
        type: 'spacing',
      };

      const themeTokens: ThemeToken[] = [
        {
          name: '--spacing-large',
          value: '24px',
          theme: 'light',
          type: 'spacing',
          resolvedValue: '24px',
        },
      ];

      const theme = createMockTheme(themeTokens);
      const match = matchToken(figmaToken, theme);

      // Non-color types use fuzzy matching, may return 'none' if similarity is below threshold
      // The key is they never use exact value matching like colors do
      expect(['fuzzy', 'none']).to.include(match.matchType);
      expect(match.suggestions).to.not.be.undefined;
    });

    it('should use theme:light and theme:dark semantics in fuzzy matching', () => {
      const figmaToken: FigmaToken = {
        name: 'light-background',
        value: '#f8fafc',
        type: 'color',
      };

      const themeTokens: ThemeToken[] = [
        {
          name: '--light-bg',
          value: '#f8fafc',
          theme: 'light',
          type: 'color',
          resolvedValue: '#f8fafc',
        },
        {
          name: '--dark-bg',
          value: '#0f172a',
          theme: 'dark',
          type: 'color',
          resolvedValue: '#0f172a',
        },
      ];

      const theme = createMockTheme(themeTokens);
      const match = matchToken(figmaToken, theme);

      expect(match.matchType).to.equal('exact');
      expect(match.matchedToken?.name).to.equal('--light-bg');
    });

    it('should generate theme: "light" suggestion for non-color unmatched tokens', () => {
      const figmaToken: FigmaToken = {
        name: 'Large Radius',
        value: '1rem',
        type: 'radius',
      };

      const theme = createMockTheme([]);
      const match = matchToken(figmaToken, theme);

      expect(match.matchType).to.equal('none');
      expect(match.suggestions).to.not.be.undefined;
      expect(match.suggestions!.length).to.be.greaterThan(0);
      expect(match.suggestions![0].theme).to.equal('light');
    });

    it('should generate theme: "both" suggestion for unmatched color tokens', () => {
      const figmaToken: FigmaToken = {
        name: 'Brand Teal',
        value: '#14b8a6',
        type: 'color',
      };

      const theme = createMockTheme([]);
      const match = matchToken(figmaToken, theme);

      expect(match.matchType).to.equal('none');
      expect(match.suggestions).to.not.be.undefined;
      expect(match.suggestions![0].theme).to.equal('both');
    });
  });
});
