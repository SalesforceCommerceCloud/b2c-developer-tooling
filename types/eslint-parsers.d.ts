/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Minimal declarations for the untyped parser packages used by the SDK security script analyzer.

declare module 'espree' {
  export const latestEcmaVersion: number;
  export function parse(
    code: string,
    options?: {
      ecmaVersion?: number | 'latest';
      sourceType?: 'commonjs' | 'module' | 'script';
      range?: boolean;
      loc?: boolean;
      comment?: boolean;
      tokens?: boolean;
      ecmaFeatures?: {globalReturn?: boolean; impliedStrict?: boolean; jsx?: boolean};
    },
  ): unknown;
}

declare module 'eslint-scope' {
  export interface ScopeManagerLike {
    scopes: unknown[];
    acquire(node: unknown, inner?: boolean): unknown;
  }
  export function analyze(
    ast: unknown,
    options?: {
      ecmaVersion?: number;
      sourceType?: 'commonjs' | 'module' | 'script';
      nodejsScope?: boolean;
      ignoreEval?: boolean;
      impliedStrict?: boolean;
      childVisitorKeys?: Record<string, readonly string[]>;
      fallback?: (node: unknown) => string[];
    },
  ): ScopeManagerLike;
}
