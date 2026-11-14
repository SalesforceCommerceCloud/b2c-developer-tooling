/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {SecurityRuleInfo} from './types.js';

/** Base URL for per-rule documentation anchors. */
export const SECURITY_RULES_DOCS_URL =
  'https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/security-rules';

/** An ESTree node. Rules receive nodes with `parent` set. */
export interface AstNode {
  type: string;
  range?: [number, number];
  loc?: {start: {line: number; column: number}; end: {line: number; column: number}};
  parent?: AstNode | null;
  [key: string]: unknown;
}

/** A scope from eslint-scope (the subset rules may rely on). */
export interface AstScope {
  type: string;
  upper: AstScope | null;
  variables: AstVariable[];
  set: Map<string, AstVariable>;
  references: AstReference[];
  childScopes: AstScope[];
}

/** A variable from eslint-scope. */
export interface AstVariable {
  name: string;
  defs: {type: string; node: AstNode; name: AstNode}[];
  references: AstReference[];
}

/** A reference from eslint-scope. */
export interface AstReference {
  identifier: AstNode;
  resolved: AstVariable | null;
  writeExpr?: AstNode | null;
  isWrite(): boolean;
}

/**
 * The part of ESLint's `SourceCode` that security rules may use. Every runner
 * (the SDK runner, ESLint 9+, and oxlint JS plugins) provides these members.
 */
export interface ScriptSourceCode {
  text: string;
  ast: AstNode;
  getText(node?: AstNode): string;
  /** Innermost scope containing `node`. Don't depend on the top-level scope's `type`; it differs between runners. */
  getScope(node: AstNode): AstScope;
  getAncestors(node: AstNode): AstNode[];
}

/** What a rule reports. */
export interface ScriptReportDescriptor {
  node: AstNode;
  message: string;
}

/** The rule context: a subset of ESLint's, supported by every runner. */
export interface ScriptRuleContext {
  id: string;
  filename: string;
  options: readonly unknown[];
  settings: Readonly<Record<string, unknown>>;
  sourceCode: ScriptSourceCode;
  report(descriptor: ScriptReportDescriptor): void;
}

/**
 * Visitor functions keyed by ESTree node type, optionally suffixed with
 * `:exit`. Selector syntax (`CallExpression > Identifier`) is not supported.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ScriptRuleListener = Record<string, (node: any) => void>;

/**
 * A Script API security rule. The shape is an ESLint v9 rule, so the same
 * object runs in the SDK runner, in ESLint, and in oxlint's JS plugins.
 */
export interface ScriptRule {
  meta: {
    type: 'problem';
    docs: {description: string; url: string};
    schema: [];
    /** B2C security metadata. */
    b2c: SecurityRuleInfo;
  };
  create(context: ScriptRuleContext): ScriptRuleListener;
}

/** Input to {@link defineScriptRule}. */
export type ScriptRuleDefinition = Omit<SecurityRuleInfo, 'analyzer' | 'docsUrl'> & {
  create(context: ScriptRuleContext): ScriptRuleListener;
};

/**
 * Defines a Script API security rule.
 *
 * @example
 * ```typescript
 * export default defineScriptRule({
 *   id: 'dynamic-code',
 *   severity: 'high',
 *   confidence: 'high',
 *   category: 'injection',
 *   cwe: ['CWE-95'],
 *   description: 'Code built from strings at runtime (eval, new Function, dynamic require).',
 *   remediation: 'Use static requires and plain functions.',
 *   create(context) {
 *     return {
 *       CallExpression(node) {
 *         if (node.callee.type === 'Identifier' && node.callee.name === 'eval') {
 *           context.report({node, message: 'eval() runs code built at runtime.'});
 *         }
 *       },
 *     };
 *   },
 * });
 * ```
 */
export function defineScriptRule(definition: ScriptRuleDefinition): ScriptRule {
  const {create, ...rest} = definition;
  const info: SecurityRuleInfo = {...rest, analyzer: 'script', docsUrl: `${SECURITY_RULES_DOCS_URL}#${rest.id}`};
  return {
    meta: {type: 'problem', docs: {description: info.description, url: info.docsUrl}, schema: [], b2c: info},
    create,
  };
}
