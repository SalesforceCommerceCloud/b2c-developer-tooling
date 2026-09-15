"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSuperModuleFile = findSuperModuleFile;
exports.collectExportAssignments = collectExportAssignments;
exports.isConcreteExportAssignment = isConcreteExportAssignment;
exports.traceSuperModuleAccess = traceSuperModuleAccess;
exports.collectSuperModuleAugmentedMembers = collectSuperModuleAugmentedMembers;
const constants_1 = require("./constants");
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
 * host-supplied ctx.resolveSuperModulePath. Only works when that file is
 * part of the current program (true under the recommended jsconfig setup
 * that includes all cartridge files, but not in a bare inferred project
 * where nothing require()s the base file).
 */
function findSuperModuleFile(ctx, fromFileName) {
    const { program } = ctx;
    if (!ctx.resolveSuperModulePath)
        return undefined;
    const superPath = ctx.resolveSuperModulePath(fromFileName);
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
        if (!ts.isExpressionStatement(stmt) || !ts.isBinaryExpression(stmt.expression))
            continue;
        const bin = stmt.expression;
        if (bin.operatorToken.kind !== ts.SyntaxKind.EqualsToken)
            continue;
        const left = bin.left;
        if (!ts.isPropertyAccessExpression(left))
            continue;
        const base = left.expression;
        if (ts.isIdentifier(base) && base.text === 'module' && left.name.text === 'exports') {
            full.push(bin);
        }
        else if (ts.isIdentifier(base) && base.text === 'exports') {
            members.push({ name: left.name.text, expr: bin.right });
        }
        else if (ts.isPropertyAccessExpression(base) &&
            ts.isIdentifier(base.expression) &&
            base.expression.text === 'module' &&
            base.name.text === 'exports') {
            members.push({ name: left.name.text, expr: bin.right });
        }
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
/**
 * Collects every member the superModule chain reachable from `expr`
 * contributes through export augmentations (`module.exports.name = fn`) at
 * pass-through levels — the members {@link resolveSuperModuleTypes}'s
 * candidate types cannot carry. Used to complete after `base.` in an
 * overlay; the first (highest) level defining a name wins, matching runtime
 * override order.
 */
function collectSuperModuleAugmentedMembers(ctx, expr) {
    const { ts, checker } = ctx;
    const superAccess = traceSuperModuleAccess(ts, checker, expr);
    if (!superAccess)
        return [];
    const out = [];
    const seenNames = new Set();
    const seenFiles = new Set();
    let fromFileName = superAccess.getSourceFile().fileName;
    for (let hop = 0; hop < constants_1.MAX_SUPERMODULE_HOPS; hop++) {
        const superFile = findSuperModuleFile(ctx, fromFileName);
        if (!superFile || seenFiles.has(superFile))
            break;
        seenFiles.add(superFile);
        const { full, members } = collectExportAssignments(superFile, ts);
        for (const m of members) {
            if (seenNames.has(m.name))
                continue;
            seenNames.add(m.name);
            const type = checker.getTypeAtLocation(m.expr);
            out.push({ name: m.name, isMethod: type.getCallSignatures().length > 0 });
        }
        const passesThrough = full.some((bin) => !isConcreteExportAssignment(ctx, bin) || traceSuperModuleAccess(ts, checker, bin.right) !== undefined);
        if (!passesThrough)
            break;
        fromFileName = superFile.fileName;
    }
    return out;
}
