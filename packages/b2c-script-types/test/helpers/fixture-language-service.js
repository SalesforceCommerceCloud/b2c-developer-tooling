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

  return {
    getScriptFileNames: fileNames,
    getScriptVersion: () => '0',
    getScriptSnapshot: (fileName) => {
      const text = files[fileName] ?? ts.sys.readFile(fileName);
      return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
    },
    getCurrentDirectory: () => '/',
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
    fileExists: (fileName) => fileName in files || ts.sys.fileExists(fileName),
    readFile: (fileName) => files[fileName] ?? ts.sys.readFile(fileName),
    directoryExists: (dir) => ts.sys.directoryExists(dir),
    getDirectories: (dir) => ts.sys.getDirectories(dir),
  };
}

// Builds a real ts.LanguageService on top of createFixtureHost(), so
// usage-inference tests can exercise findReferences/checker behavior without
// touching disk.
function createFixtureLanguageService(files, options) {
  const host = createFixtureHost(files, options);
  return ts.createLanguageService(host, ts.createDocumentRegistry());
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

module.exports = {createFixtureHost, createFixtureLanguageService, findFunctionDeclaration};
