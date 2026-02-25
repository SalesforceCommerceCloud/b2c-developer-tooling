/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {SimilarComponent, ComponentAnalysisResult} from './index.js';

/**
 * Categorized differences between a matched component and Figma design
 * @property styling - Visual differences (Tailwind classes, inline styles, theme tokens)
 * @property structural - JSX hierarchy differences (elements, nesting, root element changes)
 * @property behavioral - Interaction differences (hooks, event handlers, client/server rendering)
 * @property props - Interface/prop definition differences (new props, type changes)
 */
export interface ComponentDifferences {
  styling: DifferenceDetail[];
  structural: DifferenceDetail[];
  behavioral: DifferenceDetail[];
  props: DifferenceDetail[];
}

/**
 * Details about a specific difference between components
 * @property description - Explanation of the difference
 * @property severity - Impact level: 'minor' (1pt), 'moderate' (3pts), 'major' (5pts)
 * @property isBackwardCompatible - Whether existing code using the component would still work after this change
 */
export interface DifferenceDetail {
  description: string;
  severity: 'major' | 'minor' | 'moderate';
  isBackwardCompatible: boolean;
}

/**
 * Analyzes differences between matched component and Figma design.
 *
 * @param figmaMetadata - Reserved for future use (e.g., component hierarchy analysis).
 *   Currently unused but kept in the signature to avoid a breaking change once metadata
 *   analysis is implemented.
 */
export function analyzeComponentDifferences(
  matchedComponent: SimilarComponent,
  figmaCode: string,
  _figmaMetadata: string,
): ComponentDifferences {
  const differences: ComponentDifferences = {
    styling: [],
    structural: [],
    behavioral: [],
    props: [],
  };

  // Analyze styling differences
  differences.styling = analyzeStylingDifferences(matchedComponent.code, figmaCode);

  // Analyze structural differences
  differences.structural = analyzeStructuralDifferences(matchedComponent.code, figmaCode);

  // Analyze behavioral differences (hooks, state, effects)
  differences.behavioral = analyzeBehavioralDifferences(matchedComponent.code, figmaCode);

  // Analyze prop differences
  differences.props = analyzePropDifferences(matchedComponent.code, figmaCode);

  return differences;
}

/**
 * Analyzes styling differences (Tailwind classes, CSS, theme tokens)
 */
function analyzeStylingDifferences(existingCode: string, figmaCode: string): DifferenceDetail[] {
  const differences: DifferenceDetail[] = [];

  // Extract className usage
  const existingClasses = extractTailwindClasses(existingCode);
  const figmaClasses = extractTailwindClasses(figmaCode);

  // Check for new classes in Figma design
  const newClasses = figmaClasses.filter((c) => !existingClasses.includes(c));

  if (newClasses.length > 0) {
    differences.push({
      description: `New Tailwind classes: ${newClasses.slice(0, 5).join(', ')}${newClasses.length > 5 ? '...' : ''}`,
      severity: newClasses.length > 10 ? 'major' : newClasses.length > 3 ? 'moderate' : 'minor',
      isBackwardCompatible: true,
    });
  }

  // Check for inline styles (anti-pattern)
  if (figmaCode.includes('style={{') || figmaCode.includes('style="')) {
    differences.push({
      description: 'Figma code contains inline styles (needs conversion to Tailwind)',
      severity: 'moderate',
      isBackwardCompatible: true,
    });
  }

  return differences;
}

/**
 * Analyzes structural differences (JSX hierarchy, elements)
 */
function analyzeStructuralDifferences(existingCode: string, figmaCode: string): DifferenceDetail[] {
  const differences: DifferenceDetail[] = [];

  // Extract JSX elements
  const existingElements = extractJSXElements(existingCode);
  const figmaElements = extractJSXElements(figmaCode);

  // Check for different root elements
  if (existingElements[0] !== figmaElements[0]) {
    differences.push({
      description: `Different root element: ${existingElements[0]} vs ${figmaElements[0]}`,
      severity: 'moderate',
      isBackwardCompatible: false,
    });
  }

  // Check for additional nested elements
  const newElements = figmaElements.filter((e) => !existingElements.includes(e));
  if (newElements.length > 0) {
    differences.push({
      description: `New elements in Figma design: ${newElements.join(', ')}`,
      severity: newElements.length > 3 ? 'major' : 'minor',
      isBackwardCompatible: true,
    });
  }

  return differences;
}

/**
 * Analyzes behavioral differences (hooks, state, effects, event handlers)
 */
function analyzeBehavioralDifferences(existingCode: string, figmaCode: string): DifferenceDetail[] {
  const differences: DifferenceDetail[] = [];

  // Check for 'use client' directive
  const existingIsClient = existingCode.includes("'use client'") || existingCode.includes('"use client"');
  const figmaIsClient = figmaCode.includes("'use client'") || figmaCode.includes('"use client"');

  if (existingIsClient !== figmaIsClient) {
    differences.push({
      description: figmaIsClient
        ? 'Figma design requires client-side rendering'
        : 'Existing component is client-side, Figma design could be RSC',
      severity: 'major',
      isBackwardCompatible: false,
    });
  }

  // Check for new hooks
  const existingHooks = extractHooks(existingCode);
  const figmaHooks = extractHooks(figmaCode);
  const newHooks = figmaHooks.filter((h) => !existingHooks.includes(h));

  if (newHooks.length > 0) {
    differences.push({
      description: `New React hooks needed: ${newHooks.join(', ')}`,
      severity: 'moderate',
      isBackwardCompatible: newHooks.every((h) => h.startsWith('use')),
    });
  }

  // Check for event handlers
  const existingHasHandlers = /on[A-Z]\w+=/g.test(existingCode);
  const figmaHasHandlers = /on[A-Z]\w+=/g.test(figmaCode);

  if (!existingHasHandlers && figmaHasHandlers) {
    differences.push({
      description: 'Figma design includes event handlers (onClick, onChange, etc.)',
      severity: 'moderate',
      isBackwardCompatible: true,
    });
  }

  return differences;
}

/**
 * Analyzes prop differences
 * parses TypeScript interfaces to compare prop definitions
 */
function analyzePropDifferences(existingCode: string, figmaCode: string): DifferenceDetail[] {
  const differences: DifferenceDetail[] = [];

  const existingPropCount = (existingCode.match(/interface\s+\w+Props/g) || []).length;
  const figmaPropCount = (figmaCode.match(/interface\s+\w+Props/g) || []).length;

  if (figmaPropCount > existingPropCount) {
    differences.push({
      description: 'Figma design may require additional props',
      severity: 'minor',
      isBackwardCompatible: true,
    });
  }

  return differences;
}

/**
 * Extracts Tailwind classes from code
 */
function extractTailwindClasses(code: string): string[] {
  const classRegex = /className=["']([^"']+)["']/g;
  const classes: Set<string> = new Set();
  let match;

  while ((match = classRegex.exec(code)) !== null) {
    const classList = match[1].split(/\s+/);
    for (const c of classList) classes.add(c);
  }

  return [...classes];
}

/**
 * Extracts JSX elements from code (simplified)
 */
function extractJSXElements(code: string): string[] {
  // Simple regex to find JSX opening tags
  const elementRegex = /<([A-Z][a-zA-Z0-9]*|[a-z]+)[\s>]/g;
  const elements: Set<string> = new Set();
  let match;

  while ((match = elementRegex.exec(code)) !== null) {
    elements.add(match[1]);
  }

  return [...elements];
}

/**
 * Extracts React hooks from code
 */
function extractHooks(code: string): string[] {
  const hookRegex = /\b(use[A-Z]\w+)\(/g;
  const hooks: Set<string> = new Set();
  let match;

  while ((match = hookRegex.exec(code)) !== null) {
    hooks.add(match[1]);
  }

  return [...hooks];
}

/**
 * Determines the appropriate action based on differences
 * Uses type of difference + impact assessment
 */
export function determineAction(
  matchedComponent: SimilarComponent,
  differences: ComponentDifferences,
): ComponentAnalysisResult {
  const allDifferences = [
    ...differences.styling,
    ...differences.structural,
    ...differences.behavioral,
    ...differences.props,
  ];

  const severityScores = {minor: 1, moderate: 3, major: 5} as const;
  let differenceScore = 0;
  for (const diff of allDifferences) {
    differenceScore += severityScores[diff.severity];
  }

  // Count breaking changes
  const breakingChanges = allDifferences.filter((d) => !d.isBackwardCompatible).length;

  // Decision thresholds
  const REUSE_THRESHOLD = 2; // Only minor styling differences
  const EXTEND_THRESHOLD = 10; // Moderate differences that can be added

  // REUSE: Minimal differences, mostly styling
  if (differenceScore <= REUSE_THRESHOLD && breakingChanges === 0) {
    return {
      action: 'REUSE',
      confidence: Math.round(matchedComponent.similarity),
      matchedComponent: {
        path: matchedComponent.path,
        name: matchedComponent.name,
        similarity: matchedComponent.similarity,
      },
      differences: allDifferences.map((d) => d.description),
      recommendation: `The existing component "${matchedComponent.name}" can be reused with different props or minor styling adjustments.`,
      suggestedApproach: `Use the existing component at ${matchedComponent.path} and customize it through props.`,
    };
  }

  // CREATE: Major structural or behavioral differences, or many breaking changes
  if (differenceScore > EXTEND_THRESHOLD || breakingChanges > 2) {
    return {
      action: 'CREATE',
      confidence: 85,
      matchedComponent: {
        path: matchedComponent.path,
        name: matchedComponent.name,
        similarity: matchedComponent.similarity,
      },
      differences: allDifferences.map((d) => d.description),
      recommendation: `Differences are significant enough to warrant creating a new component.`,
      suggestedApproach: `Create a new component. You may reference patterns from ${matchedComponent.path} but build a new component.`,
    };
  }

  // EXTEND: Moderate differences that can be added
  // Determine extend strategy: props / variant / composition
  const extendStrategy = determineExtendStrategy(differences, allDifferences);

  return {
    action: 'EXTEND',
    confidence: Math.round((matchedComponent.similarity + 100 - differenceScore * 2) / 2),
    matchedComponent: {
      path: matchedComponent.path,
      name: matchedComponent.name,
      similarity: matchedComponent.similarity,
    },
    differences: allDifferences.map((d) => d.description),
    recommendation: `The existing component "${matchedComponent.name}" can be extended to support the Figma design.`,
    suggestedApproach: generateExtendApproach(extendStrategy, matchedComponent, differences),
    extendStrategy,
  };
}

/**
 * Determines the best extend strategy based on differences
 * Context-dependent: checks type of difference then validates with impact
 */
function determineExtendStrategy(
  differences: ComponentDifferences,
  allDifferences: DifferenceDetail[],
): 'composition' | 'props' | 'variant' {
  // Props extension: Only new optional behaviors (1-3 new props, backward compatible)
  if (
    differences.props.length <= 3 &&
    differences.structural.length === 0 &&
    differences.behavioral.length <= 1 &&
    allDifferences.every((d) => d.isBackwardCompatible)
  ) {
    return 'props';
  }

  // Composition: Structural changes or new child components
  if (differences.structural.length > 0 || differences.behavioral.some((d) => !d.isBackwardCompatible)) {
    return 'composition';
  }

  // Variant pattern: Visual variations (styling focused, 4+ new classes)
  if (differences.styling.some((d) => d.severity !== 'minor')) {
    return 'variant';
  }

  // Default to props for small changes
  return 'props';
}

/**
 * Generates extend approach description based on strategy
 */
function generateExtendApproach(
  strategy: 'composition' | 'props' | 'variant',
  matchedComponent: SimilarComponent,
  differences: ComponentDifferences,
): string {
  const componentPath = matchedComponent.path;
  const componentName = matchedComponent.name;

  switch (strategy) {
    case 'composition': {
      return `**Composition Pattern**
Create a new component that wraps/composes the existing one:
1. Create new component: ${componentName}Enhanced.tsx
2. Import and compose: <${componentName}>{/* new elements */}</${componentName}>
3. Structural changes: ${differences.structural.map((d) => d.description).join(', ')}
4. This preserves the existing component while adding new behavior

This approach works because there are structural changes that would break existing usage if added directly.`;
    }

    case 'props': {
      return `**Props Extension Pattern**
Extend the existing component by adding new optional props:
1. Modify ${componentPath}
2. Add new props to the interface (${differences.props.map((d) => d.description).join(', ')})
3. Implement the new prop behavior while maintaining backward compatibility
4. Ensure existing usage is not affected

This approach works because the changes are small and backward compatible.`;
    }

    case 'variant': {
      return `**Variant Pattern**
Add new visual variants to the existing component:
1. Modify ${componentPath}
2. Add variant definitions using your variant system (e.g., CVA)
3. New styling: ${differences.styling.map((d) => d.description).join(', ')}
4. Extend the component's visual options without breaking existing usage

This approach works because the changes are primarily styling-focused.`;
    }
  }
}
