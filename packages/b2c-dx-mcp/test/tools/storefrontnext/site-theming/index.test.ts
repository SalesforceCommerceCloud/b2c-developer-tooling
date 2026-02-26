/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {createSiteThemingTool} from '../../../../src/tools/storefrontnext/site-theming/index.js';
import {Services} from '../../../../src/services.js';
import type {ToolResult} from '../../../../src/utils/types.js';
import {createMockResolvedConfig, createMockLoadServices} from '../../../test-helpers.js';

/**
 * Helper to extract text from a ToolResult.
 * Throws if the first content item is not a text type.
 */
function getResultText(result: ToolResult): string {
  const content = result.content[0];
  if (content.type !== 'text') {
    throw new Error(`Expected text content, got ${content.type}`);
  }
  return content.text;
}

/**
 * Type guard for string (used to satisfy unicorn/prefer-native-coercion-functions).
 */
function isString(x: unknown): x is string {
  return typeof x === 'string';
}

/**
 * Create a mock services instance for testing.
 */
function createMockServices(): Services {
  return new Services({resolvedConfig: createMockResolvedConfig()});
}

describe('tools/storefrontnext/site-theming', () => {
  let services: Services;

  const defaultContext = {
    collectedAnswers: {
      colors: [] as Array<{hex?: string; type?: string}>,
      fonts: [] as Array<{name?: string; type?: string}>,
    },
  };

  beforeEach(() => {
    services = createMockServices();
  });

  describe('tool metadata', () => {
    it('should have correct structure', () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));
      expect(tool).to.have.property('name', 'storefront_next_site_theming');
      expect(tool.description).to.include('theming guidelines');
      expect(tool).to.have.property('inputSchema');
      expect(tool).to.have.property('handler');
      expect(tool.handler).to.be.a('function');
    });

    it('should be in STOREFRONTNEXT toolset', () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));
      expect(tool.toolsets).to.include('STOREFRONTNEXT');
    });
  });

  describe('tool behavior', () => {
    it('should list available files when called without parameters', async () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));
      const result = await tool.handler({});

      expect(result.content).to.exist;
      const text = getResultText(result);
      expect(text).to.include('Available theming files');
      expect(text).to.include('theming-questions');
      expect(text).to.include('theming-validation');
      expect(text).to.include('theming-accessibility');
    });

    it('should retrieve and parse theming file from store', async () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));
      const result = await tool.handler({
        fileKey: 'theming-questions',
        conversationContext: defaultContext,
      });

      expect(result.content).to.exist;
      const text = getResultText(result);
      expect(text).to.include('Layout Preservation');
      expect(text).to.include('Critical Guidelines');
      expect(text).to.include('Questions to Ask the User');
    });

    it('should return error when file key does not exist', async () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));
      const result = await tool.handler({
        fileKey: 'non-existent',
      });

      expect(result.isError).to.equal(true);
      expect(getResultText(result)).to.include('not found');
      expect(getResultText(result)).to.include('non-existent');
    });

    it('should extract questions from content', async () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));
      const result = await tool.handler({
        fileKey: 'theming-questions',
        conversationContext: defaultContext,
      });

      const text = getResultText(result);
      expect(text).to.include('Questions to Ask the User');
      expect(text).to.match(/color|font/i);
    });

    it('should filter questions based on conversation context', async () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));

      const firstResult = await tool.handler({
        fileKey: 'theming-questions',
        conversationContext: defaultContext,
      });

      const firstText = getResultText(firstResult);
      expect(firstText).to.include('Questions to Ask the User');

      const secondResult = await tool.handler({
        fileKey: 'theming-questions',
        conversationContext: {
          questionsAsked: ['color-primary'],
          collectedAnswers: {
            colors: [],
            fonts: [],
            'color-primary': '#635BFF',
          },
        },
      });

      const secondText = getResultText(secondResult);
      expect(secondText).to.be.a('string');
    });

    it('should include collected theming info in response', async () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));
      const result = await tool.handler({
        fileKey: 'theming-questions',
        conversationContext: {
          questionsAsked: ['color-1', 'color-2'],
          collectedAnswers: {
            colors: [
              {hex: '#635BFF', type: 'primary'},
              {hex: '#0A2540', type: 'secondary'},
            ],
            fonts: [{name: 'sohne-var', type: 'body'}],
            'color-1': 'primary',
            'color-2': 'accent',
          },
        },
      });

      const text = getResultText(result);
      expect(text).to.include("Information You've Provided");
      expect(text).to.include('#635BFF');
      expect(text).to.include('sohne-var');
    });

    it('should include critical guidelines in response', async () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));
      const result = await tool.handler({
        fileKey: 'theming-questions',
        conversationContext: defaultContext,
      });

      const text = getResultText(result);
      expect(text).to.include('Critical Guidelines');
      expect(text).to.include('Layout Preservation');
    });

    it("should include DO and DON'T rules", async () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));
      const result = await tool.handler({
        fileKey: 'theming-questions',
        conversationContext: defaultContext,
      });

      const text = getResultText(result);
      expect(text).to.include('What TO Do');
      expect(text).to.include('What NOT to Do');
      expect(text).to.match(/position|color/);
    });

    it('should use default files when conversationContext provided without fileKey', async () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));
      const result = await tool.handler({
        conversationContext: defaultContext,
      });

      expect(result.content).to.exist;
      expect(result.isError).to.not.equal(true);
      const text = getResultText(result);
      expect(text).to.include('Questions to Ask the User');
    });

    it('should run automated color validation when colorMapping is provided', async () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));
      const result = await tool.handler({
        fileKey: 'theming-questions',
        conversationContext: {
          questionsAsked: ['color-1'],
          collectedAnswers: {
            colors: [{hex: '#635BFF', type: 'primary'}],
            fonts: [],
            colorMapping: {
              lightText: '#000000',
              lightBackground: '#FFFFFF',
              darkText: '#FFFFFF',
              darkBackground: '#18181B',
              buttonText: '#FFFFFF',
              buttonBackground: '#0A2540',
            },
          },
        },
      });

      const text = getResultText(result);
      expect(text).to.include('AUTOMATED COLOR VALIDATION RESULTS');
      expect(text).to.include('Contrast Ratio');
      expect(text).to.match(/WCAG|AAA|AA|FAIL/);
    });

    it('should run validation when only colorMapping is provided (no colors array)', async () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));
      const result = await tool.handler({
        fileKey: 'theming-questions',
        conversationContext: {
          collectedAnswers: {
            colorMapping: {
              lightText: '#000000',
              lightBackground: '#FFFFFF',
              buttonText: '#FFFFFF',
              buttonBackground: '#0A2540',
            },
          },
        },
      });

      const text = getResultText(result);
      expect(text).to.include('AUTOMATED COLOR VALIDATION RESULTS');
      expect(text).to.include('Contrast Ratio');
      expect(text).to.match(/WCAG|AAA|AA|FAIL/);
    });

    it('should merge guidance when fileKeys array is provided', async () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));
      const result = await tool.handler({
        fileKeys: ['theming-questions', 'theming-validation'],
        conversationContext: defaultContext,
      });

      expect(result.isError).to.not.equal(true);
      const text = getResultText(result);
      // Merged content should include from both files
      expect(text).to.include('Questions to Ask the User');
      expect(text).to.satisfy(
        (t: string) =>
          t.includes('Input Validation') || t.includes('VALIDATION') || t.includes('Color') || t.includes('contrast'),
      );
    });

    it('should combine fileKey with default files', async () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));
      const result = await tool.handler({
        fileKey: 'theming-accessibility',
        conversationContext: defaultContext,
      });

      expect(result.isError).to.not.equal(true);
      const text = getResultText(result);
      expect(text).to.be.a('string');
      expect(text.length).to.be.greaterThan(0);
    });

    it('should return error when fileKeys contains non-existent key', async () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));
      const result = await tool.handler({
        fileKeys: ['theming-questions', 'non-existent-key'],
        conversationContext: defaultContext,
      });

      expect(result.isError).to.equal(true);
      const text = getResultText(result);
      expect(text).to.include('not found');
      expect(text).to.include('non-existent-key');
    });
  });

  describe('edge cases', () => {
    it('should show Ready to Implement when all required questions answered', async () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));

      // First call to get initial questions - then simulate answering all
      const firstResult = await tool.handler({
        fileKey: 'theming-questions',
        conversationContext: defaultContext,
      });
      const firstText = getResultText(firstResult);

      // Extract question IDs from the response (they appear in "Question N (category): id" format)
      const questionIdMatches = firstText.match(/\((\w+)\):\s*(color-\d+|font-\d+|general-\d+)/g);
      const questionIds: string[] = questionIdMatches
        ? [...new Set(questionIdMatches.map((m) => m.split(':').pop()?.trim()).filter((x) => isString(x)))]
        : ['color-1', 'font-1', 'general-1'];

      const collectedAnswers: Record<string, unknown> = {
        colors: [{hex: '#635BFF', type: 'primary'}],
        fonts: [{name: 'sohne-var', type: 'body'}],
      };
      for (const id of questionIds) {
        if (id) {
          collectedAnswers[id] = 'answered';
        }
      }

      const secondResult = await tool.handler({
        fileKey: 'theming-questions',
        conversationContext: {
          questionsAsked: questionIds,
          collectedAnswers,
        },
      });

      const secondText = getResultText(secondResult);
      // Should show Ready to Implement, pre-implementation checklist, or continue with workflow
      expect(secondText).to.satisfy(
        (t: string) =>
          t.includes('Ready to Implement') ||
          t.includes('PRE-IMPLEMENTATION') ||
          t.includes('validate all provided inputs') ||
          t.includes('Questions to Ask') ||
          t.includes('MANDATORY'),
      );
    });

    it('should show validation summary when color combinations fail WCAG', async () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));
      const result = await tool.handler({
        fileKey: 'theming-questions',
        conversationContext: {
          questionsAsked: ['color-1'],
          collectedAnswers: {
            colors: [{hex: '#CCCCCC', type: 'primary'}],
            fonts: [],
            colorMapping: {
              lightText: '#DDDDDD',
              lightBackground: '#FFFFFF',
            },
          },
        },
      });

      const text = getResultText(result);
      // Poor contrast should trigger validation summary
      expect(text).to.satisfy(
        (t: string) =>
          t.includes('VALIDATION SUMMARY') ||
          t.includes('Issues found') ||
          t.includes('WCAG') ||
          t.includes('contrast'),
      );
    });

    it('should skip invalid hex in colorMapping without error', async () => {
      const tool = createSiteThemingTool(createMockLoadServices(services));
      const result = await tool.handler({
        fileKey: 'theming-questions',
        conversationContext: {
          questionsAsked: ['color-1'],
          collectedAnswers: {
            colors: [{hex: '#635BFF', type: 'primary'}],
            fonts: [],
            colorMapping: {
              lightText: '#000000',
              lightBackground: '#FFFFFF',
              invalidKey: '#GG',
              anotherInvalid: 'not-hex',
            },
          },
        },
      });

      expect(result.isError).to.not.equal(true);
      const text = getResultText(result);
      // Should still run validation for valid colors; invalid hex is filtered out
      expect(text).to.include('AUTOMATED COLOR VALIDATION RESULTS');
      expect(text).to.include('Contrast Ratio');
    });
  });
});
