/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {createPageDesignerDecoratorTool} from '../../../src/tools/page-designer-decorator/index.js';
import {Services} from '../../../src/services.js';
import type {ToolResult} from '../../../src/utils/types.js';
import {existsSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';

/**
 * Helper to extract text from a ToolResult.
 * Throws if the first content item is not a text type.
 *
 * @param result - The ToolResult to extract text from
 * @returns The text content from the first content item
 * @throws {Error} If the first content item is not a text type
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
 *
 * @returns A new Services instance with empty configuration
 */
function createMockServices(): Services {
  return new Services({});
}

/**
 * Create a temporary test component file.
 * Creates components in the standard location that the tool searches for (`src/components/`).
 *
 * The component will have:
 * - A Props interface with the specified props
 * - A default export function component
 * - Proper copyright header
 *
 * @param dir - The test directory root where the component should be created
 * @param componentName - The name of the component (e.g., "TestComponent")
 * @param props - Optional props string in the format "propName: type; propName2: type;"
 *                If not provided, defaults to "title: string;"
 * @returns The absolute path to the created component file
 *
 * @example
 * ```typescript
 * const path = createTestComponent(testDir, 'MyComponent', 'title: string; count: number;');
 * // Creates: {testDir}/src/components/MyComponent.tsx
 * ```
 */
function createTestComponent(dir: string, componentName: string, props?: string): string {
  // Create in src/components/ which is the standard search location
  const componentPath = path.join(dir, 'src', 'components', `${componentName}.tsx`);
  mkdirSync(path.dirname(componentPath), {recursive: true});

  // Extract prop names for the component function
  const propNames = props
    ? props
        .split(';')
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
        .map((p) => p.split(':')[0].trim())
        .join(', ')
    : 'title';

  const componentContent = `/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

export interface ${componentName}Props {
  ${props || 'title: string;'}
}

export default function ${componentName}({${propNames}}: ${componentName}Props) {
  return <div>{${propNames.split(',')[0].trim()}}</div>;
}
`;

  writeFileSync(componentPath, componentContent, 'utf8');
  return componentPath;
}

/**
 * Tests for the page-designer-decorator MCP tool.
 *
 * This test suite covers:
 * - Tool metadata (name, description, toolsets, isGA)
 * - Mode selection workflow
 * - Auto mode decorator generation
 * - Interactive mode workflow (all steps)
 * - Component resolution (by name, path, custom searchPaths)
 * - Input validation
 * - Error handling
 * - Output format validation
 *
 * Tests use temporary directories and mock components to avoid dependencies
 * on real project files.
 */
describe('tools/page-designer-decorator', () => {
  let services: Services;
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    services = createMockServices();
    // Create a temporary directory for test components
    testDir = path.join(tmpdir(), `b2c-mcp-test-${Date.now()}`);
    mkdirSync(testDir, {recursive: true});
    originalCwd = process.cwd();
    process.chdir(testDir);
    // Set SFCC_WORKING_DIRECTORY to the test directory
    process.env.SFCC_WORKING_DIRECTORY = testDir;
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (existsSync(testDir)) {
      rmSync(testDir, {recursive: true, force: true});
    }
    delete process.env.SFCC_WORKING_DIRECTORY;
  });

  describe('tool metadata', () => {
    it('should have correct tool name', () => {
      const tool = createPageDesignerDecoratorTool(services);
      expect(tool.name).to.equal('add_page_designer_decorator');
    });

    it('should have comprehensive description', () => {
      const tool = createPageDesignerDecoratorTool(services);
      const desc = tool.description;

      // Should mention Page Designer
      expect(desc).to.include('Page Designer');
      expect(desc).to.include('decorator');

      // Should mention modes
      expect(desc).to.match(/AUTO MODE|auto mode/i);
      expect(desc).to.match(/INTERACTIVE MODE|interactive mode/i);

      // Should mention key features
      expect(desc).to.include('@Component');
      expect(desc).to.include('@AttributeDefinition');
    });

    it('should be in STOREFRONTNEXT toolset', () => {
      const tool = createPageDesignerDecoratorTool(services);
      expect(tool.toolsets).to.include('STOREFRONTNEXT');
      expect(tool.toolsets).to.have.lengthOf(1);
    });

    it('should not be GA (generally available)', () => {
      const tool = createPageDesignerDecoratorTool(services);
      expect(tool.isGA).to.be.false;
    });
  });

  describe('mode selection', () => {
    it('should show mode selection when called with only component name', async () => {
      const tool = createPageDesignerDecoratorTool(services);
      createTestComponent(testDir, 'TestComponent');

      const result = await tool.handler({
        component: 'TestComponent',
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      // Should present mode selection options
      expect(text).to.match(/mode|Mode/i);
      expect(text).to.match(/auto|Auto/i);
      expect(text).to.match(/interactive|Interactive/i);
      expect(text).to.include('TestComponent');
    });

    it('should use SFCC_WORKING_DIRECTORY if set', async () => {
      const tool = createPageDesignerDecoratorTool(services);
      const customDir = path.join(tmpdir(), `b2c-mcp-test-custom-${Date.now()}`);
      mkdirSync(customDir, {recursive: true});
      createTestComponent(customDir, 'CustomComponent');

      process.env.SFCC_WORKING_DIRECTORY = customDir;

      const result = await tool.handler({
        component: 'CustomComponent',
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.match(/mode|Mode/i);

      rmSync(customDir, {recursive: true, force: true});
    });
  });

  describe('auto mode', () => {
    it('should generate decorators in auto mode', async () => {
      const tool = createPageDesignerDecoratorTool(services);
      createTestComponent(testDir, 'AutoComponent', 'title: string;');

      const result = await tool.handler({
        component: 'AutoComponent',
        autoMode: true,
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      // Should generate decorator code
      expect(text).to.include('@Component');
      expect(text).to.include('@AttributeDefinition');
      expect(text).to.include('AutoComponent');
      expect(text).to.include('title');
    });

    it('should handle component with multiple props in auto mode', async () => {
      const tool = createPageDesignerDecoratorTool(services);
      createTestComponent(
        testDir,
        'MultiPropComponent',
        `title: string;
description: string;
imageUrl: string;`,
      );

      const result = await tool.handler({
        component: 'MultiPropComponent',
        autoMode: true,
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      // Should include decorators for multiple props
      expect(text).to.include('@Component');
      expect(text).to.include('title');
      expect(text).to.include('description');
      expect(text).to.include('imageUrl');
    });

    it('should exclude complex props in auto mode', async () => {
      const tool = createPageDesignerDecoratorTool(services);
      createTestComponent(
        testDir,
        'ComplexPropsComponent',
        `title: string;
onClick: () => void;
config: { key: string; value: number };`,
      );

      const result = await tool.handler({
        component: 'ComplexPropsComponent',
        autoMode: true,
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      // Should include simple props in generated decorators
      expect(text).to.include('title');
      // Complex props should not appear in @AttributeDefinition decorators
      // (they might appear in instructions, but not in the actual decorator code)
      const decoratorCodeMatch = text.match(/@AttributeDefinition[\s\S]*?\)/g);
      if (decoratorCodeMatch) {
        const decoratorCode = decoratorCodeMatch.join('\n');
        expect(decoratorCode).to.not.include('onClick');
        expect(decoratorCode).to.not.include('config');
      }
    });

    it('should exclude UI-only props in auto mode', async () => {
      const tool = createPageDesignerDecoratorTool(services);
      createTestComponent(
        testDir,
        'UIPropsComponent',
        `title: string;
className: string;
style: React.CSSProperties;`,
      );

      const result = await tool.handler({
        component: 'UIPropsComponent',
        autoMode: true,
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      // Should include content props in generated decorators
      expect(text).to.include('title');
      // UI-only props should not appear in @AttributeDefinition decorators
      // (they might appear in instructions, but not in the actual decorator code)
      const decoratorCodeMatch = text.match(/@AttributeDefinition[\s\S]*?\)/g);
      if (decoratorCodeMatch) {
        const decoratorCode = decoratorCodeMatch.join('\n');
        expect(decoratorCode).to.not.include('className');
        expect(decoratorCode).to.not.include('style');
      }
    });
  });

  describe('interactive mode', () => {
    describe('analyze step', () => {
      it('should analyze component in analyze step', async () => {
        const tool = createPageDesignerDecoratorTool(services);
        createTestComponent(testDir, 'AnalyzeComponent', 'title: string;');

        const result = await tool.handler({
          component: 'AnalyzeComponent',
          conversationContext: {
            step: 'analyze',
          },
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);

        // Should show analysis results
        expect(text).to.match(/component|Component/i);
        expect(text).to.match(/prop|Prop|attribute|Attribute/i);
        expect(text).to.include('AnalyzeComponent');
        expect(text).to.include('title');
      });

      it('should categorize props correctly', async () => {
        const tool = createPageDesignerDecoratorTool(services);
        createTestComponent(
          testDir,
          'CategorizedComponent',
          `title: string;
onClick: () => void;
className: string;`,
        );

        const result = await tool.handler({
          component: 'CategorizedComponent',
          conversationContext: {
            step: 'analyze',
          },
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);

        // Should identify editable props
        expect(text).to.include('title');
        // Should mention props analysis (may use different terminology)
        expect(text).to.match(/prop|Prop|attribute|Attribute|editable|suitable/i);
        // Should mention complex or UI props (may be described differently)
        expect(text).to.match(/complex|Complex|UI|ui|exclude|skip/i);
      });
    });

    describe('select_props step', () => {
      it('should confirm selected props', async () => {
        const tool = createPageDesignerDecoratorTool(services);
        createTestComponent(testDir, 'SelectPropsComponent', 'title: string; description: string;');

        const result = await tool.handler({
          component: 'SelectPropsComponent',
          conversationContext: {
            step: 'select_props',
            selectedProps: ['title', 'description'],
            componentMetadata: {
              id: 'select-props-component',
              name: 'Select Props Component',
              description: 'Test component',
            },
          },
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);

        // Should confirm selections
        expect(text).to.include('title');
        expect(text).to.include('description');
        expect(text).to.include('Select Props Component');
      });

      it('should require component metadata', async () => {
        const tool = createPageDesignerDecoratorTool(services);
        createTestComponent(testDir, 'MissingMetadataComponent');

        const result = await tool.handler({
          component: 'MissingMetadataComponent',
          conversationContext: {
            step: 'select_props',
            selectedProps: ['title'],
            // Missing componentMetadata
          },
        });

        // Should return error when metadata is missing
        expect(result.isError).to.be.true;
        const text = getResultText(result);
        expect(text).to.match(/metadata|Metadata/i);
      });
    });

    describe('configure_attrs step', () => {
      it('should provide attribute configuration instructions', async () => {
        const tool = createPageDesignerDecoratorTool(services);
        createTestComponent(testDir, 'ConfigureAttrsComponent', 'imageUrl: string; description: string;');

        const result = await tool.handler({
          component: 'ConfigureAttrsComponent',
          conversationContext: {
            step: 'configure_attrs',
            selectedProps: ['imageUrl', 'description'],
          },
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);

        // Should provide configuration guidance
        expect(text).to.match(/attribute|Attribute|configure|Configure/i);
        expect(text).to.include('imageUrl');
        expect(text).to.include('description');
      });

      it('should suggest types for props', async () => {
        const tool = createPageDesignerDecoratorTool(services);
        createTestComponent(testDir, 'TypeSuggestionsComponent', 'imageUrl: string; productId: string;');

        const result = await tool.handler({
          component: 'TypeSuggestionsComponent',
          conversationContext: {
            step: 'configure_attrs',
            selectedProps: ['imageUrl', 'productId'],
          },
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);

        // Should suggest appropriate types
        expect(text).to.match(/url|image|product/i);
      });
    });

    describe('configure_regions step', () => {
      it('should provide region configuration instructions', async () => {
        const tool = createPageDesignerDecoratorTool(services);
        createTestComponent(testDir, 'RegionsComponent');

        const result = await tool.handler({
          component: 'RegionsComponent',
          conversationContext: {
            step: 'configure_regions',
          },
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);

        // Should provide region configuration guidance
        expect(text).to.match(/region|Region/i);
      });
    });

    describe('confirm_generation step', () => {
      it('should generate decorator code when all context provided', async () => {
        const tool = createPageDesignerDecoratorTool(services);
        createTestComponent(testDir, 'ConfirmComponent', 'title: string;');

        const result = await tool.handler({
          component: 'ConfirmComponent',
          conversationContext: {
            step: 'confirm_generation',
            selectedProps: ['title'],
            componentMetadata: {
              id: 'confirm-component',
              name: 'Confirm Component',
              description: 'Test component',
            },
            attributeConfig: {
              title: {
                type: 'string',
                name: 'Title',
              },
            },
          },
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);

        // Should generate complete decorator code
        expect(text).to.include('@Component');
        expect(text).to.include('@AttributeDefinition');
        expect(text).to.include('ConfirmComponent');
        expect(text).to.include('title');
      });

      it('should require component metadata', async () => {
        const tool = createPageDesignerDecoratorTool(services);
        createTestComponent(testDir, 'MissingMetadataConfirmComponent');

        const result = await tool.handler({
          component: 'MissingMetadataConfirmComponent',
          conversationContext: {
            step: 'confirm_generation',
            // Missing componentMetadata
          },
        });

        // Should return error when metadata is missing
        expect(result.isError).to.be.true;
        const text = getResultText(result);
        expect(text).to.match(/metadata|Metadata/i);
      });
    });
  });

  describe('error handling', () => {
    it('should handle non-existent component gracefully', async () => {
      const tool = createPageDesignerDecoratorTool(services);

      const result = await tool.handler({
        component: 'NonExistentComponent',
      });

      // Should return an error result
      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.match(/not found|error|Error/i);
    });

    it('should handle invalid input gracefully', async () => {
      const tool = createPageDesignerDecoratorTool(services);

      // Invalid input should be caught by zod validation
      const result = await tool.handler({
        component: 123, // Invalid type
      } as unknown as Record<string, unknown>);

      // Should return an error result
      expect(result.isError).to.be.true;
    });
  });

  describe('component resolution', () => {
    it('should find component by name in standard location', async () => {
      const tool = createPageDesignerDecoratorTool(services);
      createTestComponent(testDir, 'StandardLocationComponent');

      const result = await tool.handler({
        component: 'StandardLocationComponent',
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.include('StandardLocationComponent');
    });

    it('should find component by path', async () => {
      const tool = createPageDesignerDecoratorTool(services);
      const componentPath = createTestComponent(testDir, 'PathComponent');

      const result = await tool.handler({
        component: path.relative(testDir, componentPath),
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.include('PathComponent');
    });

    it('should use searchPaths when provided', async () => {
      const tool = createPageDesignerDecoratorTool(services);
      // Create component in a custom location
      const customDir = path.join(testDir, 'custom', 'components');
      mkdirSync(customDir, {recursive: true});
      const componentPath = path.join(customDir, 'CustomLocationComponent.tsx');
      writeFileSync(
        componentPath,
        `export interface CustomLocationComponentProps {
  title: string;
}

export default function CustomLocationComponent({title}: CustomLocationComponentProps) {
  return <div>{title}</div>;
}
`,
        'utf8',
      );

      const result = await tool.handler({
        component: 'CustomLocationComponent',
        searchPaths: ['custom/components'],
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.include('CustomLocationComponent');
    });
  });

  describe('input validation', () => {
    it('should accept valid component name', async () => {
      const tool = createPageDesignerDecoratorTool(services);
      createTestComponent(testDir, 'ValidComponent');

      const result = await tool.handler({
        component: 'ValidComponent',
      });

      // Should not error on valid input
      expect(result.isError).to.be.undefined;
    });

    it('should accept component path', async () => {
      const tool = createPageDesignerDecoratorTool(services);
      const componentPath = createTestComponent(testDir, 'PathComponent');

      const result = await tool.handler({
        component: path.relative(testDir, componentPath),
      });

      // Should not error on valid path
      expect(result.isError).to.be.undefined;
    });

    it('should accept optional searchPaths', async () => {
      const tool = createPageDesignerDecoratorTool(services);
      createTestComponent(testDir, 'SearchComponent');

      const result = await tool.handler({
        component: 'SearchComponent',
        searchPaths: ['src/components'],
      });

      // Should not error with searchPaths
      expect(result.isError).to.be.undefined;
    });

    it('should accept optional autoMode flag', async () => {
      const tool = createPageDesignerDecoratorTool(services);
      createTestComponent(testDir, 'AutoModeComponent');

      const result = await tool.handler({
        component: 'AutoModeComponent',
        autoMode: true,
      });

      // Should not error with autoMode
      expect(result.isError).to.be.undefined;
    });

    it('should accept optional componentId', async () => {
      const tool = createPageDesignerDecoratorTool(services);
      createTestComponent(testDir, 'CustomIdComponent');

      const result = await tool.handler({
        component: 'CustomIdComponent',
        componentId: 'custom-component-id',
        autoMode: true,
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.include('custom-component-id');
    });

    it('should accept conversationContext with all steps', async () => {
      const tool = createPageDesignerDecoratorTool(services);
      createTestComponent(testDir, 'ConversationComponent');

      const steps = ['analyze', 'select_props', 'configure_attrs', 'configure_regions', 'confirm_generation'];

      const results = await Promise.all(
        steps.map((step) =>
          tool.handler({
            component: 'ConversationComponent',
            conversationContext: {
              step: step as 'analyze' | 'configure_attrs' | 'configure_regions' | 'confirm_generation' | 'select_props',
            },
          }),
        ),
      );

      // Should not error on valid step
      for (const [i, step] of steps.entries()) {
        const result = results[i];
        if (step === 'select_props' || step === 'confirm_generation') {
          // These steps require metadata, so they'll error without it
          // But the step itself should be accepted
          expect(result).to.exist;
        } else {
          expect(result.isError).to.be.undefined;
        }
      }
    });
  });

  describe('output format', () => {
    it('should return text content in ToolResult format', async () => {
      const tool = createPageDesignerDecoratorTool(services);
      createTestComponent(testDir, 'FormatComponent');

      const result = await tool.handler({
        component: 'FormatComponent',
      });

      expect(result).to.have.property('content');
      expect(result.content).to.be.an('array');
      expect(result.content.length).to.be.greaterThan(0);
      expect(result.content[0]).to.have.property('type', 'text');
      expect(result.content[0]).to.have.property('text');
    });

    it('should return error format when component not found', async () => {
      const tool = createPageDesignerDecoratorTool(services);

      const result = await tool.handler({
        component: 'NonExistentComponent',
      });

      expect(result.isError).to.be.true;
      expect(result.content).to.be.an('array');
      expect(result.content[0]).to.have.property('type', 'text');
    });
  });
});
