/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Options for JSON merge operations
 */
export interface JsonMergeOptions {
  /** JSON path to the target location (e.g., "scripts", "hooks.dw.ocapi") */
  jsonPath?: string;
  /** Whether to create the path if it doesn't exist */
  createPath?: boolean;
}

/**
 * Navigate to a nested JSON path and return parent + key
 * @param obj - The object to navigate
 * @param path - Dot-separated path (e.g., "hooks.dw.ocapi")
 * @returns Tuple of [parent object, final key, success]
 */
function navigateToPath(obj: unknown, path: string): [Record<string, unknown> | null, string, boolean] {
  if (!path) {
    return [null, '', false];
  }

  const parts = path.split('.');
  const finalKey = parts.pop()!;
  let current = obj as Record<string, unknown>;

  for (const part of parts) {
    if (current === null || typeof current !== 'object') {
      return [null, finalKey, false];
    }
    if (!(part in current)) {
      return [null, finalKey, false];
    }
    current = current[part] as Record<string, unknown>;
  }

  if (current === null || typeof current !== 'object') {
    return [null, finalKey, false];
  }

  return [current, finalKey, true];
}

/**
 * Create a nested path in an object
 * @param obj - The object to modify
 * @param path - Dot-separated path to create
 * @returns The parent object of the final key
 */
function createPath(obj: Record<string, unknown>, path: string): [Record<string, unknown>, string] {
  const parts = path.split('.');
  const finalKey = parts.pop()!;
  let current = obj;

  for (const part of parts) {
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  return [current, finalKey];
}

/**
 * Deep merge two objects, with source overriding target for conflicts
 */
function deepMerge(target: unknown, source: unknown): unknown {
  if (Array.isArray(source)) {
    if (Array.isArray(target)) {
      // Merge arrays by appending source items not already in target
      const result = [...target];
      for (const item of source) {
        const itemStr = JSON.stringify(item);
        const exists = result.some((existing) => JSON.stringify(existing) === itemStr);
        if (!exists) {
          result.push(item);
        }
      }
      return result;
    }
    return source;
  }

  if (source !== null && typeof source === 'object') {
    if (target !== null && typeof target === 'object' && !Array.isArray(target)) {
      const result = {...(target as Record<string, unknown>)};
      for (const key of Object.keys(source as Record<string, unknown>)) {
        result[key] = deepMerge(result[key], (source as Record<string, unknown>)[key]);
      }
      return result;
    }
    return source;
  }

  return source;
}

/**
 * Merge JSON content into an existing JSON string
 * @param existingJson - The existing JSON string
 * @param newContent - JSON content to merge (string or object)
 * @param options - Merge options
 * @returns Updated JSON string
 */
export function mergeJson(
  existingJson: string,
  newContent: string | Record<string, unknown>,
  options: JsonMergeOptions = {},
): string {
  const existing = JSON.parse(existingJson);
  const content = typeof newContent === 'string' ? JSON.parse(newContent) : newContent;

  if (options.jsonPath) {
    const [parent, key, found] = navigateToPath(existing, options.jsonPath);

    if (!found) {
      if (options.createPath !== false) {
        const [newParent, newKey] = createPath(existing, options.jsonPath);
        newParent[newKey] = content;
      } else {
        throw new Error(`JSON path not found: ${options.jsonPath}`);
      }
    } else if (parent) {
      parent[key] = deepMerge(parent[key], content);
    }
  } else {
    // Merge at root level
    const merged = deepMerge(existing, content);
    return JSON.stringify(merged, null, 2);
  }

  return JSON.stringify(existing, null, 2);
}

/**
 * Options for text insertion operations
 */
export interface TextInsertOptions {
  /** Marker string to find for insert-after/insert-before */
  marker?: string;
  /** Whether to add a newline after the inserted content */
  addNewline?: boolean;
}

/**
 * Insert text after a marker in existing content
 * @param existingContent - The existing text content
 * @param newContent - Content to insert
 * @param marker - Marker string to find
 * @returns Updated content
 */
export function insertAfter(existingContent: string, newContent: string, marker: string): string {
  const index = existingContent.indexOf(marker);
  if (index === -1) {
    throw new Error(`Marker not found: ${marker}`);
  }

  let insertPoint = index + marker.length;

  // If there's a newline right after the marker, insert after it
  if (existingContent[insertPoint] === '\n') {
    insertPoint++;
  }

  // Check if we need to add a newline before the new content
  const needsNewlineBefore =
    insertPoint > 0 && existingContent[insertPoint - 1] !== '\n' && !newContent.startsWith('\n');
  // Check if we need to add a newline after the new content
  const needsNewlineAfter =
    !newContent.endsWith('\n') && insertPoint < existingContent.length && existingContent[insertPoint] !== '\n';

  return (
    existingContent.slice(0, insertPoint) +
    (needsNewlineBefore ? '\n' : '') +
    newContent +
    (needsNewlineAfter ? '\n' : '') +
    existingContent.slice(insertPoint)
  );
}

/**
 * Insert text before a marker in existing content
 * @param existingContent - The existing text content
 * @param newContent - Content to insert
 * @param marker - Marker string to find
 * @returns Updated content
 */
export function insertBefore(existingContent: string, newContent: string, marker: string): string {
  const index = existingContent.indexOf(marker);
  if (index === -1) {
    throw new Error(`Marker not found: ${marker}`);
  }

  // Check if we need to add a newline before the new content
  const needsNewlineBefore = index > 0 && existingContent[index - 1] !== '\n' && !newContent.startsWith('\n');
  // Check if we need to add a newline after the new content (before marker)
  const needsNewlineAfter = !newContent.endsWith('\n');

  return (
    existingContent.slice(0, index) +
    (needsNewlineBefore ? '\n' : '') +
    newContent +
    (needsNewlineAfter ? '\n' : '') +
    existingContent.slice(index)
  );
}

/**
 * Append content to the end of existing content
 * @param existingContent - The existing text content
 * @param newContent - Content to append
 * @returns Updated content
 */
export function appendContent(existingContent: string, newContent: string): string {
  const needsNewline = existingContent.length > 0 && !existingContent.endsWith('\n');
  return existingContent + (needsNewline ? '\n' : '') + newContent;
}

/**
 * Prepend content to the beginning of existing content
 * @param existingContent - The existing text content
 * @param newContent - Content to prepend
 * @returns Updated content
 */
export function prependContent(existingContent: string, newContent: string): string {
  const needsNewline = !newContent.endsWith('\n') && existingContent.length > 0;
  return newContent + (needsNewline ? '\n' : '') + existingContent;
}
