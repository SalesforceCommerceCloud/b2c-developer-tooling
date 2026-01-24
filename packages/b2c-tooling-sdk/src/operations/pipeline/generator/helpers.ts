/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Helper functions for pipeline-to-controller code generation.
 *
 * @module operations/pipeline/generator/helpers
 */

import type {PipelineIR} from '../types.js';

/**
 * Maps pipeline variable prefixes to their JavaScript global equivalents.
 */
export const VARIABLE_MAPPINGS: Record<string, string> = {
  CurrentCustomer: 'customer',
  CurrentSession: 'session',
  CurrentRequest: 'request',
  CurrentForms: 'session.forms',
  CurrentHttpParameterMap: 'request.httpParameterMap',
};

/**
 * Options for code generation.
 */
export interface GeneratorOptions {
  /** If true, allow unsupported pipelets to be converted with UNSUPPORTED comments instead of failing. */
  allowUnsupported?: boolean;
}

/**
 * Context for code generation.
 */
export interface GeneratorContext {
  /** The pipeline IR (for looking up nodes). */
  pipeline: PipelineIR;
  /** Current indentation level. */
  indent: number;
  /** Set of variable names that have been declared. */
  declaredVars: Set<string>;
  /** Collected require statements. */
  requires: Map<string, string>;
  /** The current pipeline name (for call node resolution). */
  pipelineName: string;
  /** Generator options. */
  options?: GeneratorOptions;
}

/**
 * Transforms a pipeline expression to JavaScript.
 * Handles complex expressions with operators and multiple variable references.
 */
export function transformExpression(expr: string): string {
  if (!expr) return expr;

  // Handle string literals (already JavaScript)
  if (expr.startsWith('"') && expr.endsWith('"')) {
    return expr;
  }

  // Handle &quot; escaped strings from XML
  let result = expr.replace(/&quot;/g, '"');

  // Handle special keywords that should not become pdict.X
  // true, false, null are JavaScript keywords
  result = result.replace(/\btrue\b/g, '___TRUE___');
  result = result.replace(/\bfalse\b/g, '___FALSE___');
  result = result.replace(/\bnull\b/g, '___NULL___');

  // Handle empty() function - it's a Script API function
  result = result.replace(/\bempty\s*\(/g, '___EMPTY___(');

  // Transform all known pipeline variable prefixes
  for (const [prefix, replacement] of Object.entries(VARIABLE_MAPPINGS)) {
    // Match prefix followed by dot or end of word
    const regex = new RegExp(`\\b${prefix}\\b(\\.)?`, 'g');
    result = result.replace(regex, (match, dot) => {
      return dot ? replacement + '.' : replacement;
    });
  }

  // Transform simple identifiers to pdict.X if they look like pipeline variables
  // We need to be careful not to transform things that are already qualified (x.y)
  // Use a more targeted regex that looks for standalone identifiers
  const skipNames = new Set([
    // JavaScript keywords
    'true',
    'false',
    'null',
    'undefined',
    'typeof',
    'instanceof',
    'new',
    'var',
    'let',
    'const',
    'if',
    'else',
    'for',
    'while',
    'return',
    'function',
    'this',
    'throw',
    'try',
    'catch',
    'finally',
    'break',
    'continue',
    'switch',
    'case',
    'default',
    // Already transformed/known globals
    'session',
    'request',
    'customer',
    'response',
    'pdict',
    'action',
    'empty',
    'e',
    // DW API root
    'dw',
  ]);

  // Match capitalized identifiers that are NOT preceded by a dot (not property access)
  // and NOT followed by a dot or open paren (not a namespace or function call)
  // Use word boundary \b to prevent backtracking from matching partial identifiers
  result = result.replace(/(?<![.\w])([A-Z][a-zA-Z0-9_]*)\b(?!\s*[.(])/g, (match, name, offset) => {
    // Skip our placeholder tokens
    if (name.startsWith('___') && name.endsWith('___')) {
      return match;
    }
    // Skip if it's in the skip list (exact match, case-sensitive)
    if (skipNames.has(name)) {
      return match;
    }
    // Check if this is followed by a dot (meaning it's a namespace/object, not a simple var)
    const afterMatch = result.substring(offset + match.length);
    if (afterMatch.startsWith('.')) {
      return match; // It's like Customer.profile - keep as-is for now
    }
    // This looks like a simple variable reference - prefix with pdict.
    return `pdict.${name}`;
  });

  // Restore keywords
  result = result.replace(/___TRUE___/g, 'true');
  result = result.replace(/___FALSE___/g, 'false');
  result = result.replace(/___NULL___/g, 'null');
  result = result.replace(/___EMPTY___/g, 'empty');

  return result;
}

/**
 * Transforms a pipeline variable reference to JavaScript.
 */
export function transformVariable(varRef: string): string {
  if (!varRef || varRef === 'null') return varRef;

  // Don't transform JavaScript built-in names
  const jsBuiltins = new Set([
    'Object',
    'Array',
    'String',
    'Number',
    'Boolean',
    'Date',
    'Error',
    'JSON',
    'Math',
    'RegExp',
    'Function',
    'Symbol',
    'Map',
    'Set',
    'Promise',
  ]);
  if (jsBuiltins.has(varRef)) {
    return varRef;
  }

  // Apply known mappings
  for (const [prefix, replacement] of Object.entries(VARIABLE_MAPPINGS)) {
    if (varRef === prefix) {
      return replacement;
    }
    if (varRef.startsWith(prefix + '.')) {
      return replacement + varRef.substring(prefix.length);
    }
  }

  // Check if it's a simple variable (should be in pdict)
  if (!varRef.includes('.') && !varRef.startsWith('dw.')) {
    return `pdict.${varRef}`;
  }

  return varRef;
}

/**
 * Converts a script file path from pipeline format to controller format.
 * Example: app_storefront_core:checkout/Script.ds -> app_storefront_core/cartridge/scripts/checkout/Script
 */
export function convertScriptPath(scriptFile: string): string {
  const colonIndex = scriptFile.indexOf(':');
  if (colonIndex === -1) {
    return scriptFile.replace(/\.ds$/, '');
  }

  const cartridge = scriptFile.substring(0, colonIndex);
  let path = scriptFile.substring(colonIndex + 1);
  path = path.replace(/\.ds$/, '');

  return `${cartridge}/cartridge/scripts/${path}`;
}

/**
 * Gets a variable name for a require statement.
 */
export function getRequireVarName(modulePath: string): string {
  // Extract the last part of the path
  const parts = modulePath.split('/');
  let name = parts[parts.length - 1];

  // Remove extension
  name = name.replace(/\.\w+$/, '');

  // Convert to valid identifier
  name = name.replace(/[^a-zA-Z0-9_]/g, '_');

  // Capitalize first letter for class-like names
  if (modulePath.startsWith('dw/')) {
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  return name;
}

/**
 * Creates indentation string.
 */
export function indent(level: number): string {
  return '    '.repeat(level);
}
