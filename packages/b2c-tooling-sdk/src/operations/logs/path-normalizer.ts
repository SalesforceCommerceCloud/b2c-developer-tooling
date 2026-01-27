/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Path normalization for B2C Commerce log files.
 *
 * Converts remote cartridge paths in log messages to local paths
 * for IDE click-to-open functionality.
 */
import path from 'node:path';
import {findCartridges, type CartridgeMapping} from '../code/cartridges.js';

/**
 * Options for creating a path normalizer.
 */
export interface PathNormalizerOptions {
  /**
   * Local path to the cartridges directory (simple mode).
   * All cartridge references will be prefixed with this path.
   * @example "./cartridges" or "/Users/dev/project/cartridges"
   */
  cartridgePath?: string;

  /**
   * Discovered cartridge mappings (precise mode).
   * Each cartridge is mapped to its actual local path.
   * Takes precedence over cartridgePath for known cartridges.
   */
  cartridges?: CartridgeMapping[];
}

/**
 * Pattern context types for matching paths.
 */
type PathContext = 'parentheses' | 'quotes' | 'stacktrace' | 'plain';

/**
 * Represents a path pattern to match in log messages.
 */
interface PathPattern {
  /** Regular expression pattern */
  pattern: RegExp;
  /** Context type for the match */
  context: PathContext;
  /** Function to extract the path from a match */
  extractPath: (match: RegExpMatchArray) => string;
  /** Function to build replacement with normalized path */
  buildReplacement: (match: RegExpMatchArray, normalizedPath: string) => string;
}

/**
 * Patterns for matching cartridge paths in various contexts.
 *
 * B2C Commerce log files can contain paths in various formats:
 * - In parentheses: (app_storefront/cartridge/controllers/Home.js:45)
 * - In quotes: 'app_storefront/cartridge/controllers/Home.js:45'
 * - In stack traces: at app_storefront/cartridge/controllers/Home.js:45
 * - Plain paths: app_storefront/cartridge/controllers/Home.js:45
 */
const PATH_PATTERNS: PathPattern[] = [
  // Parentheses: (cartridge_name/cartridge/path/file.js:line)
  {
    pattern: /\(([a-zA-Z0-9_-]+\/cartridge\/[^)]+)\)/g,
    context: 'parentheses',
    extractPath: (match) => match[1],
    buildReplacement: (match, normalizedPath) => `(${normalizedPath})`,
  },
  // Single quotes: 'cartridge_name/cartridge/path/file.js:line'
  {
    pattern: /'([a-zA-Z0-9_-]+\/cartridge\/[^']+)'/g,
    context: 'quotes',
    extractPath: (match) => match[1],
    buildReplacement: (match, normalizedPath) => `'${normalizedPath}'`,
  },
  // Double quotes: "cartridge_name/cartridge/path/file.js:line"
  {
    pattern: /"([a-zA-Z0-9_-]+\/cartridge\/[^"]+)"/g,
    context: 'quotes',
    extractPath: (match) => match[1],
    buildReplacement: (match, normalizedPath) => `"${normalizedPath}"`,
  },
  // Stack trace: at cartridge_name/cartridge/path/file.js:line
  {
    pattern: /at\s+([a-zA-Z0-9_-]+\/cartridge\/[^\s]+)/g,
    context: 'stacktrace',
    extractPath: (match) => match[1],
    buildReplacement: (match, normalizedPath) => `at ${normalizedPath}`,
  },
];

/**
 * Creates a path normalizer function for converting remote cartridge paths
 * to local paths in log messages.
 *
 * Supports two modes:
 * 1. **Cartridge mappings** (precise): Uses discovered cartridges to map each
 *    cartridge name to its actual local path. Best for projects with cartridges
 *    in different locations.
 * 2. **Cartridge path** (simple): Prefixes all paths with a base directory.
 *    Best when all cartridges are in a single directory.
 *
 * @param options - Normalizer options
 * @returns Function that normalizes paths in a message string, or undefined if no options provided
 *
 * @example
 * ```typescript
 * // Using discovered cartridges (recommended)
 * const cartridges = findCartridges('./my-project');
 * const normalize = createPathNormalizer({ cartridges });
 *
 * // Using simple cartridge path
 * const normalize = createPathNormalizer({ cartridgePath: './cartridges' });
 *
 * // Input: "(app_storefront/cartridge/controllers/Home.js:45)"
 * // Output: "(./cartridges/app_storefront/cartridge/controllers/Home.js:45)"
 * const normalized = normalize(logMessage);
 * ```
 */
export function createPathNormalizer(options: PathNormalizerOptions): ((message: string) => string) | undefined {
  const {cartridgePath, cartridges} = options;

  // If no options provided, return undefined
  if (!cartridgePath && (!cartridges || cartridges.length === 0)) {
    return undefined;
  }

  // Build a map of cartridge names to their local paths
  const cartridgeMap = new Map<string, string>();
  if (cartridges) {
    for (const c of cartridges) {
      cartridgeMap.set(c.name, c.src);
    }
  }

  // Normalize the fallback cartridge path (remove trailing slash)
  const normalizedCartridgePath = cartridgePath?.replace(/\/+$/, '');

  return (message: string): string => {
    let result = message;

    for (const {pattern, extractPath, buildReplacement} of PATH_PATTERNS) {
      // Create a fresh regex for each message (stateful with /g flag)
      const regex = new RegExp(pattern.source, pattern.flags);

      result = result.replace(regex, (...args) => {
        // The full match is the first arg, captured groups follow
        const match = args as unknown as RegExpMatchArray;
        const remotePath = extractPath(match);

        // Extract cartridge name from the path (first segment before /cartridge/)
        const cartridgeName = remotePath.split('/')[0];
        const restOfPath = remotePath.substring(cartridgeName.length);

        // Try to find the cartridge in our mappings
        const localCartridgePath = cartridgeMap.get(cartridgeName);

        let localPath: string;
        if (localCartridgePath) {
          // Use the discovered cartridge's actual path
          localPath = `${localCartridgePath}${restOfPath}`;
        } else if (normalizedCartridgePath) {
          // Fall back to simple prefix mode
          localPath = `${normalizedCartridgePath}/${remotePath}`;
        } else {
          // No mapping and no fallback - return original
          return match[0];
        }

        return buildReplacement(match, localPath);
      });
    }

    return result;
  };
}

/**
 * Discovers cartridges and creates a path normalizer automatically.
 *
 * This is a convenience function that combines `findCartridges` with
 * `createPathNormalizer` for easy setup. Cartridge paths are converted
 * to relative paths from the current working directory.
 *
 * @param directory - Directory to search for cartridges (defaults to cwd)
 * @returns Path normalizer function, or undefined if no cartridges found
 *
 * @example
 * ```typescript
 * // Auto-discover cartridges from current directory
 * const normalize = discoverAndCreateNormalizer();
 *
 * // Auto-discover from specific directory
 * const normalize = discoverAndCreateNormalizer('./my-project');
 * ```
 */
export function discoverAndCreateNormalizer(directory?: string): ((message: string) => string) | undefined {
  const searchDir = directory ?? process.cwd();
  const cwd = process.cwd();
  const cartridges = findCartridges(searchDir);

  if (cartridges.length === 0) {
    return undefined;
  }

  // Convert absolute paths to relative paths from cwd
  const relativeCartridges: CartridgeMapping[] = cartridges.map((c) => ({
    ...c,
    src: './' + path.relative(cwd, c.src),
  }));

  return createPathNormalizer({cartridges: relativeCartridges});
}

/**
 * Extracts all cartridge paths from a message.
 *
 * Useful for testing or analysis of log messages.
 *
 * @param message - Log message to extract paths from
 * @returns Array of extracted paths
 *
 * @example
 * ```typescript
 * const paths = extractPaths("Error at (app_storefront/cartridge/controllers/Home.js:45)");
 * // Returns: ["app_storefront/cartridge/controllers/Home.js:45"]
 * ```
 */
export function extractPaths(message: string): string[] {
  const paths: string[] = [];

  for (const {pattern, extractPath} of PATH_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;

    while ((match = regex.exec(message)) !== null) {
      const path = extractPath(match as RegExpMatchArray);
      if (!paths.includes(path)) {
        paths.push(path);
      }
    }
  }

  return paths;
}
