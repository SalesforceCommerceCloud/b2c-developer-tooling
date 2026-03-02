/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {createPageDesignerDecoratorTool} from '../../../../src/tools/storefrontnext/page-designer-decorator/index.js';
import {generateDecoratorCode} from '../../../../src/tools/storefrontnext/page-designer-decorator/templates/decorator-generator.js';
import {Services} from '../../../../src/services.js';
import type {ToolResult} from '../../../../src/utils/types.js';
import {existsSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {createMockResolvedConfig} from '../../../test-helpers.js';

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
 * @param projectDirectory - Optional project directory (defaults to process.cwd())
 * @returns A new Services instance with empty configuration
 */
function createMockServices(projectDirectory?: string): Services {
  const config = createMockResolvedConfig({projectDirectory});
  return new Services({resolvedConfig: config});
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
 * - Auto mode decorator generation (including edge cases: no props, only complex props, optional props, union types, already decorated)
 * - Interactive mode workflow (all steps)
 * - Component resolution (by name, kebab-case, nested paths, path, custom searchPaths, name collisions)
 * - Input validation
 * - Error handling (invalid input, invalid step name, missing parameters)
 * - Output format validation
 *
 * Tests use temporary directories and mock components to avoid dependencies
 * on real project files.
 */
describe('tools/storefrontnext/page-designer-decorator', () => {
  let services: Services;
  let testDir: string;
  let originalCwd: string;
  const getServices = () => services;

  beforeEach(() => {
    // Create a temporary directory for test components
    testDir = path.join(tmpdir(), `b2c-mcp-test-${Date.now()}`);
    mkdirSync(testDir, {recursive: true});
    originalCwd = process.cwd();
    process.chdir(testDir);
    // Create services with projectDirectory set to test directory
    services = createMockServices(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (existsSync(testDir)) {
      rmSync(testDir, {recursive: true, force: true});
    }
  });

  describe('tool metadata', () => {
    it('should have correct tool name', () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      expect(tool.name).to.equal('storefront_next_page_designer_decorator');
    });

    it('should have comprehensive description', () => {
      const tool = createPageDesignerDecoratorTool(getServices);
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
      const tool = createPageDesignerDecoratorTool(getServices);
      expect(tool.toolsets).to.include('STOREFRONTNEXT');
      expect(tool.toolsets).to.have.lengthOf(1);
    });

    it('should not be GA (generally available)', () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      expect(tool.isGA).to.be.false;
    });
  });

  describe('mode selection', () => {
    it('should show mode selection when called with only component name', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
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

    it('should use projectDirectory from Services', async () => {
      const customDir = path.join(tmpdir(), `b2c-mcp-test-custom-${Date.now()}`);
      mkdirSync(customDir, {recursive: true});
      createTestComponent(customDir, 'CustomComponent');

      // Create services with custom projectDirectory
      const customServices = createMockServices(customDir);
      const tool = createPageDesignerDecoratorTool(() => customServices);

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
      const tool = createPageDesignerDecoratorTool(getServices);
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
      const tool = createPageDesignerDecoratorTool(getServices);
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
      const tool = createPageDesignerDecoratorTool(getServices);
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
      const tool = createPageDesignerDecoratorTool(getServices);
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

    it('should handle component already decorated in auto mode', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      const decoratedPath = path.join(testDir, 'src', 'components', 'DecoratedComponent.tsx');
      mkdirSync(path.dirname(decoratedPath), {recursive: true});
      writeFileSync(
        decoratedPath,
        `import {Component} from '@salesforce/retail-react-app/app/components/page-designer';

@Component({
  id: 'existing-component',
  name: 'Existing Component',
})
export class DecoratedComponentMetadata {
  @AttributeDefinition()
  title!: string;
}

export interface DecoratedComponentProps {
  title: string;
}

export default function DecoratedComponent({title}: DecoratedComponentProps) {
  return <div>{title}</div>;
}`,
        'utf8',
      );

      const result = await tool.handler({
        component: 'DecoratedComponent',
        autoMode: true,
      });

      // Should handle already-decorated components gracefully
      // May return an error or provide guidance
      expect(result).to.exist;
      const text = getResultText(result);
      // Should mention the component is already decorated or provide appropriate guidance
      expect(text).to.match(/decorated|already|existing|Component/i);
    });

    it('should handle component with no props in auto mode', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      const emptyPath = path.join(testDir, 'src', 'components', 'EmptyProps.tsx');
      mkdirSync(path.dirname(emptyPath), {recursive: true});
      writeFileSync(
        emptyPath,
        `export interface EmptyPropsProps {}
export default function EmptyProps({}: EmptyPropsProps) { return <div>Empty</div>; }`,
        'utf8',
      );

      const result = await tool.handler({
        component: 'EmptyProps',
        autoMode: true,
      });

      // Should handle components with no props gracefully
      expect(result).to.exist;
      const text = getResultText(result);
      // Should generate decorator code even with no props (just @Component, no @AttributeDefinition)
      expect(text).to.include('@Component');
      expect(text).to.include('EmptyProps');
    });

    it('should handle component with only complex props in auto mode', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      createTestComponent(
        testDir,
        'ComplexOnlyComponent',
        `onClick: () => void;
config: { key: string };
data: Array<{id: number}>;`,
      );

      const result = await tool.handler({
        component: 'ComplexOnlyComponent',
        autoMode: true,
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      // Should generate decorator code with just @Component (no @AttributeDefinition since all props are complex)
      expect(text).to.include('@Component');
      expect(text).to.include('ComplexOnlyComponent');
      // Should not include complex props in decorators
      const decoratorCodeMatch = text.match(/@AttributeDefinition[\s\S]*?\)/g);
      if (decoratorCodeMatch) {
        const decoratorCode = decoratorCodeMatch.join('\n');
        expect(decoratorCode).to.not.include('onClick');
        expect(decoratorCode).to.not.include('config');
        expect(decoratorCode).to.not.include('data');
      }
    });

    it('should handle component with optional props in auto mode', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      createTestComponent(
        testDir,
        'OptionalPropsComponent',
        `title?: string;
count?: number;`,
      );

      const result = await tool.handler({
        component: 'OptionalPropsComponent',
        autoMode: true,
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      // Should include optional props in generated decorators
      expect(text).to.include('@Component');
      expect(text).to.include('OptionalPropsComponent');
      expect(text).to.include('title');
      expect(text).to.include('count');
    });

    it('should handle component with union types in auto mode', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      createTestComponent(
        testDir,
        'UnionTypesComponent',
        `status: 'active' | 'inactive';
value: string | number;`,
      );

      const result = await tool.handler({
        component: 'UnionTypesComponent',
        autoMode: true,
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);

      // Should handle union types appropriately
      expect(text).to.include('@Component');
      expect(text).to.include('UnionTypesComponent');
      expect(text).to.include('status');
      expect(text).to.include('value');
    });

    it('should auto-configure URL and image type props', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      createTestComponent(
        testDir,
        'UrlImageComponent',
        `heroImageUrl: string;
ctaUrl: string;
backgroundPicture: string;`,
      );

      const result = await tool.handler({
        component: 'UrlImageComponent',
        autoMode: true,
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.include('@Component');
      expect(text).to.include('heroImageUrl');
      expect(text).to.include('ctaUrl');
      expect(text).to.include('backgroundPicture');
    });

    it('should handle named export component in auto mode', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      const namedPath = path.join(testDir, 'src', 'components', 'NamedExportComponent.tsx');
      mkdirSync(path.dirname(namedPath), {recursive: true});
      writeFileSync(
        namedPath,
        `export interface NamedExportComponentProps {
  title: string;
}
export function NamedExportComponent({title}: NamedExportComponentProps) {
  return <div>{title}</div>;
}`,
        'utf8',
      );

      const result = await tool.handler({
        component: 'NamedExportComponent',
        autoMode: true,
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.include('NamedExportComponent');
    });

    it('should handle const export component in auto mode', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      const constPath = path.join(testDir, 'src', 'components', 'ConstExportComponent.tsx');
      mkdirSync(path.dirname(constPath), {recursive: true});
      writeFileSync(
        constPath,
        `export interface ConstExportComponentProps {
  title: string;
}
export const ConstExportComponent = ({title}: ConstExportComponentProps) => {
  return <div>{title}</div>;
};`,
        'utf8',
      );

      const result = await tool.handler({
        component: 'ConstExportComponent',
        autoMode: true,
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.include('ConstExportComponent');
    });
  });

  describe('interactive mode', () => {
    describe('analyze step', () => {
      it('should analyze component in analyze step', async () => {
        const tool = createPageDesignerDecoratorTool(getServices);
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
        const tool = createPageDesignerDecoratorTool(getServices);
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

      it('should detect already-decorated component in analyze step', async () => {
        const tool = createPageDesignerDecoratorTool(getServices);
        const decoratedPath = path.join(testDir, 'src', 'components', 'AlreadyDecoratedAnalyze.tsx');
        mkdirSync(path.dirname(decoratedPath), {recursive: true});
        writeFileSync(
          decoratedPath,
          `import {Component} from '@/lib/decorators/component';

@Component('already-decorated', { name: 'Already Decorated' })
export class AlreadyDecoratedAnalyzeMetadata {}

export interface AlreadyDecoratedAnalyzeProps { title: string; }
export default function AlreadyDecoratedAnalyze({title}: AlreadyDecoratedAnalyzeProps) {
  return <div>{title}</div>;
}`,
          'utf8',
        );

        const result = await tool.handler({
          component: 'AlreadyDecoratedAnalyze',
          conversationContext: {step: 'analyze'},
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);
        expect(text).to.match(/already|decorated|existing/i);
      });

      it('should analyze component with no editable props', async () => {
        const tool = createPageDesignerDecoratorTool(getServices);
        createTestComponent(
          testDir,
          'NoEditableComponent',
          `onClick: () => void;
className: string;`,
        );

        const result = await tool.handler({
          component: 'NoEditableComponent',
          conversationContext: {step: 'analyze'},
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);
        expect(text).to.match(/No suitable|no suitable|⚠️/i);
      });

      it('should analyze component without a Props interface', async () => {
        const tool = createPageDesignerDecoratorTool(getServices);
        const noInterfacePath = path.join(testDir, 'src', 'components', 'NoInterfaceComponent.tsx');
        mkdirSync(path.dirname(noInterfacePath), {recursive: true});
        writeFileSync(
          noInterfacePath,
          `export default function NoInterfaceComponent() {
  return <div>Hello</div>;
}`,
          'utf8',
        );

        const result = await tool.handler({
          component: 'NoInterfaceComponent',
          conversationContext: {step: 'analyze'},
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);
        expect(text).to.include('None found');
      });
    });

    describe('select_props step', () => {
      it('should confirm selected props', async () => {
        const tool = createPageDesignerDecoratorTool(getServices);
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
        const tool = createPageDesignerDecoratorTool(getServices);
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

      it('should confirm with new attributes and no selected props', async () => {
        const tool = createPageDesignerDecoratorTool(getServices);
        createTestComponent(testDir, 'NewAttrsSelectComponent');

        const result = await tool.handler({
          component: 'NewAttrsSelectComponent',
          conversationContext: {
            step: 'select_props',
            selectedProps: [],
            newAttributes: [
              {name: 'ctaLabel', description: 'Call to action label', required: true},
              {name: 'subtitle'},
            ],
            componentMetadata: {
              id: 'new-attrs-select',
              name: 'New Attrs Select',
              description: 'Test with new attributes',
              group: 'custom_group',
            },
          },
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);
        expect(text).to.include('ctaLabel');
        expect(text).to.include('Call to action label');
        expect(text).to.include('None');
      });
    });

    describe('configure_attrs step', () => {
      it('should provide attribute configuration instructions', async () => {
        const tool = createPageDesignerDecoratorTool(getServices);
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
        const tool = createPageDesignerDecoratorTool(getServices);
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

      it('should handle mix of auto-inferred and needs-config attrs', async () => {
        const tool = createPageDesignerDecoratorTool(getServices);
        createTestComponent(testDir, 'MixedAttrsComponent', 'count: number; heroImage: string;');

        const result = await tool.handler({
          component: 'MixedAttrsComponent',
          conversationContext: {
            step: 'configure_attrs',
            selectedProps: ['count', 'heroImage'],
          },
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);
        expect(text).to.include('count');
        expect(text).to.include('heroImage');
        expect(text).to.match(/auto|Auto|infer/i);
      });

      it('should handle new attributes in configure_attrs', async () => {
        const tool = createPageDesignerDecoratorTool(getServices);
        createTestComponent(testDir, 'NewAttrConfigComponent', 'title: string;');

        const result = await tool.handler({
          component: 'NewAttrConfigComponent',
          conversationContext: {
            step: 'configure_attrs',
            selectedProps: ['title'],
            newAttributes: [{name: 'categoryId', description: 'Category reference'}],
          },
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);
        expect(text).to.include('categoryId');
        expect(text).to.match(/category/i);
      });

      it('should handle enum suggestion for array-type props', async () => {
        const tool = createPageDesignerDecoratorTool(getServices);
        createTestComponent(testDir, 'ArrayPropComponent', 'items: string[];');

        const result = await tool.handler({
          component: 'ArrayPropComponent',
          conversationContext: {
            step: 'configure_attrs',
            selectedProps: ['items'],
          },
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);
        expect(text).to.include('items');
      });

      it('should handle non-enum suggestion for URL props', async () => {
        const tool = createPageDesignerDecoratorTool(getServices);
        createTestComponent(testDir, 'UrlOnlyComponent', 'pageUrl: string; title: string;');

        const result = await tool.handler({
          component: 'UrlOnlyComponent',
          conversationContext: {
            step: 'configure_attrs',
            selectedProps: ['pageUrl', 'title'],
          },
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);
        expect(text).to.include('pageUrl');
        expect(text).to.include('title');
      });
    });

    describe('configure_regions step', () => {
      it('should provide region configuration instructions', async () => {
        const tool = createPageDesignerDecoratorTool(getServices);
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
        const tool = createPageDesignerDecoratorTool(getServices);
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
        const tool = createPageDesignerDecoratorTool(getServices);
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

      it('should generate code with regions', async () => {
        const tool = createPageDesignerDecoratorTool(getServices);
        createTestComponent(testDir, 'RegionGenComponent', 'title: string;');

        const result = await tool.handler({
          component: 'RegionGenComponent',
          conversationContext: {
            step: 'confirm_generation',
            selectedProps: ['title'],
            componentMetadata: {
              id: 'region-gen-component',
              name: 'Region Gen Component',
              description: 'Test component with regions',
            },
            regionConfig: {
              enabled: true,
              regions: [
                {
                  id: 'main',
                  name: 'Main Content',
                  description: 'Primary content area',
                  maxComponents: 5,
                  componentTypeInclusions: ['text-block', 'image-block'],
                  componentTypeExclusions: ['layout-grid'],
                },
                {
                  id: 'sidebar',
                  name: 'Sidebar',
                },
              ],
            },
          },
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);
        expect(text).to.include('@Component');
        expect(text).to.include('RegionDefinition');
        expect(text).to.include('main');
        expect(text).to.include('Main Content');
        expect(text).to.include('Primary content area');
        expect(text).to.include('maxComponents');
        expect(text).to.include('componentTypeInclusions');
        expect(text).to.include('componentTypeExclusions');
        expect(text).to.include('sidebar');
        expect(text).to.include('Sidebar');
        expect(text).to.match(/region|Region/i);
      });

      it('should generate code with fully configured attributes', async () => {
        const tool = createPageDesignerDecoratorTool(getServices);
        createTestComponent(testDir, 'ConfiguredAttrComponent', 'heroImage: string; variant: string;');

        const result = await tool.handler({
          component: 'ConfiguredAttrComponent',
          conversationContext: {
            step: 'confirm_generation',
            selectedProps: ['heroImage', 'variant'],
            componentMetadata: {
              id: 'configured-attr',
              name: 'Configured Attr',
              description: 'Test with full config',
              group: 'custom_group',
            },
            attributeConfig: {
              heroImage: {
                type: 'image',
                name: 'Hero Image',
              },
              variant: {
                type: 'enum',
                name: 'Variant',
                defaultValue: 'primary',
                values: ['primary', 'secondary', 'outline'],
              },
            },
          },
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);
        expect(text).to.include('@AttributeDefinition');
        expect(text).to.include("type: 'image'");
        expect(text).to.include('Hero Image');
        expect(text).to.include("type: 'enum'");
        expect(text).to.include("'primary'");
        expect(text).to.include("'secondary'");
        expect(text).to.include("'outline'");
        expect(text).to.include('defaultValue');
        expect(text).to.include('custom_group');
      });

      it('should generate code with new attributes only', async () => {
        const tool = createPageDesignerDecoratorTool(getServices);
        createTestComponent(testDir, 'NewAttrsComponent');

        const result = await tool.handler({
          component: 'NewAttrsComponent',
          conversationContext: {
            step: 'confirm_generation',
            selectedProps: [],
            newAttributes: [{name: 'ctaLabel', required: true}, {name: 'subtitle'}],
            componentMetadata: {
              id: 'new-attrs',
              name: 'New Attrs',
              description: 'Test with new attributes',
            },
          },
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);
        expect(text).to.include('@Component');
        expect(text).to.include('ctaLabel');
        expect(text).to.include('subtitle');
      });

      it('should use default group when group is omitted', async () => {
        const tool = createPageDesignerDecoratorTool(getServices);
        createTestComponent(testDir, 'NoGroupComponent', 'title: string;');

        const result = await tool.handler({
          component: 'NoGroupComponent',
          conversationContext: {
            step: 'confirm_generation',
            selectedProps: ['title'],
            componentMetadata: {
              id: 'no-group',
              name: 'No Group',
              description: 'Test without group',
            },
          },
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);
        expect(text).to.include('odyssey_base');
      });

      it('should generate code with disabled region config', async () => {
        const tool = createPageDesignerDecoratorTool(getServices);
        createTestComponent(testDir, 'DisabledRegionComponent', 'title: string;');

        const result = await tool.handler({
          component: 'DisabledRegionComponent',
          conversationContext: {
            step: 'confirm_generation',
            selectedProps: ['title'],
            componentMetadata: {
              id: 'disabled-region',
              name: 'Disabled Region',
              description: 'Test with disabled regions',
            },
            regionConfig: {
              enabled: false,
              regions: [{id: 'main', name: 'Main'}],
            },
          },
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);
        expect(text).to.include('@Component');
        expect(text).to.not.include('RegionDefinition');
      });

      it('should generate code with non-string defaultValue', async () => {
        const tool = createPageDesignerDecoratorTool(getServices);
        createTestComponent(testDir, 'DefaultValComponent', 'count: number;');

        const result = await tool.handler({
          component: 'DefaultValComponent',
          conversationContext: {
            step: 'confirm_generation',
            selectedProps: ['count'],
            componentMetadata: {
              id: 'default-val',
              name: 'Default Val',
              description: 'Test with non-string default',
            },
            attributeConfig: {
              count: {
                type: 'integer',
                name: 'Count',
                defaultValue: 42,
              },
            },
          },
        });

        expect(result.isError).to.be.undefined;
        const text = getResultText(result);
        expect(text).to.include('defaultValue: 42');
      });
    });
  });

  describe('error handling', () => {
    it('should handle non-existent component gracefully', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);

      const result = await tool.handler({
        component: 'NonExistentComponent',
      });

      // Should return an error result
      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.match(/not found|error|Error/i);
    });

    it('should handle invalid input gracefully', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);

      // Invalid input should be caught by zod validation
      const result = await tool.handler({
        component: 123, // Invalid type
      } as unknown as Record<string, unknown>);

      // Should return an error result
      expect(result.isError).to.be.true;
    });

    it('should handle invalid step name', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      createTestComponent(testDir, 'TestComponent');

      const result = await tool.handler({
        component: 'TestComponent',
        conversationContext: {step: 'invalid_step'},
      } as unknown as Record<string, unknown>);

      // Should return an error result for invalid step
      expect(result.isError).to.be.true;
    });

    it('should handle missing required parameter', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);

      const result = await tool.handler({} as unknown as Record<string, unknown>);

      // Should return an error result
      expect(result.isError).to.be.true;
    });

    it('should handle path-based component not found', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);

      const result = await tool.handler({
        component: 'src/components/DoesNotExist.tsx',
      });

      expect(result.isError).to.be.true;
      const text = getResultText(result);
      expect(text).to.match(/not found|Error/i);
    });
  });

  describe('component resolution', () => {
    it('should find component by name in standard location', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      createTestComponent(testDir, 'StandardLocationComponent');

      const result = await tool.handler({
        component: 'StandardLocationComponent',
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.include('StandardLocationComponent');
    });

    it('should find component by kebab-case name', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      const kebabPath = path.join(testDir, 'src', 'components', 'product-card.tsx');
      mkdirSync(path.dirname(kebabPath), {recursive: true});
      writeFileSync(
        kebabPath,
        `export interface ProductCardProps { title: string; }
export default function ProductCard({title}: ProductCardProps) { return <div>{title}</div>; }`,
        'utf8',
      );

      const result = await tool.handler({
        component: 'product-card',
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.match(/ProductCard|product-card/i);
    });

    it('should find nested component by name', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      const nestedPath = path.join(testDir, 'src', 'components', 'hero', 'Hero.tsx');
      mkdirSync(path.dirname(nestedPath), {recursive: true});
      writeFileSync(
        nestedPath,
        `export interface HeroProps { title: string; }
export default function Hero({title}: HeroProps) { return <div>{title}</div>; }`,
        'utf8',
      );

      const result = await tool.handler({
        component: 'Hero',
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.include('Hero');
    });

    it('should find component by path', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      const componentPath = createTestComponent(testDir, 'PathComponent');

      const result = await tool.handler({
        component: path.relative(testDir, componentPath),
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.include('PathComponent');
    });

    it('should use searchPaths when provided', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
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

    it('should handle component name collision', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      // Create component in src/components/
      createTestComponent(testDir, 'CollisionComponent', 'title: string;');
      // Create component with same name in app/components/
      const appPath = path.join(testDir, 'app', 'components', 'CollisionComponent.tsx');
      mkdirSync(path.dirname(appPath), {recursive: true});
      writeFileSync(
        appPath,
        `export interface CollisionComponentProps { title: string; }
export default function CollisionComponent({title}: CollisionComponentProps) { return <div>{title}</div>; }`,
        'utf8',
      );

      const result = await tool.handler({
        component: 'CollisionComponent',
      });

      // Should find one of the components (likely the first one found)
      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      expect(text).to.include('CollisionComponent');
    });

    it('should pick default export over first named export (export default X pattern)', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      // Simulate product-item/index.tsx: has export function X (helper) and export default Y (main)
      const productItemDir = path.join(testDir, 'src', 'components', 'product-item');
      mkdirSync(productItemDir, {recursive: true});
      const indexPath = path.join(productItemDir, 'index.tsx');
      writeFileSync(
        indexPath,
        `export interface ProductItemProps { productId: string; }

export function ProductItemVariantImage() { return null; }
export function ProductItemVariantAttributes() { return null; }

function ProductItem({ productId }: ProductItemProps) {
  return <div>{productId}</div>;
}

export default ProductItem;
`,
        'utf8',
      );

      const result = await tool.handler({
        component: 'ProductItem',
        autoMode: true,
      });

      expect(result.isError).to.be.undefined;
      const text = getResultText(result);
      // Must target ProductItem (default export), not ProductItemVariantImage (first named export)
      expect(text).to.include('ProductItem');
      expect(text).not.to.include('ProductItemVariantImage');
    });
  });

  describe('input validation', () => {
    it('should accept valid component name', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      createTestComponent(testDir, 'ValidComponent');

      const result = await tool.handler({
        component: 'ValidComponent',
      });

      // Should not error on valid input
      expect(result.isError).to.be.undefined;
    });

    it('should accept component path', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      const componentPath = createTestComponent(testDir, 'PathComponent');

      const result = await tool.handler({
        component: path.relative(testDir, componentPath),
      });

      // Should not error on valid path
      expect(result.isError).to.be.undefined;
    });

    it('should accept optional searchPaths', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      createTestComponent(testDir, 'SearchComponent');

      const result = await tool.handler({
        component: 'SearchComponent',
        searchPaths: ['src/components'],
      });

      // Should not error with searchPaths
      expect(result.isError).to.be.undefined;
    });

    it('should accept optional autoMode flag', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
      createTestComponent(testDir, 'AutoModeComponent');

      const result = await tool.handler({
        component: 'AutoModeComponent',
        autoMode: true,
      });

      // Should not error with autoMode
      expect(result.isError).to.be.undefined;
    });

    it('should accept optional componentId', async () => {
      const tool = createPageDesignerDecoratorTool(getServices);
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
      const tool = createPageDesignerDecoratorTool(getServices);
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
      const tool = createPageDesignerDecoratorTool(getServices);
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
      const tool = createPageDesignerDecoratorTool(getServices);

      const result = await tool.handler({
        component: 'NonExistentComponent',
      });

      expect(result.isError).to.be.true;
      expect(result.content).to.be.an('array');
      expect(result.content[0]).to.have.property('type', 'text');
    });
  });

  describe('generateDecoratorCode', () => {
    it('should skip imports when needsImports is false', () => {
      const code = generateDecoratorCode({
        needsImports: false,
        componentId: 'test-comp',
        componentName: 'Test Comp',
        componentDescription: 'A test',
        componentGroup: 'test_group',
        metadataClassName: 'TestCompMetadata',
        hasAttributes: false,
        hasRegions: false,
        hasLoader: false,
        regions: [],
        attributes: [],
      });

      expect(code).to.not.include('import');
      expect(code).to.include('@Component');
      expect(code).to.include('TestCompMetadata');
    });

    it('should omit group line when componentGroup is empty', () => {
      const code = generateDecoratorCode({
        needsImports: true,
        componentId: 'no-group',
        componentName: 'No Group',
        componentDescription: 'Test',
        componentGroup: '',
        metadataClassName: 'NoGroupMetadata',
        hasAttributes: false,
        hasRegions: false,
        hasLoader: false,
        regions: [],
        attributes: [],
      });

      expect(code).to.not.include('group:');
    });

    it('should generate configured attributes with required field', () => {
      const code = generateDecoratorCode({
        needsImports: true,
        componentId: 'req-attr',
        componentName: 'Req Attr',
        componentDescription: 'Test',
        metadataClassName: 'ReqAttrMetadata',
        hasAttributes: true,
        hasRegions: false,
        hasLoader: false,
        regions: [],
        attributes: [
          {
            name: 'title',
            tsType: 'string',
            optional: false,
            hasConfig: true,
            config: {
              name: 'Title',
              type: 'string',
              required: true,
              description: 'The main title',
              id: 'title-field',
            },
          },
        ],
      });

      expect(code).to.include('required: true');
      expect(code).to.include("id: 'title-field'");
      expect(code).to.include("description: 'The main title'");
    });

    it('should generate regions with all optional fields', () => {
      const code = generateDecoratorCode({
        needsImports: true,
        componentId: 'full-region',
        componentName: 'Full Region',
        componentDescription: 'Test',
        metadataClassName: 'FullRegionMetadata',
        hasAttributes: false,
        hasRegions: true,
        hasLoader: false,
        regions: [
          {
            id: 'main',
            name: 'Main',
            description: 'Main content',
            maxComponents: 10,
            componentTypeInclusions: ['text-block'],
            componentTypeExclusions: ['layout'],
          },
        ],
        attributes: [],
      });

      expect(code).to.include('RegionDefinition');
      expect(code).to.include("description: 'Main content'");
      expect(code).to.include('maxComponents: 10');
      expect(code).to.include("componentTypeInclusions: ['text-block']");
      expect(code).to.include("componentTypeExclusions: ['layout']");
    });

    it('should fall back to simple attribute when hasConfig is true but config is undefined', () => {
      const code = generateDecoratorCode({
        needsImports: false,
        componentId: 'fallback',
        componentName: 'Fallback',
        componentDescription: 'Test',
        metadataClassName: 'FallbackMetadata',
        hasAttributes: true,
        hasRegions: false,
        hasLoader: false,
        regions: [],
        attributes: [
          {
            name: 'title',
            tsType: 'string',
            optional: true,
            hasConfig: true,
            config: undefined,
          },
        ],
      });

      expect(code).to.include('@AttributeDefinition()');
      expect(code).to.include('title?: string');
    });

    it('should handle optional configured attribute', () => {
      const code = generateDecoratorCode({
        needsImports: false,
        componentId: 'opt-config',
        componentName: 'Opt Config',
        componentDescription: 'Test',
        metadataClassName: 'OptConfigMetadata',
        hasAttributes: true,
        hasRegions: false,
        hasLoader: false,
        regions: [],
        attributes: [
          {
            name: 'subtitle',
            tsType: 'string',
            optional: true,
            hasConfig: true,
            config: {type: 'text', name: 'Subtitle'},
          },
        ],
      });

      expect(code).to.include('subtitle?: string');
      expect(code).to.include("type: 'text'");
    });
  });
});
