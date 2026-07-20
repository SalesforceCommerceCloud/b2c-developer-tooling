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
const usage_inference_1 = require("./usage-inference");
const PLUGIN_NAME = '@salesforce/b2c-script-types';
const TYPES_DIR = node_path_1.default.resolve(__dirname, '..', 'types').replace(/\\/g, '/');
// Ambient declarations for SFCC globals (`session`, `request`, `response`,
// `customer`, `empty(...)`, the `dw.*` namespace alias, etc.). The plugin
// injects this into the TS program's script file list so the `declare global`
// block takes effect in projects that don't have a jsconfig.json including it.
const GLOBAL_DTS = node_path_1.default.join(TYPES_DIR, 'global.d.ts').replace(/\\/g, '/');
// Ambient typings for the SFRA `modules` cartridge — types for `require('server')`
// and friends so cartridge code works under `checkJs: true` despite the dynamic
// property assignments in modules/server.js that TS can't infer.
const SFRA_SERVER_DTS = node_path_1.default.join(TYPES_DIR, 'sfra', 'server.d.ts').replace(/\\/g, '/');
// Bare-name requires that the SFRA server.d.ts ambient declaration covers.
// We deliberately do NOT redirect these to modules/<name>.js, so TS uses the
// ambient declaration's types instead of the inferred .js types (which can't
// see the dynamic `server.middleware = ...` assignments in modules/server.js).
const SFRA_AMBIENT_MODULES = new Set([
    'server',
    'server/server',
    'server/middleware',
    'server/render',
    'server/route',
    'server/request',
    'server/response',
    'server/queryString',
    'server/forms',
    'server/forms/forms',
]);
// Candidate suffixes appended when resolving a SFCC-style relative require to
// a cartridge file. SFRA convention is to omit the .js extension, so .js wins
// first; .json captures the occasional resource bundle import.
const CANDIDATE_EXTENSIONS = ['.js', '.json', '/index.js'];
// Cartridges that conventionally sit at the bottom of the cartridge path when
// the user hasn't told us otherwise (no `cartridges` in dw.json/SFCC_CARTRIDGES).
// Higher rank = lower in the cartridge path. SFRA's runtime path ends with
// `app_storefront_base:modules`, so `modules` sorts strictly last.
// Mirrors BASE_CARTRIDGE_RANK in packages/b2c-vs-extension/src/cartridges/cartridge-service.ts.
const BASE_CARTRIDGE_RANK = {
    app_storefront_base: 1,
    modules: 2,
};
// Directories skipped during recursive .project discovery. Mirrors the ignore
// list in @salesforce/b2c-tooling-sdk's findCartridges() so plain LSP usage
// matches CLI/extension discovery.
const DISCOVERY_IGNORE = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.cache', 'tmp', 'temp']);
const DISCOVERY_MAX_DEPTH = 8;
function init({ typescript: ts }) {
    // tsserver calls this factory function fresh for every project that loads
    // the plugin (once per tsconfig/jsconfig root), so these variables are a
    // private closure per project, not shared state across a multi-root
    // workspace. configurePlugin() broadcasts the same config to every open
    // project, but each project's own onConfigurationChanged() call only
    // updates its own copy of these variables.
    let cartridges = [];
    let enabled = true;
    let autoDiscoverEnabled = true;
    let inferUsageEnabled = false;
    // Whether the most recent applyConfig() received an explicit cartridges list.
    // When true, we skip auto-discovery; when false, create() may auto-populate.
    let cartridgesFromHost = false;
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
    const setCartridges = (list) => {
        cartridges = list.map(({ name, src }) => {
            const n = normalize(src);
            return { name, root: n.endsWith('/') ? n : n + '/' };
        });
    };
    const applyConfig = (config) => {
        const c = (config ?? {});
        enabled = c.enabled !== false;
        autoDiscoverEnabled = c.autoDiscover !== false;
        inferUsageEnabled = c.inferUsage === true;
        // Only touch the cartridge list if the host explicitly provided one.
        // This lets onConfigurationChanged() update flags (enabled, autoDiscover)
        // without wiping a previously auto-discovered list.
        const cartridgesFieldPresent = c.cartridges !== undefined || c.cartridgeRoots !== undefined;
        if (!cartridgesFieldPresent)
            return;
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
        cartridgesFromHost = list.length > 0;
        setCartridges(list);
    };
    // Recursively walk projectRoot for `.project` markers. Stops descending into
    // a cartridge once found (cartridges don't nest). Depth-limited to keep
    // tsserver startup snappy on huge monorepos.
    const discoverCartridgesOnDisk = (projectRoot) => {
        const found = [];
        const stack = [{ dir: projectRoot, depth: 0 }];
        while (stack.length > 0) {
            const { dir, depth } = stack.pop();
            if (fileExists(node_path_1.default.join(dir, '.project'))) {
                found.push({ name: node_path_1.default.basename(dir), src: dir });
                continue;
            }
            if (depth >= DISCOVERY_MAX_DEPTH)
                continue;
            let subdirs = [];
            try {
                subdirs = ts.sys.getDirectories(dir);
            }
            catch {
                subdirs = [];
            }
            for (const sub of subdirs) {
                if (DISCOVERY_IGNORE.has(sub))
                    continue;
                stack.push({ dir: node_path_1.default.join(dir, sub), depth: depth + 1 });
            }
        }
        // Stable ordering for deterministic auto-discovery output.
        found.sort((a, b) => a.src.localeCompare(b.src));
        return found;
    };
    // Read the top-level dw.json `cartridges` field (string with comma/colon
    // separators OR array of names) for an explicit cartridge-path order.
    // Mirrors what the b2c CLI's resolved config exposes; we don't try to honor
    // SFCC_CARTRIDGES / .env / plugins here — hosts that need that complexity
    // should push the resolved list in via configurePlugin().
    const readDwJsonCartridges = (projectRoot) => {
        const dwJsonPath = node_path_1.default.join(projectRoot, 'dw.json');
        if (!fileExists(dwJsonPath))
            return undefined;
        let content;
        try {
            content = ts.sys.readFile(dwJsonPath);
        }
        catch {
            return undefined;
        }
        if (!content)
            return undefined;
        let parsed;
        try {
            parsed = JSON.parse(content);
        }
        catch {
            return undefined;
        }
        const value = parsed?.cartridges;
        if (typeof value === 'string') {
            return value
                .split(/[,:]/)
                .map((s) => s.trim())
                .filter(Boolean);
        }
        if (Array.isArray(value)) {
            return value.filter((s) => typeof s === 'string' && s.length > 0);
        }
        return undefined;
    };
    // Apply cartridge ordering: if `configured` is set, named-first then any
    // remaining discovered cartridges in their original order; otherwise
    // discovery order with KNOWN_BASE_CARTRIDGES sorted last.
    const orderCartridges = (discovered, configured) => {
        if (configured && configured.length > 0) {
            const byName = new Map(discovered.map((c) => [c.name, c]));
            const ordered = [];
            const seen = new Set();
            for (const name of configured) {
                const found = byName.get(name);
                if (found && !seen.has(name)) {
                    ordered.push(found);
                    seen.add(name);
                }
            }
            for (const c of discovered) {
                if (!seen.has(c.name))
                    ordered.push(c);
            }
            return ordered;
        }
        const indexed = discovered.map((c, i) => ({ c, i }));
        indexed.sort((a, b) => {
            const ar = BASE_CARTRIDGE_RANK[a.c.name] ?? 0;
            const br = BASE_CARTRIDGE_RANK[b.c.name] ?? 0;
            if (ar !== br)
                return ar - br;
            return a.i - b.i;
        });
        return indexed.map((x) => x.c);
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
    // path. Returns the absolute path to the resolved JS file, or undefined if no
    // cartridge contains the target.
    //
    //   ~/cartridge/scripts/foo   -> only the cartridge that owns containingFile
    //   * /cartridge/scripts/foo  -> walks the cartridge path, owner-first
    //   bar/cartridge/scripts/foo -> only the cartridge named "bar"
    const resolveCartridgeModule = (moduleName, containingFile) => {
        if (cartridges.length === 0)
            return undefined;
        let subpath;
        let order;
        if (moduleName.startsWith('~/')) {
            // ~ is the current cartridge — restrict to the cartridge that owns the
            // calling file. If the containing file isn't inside any known cartridge,
            // there is no current cartridge, so the require can't be resolved.
            subpath = moduleName.slice(2);
            const owner = ownerCartridge(containingFile);
            if (!owner)
                return undefined;
            order = [owner];
        }
        else if (moduleName.startsWith('*/')) {
            // * walks the cartridge path. Owner-first matches SFRA-style overrides
            // (the requesting cartridge wins before falling through to others).
            subpath = moduleName.slice(2);
            order = reorderForContainingFile(cartridges, containingFile);
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
            order = [known];
        }
        if (!subpath)
            return undefined;
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
    // Resolve a bare `require('server')`-style import against the SFRA `modules`
    // cartridge. Unlike normal cartridges (which expose files under
    // `cartridge/scripts/...`), the `modules` cartridge exposes its entire tree
    // at the root, so `require('server')` -> `<modules>/server[.js|/index.js]`
    // and `require('server/middleware')` -> `<modules>/server/middleware[.js]`.
    // Falls through unless a cartridge literally named `modules` is in the list.
    const resolveModulesCartridge = (moduleName) => {
        if (cartridges.length === 0)
            return undefined;
        if (moduleName.startsWith('.') || moduleName.startsWith('/'))
            return undefined;
        if (moduleName.startsWith('~/') || moduleName.startsWith('*/') || moduleName.startsWith('dw/'))
            return undefined;
        // Let the bundled SFRA ambient declarations win for these names. If we
        // resolved them to the .js file here, TS would infer types from the JS
        // (which misses dynamic property assignments in modules/server.js) and
        // ignore the ambient `declare module 'server' { ... }` shape.
        if (SFRA_AMBIENT_MODULES.has(moduleName))
            return undefined;
        const modulesCart = cartridges.find((c) => c.name === 'modules');
        if (!modulesCart)
            return undefined;
        const baseAbs = modulesCart.root + moduleName;
        for (const ext of CANDIDATE_EXTENSIONS) {
            const candidate = baseAbs + ext;
            if (fileExists(candidate)) {
                return { resolved: candidate, source: modulesCart.name };
            }
        }
        // package.json `main` fallback for directories without an index.js.
        const pkgPath = baseAbs + '/package.json';
        if (fileExists(pkgPath)) {
            try {
                const content = ts.sys.readFile(pkgPath);
                if (content) {
                    const main = JSON.parse(content).main;
                    if (typeof main === 'string' && main.length > 0) {
                        const resolved = (modulesCart.root + moduleName + '/' + main.replace(/^\.\//, '')).replace(/\\/g, '/');
                        if (fileExists(resolved)) {
                            return { resolved, source: modulesCart.name };
                        }
                    }
                }
            }
            catch {
                // best-effort
            }
        }
        return undefined;
    };
    const ownerCartridge = (containingFile) => {
        const f = normalize(containingFile);
        return cartridges.find((c) => f.startsWith(c.root));
    };
    // Cached map of byte ranges in types/sfra/server.d.ts to the SFRA module
    // declared by their enclosing `declare module 'X' { ... }` block. Used to
    // map go-to-definition results back to the matching modules/<X>.js file.
    let sfraDtsRanges;
    const sfraModuleAtOffset = (offset) => {
        if (!sfraDtsRanges) {
            const content = fileExists(SFRA_SERVER_DTS) ? ts.sys.readFile(SFRA_SERVER_DTS) : undefined;
            sfraDtsRanges = content ? parseDeclareModuleRanges(content) : [];
        }
        for (const r of sfraDtsRanges) {
            if (offset >= r.start && offset <= r.end)
                return r.module;
        }
        return undefined;
    };
    const parseDeclareModuleRanges = (content) => {
        const ranges = [];
        const re = /declare module ['"]([^'"]+)['"]\s*\{/g;
        let m;
        while ((m = re.exec(content)) !== null) {
            const start = m.index;
            // Walk forward from the opening brace to find the matching close.
            let depth = 1;
            let i = m.index + m[0].length;
            while (i < content.length && depth > 0) {
                const ch = content[i];
                if (ch === '{')
                    depth++;
                else if (ch === '}')
                    depth--;
                i++;
            }
            ranges.push({ start, end: i, module: m[1] });
        }
        return ranges;
    };
    const reorderForContainingFile = (list, containingFile) => {
        const owner = ownerCartridge(containingFile);
        if (!owner)
            return list;
        return [owner, ...list.filter((c) => c !== owner)];
    };
    function create(info) {
        const log = (msg) => info.project.projectService.logger.info(`[${PLUGIN_NAME}] ${msg}`);
        applyConfig(info.config);
        // Fallback for hosts that don't push cartridges (plain LSP usage, e.g.
        // Neovim with typescript-language-server). Walks the project root for
        // `.project` markers and honors dw.json's `cartridges` field for ordering.
        if (enabled && autoDiscoverEnabled && !cartridgesFromHost && cartridges.length === 0) {
            const projectRoot = info.project.getCurrentDirectory();
            if (projectRoot) {
                try {
                    const discovered = discoverCartridgesOnDisk(projectRoot);
                    const configured = readDwJsonCartridges(projectRoot);
                    const ordered = orderCartridges(discovered, configured);
                    setCartridges(ordered);
                    log(`auto-discovered ${cartridges.length} cartridge(s) from ${projectRoot}` +
                        (configured ? ` (ordered by dw.json cartridges)` : ''));
                }
                catch (e) {
                    log(`auto-discovery failed: ${e.message}`);
                }
            }
        }
        const host = info.languageServiceHost;
        // What `module.superModule` refers to at runtime: the same-subpath file
        // in the next cartridge down the cartridge path that has one. Powers the
        // usage-inference engine's handling of SFRA overlay modules. Probes
        // existence through the language-service host (not ts.sys) so it sees
        // the same filesystem view as the rest of this project.
        const hostFileExists = (p) => {
            try {
                return host.fileExists ? host.fileExists(p) : ts.sys.fileExists(p);
            }
            catch {
                return false;
            }
        };
        const resolveSuperModulePath = (containingFile) => {
            const owner = ownerCartridge(containingFile);
            if (!owner)
                return undefined;
            const subpath = normalize(containingFile).slice(owner.root.length);
            for (let i = cartridges.indexOf(owner) + 1; i < cartridges.length; i++) {
                const candidate = cartridges[i].root + subpath;
                if (hostFileExists(candidate))
                    return candidate;
            }
            return undefined;
        };
        // Inject ambient declarations into the TS program when the project
        // contains at least one cartridge file:
        //   - global.d.ts: SFCC platform globals (session, request, response,
        //     customer, empty(), the ambient `dw` namespace).
        //   - sfra/server.d.ts: SFRA `modules` cartridge typings (server, route,
        //     middleware, etc.) — only injected when a `modules` cartridge is
        //     configured. Configured projects that already include either via a
        //     jsconfig include glob are unaffected (dedup by normalized path).
        const origGetScriptFileNames = host.getScriptFileNames.bind(host);
        host.getScriptFileNames = () => {
            const list = origGetScriptFileNames();
            if (!enabled || cartridges.length === 0)
                return list;
            if (!list.some((f) => isCartridgeFile(f)))
                return list;
            const additions = [];
            const present = new Set(list.map((f) => normalize(f)));
            if (fileExists(GLOBAL_DTS) && !present.has(normalize(GLOBAL_DTS))) {
                additions.push(GLOBAL_DTS);
            }
            const hasModules = cartridges.some((c) => c.name === 'modules');
            if (hasModules && fileExists(SFRA_SERVER_DTS) && !present.has(normalize(SFRA_SERVER_DTS))) {
                additions.push(SFRA_SERVER_DTS);
            }
            return additions.length > 0 ? [...list, ...additions] : list;
        };
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
                    const mod = resolveModulesCartridge(text);
                    if (mod) {
                        return {
                            resolvedModule: {
                                resolvedFileName: mod.resolved,
                                extension: mod.resolved.endsWith('.json') ? ts.Extension.Json : ts.Extension.Js,
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
                    const mod = resolveModulesCartridge(text);
                    if (mod) {
                        return {
                            resolvedFileName: mod.resolved,
                            extension: mod.resolved.endsWith('.json') ? ts.Extension.Json : ts.Extension.Js,
                            isExternalLibraryImport: false,
                        };
                    }
                    return res;
                });
            };
        }
        // Wrap the language service so go-to-definition results that land inside
        // our injected types/sfra/server.d.ts redirect to the real implementation
        // in the user's `modules` cartridge. Without this, following go-to-def on
        // `require('server')` (or a Server.use call) would dump the user into
        // bundled type declarations instead of their actual source.
        const proxy = Object.create(null);
        for (const k of Object.keys(info.languageService)) {
            const fn = info.languageService[k];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            proxy[k] = (...args) => fn.apply(info.languageService, args);
        }
        const remapDefinition = (def) => {
            if (cartridges.length === 0)
                return def;
            if (normalize(def.fileName) !== normalize(SFRA_SERVER_DTS))
                return def;
            const modulesCart = cartridges.find((c) => c.name === 'modules');
            if (!modulesCart)
                return def;
            const moduleName = sfraModuleAtOffset(def.textSpan.start);
            if (!moduleName)
                return def;
            const candidates = [modulesCart.root + moduleName + '.js', modulesCart.root + moduleName + '/index.js'];
            for (const candidate of candidates) {
                if (fileExists(candidate)) {
                    return { ...def, fileName: candidate, textSpan: { start: 0, length: 0 } };
                }
            }
            return def;
        };
        proxy.getDefinitionAtPosition = (fileName, position) => {
            const result = info.languageService.getDefinitionAtPosition(fileName, position);
            return result?.map(remapDefinition);
        };
        proxy.getDefinitionAndBoundSpan = (fileName, position) => {
            const result = info.languageService.getDefinitionAndBoundSpan(fileName, position);
            if (!result?.definitions)
                return result;
            return { ...result, definitions: result.definitions.map(remapDefinition) };
        };
        proxy.getTypeDefinitionAtPosition = (fileName, position) => {
            const result = info.languageService.getTypeDefinitionAtPosition(fileName, position);
            return result?.map(remapDefinition);
        };
        proxy.getImplementationAtPosition = (fileName, position) => {
            const result = info.languageService.getImplementationAtPosition(fileName, position);
            return result?.map(remapDefinition);
        };
        // Usage-based inference (opt-in, `inferUsage`): when hover/completion hits
        // a type the checker has already given up on (`any` — typically an
        // undocumented helper function), infer a better answer from call sites
        // elsewhere in the project instead of leaving the editor with nothing.
        //
        // Cached per (file, node position). Entries are finished DISPLAY products
        // (the hover note string, the synthesized completion entries) rather than
        // checker Type objects: a Type pins its checker and, through it, the whole
        // program it came from, so caching types would keep an entire stale
        // program graph alive from the last edit until the next inference-eligible
        // request — potentially forever if the user stops hovering. Strings and
        // plain completion entries retain nothing.
        //
        // The whole cache is invalidated when the language service hands back a
        // different Program instance (TS builds a new Program object for any
        // semantic change, and reuses the same instance otherwise), rather than
        // tracking per-entry validity. Program identity is more precise than the
        // previously-used project version string, which also bumps on events that
        // don't produce a new program — each such bump needlessly re-ran a full
        // inference (measured ~13ms per hover on an SFRA-sized project) that the
        // cache should have answered.
        let inferenceCacheProgram;
        const inferenceCache = new Map();
        // Bounds the cache during a long no-edit session (e.g. hours of hovering
        // around at the same program): entries are small (strings / plain entry
        // arrays), so this is belt-and-braces, and a wholesale clear is honest —
        // no LRU bookkeeping for a cache this cheap to refill.
        const MAX_INFERENCE_CACHE_ENTRIES = 512;
        const getCachedInference = (cacheKey, program, compute) => {
            if (program !== inferenceCacheProgram) {
                inferenceCache.clear();
                inferenceCacheProgram = program;
            }
            if (inferenceCache.has(cacheKey))
                return inferenceCache.get(cacheKey);
            const result = compute();
            if (inferenceCache.size >= MAX_INFERENCE_CACHE_ENTRIES)
                inferenceCache.clear();
            inferenceCache.set(cacheKey, result);
            return result;
        };
        // Runs our own inference logic and degrades to `fallback` (the untouched
        // underlying result) if it throws, so a bug in this plugin's additions
        // can't take the whole tsserver request down with it. Deliberately wraps
        // ONLY the inference augmentation, never the underlying language-service
        // call itself: an exception from vanilla TS must keep propagating to
        // tsserver's own error reporting exactly as it would without this plugin
        // installed — swallowing it here would turn a real TS crash into a
        // silent "hover stopped working" for every file in the project.
        // `ts.OperationCanceledException` is exempted and always rethrown: TS
        // throws it cooperatively whenever the host's CancellationToken fires
        // (e.g. the user kept typing while this hover or completion request was
        // still in flight), which is ordinary, frequent behavior, not a real
        // failure — tsserver's request pipeline handles a propagated
        // cancellation very differently from a completed-but-empty response, so
        // swallowing it here would misreport "cancelled" as "resolved to
        // nothing" every time.
        const guarded = (label, fn, fallback) => {
            try {
                return fn();
            }
            catch (e) {
                if (e instanceof ts.OperationCanceledException)
                    throw e;
                log(`usage-inference ${label} failed: ${e.message}`);
                return fallback;
            }
        };
        proxy.getQuickInfoAtPosition = (fileName, position, maximumLength) => {
            const original = info.languageService.getQuickInfoAtPosition(fileName, position, maximumLength);
            if (!enabled || !inferUsageEnabled || !isCartridgeFile(fileName) || !original)
                return original;
            return guarded('hover', () => {
                const program = info.languageService.getProgram();
                const sourceFile = program?.getSourceFile(fileName);
                if (!program || !sourceFile)
                    return original;
                const node = (0, usage_inference_1.getNodeAtPosition)(sourceFile, ts, position);
                if (!node || !ts.isIdentifier(node))
                    return original;
                const checker = program.getTypeChecker();
                // superModule-derived expressions get past the not-any gate: the
                // checker's type for them is garbage either way (any or an opaque
                // circular typeof), never something worth leaving untouched.
                if (!(0, usage_inference_1.isAnyType)(ts, checker.getTypeAtLocation(node)) && !(0, usage_inference_1.traceSuperModuleAccess)(ts, checker, node)) {
                    return original;
                }
                // `undefined` (inference found nothing) is a cached answer too —
                // re-deriving "nothing" costs the same reference searches as
                // re-deriving something.
                const description = getCachedInference(`hover:${fileName}:${node.getStart(sourceFile)}`, program, () => {
                    const ctx = (0, usage_inference_1.createInferenceContext)(ts, info.languageService, resolveSuperModulePath);
                    const types = ctx ? (0, usage_inference_1.inferTypeForNode)(ctx, node) : [];
                    return types.length > 0 ? (0, usage_inference_1.describeTypes)(checker, types) : undefined;
                });
                if (!description)
                    return original;
                const note = {
                    text: `\n\nInferred from usage: ${description}`,
                    kind: 'text',
                };
                return { ...original, documentation: [...(original.documentation ?? []), note] };
            }, original);
        };
        proxy.getCompletionsAtPosition = (fileName, position, options, formattingSettings) => {
            const original = info.languageService.getCompletionsAtPosition(fileName, position, options, formattingSettings);
            if (!enabled || !inferUsageEnabled || !isCartridgeFile(fileName))
                return original;
            return guarded('completions', () => {
                const program = info.languageService.getProgram();
                const sourceFile = program?.getSourceFile(fileName);
                if (!program || !sourceFile)
                    return original;
                const node = (0, usage_inference_1.getNodeAtPosition)(sourceFile, ts, Math.max(position - 1, 0));
                if (!node)
                    return original;
                const propAccess = (0, usage_inference_1.findEnclosingPropertyAccess)(node, ts);
                if (!propAccess)
                    return original;
                const checker = program.getTypeChecker();
                // See the hover gate above for the superModule exception.
                if (!(0, usage_inference_1.isAnyType)(ts, checker.getTypeAtLocation(propAccess.expression)) &&
                    !(0, usage_inference_1.traceSuperModuleAccess)(ts, checker, propAccess.expression)) {
                    return original;
                }
                // The receiver can be any expression, not just a plain identifier:
                // `product.getPriceModel().|` needs the chain resolved the same way
                // hover-driven return inference already resolves it.
                const baseNode = propAccess.expression;
                const typeEntries = getCachedInference(`completions:${fileName}:${baseNode.getStart(sourceFile)}`, program, () => {
                    const ctx = (0, usage_inference_1.createInferenceContext)(ts, info.languageService, resolveSuperModulePath);
                    const types = ctx ? (0, usage_inference_1.inferTypeForExpression)(ctx, baseNode) : [];
                    return (0, usage_inference_1.typesToCompletionEntries)(ts, checker, types);
                });
                // Members added by pass-through superModule overlay levels
                // (`module.exports = base; module.exports.extra = fn;`) can't be
                // carried by any candidate type — collect them separately. Cheap
                // (statement scans only, no reference search), so uncached.
                const augmentedCtx = (0, usage_inference_1.createInferenceContext)(ts, info.languageService, resolveSuperModulePath);
                const augmentedEntries = (augmentedCtx ? (0, usage_inference_1.collectSuperModuleAugmentedMembers)(augmentedCtx, baseNode) : []).map((m) => ({
                    name: m.name,
                    kind: m.isMethod ? ts.ScriptElementKind.memberFunctionElement : ts.ScriptElementKind.memberVariableElement,
                    kindModifiers: '',
                    sortText: '11',
                    source: usage_inference_1.INFERRED_COMPLETION_SOURCE,
                }));
                const inferredEntries = [...typeEntries, ...augmentedEntries];
                if (inferredEntries.length === 0)
                    return original;
                // Dedupe against the original entries AND within the inferred set
                // (a name can come from both a candidate type and an overlay
                // augmentation).
                const seenNames = new Set((original?.entries ?? []).map((e) => e.name));
                const merged = [
                    ...(original?.entries ?? []),
                    ...inferredEntries.filter((e) => !seenNames.has(e.name) && (seenNames.add(e.name), true)),
                ];
                // Preserve every other field TS set on the original result (isIncomplete,
                // optionalReplacementSpan, metadata, defaultCommitCharacters, flags) —
                // only entries actually changed. Only synthesize a fresh CompletionInfo
                // in the rare case TS returned nothing at all for this position.
                if (original)
                    return { ...original, entries: merged };
                return {
                    isGlobalCompletion: false,
                    isMemberCompletion: true,
                    isNewIdentifierLocation: false,
                    entries: merged,
                };
            }, original);
        };
        log(`plugin initialized (cartridges=${cartridges.length}, enabled=${enabled})`);
        return proxy;
    }
    function onConfigurationChanged(config) {
        applyConfig(config);
    }
    return { create, onConfigurationChanged };
}
module.exports = init;
