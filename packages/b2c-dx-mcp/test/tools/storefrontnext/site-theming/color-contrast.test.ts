/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  getLuminance,
  getContrastRatio,
  getWCAGLevel,
  validateContrast,
  validateColorCombinations,
  formatValidationResult,
  isValidHex,
  WCAGLevel,
} from '../../../../src/tools/storefrontnext/site-theming/color-contrast.js';

describe('tools/storefrontnext/site-theming/color-contrast', () => {
  describe('getLuminance', () => {
    it('should return 0 for pure black', () => {
      expect(getLuminance('#000000')).to.equal(0);
      expect(getLuminance('000000')).to.equal(0);
    });

    it('should return 1 for pure white', () => {
      expect(getLuminance('#FFFFFF')).to.equal(1);
      expect(getLuminance('FFFFFF')).to.equal(1);
    });

    it('should return correct luminance for mid-gray', () => {
      const luminance = getLuminance('#808080');
      expect(luminance).to.be.greaterThan(0.2);
      expect(luminance).to.be.lessThan(0.6);
    });

    it('should handle hex with # prefix', () => {
      expect(getLuminance('#635BFF')).to.be.a('number');
      expect(getLuminance('#635BFF')).to.be.greaterThan(0);
      expect(getLuminance('#635BFF')).to.be.lessThan(1);
    });

    it('should throw for invalid hex format', () => {
      expect(() => getLuminance('#GG')).to.throw(/Invalid hex color/);
      expect(() => getLuminance('xyz')).to.throw(/Invalid hex color/);
      expect(() => getLuminance('#12345')).to.throw(/Invalid hex color/);
      expect(() => getLuminance('#1234567')).to.throw(/Invalid hex color/);
    });
  });

  describe('isValidHex', () => {
    it('should return true for valid 6-digit hex', () => {
      expect(isValidHex('#635BFF')).to.be.true;
      expect(isValidHex('635BFF')).to.be.true;
      expect(isValidHex('#000000')).to.be.true;
      expect(isValidHex('#FFFFFF')).to.be.true;
    });

    it('should return false for invalid hex', () => {
      expect(isValidHex('#GG')).to.be.false;
      expect(isValidHex('xyz')).to.be.false;
      expect(isValidHex('#12345')).to.be.false;
      expect(isValidHex('')).to.be.false;
    });
  });

  describe('getContrastRatio', () => {
    it('should return 21 for black on white', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF');
      expect(ratio).to.be.closeTo(21, 0.1);
    });

    it('should return 21 for white on black', () => {
      const ratio = getContrastRatio('#FFFFFF', '#000000');
      expect(ratio).to.be.closeTo(21, 0.1);
    });

    it('should return 1 for same color', () => {
      expect(getContrastRatio('#635BFF', '#635BFF')).to.equal(1);
    });

    it('should return same ratio regardless of order', () => {
      const r1 = getContrastRatio('#000000', '#FFFFFF');
      const r2 = getContrastRatio('#FFFFFF', '#000000');
      expect(r1).to.equal(r2);
    });
  });

  describe('getWCAGLevel', () => {
    describe('normal text', () => {
      it('should return AAA for ratio >= 7', () => {
        expect(getWCAGLevel(7)).to.equal(WCAGLevel.AAA);
        expect(getWCAGLevel(10)).to.equal(WCAGLevel.AAA);
      });

      it('should return AA for ratio >= 4.5 and < 7', () => {
        expect(getWCAGLevel(4.5)).to.equal(WCAGLevel.AA);
        expect(getWCAGLevel(5.5)).to.equal(WCAGLevel.AA);
      });

      it('should return FAIL for ratio < 4.5', () => {
        expect(getWCAGLevel(4.4)).to.equal(WCAGLevel.FAIL);
        expect(getWCAGLevel(2)).to.equal(WCAGLevel.FAIL);
      });
    });

    describe('large text', () => {
      it('should return AAA_LARGE for ratio >= 4.5', () => {
        expect(getWCAGLevel(4.5, true)).to.equal(WCAGLevel.AAA_LARGE);
        expect(getWCAGLevel(7, true)).to.equal(WCAGLevel.AAA_LARGE);
      });

      it('should return AA_LARGE for ratio >= 3 and < 4.5', () => {
        expect(getWCAGLevel(3, true)).to.equal(WCAGLevel.AA_LARGE);
        expect(getWCAGLevel(4, true)).to.equal(WCAGLevel.AA_LARGE);
      });

      it('should return FAIL for ratio < 3', () => {
        expect(getWCAGLevel(2.9, true)).to.equal(WCAGLevel.FAIL);
      });
    });
  });

  describe('validateContrast', () => {
    it('should return excellent for high contrast (black on white)', () => {
      const result = validateContrast('#000000', '#FFFFFF');
      expect(result.passesAA).to.be.true;
      expect(result.passesAAA).to.be.true;
      expect(result.visualAssessment).to.equal('excellent');
      expect(result.ratio).to.be.closeTo(21, 0.1);
      expect(result.wcagLevel).to.equal(WCAGLevel.AAA);
    });

    it('should return good for ratio between 5 and 7', () => {
      // #6B6B6B on white gives ~5.3:1 (good range, 5-7)
      const result = validateContrast('#6B6B6B', '#FFFFFF');
      expect(result.passesAA).to.be.true;
      expect(result.visualAssessment).to.equal('good');
    });

    it('should return acceptable for ratio at 4.5 threshold', () => {
      const result = validateContrast('#767676', '#FFFFFF');
      expect(result.passesAA).to.be.true;
      expect(result.visualAssessment).to.equal('acceptable');
      expect(result.recommendation).to.include('WCAG AA');
    });

    it('should return poor with recommendation for failing contrast', () => {
      const result = validateContrast('#CCCCCC', '#FFFFFF');
      expect(result.passesAA).to.be.false;
      expect(result.visualAssessment).to.equal('poor');
      expect(result.recommendation).to.include('WCAG AA');
    });

    it('should handle large text threshold', () => {
      // #888888 on white gives ~3.9:1 - AA_LARGE (3:1) but not AAA_LARGE (4.5:1)
      const result = validateContrast('#888888', '#FFFFFF', true);
      expect(result.isLargeText).to.be.true;
      expect(result.passesAA).to.be.true;
      expect(result.wcagLevel).to.equal(WCAGLevel.AA_LARGE);
    });

    it('should throw for invalid hex', () => {
      expect(() => validateContrast('#GG', '#FFFFFF')).to.throw(/Invalid hex color/);
      expect(() => validateContrast('#000000', 'xyz')).to.throw(/Invalid hex color/);
    });
  });

  describe('validateColorCombinations', () => {
    it('should validate multiple combinations', () => {
      const results = validateColorCombinations([
        {foreground: '#000000', background: '#FFFFFF', label: 'Black on white'},
        {foreground: '#FFFFFF', background: '#000000', label: 'White on black'},
      ]);

      expect(results).to.have.lengthOf(2);
      expect(results[0].label).to.equal('Black on white');
      expect(results[0].passesAA).to.be.true;
      expect(results[1].label).to.equal('White on black');
      expect(results[1].passesAA).to.be.true;
    });

    it('should pass isLargeText to validateContrast', () => {
      const results = validateColorCombinations([{foreground: '#767676', background: '#FFFFFF', isLargeText: true}]);

      expect(results[0].isLargeText).to.be.true;
      expect(results[0].passesAA).to.be.true;
    });

    it('should throw when combination contains invalid hex', () => {
      expect(() =>
        validateColorCombinations([
          {foreground: '#000000', background: '#FFFFFF'},
          {foreground: '#GG', background: '#FFFFFF'},
        ]),
      ).to.throw(/Invalid hex color/);
    });
  });

  describe('formatValidationResult', () => {
    it('should format passing result with label', () => {
      const result = {
        color1: '#000000',
        color2: '#FFFFFF',
        ratio: 21,
        wcagLevel: WCAGLevel.AAA,
        passesAA: true,
        passesAAA: true,
        isLargeText: false,
        visualAssessment: 'excellent' as const,
        label: 'Primary text',
      };

      const output = formatValidationResult(result);

      expect(output).to.include('Primary text:');
      expect(output).to.include('#000000 on #FFFFFF');
      expect(output).to.include('Contrast Ratio: 21.00:1');
      expect(output).to.include('WCAG normal text');
      expect(output).to.include('✅ AAA');
      expect(output).to.include('EXCELLENT');
    });

    it('should format result with recommendation when failing', () => {
      const result = {
        color1: '#CCCCCC',
        color2: '#FFFFFF',
        ratio: 1.6,
        wcagLevel: WCAGLevel.FAIL,
        passesAA: false,
        passesAAA: false,
        isLargeText: false,
        visualAssessment: 'poor' as const,
        recommendation: 'Does not meet WCAG AA standards.',
      };

      const output = formatValidationResult(result);

      expect(output).to.include('❌ FAIL');
      expect(output).to.include('POOR');
      expect(output).to.include('Does not meet WCAG AA standards.');
    });

    it('should format result without label when not provided', () => {
      const result = {
        color1: '#000000',
        color2: '#FFFFFF',
        ratio: 21,
        wcagLevel: WCAGLevel.AAA,
        passesAA: true,
        passesAAA: true,
        isLargeText: false,
        visualAssessment: 'excellent' as const,
      };

      const output = formatValidationResult(result);

      expect(output).to.not.match(/^[^:]+: #/);
      expect(output).to.include('#000000 on #FFFFFF');
    });

    it('should format AA (not AAA) result with WCAG AA status', () => {
      const result = {
        color1: '#6B6B6B',
        color2: '#FFFFFF',
        ratio: 5.3,
        wcagLevel: WCAGLevel.AA,
        passesAA: true,
        passesAAA: false,
        isLargeText: false,
        visualAssessment: 'good' as const,
      };

      const output = formatValidationResult(result);

      expect(output).to.include('✅ AA');
      expect(output).to.include('WCAG normal text');
    });

    it('should format large text result', () => {
      const result = {
        color1: '#888888',
        color2: '#FFFFFF',
        ratio: 3.9,
        wcagLevel: WCAGLevel.AA_LARGE,
        passesAA: true,
        passesAAA: false,
        isLargeText: true,
        visualAssessment: 'acceptable' as const,
      };

      const output = formatValidationResult(result);

      expect(output).to.include('WCAG large text');
      expect(output).to.include('✅ AA');
    });
  });
});
