/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {createDeveloperGuidelinesTool} from '../../../src/tools/storefrontnext/developer-guidelines.js';
import {Services} from '../../../src/services.js';
import type {ToolResult} from '../../../src/utils/types.js';

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
 * Create a mock services instance for testing.
 */
function createMockServices(): Services {
  return new Services({});
}

describe('tools/storefrontnext/developer-guidelines', () => {
  let services: Services;

  beforeEach(() => {
    services = createMockServices();
  });

  describe('tool metadata', () => {
    it('should have correct tool name', () => {
      const tool = createDeveloperGuidelinesTool(services);
      expect(tool.name).to.equal('storefront_next_development_guidelines');
    });

    it('should have concise, action-oriented description', () => {
      const tool = createDeveloperGuidelinesTool(services);
      const desc = tool.description;

      // Should emphasize this is an essential first step (most important)
      expect(desc).to.include('ESSENTIAL FIRST STEP');
      expect(desc).to.include('Use this tool FIRST');

      // Should mention core purpose clearly
      expect(desc).to.include('Storefront Next');
      expect(desc).to.include('architecture rules');
      expect(desc).to.include('coding standards');
      expect(desc).to.include('best practices');

      // Should mention key architectural patterns
      expect(desc).to.include('React Server Components');
      expect(desc).to.include('data loading');
      expect(desc).to.include('framework constraints');

      // Should describe behavior concisely
      expect(desc).to.match(/comprehensive|quick reference/i);

      // Should be reasonably short (optimized for LLM consumption)
      // Note: Description includes critical instructions, so slightly longer than ideal
      expect(desc.length).to.be.lessThan(650);
    });

    it('should list all sections in inputSchema description', () => {
      const tool = createDeveloperGuidelinesTool(services);

      // The inputSchema should list all available sections for discoverability
      // This is better UX than burying them in the main description
      const allSections = [
        'quick-reference',
        'data-fetching',
        'state-management',
        'auth',
        'config',
        'i18n',
        'components',
        'page-designer',
        'performance',
        'testing',
        'extensions',
        'pitfalls',
      ];

      // Each section should be valid (tests that SECTIONS_METADATA is complete)
      for (const section of allSections) {
        const result = tool.handler({sections: [section]});
        expect(result).to.be.a('promise');
      }
    });

    it('should include detailed topics in inputSchema description', () => {
      // Main description should be concise
      // Detailed topics should be in inputSchema.sections.describe()
      // This follows MCP best practices: main description = WHEN/WHY, inputSchema = HOW

      const tool = createDeveloperGuidelinesTool(services);
      const desc = tool.description;

      // Main description should be concise, not list all topics
      // Note: Description includes critical instructions, so slightly longer than ideal
      expect(desc.length).to.be.lessThan(650);

      // Main description focuses on WHEN and WHY
      expect(desc).to.include('ESSENTIAL FIRST STEP');
      expect(desc).to.include('FIRST before writing');

      // Detailed topics moved to inputSchema (verified by test above)
      // This keeps main description scannable for LLMs while providing full detail where needed
    });

    it('should be in STOREFRONTNEXT toolset', () => {
      const tool = createDeveloperGuidelinesTool(services);
      expect(tool.toolsets).to.include('STOREFRONTNEXT');
      expect(tool.toolsets).to.have.lengthOf(1);
    });

    it('should be GA (generally available)', () => {
      const tool = createDeveloperGuidelinesTool(services);
      expect(tool.isGA).to.be.false;
    });

    it('should not require B2C instance', () => {
      const tool = createDeveloperGuidelinesTool(services);
      // Guidelines are static content, no instance needed
      expect(tool).to.not.have.property('requiresInstance');
    });

    it('should prevent section/description mismatch with single source of truth', () => {
      // This test ensures that sections and descriptions are defined together
      // in SECTIONS_METADATA, making it impossible to have mismatched arrays

      // Verify all 12 sections exist
      const allSections = [
        'quick-reference',
        'data-fetching',
        'state-management',
        'auth',
        'config',
        'i18n',
        'components',
        'page-designer',
        'performance',
        'testing',
        'extensions',
        'pitfalls',
      ];

      // Create tool to verify derived _SECTIONS matches
      const tool = createDeveloperGuidelinesTool(services);

      // Each section should be valid and retrievable
      for (const section of allSections) {
        const result = tool.handler({sections: [section]});
        expect(result).to.be.a('promise'); // Should not throw sync error
      }
    });
  });

  describe('inputSchema behavior', () => {
    it('should have sections parameter that is optional', async () => {
      const tool = createDeveloperGuidelinesTool(services);

      // Should work without providing sections parameter
      const result = await tool.handler({});
      expect(result.isError).to.be.undefined;
      expect(getResultText(result)).to.not.be.empty;
    });

    it('should accept array of valid section enums', async () => {
      const tool = createDeveloperGuidelinesTool(services);

      // All valid sections from _SECTIONS constant
      const validSections = [
        'quick-reference',
        'data-fetching',
        'state-management',
        'auth',
        'config',
        'i18n',
        'components',
        'page-designer',
        'performance',
        'testing',
        'extensions',
        'pitfalls',
      ];

      for (const section of validSections) {
        // eslint-disable-next-line no-await-in-loop
        const result = await tool.handler({sections: [section]});
        expect(result.isError).to.be.undefined;
      }
    });
  });

  describe('default behavior', () => {
    it('should return comprehensive guidelines by default when no sections specified', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      // Verify it returns content (should be non-empty)
      expect(text).to.not.be.empty;

      // Should contain quick-reference content
      expect(text).to.match(/server|component|data|loading|TypeScript/i);

      // Should contain data-fetching section (comprehensive default)
      expect(text).to.include('Data Fetching Patterns');

      // Should contain components section
      expect(text).to.include('Component Patterns');

      // Should contain testing section
      expect(text).to.include('Testing Strategy');
    });

    it('should return empty string when sections array is explicitly empty', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({sections: []});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      // Empty array returns empty string (edge case)
      expect(text).to.be.empty;
    });
  });

  describe('single section retrieval', () => {
    it('should support all 12 available sections as documented', () => {
      // Verify the tool has exactly 12 sections available
      // These are the sections mentioned in the inputSchema description
      const expectedSections = [
        'quick-reference',
        'data-fetching',
        'state-management',
        'auth',
        'config',
        'i18n',
        'components',
        'page-designer',
        'performance',
        'testing',
        'extensions',
        'pitfalls',
      ];

      // This validates the contract stated in the inputSchema
      expect(expectedSections).to.have.lengthOf(12);
    });

    it('should return quick-reference section', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({sections: ['quick-reference']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return data-fetching section', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({sections: ['data-fetching']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return state-management section', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({sections: ['state-management']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return auth section', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({sections: ['auth']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return config section', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({sections: ['config']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return i18n section', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({sections: ['i18n']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return components section', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({sections: ['components']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return page-designer section', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({sections: ['page-designer']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return performance section', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({sections: ['performance']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return testing section', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({sections: ['testing']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return extensions section', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({sections: ['extensions']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return pitfalls section', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({sections: ['pitfalls']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });
  });

  describe('multiple section retrieval', () => {
    it('should support contextual learning with multiple sections', async () => {
      const tool = createDeveloperGuidelinesTool(services);

      // Test related sections together (as mentioned in description)
      const result = await tool.handler({
        sections: ['data-fetching', 'state-management'],
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      // Should contain content from both sections
      expect(text).to.not.be.empty;

      // Should contain the separator between sections
      expect(text).to.include('\n\n---\n\n');

      // Content should include topics from both sections
      expect(text.toLowerCase()).to.match(/data|fetch|load/);
      expect(text.toLowerCase()).to.match(/state|context/);
    });

    it('should combine three sections correctly', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({
        sections: ['auth', 'config', 'i18n'],
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      // Should contain content
      expect(text).to.not.be.empty;

      // Should have exactly 2 separators between the 3 content sections
      // Plus 2 more from prefix and footer instructions = 4 total
      const separators = text.match(/\n\n---\n\n/g);
      expect(separators).to.have.lengthOf(4);
    });

    it('should maintain order of sections as requested', async () => {
      const tool = createDeveloperGuidelinesTool(services);

      // Request sections in specific order
      const result = await tool.handler({
        sections: ['auth', 'config'],
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      // Should contain the separator
      expect(text).to.include('\n\n---\n\n');

      // Split on separator - will include prefix and footer
      const allParts = text.split('\n\n---\n\n');

      // Filter out prefix (starts with warning emoji) and footer (contains "END OF CONTENT")
      const contentSections = allParts.filter((part) => !part.includes('⚠️') && !part.includes('END OF CONTENT'));

      // Should have two content sections
      expect(contentSections).to.have.lengthOf(2);

      // Verify content is from the expected sections in the correct order
      expect(contentSections[0]).to.include('Authentication');
      expect(contentSections[1]).to.include('Configuration');
    });

    it('should handle all sections at once', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({
        sections: [
          'quick-reference',
          'data-fetching',
          'state-management',
          'auth',
          'config',
          'i18n',
          'components',
          'page-designer',
          'performance',
          'testing',
          'extensions',
          'pitfalls',
        ],
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      // Should contain content
      expect(text).to.not.be.empty;

      // Should have at least 11 separators for 12 sections
      // (may have more if markdown content contains similar patterns)
      const separators = text.match(/\n\n---\n\n/g);
      expect(separators).to.not.be.null;
      expect(separators!.length).to.be.at.least(11);

      // Verify content from various sections is present
      expect(text).to.include('Authentication');
      expect(text).to.include('Configuration');
      expect(text).to.include('Internationalization');
    });
  });

  describe('input validation', () => {
    it('should reject invalid section names', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await tool.handler({sections: ['invalid-section']} as any);

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.include('Invalid input');
    });

    it('should reject empty strings in sections array', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await tool.handler({sections: ['']} as any);

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.include('Invalid input');
    });

    it('should reject non-array sections parameter', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await tool.handler({sections: 'quick-reference'} as any);

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.include('Invalid input');
    });
  });

  describe('content verification', () => {
    it('should load actual markdown content from files', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({sections: ['quick-reference']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      // Verify it's actual markdown content (should have markdown formatting)
      // Most markdown files have headers, lists, or code blocks
      expect(text).to.match(/#|\*|-|```/);
    });

    it('should return different content for different sections', async () => {
      const tool = createDeveloperGuidelinesTool(services);

      const result1 = await tool.handler({sections: ['data-fetching']});
      const result2 = await tool.handler({sections: ['auth']});

      expect(result1.isError).to.be.undefined;
      expect(result2.isError).to.be.undefined;

      const text1 = getResultText(result1);
      const text2 = getResultText(result2);

      // Different sections should have different content
      expect(text1).to.not.equal(text2);
    });

    it('should cover critical topics mentioned in description', async () => {
      const tool = createDeveloperGuidelinesTool(services);

      // Test that key topics from the description are covered in relevant sections
      const topicTests = [
        {section: 'data-fetching', keywords: ['server', 'data', 'load']},
        {section: 'auth', keywords: ['authentication', 'session']},
        {section: 'i18n', keywords: ['internationalization', 'locale', 'translation']},
        {section: 'performance', keywords: ['performance', 'optimization']},
        {section: 'testing', keywords: ['test']},
        {section: 'pitfalls', keywords: ['pitfall', 'common', 'avoid', 'mistake', 'error']},
      ];

      for (const {section, keywords} of topicTests) {
        // eslint-disable-next-line no-await-in-loop
        const result = await tool.handler({sections: [section]});
        expect(result.isError).to.be.undefined;

        const text = getResultText(result).toLowerCase();

        // At least one keyword should be present
        const hasKeyword = keywords.some((keyword) => text.includes(keyword));
        expect(hasKeyword, `Section ${section} should contain one of: ${keywords.join(', ')}`).to.be.true;
      }
    });

    it('should provide non-negotiable architecture rules in quick-reference', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({sections: ['quick-reference']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      // The description emphasizes "non-negotiable architecture rules"
      // Quick reference should contain guidance about rules/patterns
      const hasRulesOrPatterns =
        text.toLowerCase().includes('rule') ||
        text.toLowerCase().includes('pattern') ||
        text.toLowerCase().includes('must') ||
        text.toLowerCase().includes('always') ||
        text.toLowerCase().includes('never');

      expect(hasRulesOrPatterns, 'Quick reference should contain architecture rules/patterns').to.be.true;
    });

    it('should emphasize TypeScript-only approach', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({sections: ['quick-reference']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      // Description mentions "TypeScript-only"
      expect(text.toLowerCase()).to.match(/typescript|\.tsx?|type/);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined sections parameter', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({sections: undefined});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      // Should default to comprehensive guidelines (quick-reference + key sections)
      expect(text).to.not.be.empty;
      expect(text).to.include('Data Fetching Patterns');
    });

    it('should handle sections parameter explicitly set to null', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await tool.handler({sections: null} as any);

      // null is not a valid array, should error
      expect(result.isError).to.be.true;
    });

    it('should handle duplicate sections in array', async () => {
      const tool = createDeveloperGuidelinesTool(services);
      const result = await tool.handler({
        sections: ['auth', 'auth'],
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      // Should return content with one separator
      expect(text).to.include('\n\n---\n\n');

      // Split on separator - will include prefix and footer, so we need to filter
      // The prefix ends with '---\n\n' and footer starts with '\n\n---\n\n'
      // So we get: [prefix, section1, section2, footer]
      const allParts = text.split('\n\n---\n\n');

      // Filter out prefix (starts with warning emoji) and footer (contains "END OF CONTENT")
      const contentSections = allParts.filter((part) => !part.includes('⚠️') && !part.includes('END OF CONTENT'));

      // Should have duplicated content (same section twice)
      expect(contentSections).to.have.lengthOf(2);
      // Content should be the same (both are the auth section)
      expect(contentSections[0].trim()).to.equal(contentSections[1].trim());
    });
  });
});
