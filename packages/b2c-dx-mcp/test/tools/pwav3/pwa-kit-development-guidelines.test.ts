/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {createDeveloperGuidelinesTool} from '../../../src/tools/pwav3/pwa-kit-development-guidelines.js';
import {Services} from '../../../src/services.js';
import type {ToolResult} from '../../../src/utils/types.js';
import {createMockResolvedConfig} from '../../test-helpers.js';

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
  return new Services({resolvedConfig: createMockResolvedConfig()});
}

describe('tools/pwav3/pwa-kit-development-guidelines', () => {
  let services: Services;

  beforeEach(() => {
    services = createMockServices();
  });

  describe('tool metadata', () => {
    it('should have correct tool name', () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      expect(tool.name).to.equal('pwakit_development_guidelines');
    });

    it('should have concise, action-oriented description', () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const desc = tool.description;

      expect(desc).to.include('ESSENTIAL FIRST STEP');
      expect(desc).to.include('Use this tool FIRST');
      expect(desc).to.include('PWA Kit');
      expect(desc).to.include('architecture rules');
      expect(desc).to.include('coding standards');
      expect(desc).to.include('best practices');
      expect(desc).to.include('React components');
      expect(desc).to.include('data fetching');
      expect(desc).to.include('routing');
      expect(desc).to.match(/comprehensive|quick reference/i);
      expect(desc.length).to.be.lessThan(700);
    });

    it('should list all sections in inputSchema description', () => {
      const tool = createDeveloperGuidelinesTool(() => services);

      const allSections = [
        'quick-reference',
        'components',
        'data-fetching',
        'routing',
        'config',
        'state-management',
        'extensibility',
        'testing',
        'i18n',
        'styling',
      ];

      for (const section of allSections) {
        const result = tool.handler({sections: [section]});
        expect(result).to.be.a('promise');
      }
    });

    it('should be in PWAV3 toolset', () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      expect(tool.toolsets).to.include('PWAV3');
      expect(tool.toolsets).to.have.lengthOf(1);
    });

    it('should not be GA (generally available)', () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      expect(tool.isGA).to.be.false;
    });

    it('should not require B2C instance', () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      expect(tool).to.not.have.property('requiresInstance');
    });

    it('should prevent section/description mismatch with single source of truth', () => {
      const allSections = [
        'quick-reference',
        'components',
        'data-fetching',
        'routing',
        'config',
        'state-management',
        'extensibility',
        'testing',
        'i18n',
        'styling',
      ];

      const tool = createDeveloperGuidelinesTool(() => services);

      for (const section of allSections) {
        const result = tool.handler({sections: [section]});
        expect(result).to.be.a('promise');
      }
    });
  });

  describe('inputSchema behavior', () => {
    it('should have sections parameter that is optional', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);

      const result = await tool.handler({});
      expect(result.isError).to.be.undefined;
      expect(getResultText(result)).to.not.be.empty;
    });

    it('should accept array of valid section enums', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);

      const validSections = [
        'quick-reference',
        'components',
        'data-fetching',
        'routing',
        'config',
        'state-management',
        'extensibility',
        'testing',
        'i18n',
        'styling',
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
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      expect(text).to.not.be.empty;
      expect(text).to.match(/react|component|data|commerce|chakra/i);
      expect(text).to.include('Data Fetching');
      expect(text).to.include('Component');
      expect(text).to.include('Routing');
    });

    it('should return empty string when sections array is explicitly empty', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({sections: []});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.be.empty;
    });
  });

  describe('single section retrieval', () => {
    it('should support all 10 available sections as documented', () => {
      const expectedSections = [
        'quick-reference',
        'components',
        'data-fetching',
        'routing',
        'config',
        'state-management',
        'extensibility',
        'testing',
        'i18n',
        'styling',
      ];

      expect(expectedSections).to.have.lengthOf(10);
    });

    it('should return quick-reference section', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({sections: ['quick-reference']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return data-fetching section', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({sections: ['data-fetching']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return components section', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({sections: ['components']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return routing section', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({sections: ['routing']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return config section', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({sections: ['config']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return state-management section', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({sections: ['state-management']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return extensibility section', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({sections: ['extensibility']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return testing section', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({sections: ['testing']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return i18n section', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({sections: ['i18n']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });

    it('should return styling section', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({sections: ['styling']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.not.be.empty;
    });
  });

  describe('multiple section retrieval', () => {
    it('should support contextual learning with multiple sections', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);

      const result = await tool.handler({
        sections: ['data-fetching', 'components'],
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      expect(text).to.not.be.empty;
      expect(text).to.include('\n\n---\n\n');
      expect(text.toLowerCase()).to.match(/data|fetch|commerce|hook/);
      expect(text.toLowerCase()).to.match(/component|chakra|react/);
    });

    it('should combine three sections correctly', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({
        sections: ['config', 'routing', 'i18n'],
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      expect(text).to.not.be.empty;

      const separators = text.match(/\n\n---\n\n/g);
      expect(separators).to.have.lengthOf(4);
    });

    it('should maintain order of sections as requested', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);

      const result = await tool.handler({
        sections: ['config', 'routing'],
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      expect(text).to.include('\n\n---\n\n');

      const allParts = text.split('\n\n---\n\n');
      const contentSections = allParts.filter((part) => !part.includes('⚠️') && !part.includes('END OF CONTENT'));

      expect(contentSections).to.have.lengthOf(2);
      expect(contentSections[0]).to.include('Configuration');
      expect(contentSections[1]).to.include('Routing');
    });

    it('should handle all sections at once', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({
        sections: [
          'quick-reference',
          'components',
          'data-fetching',
          'routing',
          'config',
          'state-management',
          'extensibility',
          'testing',
          'i18n',
          'styling',
        ],
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      expect(text).to.not.be.empty;

      const separators = text.match(/\n\n---\n\n/g);
      expect(separators).to.not.be.null;
      expect(separators!.length).to.be.at.least(9);

      expect(text).to.include('Configuration');
      expect(text).to.include('Internationalization');
    });
  });

  describe('input validation', () => {
    it('should reject invalid section names', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await tool.handler({sections: ['invalid-section']} as any);

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.include('Invalid input');
    });

    it('should reject empty strings in sections array', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await tool.handler({sections: ['']} as any);

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.include('Invalid input');
    });

    it('should reject non-array sections parameter', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await tool.handler({sections: 'quick-reference'} as any);

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.include('Invalid input');
    });
  });

  describe('content verification', () => {
    it('should load actual markdown content from files', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({sections: ['quick-reference']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      expect(text).to.match(/#|\*|-|```/);
    });

    it('should return different content for different sections', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);

      const result1 = await tool.handler({sections: ['data-fetching']});
      const result2 = await tool.handler({sections: ['config']});

      expect(result1.isError).to.be.undefined;
      expect(result2.isError).to.be.undefined;

      const text1 = getResultText(result1);
      const text2 = getResultText(result2);

      expect(text1).to.not.equal(text2);
    });

    it('should cover critical topics mentioned in description', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);

      const topicTests = [
        {section: 'data-fetching', keywords: ['commerce', 'data', 'hook', 'react query']},
        {section: 'config', keywords: ['configuration', 'config', 'commerce']},
        {section: 'i18n', keywords: ['internationalization', 'locale', 'translation', 'react-intl']},
        {section: 'testing', keywords: ['test', 'jest', 'mock']},
        {section: 'components', keywords: ['component', 'react', 'chakra']},
        {section: 'routing', keywords: ['route', 'router', 'express']},
      ];

      for (const {section, keywords} of topicTests) {
        // eslint-disable-next-line no-await-in-loop
        const result = await tool.handler({sections: [section]});
        expect(result.isError).to.be.undefined;

        const text = getResultText(result).toLowerCase();

        const hasKeyword = keywords.some((keyword) => text.includes(keyword));
        expect(hasKeyword, `Section ${section} should contain one of: ${keywords.join(', ')}`).to.be.true;
      }
    });

    it('should provide non-negotiable architecture rules in quick-reference', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({sections: ['quick-reference']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      const hasRulesOrPatterns =
        text.toLowerCase().includes('rule') ||
        text.toLowerCase().includes('pattern') ||
        text.toLowerCase().includes('must') ||
        text.toLowerCase().includes('always') ||
        text.toLowerCase().includes('never');

      expect(hasRulesOrPatterns, 'Quick reference should contain architecture rules/patterns').to.be.true;
    });

    it('should emphasize PWA Kit and React patterns in quick-reference', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({sections: ['quick-reference']});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      expect(text.toLowerCase()).to.match(/pwa kit|react|commerce/);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined sections parameter', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({sections: undefined});

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      expect(text).to.not.be.empty;
      expect(text).to.include('Data Fetching');
    });

    it('should handle sections parameter explicitly set to null', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await tool.handler({sections: null} as any);

      expect(result.isError).to.be.true;
    });

    it('should handle duplicate sections in array', async () => {
      const tool = createDeveloperGuidelinesTool(() => services);
      const result = await tool.handler({
        sections: ['config', 'config'],
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      expect(text).to.include('\n\n---\n\n');

      const allParts = text.split('\n\n---\n\n');
      const contentSections = allParts.filter((part) => !part.includes('⚠️') && !part.includes('END OF CONTENT'));

      expect(contentSections).to.have.lengthOf(2);
      expect(contentSections[0].trim()).to.equal(contentSections[1].trim());
    });
  });
});
