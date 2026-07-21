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
const constants_1 = require("./resolver/constants");
const cartridge_discovery_1 = require("./resolver/cartridge-discovery");
/**
 * Swaps the trailing `any` keyword part of a QuickInfo's display parts (the
 * shape TS renders for an undocumented parameter/property, e.g. `(parameter)
 * shipment: any`) for the inferred type's description, so the bolded hover
 * header reads `(parameter) shipment: Shipment` instead of `... : any` —
 * while leaving everything else (the `(parameter) shipment: ` prefix TS
 * already rendered) untouched. Only ever touches a display exactly ending in
 * that keyword; any other shape is returned as-is rather than guessed at.
 */
function replaceTrailingAnyDisplayPart(displayParts, description) {
    if (!displayParts || displayParts.length === 0)
        return displayParts;
    const last = displayParts[displayParts.length - 1];
    if (last.kind !== 'keyword' || last.text !== 'any')
        return displayParts;
    return [...displayParts.slice(0, -1), { kind: 'text', text: description }];
}
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
    // True when `candidate` resolves to a location at or beneath `rootDir`.
    // This is the trust boundary for every resolver below: import specifiers,
    // cartridge names, and a cartridge's package.json `main` are all
    // attacker-controlled in a cloned repository, so a resolved path that
    // escapes its intended root (via `..`, an absolute/UNC/drive form, or a
    // symlink) must be rejected rather than read into the TS program.
    const isWithinRoot = (candidate, rootDir) => {
        const root = canonicalPath(rootDir);
        const resolved = canonicalPath(candidate);
        return (resolved + '/').startsWith(root.endsWith('/') ? root : root + '/');
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
            const resolved = node_path_1.default.join(TYPES_DIR, moduleName + '.d.ts').replace(/\\/g, '/');
            // A crafted name like `dw/../../../etc/passwd` would otherwise join to a
            // path outside the bundled types dir. Reject anything that escapes it.
            if (!isWithinRoot(resolved, TYPES_DIR))
                return undefined;
            return resolved;
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
            for (const ext of constants_1.CANDIDATE_EXTENSIONS) {
                const candidate = baseAbs + ext;
                // `subpath` comes straight from the import specifier, so a `..`
                // segment (or an absolute/symlinked target) can point outside the
                // cartridge — resolve and contain before accepting it.
                if (fileExists(candidate) && isWithinRoot(candidate, c.root)) {
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
        if (constants_1.SFRA_AMBIENT_MODULES.has(moduleName))
            return undefined;
        const modulesCart = cartridges.find((c) => c.name === 'modules');
        if (!modulesCart)
            return undefined;
        const baseAbs = modulesCart.root + moduleName;
        for (const ext of constants_1.CANDIDATE_EXTENSIONS) {
            const candidate = baseAbs + ext;
            // `moduleName` may carry `..` after its first segment (it only can't
            // *start* with `.`/`/`); contain it against the modules root.
            if (fileExists(candidate) && isWithinRoot(candidate, modulesCart.root)) {
                return { resolved: candidate, source: modulesCart.name };
            }
        }
        // package.json `main` fallback for directories without an index.js.
        const pkgPath = baseAbs + '/package.json';
        if (fileExists(pkgPath) && isWithinRoot(pkgPath, modulesCart.root)) {
            const main = (0, cartridge_discovery_1.readJsonFile)(ts, pkgPath)?.main;
            if (typeof main === 'string' && main.length > 0) {
                const resolved = (modulesCart.root + moduleName + '/' + main.replace(/^\.\//, '')).replace(/\\/g, '/');
                // `main` is attacker-controlled JSON content flowing into a path
                // join — a `../../..` or absolute value must not escape the root.
                if (fileExists(resolved) && isWithinRoot(resolved, modulesCart.root)) {
                    return { resolved, source: modulesCart.name };
                }
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
            sfraDtsRanges = content ? (0, cartridge_discovery_1.parseDeclareModuleRanges)(content) : [];
        }
        for (const r of sfraDtsRanges) {
            if (offset >= r.start && offset <= r.end)
                return r.module;
        }
        return undefined;
    };
    const reorderForContainingFile = (list, containingFile) => {
        const owner = ownerCartridge(containingFile);
        if (!owner)
            return list;
        return [owner, ...list.filter((c) => c !== owner)];
    };
    function create(info) {
        const log = (msg) => info.project.projectService.logger.info(`[${constants_1.PLUGIN_NAME}] ${msg}`);
        applyConfig(info.config);
        // Fallback for hosts that don't push cartridges (plain LSP usage, e.g.
        // Neovim with typescript-language-server). Walks the project root for
        // `.project` markers and honors dw.json's `cartridges` field for ordering.
        if (enabled && autoDiscoverEnabled && !cartridgesFromHost && cartridges.length === 0) {
            const projectRoot = info.project.getCurrentDirectory();
            if (projectRoot) {
                try {
                    const discovered = (0, cartridge_discovery_1.discoverCartridgesOnDisk)(ts, projectRoot, fileExists);
                    const configured = (0, cartridge_discovery_1.readDwJsonCartridges)(ts, projectRoot, fileExists);
                    const ordered = (0, cartridge_discovery_1.orderCartridges)(discovered, configured);
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
                // `subpath` is derived from an editor-supplied file path; contain the
                // next-cartridge-down candidate so a crafted path or an overlapping
                // cartridge root can't point it at a file outside that cartridge.
                if (hostFileExists(candidate) && isWithinRoot(candidate, cartridges[i].root))
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
        // HoverInferenceResult is likewise plain data only: `documentation` and
        // `tags` are copied out of a real Symbol's own getDocumentationComment()/
        // getJsDocTags() (SymbolDisplayPart[] / JSDocTagInfo[] are just text —
        // they don't reference the Symbol, Type, or Node they came from), never
        // the Symbol/Type/Node itself.
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
                const inferred = getCachedInference(`hover:${fileName}:${node.getStart(sourceFile)}`, program, () => {
                    const ctx = (0, usage_inference_1.createInferenceContext)(ts, info.languageService, resolveSuperModulePath, position);
                    if (!ctx)
                        return undefined;
                    // Hovering the member name of a property access
                    // (`shipment.productLineItems`, cursor on `productLineItems`) has
                    // no declaration of its own to look up — `productLineItems` isn't
                    // a symbol anywhere until the receiver's type is known. Resolve
                    // the whole access expression the same way completions do,
                    // rather than restricting to inferTypeForNode's bare-identifier
                    // (parameter/variable/function) cases.
                    const propAccess = (0, usage_inference_1.findEnclosingPropertyAccess)(node, ts);
                    const isMemberName = !!propAccess && propAccess.name === node;
                    const types = isMemberName ? (0, usage_inference_1.inferTypeForExpression)(ctx, propAccess) : (0, usage_inference_1.inferTypeForNode)(ctx, node);
                    if (types.length === 0)
                        return undefined;
                    const description = (0, usage_inference_1.describeTypes)(checker, types);
                    // The receiver's type was undocumented, but the *member itself*
                    // (or the inferred type's own declaration) is real and usually
                    // documented — borrow its doc comment/tags so hover reads like a
                    // native, fully-resolved hover instead of just a bare type name.
                    let symbol;
                    if (isMemberName && propAccess) {
                        for (const baseType of (0, usage_inference_1.inferTypeForExpression)(ctx, propAccess.expression)) {
                            symbol = (0, usage_inference_1.getMemberOfType)(checker, baseType, node.text);
                            if (symbol)
                                break;
                        }
                    }
                    else {
                        symbol = types[0].getSymbol();
                    }
                    const documentation = symbol?.getDocumentationComment(checker);
                    const tags = symbol?.getJsDocTags(checker);
                    return {
                        description,
                        documentation: documentation && documentation.length > 0 ? documentation : undefined,
                        tags: tags && tags.length > 0 ? tags : undefined,
                    };
                });
                if (!inferred)
                    return original;
                const note = {
                    text: `\n\nInferred from usage: ${inferred.description}`,
                    kind: 'text',
                };
                return {
                    ...original,
                    displayParts: replaceTrailingAnyDisplayPart(original.displayParts, inferred.description),
                    documentation: [...(inferred.documentation ?? []), ...(original.documentation ?? []), note],
                    tags: inferred.tags && inferred.tags.length > 0 ? [...inferred.tags] : original.tags,
                };
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
                    const ctx = (0, usage_inference_1.createInferenceContext)(ts, info.languageService, resolveSuperModulePath, position);
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
