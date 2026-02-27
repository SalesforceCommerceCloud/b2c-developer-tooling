/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {globSync} from 'glob';
import {Project, InterfaceDeclaration, PropertySignature} from 'ts-morph';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Component analysis result
 */
export interface ComponentInfo {
  componentName: string;
  interfaceName: null | string;
  hasDecorators: boolean;
  props: PropInfo[];
  exportType: 'default' | 'named';
  filePath: string;
}

/**
 * Property information extracted from component interface
 */
export interface PropInfo {
  name: string;
  type: string;
  optional: boolean;
  isComplex: boolean; // Can't be used directly in Page Designer
  isUIOnly: boolean; // Styling/layout props not suitable for PD
}

/**
 * Type suggestion for attribute configuration
 */
export interface TypeSuggestion {
  type: string;
  reason: string;
  priority: 'high' | 'low' | 'medium';
}

// ============================================================================
// TYPE INFERENCE
// ============================================================================

/**
 * Type mapping from TypeScript to SFCC Page Designer attribute types
 */
const TYPE_MAPPING: Record<string, string> = {
  String: 'string',
  string: 'string',
  Number: 'integer',
  number: 'integer',
  Boolean: 'boolean',
  boolean: 'boolean',
  Date: 'string',
  URL: 'url',
  CMSRecord: 'cms_record',
};

/**
 * Valid SFCC Page Designer attribute types
 */
export const VALID_ATTRIBUTE_TYPES = [
  'string',
  'text',
  'markup',
  'integer',
  'boolean',
  'product',
  'category',
  'file',
  'page',
  'image',
  'url',
  'enum',
  'custom',
  'cms_record',
] as const;

/**
 * Infer Page Designer attribute type from TypeScript type
 */
export function inferPageDesignerType(tsType: string): string {
  if (TYPE_MAPPING[tsType]) {
    return TYPE_MAPPING[tsType];
  }

  if (tsType.includes('|')) {
    const firstType = tsType.split('|')[0].trim();
    return inferPageDesignerType(firstType);
  }

  if (tsType.includes('[]') || tsType.includes('Array<')) {
    return 'string';
  }

  return 'string';
}

/**
 * Check if TypeScript type can be auto-inferred
 */
export function isAutoInferredType(tsType: string): boolean {
  return Boolean(TYPE_MAPPING[tsType]);
}

/**
 * Check if type is too complex for Page Designer
 */
export function isComplexType(tsType: string): boolean {
  return (
    tsType.includes('{') ||
    tsType.includes('<') ||
    tsType.includes('.') ||
    tsType.includes('=>') ||
    tsType.includes('React.') ||
    tsType.startsWith('(')
  );
}

/**
 * Check if property is UI-only
 */
export function isUIOnlyProp(propName: string): boolean {
  const uiPatterns = [
    'classname',
    'style',
    'theme',
    'variant',
    'size',
    'color',
    'loading',
    'disabled',
    'readonly',
    'onclick',
    'onchange',
    'onsubmit',
    'children',
    'key',
    'ref',
  ];
  const nameLower = propName.toLowerCase();
  return uiPatterns.some((pattern) => nameLower.includes(pattern));
}

/**
 * Generate Page Designer attribute type suggestions for a component prop
 *
 * **Inference Strategy:**
 * Uses naming patterns and TypeScript types to suggest appropriate Page Designer types.
 * This reduces manual configuration by auto-detecting common patterns.
 *
 * **Page Designer Types:**
 * - `string`: Default text input
 * - `url`: URL/link inputs (validates URL format)
 * - `image`: Image asset picker
 * - `html`: Rich text editor
 * - `markup`: HTML/markdown editor
 * - `enum`: Dropdown with predefined values
 * - `boolean`: Checkbox
 * - `number`: Numeric input
 * - `product`: Product picker (SFCC-specific)
 * - `category`: Category picker (SFCC-specific)
 *
 * **Heuristics (by priority):**
 * 1. **High Priority**: Strong patterns (url, image, product)
 * 2. **Medium Priority**: Contextual patterns (html, markup)
 * 3. **Low Priority**: Weak signals (description → markup)
 *
 * Multiple suggestions allow developers to choose the best fit.
 *
 * @param propName - Property name from component interface
 * @param tsType - TypeScript type string
 * @returns Array of type suggestions with reasoning and priority
 *
 * @example
 * // URL detection:
 * generateTypeSuggestions('imageUrl', 'string')
 * // => [{ type: 'url', reason: '...', priority: 'high' }]
 *
 * @example
 * // Image detection:
 * generateTypeSuggestions('heroImage', 'string')
 * // => [{ type: 'image', reason: '...', priority: 'high' }]
 *
 * @example
 * // Multiple suggestions:
 * generateTypeSuggestions('description', 'string')
 * // => [
 * //   { type: 'markup', reason: '...', priority: 'low' },
 * //   { type: 'html', reason: '...', priority: 'medium' }
 * // ]
 *
 * @example
 * // Product reference:
 * generateTypeSuggestions('product', 'string')
 * // => [{ type: 'product', reason: '...', priority: 'high' }]
 *
 * @public
 */
export function generateTypeSuggestions(propName: string, tsType: string): TypeSuggestion[] {
  const suggestions: TypeSuggestion[] = [];
  const nameLower = propName.toLowerCase();

  // URL patterns
  if (nameLower.includes('url') || nameLower.includes('link') || nameLower.includes('href')) {
    suggestions.push({
      type: 'url',
      reason: 'Property name suggests URL/link',
      priority: 'high',
    });
  }

  // Image patterns
  if (
    nameLower.includes('image') ||
    nameLower.includes('img') ||
    nameLower.includes('picture') ||
    nameLower.includes('background')
  ) {
    suggestions.push({
      type: 'image',
      reason: 'Property name suggests image asset',
      priority: 'high',
    });
  }

  // Rich text patterns
  if (
    nameLower.includes('html') ||
    nameLower.includes('richtext') ||
    nameLower.includes('content') ||
    nameLower.includes('body')
  ) {
    suggestions.push({
      type: 'markup',
      reason: 'Property name suggests rich content',
      priority: 'medium',
    });
  }

  // Multi-line text patterns
  if (nameLower.includes('description') || nameLower.includes('bio') || nameLower.includes('message')) {
    suggestions.push({
      type: 'text',
      reason: 'Property name suggests multi-line text',
      priority: 'medium',
    });
  }

  // Array patterns
  if (tsType.includes('[]') || tsType.includes('Array<')) {
    suggestions.push({
      type: 'enum',
      reason: 'Array types work best as enums for selection in Page Designer',
      priority: 'high',
    });
  }

  // Product/Category references
  if (nameLower.includes('product') && !nameLower.includes('products')) {
    suggestions.push({
      type: 'product',
      reason: 'Property name suggests product reference',
      priority: 'high',
    });
  }

  if (nameLower.includes('category')) {
    suggestions.push({
      type: 'category',
      reason: 'Property name suggests category reference',
      priority: 'high',
    });
  }

  return suggestions;
}

// ============================================================================
// COMPONENT FILE PARSING
// ============================================================================

/**
 * Extract component name from file content
 *
 * Priority order:
 * 1. export default function X (inline default function)
 * 2. export default X (default export of named identifier, e.g. export default ProductItem)
 * 3. export function X (first named function export)
 * 4. export const X =
 * 5. fallback: 'Component'
 *
 * Note: (2) must be checked before (3) because files may have both "export function Foo"
 * and "export default Bar" — the default export is the primary component.
 */
function extractComponentName(content: string): string {
  const defaultFunctionMatch = content.match(/export\s+default\s+function\s+(\w+)/);
  if (defaultFunctionMatch) {
    return defaultFunctionMatch[1];
  }

  // export default X where X is a named identifier (not "function")
  const defaultNamedMatch = content.match(/export\s+default\s+(?!function\s)(\w+)/);
  if (defaultNamedMatch) {
    return defaultNamedMatch[1];
  }

  const namedFunctionMatch = content.match(/export\s+function\s+(\w+)/);
  if (namedFunctionMatch) {
    return namedFunctionMatch[1];
  }

  const namedConstMatch = content.match(/export\s+const\s+(\w+)\s*=/);
  if (namedConstMatch) {
    return namedConstMatch[1];
  }

  return 'Component';
}

/**
 * Detect export type
 */
function detectExportType(content: string): 'default' | 'named' {
  return content.includes('export default') ? 'default' : 'named';
}

/**
 * Parse component file and extract structure
 */
function parseComponentFile(filePath: string): ComponentInfo {
  const content = readFileSync(filePath, 'utf8');

  const hasDecorators = content.includes('@Component') || content.includes('@PageType');

  if (hasDecorators) {
    return {
      componentName: extractComponentName(content),
      interfaceName: null,
      hasDecorators: true,
      props: [],
      exportType: detectExportType(content),
      filePath,
    };
  }

  const project = new Project({
    useInMemoryFileSystem: true,
    skipAddingFilesFromTsConfig: true,
  });

  const sourceFile = project.createSourceFile(filePath, content);
  const interfaces = sourceFile.getInterfaces();
  const propsInterface = interfaces.find((i: InterfaceDeclaration) => i.getName().includes('Props'));

  if (!propsInterface) {
    return {
      componentName: extractComponentName(content),
      interfaceName: null,
      hasDecorators: false,
      props: [],
      exportType: detectExportType(content),
      filePath,
    };
  }

  const props: PropInfo[] = propsInterface.getProperties().map((prop: PropertySignature) => {
    const name = prop.getName();
    const type = prop.getType().getText();
    const optional = prop.hasQuestionToken();

    return {
      name,
      type,
      optional,
      isComplex: isComplexType(type),
      isUIOnly: isUIOnlyProp(name),
    };
  });

  return {
    componentName: extractComponentName(content),
    interfaceName: propsInterface.getName(),
    hasDecorators: false,
    props,
    exportType: detectExportType(content),
    filePath,
  };
}

// ============================================================================
// COMPONENT ANALYZER
// ============================================================================

/**
 * Component analyzer for Page Designer decorator generation
 */
class ComponentAnalyzer {
  private cache: Map<string, ComponentInfo> = new Map();

  analyzeComponent(filePath: string): ComponentInfo {
    const cached = this.cache.get(filePath);
    if (cached) {
      return cached;
    }

    const analysis = parseComponentFile(filePath);
    this.cache.set(filePath, analysis);

    return analysis;
  }

  clearCache() {
    this.cache.clear();
  }
}

export const componentAnalyzer = new ComponentAnalyzer();

// ============================================================================
// COMPONENT RESOLUTION (Name-Based Lookup)
// ============================================================================

/**
 * Convert PascalCase or camelCase to kebab-case
 *
 * Used for finding components with different naming conventions.
 * React components are typically PascalCase, but file names may be kebab-case.
 *
 * @param str - String to convert (e.g., "ProductCard", "myComponent")
 * @returns Kebab-case string (e.g., "product-card", "my-component")
 *
 * @example
 * toKebabCase('ProductCard') // => 'product-card'
 * toKebabCase('MyButtonComponent') // => 'my-button-component'
 * toKebabCase('heroSection') // => 'hero-section'
 *
 * @internal
 */
function toKebabCase(str: string): string {
  return str
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replaceAll(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Search for component file by name using smart discovery patterns
 *
 * **Search Strategy (in priority order):**
 * 1. Common component directories with exact name (PascalCase)
 * 2. Kebab-case variants of the name
 * 3. Index file patterns (for directory-based components)
 * 4. Broader search in src/
 * 5. Custom search paths (if provided)
 *
 * **Why this order:**
 * - Most projects follow conventions (src/components/)
 * - PascalCase is React standard, checked first
 * - Kebab-case is common for file names
 * - Index files are common for complex components
 * - Fallback to broader search if not in standard locations
 *
 * **Disambiguation:**
 * If multiple files match, prefers the shortest path (closest to root).
 * This typically selects the main component over similar named test/story files.
 *
 * @param componentName - Component name without extension (e.g., "ProductCard", "Hero")
 * @param workspaceRoot - Absolute path to workspace root
 * @param customPaths - Additional directories to search (e.g., ["packages/retail/src"])
 * @returns Absolute file path or null if not found
 *
 * @example
 * // Finds: src/components/product-tile/ProductCard.tsx
 * findComponentByName('ProductCard', '/workspace', undefined)
 *
 * @example
 * // Finds: src/components/hero.tsx or src/components/hero/index.tsx
 * findComponentByName('hero', '/workspace', undefined)
 *
 * @example
 * // Searches in custom paths first
 * findComponentByName('ProductCard', '/workspace', ['packages/retail/src'])
 *
 * @internal
 */
function findComponentByName(componentName: string, workspaceRoot: string, customPaths?: string[]): null | string {
  // Normalize component name (remove file extensions)
  const cleanName = componentName.replace(/\.(tsx?|jsx?)$/, '');
  const kebabName = toKebabCase(cleanName);

  // Search patterns (in order of priority)
  const searchPatterns = [
    // Common component directories (PascalCase)
    `src/components/**/${cleanName}.tsx`,
    `src/components/**/${cleanName}.ts`,
    `app/components/**/${cleanName}.tsx`,
    `components/**/${cleanName}.tsx`,

    // Kebab-case variants
    `src/components/**/${kebabName}.tsx`,
    `app/components/**/${kebabName}.tsx`,
    `components/**/${kebabName}.tsx`,

    // Index file patterns
    `src/components/**/${kebabName}/index.tsx`,
    `app/components/**/${kebabName}/index.tsx`,

    // Anywhere in src/ (broader search)
    `src/**/${cleanName}.tsx`,
    `src/**/${cleanName}.ts`,
    `src/**/${kebabName}.tsx`,

    // Custom search paths (if provided)
    ...(customPaths?.flatMap((path) => [
      `${path}/**/${cleanName}.tsx`,
      `${path}/**/${cleanName}.ts`,
      `${path}/**/${kebabName}.tsx`,
      `${path}/**/${kebabName}/index.tsx`,
    ]) || []),
  ];

  // Search with glob
  for (const pattern of searchPatterns) {
    try {
      const matches = globSync(pattern, {
        cwd: workspaceRoot,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**', '**/out/**'],
      });

      if (matches.length > 0) {
        // If multiple matches, prefer shortest path (closest to root)
        const sorted = matches.sort((a, b) => a.length - b.length);
        return sorted[0];
      }
    } catch {
      // Ignore glob errors and try next pattern
      continue;
    }
  }

  return null;
}

/**
 * Resolve component input (name or path) to absolute file path
 *
 * **This is the main entry point for component discovery.**
 *
 * Supports two input modes:
 * 1. **Name-based** (recommended): Just provide the component name
 * 2. **Path-based** (backward compatible): Provide relative path from workspace
 *
 * **Name-based detection:**
 * Input is treated as a name if it:
 * - Does NOT contain path separators (/ or \)
 * - Does NOT have a file extension (.tsx, .ts, etc.)
 *
 * **Path-based detection:**
 * Input is treated as a path if it:
 * - Contains / or \
 * - Has a file extension
 *
 * @param input - Component name or relative path
 * @param workspaceRoot - Absolute path to workspace root
 * @param searchPaths - Additional directories to search (only used for name-based)
 * @returns Absolute file path to component
 * @throws {Error} If component cannot be found, with detailed search information
 *
 * @example
 * // Name-based (finds automatically):
 * resolveComponent('ProductCard', '/workspace')
 * // => '/workspace/src/components/product-tile/ProductCard.tsx'
 *
 * @example
 * // Path-based (backward compatible):
 * resolveComponent('src/components/ProductCard.tsx', '/workspace')
 * // => '/workspace/src/components/ProductCard.tsx'
 *
 * @example
 * // With custom search paths (for monorepos):
 * resolveComponent('Hero', '/workspace', ['packages/retail/src', 'packages/shared'])
 * // => '/workspace/packages/retail/src/components/Hero.tsx'
 *
 * @example
 * // Error handling:
 * try {
 *   resolveComponent('NonExistent', '/workspace')
 * } catch (err) {
 *   // Error includes:
 *   // - List of searched locations
 *   // - Tried name variations
 *   // - Helpful tips for resolution
 * }
 *
 * @public
 */
export function resolveComponent(input: string, workspaceRoot: string, searchPaths?: string[]): string {
  // Check if input looks like a path (has / or \ or file extension)
  const looksLikePath = input.includes('/') || input.includes('\\') || input.match(/\.(tsx?|jsx?|mjs|cjs|js)$/);

  if (looksLikePath) {
    // Treat as path (backward compatible)
    const fullPath = path.join(workspaceRoot, input);
    if (existsSync(fullPath)) {
      return fullPath;
    }
    throw new Error(
      `Component file not found at path: ${input}\n\n` +
        `Full path checked: ${fullPath}\n\n` +
        `Tips:\n` +
        `  1. Use component name instead (e.g., "ProductCard") for automatic discovery\n` +
        `  2. If components are in a different repo, set --project-directory flag or SFCC_PROJECT_DIRECTORY env var`,
    );
  }

  // Treat as component name - search for it
  const found = findComponentByName(input, workspaceRoot, searchPaths);

  if (!found) {
    const searchLocations = [
      'src/components/**',
      'app/components/**',
      'components/**',
      'src/**',
      ...(searchPaths || []),
    ];

    throw new Error(
      `Component "${input}" not found.\n\n` +
        `Searched in:\n${searchLocations.map((loc) => `  - ${loc}`).join('\n')}\n\n` +
        `Tried variations:\n` +
        `  - ${input}.tsx\n` +
        `  - ${toKebabCase(input)}.tsx\n` +
        `  - ${toKebabCase(input)}/index.tsx\n\n` +
        `Tips:\n` +
        `  1. Provide full path: component: "src/components/ProductCard.tsx"\n` +
        `  2. Add custom search: searchPaths: ["packages/retail/src"]\n` +
        `  3. Check component name spelling and casing\n` +
        `  4. If components are in a different repo, set --project-directory flag or SFCC_PROJECT_DIRECTORY env var`,
    );
  }

  return found;
}
