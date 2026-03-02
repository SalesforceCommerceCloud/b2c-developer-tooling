/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {formatRecommendation} from '../../../../../src/tools/storefrontnext/figma/generate-component/formatter.js';
import type {
  ComponentAnalysisResult,
  GenerateComponentInput,
} from '../../../../../src/tools/storefrontnext/figma/generate-component/index.js';

const baseInput: GenerateComponentInput = {
  figmaMetadata: '{}',
  figmaCode: '<div>Hello</div>',
  componentName: 'TestComponent',
  discoveredComponents: [],
};

const matchedComponent = {
  path: '/src/components/ui/Button/index.tsx',
  name: 'Button',
  similarity: 85,
};

describe('formatter', () => {
  describe('formatRecommendation', () => {
    it('includes decision and confidence in output', () => {
      const analysis: ComponentAnalysisResult = {
        action: 'CREATE',
        confidence: 95,
        recommendation: 'Create a new component.',
      };

      const result = formatRecommendation(analysis, baseInput);

      expect(result).to.include('**Decision:** CREATE');
      expect(result).to.include('**Confidence:** 95%');
    });

    it('includes matched component details when present', () => {
      const analysis: ComponentAnalysisResult = {
        action: 'REUSE',
        confidence: 90,
        recommendation: 'Reuse existing component.',
        matchedComponent,
      };

      const result = formatRecommendation(analysis, baseInput);

      expect(result).to.include('**Matched Component:**');
      expect(result).to.include('`Button`');
      expect(result).to.include('`/src/components/ui/Button/index.tsx`');
      expect(result).to.include('Similarity: 85%');
    });

    it('omits matched component section when absent', () => {
      const analysis: ComponentAnalysisResult = {
        action: 'CREATE',
        confidence: 95,
        recommendation: 'No similar components found.',
      };

      const result = formatRecommendation(analysis, baseInput);

      expect(result).to.not.include('**Matched Component:**');
    });

    it('formats numbered differences list when present', () => {
      const analysis: ComponentAnalysisResult = {
        action: 'EXTEND',
        confidence: 80,
        recommendation: 'Extend the component.',
        matchedComponent,
        differences: ['New Tailwind classes', 'Different root element', 'New hook: useState'],
        extendStrategy: 'composition',
      };

      const result = formatRecommendation(analysis, baseInput);

      expect(result).to.include('**Key Differences:**');
      expect(result).to.include('1. New Tailwind classes');
      expect(result).to.include('2. Different root element');
      expect(result).to.include('3. New hook: useState');
    });

    it('omits differences section when array is empty', () => {
      const analysis: ComponentAnalysisResult = {
        action: 'CREATE',
        confidence: 95,
        recommendation: 'Create new.',
        differences: [],
      };

      const result = formatRecommendation(analysis, baseInput);

      expect(result).to.not.include('**Key Differences:**');
    });

    it('includes suggested approach when present', () => {
      const analysis: ComponentAnalysisResult = {
        action: 'CREATE',
        confidence: 95,
        recommendation: 'Create new.',
        suggestedApproach: 'Follow StorefrontNext patterns.',
      };

      const result = formatRecommendation(analysis, baseInput);

      expect(result).to.include('## Suggested Approach');
      expect(result).to.include('Follow StorefrontNext patterns.');
    });
  });

  describe('formatNextSteps - CREATE', () => {
    it('includes component name and file location', () => {
      const analysis: ComponentAnalysisResult = {
        action: 'CREATE',
        confidence: 95,
        recommendation: 'Create new component.',
      };

      const result = formatRecommendation(analysis, baseInput);

      expect(result).to.include('## Next Steps');
      expect(result).to.include('Create new component: `TestComponent`');
      expect(result).to.not.include('/src/components/ui/TestComponent/index.tsx');
      expect(result).to.include('Create component file structure');
    });

    it('references matched component for patterns when present', () => {
      const analysis: ComponentAnalysisResult = {
        action: 'CREATE',
        confidence: 70,
        recommendation: 'Create new but reference existing.',
        matchedComponent,
      };

      const result = formatRecommendation(analysis, baseInput);

      expect(result).to.include('Reference patterns from `/src/components/ui/Button/index.tsx`');
    });

    it('omits pattern reference when no matched component', () => {
      const analysis: ComponentAnalysisResult = {
        action: 'CREATE',
        confidence: 95,
        recommendation: 'Create new.',
      };

      const result = formatRecommendation(analysis, baseInput);

      expect(result).to.not.include('Reference patterns from');
    });
  });

  describe('formatNextSteps - EXTEND', () => {
    it('formats props strategy steps', () => {
      const analysis: ComponentAnalysisResult = {
        action: 'EXTEND',
        confidence: 85,
        recommendation: 'Extend with new props.',
        matchedComponent,
        extendStrategy: 'props',
      };

      const result = formatRecommendation(analysis, baseInput);

      expect(result).to.include('**Strategy:** Add new props');
      expect(result).to.include('Add new optional props to the interface');
      expect(result).to.include('backward compatibility');
    });

    it('formats variant strategy steps', () => {
      const analysis: ComponentAnalysisResult = {
        action: 'EXTEND',
        confidence: 80,
        recommendation: 'Add variant.',
        matchedComponent,
        extendStrategy: 'variant',
      };

      const result = formatRecommendation(analysis, baseInput);

      expect(result).to.include('**Strategy:** Add variant');
      expect(result).to.include('Add new variant to existing variant definitions');
      expect(result).to.include('variant styling using theme tokens');
    });

    it('formats composition strategy steps', () => {
      const analysis: ComponentAnalysisResult = {
        action: 'EXTEND',
        confidence: 75,
        recommendation: 'Compose wrapper.',
        matchedComponent,
        extendStrategy: 'composition',
      };

      const result = formatRecommendation(analysis, baseInput);

      expect(result).to.include('**Strategy:** Composition');
      expect(result).to.include('Create wrapper component that composes the base component');
    });

    it('defaults to props strategy when extendStrategy is undefined', () => {
      const analysis: ComponentAnalysisResult = {
        action: 'EXTEND',
        confidence: 80,
        recommendation: 'Extend component.',
        matchedComponent,
      };

      const result = formatRecommendation(analysis, baseInput);

      expect(result).to.include('**Strategy:** Add new props');
    });

    it('includes validate step for all strategies', () => {
      const analysis: ComponentAnalysisResult = {
        action: 'EXTEND',
        confidence: 80,
        recommendation: 'Extend.',
        matchedComponent,
        extendStrategy: 'variant',
      };

      const result = formatRecommendation(analysis, baseInput);

      expect(result).to.include('Validate: ensure existing usages still work');
    });
  });

  describe('formatNextSteps - REUSE', () => {
    it('includes import instruction with component name and path', () => {
      const analysis: ComponentAnalysisResult = {
        action: 'REUSE',
        confidence: 92,
        recommendation: 'Reuse existing component directly.',
        matchedComponent,
      };

      const result = formatRecommendation(analysis, baseInput);

      expect(result).to.include('Import and use `Button`');
      expect(result).to.include('from `/src/components/ui/Button/index.tsx`');
      expect(result).to.include('Customize through props and Tailwind classes');
    });
  });

  describe('common output', () => {
    it('always includes confirmation prompt', () => {
      for (const action of ['CREATE', 'EXTEND', 'REUSE'] as const) {
        const analysis: ComponentAnalysisResult = {
          action,
          confidence: 80,
          recommendation: 'Test.',
          matchedComponent: action === 'CREATE' ? undefined : matchedComponent,
          extendStrategy: action === 'EXTEND' ? 'props' : undefined,
        };

        const result = formatRecommendation(analysis, baseInput);

        expect(result).to.include('**Confirm before proceeding with implementation.**');
      }
    });
  });
});
