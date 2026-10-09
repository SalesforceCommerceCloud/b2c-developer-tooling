/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// SFCC's `module.superModule` lets a cartridge extend the same-path module in
// the next cartridge down the path (SFRA plugin overlays). These helpers
// recognize a superModule access, find the file it points at, and scan a
// module's `module.exports = ...` / `module.exports.x = ...` assignments.
// They are all "leaf" operations — they never call back into the recursive
// inference engine — so the engine (./core) can depend on them safely without
// creating an import cycle.

import type tsserver from 'typescript/lib/tsserverlibrary';

import {MAX_SUPERMODULE_HOPS} from './constants';
import type {InferenceContext} from './context';
import {isAnyType} from './type-helpers';

/**
 * The SFCC `module.superModule` expression — the runtime handle to the
 * same-path module in the next cartridge down the cartridge path, which SFRA
 * plugin cartridges use to extend base modules. Identified structurally, like
 * the require() detection above.
 */
function isSuperModuleAccess(expr: tsserver.PropertyAccessExpression, ts: typeof tsserver): boolean {
  return ts.isIdentifier(expr.expression) && expr.expression.text === 'module' && expr.name.text === 'superModule';
}

/**
 * Locates the source file `module.superModule` refers to for `fromFileName`
 * — the same-subpath module in the next cartridge down the path, per the
 * host-supplied ctx.resolveSuperModulePath. Only works when that file is
 * part of the current program (true under the recommended jsconfig setup
 * that includes all cartridge files, but not in a bare inferred project
 * where nothing require()s the base file).
 */
export function findSuperModuleFile(ctx: InferenceContext, fromFileName: string): tsserver.SourceFile | undefined {
  const {program} = ctx;
  if (!ctx.resolveSuperModulePath) return undefined;
  const superPath = ctx.resolveSuperModulePath(fromFileName);
  if (!superPath) return undefined;
  // The resolver returns host-normalized (possibly case-folded) paths;
  // program keys may differ in case on case-insensitive filesystems.
  const direct = program.getSourceFile(superPath);
  if (direct) return direct;
  const target = superPath.toLowerCase();
  return program.getSourceFiles().find((sf) => sf.fileName.toLowerCase() === target);
}

/** A module's top-level export assignments — see {@link collectExportAssignments}. */
export interface ExportAssignments {
  readonly full: readonly tsserver.BinaryExpression[];
  readonly members: ReadonlyArray<{readonly name: string; readonly expr: tsserver.Expression}>;
}

/**
 * A module's top-level export assignments, gathered structurally:
 * `full` — every `module.exports = X` right-hand side;
 * `members` — every `module.exports.<name> = X` / `exports.<name> = X`
 * augmentation, the shape SFRA plugin overlays use to add helpers on top of
 * a re-exported base (`module.exports = base; module.exports.extra = extra;`).
 */
export function collectExportAssignments(sf: tsserver.SourceFile, ts: typeof tsserver): ExportAssignments {
  const full: tsserver.BinaryExpression[] = [];
  const members: Array<{name: string; expr: tsserver.Expression}> = [];
  for (const stmt of sf.statements) {
    if (!ts.isExpressionStatement(stmt) || !ts.isBinaryExpression(stmt.expression)) continue;
    const bin = stmt.expression;
    if (bin.operatorToken.kind !== ts.SyntaxKind.EqualsToken || !ts.isPropertyAccessExpression(bin.left)) continue;
    const base = bin.left.expression;
    if (isModuleExports(base, ts)) members.push({name: bin.left.name.text, expr: bin.right});
    else if (ts.isIdentifier(base) && base.text === 'exports')
      members.push({name: bin.left.name.text, expr: bin.right});
    else if (isModuleExports(bin.left, ts)) full.push(bin);
  }
  return {full, members};
}

/** `module.exports`, identified structurally. */
function isModuleExports(expr: tsserver.Expression, ts: typeof tsserver): boolean {
  return (
    ts.isPropertyAccessExpression(expr) &&
    ts.isIdentifier(expr.expression) &&
    expr.expression.text === 'module' &&
    expr.name.text === 'exports'
  );
}
/**
 * True when a `module.exports = X` assignment gives the checker a genuinely
 * usable exports type: not `any`, and actually exposing members. A
 * pass-through overlay (`module.exports = base` where base came from
 * `module.superModule`) fails this — depending on program shape the checker
 * reports its exports as `any` or as an opaque, member-less `typeof base` —
 * and must be resolved by recursing down the cartridge chain instead.
 */
export function isConcreteExportAssignment(ctx: InferenceContext, bin: tsserver.BinaryExpression): boolean {
  const {ts, checker} = ctx;
  const exportsType = checker.getTypeAtLocation(bin.left);
  if (isAnyType(ts, exportsType)) return false;
  return checker.getPropertiesOfType(checker.getApparentType(exportsType)).length > 0;
}

/**
 * Follows `expr` back to a `module.superModule` access if there is one: the
 * expression itself, or — the universal SFRA idiom — a reference to a local
 * `var base = module.superModule;` binding. Exported so the plugin's
 * hover/completion gates can recognize superModule-derived expressions: the
 * checker's own type for them is never meaningful (sometimes `any`,
 * sometimes an opaque circular `typeof base`), so "is the type any?" alone
 * would skip inference exactly where it's needed.
 */
export function traceSuperModuleAccess(
  ts: typeof tsserver,
  checker: tsserver.TypeChecker,
  expr: tsserver.Expression,
): tsserver.PropertyAccessExpression | undefined {
  if (ts.isPropertyAccessExpression(expr) && isSuperModuleAccess(expr, ts)) return expr;
  if (ts.isIdentifier(expr)) {
    const decl = checker.getSymbolAtLocation(expr)?.valueDeclaration;
    if (
      decl &&
      ts.isVariableDeclaration(decl) &&
      decl.initializer &&
      ts.isPropertyAccessExpression(decl.initializer) &&
      isSuperModuleAccess(decl.initializer, ts)
    ) {
      return decl.initializer;
    }
  }
  return undefined;
}

/** True when a level re-exports what is below it (`module.exports = base`) rather than replacing it. */
function passesThrough(ctx: InferenceContext, exports: ExportAssignments): boolean {
  const {ts, checker} = ctx;
  return exports.full.some(
    (bin) => !isConcreteExportAssignment(ctx, bin) || traceSuperModuleAccess(ts, checker, bin.right) !== undefined,
  );
}

/**
 * Walks the superModule chain below the file containing `superAccess`, one
 * cartridge level at a time, yielding each level's export assignments. The
 * walk continues downward only through a pass-through level
 * (`module.exports = base`): a level with a concrete `module.exports`
 * replaces everything below it at runtime, unless it carries the base along.
 */
export function* superModuleLevels(
  ctx: InferenceContext,
  superAccess: tsserver.PropertyAccessExpression,
): Generator<ExportAssignments> {
  const seen = new Set<tsserver.SourceFile>();
  let fromFileName = superAccess.getSourceFile().fileName;
  for (let hop = 0; hop < MAX_SUPERMODULE_HOPS; hop++) {
    const superFile = findSuperModuleFile(ctx, fromFileName);
    if (!superFile || seen.has(superFile)) return;
    seen.add(superFile);
    const exports = collectExportAssignments(superFile, ctx.ts);
    yield exports;
    if (!passesThrough(ctx, exports)) return;
    fromFileName = superFile.fileName;
  }
}

/**
 * Collects every member the superModule chain reachable from `expr`
 * contributes through export augmentations (`module.exports.name = fn`) at
 * pass-through levels — the members the superModule's export types cannot
 * carry. Used to complete after `base.` in an overlay; the first (highest)
 * level defining a name wins, matching runtime override order.
 */
export function collectSuperModuleAugmentedMembers(
  ctx: InferenceContext,
  expr: tsserver.Expression,
): Array<{name: string; isMethod: boolean}> {
  const {ts, checker} = ctx;
  const superAccess = traceSuperModuleAccess(ts, checker, expr);
  if (!superAccess) return [];
  const out: Array<{name: string; isMethod: boolean}> = [];
  const seenNames = new Set<string>();
  for (const {members} of superModuleLevels(ctx, superAccess)) {
    for (const member of members) {
      if (seenNames.has(member.name)) continue;
      seenNames.add(member.name);
      out.push({name: member.name, isMethod: checker.getTypeAtLocation(member.expr).getCallSignatures().length > 0});
    }
  }
  return out;
}
