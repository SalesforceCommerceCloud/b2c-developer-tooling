"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceSuperModuleAccess = traceSuperModuleAccess;
exports.resolveSuperModuleTypes = resolveSuperModuleTypes;
exports.resolveSuperModuleMemberTypes = resolveSuperModuleMemberTypes;
exports.collectSuperModuleAugmentedMembers = collectSuperModuleAugmentedMembers;
const ast_helpers_1 = require("./ast-helpers");
const constants_1 = require("./constants");
const context_1 = require("./context");
const type_helpers_1 = require("./type-helpers");
/**
 * The SFCC `module.superModule` expression — the runtime handle to the
 * same-path module in the next cartridge down the cartridge path, which SFRA
 * plugin cartridges use to extend base modules. Identified structurally, like
 * the require() detection above.
 */
function isSuperModuleAccess(expr, ts) {
    return ts.isIdentifier(expr.expression) && expr.expression.text === 'module' && expr.name.text === 'superModule';
}
/**
 * Locates the source file `module.superModule` refers to for `fromFileName`
 * — the same-subpath module in the next cartridge down the path, per the
 * host-supplied ctx.host.resolveSuperModulePath. Only works when that file is
 * part of the current program (true under the recommended jsconfig setup
 * that includes all cartridge files, but not in a bare inferred project
 * where nothing require()s the base file).
 */
function findSuperModuleFile(ctx, fromFileName) {
    const { program } = ctx;
    const superPath = ctx.host.resolveSuperModulePath?.(fromFileName);
    if (!superPath)
        return undefined;
    // The resolver returns host-normalized (possibly case-folded) paths;
    // program keys may differ in case on case-insensitive filesystems.
    const direct = program.getSourceFile(superPath);
    if (direct)
        return direct;
    const target = superPath.toLowerCase();
    return program.getSourceFiles().find((sf) => sf.fileName.toLowerCase() === target);
}
/**
 * A module's top-level export assignments, gathered structurally:
 * `full` — every `module.exports = X` right-hand side;
 * `members` — every `module.exports.<name> = X` / `exports.<name> = X`
 * augmentation, the shape SFRA plugin overlays use to add helpers on top of
 * a re-exported base (`module.exports = base; module.exports.extra = extra;`).
 */
function collectExportAssignments(sf, ts) {
    const full = [];
    const members = [];
    for (const stmt of sf.statements) {
        const assignment = (0, ast_helpers_1.memberAssignmentOf)(stmt, ts);
        if (!assignment)
            continue;
        const { binary, target } = assignment;
        if ((0, ast_helpers_1.isExportsObject)(target.expression, ts))
            members.push({ name: target.name.text, expr: binary.right });
        else if ((0, ast_helpers_1.isModuleExports)(target, ts))
            full.push(binary);
    }
    return { full, members };
}
/**
 * True when a `module.exports = X` assignment gives the checker a genuinely
 * usable exports type: not `any`, and actually exposing members. A
 * pass-through overlay (`module.exports = base` where base came from
 * `module.superModule`) fails this — depending on program shape the checker
 * reports its exports as `any` or as an opaque, member-less `typeof base` —
 * and must be resolved by recursing down the cartridge chain instead.
 */
function isConcreteExportAssignment(ctx, bin) {
    const { ts, checker } = ctx;
    const exportsType = checker.getTypeAtLocation(bin.left);
    if ((0, type_helpers_1.isAnyType)(ts, exportsType))
        return false;
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
function traceSuperModuleAccess(ts, checker, expr) {
    if (ts.isPropertyAccessExpression(expr) && isSuperModuleAccess(expr, ts))
        return expr;
    if (ts.isIdentifier(expr)) {
        const decl = checker.getSymbolAtLocation(expr)?.valueDeclaration;
        if (decl &&
            ts.isVariableDeclaration(decl) &&
            decl.initializer &&
            ts.isPropertyAccessExpression(decl.initializer) &&
            isSuperModuleAccess(decl.initializer, ts)) {
            return decl.initializer;
        }
    }
    return undefined;
}
/** True when a level re-exports what is below it (`module.exports = base`) rather than replacing it. */
function passesThrough(ctx, exports) {
    const { ts, checker } = ctx;
    return exports.full.some((bin) => !isConcreteExportAssignment(ctx, bin) || traceSuperModuleAccess(ts, checker, bin.right) !== undefined);
}
/**
 * Walks the superModule chain below the file containing `superAccess`, one
 * cartridge level at a time, yielding each level's export assignments. The
 * walk continues downward only through a pass-through level
 * (`module.exports = base`): a level with a concrete `module.exports`
 * replaces everything below it at runtime, unless it carries the base along.
 */
function* superModuleLevels(ctx, superAccess) {
    const seen = new Set();
    let fromFileName = superAccess.getSourceFile().fileName;
    for (let hop = 0; hop < constants_1.MAX_SUPERMODULE_HOPS; hop++) {
        const superFile = findSuperModuleFile(ctx, fromFileName);
        if (!superFile || seen.has(superFile))
            return;
        seen.add(superFile);
        const exports = collectExportAssignments(superFile, ctx.ts);
        yield exports;
        if (!passesThrough(ctx, exports))
            return;
        fromFileName = superFile.fileName;
    }
}
/**
 * The types one `module.exports = X` assignment of a superModule level
 * contributes. The checker's type for `module.exports` is used when it is
 * concrete — it merges the assigned object with later
 * `module.exports.name = fn` augmentations. A pass-through overlay
 * (`module.exports = base`, base itself a superModule) is resolved by
 * recursing into the right-hand side instead, another cartridge down; the
 * checker sometimes merges such a level into an opaque `typeof base` that
 * still carries none of the deeper cartridges' members, so a pass-through
 * right-hand side is recursed into even when the left side looked concrete.
 */
function superModuleExportTypes(ctx, assignment, resolve) {
    const { ts, checker } = ctx;
    const concrete = isConcreteExportAssignment(ctx, assignment);
    const types = concrete ? [checker.getTypeAtLocation(assignment.left)] : [];
    if (!concrete || traceSuperModuleAccess(ts, checker, assignment.right))
        types.push(...resolve(assignment.right));
    return types;
}
/**
 * Resolves what `module.superModule` evaluates to: the export type(s) of the
 * same-subpath module in the next cartridge down the path. Members a
 * pass-through level *adds* can't be merged into these types; they are
 * resolved by name in {@link resolveSuperModuleMemberTypes}.
 */
function resolveSuperModuleTypes(ctx, expr, resolve) {
    const superFile = findSuperModuleFile(ctx, expr.getSourceFile().fileName);
    if (!superFile)
        return [];
    // The guard catches overlay cycles from a misconfigured cartridge path.
    return (0, context_1.withCycleGuard)(ctx, superFile, [], () => (0, type_helpers_1.dedupeTypes)(ctx, collectExportAssignments(superFile, ctx.ts).full.flatMap((assignment) => superModuleExportTypes(ctx, assignment, resolve))));
}
/**
 * Resolves `memberName` from the first superModule level (walking down the
 * cartridge path) that adds it as an export augmentation
 * (`module.exports.name = fn`) — the complement to
 * {@link resolveSuperModuleTypes} for members no export type carries.
 */
function resolveSuperModuleMemberTypes(ctx, superAccess, memberName, resolve) {
    for (const { members } of superModuleLevels(ctx, superAccess)) {
        const matches = members.filter((member) => member.name === memberName);
        if (matches.length === 0)
            continue;
        return (0, type_helpers_1.dedupeKnownTypes)(ctx, matches.flatMap((member) => resolve(member.expr)));
    }
    return [];
}
/**
 * Collects every member the superModule chain reachable from `expr`
 * contributes through export augmentations (`module.exports.name = fn`) at
 * pass-through levels — the members the superModule's export types cannot
 * carry. Used to complete after `base.` in an overlay; the first (highest)
 * level defining a name wins, matching runtime override order.
 */
function collectSuperModuleAugmentedMembers(ctx, expr) {
    const { ts, checker } = ctx;
    const superAccess = traceSuperModuleAccess(ts, checker, expr);
    if (!superAccess)
        return [];
    const out = [];
    const seenNames = new Set();
    for (const { members } of superModuleLevels(ctx, superAccess)) {
        for (const member of members) {
            if (seenNames.has(member.name))
                continue;
            seenNames.add(member.name);
            out.push({ name: member.name, isMethod: checker.getTypeAtLocation(member.expr).getCallSignatures().length > 0 });
        }
    }
    return out;
}
