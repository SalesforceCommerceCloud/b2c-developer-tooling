/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import type {McpTool} from '../../utils/index.js';
import {createToolAdapter, jsonResult, type ServicesLoader} from '../adapter.js';
import {
  MAX_TEXT_BYTES,
  readLocalFile,
  readTextRange,
  resolveLocalPath,
  webdavPath,
  writeResponseToFile,
} from './files.js';

const pathSchema = z
  .string()
  .min(1)
  .max(2048)
  .describe('WebDAV Sites-relative path, e.g. Logs/jobs/run.log or Impex/src/import.xml.');

const DOWNLOAD_IDLE_TIMEOUT_MS = 30_000;

function responseMetadata(path: string, response: Response) {
  return {
    path: decodeURIComponent(path),
    contentType: response.headers.get('content-type'),
    etag: response.headers.get('etag'),
    lastModified: response.headers.get('last-modified'),
  };
}

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
        description: `Read exact WebDAV text into the conversation using HTTP byte ranges (maximum ${MAX_TEXT_BYTES} bytes per call). Use tail: true for the end of a log. To save a whole or binary file locally, use webdav_get_to_file.`,
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
          maxBytes: z.number().int().min(4).max(MAX_TEXT_BYTES).default(4000),
          tail: z
            .boolean()
            .default(false)
            .describe('Read the last maxBytes of the file instead of from offset, e.g. recent log lines.'),
        },
        async execute(args: {path: string; offset: number; maxBytes: number; tail: boolean}, context) {
          const path = webdavPath(args.path);
          if (args.tail && args.offset !== 0) throw new Error('tail reads the end of the file; omit offset.');
          const response = await context.b2cInstance!.webdav.request(path, {
            method: 'GET',
            redirect: 'error',
            signal: AbortSignal.timeout(30_000),
            headers: {
              // Byte ranges must refer to the stored bytes, not a compressed transfer.
              'Accept-Encoding': 'identity',
              Range: args.tail ? `bytes=-${args.maxBytes}` : `bytes=${args.offset}-${args.offset + args.maxBytes - 1}`,
            },
          });
          return {
            ...responseMetadata(path, response),
            ...(await readTextRange(response, args.tail ? undefined : args.offset, args.maxBytes)),
          };
        },
        formatOutput: jsonResult,
      },
      loadServices,
    ),
    createToolAdapter(
      {
        name: 'webdav_get_to_file',
        effect: 'write',
        idempotent: false,
        openWorld: true,
        description:
          'Download a whole WebDAV file, including binary archives, to a new file on the MCP host. Streams any size; never overwrites.',
        toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
        requiresInstance: true,
        inputSchema: {
          path: pathSchema,
          outputPath: z
            .string()
            .min(1)
            .describe(
              'New file on the MCP host, within projectDirectory (relative to it). The parent directory must exist.',
            ),
        },
        async execute(args: {path: string; outputPath: string; projectDirectory?: string}, context) {
          const path = webdavPath(args.path);
          // Validate the destination before downloading anything.
          const outputPath = await resolveLocalPath(context.services, args.outputPath, args.projectDirectory, {
            create: true,
          });
          // Abort only when the transfer stalls, so large files are not cut off by a total deadline.
          const controller = new AbortController();
          const idle = setTimeout(
            () => controller.abort(new Error('WebDAV download stalled for 30 seconds.')),
            DOWNLOAD_IDLE_TIMEOUT_MS,
          );
          try {
            const response = await context.b2cInstance!.webdav.request(path, {
              method: 'GET',
              redirect: 'error',
              signal: controller.signal,
            });
            // Re-check before creating the file in case the parent directory changed meanwhile.
            await resolveLocalPath(context.services, args.outputPath, args.projectDirectory, {create: true});
            const size = await writeResponseToFile(response, outputPath, () => idle.refresh());
            return {...responseMetadata(path, response), size, outputPath};
          } finally {
            clearTimeout(idle);
            // Release the response body if validation or the write stopped early.
            controller.abort();
          }
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
            .describe('File on the MCP host, within projectDirectory (relative to it). Maximum 64 MiB.'),
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
              ? await readLocalFile(await resolveLocalPath(context.services, args.sourcePath!, args.projectDirectory))
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
