/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
'use strict';

// Ground-truth evaluation of usage inference against real cartridges.
//
// Skipped unless B2C_INFERENCE_CORPUS names one or more directories
// (path.delimiter-separated) that contain cartridges (`.project` markers):
//
//   B2C_INFERENCE_CORPUS=/path/to/sfra/cartridges:/path/to/plugin_x/cartridges \
//     pnpm --filter @salesforce/b2c-script-types exec mocha test/eval/ground-truth.test.js
//
// Real cartridges document many helpers with a `dw.*` JSDoc type. Those are
// the answer key: for one file at a time, every `{dw.*}` @param/@returns type
// is blanked out in memory (same length, so offsets stay valid), and the
// plugin is asked — through the real hover path for parameters, the engine
// entry point for returns — what it would infer for the now-undocumented
// value. Each answer is scored against the documented type:
//
//   exact    same class(es) as documented
//   union    a union that contains the documented class
//   related  an ancestor or descendant of the documented class
//            (`LineItemCtnr` documented, `Basket` inferred, or vice versa)
//   wrong    an unrelated class
//   silent   no inference
//
// Precision = (exact + union + related) / fired, recall = the same / total.
// Every silent parameter is triaged into why it stayed silent (no call sites
// found, budget exhausted, evidence dropped by the policy, no evidence), so a
// change can target the largest bucket. Local variables whose `dw.*` type
// came only from the blanked JSDoc are re-inferred and scored too: that is
// the end-to-end effect a user sees in hovers and completions on locals.
// Parameters that carry no type at all in the original source are hovered
// too, to measure how often inference fires on genuinely undocumented code.
// Cost is reported as wall time and as reference searches per request,
// project-wide and single-file ones apart; the search count is the same on
// every machine and run, so compare that one.
//
// Optional: B2C_INFERENCE_CARTRIDGE_PATH (colon-separated cartridge names)
// sets the cartridge order, B2C_INFERENCE_REPORT writes the full JSON report
// (mismatches, timings, searches, slowest requests, undocumented samples) to
// that file.

const fs = require('node:fs');
const path = require('node:path');

const ts = require('typescript');

const {discoverCartridgesOnDisk, orderCartridges} = require('../../src/resolver/cartridge-discovery');
const {collectCallSites} = require('../../src/inference/call-sites');
const {holderOf} = require('../../src/inference/value-flow');
const {inferTypeForExpression} = require('../../src/inference/core');
const {createInferenceContext, describeTypes, inferReturnType, inferTypeForNode} = require('../../src/usage-inference');
const {createPluginProxy} = require('../helpers/plugin-proxy');
const {countReferenceSearches} = require('../helpers/reference-searches');

const CORPUS = process.env.B2C_INFERENCE_CORPUS;
const INFERRED_NOTE = 'Inferred from usage: ';
const DW_TYPE_EXPRESSION = /^\{[^{}]*\bdw\.[^{}]*\}$/;
const SERVER_SIDE_EXCLUDES = ['**/client/**', '**/static/**', '**/node_modules/**'];

// `.project` markers are what the plugin itself discovers by, but some
// published cartridges ship without one — any direct child with a
// `cartridge/` folder counts too.
function cartridgesWithoutProjectFile(root, known) {
  return fs
    .readdirSync(root, {withFileTypes: true})
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(root, entry.name, 'cartridge')))
    .map((entry) => ({name: entry.name, src: path.join(root, entry.name)}))
    .filter((c) => !known.has(c.name));
}

function discoverCorpusCartridges(roots) {
  const discovered = roots.flatMap((root) => discoverCartridgesOnDisk(ts, root, ts.sys.fileExists));
  const known = new Set(discovered.map((c) => c.name));
  discovered.push(...roots.flatMap((root) => cartridgesWithoutProjectFile(root, known)));
  const configured = process.env.B2C_INFERENCE_CARTRIDGE_PATH?.split(':').filter(Boolean);
  return orderCartridges(discovered, configured);
}

function serverScriptFiles(cartridges) {
  return cartridges.flatMap((c) =>
    ts.sys.readDirectory(c.src, ['.js'], SERVER_SIDE_EXCLUDES).map((f) => f.replace(/\\/g, '/')),
  );
}

/** A disk-backed LanguageServiceHost whose file contents can be overridden in memory. */
function createCorpusHost(fileNames, currentDirectory) {
  const overrides = new Map();
  const versions = new Map();
  const compilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    allowJs: true,
    checkJs: false,
    noEmit: true,
  };
  const readFile = (fileName) => overrides.get(fileName) ?? ts.sys.readFile(fileName);
  const host = {
    getScriptFileNames: () => [...fileNames, ts.getDefaultLibFilePath(compilerOptions)],
    getScriptVersion: (fileName) => String(versions.get(fileName) ?? 0),
    getScriptSnapshot: (fileName) => {
      const text = readFile(fileName);
      return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
    },
    getCurrentDirectory: () => currentDirectory,
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
    fileExists: (fileName) => overrides.has(fileName) || ts.sys.fileExists(fileName),
    readFile,
    directoryExists: (dir) => ts.sys.directoryExists(dir),
    getDirectories: (dir) => ts.sys.getDirectories(dir),
    resolveModuleNameLiterals: (literals, containingFile, _redirected, options) =>
      literals.map((literal) => ts.resolveModuleName(literal.text, containingFile, options, host)),
  };
  const setOverride = (fileName, text) => {
    if (text === undefined) overrides.delete(fileName);
    else overrides.set(fileName, text);
    versions.set(fileName, (versions.get(fileName) ?? 0) + 1);
  };
  return {host, setOverride};
}

function createCorpusPlugin(cartridges, fileNames) {
  const {host, setOverride} = createCorpusHost(fileNames, cartridges[0]?.src ?? '/');
  const languageService = ts.createLanguageService(host);
  // Reference searches are what an inference request spends its time on;
  // counting them gives a cost measure that, unlike wall time, is the same
  // on every machine and run. A search confined to the one file that can
  // refer to its name is counted apart from one that reads the project.
  const searches = countReferenceSearches();
  const {proxy} = createPluginProxy({
    host,
    languageService,
    currentDirectory: cartridges[0]?.src ?? '/',
    config: {enabled: true, autoDiscover: false, inferUsage: true, cartridges},
  });
  return {languageService, proxy, setOverride, searches};
}

// ---------------------------------------------------------------------------
// Answer key: documented `dw.*` parameters and returns, located in the
// original program.
// ---------------------------------------------------------------------------

/** The `{...}` span of a JSDoc tag's type when it names a `dw.*` type, else undefined. */
function dwTypeSpan(tag) {
  const expression = tag?.typeExpression;
  if (!expression || !DW_TYPE_EXPRESSION.test(expression.getText())) return undefined;
  return {start: expression.getStart(), end: expression.getEnd()};
}

/** A documented type's simple class name; an array reads as its element's (`dw.order.Basket[]` -> 'Basket[]'). */
function documentedName(checker, type) {
  if (!checker.isArrayType(type)) return (type.aliasSymbol ?? type.getSymbol())?.getName();
  const element = documentedName(checker, checker.getTypeArguments(type)[0]);
  return element && `${element}[]`;
}

/** Simple class names of a documented type's non-nullable constituents (`dw.order.Basket|null` -> ['Basket']). */
function documentedNames(checker, type) {
  const parts = type.isUnion() ? type.types : [type];
  return parts
    .filter((t) => !(t.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)))
    .map((t) => documentedName(checker, t))
    .filter(Boolean);
}

function functionLabel(fn, sourceFile) {
  const name = fn.name ?? (fn.parent && 'name' in fn.parent ? fn.parent.name : undefined);
  const line = sourceFile.getLineAndCharacterOfPosition(fn.getStart(sourceFile)).line + 1;
  return `${path.basename(sourceFile.fileName)}:${line} ${name ? name.getText(sourceFile) : '<anonymous>'}`;
}

function collectFunctionTargets(checker, fn, sourceFile, out) {
  for (const param of fn.parameters) {
    if (!ts.isIdentifier(param.name)) continue;
    const tag = ts.getJSDocParameterTags(param)[0];
    const span = dwTypeSpan(tag);
    const label = `${functionLabel(fn, sourceFile)}(${param.name.text})`;
    if (span) {
      const names = documentedNames(checker, checker.getTypeAtLocation(param.name));
      out.params.push({label, position: param.name.getStart(sourceFile), names});
      out.blanks.push(span);
    } else if (!tag?.typeExpression && !param.type) {
      out.undocumented.push({label, position: param.name.getStart(sourceFile)});
    }
  }
  const returnTag = ts.getJSDocTags(fn).find((t) => ts.isJSDocReturnTag(t));
  const returnSpan = dwTypeSpan(returnTag);
  if (returnSpan) {
    const signature = checker.getSignatureFromDeclaration(fn);
    const names = signature ? documentedNames(checker, checker.getReturnTypeOfSignature(signature)) : [];
    out.returns.push({label: `${functionLabel(fn, sourceFile)}()`, position: fn.getStart(sourceFile), names});
    out.blanks.push(returnSpan);
  }
}

/** True when `type` (or a non-nullable part of it) is declared by the vendored Script API. */
function isScriptApiType(type) {
  const parts = type.isUnion() ? type.types : [type];
  return parts.some((part) =>
    (part.getSymbol()?.declarations ?? []).some((decl) => decl.getSourceFile().fileName.includes('/types/dw/')),
  );
}

/** A local variable whose checker type is a Script API class: a candidate for the downstream metric. */
function collectVariableTarget(checker, decl, sourceFile, out) {
  if (!ts.isIdentifier(decl.name) || decl.type) return;
  const type = checker.getTypeAtLocation(decl.name);
  if (!isScriptApiType(type)) return;
  const line = sourceFile.getLineAndCharacterOfPosition(decl.getStart(sourceFile)).line + 1;
  out.variables.push({
    label: `${path.basename(sourceFile.fileName)}:${line} var ${decl.name.text}`,
    position: decl.name.getStart(sourceFile),
    names: documentedNames(checker, type),
  });
}

function collectFileTargets(program, fileName) {
  const sourceFile = program.getSourceFile(fileName);
  const checker = program.getTypeChecker();
  const out = {fileName, params: [], returns: [], variables: [], undocumented: [], blanks: []};
  if (!sourceFile) return out;
  const visit = (node) => {
    if (ts.isFunctionLike(node) && 'parameters' in node) collectFunctionTargets(checker, node, sourceFile, out);
    if (ts.isVariableDeclaration(node)) collectVariableTarget(checker, node, sourceFile, out);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return out;
}

/** The file's text with every documented `{dw.*}` type expression blanked to spaces (offsets unchanged). */
function blankSpans(text, spans) {
  let out = text;
  for (const {start, end} of spans) out = out.slice(0, start) + ' '.repeat(end - start) + out.slice(end);
  return out;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/** Maps every top-level class/interface name in the dw.* declarations to the names of all its ancestors. */
function buildAncestry(program) {
  const checker = program.getTypeChecker();
  const ancestry = new Map();
  const ancestorsOf = (type, seen = new Set()) => {
    for (const base of type.isClassOrInterface() ? checker.getBaseTypes(type) : []) {
      const name = base.getSymbol()?.getName();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      // A generic base (`List<T>`) is a type reference; its declaration is the target.
      ancestorsOf(base.target ?? base, seen);
    }
    return seen;
  };
  for (const sf of program.getSourceFiles()) {
    if (!sf.isDeclarationFile || !sf.fileName.includes('/types/dw/')) continue;
    for (const stmt of sf.statements) {
      if (!(ts.isClassDeclaration(stmt) || ts.isInterfaceDeclaration(stmt)) || !stmt.name) continue;
      const symbol = checker.getSymbolAtLocation(stmt.name);
      if (symbol) ancestry.set(stmt.name.text, ancestorsOf(checker.getDeclaredTypeOfSymbol(symbol)));
    }
  }
  return ancestry;
}

/** `Product<any> | ProductLineItem` -> ['Product', 'ProductLineItem']. */
function parseInferredNames(description) {
  return description.split(' | ').map((part) => part.replace(/<.*>$/, '').trim());
}

function isRelated(ancestry, a, b) {
  const arrays = a.endsWith('[]') && b.endsWith('[]');
  if (arrays) return isRelated(ancestry, a.slice(0, -2), b.slice(0, -2));
  return a === b || ancestry.get(a)?.has(b) === true || ancestry.get(b)?.has(a) === true;
}

function classify(ancestry, documented, inferred) {
  if (!inferred) return 'silent';
  const names = parseInferredNames(inferred);
  if (names.every((n) => documented.includes(n))) return 'exact';
  if (names.length > 1 && names.some((n) => documented.includes(n))) return 'union';
  if (names.every((n) => documented.some((d) => isRelated(ancestry, n, d)))) return 'related';
  return 'wrong';
}

function inferredFromHover(proxy, fileName, position) {
  const info = proxy.getQuickInfoAtPosition(fileName, position);
  const text = (info?.documentation ?? []).map((p) => p.text).join('');
  const index = text.lastIndexOf(INFERRED_NOTE);
  return index === -1 ? undefined : text.slice(index + INFERRED_NOTE.length).trim();
}

/** The node starting exactly at `position` that satisfies `predicate`, outermost first. */
function findNodeAt(sourceFile, position, predicate) {
  let found;
  const visit = (node) => {
    if (found || position < node.getStart(sourceFile) || position >= node.getEnd()) return;
    if (predicate(node) && node.getStart(sourceFile) === position) found = node;
    else ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

/** A fresh inference context and the evaluated file in the current (blanked) program. */
function freshRequest(languageService, fileName) {
  const ctx = createInferenceContext(ts, languageService);
  const sourceFile = ctx?.program.getSourceFile(fileName);
  return ctx && sourceFile ? {ctx, sourceFile} : undefined;
}

function inferredReturn(languageService, fileName, position) {
  const request = freshRequest(languageService, fileName);
  const fn = request && findNodeAt(request.sourceFile, position, ts.isFunctionLike);
  const types = fn ? inferReturnType(request.ctx, fn) : [];
  return types.length > 0 ? describeTypes(request.ctx, types) : undefined;
}

/**
 * What inference shows for a local variable, or null when the variable is
 * still typed by the checker after blanking (its type never depended on the
 * removed JSDoc, so it says nothing about inference).
 */
function inferredVariable(languageService, fileName, position) {
  const request = freshRequest(languageService, fileName);
  const name = request && findNodeAt(request.sourceFile, position, ts.isIdentifier);
  if (!name || isScriptApiType(request.ctx.checker.getTypeAtLocation(name))) return null;
  const types = inferTypeForNode(request.ctx, name);
  return types.length > 0 ? describeTypes(request.ctx, types) : undefined;
}

/**
 * Why a parameter stayed silent, re-derived with a fresh request: an
 * anonymous callback (nothing to search for), no call sites found, a search
 * or reference budget that ran out, call-site evidence the policy dropped
 * (fit, union limit), or call sites whose arguments say nothing.
 */
function silentReason(languageService, fileName, position) {
  const request = freshRequest(languageService, fileName);
  const param = request && findNodeAt(request.sourceFile, position, ts.isIdentifier)?.parent;
  if (!param || !ts.isParameter(param)) return 'not-a-parameter';
  const holder = holderOf(request.ctx, param.parent);
  return holder ? callSiteSilence(request.ctx, holder, param) : 'anonymous-callback';
}

/** Classifies a silent parameter of a function whose calls can be searched by what its call sites gave. */
function callSiteSilence(ctx, holder, param) {
  const {calls, handoffs} = collectCallSites(ctx, holder);
  const index = param.parent.parameters.indexOf(param);
  const evidence = calls.flatMap((site) => (site.args[index] ? inferTypeForExpression(ctx, site.args[index]) : []));
  if (evidence.length > 0) return 'dropped-by-policy';
  if (ctx.searchBudget <= 0 || ctx.referenceBudget <= 0) return 'budget';
  return calls.length + handoffs.length === 0 ? 'no-call-sites' : 'no-evidence';
}

const SLOWEST_REPORTED = 20;
// The live reference-search counter, kept under a symbol so the JSON report leaves it out.
const SEARCH_COUNTER = Symbol('searchCounter');

function timed(report, label, compute) {
  const counter = report[SEARCH_COUNTER];
  const searchesBefore = counter.projectWide();
  const localBefore = counter.local();
  const start = process.hrtime.bigint();
  const result = compute();
  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  const searches = counter.projectWide() - searchesBefore;
  const localSearches = counter.local() - localBefore;
  report.timings.push(ms);
  report.searches.push(searches);
  report.localSearches.push(localSearches);
  report.slowest.push({target: label, ms, searches, localSearches});
  report.slowest.sort((a, b) => b.ms - a.ms).splice(SLOWEST_REPORTED);
  return result;
}

function scoreTarget(report, ancestry, kind, target, inferred, explainSilence) {
  const verdict = classify(ancestry, target.names, inferred);
  report[kind][verdict]++;
  if (verdict === 'exact' || verdict === 'union') return;
  const reason = verdict === 'silent' && explainSilence ? explainSilence() : undefined;
  if (reason) report.silentReasons[reason] = (report.silentReasons[reason] ?? 0) + 1;
  report.mismatches.push({kind, verdict, target: target.label, documented: target.names.join(' | '), inferred, reason});
}

function emptyScore() {
  return {exact: 0, union: 0, related: 0, wrong: 0, silent: 0};
}

function evaluateFile(plugin, ancestry, targets, report) {
  const {proxy, languageService, setOverride} = plugin;
  setOverride(targets.fileName, blankSpans(ts.sys.readFile(targets.fileName), targets.blanks));
  try {
    for (const target of targets.params) {
      const inferred = timed(report, target.label, () => inferredFromHover(proxy, targets.fileName, target.position));
      scoreTarget(report, ancestry, 'params', target, inferred, () =>
        silentReason(languageService, targets.fileName, target.position),
      );
    }
    for (const target of targets.returns) {
      const inferred = timed(report, target.label, () =>
        inferredReturn(languageService, targets.fileName, target.position),
      );
      scoreTarget(report, ancestry, 'returns', target, inferred);
    }
    // Untimed, and after the timed requests: the triage and variable
    // requests warm this program's reference cache, which must not lower the
    // search counts measured above.
    for (const target of targets.variables) {
      const inferred = inferredVariable(languageService, targets.fileName, target.position);
      if (inferred !== null) scoreTarget(report, ancestry, 'variables', target, inferred);
    }
  } finally {
    setOverride(targets.fileName, undefined);
  }
}

function evaluateUndocumented(proxy, allTargets, report) {
  for (const targets of allTargets) {
    for (const target of targets.undocumented) {
      const inferred = timed(report, target.label, () => inferredFromHover(proxy, targets.fileName, target.position));
      report.undocumented.total++;
      if (!inferred) continue;
      report.undocumented.fired++;
      report.undocumented.samples.push({target: target.label, inferred});
    }
  }
}

function percentile(sorted, p) {
  return sorted.length === 0 ? 0 : sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

function summarize(report) {
  const line = (kind) => {
    const s = report[kind];
    const total = s.exact + s.union + s.related + s.wrong + s.silent;
    const good = s.exact + s.union + s.related;
    const fired = total - s.silent;
    const pct = (n, d) => (d === 0 ? 'n/a' : `${((100 * n) / d).toFixed(1)}%`);
    return (
      `${kind.padEnd(8)} total=${total} exact=${s.exact} union=${s.union} related=${s.related} ` +
      `wrong=${s.wrong} silent=${s.silent} | precision=${pct(good, fired)} ` +
      `strict=${pct(s.exact, fired)} recall=${pct(good, total)}`
    );
  };
  const sorted = [...report.timings].sort((a, b) => a - b);
  const searches = [...report.searches].sort((a, b) => a - b);
  const localSearches = [...report.localSearches].sort((a, b) => a - b);
  const u = report.undocumented;
  const reasons = Object.entries(report.silentReasons)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => `${reason}=${count}`);
  return [
    line('params'),
    line('returns'),
    line('variables'),
    `silent params: ${reasons.join(' ') || 'none'}`,
    `undocumented params fired on ${u.fired}/${u.total}`,
    `latency ms p50=${percentile(sorted, 50).toFixed(1)} p95=${percentile(sorted, 95).toFixed(1)} ` +
      `max=${(sorted.at(-1) ?? 0).toFixed(1)} over ${sorted.length} requests`,
    `project-wide searches p50=${percentile(searches, 50)} p95=${percentile(searches, 95)} ` +
      `max=${searches.at(-1) ?? 0} total=${searches.reduce((sum, n) => sum + n, 0)}`,
    `single-file searches p95=${percentile(localSearches, 95)} max=${localSearches.at(-1) ?? 0} ` +
      `total=${localSearches.reduce((sum, n) => sum + n, 0)}`,
  ].join('\n');
}

(CORPUS ? describe : describe.skip)('usage inference ground truth (B2C_INFERENCE_CORPUS)', function () {
  this.timeout(30 * 60 * 1000);

  it('scores inference against documented dw.* types', () => {
    const cartridges = discoverCorpusCartridges(CORPUS.split(path.delimiter).filter(Boolean));
    const fileNames = serverScriptFiles(cartridges);
    const plugin = createCorpusPlugin(cartridges, fileNames);
    const program = plugin.languageService.getProgram();
    const ancestry = buildAncestry(program);
    const allTargets = fileNames.map((f) => collectFileTargets(program, f));
    const report = {
      params: emptyScore(),
      returns: emptyScore(),
      variables: emptyScore(),
      silentReasons: {},
      undocumented: {total: 0, fired: 0, samples: []},
      mismatches: [],
      timings: [],
      searches: [],
      localSearches: [],
      slowest: [],
      [SEARCH_COUNTER]: plugin.searches,
    };

    try {
      evaluateUndocumented(plugin.proxy, allTargets, report);
      for (const targets of allTargets) {
        if (targets.params.length > 0 || targets.returns.length > 0) evaluateFile(plugin, ancestry, targets, report);
      }
    } finally {
      plugin.searches.stop();
    }

    const summary = summarize(report);
    process.stdout.write(`\n${cartridges.length} cartridges, ${fileNames.length} files\n${summary}\n`);
    if (process.env.B2C_INFERENCE_REPORT) {
      fs.writeFileSync(process.env.B2C_INFERENCE_REPORT, JSON.stringify({summary, ...report}, null, 2));
    }
  });
});
