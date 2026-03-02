/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {mergeGuidance} from '../../../../src/tools/storefrontnext/site-theming/guidance-merger.js';
import type {ThemingGuidance} from '../../../../src/tools/storefrontnext/site-theming/theming-store.js';

function createGuidance(overrides: Partial<ThemingGuidance> = {}): ThemingGuidance {
  return {
    questions: [],
    guidelines: [],
    rules: [],
    metadata: {filePath: '', fileName: '', loadedAt: new Date()},
    ...overrides,
  };
}

describe('tools/storefrontnext/site-theming/guidance-merger', () => {
  it('should throw when merging empty array', () => {
    expect(() => mergeGuidance([])).to.throw('Cannot merge empty guidance array');
  });

  it('should return single item unchanged', () => {
    const g = createGuidance({questions: [{id: 'q1', question: 'Q?', category: 'colors', required: true}]});
    expect(mergeGuidance([g])).to.equal(g);
  });

  it('should merge workflows and use extractionInstructions from second when first lacks it', () => {
    const g1 = createGuidance({
      workflow: {steps: ['Step 1'], extractionInstructions: undefined, preImplementationChecklist: undefined},
    });
    const g2 = createGuidance({
      workflow: {
        steps: ['Step 2'],
        extractionInstructions: 'Extract colors and fonts.',
        preImplementationChecklist: 'Check all items.',
      },
    });
    const merged = mergeGuidance([g1, g2]);
    expect(merged.workflow?.extractionInstructions).to.equal('Extract colors and fonts.');
    expect(merged.workflow?.preImplementationChecklist).to.equal('Check all items.');
    expect(merged.workflow?.steps).to.deep.equal(['Step 1', 'Step 2']);
  });

  it('should merge validations from multiple guidance objects', () => {
    const g1 = createGuidance({
      validation: {
        colorValidation: 'Check colors.',
        fontValidation: undefined,
        generalValidation: undefined,
        requirements: undefined,
      },
    });
    const g2 = createGuidance({
      validation: {
        colorValidation: undefined,
        fontValidation: 'Check fonts.',
        generalValidation: 'Check general.',
        requirements: 'Important.',
      },
    });
    const merged = mergeGuidance([g1, g2]);
    expect(merged.validation?.colorValidation).to.include('Check colors.');
    expect(merged.validation?.fontValidation).to.include('Check fonts.');
    expect(merged.validation?.generalValidation).to.include('Check general.');
    expect(merged.validation?.requirements).to.include('Important.');
  });

  it('should deduplicate questions by id', () => {
    const g1 = createGuidance({
      questions: [{id: 'q1', question: 'First?', category: 'colors', required: true}],
    });
    const g2 = createGuidance({
      questions: [{id: 'q1', question: 'Override?', category: 'colors', required: false}],
    });
    const merged = mergeGuidance([g1, g2]);
    expect(merged.questions).to.have.lengthOf(1);
    expect(merged.questions[0].question).to.equal('First?');
  });

  it('should concatenate guidelines and rules', () => {
    const g1 = createGuidance({
      guidelines: [{category: 'c1', title: 'T1', content: 'C1', critical: true}],
      rules: [{type: 'do', description: 'Do X'}],
    });
    const g2 = createGuidance({
      guidelines: [{category: 'c2', title: 'T2', content: 'C2', critical: false}],
      rules: [{type: 'dont', description: "Don't Y"}],
    });
    const merged = mergeGuidance([g1, g2]);
    expect(merged.guidelines).to.have.lengthOf(2);
    expect(merged.rules).to.have.lengthOf(2);
  });
});
