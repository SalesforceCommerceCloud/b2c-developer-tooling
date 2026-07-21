/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
'use strict';

const ts = require('typescript');

// Builds a LanguageServiceHost backed entirely by in-memory sources. Lib files
// (lib.es2020.d.ts, etc.) still resolve through the real ts.sys since we only
// care about controlling the fixture's own files — but the default lib file
// must be listed explicitly, since (unlike ts.createProgram) a LanguageService
// never adds it automatically; without it, primitive types (string, number)
// have no members at all, which would make apparent-type-dependent inference
// impossible to test.
function createFixtureHost(files, options) {
  const compilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    allowJs: true,
    checkJs: false,
    strict: false,
    ...options,
  };
  const libFileName = ts.getDefaultLibFilePath(compilerOptions);
  const fileNames = () => [...Object.keys(files), libFileName];

  // Directories implied by the in-memory file map. TS's module resolver
  // probes directoryExists before trying file candidates
  // (directoryProbablyExists), and the ts.sys fallback answers against the
  // real filesystem — where these virtual directories don't exist — so
  // without this, a nested relative require ('./helpers/productHelpers')
  // inside the fixture silently fails to resolve.
  const impliedDirs = new Set(['/']);
  for (const fileName of Object.keys(files)) {
    let dir = fileName;
    while (dir.includes('/') && (dir = dir.slice(0, dir.lastIndexOf('/'))) !== '') {
      impliedDirs.add(dir);
    }
  }

  return {
    getScriptFileNames: fileNames,
    // The shared DocumentRegistry below (see createFixtureLanguageService)
    // only reuses a cached parse when both the file path AND this version
    // string match a previous request — so the version must reflect actual
    // content, not a constant, or two different tests that happen to reuse
    // the same in-memory path (very common: '/types.d.ts', '/helper.js') but
    // with different content would silently serve each other's stale parsed
    // SourceFile. Using the in-memory file's own text as its version makes
    // that impossible (identical content -> identical version -> safe reuse;
    // different content -> different version -> correctly reparsed) while
    // real on-disk files (the vendored dw/* tree, lib.*.d.ts — which never
    // change across a test run) keep a constant version, so THEY get parsed
    // once total and reused by every subsequent fixture — the expensive part
    // this cache exists to short-circuit.
    getScriptVersion: (fileName) => files[fileName] ?? 'on-disk',
    getScriptSnapshot: (fileName) => {
      const text = files[fileName] ?? ts.sys.readFile(fileName);
      return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
    },
    getCurrentDirectory: () => '/',
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
    fileExists: (fileName) => fileName in files || ts.sys.fileExists(fileName),
    readFile: (fileName) => files[fileName] ?? ts.sys.readFile(fileName),
    directoryExists: (dir) => impliedDirs.has(dir) || ts.sys.directoryExists(dir),
    getDirectories: (dir) => ts.sys.getDirectories(dir),
  };
}

// Shared across every fixture LanguageService created in this process — both
// via createFixtureLanguageService below and by test files (e.g.
// index.test.js) that build a LanguageService directly with
// createFixtureHost(). A DocumentRegistry is TypeScript's built-in mechanism
// for reusing an already-parsed-and-bound SourceFile across multiple
// LanguageServices that request the same (path, version, compilation
// settings) — exactly the case for the real vendored dw/* declaration tree,
// which is identical across every test in a run. A fresh per-call registry
// (the previous behavior) defeated this entirely, forcing every single test
// to re-parse and re-bind hundreds of real .d.ts files from scratch — the
// dominant cost behind this suite's real-world runtime.
const sharedDocumentRegistry = ts.createDocumentRegistry();

// Builds a real ts.LanguageService on top of createFixtureHost(), so
// usage-inference tests can exercise findReferences/checker behavior without
// touching disk.
function createFixtureLanguageService(files, options) {
  const host = createFixtureHost(files, options);
  return ts.createLanguageService(host, sharedDocumentRegistry);
}

// Finds a top-level `function name(...) {...}` declaration in a fixture
// source file, so tests can locate the node to run inference against without
// computing offsets by hand.
function findFunctionDeclaration(sourceFile, name) {
  let found;
  const visit = (node) => {
    if (ts.isFunctionDeclaration(node) && node.name && node.name.text === name) {
      found = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  if (!found) throw new Error(`function ${name} not found`);
  return found;
}

module.exports = {
  createFixtureHost,
  createFixtureLanguageService,
  findFunctionDeclaration,
  sharedDocumentRegistry,
};
