/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {
  collapseOpenApiSchema,
  getPathKeys,
  getSchemaNames,
  getExampleNames,
  type OpenApiSchemaInput,
} from '@salesforce/b2c-tooling-sdk/operations/scapi-schemas';
import {ScapiSchemasCommand, formatApiError} from '../../../utils/scapi/schemas.js';
import {t} from '../../../i18n/index.js';

/**
 * Response type for the get command when using --json flag.
 */
interface GetOutput {
  apiFamily: string;
  apiName: string;
  apiVersion: string;
  schema: Record<string, unknown>;
}

/**
 * Command to get a specific SCAPI schema.
 *
 * By default, outputs collapsed schema for context efficiency (ideal for agentic use).
 * Use --expand-* flags to selectively expand specific paths, schemas, or examples.
 * Use --expand-all to get the full, unmodified schema.
 */
export default class ScapiSchemasGet extends ScapiSchemasCommand<typeof ScapiSchemasGet> {
  static args = {
    apiFamily: Args.string({
      description: t('args.apiFamily.description', 'API family (e.g., product, checkout, search)'),
      required: true,
    }),
    apiName: Args.string({
      description: t('args.apiName.description', 'API name (e.g., shopper-products, shopper-baskets)'),
      required: true,
    }),
    apiVersion: Args.string({
      description: t('args.apiVersion.description', 'API version (e.g., v1)'),
      required: true,
    }),
  };

  static description = t(
    'commands.scapi.schemas.get.description',
    'Get a specific SCAPI schema with optional selective expansion',
  );

  static enableJsonFlag = true;

  static examples = [
    // Basic usage
    '<%= config.bin %> <%= command.id %> product shopper-products v1 --tenant-id f_ecom_zzxy_prd',
    // Full schema
    '<%= config.bin %> <%= command.id %> product shopper-products v1 --tenant-id f_ecom_zzxy_prd --expand-all',
    // Selective expansion
    '<%= config.bin %> <%= command.id %> product shopper-products v1 --tenant-id f_ecom_zzxy_prd --expand-paths /products',
    '<%= config.bin %> <%= command.id %> product shopper-products v1 --tenant-id f_ecom_zzxy_prd --expand-schemas Product,ProductResult',
    // List available paths/schemas
    '<%= config.bin %> <%= command.id %> product shopper-products v1 --tenant-id f_ecom_zzxy_prd --list-paths',
    '<%= config.bin %> <%= command.id %> product shopper-products v1 --tenant-id f_ecom_zzxy_prd --list-schemas',
    // YAML output
    '<%= config.bin %> <%= command.id %> product shopper-products v1 --tenant-id f_ecom_zzxy_prd --yaml',
    // JSON wrapped output
    '<%= config.bin %> <%= command.id %> product shopper-products v1 --tenant-id f_ecom_zzxy_prd --json',
  ];

  static flags = {
    ...ScapiSchemasCommand.baseFlags,

    // Selective expansion flags
    'expand-paths': Flags.string({
      description: t(
        'flags.expandPaths.description',
        'Paths to fully expand (comma-separated, e.g., /products,/orders)',
      ),
      multiple: false,
    }),
    'expand-schemas': Flags.string({
      description: t('flags.expandSchemas.description', 'Schema names to fully expand (comma-separated)'),
      multiple: false,
    }),
    'expand-examples': Flags.string({
      description: t('flags.expandExamples.description', 'Example names to fully expand (comma-separated)'),
      multiple: false,
    }),
    'expand-custom-properties': Flags.boolean({
      description: t('flags.expandCustomProperties.description', 'Expand custom properties'),
      default: true,
      allowNo: true,
    }),
    'expand-all': Flags.boolean({
      description: t(
        'flags.expandAll.description',
        'Return full schema without collapsing (overrides selective expand)',
      ),
      default: false,
    }),

    // List available items flags
    'list-paths': Flags.boolean({
      description: t('flags.listPaths.description', 'List available paths in the schema and exit'),
      default: false,
      exclusive: ['list-schemas', 'list-examples'],
    }),
    'list-schemas': Flags.boolean({
      description: t('flags.listSchemas.description', 'List available schema names and exit'),
      default: false,
      exclusive: ['list-paths', 'list-examples'],
    }),
    'list-examples': Flags.boolean({
      description: t('flags.listExamples.description', 'List available example names and exit'),
      default: false,
      exclusive: ['list-paths', 'list-schemas'],
    }),

    // Output format flags
    yaml: Flags.boolean({
      description: t('flags.yaml.description', 'Output as YAML instead of JSON'),
      default: false,
    }),
  };

  async run(): Promise<GetOutput | null | string[]> {
    this.requireOAuthCredentials();

    const {apiFamily, apiName, apiVersion} = this.args;
    const {
      'expand-paths': expandPathsRaw,
      'expand-schemas': expandSchemasRaw,
      'expand-examples': expandExamplesRaw,
      'expand-custom-properties': expandCustomProperties,
      'expand-all': expandAll,
      'list-paths': listPaths,
      'list-schemas': listSchemas,
      'list-examples': listExamples,
      yaml: outputYaml,
    } = this.flags;

    // Parse comma-separated values
    const expandPaths = expandPathsRaw ? expandPathsRaw.split(',').map((p) => p.trim()) : [];
    const expandSchemas = expandSchemasRaw ? expandSchemasRaw.split(',').map((s) => s.trim()) : [];
    const expandExamples = expandExamplesRaw ? expandExamplesRaw.split(',').map((e) => e.trim()) : [];

    if (!this.jsonEnabled()) {
      // Build expansion info for the log message
      const expansionInfo = this.getExpansionInfo(expandAll, expandPaths, expandSchemas, expandExamples);

      this.log(
        t(
          'commands.scapi.schemas.get.fetching',
          'Fetching {{apiFamily}}/{{apiName}}/{{apiVersion}} schema{{expansionInfo}}...',
          {
            apiFamily,
            apiName,
            apiVersion,
            expansionInfo,
          },
        ),
      );
    }

    const client = this.getSchemasClient();

    const {data, error, response} = await client.GET(
      '/organizations/{organizationId}/schemas/{apiFamily}/{apiName}/{apiVersion}',
      {
        params: {
          path: {
            organizationId: this.getOrganizationId(),
            apiFamily,
            apiName,
            apiVersion,
          },
          query: expandCustomProperties ? {expand: 'custom_properties'} : undefined,
        },
      },
    );

    if (error) {
      this.error(
        t('commands.scapi.schemas.get.error', 'Failed to fetch schema: {{message}}', {
          message: formatApiError(error, response),
        }),
      );
    }

    // Handle list-* flags - just output the available items
    if (listPaths || listSchemas || listExamples) {
      const fullSchema = data as OpenApiSchemaInput;

      if (listPaths) {
        const paths = getPathKeys(fullSchema);
        return this.outputList(paths, 'paths');
      }

      if (listSchemas) {
        const schemas = getSchemaNames(fullSchema);
        return this.outputList(schemas, 'schemas');
      }

      if (listExamples) {
        const examples = getExampleNames(fullSchema);
        return this.outputList(examples, 'examples');
      }
    }

    // Apply collapsing unless --expand-all is set
    let schema: Record<string, unknown>;
    if (expandAll) {
      schema = data as Record<string, unknown>;
    } else {
      const fullSchema = data as OpenApiSchemaInput;
      schema = collapseOpenApiSchema(fullSchema, {
        expandPaths,
        expandSchemas,
        expandExamples,
      }) as Record<string, unknown>;
    }

    const output: GetOutput = {apiFamily, apiName, apiVersion, schema};

    // For --json flag, oclif handles serialization (wrapped output)
    if (this.jsonEnabled()) {
      return output;
    }

    // Output to stdout (raw schema)
    if (outputYaml) {
      process.stdout.write(this.serializeToYaml(schema));
      process.stdout.write('\n');
    } else {
      process.stdout.write(JSON.stringify(schema, null, 2));
      process.stdout.write('\n');
    }

    return output;
  }

  /**
   * Build expansion info string for the log message.
   */
  private getExpansionInfo(
    expandAll: boolean,
    expandPaths: string[],
    expandSchemas: string[],
    expandExamples: string[],
  ): string {
    if (expandAll) {
      return ' (expand=full)';
    }

    const parts: string[] = [];

    if (expandPaths.length > 0) {
      parts.push(`paths: ${expandPaths.join(', ')}`);
    }

    if (expandSchemas.length > 0) {
      parts.push(`schemas: ${expandSchemas.join(', ')}`);
    }

    if (expandExamples.length > 0) {
      parts.push(`examples: ${expandExamples.join(', ')}`);
    }

    if (parts.length > 0) {
      return ` (expanding ${parts.join('; ')})`;
    }

    return ' (outline only - use --expand-paths, --expand-schemas, or --expand-all for details)';
  }

  /**
   * Check if a value is a non-empty object (not an array).
   */
  private isNonEmptyObject(value: unknown): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0;
  }

  /**
   * Output a list of items (paths, schemas, or examples).
   */
  private outputList(items: string[], type: string): string[] {
    if (this.jsonEnabled()) {
      return items;
    }

    if (items.length === 0) {
      this.log(t('commands.scapi.schemas.get.noItems', 'No {{type}} found.', {type}));
    } else {
      this.log(t('commands.scapi.schemas.get.itemCount', 'Found {{count}} {{type}}:', {count: items.length, type}));
      for (const item of items) {
        this.log(`  ${item}`);
      }
    }

    return items;
  }

  /**
   * Serialize object to YAML format.
   * Uses a simple JSON-to-YAML conversion for basic YAML output.
   */
  private serializeToYaml(obj: unknown, indent = 0): string {
    if (obj === null || obj === undefined) {
      return 'null';
    }

    if (typeof obj === 'string') {
      return this.serializeYamlString(obj);
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj);
    }

    if (Array.isArray(obj)) {
      return this.serializeYamlArray(obj, indent);
    }

    if (typeof obj === 'object') {
      return this.serializeYamlObject(obj as Record<string, unknown>, indent);
    }

    return String(obj);
  }

  /**
   * Serialize an array to YAML format.
   */
  private serializeYamlArray(arr: unknown[], indent: number): string {
    if (arr.length === 0) {
      return '[]';
    }

    // For arrays of primitives, use inline format
    if (arr.every((item) => typeof item !== 'object' || item === null)) {
      return `[${arr.map((item) => this.serializeToYaml(item, 0)).join(', ')}]`;
    }

    // For arrays of objects, use block format
    const indentStr = '  '.repeat(indent);
    const lines: string[] = [];
    for (const item of arr) {
      const serialized = this.serializeToYaml(item, indent + 1);
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        // Object items - first line starts with -, rest are indented
        const objLines = serialized.split('\n');
        lines.push(`${indentStr}- ${objLines[0]}`);
        for (let i = 1; i < objLines.length; i++) {
          lines.push(`${indentStr}  ${objLines[i]}`);
        }
      } else {
        lines.push(`${indentStr}- ${serialized}`);
      }
    }
    return lines.join('\n');
  }

  /**
   * Serialize an object to YAML format.
   */
  private serializeYamlObject(obj: Record<string, unknown>, indent: number): string {
    const entries = Object.entries(obj);
    if (entries.length === 0) {
      return '{}';
    }

    const indentStr = '  '.repeat(indent);
    const lines: string[] = [];
    for (const [key, value] of entries) {
      const serializedValue = this.serializeToYaml(value, indent + 1);
      if (this.isNonEmptyObject(value)) {
        // Nested object - put on next line
        lines.push(`${indentStr}${key}:`);
        for (const line of serializedValue.split('\n')) {
          lines.push(`${indentStr}  ${line}`);
        }
      } else if (Array.isArray(value) && value.some((item) => typeof item === 'object')) {
        // Array with objects - put on next line
        lines.push(`${indentStr}${key}:`);
        for (const line of serializedValue.split('\n')) {
          lines.push(line);
        }
      } else {
        // Simple value or empty object/array - inline
        lines.push(`${indentStr}${key}: ${serializedValue}`);
      }
    }
    return lines.join('\n');
  }

  /**
   * Serialize a string value to YAML, quoting if necessary.
   */
  private serializeYamlString(str: string): string {
    if (str.includes('\n') || str.includes(':') || str.includes('#') || str === '') {
      return JSON.stringify(str);
    }
    return str;
  }
}
