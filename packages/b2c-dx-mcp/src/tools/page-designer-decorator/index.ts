/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z, type ZodRawShape} from 'zod';
import {componentAnalyzer, generateTypeSuggestions, resolveComponent, type TypeSuggestion} from './analyzer.js';
import {generateDecoratorCode, type AttributeContext, type MetadataContext} from './templates/decorator-generator.js';
import {pageDesignerDecoratorRules} from './rules.js';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

export const pageDesignerDecoratorSchema = z
  .object({
    component: z
      .string()
      .describe(
        'Component name (e.g., "ProductCard", "Hero") or file path (e.g., "src/components/ProductCard.tsx"). ' +
          'When a name is provided, the tool automatically searches common component directories. ' +
          'For backward compatibility, file paths are also supported.',
      ),

    searchPaths: z
      .array(z.string())
      .optional()
      .describe(
        'Additional directories to search for components (e.g., ["packages/retail/src", "app/features"]). ' +
          'Only used when component is specified by name (not path).',
      ),

    autoMode: z
      .boolean()
      .optional()
      .describe(
        'Auto-generate all configurations with sensible defaults (skip interactive workflow). When enabled, automatically selects suitable props, infers types, and generates decorators without user confirmation.',
      ),

    componentId: z.string().optional().describe('Override component ID (default: auto-generated from component name)'),

    conversationContext: z
      .object({
        step: z
          .enum(['analyze', 'select_props', 'configure_attrs', 'configure_regions', 'confirm_generation'])
          .optional()
          .describe('Current step in the conversation workflow'),

        componentInfo: z
          .record(z.string(), z.any())
          .optional()
          .describe('Cached component analysis from previous step'),

        selectedProps: z
          .array(z.string())
          .optional()
          .describe('Props from component interface selected to expose in Page Designer'),

        newAttributes: z
          .array(
            z.object({
              name: z.string(),
              description: z.string().optional(),
              required: z.boolean().optional(),
            }),
          )
          .optional()
          .describe('New attributes to add (not in existing props)'),

        attributeConfig: z
          .record(
            z.string(),
            z.object({
              type: z.string().optional(),
              name: z.string().optional(),
              defaultValue: z.any().optional(),
              values: z.array(z.string()).optional(),
            }),
          )
          .optional()
          .describe('Configuration for each attribute (explicit types, names, etc.)'),

        componentMetadata: z
          .object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            group: z.string().optional(),
          })
          .optional()
          .describe('Component decorator configuration'),

        regionConfig: z
          .object({
            enabled: z.boolean().describe('Whether to include @RegionDefinition decorator'),
            regions: z
              .array(
                z.object({
                  id: z.string().describe('Region identifier (e.g., "main", "sidebar")'),
                  name: z.string().describe('Display name for the region'),
                  description: z.string().optional().describe('Description of the region purpose'),
                  maxComponents: z.number().optional().describe('Maximum number of components allowed in region'),
                  componentTypeInclusions: z
                    .array(z.string())
                    .optional()
                    .describe('Allowed component types (whitelist)'),
                  componentTypeExclusions: z
                    .array(z.string())
                    .optional()
                    .describe('Disallowed component types (blacklist)'),
                }),
              )
              .optional()
              .describe('Array of region definitions'),
          })
          .optional()
          .describe('Region configuration for nested content areas'),
      })
      .optional()
      .describe('Conversation state for multi-turn interaction'),
  })
  .strict();

export type PageDesignerDecoratorInput = z.infer<typeof pageDesignerDecoratorSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert component name to kebab-case for use as component ID
 *
 * Page Designer component IDs should be lowercase with hyphens.
 *
 * @param name - PascalCase or camelCase name
 * @returns kebab-case identifier
 *
 * @example
 * toKebabCase('ProductCard') // => 'product-card'
 * toKebabCase('TwoColumnLayout') // => 'two-column-layout'
 *
 * @internal
 */
function toKebabCase(name: string): string {
  return name
    .replaceAll(/([a-z])([A-Z])/g, '$1-$2')
    .replaceAll(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert camelCase prop name to human-readable display name
 *
 * Used for attribute names shown to merchants in Page Designer UI.
 *
 * @param fieldName - camelCase field name
 * @returns Human-readable name with proper capitalization
 *
 * @example
 * toHumanReadableName('imageUrl') // => 'Image Url'
 * toHumanReadableName('ctaButtonText') // => 'Cta Button Text'
 *
 * @internal
 */
function toHumanReadableName(fieldName: string): string {
  return fieldName
    .replaceAll(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// ============================================================================
// WORKFLOW STEP HANDLERS
// ============================================================================

/**
 * Handle Interactive Mode - Step 1: Analyze
 *
 * Parses the component file and provides analysis to the LLM:
 * - Component name and structure
 * - All props with types
 * - Categorization (editable, complex, UI-only)
 * - Suggested component ID and name
 *
 * **LLM should then:**
 * - Present findings to user
 * - Ask which props to expose in Page Designer
 * - Collect component metadata (ID, name, description, group)
 * - Call next step with selectedProps and componentMetadata
 *
 * @internal
 */
function handleAnalyzeStep(args: PageDesignerDecoratorInput, workspaceRoot: string) {
  const fullPath = resolveComponent(args.component, workspaceRoot, args.searchPaths);
  const componentInfo = componentAnalyzer.analyzeComponent(fullPath);

  const editableProps = componentInfo.props.filter((p) => !p.isComplex && !p.isUIOnly);
  const complexProps = componentInfo.props.filter((p) => p.isComplex);
  const uiProps = componentInfo.props.filter((p) => p.isUIOnly && !p.isComplex);

  const suggestedComponentId = args.componentId || toKebabCase(componentInfo.componentName);
  const suggestedComponentName = toHumanReadableName(componentInfo.componentName);

  const instructions = pageDesignerDecoratorRules.getAnalyzeInstructions({
    componentName: componentInfo.componentName,
    file: args.component,
    hasDecorators: componentInfo.hasDecorators,
    interfaceName: componentInfo.interfaceName || 'None found',
    totalProps: componentInfo.props.length,
    exportType: componentInfo.exportType,
    hasEditableProps: editableProps.length > 0,
    editableProps,
    hasComplexProps: complexProps.length > 0,
    complexProps,
    hasUIProps: uiProps.length > 0,
    uiProps,
    suggestedComponentId,
    suggestedComponentName,
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: instructions,
      },
    ],
  };
}

function handleSelectPropsStep(args: PageDesignerDecoratorInput, _workspaceRoot: string) {
  const selectedProps = args.conversationContext?.selectedProps || [];
  const newAttributes = args.conversationContext?.newAttributes || [];
  const componentMetadata = args.conversationContext?.componentMetadata;

  if (!componentMetadata) {
    return {
      content: [
        {
          type: 'text' as const,
          text: '⚠️ Missing component metadata. Please provide component ID, name, description, and group from the analyze step.',
        },
      ],
      isError: true,
    };
  }

  const confirmation = pageDesignerDecoratorRules.getSelectPropsConfirmation({
    componentMetadata: {
      id: componentMetadata.id,
      name: componentMetadata.name,
      description: componentMetadata.description,
      group: componentMetadata.group || 'odyssey_base',
    },
    selectedProps,
    newAttributes,
    selectedPropsCount: selectedProps.length,
    newAttributesCount: newAttributes.length,
    totalAttributeCount: selectedProps.length + newAttributes.length,
    hasSelectedProps: selectedProps.length > 0,
    hasNewAttributes: newAttributes.length > 0,
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: confirmation,
      },
    ],
  };
}

function handleConfigureAttrsStep(args: PageDesignerDecoratorInput, workspaceRoot: string) {
  const selectedProps = args.conversationContext?.selectedProps || [];
  const newAttributes = args.conversationContext?.newAttributes || [];

  const fullPath = resolveComponent(args.component, workspaceRoot, args.searchPaths);
  const componentInfo = componentAnalyzer.analyzeComponent(fullPath);

  const attributeAnalysis: Array<{
    name: string;
    source: 'existing' | 'new';
    tsType: string;
    autoInferred: boolean;
    suggestions: TypeSuggestion[];
  }> = [];

  for (const propName of selectedProps) {
    const prop = componentInfo.props.find((p) => p.name === propName);
    if (!prop) continue;

    const suggestions = generateTypeSuggestions(propName, prop.type);

    attributeAnalysis.push({
      name: propName,
      source: 'existing',
      tsType: prop.type,
      autoInferred: suggestions.length === 0,
      suggestions,
    });
  }

  for (const attr of newAttributes) {
    const suggestions = generateTypeSuggestions(attr.name, 'string');

    attributeAnalysis.push({
      name: attr.name,
      source: 'new',
      tsType: 'string',
      autoInferred: suggestions.length === 0,
      suggestions,
    });
  }

  const autoInferredAttrs = attributeAnalysis.filter((a) => a.autoInferred);
  const needsConfigAttrs = attributeAnalysis.filter((a) => !a.autoInferred);

  const instructions = pageDesignerDecoratorRules.getConfigureAttrsInstructions({
    totalAttributes: attributeAnalysis.length,
    autoInferredCount: autoInferredAttrs.length,
    needsConfigCount: needsConfigAttrs.length,
    hasAutoInferred: autoInferredAttrs.length > 0,
    autoInferredAttrs: autoInferredAttrs.map((a) => ({name: a.name, tsType: a.tsType})),
    hasNeedsConfig: needsConfigAttrs.length > 0,
    needsConfigAttrs: needsConfigAttrs.map((attr) => ({
      name: attr.name,
      tsType: attr.tsType,
      source: attr.source === 'existing' ? 'Existing prop' : 'New attribute',
      hasSuggestions: attr.suggestions.length > 0,
      suggestions: attr.suggestions,
      suggestedTypes: attr.suggestions.map((s) => s.type).join(', ') || 'string',
      humanReadableName: toHumanReadableName(attr.name),
      hasEnumSuggestion: attr.suggestions.some((s) => s.type === 'enum'),
    })),
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: instructions,
      },
    ],
  };
}

function handleConfigureRegionsStep(args: PageDesignerDecoratorInput, workspaceRoot: string) {
  const fullPath = resolveComponent(args.component, workspaceRoot, args.searchPaths);
  const componentInfo = componentAnalyzer.analyzeComponent(fullPath);

  const instructions = pageDesignerDecoratorRules.getConfigureRegionsInstructions({
    componentName: componentInfo.componentName,
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: instructions,
      },
    ],
  };
}

function handleConfirmGenerationStep(args: PageDesignerDecoratorInput, workspaceRoot: string) {
  const {
    componentMetadata,
    selectedProps = [],
    newAttributes = [],
    attributeConfig = {},
  } = args.conversationContext || {};

  if (!componentMetadata) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Error: Missing component metadata. Please start from the beginning.',
        },
      ],
      isError: true,
    };
  }

  const fullPath = resolveComponent(args.component, workspaceRoot, args.searchPaths);
  const componentInfo = componentAnalyzer.analyzeComponent(fullPath);

  const attributes: AttributeContext[] = [];

  for (const propName of selectedProps) {
    const prop = componentInfo.props.find((p) => p.name === propName);
    if (!prop) continue;

    const config = attributeConfig[propName];
    const hasConfig = config && Object.keys(config).length > 0;

    attributes.push({
      name: propName,
      tsType: prop.type,
      optional: prop.optional,
      hasConfig,
      config,
    });
  }

  for (const attr of newAttributes) {
    const config = attributeConfig[attr.name];
    const hasConfig = config && Object.keys(config).length > 0;

    attributes.push({
      name: attr.name,
      tsType: 'string',
      optional: !attr.required,
      hasConfig,
      config,
    });
  }

  const regionConfig = args.conversationContext?.regionConfig;
  const hasRegions = regionConfig?.enabled && regionConfig.regions && regionConfig.regions.length > 0;

  const context: MetadataContext = {
    needsImports: true,
    componentId: componentMetadata.id,
    componentName: componentMetadata.name,
    componentDescription: componentMetadata.description,
    componentGroup: componentMetadata.group || 'odyssey_base',
    metadataClassName: `${componentInfo.componentName}Metadata`,
    hasAttributes: attributes.length > 0,
    hasRegions: hasRegions || false,
    hasLoader: false,
    regions: hasRegions ? regionConfig.regions || [] : [],
    attributes,
  };

  const decoratorCode = generateDecoratorCode(context);

  const userResponse = pageDesignerDecoratorRules.getConfirmGenerationInstructions({
    decoratorCode,
    componentName: componentInfo.componentName,
    componentId: componentMetadata.id,
    componentGroup: componentMetadata.group || 'odyssey_base',
    file: args.component,
    attributeCount: attributes.length,
    hasRegions: hasRegions || false,
    regionCount: hasRegions && regionConfig.regions ? regionConfig.regions.length : 0,
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: userResponse,
      },
    ],
  };
}

/**
 * Handle Auto Mode - Single-step decorator generation
 *
 * **Fully automated workflow:**
 * 1. Analyzes component
 * 2. Auto-selects suitable props (excludes complex and UI-only)
 * 3. Auto-infers Page Designer types from naming patterns
 * 4. Generates decorator code immediately
 * 5. NO user interaction required
 *
 * **Selection criteria:**
 * - ✅ Simple types (string, number, boolean)
 * - ❌ Complex types (objects, functions, React nodes)
 * - ❌ UI-only props (className, style, onClick, etc.)
 *
 * **Auto-configuration:**
 * - High-confidence patterns get explicit types (url, image, enum)
 * - Others use auto-inferred types
 * - Human-readable names auto-generated
 * - No regions configured (interactive mode for advanced features)
 *
 * **Use cases:**
 * - Quick setup for standard components
 * - Batch processing multiple components
 * - Getting started quickly
 *
 * @internal
 */
function handleAutoMode(args: PageDesignerDecoratorInput, workspaceRoot: string) {
  const fullPath = resolveComponent(args.component, workspaceRoot, args.searchPaths);
  const componentInfo = componentAnalyzer.analyzeComponent(fullPath);

  if (componentInfo.hasDecorators) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `# ⚠️ Component Already Decorated\n\nThe component \`${componentInfo.componentName}\` already has Page Designer decorators.\n\nWould you like to modify the existing decorators instead?`,
        },
      ],
    };
  }

  const selectedProps = componentInfo.props.filter((p) => !p.isComplex && !p.isUIOnly).map((p) => p.name);

  const attributeConfig: Record<string, {name?: string; type?: string; values?: string[]; defaultValue?: unknown}> = {};
  const attributes: AttributeContext[] = [];

  for (const propName of selectedProps) {
    const prop = componentInfo.props.find((p) => p.name === propName);
    if (!prop) continue;

    const suggestions = generateTypeSuggestions(propName, prop.type);
    const config: {name?: string; type?: string; values?: string[]; defaultValue?: unknown} = {
      name: toHumanReadableName(propName),
    };

    const highPrioritySuggestion = suggestions.find((s) => s.priority === 'high');
    if (highPrioritySuggestion) {
      config.type = highPrioritySuggestion.type;

      if (highPrioritySuggestion.type === 'enum') {
        if (propName.toLowerCase().includes('size')) {
          config.values = ['sm', 'default', 'lg'];
          config.defaultValue = 'default';
        } else if (propName.toLowerCase().includes('variant')) {
          config.values = ['default', 'primary', 'secondary'];
          config.defaultValue = 'default';
        }
      }

      if (highPrioritySuggestion.type === 'boolean') {
        config.defaultValue = false;
      }
    }

    if (Object.keys(config).length > 1) {
      attributeConfig[propName] = config;
    }

    attributes.push({
      name: propName,
      tsType: prop.type,
      optional: prop.optional,
      hasConfig: Object.keys(config).length > 1,
      config: Object.keys(config).length > 1 ? config : undefined,
    });
  }

  const componentId = args.componentId || toKebabCase(componentInfo.componentName);
  const componentName = toHumanReadableName(componentInfo.componentName);
  const componentDescription = `${componentName} component for Page Designer`;

  const context: MetadataContext = {
    needsImports: true,
    componentId,
    componentName,
    componentDescription,
    componentGroup: 'odyssey_base',
    metadataClassName: `${componentInfo.componentName}Metadata`,
    hasAttributes: attributes.length > 0,
    hasRegions: false,
    hasLoader: false,
    regions: [],
    attributes,
  };

  const decoratorCode = generateDecoratorCode(context);

  const response = pageDesignerDecoratorRules.getAutoModeInstructions({
    componentName: componentInfo.componentName,
    file: args.component,
    componentId,
    selectedPropCount: selectedProps.length,
    autoConfigCount: Object.keys(attributeConfig).length,
    autoInferredCount: selectedProps.length - Object.keys(attributeConfig).length,
    hasNoSuitableProps: selectedProps.length === 0,
    selectedProps: selectedProps.length > 0 ? selectedProps.map((p) => `\`${p}\``).join(', ') : 'None',
    decoratorCode,
    componentGroup: 'odyssey_base',
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: response,
      },
    ],
  };
}

// ============================================================================
// TOOL EXPORT
// ============================================================================

/**
 * Creates the Page Designer decorator tool for Storefront Next.
 *
 * @param loadServices - Function that loads configuration and returns Services instance
 * @returns The configured MCP tool
 */
export function createPageDesignerDecoratorTool(loadServices: () => Services): McpTool {
  return {
    name: 'storefront_next_page_designer_decorator',

    description:
      'Adds Page Designer decorators (@Component, @AttributeDefinition, @RegionDefinition) to React components. ' +
      'Two modes: autoMode=true for quick setup with defaults, or interactive mode via conversationContext.step. ' +
      'Component discovery uses projectDirectory from flags/env. ' +
      'Auto mode: selects suitable props, infers types, generates code immediately. ' +
      'Interactive mode: multi-step workflow (analyze → select_props → configure_attrs → configure_regions → confirm_generation).',

    inputSchema: pageDesignerDecoratorSchema.shape as ZodRawShape,
    toolsets: ['STOREFRONTNEXT'],
    isGA: false,

    async handler(args: Record<string, unknown>) {
      try {
        // Validate and parse input
        const validatedArgs = pageDesignerDecoratorSchema.parse(args) as PageDesignerDecoratorInput;
        // Use projectDirectory from services to ensure we search in the correct project directory
        // This prevents searches in the home folder when MCP clients spawn servers from ~
        const services = loadServices();
        const workspaceRoot = services.getWorkingDirectory();

        if (validatedArgs.autoMode === undefined && !validatedArgs.conversationContext) {
          const fullPath = resolveComponent(validatedArgs.component, workspaceRoot, validatedArgs.searchPaths);
          const componentInfo = componentAnalyzer.analyzeComponent(fullPath);

          const instructions = pageDesignerDecoratorRules.getModeSelectionInstructions({
            componentName: componentInfo.componentName,
            file: validatedArgs.component,
          });

          return {
            content: [
              {
                type: 'text' as const,
                text: instructions,
              },
            ],
          };
        }

        if (validatedArgs.autoMode) {
          return handleAutoMode(validatedArgs, workspaceRoot);
        }

        const step = validatedArgs.conversationContext?.step || 'analyze';

        switch (step) {
          case 'analyze': {
            return handleAnalyzeStep(validatedArgs, workspaceRoot);
          }

          case 'configure_attrs': {
            return handleConfigureAttrsStep(validatedArgs, workspaceRoot);
          }

          case 'configure_regions': {
            return handleConfigureRegionsStep(validatedArgs, workspaceRoot);
          }

          case 'confirm_generation': {
            return handleConfirmGenerationStep(validatedArgs, workspaceRoot);
          }

          case 'select_props': {
            return handleSelectPropsStep(validatedArgs, workspaceRoot);
          }

          default: {
            const unknownStep: string = step;
            throw new Error(`Unknown step: ${unknownStep}`);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Check if it's a Zod validation error
        if (error instanceof Error && error.name === 'ZodError') {
          return {
            content: [
              {
                type: 'text' as const,
                text: `# Error: Invalid Input\n\n${errorMessage}\n\nPlease check your input parameters and try again.`,
              },
            ],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: 'text' as const,
              text: `# Error Adding Page Designer Support\n\n${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}
