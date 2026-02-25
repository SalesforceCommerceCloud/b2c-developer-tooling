/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

export interface FigmaParams {
  fileKey: string;
  nodeId: string;
}

/**
 * Parses a Figma URL to extract fileKey and nodeId
 *
 * Supported URL formats:
 * - https://figma.com/design/:fileKey/:fileName?node-id=1-2
 * - https://www.figma.com/design/:fileKey/:fileName?node-id=1-2
 * - https://figma.com/file/:fileKey/:fileName?node-id=1-2
 *
 * @param figmaUrl - The Figma URL to parse
 * @returns Object with fileKey and nodeId, or throws error if invalid
 */
export function parseFigmaUrl(figmaUrl: string): FigmaParams {
  try {
    const url = new URL(figmaUrl);

    // Validate it's a Figma URL
    if (!url.hostname.includes('figma.com')) {
      throw new Error('URL must be from figma.com');
    }

    // Extract fileKey from pathname
    // Pattern: /design/:fileKey/:fileName or /file/:fileKey/:fileName
    const pathMatch = url.pathname.match(/\/(design|file)\/([^/]+)/);
    if (!pathMatch || !pathMatch[2]) {
      throw new Error(
        'Could not extract fileKey from URL. Expected format: https://figma.com/design/:fileKey/:fileName',
      );
    }

    const fileKey = pathMatch[2];

    // Extract nodeId from query params
    // Pattern: ?node-id=1-2 or ?node-id=1:2
    const nodeIdParam = url.searchParams.get('node-id');
    if (!nodeIdParam) {
      throw new Error('Could not extract node-id from URL. Expected query parameter: ?node-id=1-2');
    }

    // Convert node-id format from "1-2" to "1:2" (Figma MCP expects colon format)
    const nodeId = nodeIdParam.replaceAll('-', ':');

    return {
      fileKey,
      nodeId,
    };
  } catch (error) {
    if (error instanceof TypeError) {
      throw new TypeError(`Invalid URL format: ${figmaUrl}`);
    }
    throw error;
  }
}
