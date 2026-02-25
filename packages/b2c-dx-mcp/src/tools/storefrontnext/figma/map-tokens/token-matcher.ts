/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {ThemeToken, ParsedTheme} from './css-parser.js';

export interface FigmaToken {
  name: string;
  value: string;
  type: 'color' | 'fontFamily' | 'fontSize' | 'opacity' | 'other' | 'radius' | 'spacing';
  description?: string;
}

export interface TokenMatch {
  figmaToken: FigmaToken;
  matchedToken?: ThemeToken;
  confidence: number; // 0-100
  matchType: 'exact' | 'fuzzy' | 'none';
  reason: string;
  suggestions?: TokenSuggestion[];
}

export interface TokenSuggestion {
  tokenName: string;
  value: string;
  theme: 'both' | 'dark' | 'light';
  reason: string;
  insertAfter?: string; // Token name to insert after
}

/**
 * Normalizes hex colors to lowercase 6-digit format
 */
function normalizeHexColor(hex: string): string {
  let normalized = hex.toLowerCase().trim();

  // Remove # if present
  if (normalized.startsWith('#')) {
    normalized = normalized.slice(1);
  }

  // Expand 3-digit hex to 6-digit
  if (normalized.length === 3) {
    normalized = [...normalized].map((c) => c + c).join('');
  }

  return normalized;
}

/**
 * Calculates color distance between two hex colors (0-100, lower is closer)
 */
function calculateColorDistance(hex1: string, hex2: string): number {
  const r1 = Number.parseInt(hex1.slice(0, 2), 16);
  const g1 = Number.parseInt(hex1.slice(2, 4), 16);
  const b1 = Number.parseInt(hex1.slice(4, 6), 16);

  const r2 = Number.parseInt(hex2.slice(0, 2), 16);
  const g2 = Number.parseInt(hex2.slice(2, 4), 16);
  const b2 = Number.parseInt(hex2.slice(4, 6), 16);

  // Euclidean distance normalized to 0-100 scale
  const distance = Math.hypot(r1 - r2, g1 - g2, b1 - b2);

  // Max distance is sqrt(255^2 * 3) ≈ 441
  return (distance / 441) * 100;
}

/**
 * Calculates string similarity between two strings (0-100, higher is more similar)
 * Uses Levenshtein distance algorithm
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Exact match
  if (s1 === s2) return 100;

  // Contains match bonus
  if (s1.includes(s2) || s2.includes(s1)) {
    return 80 + (Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length)) * 20;
  }

  // Levenshtein distance
  const matrix: number[][] = [];
  const len1 = s1.length;
  const len2 = s2.length;

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return ((maxLen - distance) / maxLen) * 100;
}

/**
 * Extracts semantic meaning from token name
 */
function extractSemantics(name: string): string[] {
  const parts = name.toLowerCase().replace(/^--/, '').split(/[-_]/);

  const semantics: string[] = [];

  // Color semantics
  const colorKeywords = new Set([
    'accent',
    'background',
    'border',
    'destructive',
    'error',
    'foreground',
    'info',
    'muted',
    'primary',
    'secondary',
    'success',
    'text',
    'warning',
  ]);
  const lightDark = new Set(['dark', 'light']);
  const colorNames = new Set(['black', 'blue', 'gray', 'green', 'orange', 'purple', 'red', 'white', 'yellow']);

  for (const part of parts) {
    if (colorKeywords.has(part)) {
      semantics.push(`semantic:${part}`);
    }
    if (lightDark.has(part)) {
      semantics.push(`theme:${part}`);
    }
    if (colorNames.has(part)) {
      semantics.push(`color:${part}`);
    }
  }

  return semantics;
}

/**
 * Finds exact color match
 */
function findExactColorMatch(figmaValue: string, parsedTheme: ParsedTheme): null | ThemeToken {
  const normalizedFigma = normalizeHexColor(figmaValue);

  for (const token of parsedTheme.tokens) {
    if (token.type === 'color' && token.resolvedValue) {
      const normalizedToken = normalizeHexColor(token.resolvedValue);
      if (normalizedFigma === normalizedToken) {
        return token;
      }
    }
  }

  return null;
}

/**
 * Finds fuzzy matches based on color similarity and name similarity
 */
function findFuzzyMatches(figmaToken: FigmaToken, parsedTheme: ParsedTheme): Array<{token: ThemeToken; score: number}> {
  const matches: Array<{token: ThemeToken; score: number}> = [];

  // Filter tokens by type
  const relevantTokens = parsedTheme.tokens.filter((token) => token.type === figmaToken.type);

  const figmaSemantics = extractSemantics(figmaToken.name);
  const normalizedFigmaValue =
    figmaToken.type === 'color' && figmaToken.value.startsWith('#')
      ? normalizeHexColor(figmaToken.value)
      : figmaToken.value;

  for (const token of relevantTokens) {
    let score = 0;

    // Name similarity (40% weight)
    const nameSimilarity = calculateStringSimilarity(figmaToken.name, token.name);
    score += nameSimilarity * 0.4;

    // Semantic similarity (30% weight)
    const tokenSemantics = extractSemantics(token.name);
    const semanticMatches = figmaSemantics.filter((s) => tokenSemantics.includes(s)).length;
    const semanticScore = figmaSemantics.length > 0 ? (semanticMatches / figmaSemantics.length) * 100 : 0;
    score += semanticScore * 0.3;

    // Value similarity (30% weight)
    if (figmaToken.type === 'color' && token.resolvedValue) {
      const normalizedTokenValue = normalizeHexColor(token.resolvedValue);
      const colorDistance = calculateColorDistance(normalizedFigmaValue, normalizedTokenValue);
      const colorSimilarity = Math.max(0, 100 - colorDistance);
      score += colorSimilarity * 0.3;
    }

    if (score > 20) {
      // Only include matches with score > 20
      matches.push({token, score});
    }
  }

  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score);
}

/**
 * Generates suggestions for new tokens if no good match found
 */
function generateTokenSuggestions(figmaToken: FigmaToken, parsedTheme: ParsedTheme): TokenSuggestion[] {
  const suggestions: TokenSuggestion[] = [];

  // Analyze existing token naming patterns
  const existingNames = parsedTheme.tokens.filter((t) => t.type === figmaToken.type).map((t) => t.name);

  // Extract common prefixes
  const hasColorPrefix = existingNames.some((n) => n.startsWith('--color-'));
  const hasRadiusPrefix = existingNames.some((n) => n.startsWith('--radius-'));

  // Generate token name based on Figma token name
  let suggestedName = figmaToken.name.toLowerCase().replaceAll(/[^a-z0-9-]/g, '-');

  // Add appropriate prefix if not present
  if (figmaToken.type === 'color' && !suggestedName.startsWith('--color-') && hasColorPrefix) {
    suggestedName = `--color-${suggestedName.replace(/^--/, '')}`;
  } else if (figmaToken.type === 'radius' && !suggestedName.startsWith('--radius-') && hasRadiusPrefix) {
    suggestedName = `--radius-${suggestedName.replace(/^--/, '')}`;
  } else if (!suggestedName.startsWith('--')) {
    suggestedName = `--${suggestedName}`;
  }

  // Find a good place to insert
  const similarTokens = existingNames.filter((name) => {
    const similarity = calculateStringSimilarity(name, suggestedName);
    return similarity > 30;
  });

  const insertAfter = similarTokens.length > 0 ? similarTokens[0] : undefined;

  // For colors, suggest both light and dark values
  if (figmaToken.type === 'color') {
    suggestions.push({
      tokenName: suggestedName,
      value: figmaToken.value,
      theme: 'both',
      reason: `New token suggestion based on Figma token "${figmaToken.name}"`,
      insertAfter,
    });
  } else {
    suggestions.push({
      tokenName: suggestedName,
      value: figmaToken.value,
      theme: 'light',
      reason: `New token suggestion based on Figma token "${figmaToken.name}"`,
      insertAfter,
    });
  }

  return suggestions;
}

/**
 * Matches a single Figma token to existing theme tokens
 */
export function matchToken(figmaToken: FigmaToken, parsedTheme: ParsedTheme): TokenMatch {
  // Try exact match first (only for colors with hex values)
  if (figmaToken.type === 'color' && figmaToken.value.startsWith('#')) {
    const exactMatch = findExactColorMatch(figmaToken.value, parsedTheme);
    if (exactMatch) {
      return {
        figmaToken,
        matchedToken: exactMatch,
        confidence: 100,
        matchType: 'exact',
        reason: `Exact color match: ${figmaToken.value} matches ${exactMatch.name}`,
      };
    }
  }

  // Try fuzzy matching
  const fuzzyMatches = findFuzzyMatches(figmaToken, parsedTheme);

  if (fuzzyMatches.length > 0 && fuzzyMatches[0].score >= 50) {
    const bestMatch = fuzzyMatches[0];
    return {
      figmaToken,
      matchedToken: bestMatch.token,
      confidence: Math.round(bestMatch.score),
      matchType: 'fuzzy',
      reason: `Fuzzy match based on name similarity and semantic meaning`,
      suggestions:
        fuzzyMatches.length > 1
          ? fuzzyMatches.slice(1, 4).map((m) => ({
              tokenName: m.token.name,
              value: m.token.value,
              theme: m.token.theme === 'shared' ? 'both' : m.token.theme,
              reason: `Alternative match (confidence: ${Math.round(m.score)}%)`,
            }))
          : undefined,
    };
  }

  // No good match found, generate suggestions
  const suggestions = generateTokenSuggestions(figmaToken, parsedTheme);

  return {
    figmaToken,
    confidence: 0,
    matchType: 'none',
    reason: 'No matching token found. Consider creating a new token.',
    suggestions,
  };
}

/**
 * Matches multiple Figma tokens to existing theme tokens
 */
export function matchTokens(figmaTokens: FigmaToken[], parsedTheme: ParsedTheme): TokenMatch[] {
  return figmaTokens.map((token) => matchToken(token, parsedTheme));
}
