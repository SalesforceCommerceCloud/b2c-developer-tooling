"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPathContainment = createPathContainment;
exports.ownerCartridge = ownerCartridge;
exports.resolveCartridgeModule = resolveCartridgeModule;
exports.resolveModulesCartridge = resolveModulesCartridge;
// Security-critical path containment and cartridge-relative module resolution,
// extracted out of index.ts so these can be read and tested against plain
// data (a cartridge list, a fileExists probe) without a full LanguageService
// fixture. Every resolver here is a pure function of its arguments; index.ts
// wires them to the live plugin state (cartridges, ts.sys, the LS host).
const node_path_1 = __importDefault(require("node:path"));
const cartridge_discovery_1 = require("./cartridge-discovery");
const constants_1 = require("./constants");
/**
 * Builds the two path-safety primitives every resolver below is checked
 * against: `normalize` (forward slashes, case-folded on case-insensitive
 * filesystems) and `isWithinRoot` (true when `candidate` resolves to a
 * location at or beneath `rootDir`). This is the trust boundary for every
 * resolver in this file: import specifiers, cartridge names, and a
 * cartridge's package.json `main` are all attacker-controlled in a cloned
 * repository, so a resolved path that escapes its intended root (via `..`,
 * an absolute/UNC/drive form, or a symlink) must be rejected rather than
 * read into the TS program.
 *
 * `isWithinRoot` resolves symlinks once, at check time, via
 * `ts.sys.realpath` — it does not re-check immediately before the caller's
 * subsequent `fileExists`/`readFile`. A symlink swapped in between those two
 * calls (e.g. by a build script running concurrently in the cloned repo)
 * could in principle bypass containment. The accepted threat model here is
 * malicious *content* in a cloned repository, not an active attacker
 * racing the filesystem during a single hover/completion request, so this
 * gap is left unaddressed; revisit if that threat model changes.
 */
function createPathContainment(ts, caseSensitive) {
    const normalize = (p) => {
        const slashed = p.replace(/\\/g, '/');
        return caseSensitive ? slashed : slashed.toLowerCase();
    };
    // Canonical, real form of a path for containment checks: resolve symlinks
    // (ts.sys.realpath) so an in-repo symlink can't point a require() at a file
    // outside its root, then collapse `.`/`..` and fold to the same slash/case
    // convention cartridge roots use. Falls back to a purely lexical resolve
    // when the path doesn't exist or realpath is unavailable, so a crafted
    // non-existent candidate is still `..`-collapsed before the check.
    const canonicalPath = (p) => {
        let real = p;
        try {
            if (ts.sys.realpath)
                real = ts.sys.realpath(p);
        }
        catch {
            // Non-existent path (or realpath failure) — fall back to lexical.
        }
        return normalize(node_path_1.default.resolve(real));
    };
    const isWithinRoot = (candidate, rootDir) => {
        const root = canonicalPath(rootDir);
        const resolved = canonicalPath(candidate);
        return (resolved + '/').startsWith(root.endsWith('/') ? root : root + '/');
    };
    return { normalize, isWithinRoot };
}
function ownerCartridge(cartridges, normalize, containingFile) {
    const f = normalize(containingFile);
    return cartridges.find((c) => f.startsWith(c.root));
}
function reorderForContainingFile(cartridges, normalize, containingFile) {
    const owner = ownerCartridge(cartridges, normalize, containingFile);
    if (!owner)
        return cartridges;
    return [owner, ...cartridges.filter((c) => c !== owner)];
}
function cartridgeLookup(cartridges, moduleName, containingFile, normalize) {
    if (moduleName.startsWith('~/')) {
        // ~ is the current cartridge — restrict to the cartridge that owns the
        // calling file. If the containing file isn't inside any known cartridge,
        // there is no current cartridge, so the require can't be resolved.
        const owner = ownerCartridge(cartridges, normalize, containingFile);
        return owner ? { order: [owner], subpath: moduleName.slice(2) } : undefined;
    }
    if (moduleName.startsWith('*/')) {
        // * walks the cartridge path. Owner-first matches SFRA-style overrides
        // (the requesting cartridge wins before falling through to others).
        return { order: reorderForContainingFile(cartridges, normalize, containingFile), subpath: moduleName.slice(2) };
    }
    // <cartridgeName>/cartridge/... — only treat as a cartridge require if the
    // first segment matches a known cartridge name. Otherwise pass through so
    // node_modules and other resolutions still work.
    const slash = moduleName.indexOf('/');
    if (slash <= 0)
        return undefined;
    const head = moduleName.slice(0, slash);
    const known = cartridges.find((c) => c.name === head);
    return known ? { order: [known], subpath: moduleName.slice(slash + 1) } : undefined;
}
/**
 * The first `<cartridge>/<subpath><ext>` that exists and stays inside the
 * cartridge. `subpath` comes straight from the import specifier, so a `..`
 * segment (or an absolute/symlinked target) can point outside the cartridge —
 * every candidate is resolved and contained before it is accepted.
 */
function firstContainedCandidate(cartridge, subpath, deps) {
    const baseAbs = cartridge.rawRoot + subpath;
    for (const ext of constants_1.CANDIDATE_EXTENSIONS) {
        const candidate = baseAbs + ext;
        if (deps.fileExists(candidate) && deps.isWithinRoot(candidate, cartridge.root)) {
            return { resolved: candidate, source: cartridge.name };
        }
    }
    return undefined;
}
/**
 * Resolves a SFCC cartridge-style require relative to the configured
 * cartridge path. Returns the absolute path to the resolved JS file, or
 * undefined if no cartridge contains the target.
 *
 *   ~/cartridge/scripts/foo   -> only the cartridge that owns containingFile
 *   * /cartridge/scripts/foo  -> walks the cartridge path, owner-first
 *   bar/cartridge/scripts/foo -> only the cartridge named "bar"
 */
function resolveCartridgeModule(cartridges, moduleName, containingFile, deps) {
    const lookup = cartridges.length > 0 ? cartridgeLookup(cartridges, moduleName, containingFile, deps.normalize) : undefined;
    if (!lookup?.subpath)
        return undefined;
    for (const cartridge of lookup.order) {
        const found = firstContainedCandidate(cartridge, lookup.subpath, deps);
        if (found)
            return found;
    }
    return undefined;
}
const NON_MODULES_PREFIXES = ['.', '/', '~/', '*/', 'dw/'];
/** True for a bare specifier (`server`, `server/middleware`) the `modules` cartridge may own. */
function isModulesCartridgeSpecifier(moduleName) {
    if (NON_MODULES_PREFIXES.some((prefix) => moduleName.startsWith(prefix)))
        return false;
    // Let the bundled SFRA ambient declarations win for these names. If we
    // resolved them to the .js file here, TS would infer types from the JS
    // (which misses dynamic property assignments in modules/server.js) and
    // ignore the ambient `declare module 'server' { ... }` shape.
    return !constants_1.SFRA_AMBIENT_MODULES.has(moduleName);
}
/** package.json `main` fallback for a `modules` directory without an index.js. */
function packageMainCandidate(ts, modulesCart, moduleName, deps) {
    const pkgPath = modulesCart.rawRoot + moduleName + '/package.json';
    if (!deps.fileExists(pkgPath) || !deps.isWithinRoot(pkgPath, modulesCart.root))
        return undefined;
    const main = (0, cartridge_discovery_1.readJsonFile)(ts, pkgPath)?.main;
    if (typeof main !== 'string' || main.length === 0)
        return undefined;
    const resolved = (modulesCart.rawRoot + moduleName + '/' + main.replace(/^\.\//, '')).replace(/\\/g, '/');
    // `main` is attacker-controlled JSON content flowing into a path
    // join — a `../../..` or absolute value must not escape the root.
    return deps.fileExists(resolved) && deps.isWithinRoot(resolved, modulesCart.root)
        ? { resolved, source: modulesCart.name }
        : undefined;
}
/**
 * Resolves a bare `require('server')`-style import against the SFRA `modules`
 * cartridge. Unlike normal cartridges (which expose files under
 * `cartridge/scripts/...`), the `modules` cartridge exposes its entire tree
 * at the root, so `require('server')` -> `<modules>/server[.js|/index.js]`
 * and `require('server/middleware')` -> `<modules>/server/middleware[.js]`.
 * Falls through unless a cartridge literally named `modules` is in the list.
 * `moduleName` may carry `..` after its first segment (it only can't *start*
 * with `.`/`/`), so every candidate is contained against the modules root.
 */
function resolveModulesCartridge(ts, cartridges, moduleName, deps) {
    const modulesCart = isModulesCartridgeSpecifier(moduleName)
        ? cartridges.find((c) => c.name === 'modules')
        : undefined;
    if (!modulesCart)
        return undefined;
    return (firstContainedCandidate(modulesCart, moduleName, deps) ?? packageMainCandidate(ts, modulesCart, moduleName, deps));
}
