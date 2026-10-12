/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Editor integration: decorates the language service's own hover and member
// completion results with what usage inference finds for a value the checker
// left open (`any`, `object`, `{}`, bare `Object`, or a `module.superModule`
// binding). Everything here is additive: the caller computes the underlying
// result, and it comes back untouched whenever inference has nothing to add
// or fails.

import type tsserver from 'typescript/lib/tsserverlibrary';

import {getNodeAtPosition, memberCompletionAccess, propertyAccessNamedBy} from './ast-helpers';
import {MAX_DISPLAY_CACHE_ENTRIES} from './constants';
import type {HookRegistration} from '../resolver/hook-registry';
import {contextForProgram} from './context';
import type {InferenceContext, InferenceHost} from './context';
import {inferTypeForExpression, inferTypeForNode} from './core';
import {collectSuperModuleAugmentedMembers, traceSuperModuleAccess} from './super-module';
import {
  describeTypes,
  getMemberOfType,
  inferredCompletionEntry,
  isOpenForUsageInference,
  typesToCompletionEntries,
} from './type-helpers';

interface HookEnvironment extends InferenceHost {
  readonly ts: typeof tsserver;
  readonly languageService: tsserver.LanguageService;
}

interface HookOptions extends HookEnvironment {
  readonly log: (message: string) => void;
}

/**
 * What a hover shows once inference resolved a value: the type text, plus the
 * doc comment and tags borrowed from the real declaration it resolved to
 * (e.g. the `custom` property on `dw.object.ExtensibleObject`). Plain data
 * only — see {@link DisplayCache} for why.
 */
interface HoverInference {
  readonly description: string;
  readonly documentation?: readonly tsserver.SymbolDisplayPart[];
  readonly tags?: readonly tsserver.JSDocTagInfo[];
}

/**
 * Finished display products (hover results, completion entries) per Program,
 * keyed by the request's node. `undefined` ("inference found nothing") is a
 * cached answer too: re-deriving nothing costs the same reference searches as
 * re-deriving something.
 *
 * Values are plain data, never checker Types, Symbols or Nodes: those pin
 * their checker and, through it, the whole Program they came from. Keying on
 * the Program through a WeakMap retires every entry the moment TypeScript
 * drops that Program (it builds a new one for any semantic change and reuses
 * the same instance otherwise), without holding it alive in the meantime.
 */
interface DisplayCache<V> {
  get(key: string, program: tsserver.Program, compute: () => V): V;
  clear(): void;
}

function createDisplayCache<V>(): DisplayCache<V> {
  let byProgram = new WeakMap<tsserver.Program, Map<string, V>>();
  return {
    get(key, program, compute) {
      const entries = byProgram.get(program) ?? new Map<string, V>();
      byProgram.set(program, entries);
      if (entries.has(key)) return entries.get(key) as V;
      const value = compute();
      if (entries.size >= MAX_DISPLAY_CACHE_ENTRIES) entries.clear();
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
function guarded<T>(options: HookOptions, label: string, fallback: T, compute: () => T): T {
  try {
    return compute();
  } catch (error) {
    if (error instanceof options.ts.OperationCanceledException) throw error;
    options.log(`usage-inference ${label} failed: ${(error as Error).message}`);
    return fallback;
  }
}

interface OpenFile {
  readonly program: tsserver.Program;
  readonly sourceFile: tsserver.SourceFile;
  readonly checker: tsserver.TypeChecker;
}

function openFile(env: HookEnvironment, fileName: string): OpenFile | undefined {
  const program = env.languageService.getProgram();
  const sourceFile = program?.getSourceFile(fileName);
  return program && sourceFile ? {program, sourceFile, checker: program.getTypeChecker()} : undefined;
}

/**
 * True when the checker's own type for `expr` leaves room for inference: an
 * open type (see isOpenForUsageInference), or a value derived from
 * `module.superModule`, whose checker type is never meaningful (sometimes
 * `any`, sometimes an opaque circular `typeof base`).
 */
function isInferenceTarget(ts: typeof tsserver, checker: tsserver.TypeChecker, expr: tsserver.Expression): boolean {
  return isOpenForUsageInference(ts, checker.getTypeAtLocation(expr)) || !!traceSuperModuleAccess(ts, checker, expr);
}

/**
 * The declaration a member-name hover documents: the member every inferred
 * receiver type resolves the name to. Receivers that resolve it to different
 * declarations (an override, or unrelated classes) document nothing rather
 * than an arbitrary one of them.
 */
function memberSymbol(ctx: InferenceContext, access: tsserver.PropertyAccessExpression): tsserver.Symbol | undefined {
  const symbols = new Set(
    inferTypeForExpression(ctx, access.expression).map((type) => getMemberOfType(ctx.checker, type, access.name.text)),
  );
  const [symbol] = symbols;
  return symbols.size === 1 ? symbol : undefined;
}

/** The class a hover documents when inference resolved exactly one; a union has no single doc comment. */
function soleTypeSymbol(types: readonly tsserver.Type[]): tsserver.Symbol | undefined {
  return types.length === 1 ? types[0].getSymbol() : undefined;
}

function documentationOf(
  checker: tsserver.TypeChecker,
  symbol: tsserver.Symbol | undefined,
): Pick<HoverInference, 'documentation' | 'tags'> {
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
function inferHover(env: HookEnvironment, file: OpenFile, node: tsserver.Identifier): HoverInference | undefined {
  const ctx = contextForProgram(env.ts, file.program, env);
  const access = propertyAccessNamedBy(node, env.ts);
  const types = access ? inferTypeForExpression(ctx, access) : inferTypeForNode(ctx, node);
  if (types.length === 0) return undefined;
  const symbol = access ? memberSymbol(ctx, access) : soleTypeSymbol(types);
  return {description: describeTypes(ctx, types), ...documentationOf(ctx.checker, symbol)};
}

// Header type texts TypeScript renders for a value it could not type: `any`,
// the `object` keyword, and the bare `Object` interface.
const OPEN_TYPE_TEXTS: ReadonlySet<string> = new Set(['any', 'object', 'Object']);

/** How many trailing display parts spell an open type: `any` / `object` / `Object`, or the two-part `{}`. */
function openTypeTailLength(parts: readonly tsserver.SymbolDisplayPart[]): number {
  const last = parts[parts.length - 1];
  if (!last) return 0;
  if (OPEN_TYPE_TEXTS.has(last.text) && last.kind !== 'text') return 1;
  return last.text === '}' && parts[parts.length - 2]?.text === '{' ? 2 : 0;
}

/**
 * Swaps the open type at the end of a hover header (`(parameter) shipment:
 * any`) for the inferred description, so the bold header reads
 * `(parameter) shipment: Shipment`. Any other header shape is left as it is
 * rather than guessed at.
 */
function replaceOpenTypeTail(
  parts: tsserver.SymbolDisplayPart[] | undefined,
  description: string,
): tsserver.SymbolDisplayPart[] | undefined {
  const tail = openTypeTailLength(parts ?? []);
  if (!parts || tail === 0) return parts;
  return [...parts.slice(0, -tail), {kind: 'text', text: description}];
}

function withHoverInference(original: tsserver.QuickInfo, inferred: HoverInference): tsserver.QuickInfo {
  const note: tsserver.SymbolDisplayPart = {kind: 'text', text: `\n\nInferred from usage: ${inferred.description}`};
  return {
    ...original,
    displayParts: replaceOpenTypeTail(original.displayParts, inferred.description),
    documentation: [...(inferred.documentation ?? []), ...(original.documentation ?? []), note],
    tags: inferred.tags ? [...inferred.tags] : original.tags,
  };
}

function decorateQuickInfo(
  env: HookEnvironment,
  cache: DisplayCache<HoverInference | undefined>,
  fileName: string,
  position: number,
  original: tsserver.QuickInfo,
): tsserver.QuickInfo {
  const {ts} = env;
  const file = openFile(env, fileName);
  const node = file && getNodeAtPosition(file.sourceFile, ts, position);
  if (!file || !node || !ts.isIdentifier(node) || !isInferenceTarget(ts, file.checker, node)) return original;
  const key = `hover:${fileName}:${node.getStart(file.sourceFile)}`;
  const inferred = cache.get(key, file.program, () => inferHover(env, file, node));
  return inferred ? withHoverInference(original, inferred) : original;
}

/**
 * Member entries for `receiver`: the members of its inferred types, plus the
 * ones pass-through superModule overlay levels add
 * (`module.exports = base; module.exports.extra = fn;`), which no candidate
 * type can carry.
 */
function inferMemberEntries(
  env: HookEnvironment,
  file: OpenFile,
  receiver: tsserver.Expression,
  position: number,
): tsserver.CompletionEntry[] {
  const ctx = contextForProgram(env.ts, file.program, env, position);
  const augmented = collectSuperModuleAugmentedMembers(ctx, receiver).map((member) =>
    inferredCompletionEntry(env.ts, member.name, member.isMethod),
  );
  return [...typesToCompletionEntries(env.ts, ctx.checker, inferTypeForExpression(ctx, receiver)), ...augmented];
}

/**
 * Appends the inferred entries TypeScript did not already offer (first one
 * per name wins), preserving every other field of its result (isIncomplete,
 * optionalReplacementSpan, metadata, ...). A fresh member CompletionInfo is
 * synthesized only when TypeScript returned nothing at all.
 */
function mergeCompletions(
  original: tsserver.CompletionInfo | undefined,
  inferred: readonly tsserver.CompletionEntry[],
): tsserver.CompletionInfo | undefined {
  const seen = new Set((original?.entries ?? []).map((entry) => entry.name));
  const added: tsserver.CompletionEntry[] = [];
  for (const entry of inferred) {
    if (seen.has(entry.name)) continue;
    seen.add(entry.name);
    added.push(entry);
  }
  if (added.length === 0) return original;
  if (original) return {...original, entries: [...original.entries, ...added]};
  return {isGlobalCompletion: false, isMemberCompletion: true, isNewIdentifierLocation: false, entries: added};
}

function decorateCompletions(
  env: HookEnvironment,
  cache: DisplayCache<tsserver.CompletionEntry[]>,
  fileName: string,
  position: number,
  original: tsserver.CompletionInfo | undefined,
): tsserver.CompletionInfo | undefined {
  const file = openFile(env, fileName);
  const access = file && memberCompletionAccess(file.sourceFile, env.ts, position);
  if (!file || !access || !isInferenceTarget(env.ts, file.checker, access.expression)) return original;
  // The receiver can be any expression (`product.getPriceModel().|`), and
  // nested receivers share a start (`a` and `a.b`), so the key spans it.
  const receiver = access.expression;
  const key = `completions:${fileName}:${receiver.getStart(file.sourceFile)}-${receiver.getEnd()}`;
  return mergeCompletions(
    original,
    cache.get(key, file.program, () => inferMemberEntries(env, file, receiver, position)),
  );
}

/**
 * Creates the hover and completion decorators for one language service. Each
 * request builds one inference context; finished results are cached per
 * Program, and `reset()` drops them (the plugin calls it when its
 * configuration changes). The host's hook registrations are read once per
 * Program too: hooks.json is no part of the Program, so the next edit is
 * what picks up a change to it.
 */
export function createUsageInferenceHooks(host: HookOptions) {
  const hoverCache = createDisplayCache<HoverInference | undefined>();
  const completionCache = createDisplayCache<tsserver.CompletionEntry[]>();
  const registrationCache = createDisplayCache<readonly HookRegistration[]>();
  const readRegistrations = host.hookRegistrations;
  const options: HookOptions = {
    ...host,
    hookRegistrations:
      readRegistrations && ((program) => registrationCache.get('hooks', program, () => readRegistrations(program))),
  };
  return {
    decorateQuickInfo(fileName: string, position: number, original: tsserver.QuickInfo | undefined) {
      if (!original) return original;
      return guarded(options, 'hover', original, () =>
        decorateQuickInfo(options, hoverCache, fileName, position, original),
      );
    },
    decorateCompletions(fileName: string, position: number, original: tsserver.CompletionInfo | undefined) {
      return guarded(options, 'completions', original, () =>
        decorateCompletions(options, completionCache, fileName, position, original),
      );
    },
    reset() {
      hoverCache.clear();
      completionCache.clear();
      registrationCache.clear();
    },
  };
}
