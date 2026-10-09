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
const module_resolution_1 = require("./resolver/module-resolution");
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
    // The cache resets of every language service create() decorated.
    const usageInferenceResets = new Set();
    // tsserver internally canonicalizes file paths to forward slashes regardless of
    // platform (so containingFile is "C:/proj/..." on Windows). The cartridge roots
    // we receive from the extension come from Node's path.resolve(), which returns
    // backslashes on Windows — we have to normalize to match. We also fold case on
    // case-insensitive filesystems (Windows + default macOS HFS+/APFS) so a path
    // like "C:/Proj" matches a cartridge root of "c:/proj".
    //
    // isWithinRoot is the trust boundary for every resolver below — see its
    // doc comment in resolver/module-resolution.ts for the full rationale and
    // known limitations.
    const { normalize, isWithinRoot } = (0, module_resolution_1.createPathContainment)(ts, ts.sys.useCaseSensitiveFileNames);
    const setCartridges = (list) => {
        cartridges = list.map(({ name, src }) => {
            const n = normalize(src);
            const raw = src.replace(/\\/g, '/');
            return {
                name,
                root: n.endsWith('/') ? n : n + '/',
                rawRoot: raw.endsWith('/') ? raw : raw + '/',
            };
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
    const ownerCartridge = (containingFile) => (0, module_resolution_1.ownerCartridge)(cartridges, normalize, containingFile);
    // Fallback for hosts that don't push cartridges (plain LSP usage, e.g.
    // Neovim with typescript-language-server). Walks the project root for
    // `.project` markers and honors dw.json's `cartridges` field for ordering.
    const needsAutoDiscovery = () => enabled && autoDiscoverEnabled && !cartridgesFromHost && cartridges.length === 0;
    const autoDiscoverCartridges = (projectRoot, log) => {
        if (!projectRoot)
            return;
        try {
            const discovered = (0, cartridge_discovery_1.discoverCartridgesOnDisk)(ts, projectRoot, fileExists);
            const configured = (0, cartridge_discovery_1.readDwJsonCartridges)(ts, projectRoot, fileExists);
            setCartridges((0, cartridge_discovery_1.orderCartridges)(discovered, configured));
            log(`auto-discovered ${cartridges.length} cartridge(s) from ${projectRoot}` +
                (configured ? ` (ordered by dw.json cartridges)` : ''));
        }
        catch (e) {
            log(`auto-discovery failed: ${e.message}`);
        }
    };
    // The ambient declarations a project with cartridge files needs and its
    // file list doesn't already include (dedup by normalized path):
    //   - global.d.ts: SFCC platform globals (session, request, response,
    //     customer, empty(), the ambient `dw` namespace).
    //   - sfra/server.d.ts: SFRA `modules` cartridge typings (server, route,
    //     middleware, etc.) — only when a `modules` cartridge is configured.
    const missingAmbientDeclarations = (list) => {
        const present = new Set(list.map((f) => normalize(f)));
        const wanted = cartridges.some((c) => c.name === 'modules') ? [GLOBAL_DTS, SFRA_SERVER_DTS] : [GLOBAL_DTS];
        return wanted.filter((dts) => fileExists(dts) && !present.has(normalize(dts)));
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
    function create(info) {
        const log = (msg) => info.project.projectService.logger.info(`[${constants_1.PLUGIN_NAME}] ${msg}`);
        applyConfig(info.config);
        if (needsAutoDiscovery())
            autoDiscoverCartridges(info.project.getCurrentDirectory(), log);
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
        // Prefer the language-service host's view of the filesystem for require()
        // resolution (not ts.sys): in-memory / virtualized hosts (tests, some LSP
        // setups) otherwise never see cartridge files, and `~/` / `*/` requires
        // silently stay unresolved. Auto-discovery above still uses ts.sys because
        // it walks the real project root on disk.
        const resolveCartridgeModuleOnHost = (moduleName, containingFile) => (0, module_resolution_1.resolveCartridgeModule)(cartridges, moduleName, containingFile, {
            normalize,
            isWithinRoot,
            fileExists: hostFileExists,
        });
        const resolveModulesCartridgeOnHost = (moduleName) => (0, module_resolution_1.resolveModulesCartridge)(ts, cartridges, moduleName, {
            isWithinRoot,
            fileExists: hostFileExists,
        });
        const resolveSuperModulePath = (containingFile) => {
            const owner = ownerCartridge(containingFile);
            if (!owner)
                return undefined;
            // Slice from the slash-normalized-but-original-case form (not
            // normalize()'s case-folded one) so the candidate built below from
            // rawRoot doesn't get a folded-case tail spliced onto a real-case
            // root — case folding never changes string length, so `owner.root`'s
            // length is safe to reuse here.
            const rawSubpath = containingFile.replace(/\\/g, '/').slice(owner.root.length);
            for (let i = cartridges.indexOf(owner) + 1; i < cartridges.length; i++) {
                const candidate = cartridges[i].rawRoot + rawSubpath;
                // `subpath` is derived from an editor-supplied file path; contain the
                // next-cartridge-down candidate so a crafted path or an overlapping
                // cartridge root can't point it at a file outside that cartridge.
                if (hostFileExists(candidate) && isWithinRoot(candidate, cartridges[i].root))
                    return candidate;
            }
            return undefined;
        };
        // Inject the ambient declarations into the TS program when the project
        // contains at least one cartridge file (isCartridgeFile is false while the
        // plugin is disabled or no cartridge is known). Projects that already
        // include them via a jsconfig include glob are unaffected.
        const origGetScriptFileNames = host.getScriptFileNames.bind(host);
        host.getScriptFileNames = () => {
            const list = origGetScriptFileNames();
            if (!list.some((f) => isCartridgeFile(f)))
                return list;
            const additions = missingAmbientDeclarations(list);
            return additions.length > 0 ? [...list, ...additions] : list;
        };
        // Shared by both host resolution hooks below (the modern
        // resolveModuleNameLiterals and the legacy TS 4.x resolveModuleNames):
        // tries dw/* types, then SFCC cartridge-relative requires, then the SFRA
        // `modules` cartridge, in that priority order. Each hook only differs in
        // the shape TS expects the result wrapped in.
        const resolveOne = (text, containingFile) => {
            const dw = resolveDwModule(text);
            // Bundled dw/* types live on the real disk next to the plugin — ts.sys
            // (via fileExists) is the right probe there, not the project host.
            if (dw && fileExists(dw)) {
                return { resolvedFileName: dw, extension: ts.Extension.Dts, isExternalLibraryImport: true };
            }
            const local = resolveCartridgeModuleOnHost(text, containingFile) ?? resolveModulesCartridgeOnHost(text);
            if (!local)
                return undefined;
            return {
                resolvedFileName: local.resolved,
                extension: local.resolved.endsWith('.json') ? ts.Extension.Json : ts.Extension.Js,
                isExternalLibraryImport: false,
            };
        };
        // TS derives a file's ScriptKind from its extension and falls back to TS
        // for anything it doesn't recognize, which would parse legacy .ds scripts
        // as TypeScript. Report JS so they get the same JavaScript semantics
        // (allowJs/checkJs, JSDoc types) as their .js siblings. Returning Unknown
        // for everything else lets TS fall back to its own extension mapping.
        const origGetScriptKind = host.getScriptKind?.bind(host);
        host.getScriptKind = (fileName) => {
            if (enabled && fileName.endsWith('.ds'))
                return ts.ScriptKind.JS;
            return origGetScriptKind ? origGetScriptKind(fileName) : ts.ScriptKind.Unknown;
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
                    const resolved = resolveOne(moduleLiterals[i].text, containingFile);
                    if (!resolved)
                        return res;
                    return {
                        resolvedModule: { ...resolved, packageId: undefined },
                    };
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
                    const resolved = resolveOne(moduleNames[i], containingFile);
                    return resolved ? resolved : res;
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
            const candidates = [modulesCart.rawRoot + moduleName + '.js', modulesCart.rawRoot + moduleName + '/index.js'];
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
        // Usage-based inference (opt-in, `inferUsage`): when hover or member
        // completion hits a value the checker has given up on (typically a
        // parameter of an undocumented helper), add what call sites and the
        // value's own usage say about it. See inference/editor-hooks.
        const usageInference = (0, usage_inference_1.createUsageInferenceHooks)({
            ts,
            languageService: info.languageService,
            resolveSuperModulePath,
            log,
        });
        usageInferenceResets.add(usageInference.reset);
        const inferenceActive = (fileName) => inferUsageEnabled && isCartridgeFile(fileName);
        proxy.getQuickInfoAtPosition = (fileName, position, maximumLength) => {
            const original = info.languageService.getQuickInfoAtPosition(fileName, position, maximumLength);
            return inferenceActive(fileName) ? usageInference.decorateQuickInfo(fileName, position, original) : original;
        };
        proxy.getCompletionsAtPosition = (fileName, position, options, formattingSettings) => {
            const original = info.languageService.getCompletionsAtPosition(fileName, position, options, formattingSettings);
            return inferenceActive(fileName) ? usageInference.decorateCompletions(fileName, position, original) : original;
        };
        log(`plugin initialized (cartridges=${cartridges.length}, enabled=${enabled})`);
        return proxy;
    }
    function onConfigurationChanged(config) {
        applyConfig(config);
        // A new configuration can change what inference sees (cartridge order
        // decides `module.superModule`), so drop every cached hover and list.
        for (const reset of usageInferenceResets)
            reset();
    }
    return { create, onConfigurationChanged };
}
module.exports = init;
