/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
'use strict';

// Security regression tests for the plugin's module resolvers. Every input a
// resolver consumes (import specifiers, cartridge names, a cartridge's
// package.json `main`) is attacker-controlled the moment a developer opens a
// cloned repository, so a crafted `require()` must never resolve to a file
// outside the intended root (the bundled types dir for `dw/*`, a cartridge
// root for cartridge-relative requires). These drive the REAL plugin through
// its wrapped `resolveModuleNameLiterals` host hook against on-disk fixtures —
// no mocks of the code under audit — because the resolvers probe the real
// filesystem via ts.sys.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {after, before, describe, it} = require('node:test');

const ts = require('typescript');

const init = require('../plugin/index');

const TYPES_DIR = path.resolve(__dirname, '..', 'types');

// Builds an on-disk workspace: an `app` cartridge and a `modules` cartridge
// under <tmp>/workspace, plus secret files OUTSIDE every root that traversal
// must never reach.
function buildWorkspace() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sec-'));
  const ws = path.join(tmp, 'workspace');
  const appRoot = path.join(ws, 'app_cartridge');
  fs.mkdirSync(path.join(appRoot, 'cartridge', 'scripts'), {recursive: true});
  // A legitimate in-cartridge module, so we can assert normal requires still resolve.
  fs.writeFileSync(path.join(appRoot, 'cartridge', 'scripts', 'util.js'), 'module.exports = {};');
  const containingFile = path.join(appRoot, 'cartridge', 'scripts', 'controller.js');
  fs.writeFileSync(containingFile, 'require("x");');

  const modRoot = path.join(ws, 'modules');
  fs.mkdirSync(path.join(modRoot, 'pkg'), {recursive: true});
  // A directory package whose `main` traverses out of the modules root.
  fs.writeFileSync(path.join(modRoot, 'pkg', 'package.json'), JSON.stringify({main: '../../../secret_outside.js'}));
  // A benign directory package, so we can assert legitimate `main` still resolves.
  fs.mkdirSync(path.join(modRoot, 'goodpkg'), {recursive: true});
  fs.writeFileSync(path.join(modRoot, 'goodpkg', 'package.json'), JSON.stringify({main: './lib.js'}));
  fs.writeFileSync(path.join(modRoot, 'goodpkg', 'lib.js'), 'module.exports = {};');

  // Secrets outside any root.
  fs.writeFileSync(path.join(tmp, 'secret_outside.js'), 'module.exports = {SECRET: "leaked"};');
  fs.writeFileSync(path.join(tmp, 'leak.d.ts'), 'export const SECRET: string;');

  return {tmp, appRoot, modRoot, containingFile};
}

function makeResolver({appRoot, modRoot, containingFile, tmp}) {
  const host = {
    getScriptFileNames: () => [containingFile],
    getScriptVersion: () => '0',
    getScriptSnapshot: (f) => (fs.existsSync(f) ? ts.ScriptSnapshot.fromString(fs.readFileSync(f, 'utf8')) : undefined),
    getCurrentDirectory: () => tmp,
    getCompilationSettings: () => ({allowJs: true}),
    getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
    fileExists: (f) => fs.existsSync(f),
    readFile: (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : undefined),
    directoryExists: (d) => fs.existsSync(d),
    getDirectories: (d) => (fs.existsSync(d) ? fs.readdirSync(d) : []),
    // Provide the hook so the plugin wraps it; return all-unresolved so the
    // plugin's cartridge/dw fallback resolution runs for every specifier.
    resolveModuleNameLiterals: (lits) => lits.map(() => ({resolvedModule: undefined})),
  };
  const languageService = ts.createLanguageService(host, ts.createDocumentRegistry());
  const {create} = init({typescript: ts});
  create({
    languageService,
    languageServiceHost: host,
    project: {
      projectService: {logger: {info: () => {}}},
      getCurrentDirectory: () => tmp,
      getProjectVersion: () => '1',
    },
    config: {
      enabled: true,
      autoDiscover: false,
      cartridges: [
        {name: 'app_cartridge', src: appRoot},
        {name: 'modules', src: modRoot},
      ],
    },
  });
  // host.resolveModuleNameLiterals is now the plugin's wrapped version.
  return (spec, from = containingFile) => {
    const res = host.resolveModuleNameLiterals([{text: spec}], from, undefined, {}, undefined, undefined);
    return res[0] && res[0].resolvedModule ? res[0].resolvedModule.resolvedFileName : undefined;
  };
}

// Canonical containment check mirroring the security property under test:
// a resolved path must sit at or beneath `root` once symlinks and `..` are
// resolved.
function isWithin(resolved, root) {
  const real = (p) => {
    try {
      return fs.realpathSync(p);
    } catch {
      return path.resolve(p);
    }
  };
  const c = real(resolved);
  const r = real(root);
  return c === r || c.startsWith(r + path.sep);
}

describe('module resolver path-traversal containment', () => {
  let workspace;
  let resolve;

  before(() => {
    workspace = buildWorkspace();
    resolve = makeResolver(workspace);
  });

  after(() => {
    if (workspace) fs.rmSync(workspace.tmp, {recursive: true, force: true});
  });

  // --- resolveDwModule: must stay inside the bundled types dir ---

  it('does not let a crafted dw/ specifier escape the bundled types directory', () => {
    const spec = 'dw/../' + path.relative(TYPES_DIR, path.join(workspace.tmp, 'leak')).replace(/\\/g, '/');
    const resolved = resolve(spec);
    assert.equal(resolved, undefined, `dw traversal resolved to ${resolved}`);
  });

  it('still resolves a legitimate dw/ module to the bundled types directory', () => {
    const resolved = resolve('dw/catalog/Product');
    assert.ok(resolved, 'expected dw/catalog/Product to resolve');
    assert.ok(isWithin(resolved, TYPES_DIR), `dw module resolved outside types dir: ${resolved}`);
  });

  // --- resolveCartridgeModule: ~/, */, <name>/ subpaths must stay in-cartridge ---

  it('does not let ~/.. escape the owning cartridge root', () => {
    const resolved = resolve('~/../../secret_outside');
    assert.equal(resolved, undefined, `~/.. traversal resolved to ${resolved}`);
  });

  it('does not let */.. escape a cartridge root', () => {
    const resolved = resolve('*/../../secret_outside');
    assert.equal(resolved, undefined, `*/.. traversal resolved to ${resolved}`);
  });

  it('does not let <name>/.. escape the named cartridge root', () => {
    const resolved = resolve('app_cartridge/../../secret_outside');
    assert.equal(resolved, undefined, `<name>/.. traversal resolved to ${resolved}`);
  });

  it('still resolves a legitimate ~/ cartridge require', () => {
    const resolved = resolve('~/cartridge/scripts/util');
    assert.ok(resolved, 'expected ~/cartridge/scripts/util to resolve');
    assert.ok(isWithin(resolved, workspace.appRoot), `resolved outside cartridge: ${resolved}`);
  });

  // --- resolveModulesCartridge: bare specifiers + package.json main ---

  it('does not let a modules-cartridge specifier escape the modules root', () => {
    const resolved = resolve('pkg/../../../secret_outside');
    assert.equal(resolved, undefined, `modules traversal resolved to ${resolved}`);
  });

  it("does not let a cartridge package.json 'main' traverse out of the modules root", () => {
    // require('pkg') -> reads modules/pkg/package.json whose main is '../../../secret_outside.js'.
    const resolved = resolve('pkg');
    assert.equal(resolved, undefined, `package.json main traversal resolved to ${resolved}`);
  });

  it("still resolves a benign cartridge package.json 'main'", () => {
    const resolved = resolve('goodpkg');
    assert.ok(resolved, 'expected goodpkg to resolve via package.json main');
    assert.ok(isWithin(resolved, workspace.modRoot), `resolved outside modules root: ${resolved}`);
  });

  // --- symlink escape: an in-cartridge symlink pointing outside ---

  it('does not follow an in-cartridge symlink that points outside the cartridge root', () => {
    const link = path.join(workspace.appRoot, 'cartridge', 'scripts', 'link.js');
    try {
      fs.symlinkSync(path.join(workspace.tmp, 'secret_outside.js'), link);
    } catch {
      return; // filesystem without symlink support — skip
    }
    const resolved = resolve('~/cartridge/scripts/link');
    fs.rmSync(link, {force: true});
    assert.equal(resolved, undefined, `symlink escape resolved to ${resolved}`);
  });
});
