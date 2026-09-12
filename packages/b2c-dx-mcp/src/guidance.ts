/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ResourceTemplate, ProtocolError, ProtocolErrorCode} from '@modelcontextprotocol/server';
import {fileURLToPath} from 'node:url';
import {GuidanceCatalog, GuidanceError, GUIDANCE_INDEX_URI} from '@salesforce/b2c-tooling-sdk/guidance';
import {z} from 'zod';
import type {B2CDxMcpServer} from './server.js';
import {TOOLSETS} from './utils/constants.js';
import type {McpTool, ToolResult} from './utils/types.js';

const inputSchema = {
  workspace: z
    .enum(['cartridges', 'sfra', 'pwa-kit-v3', 'storefront-next'])
    .optional()
    .describe('Optional storefront ranking preference; no project detection.'),
  query: z.string().trim().min(1).max(512).optional().describe('Search skills; returns five hits by default.'),
  id: z.string().min(1).max(256).optional().describe('Exact skill ID from discovery.'),
  uri: z.string().max(1024).optional().describe('Skill resource URI; replaces id and file.'),
  file: z.string().max(512).optional().describe('Relative reference path listed by an entrypoint.'),
  section: z.string().max(256).optional().describe('Exact heading ID returned by a read.'),
  collection: z.string().max(128).optional().describe('Filter by collection.'),
  limit: z.number().int().min(1).max(20).optional().describe('Page size: directory 20, search 5; maximum 20.'),
  maxLength: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Read character limit; defaults to the full file or section.'),
  offset: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe('Entry offset for discovery; character offset for reads. Default 0.'),
};

const collectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  isGA: z.boolean(),
  workspaces: z.array(z.string()).optional(),
});
const pageFields = {
  collections: z.array(collectionSchema),
  entries: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      uri: z.string(),
      score: z.number().optional(),
    }),
  ),
  total: z.number().int(),
  offset: z.number().int(),
  nextOffset: z.number().int().optional(),
};
const outputSchema = {
  result: z.discriminatedUnion('kind', [
    z.object({kind: z.literal('directory'), ...pageFields}),
    z.object({kind: z.literal('search'), ...pageFields}),
    z.object({
      kind: z.literal('read'),
      id: z.string(),
      uri: z.string(),
      source: z.string(),
      content: z.string(),
      totalLength: z.number().int(),
      offset: z.number().int(),
      truncated: z.boolean().optional(),
      nextOffset: z.number().int().optional(),
      sections: z.array(z.object({id: z.string(), title: z.string()})),
      references: z.array(z.string()),
    }),
  ]),
};

function catalogLoader(collections?: readonly string[]): () => GuidanceCatalog {
  let catalog: GuidanceCatalog | undefined;
  return () => {
    catalog ??= new GuidanceCatalog(fileURLToPath(new URL('../content/guidance/', import.meta.url)), {
      allowNonGa: true,
      collections,
    });
    return catalog;
  };
}

function errorResult(error: unknown): ToolResult {
  const detail =
    error instanceof GuidanceError
      ? error
      : new GuidanceError('SKILLS_UNAVAILABLE', 'Packaged skills are unavailable. Rebuild or reinstall the MCP.');
  const structuredContent = {
    error: {
      code: detail.code,
      message: detail.message,
      ...(detail.sections
        ? {sections: detail.sections}
        : {suggestions: ['Use skills_read({}) to discover available IDs.']}),
    },
  };
  return {isError: true, structuredContent, content: [{type: 'text', text: JSON.stringify(structuredContent)}]};
}

/** Read-only guidance does not load instance configuration or credentials. */
export function createGuidanceTool(): McpTool {
  const getCatalog = catalogLoader();
  return {
    name: 'skills_read',
    effect: 'read',
    idempotent: true,
    openWorld: false,
    title: 'Read B2C Skills',
    description:
      'Full skill catalog: b2c (Commerce), b2c-cli, storefront-next, mcp (setup/workflows). Also a fallback for skill resources. Omit args to list; query to search; collection to filter; id to read.',
    inputSchema,
    outputSchema,
    toolsets: [...TOOLSETS],
    async handler(args) {
      const parsed = z.object(inputSchema).strict().safeParse(args);
      if (!parsed.success)
        return errorResult(
          new GuidanceError(
            'INVALID_REQUEST',
            parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
          ),
        );
      try {
        const structuredContent = {result: getCatalog().read(parsed.data)};
        return {structuredContent, content: [{type: 'text', text: JSON.stringify(structuredContent)}]};
      } catch (error) {
        return errorResult(error);
      }
    },
  };
}

/** Advertise an index and featured skills; the template reads the entire available catalog. */
export function registerGuidanceResources(server: B2CDxMcpServer, includeSharedSkills = true): void {
  const catalog = catalogLoader(includeSharedSkills ? undefined : ['mcp'])();
  const read = async (uri: string): Promise<{contents: {uri: string; mimeType: string; text: string}[]}> => {
    try {
      return {contents: [{uri, mimeType: 'text/markdown', text: catalog.readResource(uri)}]};
    } catch (error) {
      const detail =
        error instanceof GuidanceError
          ? error
          : new GuidanceError('SKILLS_UNAVAILABLE', 'Packaged skills are unavailable.');
      throw new ProtocolError(ProtocolErrorCode.InvalidParams, detail.message, {code: detail.code});
    }
  };
  server.registerResource(
    'skill-index',
    GUIDANCE_INDEX_URI,
    {
      title: 'B2C Skill Index',
      description: 'Available skills by collection, with summaries and file URIs.',
      mimeType: 'text/markdown',
    },
    async (uri) => read(uri.toString()),
  );
  for (const resource of catalog.resources()) {
    server.registerResource(
      resource.name,
      resource.uri,
      {title: resource.title, description: resource.description, mimeType: resource.mimeType},
      async (uri) => read(uri.toString()),
    );
  }
  server.registerResource(
    'skill-file',
    new ResourceTemplate('skill://{collection}/{entry}/{+path}', {list: undefined}),
    {
      title: 'B2C Skill Files',
      description: includeSharedSkills
        ? 'Available skills and references. Discover file URIs in skill://index or skills_read results.'
        : 'MCP skills and references. Discover file URIs in skill://index.',
      mimeType: 'text/markdown',
    },
    async (uri) => read(uri.toString()),
  );
  server.addResourceReader('skill://', read);
}
