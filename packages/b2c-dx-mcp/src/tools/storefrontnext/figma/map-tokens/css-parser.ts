/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * PostCSS dependency: Used to parse theme CSS (app.css) into an AST for reliable extraction of
 * design tokens. Required for: (1) walking @theme at-rules and inline blocks, (2) distinguishing
 * light/dark/shared tokens via selectors (e.g. [data-theme="light"], :root), (3) handling nested
 * rules and var() references. Regex-based parsing would be brittle for real-world theme files.
 */

import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import postcss, {type AtRule, type Rule} from 'postcss';

/**
 * Design token extracted from theme CSS (app.css).
 *
 * @property {string} name - CSS custom property name (e.g., "--color-primary")
 * @property {string} value - Raw value (may be var() reference)
 * @property {'dark'|'light'|'shared'} theme - Theme context: 'dark', 'light', or 'shared'
 * @property {'color'|'fontFamily'|'fontSize'|'opacity'|'other'|'radius'|'spacing'} type - Token type for matching: color, spacing, radius, etc.
 * @property {string} [resolvedValue] - Resolved value for var() references (actual hex/value)
 */
export interface ThemeToken {
  name: string;
  value: string;
  theme: 'dark' | 'light' | 'shared';
  type: 'color' | 'fontFamily' | 'fontSize' | 'opacity' | 'other' | 'radius' | 'spacing';
  resolvedValue?: string;
}

/**
 * Parsed theme file with tokens organized by theme context.
 *
 * @property {ThemeToken[]} tokens - All resolved tokens (excludes unresolved var() references)
 * @property {Map<string,ThemeToken>} lightTokens - Map of token name to ThemeToken for light theme
 * @property {Map<string,ThemeToken>} darkTokens - Map of token name to ThemeToken for dark theme
 * @property {Map<string,ThemeToken>} sharedTokens - Map of token name to ThemeToken for shared tokens
 * @property {string[]} warnings - Warnings (e.g., unresolved var() references)
 */
export interface ParsedTheme {
  tokens: ThemeToken[];
  lightTokens: Map<string, ThemeToken>;
  darkTokens: Map<string, ThemeToken>;
  sharedTokens: Map<string, ThemeToken>;
  warnings: string[];
}

/**
 * Determines the type of a CSS custom property based on its name and value
 */
function determineTokenType(name: string, value: string): ThemeToken['type'] {
  const nameLower = name.toLowerCase();

  if (nameLower.includes('color') || value.startsWith('#') || value.startsWith('rgb')) {
    return 'color';
  }
  if (nameLower.includes('radius')) {
    return 'radius';
  }
  if (nameLower.includes('opacity')) {
    return 'opacity';
  }
  if (nameLower.includes('font-size') || nameLower.includes('text-size')) {
    return 'fontSize';
  }
  if (nameLower.includes('font-family') || nameLower.includes('font-face')) {
    return 'fontFamily';
  }
  if (
    nameLower.includes('spacing') ||
    nameLower.includes('gap') ||
    nameLower.includes('padding') ||
    nameLower.includes('margin')
  ) {
    return 'spacing';
  }

  return 'other';
}

/**
 * Extracts CSS custom property name from var() reference
 * Example: "var(--primary)" -> "--primary"
 */
function extractVarName(value: string): null | string {
  const match = value.match(/var\(([^)]+)\)/);
  return match ? match[1].trim() : null;
}

/**
 * Resolves var() references to actual values
 * Returns warnings for any unresolved references
 */
function resolveVarReferences(tokens: ThemeToken[]): string[] {
  const warnings: string[] = [];
  const tokenMap = new Map<string, ThemeToken>();
  for (const token of tokens) tokenMap.set(token.name, token);

  for (const token of tokens) {
    if (token.value.includes('var(')) {
      const varName = extractVarName(token.value);
      if (varName) {
        const referencedToken = tokenMap.get(varName);
        if (referencedToken) {
          // Recursively resolve if the referenced token also has a var()
          token.resolvedValue = referencedToken.resolvedValue || referencedToken.value;
        } else {
          // Unresolved reference - log warning and skip this token
          warnings.push(
            `Warning: Token "${token.name}" references undefined variable "${varName}". This token will be excluded from matching.`,
          );
          // Don't set resolvedValue - this token will be filtered out
        }
      }
    } else {
      token.resolvedValue = token.value;
    }
  }

  return warnings;
}

/**
 * Extracts custom properties from a PostCSS rule node
 */
function extractCustomPropertiesFromRule(rule: Rule, theme: 'dark' | 'light' | 'shared'): ThemeToken[] {
  const tokens: ThemeToken[] = [];

  rule.walkDecls((decl) => {
    if (decl.prop.startsWith('--')) {
      tokens.push({
        name: decl.prop,
        value: decl.value,
        theme,
        type: determineTokenType(decl.prop, decl.value),
      });
    }
  });

  return tokens;
}

/**
 * Determines if a selector represents a dark theme context
 */
function isDarkThemeSelector(selector: string): boolean {
  return (
    selector.includes('.dark') ||
    selector.includes('[data-theme="dark"]') ||
    selector.includes("[data-theme='dark']") ||
    (selector.includes('html:not(.dark)') && selector.includes('inverse'))
  );
}

/**
 * Determines if a selector represents a light theme context
 */
function isLightThemeSelector(selector: string): boolean {
  return (
    selector === ':root' ||
    selector.includes('[data-theme="light"]') ||
    selector.includes("[data-theme='light']") ||
    (selector.includes('html.dark') && selector.includes('inverse'))
  );
}

/**
 * Parses CSS content to extract theme tokens from different sections using PostCSS
 */
function parseCSSContent(cssContent: string): ParsedTheme {
  const allTokens: ThemeToken[] = [];

  // Parse CSS with PostCSS
  const root = postcss.parse(cssContent);

  // Walk through all rules and at-rules
  root.walkAtRules('theme', (atRule: AtRule) => {
    // Extract @theme inline block (shared tokens)
    if (atRule.params.includes('inline')) {
      atRule.walkDecls((decl) => {
        if (decl.prop.startsWith('--')) {
          allTokens.push({
            name: decl.prop,
            value: decl.value,
            theme: 'shared',
            type: determineTokenType(decl.prop, decl.value),
          });
        }
      });
    }
  });

  // Walk through all rules to find theme-specific tokens
  root.walkRules((rule: Rule) => {
    const selector = rule.selector;

    // Determine theme based on selector
    let theme: 'dark' | 'light' | 'shared' | null = null;

    if (isDarkThemeSelector(selector)) {
      theme = 'dark';
    } else if (isLightThemeSelector(selector)) {
      theme = 'light';
    }

    // Extract tokens if we identified a theme
    if (theme) {
      const tokens = extractCustomPropertiesFromRule(rule, theme);
      allTokens.push(...tokens);
    }
  });

  // Resolve var() references and collect warnings
  const warnings = resolveVarReferences(allTokens);

  // Filter out tokens with unresolved references
  const resolvedTokens = allTokens.filter((token) => token.resolvedValue !== undefined);

  // Log warnings about skipped tokens
  if (warnings.length > 0 && resolvedTokens.length < allTokens.length) {
    const skippedCount = allTokens.length - resolvedTokens.length;
    warnings.push(
      `Skipped ${skippedCount} token(s) with unresolved var() references. These will not be available for matching.`,
    );
  }

  // Organize tokens by theme
  const lightTokens = new Map<string, ThemeToken>();
  const darkTokens = new Map<string, ThemeToken>();
  const sharedTokens = new Map<string, ThemeToken>();

  for (const token of resolvedTokens) {
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
    tokens: resolvedTokens,
    lightTokens,
    darkTokens,
    sharedTokens,
    warnings,
  };
}

/**
 * Finds the theme file path (app.css) in the workspace.
 *
 * @param workspaceRoot - Workspace root directory to search
 * @returns Absolute path to app.css if found, or null
 */
export function findThemeFilePath(workspaceRoot?: string): null | string {
  if (!workspaceRoot) {
    return null;
  }

  const possiblePaths = [join(workspaceRoot, 'src/app.css'), join(workspaceRoot, 'app.css')];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Parses theme file and extracts all CSS custom properties.
 *
 * When themeFilePath is not provided, searches for app.css in src/app.css or app.css relative to workspaceRoot.
 *
 * @param themeFilePath - Optional absolute path to theme CSS file
 * @param workspaceRoot - Optional workspace root for theme file discovery when themeFilePath is omitted
 * @returns Parsed theme with tokens organized by light/dark/shared
 * @throws {Error} When theme file is not found
 */
export function parseThemeFile(themeFilePath?: string, workspaceRoot?: string): ParsedTheme {
  const filePath = themeFilePath ?? findThemeFilePath(workspaceRoot);

  if (!filePath) {
    throw new Error('Theme file (app.css) not found. Please provide the themeFilePath parameter.');
  }

  if (!existsSync(filePath)) {
    throw new Error(`Theme file not found at: ${filePath}`);
  }

  const cssContent = readFileSync(filePath, 'utf8');
  return parseCSSContent(cssContent);
}

/**
 * Gets all color tokens from parsed theme.
 *
 * @param parsedTheme - Parsed theme from parseThemeFile
 * @returns Array of color-type tokens
 */
export function getColorTokens(parsedTheme: ParsedTheme): ThemeToken[] {
  return parsedTheme.tokens.filter((token) => token.type === 'color');
}

/**
 * Gets all spacing tokens from parsed theme.
 *
 * @param parsedTheme - Parsed theme from parseThemeFile
 * @returns Array of spacing-type tokens
 */
export function getSpacingTokens(parsedTheme: ParsedTheme): ThemeToken[] {
  return parsedTheme.tokens.filter((token) => token.type === 'spacing');
}

/**
 * Gets all radius tokens from parsed theme.
 *
 * @param parsedTheme - Parsed theme from parseThemeFile
 * @returns Array of radius-type tokens
 */
export function getRadiusTokens(parsedTheme: ParsedTheme): ThemeToken[] {
  return parsedTheme.tokens.filter((token) => token.type === 'radius');
}
