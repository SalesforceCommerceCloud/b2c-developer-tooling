/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  buildColorCombinations,
  appendValidationSection,
  type ColorCombination,
} from '../../../../src/tools/storefrontnext/site-theming/color-mapping.js';

describe('tools/storefrontnext/site-theming/color-mapping', () => {
  describe('buildColorCombinations', () => {
    it('should derive text-on-background combinations from semantic mapping', () => {
      const mapping = {
        lightText: '#000000',
        lightBackground: '#FFFFFF',
        buttonText: '#FFFFFF',
        buttonBackground: '#0A2540',
      };
      const combos = buildColorCombinations(mapping);
      expect(combos).to.have.lengthOf.at.least(2);
      expect(combos.some((c) => c.label.includes('light') && c.label.includes('light background'))).to.be.true;
      expect(combos.some((c) => c.label.includes('button') && c.label.includes('button background'))).to.be.true;
    });

    it('should use fallback white/dark backgrounds when no text-background pairs found', () => {
      const mapping = {accent: '#635BFF', primary: '#0A2540'};
      const combos = buildColorCombinations(mapping);
      expect(combos).to.have.lengthOf(4);
      expect(combos.filter((c) => c.background === '#FFFFFF')).to.have.lengthOf(2);
      expect(combos.filter((c) => c.background === '#18181B')).to.have.lengthOf(2);
      expect(combos.some((c) => c.label.includes('accent') && c.label.includes('white background'))).to.be.true;
      expect(combos.some((c) => c.label.includes('primary') && c.label.includes('dark background'))).to.be.true;
    });

    it('should skip invalid hex values', () => {
      const mapping = {lightText: '#000000', invalid: 'nothex', lightBackground: '#FFFFFF'};
      const combos = buildColorCombinations(mapping);
      expect(combos.some((c) => c.label.includes('invalid'))).to.be.false;
    });

    it('should skip non-hex values', () => {
      const mapping = {lightText: 'rgb(0,0,0)', lightBackground: '#FFFFFF'};
      const combos = buildColorCombinations(mapping);
      expect(combos.some((c) => c.foreground === 'rgb(0,0,0)')).to.be.false;
    });

    it('should derive link color on light background combination', () => {
      const mapping = {linkColor: '#0A2540', lightBackground: '#FFFFFF'};
      const combos = buildColorCombinations(mapping);
      expect(combos.some((c) => c.label.includes('link') && c.label.includes('light background'))).to.be.true;
    });

    it('should derive background combo when foreground key exists in mapping', () => {
      const mapping = {
        lightText: '#000000',
        lightBackground: '#FFFFFF',
        darkText: '#FFFFFF',
        darkBackground: '#18181B',
      };
      const combos = buildColorCombinations(mapping);
      expect(combos.some((c) => c.label.includes('lightText') && c.background === '#FFFFFF')).to.be.true;
      expect(combos.some((c) => c.label.includes('darkText') && c.background === '#18181B')).to.be.true;
    });

    it('should derive text-on-background using button/dark/light fallback when background key missing', () => {
      const mapping = {
        buttonText: '#FFFFFF',
        buttonBackground: '#0A2540',
      };
      const combos = buildColorCombinations(mapping);
      expect(combos.some((c) => c.label.includes('button') && c.label.includes('button background'))).to.be.true;
    });

    it('should use dark background fallback for darkForeground when darkBackground missing', () => {
      const mapping = {darkForeground: '#FFFFFF'};
      const combos = buildColorCombinations(mapping);
      expect(combos.some((c) => c.label.includes('dark') && c.label.includes('dark background'))).to.be.true;
      expect(combos.some((c) => c.background === '#18181B')).to.be.true;
    });

    it('should use button background fallback for buttonForeground when buttonBackground missing', () => {
      const mapping = {buttonForeground: '#FFFFFF'};
      const combos = buildColorCombinations(mapping);
      expect(combos.some((c) => c.label.includes('button') && c.label.includes('button background'))).to.be.true;
    });

    it('should use light background fallback for primaryText when background key missing', () => {
      const mapping = {primaryText: '#000000', lightBackground: '#FFFFFF'};
      const combos = buildColorCombinations(mapping);
      expect(combos.some((c) => c.label.includes('light background') && c.background === '#FFFFFF')).to.be.true;
    });

    it('should use fallback when background is invalid hex (tryTextForegroundCombo returns null)', () => {
      const mapping = {primaryText: '#000000', lightBackground: 'rgb(255,255,255)'};
      const combos = buildColorCombinations(mapping);
      expect(combos.some((c) => c.label.includes('white background'))).to.be.true;
    });
  });

  describe('appendValidationSection', () => {
    it('should return instructions unchanged when combinations are empty', () => {
      const instructions = '# Test\nSome content.';
      const result = appendValidationSection(instructions, []);
      expect(result).to.equal(instructions);
    });

    it('should append validation results and summary when combinations provided', () => {
      const combos: ColorCombination[] = [{foreground: '#000000', background: '#FFFFFF', label: 'Test combo'}];
      const result = appendValidationSection('# Base\n', combos);
      expect(result).to.include('# Base');
      expect(result).to.include('VALIDATION SUMMARY');
      expect(result).to.include('Test combo');
    });

    it('should append issues summary when contrast fails', () => {
      const combos: ColorCombination[] = [{foreground: '#888888', background: '#999999', label: 'Low contrast'}];
      const result = appendValidationSection('', combos);
      expect(result).to.include('Issues found that should be addressed');
      expect(result).to.include('Low contrast');
    });

    it('should append issues summary when visual assessment is acceptable', () => {
      // Ratio 4.5-5 produces "acceptable" (meets AA but borderline readability)
      const combos: ColorCombination[] = [{foreground: '#737373', background: '#FFFFFF', label: 'Borderline'}];
      const result = appendValidationSection('', combos);
      expect(result).to.include('Issues found that should be addressed');
      expect(result).to.include('Borderline');
    });

    it('should append success summary when all pass', () => {
      const combos: ColorCombination[] = [{foreground: '#000000', background: '#FFFFFF', label: 'Good contrast'}];
      const result = appendValidationSection('', combos);
      expect(result).to.include('All color combinations meet WCAG AA');
    });
  });
});
