/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * WCAG 2.1 color contrast utilities for accessibility validation.
 *
 * Provides luminance calculation, contrast ratio computation, and WCAG compliance
 * checking for theming and color validation in Storefront Next.
 *
 * @module tools/storefrontnext/site-theming/color-contrast
 */

/**
 * WCAG 2.1 constants for contrast ratio calculation
 * These values are specified in the WCAG 2.1 standard
 */
const WCAG_CONTRAST_OFFSET = 0.05; // Offset added to luminance values in contrast ratio formula

// Linear RGB conversion constants (sRGB to linear RGB)
const LINEAR_RGB_THRESHOLD = 0.039_28; // Threshold for linear RGB conversion
const LINEAR_RGB_DIVISOR = 12.92; // Divisor for values below threshold
const GAMMA_CORRECTION_OFFSET = 0.055; // Offset for gamma correction
const GAMMA_CORRECTION_DIVISOR = 1.055; // Divisor for gamma correction
const GAMMA_EXPONENT = 2.4; // Gamma exponent for sRGB

// Relative luminance weights (WCAG 2.1 standard)
const LUMINANCE_RED_WEIGHT = 0.2126;
const LUMINANCE_GREEN_WEIGHT = 0.7152;
const LUMINANCE_BLUE_WEIGHT = 0.0722;

/** Valid 6-digit hex color pattern (with optional # prefix) */
const HEX_PATTERN = /^#?[0-9A-Fa-f]{6}$/;

/**
 * Validates that a string is a valid 6-digit hex color.
 * @param hex - Hex color string to validate
 * @returns true if valid
 */
export function isValidHex(hex: string): boolean {
  return typeof hex === 'string' && HEX_PATTERN.test(hex.trim());
}

/**
 * Calculates the relative luminance of a color according to WCAG 2.1
 * @param hex - Hex color string (e.g., "#635BFF")
 * @returns Relative luminance value between 0 and 1
 * @throws Error if hex format is invalid
 */
export function getLuminance(hex: string): number {
  const trimmed = hex.trim();
  if (!HEX_PATTERN.test(trimmed)) {
    throw new Error(`Invalid hex color: "${hex}". Expected 6-digit hex (e.g., #635BFF).`);
  }
  const cleanHex = trimmed.replace('#', '');

  // Parse RGB values
  const r = Number.parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = Number.parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = Number.parseInt(cleanHex.slice(4, 6), 16) / 255;

  // Convert to linear RGB
  const [rs, gs, bs] = [r, g, b].map((c) => {
    return c <= LINEAR_RGB_THRESHOLD
      ? c / LINEAR_RGB_DIVISOR
      : ((c + GAMMA_CORRECTION_OFFSET) / GAMMA_CORRECTION_DIVISOR) ** GAMMA_EXPONENT;
  });

  // Calculate relative luminance
  return LUMINANCE_RED_WEIGHT * rs + LUMINANCE_GREEN_WEIGHT * gs + LUMINANCE_BLUE_WEIGHT * bs;
}

/**
 * Calculates the contrast ratio between two colors according to WCAG 2.1
 * @param color1 - First hex color string
 * @param color2 - Second hex color string
 * @returns Contrast ratio (1:1 to 21:1)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + WCAG_CONTRAST_OFFSET) / (darker + WCAG_CONTRAST_OFFSET);
}

/**
 * WCAG compliance levels
 */
export enum WCAGLevel {
  AA = 'AA', // 4.5:1 for normal text
  AA_LARGE = 'AA_LARGE', // 3:1 for large text
  AAA = 'AAA', // 7:1 for normal text
  AAA_LARGE = 'AAA_LARGE', // 4.5:1 for large text
  FAIL = 'FAIL',
}

/**
 * Determines WCAG compliance level for a contrast ratio
 * @param ratio - Contrast ratio
 * @param isLargeText - Whether this is for large text (18pt+ or 14pt+ bold)
 * @returns WCAG compliance level
 */
export function getWCAGLevel(ratio: number, isLargeText = false): WCAGLevel {
  if (isLargeText) {
    if (ratio >= 4.5) {
      return WCAGLevel.AAA_LARGE;
    }
    if (ratio >= 3) {
      return WCAGLevel.AA_LARGE;
    }
    return WCAGLevel.FAIL;
  }

  if (ratio >= 7) {
    return WCAGLevel.AAA;
  }
  if (ratio >= 4.5) {
    return WCAGLevel.AA;
  }
  return WCAGLevel.FAIL;
}

/**
 * Result of color contrast validation for a single foreground/background pair.
 *
 * @property {string} color1 - First hex color (typically foreground)
 * @property {string} color2 - Second hex color (typically background)
 * @property {number} ratio - Contrast ratio (1:1 to 21:1)
 * @property {WCAGLevel} wcagLevel - WCAG compliance level
 * @property {boolean} passesAA - Whether the combination meets WCAG AA
 * @property {boolean} passesAAA - Whether the combination meets WCAG AAA
 * @property {boolean} isLargeText - Whether validation used large-text thresholds
 * @property {string} visualAssessment - Readability assessment (excellent, good, acceptable, poor)
 * @property {string} [recommendation] - Optional suggestion when contrast is suboptimal
 */
export interface ContrastValidationResult {
  color1: string;
  color2: string;
  ratio: number;
  wcagLevel: WCAGLevel;
  passesAA: boolean;
  passesAAA: boolean;
  isLargeText: boolean;
  visualAssessment: 'acceptable' | 'excellent' | 'good' | 'poor';
  recommendation?: string;
}

/**
 * Validates contrast between two colors
 * @param color1 - First hex color string
 * @param color2 - Second hex color string
 * @param isLargeText - Whether this is for large text
 * @returns Validation result with contrast ratio and compliance info
 */
export function validateContrast(color1: string, color2: string, isLargeText = false): ContrastValidationResult {
  const ratio = getContrastRatio(color1, color2);
  const wcagLevel = getWCAGLevel(ratio, isLargeText);
  const passesAA = ratio >= (isLargeText ? 3 : 4.5);
  const passesAAA = ratio >= (isLargeText ? 4.5 : 7);

  // Visual assessment based on ratio
  let visualAssessment: 'acceptable' | 'excellent' | 'good' | 'poor';
  let recommendation: string | undefined;

  if (ratio >= 7) {
    visualAssessment = 'excellent';
  } else if (ratio >= 5) {
    visualAssessment = 'good';
  } else if (ratio >= 4.5) {
    visualAssessment = 'acceptable';
    recommendation =
      'Meets minimum WCAG AA but may be difficult to read, especially for body text. Consider using a darker/lighter color for better readability.';
  } else {
    visualAssessment = 'poor';
    recommendation =
      'Does not meet WCAG AA standards. Text will be difficult to read. Strongly recommend using a color with better contrast.';
  }

  return {
    color1,
    color2,
    ratio,
    wcagLevel,
    passesAA,
    passesAAA,
    isLargeText,
    visualAssessment,
    recommendation,
  };
}

/**
 * Validates multiple color combinations for WCAG compliance.
 *
 * @param combinations - Array of foreground/background pairs with optional label and large-text flag
 * @returns Array of validation results, each including the input label if provided
 */
export function validateColorCombinations(
  combinations: Array<{
    foreground: string;
    background: string;
    isLargeText?: boolean;
    label?: string;
  }>,
): Array<ContrastValidationResult & {label?: string}> {
  return combinations.map((combo) => ({
    ...validateContrast(combo.foreground, combo.background, combo.isLargeText ?? false),
    label: combo.label,
  }));
}

/**
 * Formats a validation result as a human-readable string for display to users.
 *
 * @param result - Validation result, optionally with a label for the color combination
 * @returns Multi-line string with contrast ratio, WCAG status, and recommendation (if any)
 */
export function formatValidationResult(result: ContrastValidationResult & {label?: string}): string {
  const label = result.label ? `${result.label}: ` : '';
  const textType = result.isLargeText ? 'large text' : 'normal text';
  const wcagStatus = result.passesAAA ? '✅ AAA' : result.passesAA ? '✅ AA' : '❌ FAIL';

  let output = `${label}${result.color1} on ${result.color2}\n`;
  output += `  Contrast Ratio: ${result.ratio.toFixed(2)}:1\n`;
  output += `  WCAG ${textType}: ${wcagStatus}\n`;
  output += `  Visual Assessment: ${result.visualAssessment.toUpperCase()}\n`;

  if (result.recommendation) {
    output += `  ⚠️  ${result.recommendation}\n`;
  }

  return output;
}
