"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUsageInferenceHooks = createUsageInferenceHooks;
const ast_helpers_1 = require("./ast-helpers");
const constants_1 = require("./constants");
const context_1 = require("./context");
const core_1 = require("./core");
const super_module_1 = require("./super-module");
const type_helpers_1 = require("./type-helpers");
function createDisplayCache() {
    let byProgram = new WeakMap();
    return {
        get(key, program, compute) {
            const entries = byProgram.get(program) ?? new Map();
            byProgram.set(program, entries);
            if (entries.has(key))
                return entries.get(key);
            const value = compute();
            if (entries.size >= constants_1.MAX_DISPLAY_CACHE_ENTRIES)
                entries.clear();
            entries.set(key, value);
            return value;
        },
        clear() {
            byProgram = new WeakMap();
        },
    };
}
/**
 * Runs the inference augmentation and degrades to `fallback` (the untouched
 * underlying result) if it throws, so a bug here can't take the whole
 * tsserver request down. Deliberately wraps only the augmentation, never the
 * underlying language-service call: an exception from TypeScript itself must
 * reach tsserver's own error reporting exactly as it would without the
 * plugin. `OperationCanceledException` always propagates: TS throws it
 * cooperatively when the host cancels a request (the user kept typing), and
 * tsserver handles a cancellation very differently from an empty response.
 */
function guarded(options, label, fallback, compute) {
    try {
        return compute();
    }
    catch (error) {
        if (error instanceof options.ts.OperationCanceledException)
            throw error;
        options.log(`usage-inference ${label} failed: ${error.message}`);
        return fallback;
    }
}
function openFile(env, fileName) {
    const program = env.languageService.getProgram();
    const sourceFile = program?.getSourceFile(fileName);
    return program && sourceFile ? { program, sourceFile, checker: program.getTypeChecker() } : undefined;
}
/**
 * True when the checker's own type for `expr` leaves room for inference: an
 * open type (see isOpenForUsageInference), or a value derived from
 * `module.superModule`, whose checker type is never meaningful (sometimes
 * `any`, sometimes an opaque circular `typeof base`).
 */
function isInferenceTarget(ts, checker, expr) {
    return (0, type_helpers_1.isOpenForUsageInference)(ts, checker.getTypeAtLocation(expr)) || !!(0, super_module_1.traceSuperModuleAccess)(ts, checker, expr);
}
function newContext(env, triggerPosition) {
    return (0, context_1.createInferenceContext)(env.ts, env.languageService, env, triggerPosition);
}
/**
 * The declaration a member-name hover documents: the member every inferred
 * receiver type resolves the name to. Receivers that resolve it to different
 * declarations (an override, or unrelated classes) document nothing rather
 * than an arbitrary one of them.
 */
function memberSymbol(ctx, access) {
    const symbols = new Set((0, core_1.inferTypeForExpression)(ctx, access.expression).map((type) => (0, type_helpers_1.getMemberOfType)(ctx.checker, type, access.name.text)));
    const [symbol] = symbols;
    return symbols.size === 1 ? symbol : undefined;
}
/** The class a hover documents when inference resolved exactly one; a union has no single doc comment. */
function soleTypeSymbol(types) {
    return types.length === 1 ? types[0].getSymbol() : undefined;
}
function documentationOf(checker, symbol) {
    const documentation = symbol?.getDocumentationComment(checker) ?? [];
    const tags = symbol?.getJsDocTags(checker) ?? [];
    return {
        documentation: documentation.length > 0 ? documentation : undefined,
        tags: tags.length > 0 ? tags : undefined,
    };
}
/**
 * Infers what a hover on `node` shows. A member name (`productLineItems` in
 * `shipment.productLineItems`) has no declaration of its own until the
 * receiver's type is known, so the whole access is resolved instead.
 * Documentation comes from the member's declaration, or from the inferred
 * class when there is exactly one.
 */
function inferHover(env, node) {
    const ctx = newContext(env);
    if (!ctx)
        return undefined;
    const access = (0, ast_helpers_1.propertyAccessNamedBy)(node, env.ts);
    const types = access ? (0, core_1.inferTypeForExpression)(ctx, access) : (0, core_1.inferTypeForNode)(ctx, node);
    if (types.length === 0)
        return undefined;
    const symbol = access ? memberSymbol(ctx, access) : soleTypeSymbol(types);
    return { description: (0, type_helpers_1.describeTypes)(ctx, types), ...documentationOf(ctx.checker, symbol) };
}
// Header type texts TypeScript renders for a value it could not type: `any`,
// the `object` keyword, and the bare `Object` interface.
const OPEN_TYPE_TEXTS = new Set(['any', 'object', 'Object']);
/** How many trailing display parts spell an open type: `any` / `object` / `Object`, or the two-part `{}`. */
function openTypeTailLength(parts) {
    const last = parts[parts.length - 1];
    if (!last)
        return 0;
    if (OPEN_TYPE_TEXTS.has(last.text) && last.kind !== 'text')
        return 1;
    return last.text === '}' && parts[parts.length - 2]?.text === '{' ? 2 : 0;
}
/**
 * Swaps the open type at the end of a hover header (`(parameter) shipment:
 * any`) for the inferred description, so the bold header reads
 * `(parameter) shipment: Shipment`. Any other header shape is left as it is
 * rather than guessed at.
 */
function replaceOpenTypeTail(parts, description) {
    const tail = openTypeTailLength(parts ?? []);
    if (!parts || tail === 0)
        return parts;
    return [...parts.slice(0, -tail), { kind: 'text', text: description }];
}
function withHoverInference(original, inferred) {
    const note = { kind: 'text', text: `\n\nInferred from usage: ${inferred.description}` };
    return {
        ...original,
        displayParts: replaceOpenTypeTail(original.displayParts, inferred.description),
        documentation: [...(inferred.documentation ?? []), ...(original.documentation ?? []), note],
        tags: inferred.tags ? [...inferred.tags] : original.tags,
    };
}
function decorateQuickInfo(env, cache, fileName, position, original) {
    const { ts } = env;
    const file = openFile(env, fileName);
    const node = file && (0, ast_helpers_1.getNodeAtPosition)(file.sourceFile, ts, position);
    if (!file || !node || !ts.isIdentifier(node) || !isInferenceTarget(ts, file.checker, node))
        return original;
    const key = `hover:${fileName}:${node.getStart(file.sourceFile)}`;
    const inferred = cache.get(key, file.program, () => inferHover(env, node));
    return inferred ? withHoverInference(original, inferred) : original;
}
/**
 * Member entries for `receiver`: the members of its inferred types, plus the
 * ones pass-through superModule overlay levels add
 * (`module.exports = base; module.exports.extra = fn;`), which no candidate
 * type can carry.
 */
function inferMemberEntries(env, receiver, position) {
    const ctx = newContext(env, position);
    if (!ctx)
        return [];
    const augmented = (0, super_module_1.collectSuperModuleAugmentedMembers)(ctx, receiver).map((member) => (0, type_helpers_1.inferredCompletionEntry)(env.ts, member.name, member.isMethod));
    return [...(0, type_helpers_1.typesToCompletionEntries)(env.ts, ctx.checker, (0, core_1.inferTypeForExpression)(ctx, receiver)), ...augmented];
}
/**
 * Appends the inferred entries TypeScript did not already offer (first one
 * per name wins), preserving every other field of its result (isIncomplete,
 * optionalReplacementSpan, metadata, ...). A fresh member CompletionInfo is
 * synthesized only when TypeScript returned nothing at all.
 */
function mergeCompletions(original, inferred) {
    const seen = new Set((original?.entries ?? []).map((entry) => entry.name));
    const added = [];
    for (const entry of inferred) {
        if (seen.has(entry.name))
            continue;
        seen.add(entry.name);
        added.push(entry);
    }
    if (added.length === 0)
        return original;
    if (original)
        return { ...original, entries: [...original.entries, ...added] };
    return { isGlobalCompletion: false, isMemberCompletion: true, isNewIdentifierLocation: false, entries: added };
}
function decorateCompletions(env, cache, fileName, position, original) {
    const file = openFile(env, fileName);
    const access = file && (0, ast_helpers_1.memberCompletionAccess)(file.sourceFile, env.ts, position);
    if (!file || !access || !isInferenceTarget(env.ts, file.checker, access.expression))
        return original;
    // The receiver can be any expression (`product.getPriceModel().|`), and
    // nested receivers share a start (`a` and `a.b`), so the key spans it.
    const receiver = access.expression;
    const key = `completions:${fileName}:${receiver.getStart(file.sourceFile)}-${receiver.getEnd()}`;
    return mergeCompletions(original, cache.get(key, file.program, () => inferMemberEntries(env, receiver, position)));
}
/**
 * Creates the hover and completion decorators for one language service. Each
 * request builds one inference context; finished results are cached per
 * Program, and `reset()` drops them (the plugin calls it when its
 * configuration changes). The host's hook registrations are read once per
 * Program too: hooks.json is no part of the Program, so the next edit is
 * what picks up a change to it.
 */
function createUsageInferenceHooks(host) {
    const hoverCache = createDisplayCache();
    const completionCache = createDisplayCache();
    const registrationCache = createDisplayCache();
    const readRegistrations = host.hookRegistrations;
    const options = {
        ...host,
        hookRegistrations: readRegistrations && ((program) => registrationCache.get('hooks', program, () => readRegistrations(program))),
    };
    return {
        decorateQuickInfo(fileName, position, original) {
            if (!original)
                return original;
            return guarded(options, 'hover', original, () => decorateQuickInfo(options, hoverCache, fileName, position, original));
        },
        decorateCompletions(fileName, position, original) {
            return guarded(options, 'completions', original, () => decorateCompletions(options, completionCache, fileName, position, original));
        },
        reset() {
            hoverCache.clear();
            completionCache.clear();
            registrationCache.clear();
        },
    };
}
