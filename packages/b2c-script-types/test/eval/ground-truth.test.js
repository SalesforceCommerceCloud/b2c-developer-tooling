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
// Parameters that carry no type at all in the original source are hovered
// too, to measure how often inference fires on genuinely undocumented code.
//
// Optional: B2C_INFERENCE_CARTRIDGE_PATH (colon-separated cartridge names)
// sets the cartridge order, B2C_INFERENCE_REPORT writes the full JSON report
// (mismatches, timings, undocumented samples) to that file.

const fs = require('node:fs');
const path = require('node:path');

const ts = require('typescript');

const init = require('../../src/index');
const {discoverCartridgesOnDisk, orderCartridges} = require('../../src/resolver/cartridge-discovery');
const {createInferenceContext, describeTypes, inferReturnType} = require('../../src/usage-inference');

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
  const proxy = init({typescript: ts}).create({
    languageService,
    languageServiceHost: host,
    project: {
      projectService: {logger: {info: () => {}}},
      getCurrentDirectory: () => cartridges[0]?.src ?? '/',
      getProjectVersion: () => '1',
    },
    config: {enabled: true, autoDiscover: false, inferUsage: true, cartridges},
  });
  return {languageService, proxy, setOverride};
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

/** Simple class names of a documented type's non-nullable constituents (`dw.order.Basket|null` -> ['Basket']). */
function documentedNames(checker, type) {
  const parts = type.isUnion() ? type.types : [type];
  return parts
    .filter((t) => !(t.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)))
    .map((t) => (t.aliasSymbol ?? t.getSymbol())?.getName())
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

function collectFileTargets(program, fileName) {
  const sourceFile = program.getSourceFile(fileName);
  const checker = program.getTypeChecker();
  const out = {fileName, params: [], returns: [], undocumented: [], blanks: []};
  if (!sourceFile) return out;
  const visit = (node) => {
    if (ts.isFunctionLike(node) && 'parameters' in node) collectFunctionTargets(checker, node, sourceFile, out);
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

function inferredReturn(languageService, fileName, position) {
  const ctx = createInferenceContext(ts, languageService);
  const sourceFile = ctx?.program.getSourceFile(fileName);
  if (!ctx || !sourceFile) return undefined;
  let fn;
  const visit = (node) => {
    if (fn) return;
    if (ts.isFunctionLike(node) && node.getStart(sourceFile) === position) fn = node;
    else ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  const types = fn ? inferReturnType(ctx, fn) : [];
  return types.length > 0 ? describeTypes(ctx.checker, types) : undefined;
}

function timed(timings, compute) {
  const start = process.hrtime.bigint();
  const result = compute();
  timings.push(Number(process.hrtime.bigint() - start) / 1e6);
  return result;
}

function scoreTarget(report, ancestry, kind, target, inferred) {
  const verdict = classify(ancestry, target.names, inferred);
  report[kind][verdict]++;
  if (verdict !== 'exact' && verdict !== 'union') {
    report.mismatches.push({kind, verdict, target: target.label, documented: target.names.join(' | '), inferred});
  }
}

function emptyScore() {
  return {exact: 0, union: 0, related: 0, wrong: 0, silent: 0};
}

function evaluateFile(plugin, ancestry, targets, report) {
  const {proxy, languageService, setOverride} = plugin;
  setOverride(targets.fileName, blankSpans(ts.sys.readFile(targets.fileName), targets.blanks));
  try {
    for (const target of targets.params) {
      const inferred = timed(report.timings, () => inferredFromHover(proxy, targets.fileName, target.position));
      scoreTarget(report, ancestry, 'params', target, inferred);
    }
    for (const target of targets.returns) {
      const inferred = timed(report.timings, () => inferredReturn(languageService, targets.fileName, target.position));
      scoreTarget(report, ancestry, 'returns', target, inferred);
    }
  } finally {
    setOverride(targets.fileName, undefined);
  }
}

function evaluateUndocumented(proxy, allTargets, report) {
  for (const targets of allTargets) {
    for (const target of targets.undocumented) {
      const inferred = timed(report.timings, () => inferredFromHover(proxy, targets.fileName, target.position));
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
  const u = report.undocumented;
  return [
    line('params'),
    line('returns'),
    `undocumented params fired on ${u.fired}/${u.total}`,
    `latency ms p50=${percentile(sorted, 50).toFixed(1)} p95=${percentile(sorted, 95).toFixed(1)} ` +
      `max=${(sorted.at(-1) ?? 0).toFixed(1)} over ${sorted.length} requests`,
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
      undocumented: {total: 0, fired: 0, samples: []},
      mismatches: [],
      timings: [],
    };

    evaluateUndocumented(plugin.proxy, allTargets, report);
    for (const targets of allTargets) {
      if (targets.params.length > 0 || targets.returns.length > 0) evaluateFile(plugin, ancestry, targets, report);
    }

    const summary = summarize(report);
    process.stdout.write(`\n${cartridges.length} cartridges, ${fileNames.length} files\n${summary}\n`);
    if (process.env.B2C_INFERENCE_REPORT) {
      fs.writeFileSync(process.env.B2C_INFERENCE_REPORT, JSON.stringify({summary, ...report}, null, 2));
    }
  });
});
