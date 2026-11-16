/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/*
 * String constants across modules, so rules can tell that
 * `require(Constants.HELPER)` or `require(Constants.SCRIPTS + 'helper')` loads a
 * fixed path. A constants module looks like:
 *
 *   var Constants = {};
 *   Constants.SCRIPTS = '~/cartridge/scripts/';
 *   Constants.HELPER = Constants.SCRIPTS + 'helper/Helper';
 *   module.exports = Constants;
 *
 * or `module.exports = {A: '...'}` / `exports.A = '...'`.
 */
import type {AstNode, ScriptRule, ScriptRuleContext, ScriptRuleListener, ScriptSourceCode} from '../rule.js';
import {findVariable, memberChain, propertyName, requiredModuleOf, staticString} from './helpers.js';
import {SECURITY_SETTINGS_KEY, type SecurityRuleSettings} from './project.js';
import {runScriptRules} from './runner.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = AstNode & Record<string, any>;

/**
 * Looks up a string constant exported by the module `specifier` resolves to
 * from `fromFile` (`require(specifier)[property]`). Runners that can read
 * other files pass one in `settings.b2cSecurity.moduleConstant`.
 */
export type ModuleConstantLookup = (fromFile: string, specifier: string, property: string) => string | undefined;

/** The module constant lookup passed to rules, if any. */
export function moduleConstantLookupOf(context: ScriptRuleContext): ModuleConstantLookup | undefined {
  const settings = context.settings?.[SECURITY_SETTINGS_KEY] as SecurityRuleSettings | undefined;
  return typeof settings?.moduleConstant === 'function' ? settings.moduleConstant : undefined;
}

/**
 * The string an expression always evaluates to, if it can be determined:
 * literals, `+` concatenations of them, local `const`/`var` strings,
 * properties of a local object assigned string literals, and properties of a
 * required module (through `lookup`).
 */
export function resolveStaticString(
  node: AstNode | null | undefined,
  sourceCode: ScriptSourceCode,
  filename: string,
  lookup?: ModuleConstantLookup,
  depth = 0,
): string | undefined {
  const n = node as Node | null | undefined;
  if (!n || depth > 8) return undefined;
  const recurse = (child: AstNode) => resolveStaticString(child, sourceCode, filename, lookup, depth + 1);
  const literal = staticString(n);
  if (literal !== undefined) return literal;
  if (n.type === 'BinaryExpression' && n.operator === '+') {
    const left = recurse(n.left);
    const right = left === undefined ? undefined : recurse(n.right);
    return left !== undefined && right !== undefined ? left + right : undefined;
  }
  if (n.type === 'TemplateLiteral') {
    let out = n.quasis[0]?.value?.cooked ?? '';
    for (let i = 0; i < n.expressions.length; i++) {
      const part = recurse(n.expressions[i]);
      if (part === undefined) return undefined;
      out += part + (n.quasis[i + 1]?.value?.cooked ?? '');
    }
    return out;
  }
  if (n.type === 'Identifier') {
    const variable = findVariable(sourceCode.getScope(n), n.name);
    const def = variable?.defs[0];
    if (!variable || variable.defs.length !== 1 || def?.type !== 'Variable') return undefined;
    // Only variables never reassigned.
    if (variable.references.some((r) => r.isWrite() && r.writeExpr !== (def.node as Node).init)) return undefined;
    return recurse((def.node as Node).init);
  }
  if (n.type === 'MemberExpression') {
    const property = propertyName(n);
    const object = n.object as Node;
    if (!property || object.type !== 'Identifier') return undefined;
    const local = localObjectProperty(object, property, sourceCode);
    if (local) return recurse(local);
    const specifier = requiredModuleOf(object, sourceCode);
    if (specifier && lookup) return lookup(filename, specifier, property);
  }
  return undefined;
}

/** The value assigned to `object.property` in this file, when `object` is a local object assigned exactly once. */
function localObjectProperty(object: Node, property: string, sourceCode: ScriptSourceCode): AstNode | undefined {
  const variable = findVariable(sourceCode.getScope(object), object.name);
  if (!variable || variable.defs.length !== 1 || variable.defs[0].type !== 'Variable') return undefined;
  const init = (variable.defs[0].node as Node).init as Node | undefined;
  if (init?.type !== 'ObjectExpression') return undefined;
  const values: AstNode[] = [];
  for (const prop of init.properties as Node[]) {
    if (prop.type === 'Property' && !prop.computed && keyName(prop) === property) values.push(prop.value);
  }
  for (const ref of variable.references) {
    const member = ref.identifier.parent as Node | undefined;
    const assignment = member?.parent as Node | undefined;
    if (
      member?.type === 'MemberExpression' &&
      member.object === ref.identifier &&
      propertyName(member) === property &&
      assignment?.type === 'AssignmentExpression' &&
      assignment.left === member
    ) {
      if (assignment.operator !== '=') return undefined;
      values.push(assignment.right);
    }
  }
  return values.length === 1 ? values[0] : undefined;
}

function keyName(prop: Node): string | undefined {
  return prop.key.type === 'Identifier' ? prop.key.name : staticString(prop.key);
}

/**
 * The string constants a module exports: properties of the exported object
 * (`module.exports = Constants` after `Constants.A = '...'`), of an exported
 * object literal, or `exports.A = '...'`, evaluated with
 * {@link resolveStaticString} (without following other modules). Returns an
 * empty map when the file can't be parsed.
 */
export function moduleStringConstants(text: string, filename: string): Map<string, string> {
  const constants = new Map<string, string>();
  const collector = {
    meta: {b2c: {id: 'module-string-constants'}},
    create(context: ScriptRuleContext): ScriptRuleListener {
      const {sourceCode} = context;
      const pending: Array<[string, AstNode]> = [];
      let exported: Node | undefined;
      return {
        AssignmentExpression(node: Node) {
          if (node.operator !== '=') return;
          const chain = memberChain(node.left);
          if (chain?.join('.') === 'module.exports') {
            exported = node.right;
          } else if (chain && chain.length === 2 && chain[0] === 'exports') {
            pending.push([chain[1], node.right]);
          } else if (chain && chain.length === 3 && chain[0] === 'module' && chain[1] === 'exports') {
            pending.push([chain[2], node.right]);
          }
        },
        'Program:exit'() {
          if (exported?.type === 'ObjectExpression') {
            for (const prop of exported.properties as Node[]) {
              const name = prop.type === 'Property' && !prop.computed ? keyName(prop) : undefined;
              if (name) pending.push([name, prop.value]);
            }
          } else if (exported?.type === 'Identifier') {
            const variable = findVariable(sourceCode.getScope(exported), exported.name);
            for (const ref of variable?.references ?? []) {
              const member = ref.identifier.parent as Node | undefined;
              const name =
                member?.type === 'MemberExpression' && member.object === ref.identifier
                  ? propertyName(member)
                  : undefined;
              if (name) pending.push([name, member!]);
            }
          }
          for (const [name, value] of pending) {
            if (constants.has(name)) continue;
            const resolved = resolveStaticString(value, sourceCode, filename);
            if (resolved !== undefined) constants.set(name, resolved);
          }
        },
      };
    },
  } as unknown as ScriptRule;
  runScriptRules(text, filename, [collector]);
  return constants;
}
