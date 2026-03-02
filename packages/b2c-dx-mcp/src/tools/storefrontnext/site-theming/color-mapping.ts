/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Derives foreground/background color combinations from a color mapping and
 * appends WCAG validation results to response text.
 *
 * @module tools/storefrontnext/site-theming/color-mapping
 */

import {validateColorCombinations, formatValidationResult, isValidHex} from './color-contrast.js';

/** A foreground/background color pair for contrast validation */
export type ColorCombination = {
  foreground: string;
  background: string;
  label: string;
  isLargeText?: boolean;
};

type ComboContext = {colorMapping: Record<string, string>; lightBg: string; darkBg: string; buttonBg: string};

function tryTextCombo(key: string, color: string, keyLower: string, ctx: ComboContext): ColorCombination | null {
  if (keyLower.includes('text') && keyLower.includes('light') && isValidHex(ctx.lightBg)) {
    return {foreground: color, background: ctx.lightBg, label: `${key}: ${color} on light background (${ctx.lightBg})`};
  }
  if (keyLower.includes('text') && keyLower.includes('dark') && isValidHex(ctx.darkBg)) {
    return {foreground: color, background: ctx.darkBg, label: `${key}: ${color} on dark background (${ctx.darkBg})`};
  }
  const isButtonText = keyLower === 'buttontext' || (keyLower.includes('button') && keyLower.includes('text'));
  if (isButtonText && isValidHex(ctx.buttonBg)) {
    return {
      foreground: color,
      background: ctx.buttonBg,
      label: `${key}: ${color} on button background (${ctx.buttonBg})`,
    };
  }
  if (keyLower.includes('link') && isValidHex(ctx.lightBg)) {
    return {foreground: color, background: ctx.lightBg, label: `${key}: ${color} on light background (${ctx.lightBg})`};
  }
  return null;
}

function tryBackgroundCombo(key: string, color: string, ctx: ComboContext): ColorCombination | null {
  const foregroundKey = key.replace(/Background|Bg/i, 'Text') || key.replace(/Background|Bg/i, 'Foreground');
  const foreground = ctx.colorMapping[foregroundKey] || ctx.colorMapping[`${key.replace(/Background|Bg/i, '')}Text`];
  if (foreground?.startsWith('#') && isValidHex(foreground)) {
    return {foreground, background: color, label: `${foregroundKey || 'text'} (${foreground}) on ${key} (${color})`};
  }
  return null;
}

function tryTextForegroundCombo(
  key: string,
  color: string,
  keyLower: string,
  ctx: ComboContext,
): ColorCombination | null {
  const backgroundKey = key.replace(/Text|Foreground/i, 'Background') || key.replace(/Text|Foreground/i, 'Bg');
  let background = ctx.colorMapping[backgroundKey];
  let backgroundLabel = backgroundKey;
  if (!background) {
    background = keyLower.includes('button') ? ctx.buttonBg : keyLower.includes('dark') ? ctx.darkBg : ctx.lightBg;
    backgroundLabel = keyLower.includes('button')
      ? 'button background'
      : keyLower.includes('dark')
        ? 'dark background'
        : 'light background';
  }
  if (background?.startsWith('#') && isValidHex(background)) {
    return {foreground: color, background, label: `${key} (${color}) on ${backgroundLabel} (${background})`};
  }
  return null;
}

function tryComboForEntry(key: string, color: string, ctx: ComboContext): ColorCombination | null {
  const keyLower = key.toLowerCase();
  const textCombo = tryTextCombo(key, color, keyLower, ctx);
  if (textCombo) return textCombo;
  if (keyLower.includes('background') || keyLower.includes('bg')) return tryBackgroundCombo(key, color, ctx);
  if (keyLower.includes('text') || keyLower.includes('foreground'))
    return tryTextForegroundCombo(key, color, keyLower, ctx);
  return null;
}

/**
 * Builds foreground/background color combinations from a semantic color mapping.
 * Derives pairs for text-on-background, button text, links, etc.
 */
export function buildColorCombinations(colorMapping: Record<string, string>): ColorCombination[] {
  const ctx: ComboContext = {
    colorMapping,
    lightBg: colorMapping.lightBackground || colorMapping.background || '#FFFFFF',
    darkBg: colorMapping.darkBackground || '#18181B',
    buttonBg: colorMapping.buttonBackground || colorMapping.primary || '#0A2540',
  };
  const combinations: ColorCombination[] = [];

  for (const [key, color] of Object.entries(colorMapping)) {
    if (!color || !color.startsWith('#') || !isValidHex(color)) continue;
    const combo = tryComboForEntry(key, color, ctx);
    if (combo) combinations.push(combo);
  }

  if (combinations.length === 0) {
    const whiteBg = '#FFFFFF';
    const darkBgFallback = '#18181B';
    for (const [key, color] of Object.entries(colorMapping)) {
      if (!color || !color.startsWith('#') || !isValidHex(color)) continue;
      if (key.toLowerCase().includes('background') || key.toLowerCase().includes('bg')) continue;
      combinations.push(
        {foreground: color, background: whiteBg, label: `${key} (${color}) on white background`},
        {foreground: color, background: darkBgFallback, label: `${key} (${color}) on dark background`},
      );
    }
  }
  return combinations;
}

/**
 * Appends WCAG color contrast validation results to the given instructions string.
 */
export function appendValidationSection(internalInstructions: string, combinations: ColorCombination[]): string {
  if (combinations.length === 0) {
    return internalInstructions;
  }
  const results = validateColorCombinations(combinations);
  let output = internalInstructions;

  for (const result of results) {
    output += formatValidationResult(result);
    output += '\n';
  }

  const hasIssues = results.some(
    (r) => !r.passesAA || r.visualAssessment === 'poor' || r.visualAssessment === 'acceptable',
  );
  if (hasIssues) {
    output += '### ⚠️ VALIDATION SUMMARY\n\n';
    output += '**Issues found that should be addressed:**\n\n';
    for (const result of results.filter(
      (r) => !r.passesAA || r.visualAssessment === 'poor' || r.visualAssessment === 'acceptable',
    )) {
      output += `- ${result.label || 'Color combination'}: ${result.recommendation || 'Needs improvement'}\n`;
    }
    output += '\n';
    output +=
      '**You MUST present these findings to the user BEFORE implementing and wait for their confirmation.**\n\n';
  } else {
    output += '### ✅ VALIDATION SUMMARY\n\n';
    output += 'All color combinations meet WCAG AA standards and have good visual assessment.\n\n';
  }
  return output;
}
