/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as eslintScope from 'eslint-scope';
import * as espree from 'espree';
import {KEYS, getKeys} from 'eslint-visitor-keys';

import type {AstNode, AstScope, ScriptRule, ScriptRuleListener, ScriptSourceCode} from '../rule.js';

/** A comment from the parser. */
export interface ScriptComment {
  type: 'Block' | 'Line';
  value: string;
  loc: {start: {line: number; column: number}; end: {line: number; column: number}};
}

/** A problem a rule reported, before it becomes a finding. */
export interface ScriptRuleReport {
  ruleId: string;
  message: string;
  /** 1-based. */
  line: number;
  /** 1-based. */
  column: number;
  endLine: number;
  endColumn: number;
}

/** The result of running script rules over one file. */
export interface ScriptRunResult {
  reports: ScriptRuleReport[];
  comments: ScriptComment[];
  /** Set when the file could not be parsed; no rules ran. */
  parseError?: {message: string; line?: number; column?: number};
}

interface ParsedScript {
  ast: AstNode & {comments?: ScriptComment[]};
  sourceType: 'commonjs' | 'module';
}

/**
 * Parses cartridge JavaScript. Script API code is CommonJS (top-level `return`
 * is allowed); files using `import`/`export` are retried as modules.
 */
export function parseScript(text: string): ParsedScript {
  const options = {ecmaVersion: 'latest' as const, range: true, loc: true, comment: true, tokens: true};
  try {
    return {
      ast: espree.parse(text, {...options, sourceType: 'commonjs'}) as ParsedScript['ast'],
      sourceType: 'commonjs',
    };
  } catch (error) {
    try {
      return {ast: espree.parse(text, {...options, sourceType: 'module'}) as ParsedScript['ast'], sourceType: 'module'};
    } catch {
      throw error;
    }
  }
}

/**
 * Runs ESLint-shaped rules over one file without ESLint.
 *
 * Supports node-type visitors and `:exit` visitors, `context.report`, and the
 * `sourceCode` members in {@link ScriptSourceCode}. Every node has `parent` set
 * before any visitor sees it, as in ESLint.
 */
export function runScriptRules(
  text: string,
  filename: string,
  rules: readonly ScriptRule[],
  settings: Record<string, unknown> = {},
): ScriptRunResult {
  let parsed: ParsedScript;
  try {
    parsed = parseScript(text);
  } catch (error) {
    const e = error as {message?: string; lineNumber?: number; column?: number};
    return {
      reports: [],
      comments: [],
      parseError: {message: e.message ?? String(error), line: e.lineNumber, column: e.column},
    };
  }

  const {ast, sourceType} = parsed;
  const scopeManager = eslintScope.analyze(ast, {
    ecmaVersion: espree.latestEcmaVersion + 2009,
    sourceType,
    nodejsScope: sourceType === 'commonjs',
    ignoreEval: true,
    childVisitorKeys: KEYS,
    fallback: getKeys as (node: unknown) => string[],
  });

  setParents(ast);

  const sourceCode: ScriptSourceCode = {
    text,
    ast,
    getText(node?: AstNode) {
      if (!node?.range) return node ? '' : text;
      return text.slice(node.range[0], node.range[1]);
    },
    getScope(node: AstNode): AstScope {
      // Mirrors ESLint's SourceCode#getScope.
      const inner = node.type !== 'Program';
      for (let current: AstNode | null | undefined = node; current; current = current.parent) {
        const scope = scopeManager.acquire(current, inner) as AstScope | null;
        if (scope) {
          return scope.type === 'function-expression-name' ? scope.childScopes[0] : scope;
        }
      }
      return scopeManager.scopes[0] as AstScope;
    },
    getAncestors(node: AstNode): AstNode[] {
      const ancestors: AstNode[] = [];
      for (let current = node.parent; current; current = current.parent) ancestors.unshift(current);
      return ancestors;
    },
  };

  const reports: ScriptRuleReport[] = [];
  const listeners = new Map<string, Array<(node: AstNode) => void>>();
  for (const rule of rules) {
    const ruleId = rule.meta.b2c.id;
    const listener: ScriptRuleListener = rule.create({
      id: ruleId,
      filename,
      options: [],
      settings,
      sourceCode,
      report({node, message}) {
        const loc = node.loc ?? {start: {line: 1, column: 0}, end: {line: 1, column: 0}};
        reports.push({
          ruleId,
          message,
          line: loc.start.line,
          column: loc.start.column + 1,
          endLine: loc.end.line,
          endColumn: loc.end.column + 1,
        });
      },
    });
    for (const [key, fn] of Object.entries(listener)) {
      if (typeof fn !== 'function') continue;
      const list = listeners.get(key) ?? [];
      list.push(fn);
      listeners.set(key, list);
    }
  }

  const visit = (node: AstNode) => {
    for (const fn of listeners.get(node.type) ?? []) fn(node);
    for (const key of KEYS[node.type] ?? getKeys(node)) {
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) if (isNode(c)) visit(c);
      } else if (isNode(child)) {
        visit(child);
      }
    }
    for (const fn of listeners.get(`${node.type}:exit`) ?? []) fn(node);
  };
  visit(ast);

  reports.sort((a, b) => a.line - b.line || a.column - b.column);
  return {reports, comments: ast.comments ?? []};
}

function isNode(value: unknown): value is AstNode {
  return typeof value === 'object' && value !== null && typeof (value as AstNode).type === 'string';
}

function setParents(root: AstNode): void {
  const stack: AstNode[] = [root];
  root.parent = null;
  while (stack.length > 0) {
    const node = stack.pop()!;
    for (const key of KEYS[node.type] ?? getKeys(node)) {
      const child = node[key];
      const children = Array.isArray(child) ? child : [child];
      for (const c of children) {
        if (isNode(c)) {
          c.parent = node;
          stack.push(c);
        }
      }
    }
  }
}
