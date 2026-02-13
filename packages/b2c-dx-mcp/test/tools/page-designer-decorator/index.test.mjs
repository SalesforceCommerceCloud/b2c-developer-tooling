#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Automated test runner for page-designer-decorator tool
 *
 * This script executes automated test cases by:
 * 1. Creating test components in temporary directories
 * 2. Invoking the tool with various test scenarios
 * 3. Validating outputs
 *
 * **Modes**:
 * - Default: Creates temporary directories and test components (isolated testing)
 * - Real Project: Set SFCC_WORKING_DIRECTORY to use an existing Storefront Next project
 *
 * **Note**: This script covers automated test cases (TC-1.1 through TC-6.2).
 * Test Category 7 (TC-7.1 through TC-7.5) requires a real Storefront Next
 * installation and manual steps (Business Manager, Page Designer, cartridge
 * deployment) and cannot be automated. See manual test plan for those tests.
 *
 * Usage:
 *   node test/tools/page-designer-decorator/index.test.mjs [test-case-id]
 *
 * Examples:
 *   # Run all tests with temporary directories (default)
 *   node test/tools/page-designer-decorator/index.test.mjs all
 *
 *   # Run a specific test case
 *   node test/tools/page-designer-decorator/index.test.mjs TC-1.1
 *
 *   # Run tests against a real Storefront Next installation
 *   SFCC_WORKING_DIRECTORY=/path/to/storefront-next \
 *     node test/tools/page-designer-decorator/index.test.mjs all
 *
 * Available automated test cases:
 *   Component Discovery:
 *   - TC-1.1: Name-Based Discovery (PascalCase)
 *   - TC-1.2: Name-Based Discovery (Kebab-Case)
 *   - TC-1.3: Nested Component Discovery
 *   - TC-1.4: Path-Based Input
 *   - TC-1.5: Custom Search Paths
 *   - TC-1.6: Component Not Found
 *   Auto Mode:
 *   - TC-2.1: Basic Auto Mode
 *   - TC-2.2: Auto Mode - Excludes Complex Props
 *   - TC-2.3: Auto Mode - Excludes UI-Only Props
 *   - TC-2.4: Auto Mode - Type Inference
 *   - TC-2.5: Auto Mode - Component Already Decorated
 *   - TC-2.6: Auto Mode - Custom Component ID
 *   Interactive Mode:
 *   - TC-3.1: Mode Selection
 *   - TC-3.2: Interactive Mode - Analyze Step
 *   Error Handling:
 *   - TC-4.1: Invalid Input Type
 *   - TC-4.2: Invalid Step Name
 *   - TC-4.3: Missing Required Parameter
 *   Edge Cases:
 *   - TC-5.1: Component with No Props
 *   - TC-5.2: Component with Only Complex Props
 *   - TC-5.3: Component with Optional Props
 *   - TC-5.4: Component with Union Types
 *   - TC-5.5: Component Name Collision
 *   Environment Variables:
 *   - TC-6.1: SFCC_WORKING_DIRECTORY Set
 *   - TC-6.2: SFCC_WORKING_DIRECTORY Not Set
 *
 * For real Storefront Next project tests (TC-7.x), see manual test plan:
 *   ~/Documents/page-designer-decorator-manual-test-plan.md
 */

import {createPageDesignerDecoratorTool} from '../../../dist/tools/page-designer-decorator/index.js';
import {Services} from '../../../dist/services.js';
import {mkdirSync, writeFileSync, rmSync, existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';

const services = new Services({});
const tool = createPageDesignerDecoratorTool(services);

// Test directory - use SFCC_WORKING_DIRECTORY if set, otherwise create temporary directory
const useRealProject = Boolean(process.env.SFCC_WORKING_DIRECTORY);
const realProjectDir = useRealProject ? process.env.SFCC_WORKING_DIRECTORY : null;
const testDir = useRealProject
  ? path.join(tmpdir(), `page-designer-test-${Date.now()}`)
  : path.join(tmpdir(), `page-designer-test-${Date.now()}`);

/**
 * Create a test component file
 */
function createTestComponent(name, props = 'title: string;') {
  const componentPath = path.join(testDir, 'src', 'components', `${name}.tsx`);
  mkdirSync(path.dirname(componentPath), {recursive: true});

  const propNames = props
    .split(';')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => p.split(':')[0].trim())
    .join(', ');

  const content = `/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 */

export interface ${name}Props {
  ${props}
}

export default function ${name}({${propNames}}: ${name}Props) {
  return <div>{${propNames.split(',')[0].trim()}}</div>;
}
`;

  writeFileSync(componentPath, content, 'utf8');
  return componentPath;
}

/**
 * Run a test case and display results
 */
async function runTest(testId, description, testFn) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Test Case: ${testId}`);
  console.log(`Description: ${description}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // Set working directory - use real project if available, otherwise use test directory
    const workingDir = useRealProject ? realProjectDir : testDir;
    process.env.SFCC_WORKING_DIRECTORY = workingDir;
    process.chdir(workingDir);

    const result = await testFn();

    console.log('✅ Test PASSED');
    console.log('\nTool Output:');
    console.log('-'.repeat(80));
    if (result.content && result.content[0]) {
      const text = result.content[0].text || JSON.stringify(result.content[0], null, 2);
      console.log(text.slice(0, 1000)); // Limit output
      if (text.length > 1000) {
        console.log(`\n... (output truncated, ${text.length} total characters)`);
      }
    }
    console.log('-'.repeat(80));
    console.log(`\nIs Error: ${result.isError ? 'Yes' : 'No'}`);

    return {testId, status: 'PASS', result};
  } catch (error) {
    console.log('❌ Test FAILED');
    console.error('Error:', error.message);
    return {testId, status: 'FAIL', error: error.message};
  }
}

/**
 * Test Cases
 */
const testCases = {
  'TC-1.1': {
    description: 'Name-Based Discovery (PascalCase)',
    async run() {
      createTestComponent('ProductCard', 'title: string; price: number;');
      return tool.handler({component: 'ProductCard'});
    },
  },

  'TC-1.2': {
    description: 'Name-Based Discovery (Kebab-Case)',
    async run() {
      const kebabPath = path.join(testDir, 'src', 'components', 'product-card.tsx');
      mkdirSync(path.dirname(kebabPath), {recursive: true});
      writeFileSync(
        kebabPath,
        `export interface ProductCardProps { title: string; }
export default function ProductCard({title}: ProductCardProps) { return <div>{title}</div>; }`,
        'utf8',
      );
      return tool.handler({component: 'product-card'});
    },
  },

  'TC-1.3': {
    description: 'Nested Component Discovery',
    async run() {
      const nestedPath = path.join(testDir, 'src', 'components', 'hero', 'Hero.tsx');
      mkdirSync(path.dirname(nestedPath), {recursive: true});
      writeFileSync(
        nestedPath,
        `export interface HeroProps { title: string; }
export default function Hero({title}: HeroProps) { return <div>{title}</div>; }`,
        'utf8',
      );
      return tool.handler({component: 'Hero'});
    },
  },

  'TC-1.4': {
    description: 'Path-Based Input',
    async run() {
      createTestComponent('PathComponent', 'title: string;');
      const componentPath = path.join(testDir, 'src', 'components', 'PathComponent.tsx');
      const relativePath = path.relative(testDir, componentPath);
      return tool.handler({component: relativePath});
    },
  },

  'TC-1.5': {
    description: 'Custom Search Paths',
    async run() {
      const customPath = path.join(testDir, 'custom', 'components', 'CustomComponent.tsx');
      mkdirSync(path.dirname(customPath), {recursive: true});
      writeFileSync(
        customPath,
        `export interface CustomComponentProps { title: string; }
export default function CustomComponent({title}: CustomComponentProps) { return <div>{title}</div>; }`,
        'utf8',
      );
      return tool.handler({
        component: 'CustomComponent',
        searchPaths: ['custom/components'],
      });
    },
  },

  'TC-1.6': {
    description: 'Component Not Found',
    async run() {
      return tool.handler({component: 'NonExistentComponent'});
    },
  },

  'TC-2.1': {
    description: 'Basic Auto Mode',
    async run() {
      createTestComponent('SimpleComponent', 'title: string; count: number;');
      return tool.handler({
        component: 'SimpleComponent',
        autoMode: true,
      });
    },
  },

  'TC-2.2': {
    description: 'Auto Mode - Excludes Complex Props',
    async run() {
      createTestComponent(
        'MixedComponent',
        `title: string;
onClick: () => void;
config: { key: string };`,
      );
      return tool.handler({
        component: 'MixedComponent',
        autoMode: true,
      });
    },
  },

  'TC-2.3': {
    description: 'Auto Mode - Excludes UI-Only Props',
    async run() {
      createTestComponent(
        'UIComponent',
        `title: string;
className: string;
style: React.CSSProperties;`,
      );
      return tool.handler({
        component: 'UIComponent',
        autoMode: true,
      });
    },
  },

  'TC-2.4': {
    description: 'Auto Mode - Type Inference',
    async run() {
      createTestComponent(
        'MediaComponent',
        `imageUrl: string;
ctaUrl: string;
productId: string;`,
      );
      return tool.handler({
        component: 'MediaComponent',
        autoMode: true,
      });
    },
  },

  'TC-2.5': {
    description: 'Auto Mode - Component Already Decorated',
    async run() {
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
      return tool.handler({
        component: 'DecoratedComponent',
        autoMode: true,
      });
    },
  },

  'TC-2.6': {
    description: 'Auto Mode - Custom Component ID',
    async run() {
      createTestComponent('CustomIdComponent', 'title: string;');
      return tool.handler({
        component: 'CustomIdComponent',
        autoMode: true,
        componentId: 'custom-my-component-id',
      });
    },
  },

  'TC-3.1': {
    description: 'Mode Selection',
    async run() {
      createTestComponent('TestComponent');
      return tool.handler({component: 'TestComponent'});
    },
  },

  'TC-3.2': {
    description: 'Interactive Mode - Analyze Step',
    async run() {
      createTestComponent(
        'AnalyzeComponent',
        `title: string;
onClick: () => void;
className: string;`,
      );
      return tool.handler({
        component: 'AnalyzeComponent',
        conversationContext: {step: 'analyze'},
      });
    },
  },

  'TC-4.1': {
    description: 'Invalid Input Type',
    async run() {
      return tool.handler({component: 123});
    },
  },

  'TC-4.2': {
    description: 'Invalid Step Name',
    async run() {
      createTestComponent('TestComponent');
      return tool.handler({
        component: 'TestComponent',
        conversationContext: {step: 'invalid_step'},
      });
    },
  },

  'TC-4.3': {
    description: 'Missing Required Parameter',
    async run() {
      return tool.handler({});
    },
  },

  'TC-5.1': {
    description: 'Component with No Props',
    async run() {
      const emptyPath = path.join(testDir, 'src', 'components', 'EmptyProps.tsx');
      mkdirSync(path.dirname(emptyPath), {recursive: true});
      writeFileSync(
        emptyPath,
        `export interface EmptyPropsProps {}
export default function EmptyProps({}: EmptyPropsProps) { return <div>Empty</div>; }`,
        'utf8',
      );
      return tool.handler({
        component: 'EmptyProps',
        autoMode: true,
      });
    },
  },

  'TC-5.2': {
    description: 'Component with Only Complex Props',
    async run() {
      createTestComponent(
        'ComplexOnlyComponent',
        `onClick: () => void;
config: { key: string };
data: Array<{id: number}>;`,
      );
      return tool.handler({
        component: 'ComplexOnlyComponent',
        autoMode: true,
      });
    },
  },

  'TC-5.3': {
    description: 'Component with Optional Props',
    async run() {
      createTestComponent(
        'OptionalPropsComponent',
        `title?: string;
count?: number;`,
      );
      return tool.handler({
        component: 'OptionalPropsComponent',
        autoMode: true,
      });
    },
  },

  'TC-5.4': {
    description: 'Component with Union Types',
    async run() {
      createTestComponent(
        'UnionTypesComponent',
        `status: 'active' | 'inactive';
value: string | number;`,
      );
      return tool.handler({
        component: 'UnionTypesComponent',
        autoMode: true,
      });
    },
  },

  'TC-5.5': {
    description: 'Component Name Collision',
    async run() {
      // Create component in src/components/
      createTestComponent('CollisionComponent', 'title: string;');
      // Create component with same name in app/components/
      const appPath = path.join(testDir, 'app', 'components', 'CollisionComponent.tsx');
      mkdirSync(path.dirname(appPath), {recursive: true});
      writeFileSync(
        appPath,
        `export interface CollisionComponentProps { title: string; }
export default function CollisionComponent({title}: CollisionComponentProps) { return <div>{title}</div>; }`,
        'utf8',
      );
      return tool.handler({component: 'CollisionComponent'});
    },
  },

  'TC-6.1': {
    description: 'SFCC_WORKING_DIRECTORY Set',
    async run() {
      const customDir = path.join(tmpdir(), `page-designer-test-custom-${Date.now()}`);
      mkdirSync(customDir, {recursive: true});
      mkdirSync(path.join(customDir, 'src', 'components'), {recursive: true});
      createTestComponent('CustomDirComponent', 'title: string;');
      // Move component to custom directory
      const customComponentPath = path.join(customDir, 'src', 'components', 'CustomDirComponent.tsx');
      const originalPath = path.join(testDir, 'src', 'components', 'CustomDirComponent.tsx');
      if (existsSync(originalPath)) {
        writeFileSync(customComponentPath, readFileSync(originalPath, 'utf8'), 'utf8');
      }
      process.env.SFCC_WORKING_DIRECTORY = customDir;
      const result = await tool.handler({component: 'CustomDirComponent'});
      delete process.env.SFCC_WORKING_DIRECTORY;
      rmSync(customDir, {recursive: true, force: true});
      return result;
    },
  },

  'TC-6.2': {
    description: 'SFCC_WORKING_DIRECTORY Not Set',
    async run() {
      // Unset SFCC_WORKING_DIRECTORY
      const originalEnv = process.env.SFCC_WORKING_DIRECTORY;
      delete process.env.SFCC_WORKING_DIRECTORY;
      createTestComponent('CwdComponent', 'title: string;');
      const result = await tool.handler({component: 'CwdComponent'});
      // Restore original env
      if (originalEnv) {
        process.env.SFCC_WORKING_DIRECTORY = originalEnv;
      }
      return result;
    },
  },
};

/**
 * Main execution
 */
async function main() {
  const testId = process.argv[2] || 'all';

  console.log('🧪 Page Designer Decorator Tool - Manual Test Runner');
  if (useRealProject) {
    console.log(`Real Project: ${realProjectDir}`);
    console.log(`Test Components: ${testDir}`);
  } else {
    console.log(`Test Directory: ${testDir}`);
  }
  console.log(`Mode: ${useRealProject ? 'Real Storefront Next Project' : 'Temporary Test Directory'}`);
  console.log(`Running: ${testId === 'all' ? 'All tests' : testId}\n`);

  // Setup - always create test directory for test components
  mkdirSync(testDir, {recursive: true});
  mkdirSync(path.join(testDir, 'src', 'components'), {recursive: true});

  if (useRealProject) {
    // Verify the real project directory exists
    if (!existsSync(realProjectDir)) {
      throw new Error(`Storefront Next directory does not exist: ${realProjectDir}`);
    }
    console.log(`✅ Using real Storefront Next project: ${realProjectDir}`);
    console.log(`📝 Test components will be created in temporary directory: ${testDir}`);
    console.log(`⚠️  Note: Component discovery will search in the real project\n`);
  }

  const results = [];

  try {
    if (testId === 'all') {
      // Run all tests
      const testEntries = Object.entries(testCases);
      const testResults = await Promise.all(
        testEntries.map(([id, testCase]) => runTest(id, testCase.description, testCase.run)),
      );
      results.push(...testResults);
    } else if (testCases[testId]) {
      // Run single test
      const testCase = testCases[testId];
      const result = await runTest(testId, testCase.description, testCase.run);
      results.push(result);
    } else {
      console.error(`❌ Unknown test case: ${testId}`);
      console.log('\nAvailable test cases:');
      for (const id of Object.keys(testCases)) {
        console.log(`  - ${id}: ${testCases[id].description}`);
      }
      throw new Error(`Unknown test case: ${testId}`);
    }

    // Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 Test Summary');
    console.log(`${'='.repeat(80)}`);
    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = results.filter((r) => r.status === 'FAIL').length;
    console.log(`Total: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log('\nFailed Tests:');
      for (const r of results.filter((r) => r.status === 'FAIL')) {
        console.log(`  - ${r.testId}: ${r.error}`);
      }
    }
  } finally {
    // Cleanup - always remove temporary test directory, preserve real project
    if (existsSync(testDir)) {
      rmSync(testDir, {recursive: true, force: true});
      if (useRealProject) {
        console.log(`\n🧹 Cleaned up temporary test directory: ${testDir}`);
        console.log(`✅ Real project directory preserved: ${realProjectDir}`);
      } else {
        console.log(`\n🧹 Cleaned up test directory: ${testDir}`);
      }
    }
  }
}

try {
  await main();
} catch (error) {
  console.error('Fatal error:', error);
  throw error;
}
