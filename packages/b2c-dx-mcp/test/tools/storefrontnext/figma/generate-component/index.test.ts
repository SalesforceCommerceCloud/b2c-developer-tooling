/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  generateComponentRecommendation,
  type GenerateComponentInput,
} from '../../../../../src/tools/storefrontnext/figma/generate-component/index.js';
import {
  analyzeComponentDifferences,
  determineAction,
} from '../../../../../src/tools/storefrontnext/figma/generate-component/decision.js';

describe('generate-component', () => {
  describe('GenerateComponentTool', () => {
    it('returns CREATE when no similar components exist', () => {
      const mockInput: GenerateComponentInput = {
        figmaMetadata: JSON.stringify({name: 'UniqueComponent', type: 'COMPONENT', children: []}),
        figmaCode: `export default function UniqueComponent() { return <div className="flex p-4">Hello</div>; }`,
        componentName: 'UniqueComponent',
        discoveredComponents: [],
        workspacePath: '/tmp/nonexistent',
      };

      const result = generateComponentRecommendation(mockInput);

      expect(result).to.include('CREATE');
    });

    it('returns CREATE recommendation when given invalid JSON metadata', () => {
      const mockInput: GenerateComponentInput = {
        figmaMetadata: 'invalid json',
        figmaCode: '',
        componentName: '',
        discoveredComponents: [],
      };

      const result = generateComponentRecommendation(mockInput);

      expect(result).to.be.ok;
      expect(result).to.include('CREATE');
    });
  });

  describe('Decision Logic', () => {
    const mockComponent = {
      path: '/components/Button.tsx',
      name: 'Button',
      similarity: 85,
      matchType: 'name' as const,
      code: `export default function Button({ children }: { children: React.ReactNode }) {
            return <button className="bg-blue-500 text-white">{children}</button>;
        }`,
    };

    it('returns REUSE when differences are minimal', () => {
      const differences = {
        styling: [{description: 'New class: px-4', severity: 'minor' as const, isBackwardCompatible: true}],
        structural: [],
        behavioral: [],
        props: [],
      };

      const result = determineAction(mockComponent, differences);

      expect(result.action).to.equal('REUSE');
      expect(result.confidence).to.be.greaterThan(70);
    });

    it('returns EXTEND when differences are moderate', () => {
      const differences = {
        styling: [{description: 'New classes', severity: 'moderate' as const, isBackwardCompatible: true}],
        structural: [],
        behavioral: [{description: 'New hook: useState', severity: 'moderate' as const, isBackwardCompatible: true}],
        props: [],
      };

      const result = determineAction(mockComponent, differences);

      expect(result.action).to.equal('EXTEND');
      expect(result.extendStrategy).to.not.be.undefined;
    });

    it('returns CREATE when differences exceed threshold', () => {
      const differences = {
        styling: [{description: 'Many new classes', severity: 'major' as const, isBackwardCompatible: true}],
        structural: [{description: 'Different root', severity: 'major' as const, isBackwardCompatible: false}],
        behavioral: [{description: 'Client vs server', severity: 'major' as const, isBackwardCompatible: false}],
        props: [],
      };

      const result = determineAction(mockComponent, differences);

      expect(result.action).to.equal('CREATE');
    });

    it('returns CREATE when breaking changes exceed limit', () => {
      const differences = {
        styling: [],
        structural: [
          {description: 'Breaking 1', severity: 'moderate' as const, isBackwardCompatible: false},
          {description: 'Breaking 2', severity: 'moderate' as const, isBackwardCompatible: false},
          {description: 'Breaking 3', severity: 'moderate' as const, isBackwardCompatible: false},
        ],
        behavioral: [],
        props: [],
      };

      const result = determineAction(mockComponent, differences);

      expect(result.action).to.equal('CREATE');
    });
  });

  describe('Difference Detection', () => {
    it('detects new Tailwind classes as styling difference', () => {
      const existing = `<div className="flex">Content</div>`;
      const figma = `<div className="flex p-4 bg-red-500">Content</div>`;

      const differences = analyzeComponentDifferences(
        {path: '', name: '', similarity: 100, matchType: 'name', code: existing},
        figma,
        '{}',
      );

      expect(differences.styling.length).to.be.greaterThan(0);
      expect(differences.styling[0].description).to.include('Tailwind classes');
    });

    it('detects inline styles as moderate severity', () => {
      const existing = `<div className="flex">Content</div>`;
      const figma = `<div style={{ color: 'red' }}>Content</div>`;

      const differences = analyzeComponentDifferences(
        {path: '', name: '', similarity: 100, matchType: 'name', code: existing},
        figma,
        '{}',
      );

      expect(differences.styling.some((d) => d.description.includes('inline styles'))).to.equal(true);
      expect(differences.styling.some((d) => d.severity === 'moderate')).to.equal(true);
    });

    it('detects different root element as structural difference', () => {
      const existing = `<div>Content</div>`;
      const figma = `<button>Content</button>`;

      const differences = analyzeComponentDifferences(
        {path: '', name: '', similarity: 100, matchType: 'name', code: existing},
        figma,
        '{}',
      );

      expect(differences.structural.some((d) => d.description.includes('Different root element'))).to.equal(true);
      expect(differences.structural.some((d) => !d.isBackwardCompatible)).to.equal(true);
    });

    it('detects client directive change as behavioral difference', () => {
      const existing = `export default function Component() { return <div>Hello</div>; }`;
      const figma = `'use client'; export default function Component() { return <div>Hello</div>; }`;

      const differences = analyzeComponentDifferences(
        {path: '', name: '', similarity: 100, matchType: 'name', code: existing},
        figma,
        '{}',
      );

      expect(differences.behavioral.some((d) => d.description.includes('client-side rendering'))).to.equal(true);
      expect(differences.behavioral.some((d) => d.severity === 'major')).to.equal(true);
    });

    it('detects new React hooks as behavioral difference', () => {
      const existing = `export default function Component() { return <div>Hello</div>; }`;
      const figma = `export default function Component() { const [state, setState] = useState(); return <div>Hello</div>; }`;

      const differences = analyzeComponentDifferences(
        {path: '', name: '', similarity: 100, matchType: 'name', code: existing},
        figma,
        '{}',
      );

      expect(differences.behavioral.some((d) => d.description.includes('useState'))).to.equal(true);
    });

    it('detects when existing component is client-side but Figma design could be RSC', () => {
      const existing = `'use client'; export default function Component() { return <div>Hello</div>; }`;
      const figma = `export default function Component() { return <div>Hello</div>; }`;

      const differences = analyzeComponentDifferences(
        {path: '', name: '', similarity: 100, matchType: 'name', code: existing},
        figma,
        '{}',
      );

      expect(differences.behavioral.some((d) => d.description.includes('could be RSC'))).to.equal(true);
      expect(differences.behavioral.some((d) => d.severity === 'major')).to.equal(true);
    });

    it('detects new event handlers as behavioral difference', () => {
      const existing = `<div>Content</div>`;
      const figma = `<button onClick={handleClick}>Content</button>`;

      const differences = analyzeComponentDifferences(
        {path: '', name: '', similarity: 100, matchType: 'name', code: existing},
        figma,
        '{}',
      );

      expect(differences.behavioral.some((d) => d.description.includes('event handlers'))).to.equal(true);
      expect(differences.behavioral.some((d) => d.severity === 'moderate')).to.equal(true);
    });

    it('detects when Figma design requires additional prop interfaces', () => {
      const existing = `interface ButtonProps { label: string; }`;
      const figma = `interface ButtonProps { label: string; } interface IconProps { name: string; }`;

      const differences = analyzeComponentDifferences(
        {path: '', name: '', similarity: 100, matchType: 'name', code: existing},
        figma,
        '{}',
      );

      expect(differences.props.some((d) => d.description.includes('additional props'))).to.equal(true);
      expect(differences.props.some((d) => d.isBackwardCompatible)).to.equal(true);
    });
  });

  describe('Strategy Selection', () => {
    const mockComponent = {
      path: '/components/Button.tsx',
      name: 'Button',
      similarity: 85,
      matchType: 'name' as const,
      code: `export default function Button() { return <button>Click</button>; }`,
    };

    it('selects props strategy for backward compatible changes', () => {
      const differences = {
        styling: [],
        structural: [],
        behavioral: [{description: 'New hook', severity: 'minor' as const, isBackwardCompatible: true}],
        props: [
          {description: 'New optional prop', severity: 'minor' as const, isBackwardCompatible: true},
          {description: 'Another prop', severity: 'minor' as const, isBackwardCompatible: true},
        ],
      };

      const result = determineAction(mockComponent, differences);

      expect(result.action).to.equal('EXTEND');
      expect(result.extendStrategy).to.equal('props');
    });

    it('selects variant strategy for styling-focused changes', () => {
      const differences = {
        styling: [{description: 'Many new classes', severity: 'moderate' as const, isBackwardCompatible: true}],
        structural: [],
        behavioral: [],
        props: [
          {description: 'Prop 1', severity: 'minor' as const, isBackwardCompatible: true},
          {description: 'Prop 2', severity: 'minor' as const, isBackwardCompatible: true},
          {description: 'Prop 3', severity: 'minor' as const, isBackwardCompatible: true},
          {description: 'Prop 4', severity: 'minor' as const, isBackwardCompatible: true},
        ],
      };

      const result = determineAction(mockComponent, differences);

      expect(result.action).to.equal('EXTEND');
      expect(result.extendStrategy).to.equal('variant');
    });

    it('selects composition strategy for structural changes', () => {
      const differences = {
        styling: [],
        structural: [{description: 'New nested elements', severity: 'moderate' as const, isBackwardCompatible: true}],
        behavioral: [],
        props: [],
      };

      const result = determineAction(mockComponent, differences);

      expect(result.action).to.equal('EXTEND');
      expect(result.extendStrategy).to.equal('composition');
    });

    it('selects composition for non-backward compatible behavioral changes', () => {
      const differences = {
        styling: [],
        structural: [],
        behavioral: [{description: 'Breaking change', severity: 'moderate' as const, isBackwardCompatible: false}],
        props: [],
      };

      const result = determineAction(mockComponent, differences);

      expect(result.action).to.equal('EXTEND');
      expect(result.extendStrategy).to.equal('composition');
    });
  });
});
