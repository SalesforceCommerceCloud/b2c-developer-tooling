/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  generateResponse,
  getRelevantQuestions,
  hasProvidedThemingInfo,
} from '../../../../src/tools/storefrontnext/site-theming/response-builder.js';
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

describe('tools/storefrontnext/site-theming/response-builder', () => {
  describe('hasProvidedThemingInfo', () => {
    it('should return false when no context', () => {
      expect(hasProvidedThemingInfo(undefined)).to.be.false;
    });

    it('should return true when colors array provided', () => {
      expect(hasProvidedThemingInfo({collectedAnswers: {colors: [{hex: '#000'}]}})).to.be.true;
    });

    it('should return true when fonts array provided', () => {
      expect(hasProvidedThemingInfo({collectedAnswers: {fonts: [{name: 'Arial'}]}})).to.be.true;
    });
  });

  describe('getRelevantQuestions', () => {
    it('should filter component scope questions', () => {
      const g = createGuidance({
        questions: [
          {id: 'q1', question: 'Which components?', category: 'general', required: false},
          {id: 'q2', question: 'What colors?', category: 'colors', required: true},
        ],
      });
      const qs = getRelevantQuestions(g);
      expect(qs).to.have.lengthOf(1);
      expect(qs[0].question).to.equal('What colors?');
    });

    it('should sort required before optional', () => {
      const g = createGuidance({
        questions: [
          {id: 'q1', question: 'Optional?', category: 'general', required: false},
          {id: 'q2', question: 'Required?', category: 'colors', required: true},
        ],
      });
      const qs = getRelevantQuestions(g);
      expect(qs[0].required).to.be.true;
    });

    it('should exclude already-asked questions', () => {
      const g = createGuidance({
        questions: [
          {id: 'q1', question: 'Q1?', category: 'colors', required: true},
          {id: 'q2', question: 'Q2?', category: 'colors', required: false},
        ],
      });
      const qs = getRelevantQuestions(g, {questionsAsked: ['q1']});
      expect(qs).to.have.lengthOf(1);
      expect(qs[0].id).to.equal('q2');
    });

    it('should add follow-up questions when answer provided', () => {
      const g = createGuidance({
        questions: [
          {
            id: 'q1',
            question: 'Q1?',
            category: 'colors',
            required: false,
            followUpQuestions: ['Follow-up 1?', 'Follow-up 2?'],
          },
          {id: 'q2', question: 'Q2?', category: 'colors', required: true},
        ],
      });
      // q2 asked first; q1 in remaining with proactive answer triggers follow-ups
      const qs = getRelevantQuestions(g, {
        questionsAsked: ['q2'],
        collectedAnswers: {q1: 'yes'},
      });
      expect(qs.some((q) => q.question === 'Follow-up 1?')).to.be.true;
    });
  });

  describe('generateResponse', () => {
    it('should return extraction response on first call with no theming info', () => {
      const g = createGuidance({
        workflow: {steps: [], extractionInstructions: 'Extract colors and fonts from user input.'},
      });
      const result = generateResponse(g, {collectedAnswers: {}});
      expect(result).to.include('Extract User-Provided Theming Information');
      expect(result).to.include('Extract colors and fonts from user input.');
      expect(result).to.include('USER-FACING RESPONSE');
    });

    it('should show ready to implement when all required questions answered', () => {
      const g = createGuidance({
        questions: [{id: 'q1', question: 'Colors?', category: 'colors', required: true}],
        workflow: {steps: [], preImplementationChecklist: '- Item 1\n- Item 2'},
      });
      const result = generateResponse(g, {
        collectedAnswers: {q1: '#000000', colors: [{hex: '#000000'}], colorMapping: {text: '#000000', bg: '#FFFFFF'}},
        questionsAsked: ['q1'],
      });
      expect(result).to.include('Ready to Implement');
      expect(result).to.include('MANDATORY PRE-IMPLEMENTATION CHECKLIST');
      expect(result).to.include('Item 1');
    });

    it('should show warning when required questions not all answered', () => {
      const g = createGuidance({
        questions: [{id: 'q1', question: 'Colors?', category: 'colors', required: true}],
      });
      const result = generateResponse(g, {
        collectedAnswers: {colors: [{hex: '#000000'}]},
        questionsAsked: ['q1'],
      });
      expect(result).to.include('WARNING');
      expect(result).to.include('Not all required questions have been answered');
      expect(result).to.include('still need answers');
    });

    it('should use empty info when context has no collectedAnswers', () => {
      const g = createGuidance({
        questions: [{id: 'q1', question: 'Colors?', category: 'colors', required: false}],
      });
      const result = generateResponse(g, {questionsAsked: ['q1']});
      expect(result).to.include('USER-FACING RESPONSE');
      expect(result).not.to.include("Information You've Provided");
    });

    it('should show empty workflow message when colors and fonts arrays are empty', () => {
      const g = createGuidance({
        questions: [{id: 'q1', question: 'Colors?', category: 'colors', required: false}],
      });
      const result = generateResponse(g, {
        collectedAnswers: {colors: [], fonts: []},
        questionsAsked: [],
      });
      expect(result).to.include('Following the theming workflow');
      expect(result).to.include('I need a few clarifications before implementing');
    });

    it('should include otherInfo from non-color non-font keys', () => {
      const g = createGuidance({
        questions: [{id: 'q1', question: 'Colors?', category: 'colors', required: false}],
      });
      const result = generateResponse(g, {
        collectedAnswers: {colors: [], spacing: {desktop: 8}, brand: 'acme'},
        questionsAsked: [],
      });
      expect(result).to.include('Other Information');
      expect(result).to.include('spacing:');
      expect(result).to.include('brand: acme');
    });

    it('should handle color-like keys with hex undefined without error', () => {
      const g = createGuidance({
        questions: [{id: 'q1', question: 'Colors?', category: 'colors', required: false}],
      });
      const result = generateResponse(g, {
        collectedAnswers: {colors: [], accentColor: {hex: undefined, type: 'primary'}},
        questionsAsked: [],
      });
      expect(result).to.include('USER-FACING RESPONSE');
    });

    it('should handle font-like keys with name undefined without error', () => {
      const g = createGuidance({
        questions: [{id: 'q1', question: 'Font?', category: 'typography', required: false}],
      });
      const result = generateResponse(g, {
        collectedAnswers: {fonts: [], headingFont: {name: undefined, type: 'title'}},
        questionsAsked: [],
      });
      expect(result).to.include('USER-FACING RESPONSE');
    });

    it('should include validation instructions when guidance has validation', () => {
      const g = createGuidance({
        questions: [{id: 'q1', question: 'Colors?', category: 'colors', required: false}],
        validation: {
          colorValidation: 'Check contrast ratios.',
          fontValidation: 'Verify font availability.',
          generalValidation: 'Validate other inputs.',
          requirements: 'Always validate before implementing.',
        },
      });
      const result = generateResponse(g, {
        collectedAnswers: {colors: []},
        questionsAsked: [],
      });
      expect(result).to.include('MANDATORY: Input Validation');
      expect(result).to.include('Color Combination Validation');
      expect(result).to.include('Check contrast ratios');
      expect(result).to.include('Font Validation');
      expect(result).to.include('Verify font availability');
      expect(result).to.include('General Input Validation');
      expect(result).to.include('Validate other inputs');
      expect(result).to.include('IMPORTANT');
      expect(result).to.include('Always validate before implementing');
    });
  });
});
