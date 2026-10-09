/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Reference searches, sized for the question inference asks: where is this
// name's value used? TypeScript's find-all-references answers a wider one,
// and pays for it: for any exported name it first maps every import of the
// whole program, work that grows with the project rather than with the name,
// and a single hover may search a dozen names. Inference follows imports
// itself, one hop at a time (see ./value-flow), so a search here only reads
// the files that contain the name, confirming each occurrence with the
// checker; and a name nothing outside its file can refer to (a function's or
// a CommonJS module's own variable) is searched in that one file.
//
// Each search that actually runs (not one served from the cache) is
// published on the `@salesforce/b2c-script-types:reference-search`
// diagnostics channel as `{name, projectWide}`: a deterministic cost measure
// for tests and diagnostics, free when nothing subscribes.

import diagnosticsChannel from 'node:diagnostics_channel';

import type tsserver from 'typescript/lib/tsserverlibrary';

import type {InferenceContext} from './context';
import {getNodeAtPosition} from './ast-helpers';

/** A reference a search finds: a name, or the module path of a require() call that loads the searched module. */
export type Reference = tsserver.Identifier | tsserver.StringLiteralLike;

const searchChannel = diagnosticsChannel.channel('@salesforce/b2c-script-types:reference-search');

// An alias is followed this many links at most (`var {helper} = require()`
// -> `exports.helper = helper` -> the function): real chains are two or
// three links, and the cap keeps a pathological re-export chain bounded.
const MAX_ALIAS_LINKS = 4;

/** The names a SourceFile contains: the parser's own table, or one scanned once per SourceFile. */
interface NameTable {
  has(name: string): boolean;
}

// TypeScript reuses an unchanged file's SourceFile from one Program to the
// next, so a scanned table survives edits elsewhere in the project.
const scannedNames = new WeakMap<tsserver.SourceFile, NameTable>();

// A Program never changes, so neither does a search's answer: kept for as
// long as the Program lives, hovering one name after another in an unchanged
// project runs each search once.
const referencesByProgram = new WeakMap<tsserver.Program, Map<tsserver.Identifier, readonly Reference[]>>();

/**
 * The identifier names `file` contains. The parser records exactly this table
 * on every SourceFile (`identifiers`, which TypeScript's own reference search
 * reads); it is not public API, so it is used only when it has the expected
 * shape, and otherwise rebuilt with the public scanner.
 */
function namesIn(ts: typeof tsserver, file: tsserver.SourceFile): NameTable {
  const parsed = (file as {identifiers?: unknown}).identifiers;
  if (parsed instanceof Map) return parsed;
  let names = scannedNames.get(file);
  if (!names) {
    const scanned = new Set<string>();
    const scanner = ts.createScanner(file.languageVersion, true, file.languageVariant, file.text);
    for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken; kind = scanner.scan()) {
      if (kind === ts.SyntaxKind.Identifier) scanned.add(scanner.getTokenValue());
    }
    names = scanned;
    scannedNames.set(file, names);
  }
  return names;
}

/** The identifiers spelled `text` in `file`, found where its text spells them. */
function identifiersNamed(ts: typeof tsserver, file: tsserver.SourceFile, text: string): tsserver.Identifier[] {
  const found: tsserver.Identifier[] = [];
  for (let pos = file.text.indexOf(text); pos >= 0; pos = file.text.indexOf(text, pos + text.length)) {
    const node = getNodeAtPosition(file, ts, pos);
    if (node && ts.isIdentifier(node) && node.text === text && node.getStart(file) === pos) found.push(node);
  }
  return found;
}

/**
 * The symbols `name` stands for. A `{helper}` shorthand is both a property
 * and a use of the `helper` value; the checker names the property.
 */
function symbolsAt(ctx: InferenceContext, name: tsserver.Identifier): tsserver.Symbol[] {
  const {ts, checker} = ctx;
  const symbol = checker.getSymbolAtLocation(name);
  const value = ts.isShorthandPropertyAssignment(name.parent)
    ? checker.getShorthandAssignmentValueSymbol(name.parent)
    : undefined;
  return [symbol, value].filter((s): s is tsserver.Symbol => s !== undefined);
}

/** `symbol` and the symbols it was instantiated, merged or widened from. */
function withRoots(ctx: InferenceContext, symbol: tsserver.Symbol): tsserver.Symbol[] {
  return [symbol, ...ctx.checker.getRootSymbols(symbol)];
}

/**
 * What a name found by the search may stand for: its own symbols, and every
 * link of an alias chain they start (`var {helper} = require('./helpers')` ->
 * `exports.helper = helper` -> the `helper` function).
 */
function identitiesOf(ctx: InferenceContext, name: tsserver.Identifier): tsserver.Symbol[] {
  const {ts, checker} = ctx;
  return symbolsAt(ctx, name).flatMap((symbol) => {
    const links: tsserver.Symbol[] = [];
    let link: tsserver.Symbol | undefined = symbol;
    for (let hops = 0; link && hops < MAX_ALIAS_LINKS; hops++) {
      links.push(...withRoots(ctx, link));
      link = link.flags & ts.SymbolFlags.Alias ? checker.getImmediateAliasedSymbol(link) : undefined;
    }
    return links;
  });
}

/** What a search looks for: the searched name's symbols and their roots, and the declarations behind them. */
interface SearchTarget {
  readonly name: tsserver.Identifier;
  readonly symbols: ReadonlySet<tsserver.Symbol>;
  readonly declarations: ReadonlySet<tsserver.Declaration>;
  /** The one file whose names can refer to the target, or undefined when any file's can. */
  readonly homeFile?: tsserver.SourceFile;
  /** The module the target is the exports of (`module.exports`), whose require() calls are references too. */
  readonly module?: tsserver.SourceFile;
}

/** True when a search for `target` reads every file of the project: for its name, or for the require() calls of its module. */
function readsProject(target: SearchTarget): boolean {
  return target.homeFile === undefined || target.module !== undefined;
}

/** The module `symbol` is the exports of: `exports` in `module.exports = ...`, or the module symbol itself. */
function moduleOf(ctx: InferenceContext, symbol: tsserver.Symbol): tsserver.SourceFile | undefined {
  const {ts} = ctx;
  if (symbol.valueDeclaration && ts.isSourceFile(symbol.valueDeclaration)) return symbol.valueDeclaration;
  return symbol.escapedName === ts.InternalSymbolName.ExportEquals
    ? symbol.declarations?.[0]?.getSourceFile()
    : undefined;
}

/** True when `declaration` introduces a name into the scope around it, as opposed to a member of some object. */
function declaresScopedName(ts: typeof tsserver, declaration: tsserver.Declaration): boolean {
  return (
    ts.isVariableDeclaration(declaration) ||
    ts.isBindingElement(declaration) ||
    ts.isParameter(declaration) ||
    ts.isFunctionDeclaration(declaration) ||
    ts.isFunctionExpression(declaration) ||
    ts.isClassDeclaration(declaration) ||
    ts.isClassExpression(declaration)
  );
}

/**
 * The file `symbol` is visible in alone, when nothing elsewhere can name it:
 * a variable, parameter, function or class declared inside a function, or at
 * the top level of a CommonJS module. A CommonJS module exports only by
 * assignment (`module.exports.helper = helper`), and that assignment is a
 * reference in the same file, which inference follows on from. Undefined for
 * a member (an `exports.helper` included), a global of a plain script, and an
 * ES module export.
 */
function homeFileOf(ctx: InferenceContext, symbol: tsserver.Symbol): tsserver.SourceFile | undefined {
  const {ts, checker} = ctx;
  const declarations = symbol.declarations ?? [];
  const file = declarations[0]?.getSourceFile();
  if (!file || file.isDeclarationFile || declarations.some((d) => d.getSourceFile() !== file)) return undefined;
  if (!declarations.every((declaration) => declaresScopedName(ts, declaration))) return undefined;
  if (checker.getExportSymbolOfSymbol(symbol) !== symbol) return undefined;
  const isGlobal = checker.resolveName(symbol.name, undefined, ts.SymbolFlags.Value, false) === symbol;
  return isGlobal ? undefined : file;
}

/** The one file all of `symbols` are visible in alone, or undefined when any file may refer to one of them. */
function sharedHomeFile(ctx: InferenceContext, symbols: readonly tsserver.Symbol[]) {
  const files = new Set(symbols.map((symbol) => homeFileOf(ctx, symbol)));
  const [file] = files;
  return files.size === 1 ? file : undefined;
}

function searchTargetOf(ctx: InferenceContext, name: tsserver.Identifier): SearchTarget {
  const own = symbolsAt(ctx, name);
  const symbols = new Set(own.flatMap((symbol) => withRoots(ctx, symbol)));
  const declarations = new Set([...symbols].flatMap((symbol) => symbol.declarations ?? []));
  const module = own.map((symbol) => moduleOf(ctx, symbol)).find((file) => file !== undefined);
  return {name, symbols, declarations, homeFile: module ?? sharedHomeFile(ctx, own), module};
}

/** True when `candidate` stands for what `target` names: the same symbol, directly or through an alias. */
function standsFor(ctx: InferenceContext, candidate: tsserver.Identifier, target: SearchTarget): boolean {
  return identitiesOf(ctx, candidate).some(
    (symbol) =>
      target.symbols.has(symbol) ||
      (symbol.declarations ?? []).some((declaration) => target.declarations.has(declaration)),
  );
}

/** The require() module paths `file` contains: the parser's own list of them, else the `require('…')` calls found by name. */
function modulePathsIn(ctx: InferenceContext, file: tsserver.SourceFile): readonly tsserver.StringLiteralLike[] {
  const {ts} = ctx;
  const imports = (file as {imports?: unknown}).imports;
  if (Array.isArray(imports) && imports.every((node) => ts.isStringLiteralLike(node))) return imports;
  return identifiersNamed(ts, file, 'require').flatMap((callee) => {
    const call = callee.parent;
    const path = ts.isCallExpression(call) && call.expression === callee ? call.arguments[0] : undefined;
    return path && ts.isStringLiteralLike(path) ? [path] : [];
  });
}

/** The name a module path must contain to load `module`: `productHelpers`, or `models` for models/index.js. */
function loadedAs(module: tsserver.SourceFile): string {
  const segments = module.fileName.replace(/\.[^./]+$/, '').split('/');
  const last = segments.pop() ?? '';
  return last === 'index' ? (segments.pop() ?? last) : last;
}

/** The module paths in `files` that load `module`. */
function modulePathsLoading(
  ctx: InferenceContext,
  module: tsserver.SourceFile,
  files: readonly tsserver.SourceFile[],
): tsserver.StringLiteralLike[] {
  const text = loadedAs(module);
  return files.flatMap((file) =>
    modulePathsIn(ctx, file).filter(
      (path) => path.text.includes(text) && ctx.checker.getSymbolAtLocation(path)?.valueDeclaration === module,
    ),
  );
}

function throwIfCancelled(ctx: InferenceContext): void {
  if (ctx.host.isCancellationRequested?.()) throw new ctx.ts.OperationCanceledException();
}

function runSearch(ctx: InferenceContext, target: SearchTarget): Reference[] {
  const {ts, program} = ctx;
  const text = target.name.text;
  const projectFiles = program.getSourceFiles().filter((file) => !file.isDeclarationFile);
  const references: Reference[] = [];
  for (const file of target.homeFile ? [target.homeFile] : projectFiles) {
    if (!namesIn(ts, file).has(text)) continue;
    throwIfCancelled(ctx);
    references.push(...identifiersNamed(ts, file, text).filter((candidate) => standsFor(ctx, candidate, target)));
  }
  if (target.module) references.push(...modulePathsLoading(ctx, target.module, projectFiles));
  return references;
}

/**
 * Every reference to what `name` declares or refers to: each identifier the
 * checker resolves to the same symbol, directly or through an alias, and for
 * a module's `exports`, the require() calls that load the module. A name
 * that is visible in one file alone is searched in that file only; nothing
 * in a declaration file is a use. Cached per Program; spends no budget, the
 * caller does.
 */
export function searchReferences(ctx: InferenceContext, name: tsserver.Identifier): readonly Reference[] {
  let cache = referencesByProgram.get(ctx.program);
  if (!cache) {
    cache = new Map();
    referencesByProgram.set(ctx.program, cache);
  }
  let references = cache.get(name);
  if (!references) {
    throwIfCancelled(ctx);
    const target = searchTargetOf(ctx, name);
    if (searchChannel.hasSubscribers) searchChannel.publish({name: name.text, projectWide: readsProject(target)});
    references = runSearch(ctx, target);
    cache.set(name, references);
  }
  return references;
}
