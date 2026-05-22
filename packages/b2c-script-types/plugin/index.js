"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
const node_path_1 = __importDefault(require("node:path"));
const PLUGIN_NAME = '@salesforce/b2c-script-types';
const TYPES_DIR = node_path_1.default.resolve(__dirname, '..', 'types').replace(/\\/g, '/');
// Candidate suffixes appended when resolving a SFCC-style relative require to
// a cartridge file. SFRA convention is to omit the .js extension, so .js wins
// first; .json captures the occasional resource bundle import.
const CANDIDATE_EXTENSIONS = ['.js', '.json', '/index.js'];
function init({ typescript: ts }) {
    // Module-scoped state shared across all projects in the TS server. The host
    // calls onConfigurationChanged() on this module when configurePlugin() runs;
    // each project's wrapped resolver reads from these variables.
    let cartridges = [];
    let enabled = true;
    // tsserver internally canonicalizes file paths to forward slashes regardless of
    // platform (so containingFile is "C:/proj/..." on Windows). The cartridge roots
    // we receive from the extension come from Node's path.resolve(), which returns
    // backslashes on Windows — we have to normalize to match. We also fold case on
    // case-insensitive filesystems (Windows + default macOS HFS+/APFS) so a path
    // like "C:/Proj" matches a cartridge root of "c:/proj".
    const caseSensitive = ts.sys.useCaseSensitiveFileNames;
    const normalize = (p) => {
        const slashed = p.replace(/\\/g, '/');
        return caseSensitive ? slashed : slashed.toLowerCase();
    };
    const applyConfig = (config) => {
        const c = (config ?? {});
        enabled = c.enabled !== false;
        // Prefer the structured cartridges list. Fall back to legacy cartridgeRoots
        // (paths only, no name) so older extension builds keep working.
        const list = Array.isArray(c.cartridges)
            ? c.cartridges
                .filter((x) => Boolean(x?.name) && Boolean(x?.src))
                .map((x) => ({ name: x.name, src: x.src }))
            : Array.isArray(c.cartridgeRoots)
                ? c.cartridgeRoots
                    .filter((p) => typeof p === 'string' && p.length > 0)
                    .map((p) => ({ name: node_path_1.default.basename(p), src: p }))
                : [];
        cartridges = list.map(({ name, src }) => {
            const n = normalize(src);
            return { name, root: n.endsWith('/') ? n : n + '/' };
        });
    };
    const isCartridgeFile = (filePath) => {
        if (!enabled || cartridges.length === 0)
            return false;
        const f = normalize(filePath);
        for (const c of cartridges) {
            if (f.startsWith(c.root))
                return true;
        }
        return false;
    };
    const resolveDwModule = (moduleName) => {
        // require('dw/catalog/Product') -> <typesDir>/dw/catalog/Product.d.ts.
        // tsserver keys its internal file map on forward-slash paths, so normalize
        // the return value here — path.join produces backslashes on Windows.
        if (moduleName.startsWith('dw/')) {
            return node_path_1.default.join(TYPES_DIR, moduleName + '.d.ts').replace(/\\/g, '/');
        }
        return undefined;
    };
    const fileExists = (p) => {
        try {
            return ts.sys.fileExists(p);
        }
        catch {
            return false;
        }
    };
    // Resolve a SFCC cartridge-style require relative to the configured cartridge
    // path (highest-priority cartridge first). Returns the absolute path to the
    // resolved JS file, or undefined if no cartridge contains the target.
    //
    //   ~/cartridge/scripts/foo   -> searches every cartridge in order
    //   * /cartridge/scripts/foo  -> equivalent to ~/ -- same search
    //   bar/cartridge/scripts/foo -> searches only the cartridge named "bar"
    const resolveCartridgeModule = (moduleName, containingFile) => {
        if (cartridges.length === 0)
            return undefined;
        let subpath;
        let restrictTo;
        if (moduleName.startsWith('~/')) {
            subpath = moduleName.slice(2);
        }
        else if (moduleName.startsWith('*/')) {
            subpath = moduleName.slice(2);
        }
        else {
            // <cartridgeName>/cartridge/... — only treat as a cartridge require if the
            // first segment matches a known cartridge name. Otherwise pass through so
            // node_modules and other resolutions still work.
            const slash = moduleName.indexOf('/');
            if (slash <= 0)
                return undefined;
            const head = moduleName.slice(0, slash);
            const known = cartridges.find((c) => c.name === head);
            if (!known)
                return undefined;
            subpath = moduleName.slice(slash + 1);
            restrictTo = known.name;
        }
        if (!subpath)
            return undefined;
        // For ~/ requires we also let the cartridge that owns the containing file
        // win first — SFRA-style overrides expect "look at me, then the rest".
        const order = restrictTo
            ? cartridges.filter((c) => c.name === restrictTo)
            : reorderForContainingFile(cartridges, containingFile);
        for (const c of order) {
            const baseAbs = c.root + subpath;
            for (const ext of CANDIDATE_EXTENSIONS) {
                const candidate = baseAbs + ext;
                if (fileExists(candidate)) {
                    return { resolved: candidate, source: c.name };
                }
            }
        }
        return undefined;
    };
    const reorderForContainingFile = (list, containingFile) => {
        const f = normalize(containingFile);
        const owner = list.find((c) => f.startsWith(c.root));
        if (!owner)
            return list;
        return [owner, ...list.filter((c) => c !== owner)];
    };
    function create(info) {
        const log = (msg) => info.project.projectService.logger.info(`[${PLUGIN_NAME}] ${msg}`);
        applyConfig(info.config);
        const host = info.languageServiceHost;
        const origResolveModuleNameLiterals = host.resolveModuleNameLiterals?.bind(host);
        if (origResolveModuleNameLiterals) {
            host.resolveModuleNameLiterals = (moduleLiterals, containingFile, redirectedReference, options, containingSourceFile, reusedNames) => {
                const original = origResolveModuleNameLiterals(moduleLiterals, containingFile, redirectedReference, options, containingSourceFile, reusedNames);
                if (!isCartridgeFile(containingFile))
                    return original;
                return original.map((res, i) => {
                    if (res.resolvedModule)
                        return res;
                    const text = moduleLiterals[i].text;
                    const dw = resolveDwModule(text);
                    if (dw && fileExists(dw)) {
                        return {
                            resolvedModule: {
                                resolvedFileName: dw,
                                extension: ts.Extension.Dts,
                                isExternalLibraryImport: true,
                                packageId: undefined,
                            },
                        };
                    }
                    const cart = resolveCartridgeModule(text, containingFile);
                    if (cart) {
                        return {
                            resolvedModule: {
                                resolvedFileName: cart.resolved,
                                extension: cart.resolved.endsWith('.json') ? ts.Extension.Json : ts.Extension.Js,
                                isExternalLibraryImport: false,
                                packageId: undefined,
                            },
                        };
                    }
                    return res;
                });
            };
        }
        // Legacy TS 4.x path
        const origResolveModuleNames = host.resolveModuleNames?.bind(host);
        if (origResolveModuleNames) {
            host.resolveModuleNames = (moduleNames, containingFile, reusedNames, redirectedReference, options, containingSourceFile) => {
                const original = origResolveModuleNames(moduleNames, containingFile, reusedNames, redirectedReference, options, containingSourceFile);
                if (!isCartridgeFile(containingFile))
                    return original;
                return original.map((res, i) => {
                    if (res)
                        return res;
                    const text = moduleNames[i];
                    const dw = resolveDwModule(text);
                    if (dw && fileExists(dw)) {
                        return {
                            resolvedFileName: dw,
                            extension: ts.Extension.Dts,
                            isExternalLibraryImport: true,
                        };
                    }
                    const cart = resolveCartridgeModule(text, containingFile);
                    if (cart) {
                        return {
                            resolvedFileName: cart.resolved,
                            extension: cart.resolved.endsWith('.json') ? ts.Extension.Json : ts.Extension.Js,
                            isExternalLibraryImport: false,
                        };
                    }
                    return res;
                });
            };
        }
        log(`plugin initialized (cartridges=${cartridges.length}, enabled=${enabled})`);
        return info.languageService;
    }
    function onConfigurationChanged(config) {
        applyConfig(config);
    }
    return { create, onConfigurationChanged };
}
module.exports = init;
