/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Extract static asset paths from component JSON data using dot-notation queries.
 *
 * Supports `*` as a wildcard segment to traverse arrays, allowing extraction
 * from repeated structures like `banners.*.image.src`.
 *
 * @param data - Parsed JSON data from a component's `<data>` element
 * @param queries - Dot-notation paths to extract (e.g. `['image.path', 'slides.*.image.src']`)
 * @returns Array of extracted asset path strings
 *
 * @example
 * ```typescript
 * const data = { image: { path: '/images/hero.jpg' } };
 * extractAssetPaths(data, ['image.path']);
 * // => ['/images/hero.jpg']
 *
 * const data2 = { slides: [{ image: { src: '/a.jpg' } }, { image: { src: '/b.jpg' } }] };
 * extractAssetPaths(data2, ['slides.*.image.src']);
 * // => ['/a.jpg', '/b.jpg']
 * ```
 */
export function extractAssetPaths(data: Record<string, unknown>, queries: string[]): string[] {
  const results: string[] = [];

  for (const query of queries) {
    const segments = query.split('.');
    collectPaths(data, segments, 0, results);
  }

  return results;
}

/**
 * Recursively walks the data object following the query segments.
 * Wildcard `*` segments iterate over array elements.
 */
function collectPaths(current: unknown, segments: string[], index: number, results: string[]): void {
  if (current == null || typeof current !== 'object') {
    return;
  }

  if (index >= segments.length) {
    return;
  }

  const segment = segments[index];
  const isLast = index === segments.length - 1;

  if (segment === '*') {
    // Wildcard: iterate over array elements (or object values)
    const items = Array.isArray(current) ? current : Object.values(current as Record<string, unknown>);
    for (const item of items) {
      if (isLast) {
        if (typeof item === 'string' && item.length > 0) {
          results.push(item);
        }
      } else {
        collectPaths(item, segments, index + 1, results);
      }
    }
  } else {
    const value = (current as Record<string, unknown>)[segment];
    if (value === undefined || value === null) {
      return;
    }

    if (isLast) {
      if (typeof value === 'string' && value.length > 0) {
        results.push(value);
      }
    } else {
      collectPaths(value, segments, index + 1, results);
    }
  }
}
