/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {writeFile} from 'node:fs/promises';
import {z} from 'zod';
import type {McpTool} from '../../utils/index.js';
import {createToolAdapter, jsonResult, type ServicesLoader} from '../adapter.js';
import {readFileResponse, readLocalFile, readTextRange, webdavPath} from './files.js';

const pathSchema = z
  .string()
  .min(1)
  .max(2048)
  .describe('WebDAV Sites-relative path, e.g. Logs/jobs/run.log or Impex/src/import.xml.');

export function createWebDavTools(loadServices: ServicesLoader): McpTool[] {
  return [
    createToolAdapter(
      {
        name: 'webdav_list',
        effect: 'read',
        idempotent: true,
        openWorld: true,
        description: 'List one WebDAV directory with file metadata and pagination. Does not recurse.',
        toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
        requiresInstance: true,
        inputSchema: {
          path: pathSchema,
          offset: z.number().int().min(0).default(0),
          limit: z.number().int().min(1).max(100).default(20),
        },
        async execute(args: {path: string; offset: number; limit: number}, context) {
          const path = webdavPath(args.path);
          const entries = (await context.b2cInstance!.webdav.propfind(path, '1'))
            .map((entry) => {
              const pathname = new URL(entry.href, 'https://webdav.invalid').pathname;
              return {
                path: decodeURIComponent(webdavPath(pathname)),
                isCollection: entry.isCollection,
                contentLength: entry.contentLength,
                lastModified: entry.lastModified,
                contentType: entry.contentType,
              };
            })
            .filter((entry) => webdavPath(entry.path) !== path)
            .sort((a, b) => a.path.localeCompare(b.path));
          const files = entries.slice(args.offset, args.offset + args.limit);
          const end = args.offset + files.length;
          return {
            path: decodeURIComponent(path),
            total: entries.length,
            files,
            nextOffset: files.length > 0 && end < entries.length ? end : null,
          };
        },
        formatOutput: jsonResult,
      },
      loadServices,
    ),
    createToolAdapter(
      {
        name: 'webdav_get',
        effect: 'read',
        idempotent: true,
        openWorld: true,
        description:
          'Read exact WebDAV text using HTTP byte ranges, or download a whole file to the MCP host (maximum 64 MiB).',
        toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
        requiresInstance: true,
        inputSchema: {
          path: pathSchema,
          offset: z
            .number()
            .int()
            .min(0)
            .default(0)
            .describe('Byte offset for text; continue with returned nextOffset.'),
          maxBytes: z.number().int().min(4).max(8000).default(4000),
          outputPath: z
            .string()
            .min(1)
            .optional()
            .describe('Optional new file on the MCP host, relative to projectDirectory. Never overwrites.'),
        },
        async execute(
          args: {path: string; offset: number; maxBytes: number; outputPath?: string; projectDirectory?: string},
          context,
        ) {
          const path = webdavPath(args.path);
          if (args.outputPath && args.offset !== 0)
            throw new Error('outputPath downloads the whole file; omit offset.');
          const response = await context.b2cInstance!.webdav.request(path, {
            method: 'GET',
            redirect: 'error',
            signal: AbortSignal.timeout(30_000),
            ...(args.outputPath ? {} : {headers: {Range: `bytes=${args.offset}-${args.offset + args.maxBytes - 1}`}}),
          });
          const metadata = {
            path: decodeURIComponent(path),
            contentType: response.headers.get('content-type'),
            etag: response.headers.get('etag'),
            lastModified: response.headers.get('last-modified'),
          };
          if (args.outputPath) {
            const data = await readFileResponse(response);
            const outputPath = context.services.resolveWithProjectDirectory(args.outputPath, args.projectDirectory);
            await writeFile(outputPath, data, {flag: 'wx', mode: 0o600});
            return {...metadata, size: data.length, outputPath};
          }
          return {...metadata, ...(await readTextRange(response, args.offset, args.maxBytes))};
        },
        formatOutput: jsonResult,
      },
      loadServices,
    ),
    createToolAdapter(
      {
        name: 'webdav_put',
        effect: 'destructive',
        idempotent: true,
        openWorld: true,
        description:
          'Upload one WebDAV file from text or a local file on the MCP host. Parent directory must exist. Replacement requires overwrite: true.',
        toolsets: ['CARTRIDGES', 'SCAPI'],
        requiresInstance: true,
        inputSchema: {
          path: pathSchema,
          content: z
            .string()
            .max(64 * 1024)
            .optional()
            .describe('UTF-8 text; supply exactly one of content, sourcePath.'),
          sourcePath: z
            .string()
            .min(1)
            .optional()
            .describe('File on the MCP host, relative to projectDirectory. Maximum 64 MiB.'),
          contentType: z.string().max(200).optional(),
          overwrite: z.boolean().default(false),
        },
        async execute(
          args: {
            path: string;
            content?: string;
            sourcePath?: string;
            contentType?: string;
            overwrite: boolean;
            projectDirectory?: string;
          },
          context,
        ) {
          const path = webdavPath(args.path);
          if (!path.includes('/')) throw new Error('A destination file within a WebDAV root is required.');
          if ([args.content, args.sourcePath].filter((value) => value !== undefined).length !== 1) {
            throw new Error('Supply exactly one of content, sourcePath.');
          }
          const data =
            args.content === undefined
              ? await readLocalFile(
                  context.services.resolveWithProjectDirectory(args.sourcePath!, args.projectDirectory),
                )
              : Buffer.from(args.content);
          const response = await context.b2cInstance!.webdav.request(path, {
            method: 'PUT',
            body: new Uint8Array(data),
            redirect: 'error',
            signal: AbortSignal.timeout(30_000),
            headers: {
              'Content-Type':
                args.contentType ??
                (args.content === undefined ? 'application/octet-stream' : 'text/plain; charset=utf-8'),
              ...(args.overwrite ? {} : {'If-None-Match': '*'}),
            },
          });
          await response.body?.cancel();
          if (response.status === 412) throw new Error('Destination exists. Use overwrite: true only to replace it.');
          if (!response.ok)
            throw new Error(
              `WebDAV PUT HTTP ${response.status} ${response.statusText}. Check parent directory and write permissions.`,
            );
          return {path: decodeURIComponent(path), size: data.length, status: response.status};
        },
        formatOutput: jsonResult,
      },
      loadServices,
    ),
  ];
}
