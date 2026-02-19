/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

export interface AttributeContext {
  name: string;
  tsType: string;
  optional: boolean;
  hasConfig: boolean;
  config?: {
    id?: string;
    type?: string;
    name?: string;
    description?: string;
    defaultValue?: unknown;
    required?: boolean;
    values?: string[];
  };
}

export interface RegionContext {
  id: string;
  name: string;
  description?: string;
  maxComponents?: number;
  componentTypeInclusions?: string[];
  componentTypeExclusions?: string[];
}

export interface MetadataContext {
  needsImports: boolean;
  componentId: string;
  componentName: string;
  componentDescription: string;
  componentGroup?: string;
  metadataClassName: string;
  hasAttributes: boolean;
  hasRegions: boolean;
  hasLoader: boolean;
  regions: RegionContext[];
  attributes: AttributeContext[];
}

/**
 * Generate a simple attribute decorator with auto-inferred type
 *
 * **Simple attributes** use default Page Designer behavior:
 * - Type is inferred from TypeScript type
 * - No custom configuration needed
 * - Minimal decorator syntax
 *
 * **When to use:**
 * - Basic string, number, or boolean props
 * - No special validation or defaults needed
 * - Standard field naming is acceptable
 *
 * @param attr - Attribute context
 * @returns TypeScript code string for the attribute
 *
 * @example
 * // Input:
 * { name: 'title', tsType: 'string', optional: false, hasConfig: false }
 *
 * // Output:
 * `@AttributeDefinition()
 * title!: string;`
 *
 * @internal
 */
function generateSimpleAttribute(attr: AttributeContext): string {
  return `    @AttributeDefinition()
    ${attr.name}${attr.optional ? '?' : '!'}: ${attr.tsType};`;
}

/**
 * Generate a configured attribute decorator with explicit settings
 *
 * **Configured attributes** specify custom Page Designer behavior:
 * - Explicit `type` (url, image, enum, etc.)
 * - Custom `name` for display in Page Designer UI
 * - `description` for merchant guidance
 * - `defaultValue` for new instances
 * - `required` flag for validation
 * - `values` array for enum types
 *
 * **When to use:**
 * - URL, image, or rich text fields (need specific editors)
 * - Enum fields with predefined options
 * - Fields with default values
 * - Fields with merchant-friendly names
 *
 * @param attr - Attribute context with configuration
 * @returns TypeScript code string for the configured attribute
 *
 * @example
 * // Input (URL field):
 * {
 *   name: 'ctaUrl',
 *   tsType: 'string',
 *   optional: false,
 *   hasConfig: true,
 *   config: {
 *     type: 'url',
 *     name: 'CTA Button URL',
 *     description: 'Destination URL for the call-to-action button'
 *   }
 * }
 *
 * // Output:
 * `@AttributeDefinition({
 *     type: 'url',
 *     name: 'CTA Button URL',
 *     description: 'Destination URL for the call-to-action button',
 * })
 * ctaUrl!: string;`
 *
 * @example
 * // Input (Enum field):
 * {
 *   name: 'variant',
 *   tsType: 'string',
 *   optional: false,
 *   hasConfig: true,
 *   config: {
 *     type: 'enum',
 *     name: 'Button Variant',
 *     values: ['primary', 'secondary', 'outline'],
 *     defaultValue: 'primary'
 *   }
 * }
 *
 * // Output:
 * `@AttributeDefinition({
 *     type: 'enum',
 *     name: 'Button Variant',
 *     defaultValue: 'primary',
 *     values: ['primary', 'secondary', 'outline'],
 * })
 * variant!: string;`
 *
 * @internal
 */
function generateConfiguredAttribute(attr: AttributeContext): string {
  if (!attr.config) {
    return generateSimpleAttribute(attr);
  }

  const config = attr.config;
  const configLines: string[] = [];

  if (config.id) {
    configLines.push(`        id: '${config.id}',`);
  }
  if (config.name) {
    configLines.push(`        name: '${config.name}',`);
  }
  if (config.type) {
    configLines.push(`        type: '${config.type}',`);
  }
  if (config.description) {
    configLines.push(`        description: '${config.description}',`);
  }
  if (config.defaultValue !== undefined) {
    const valueStr =
      typeof config.defaultValue === 'string' ? `'${config.defaultValue}'` : JSON.stringify(config.defaultValue);
    configLines.push(`        defaultValue: ${valueStr},`);
  }
  if (config.required !== undefined) {
    configLines.push(`        required: ${config.required},`);
  }
  if (config.values && config.values.length > 0) {
    configLines.push(`        values: [${config.values.map((v) => `'${v}'`).join(', ')}],`);
  }

  return `    @AttributeDefinition({
${configLines.join('\n')}
    })
    ${attr.name}${attr.optional ? '?' : '!'}: ${attr.tsType};`;
}

/**
 * Generate import statements for Page Designer decorators
 *
 * **Decision logic:**
 * - Always imports `Component` (required for all decorated components)
 * - Conditionally imports `AttributeDefinition` (if component has editable props)
 * - Conditionally imports `RegionDefinition` (if component has nested content areas)
 *
 * **Why conditional:**
 * Avoids unused imports that would trigger linting warnings.
 *
 * @param context - Metadata context indicating what's needed
 * @returns TypeScript import statements with trailing newlines
 *
 * @example
 * // Component with attributes only:
 * generateImports({ needsImports: true, hasAttributes: true, hasRegions: false })
 * // => `import { Component } from '@/lib/decorators/component';
 * //     import { AttributeDefinition } from '@/lib/decorators/attribute-definition';\n\n`
 *
 * @example
 * // Component with regions:
 * generateImports({ needsImports: true, hasAttributes: true, hasRegions: true })
 * // => All three decorators imported
 *
 * @internal
 */
function generateImports(context: MetadataContext): string {
  if (!context.needsImports) {
    return '';
  }

  const imports: string[] = [`import { Component } from '@/lib/decorators/component';`];

  if (context.hasAttributes) {
    imports.push(`import { AttributeDefinition } from '@/lib/decorators/attribute-definition';`);
  }

  if (context.hasRegions) {
    imports.push(`import { RegionDefinition } from '@/lib/decorators';`);
  }

  return `${imports.join('\n')}\n\n`;
}

/**
 * Generate @RegionDefinition decorator for nested content areas
 *
 * **Regions** define areas where merchants can add nested components in Page Designer.
 * Common use cases:
 * - Layout containers (grid cells, columns)
 * - Content sections (header, body, footer)
 * - Tab panels, accordion items
 *
 * **Configuration options:**
 * - `id`: Unique identifier for the region
 * - `name`: Display name in Page Designer
 * - `description`: Merchant guidance
 * - `maxComponents`: Limit number of nested components
 * - `componentTypeInclusions`: Whitelist of allowed component types
 * - `componentTypeExclusions`: Blacklist of disallowed component types
 *
 * @param context - Metadata context with region definitions
 * @returns TypeScript code for @RegionDefinition decorator or empty string
 *
 * @example
 * // Simple region:
 * {
 *   hasRegions: true,
 *   regions: [{
 *     id: 'main',
 *     name: 'Main Content Area',
 *     description: 'Add content components here'
 *   }]
 * }
 * // => `@RegionDefinition([
 * //       {
 * //         id: 'main',
 * //         name: 'Main Content Area',
 * //         description: 'Add content components here',
 * //       }
 * //     ])\n`
 *
 * @example
 * // Constrained region:
 * {
 *   hasRegions: true,
 *   regions: [{
 *     id: 'grid',
 *     name: 'Product Grid',
 *     maxComponents: 12,
 *     componentTypeInclusions: ['product-tile', 'product-card']
 *   }]
 * }
 *
 * @internal
 */
function generateRegionDefinition(context: MetadataContext): string {
  if (!context.hasRegions || context.regions.length === 0) {
    return '';
  }

  const regionsDef = context.regions
    .map((region) => {
      const lines: string[] = [`    {`, `        id: '${region.id}',`, `        name: '${region.name}',`];

      if (region.description) {
        lines.push(`        description: '${region.description}',`);
      }
      if (region.maxComponents !== undefined) {
        lines.push(`        maxComponents: ${region.maxComponents},`);
      }
      if (region.componentTypeInclusions && region.componentTypeInclusions.length > 0) {
        lines.push(
          `        componentTypeInclusions: [${region.componentTypeInclusions.map((t) => `'${t}'`).join(', ')}],`,
        );
      }
      if (region.componentTypeExclusions && region.componentTypeExclusions.length > 0) {
        lines.push(
          `        componentTypeExclusions: [${region.componentTypeExclusions.map((t) => `'${t}'`).join(', ')}],`,
        );
      }

      lines.push(`    }`);
      return lines.join('\n');
    })
    .join(',\n');

  return `@RegionDefinition([\n${regionsDef}\n])\n`;
}

/**
 * Generate complete Page Designer decorator code for a React component
 *
 * **This is the main code generation function.**
 *
 * Produces a TypeScript class with decorators that:
 * 1. Registers the component in Page Designer
 * 2. Defines editable attributes (props)
 * 3. Optionally defines nested content regions
 *
 * **Output structure:**
 * ```typescript
 * import { Component } from '...';
 * import { AttributeDefinition } from '...';
 *
 * @Component('component-id', {
 *   name: 'Component Name',
 *   description: '...',
 *   group: 'category'
 * })
 * @RegionDefinition([...]) // Optional
 * export class ComponentMetadata {
 *   @AttributeDefinition({ ... })
 *   prop1!: string;
 *
 *   @AttributeDefinition()
 *   prop2?: number;
 * }
 * ```
 *
 * **Generated code must be:**
 * - Added to the component file (after imports, before component)
 * - Compiled with TypeScript
 * - Used by `generate_page_designer_metadata` tool to create JSON metadata
 *
 * @param context - Complete metadata context
 * @returns TypeScript code string ready to paste into component file
 *
 * @example
 * // Simple component with attributes:
 * generateDecoratorCode({
 *   needsImports: true,
 *   componentId: 'hero-banner',
 *   componentName: 'Hero Banner',
 *   componentDescription: 'Large hero section with image and CTA',
 *   componentGroup: 'content',
 *   metadataClassName: 'HeroBannerMetadata',
 *   hasAttributes: true,
 *   hasRegions: false,
 *   hasLoader: false,
 *   regions: [],
 *   attributes: [
 *     { name: 'title', tsType: 'string', optional: false, hasConfig: false },
 *     { name: 'imageUrl', tsType: 'string', optional: false, hasConfig: true,
 *       config: { type: 'image', name: 'Background Image' } }
 *   ]
 * })
 *
 * @example
 * // Layout component with regions:
 * generateDecoratorCode({
 *   needsImports: true,
 *   componentId: 'two-column',
 *   componentName: 'Two Column Layout',
 *   componentDescription: 'Side-by-side content layout',
 *   componentGroup: 'layout',
 *   metadataClassName: 'TwoColumnMetadata',
 *   hasAttributes: false,
 *   hasRegions: true,
 *   hasLoader: false,
 *   regions: [
 *     { id: 'left', name: 'Left Column' },
 *     { id: 'right', name: 'Right Column' }
 *   ],
 *   attributes: []
 * })
 *
 * @public
 */
export function generateDecoratorCode(context: MetadataContext): string {
  const imports = generateImports(context);

  const componentDecorator = `@Component('${context.componentId}', {
    name: '${context.componentName}',
    description: '${context.componentDescription}',${context.componentGroup ? `\n    group: '${context.componentGroup}',` : ''}
})`;

  const regionDefinition = generateRegionDefinition(context);

  const attributes = context.attributes
    .map((attr) => {
      return attr.hasConfig ? generateConfiguredAttribute(attr) : generateSimpleAttribute(attr);
    })
    .join('\n\n');

  return `${imports}${componentDecorator}
${regionDefinition}export class ${context.metadataClassName} {
${attributes}
}`;
}
