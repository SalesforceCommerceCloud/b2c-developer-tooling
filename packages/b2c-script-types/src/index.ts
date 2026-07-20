/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';

import type tsserver from 'typescript/lib/tsserverlibrary';

import {
  createInferenceContext,
  describeTypes,
  findEnclosingPropertyAccess,
  getNodeAtPosition,
  inferTypeForNode,
  isAnyType,
  typesToCompletionEntries,
} from './usage-inference';

interface ConfiguredCartridge {
  name: string;
  src: string;
}

interface PluginConfig {
  /** @deprecated use cartridges; kept for backward compatibility */
  cartridgeRoots?: string[];
  cartridges?: ConfiguredCartridge[];
  enabled?: boolean;
  /**
   * Disable filesystem auto-discovery when no cartridges are pushed in. Defaults
   * to false — i.e. auto-discovery runs unless the host explicitly opts out.
   */
  autoDiscover?: boolean;
  /**
   * Opt-in, heuristic: when a parameter or return value has been widened to
   * `any` (typically an undocumented helper function with no JSDoc), infer a
   * better type from how it's actually called/used elsewhere in the project
   * and surface it in hover text and member completions. Off by default.
   */
  inferUsage?: boolean;
}

interface NormalizedCartridge {
  name: string;
  /** Forward-slash path with trailing '/'. Lowercased on case-insensitive filesystems. */
  root: string;
}

const PLUGIN_NAME = '@salesforce/b2c-script-types';
const TYPES_DIR = path.resolve(__dirname, '..', 'types').replace(/\\/g, '/');
// Ambient declarations for SFCC globals (`session`, `request`, `response`,
// `customer`, `empty(...)`, the `dw.*` namespace alias, etc.). The plugin
// injects this into the TS program's script file list so the `declare global`
// block takes effect in projects that don't have a jsconfig.json including it.
const GLOBAL_DTS = path.join(TYPES_DIR, 'global.d.ts').replace(/\\/g, '/');
// Ambient typings for the SFRA `modules` cartridge — types for `require('server')`
// and friends so cartridge code works under `checkJs: true` despite the dynamic
// property assignments in modules/server.js that TS can't infer.
const SFRA_SERVER_DTS = path.join(TYPES_DIR, 'sfra', 'server.d.ts').replace(/\\/g, '/');
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
const BASE_CARTRIDGE_RANK: Record<string, number> = {
  app_storefront_base: 1,
  modules: 2,
};

// Directories skipped during recursive .project discovery. Mirrors the ignore
// list in @salesforce/b2c-tooling-sdk's findCartridges() so plain LSP usage
// matches CLI/extension discovery.
const DISCOVERY_IGNORE = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.cache', 'tmp', 'temp']);

const DISCOVERY_MAX_DEPTH = 8;

function init({typescript: ts}: {typescript: typeof tsserver}) {
  // Module-scoped state shared across all projects in the TS server. The host
  // calls onConfigurationChanged() on this module when configurePlugin() runs;
  // each project's wrapped resolver reads from these variables.
  let cartridges: NormalizedCartridge[] = [];
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
  const normalize = (p: string): string => {
    const slashed = p.replace(/\\/g, '/');
    return caseSensitive ? slashed : slashed.toLowerCase();
  };

  const setCartridges = (list: ConfiguredCartridge[]) => {
    cartridges = list.map(({name, src}) => {
      const n = normalize(src);
      return {name, root: n.endsWith('/') ? n : n + '/'};
    });
  };

  const applyConfig = (config: unknown) => {
    const c = (config ?? {}) as PluginConfig;
    enabled = c.enabled !== false;
    autoDiscoverEnabled = c.autoDiscover !== false;
    inferUsageEnabled = c.inferUsage === true;

    // Only touch the cartridge list if the host explicitly provided one.
    // This lets onConfigurationChanged() update flags (enabled, autoDiscover)
    // without wiping a previously auto-discovered list.
    const cartridgesFieldPresent = c.cartridges !== undefined || c.cartridgeRoots !== undefined;
    if (!cartridgesFieldPresent) return;

    // Prefer the structured cartridges list. Fall back to legacy cartridgeRoots
    // (paths only, no name) so older extension builds keep working.
    const list = Array.isArray(c.cartridges)
      ? c.cartridges
          .filter((x): x is ConfiguredCartridge => Boolean(x?.name) && Boolean(x?.src))
          .map((x) => ({name: x.name, src: x.src}))
      : Array.isArray(c.cartridgeRoots)
        ? c.cartridgeRoots
            .filter((p): p is string => typeof p === 'string' && p.length > 0)
            .map((p) => ({name: path.basename(p), src: p}))
        : [];

    cartridgesFromHost = list.length > 0;
    setCartridges(list);
  };

  // Recursively walk projectRoot for `.project` markers. Stops descending into
  // a cartridge once found (cartridges don't nest). Depth-limited to keep
  // tsserver startup snappy on huge monorepos.
  const discoverCartridgesOnDisk = (projectRoot: string): ConfiguredCartridge[] => {
    const found: ConfiguredCartridge[] = [];
    const stack: {dir: string; depth: number}[] = [{dir: projectRoot, depth: 0}];
    while (stack.length > 0) {
      const {dir, depth} = stack.pop()!;
      if (fileExists(path.join(dir, '.project'))) {
        found.push({name: path.basename(dir), src: dir});
        continue;
      }
      if (depth >= DISCOVERY_MAX_DEPTH) continue;
      let subdirs: readonly string[] = [];
      try {
        subdirs = ts.sys.getDirectories(dir);
      } catch {
        subdirs = [];
      }
      for (const sub of subdirs) {
        if (DISCOVERY_IGNORE.has(sub)) continue;
        stack.push({dir: path.join(dir, sub), depth: depth + 1});
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
  const readDwJsonCartridges = (projectRoot: string): string[] | undefined => {
    const dwJsonPath = path.join(projectRoot, 'dw.json');
    if (!fileExists(dwJsonPath)) return undefined;
    let content: string | undefined;
    try {
      content = ts.sys.readFile(dwJsonPath);
    } catch {
      return undefined;
    }
    if (!content) return undefined;
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return undefined;
    }
    const value = (parsed as {cartridges?: unknown})?.cartridges;
    if (typeof value === 'string') {
      return value
        .split(/[,:]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (Array.isArray(value)) {
      return value.filter((s): s is string => typeof s === 'string' && s.length > 0);
    }
    return undefined;
  };

  // Apply cartridge ordering: if `configured` is set, named-first then any
  // remaining discovered cartridges in their original order; otherwise
  // discovery order with KNOWN_BASE_CARTRIDGES sorted last.
  const orderCartridges = (
    discovered: ConfiguredCartridge[],
    configured: string[] | undefined,
  ): ConfiguredCartridge[] => {
    if (configured && configured.length > 0) {
      const byName = new Map(discovered.map((c) => [c.name, c]));
      const ordered: ConfiguredCartridge[] = [];
      const seen = new Set<string>();
      for (const name of configured) {
        const found = byName.get(name);
        if (found && !seen.has(name)) {
          ordered.push(found);
          seen.add(name);
        }
      }
      for (const c of discovered) {
        if (!seen.has(c.name)) ordered.push(c);
      }
      return ordered;
    }
    const indexed = discovered.map((c, i) => ({c, i}));
    indexed.sort((a, b) => {
      const ar = BASE_CARTRIDGE_RANK[a.c.name] ?? 0;
      const br = BASE_CARTRIDGE_RANK[b.c.name] ?? 0;
      if (ar !== br) return ar - br;
      return a.i - b.i;
    });
    return indexed.map((x) => x.c);
  };

  const isCartridgeFile = (filePath: string): boolean => {
    if (!enabled || cartridges.length === 0) return false;
    const f = normalize(filePath);
    for (const c of cartridges) {
      if (f.startsWith(c.root)) return true;
    }
    return false;
  };

  const resolveDwModule = (moduleName: string): string | undefined => {
    // require('dw/catalog/Product') -> <typesDir>/dw/catalog/Product.d.ts.
    // tsserver keys its internal file map on forward-slash paths, so normalize
    // the return value here — path.join produces backslashes on Windows.
    if (moduleName.startsWith('dw/')) {
      return path.join(TYPES_DIR, moduleName + '.d.ts').replace(/\\/g, '/');
    }
    return undefined;
  };

  const fileExists = (p: string): boolean => {
    try {
      return ts.sys.fileExists(p);
    } catch {
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
  const resolveCartridgeModule = (
    moduleName: string,
    containingFile: string,
  ): {resolved: string; source: string} | undefined => {
    if (cartridges.length === 0) return undefined;

    let subpath: string | undefined;
    let order: NormalizedCartridge[] | undefined;

    if (moduleName.startsWith('~/')) {
      // ~ is the current cartridge — restrict to the cartridge that owns the
      // calling file. If the containing file isn't inside any known cartridge,
      // there is no current cartridge, so the require can't be resolved.
      subpath = moduleName.slice(2);
      const owner = ownerCartridge(containingFile);
      if (!owner) return undefined;
      order = [owner];
    } else if (moduleName.startsWith('*/')) {
      // * walks the cartridge path. Owner-first matches SFRA-style overrides
      // (the requesting cartridge wins before falling through to others).
      subpath = moduleName.slice(2);
      order = reorderForContainingFile(cartridges, containingFile);
    } else {
      // <cartridgeName>/cartridge/... — only treat as a cartridge require if the
      // first segment matches a known cartridge name. Otherwise pass through so
      // node_modules and other resolutions still work.
      const slash = moduleName.indexOf('/');
      if (slash <= 0) return undefined;
      const head = moduleName.slice(0, slash);
      const known = cartridges.find((c) => c.name === head);
      if (!known) return undefined;
      subpath = moduleName.slice(slash + 1);
      order = [known];
    }

    if (!subpath) return undefined;

    for (const c of order) {
      const baseAbs = c.root + subpath;
      for (const ext of CANDIDATE_EXTENSIONS) {
        const candidate = baseAbs + ext;
        if (fileExists(candidate)) {
          return {resolved: candidate, source: c.name};
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
  const resolveModulesCartridge = (moduleName: string): {resolved: string; source: string} | undefined => {
    if (cartridges.length === 0) return undefined;
    if (moduleName.startsWith('.') || moduleName.startsWith('/')) return undefined;
    if (moduleName.startsWith('~/') || moduleName.startsWith('*/') || moduleName.startsWith('dw/')) return undefined;
    // Let the bundled SFRA ambient declarations win for these names. If we
    // resolved them to the .js file here, TS would infer types from the JS
    // (which misses dynamic property assignments in modules/server.js) and
    // ignore the ambient `declare module 'server' { ... }` shape.
    if (SFRA_AMBIENT_MODULES.has(moduleName)) return undefined;
    const modulesCart = cartridges.find((c) => c.name === 'modules');
    if (!modulesCart) return undefined;

    const baseAbs = modulesCart.root + moduleName;
    for (const ext of CANDIDATE_EXTENSIONS) {
      const candidate = baseAbs + ext;
      if (fileExists(candidate)) {
        return {resolved: candidate, source: modulesCart.name};
      }
    }

    // package.json `main` fallback for directories without an index.js.
    const pkgPath = baseAbs + '/package.json';
    if (fileExists(pkgPath)) {
      try {
        const content = ts.sys.readFile(pkgPath);
        if (content) {
          const main = (JSON.parse(content) as {main?: string}).main;
          if (typeof main === 'string' && main.length > 0) {
            const resolved = (modulesCart.root + moduleName + '/' + main.replace(/^\.\//, '')).replace(/\\/g, '/');
            if (fileExists(resolved)) {
              return {resolved, source: modulesCart.name};
            }
          }
        }
      } catch {
        // best-effort
      }
    }
    return undefined;
  };

  const ownerCartridge = (containingFile: string): NormalizedCartridge | undefined => {
    const f = normalize(containingFile);
    return cartridges.find((c) => f.startsWith(c.root));
  };

  // Cached map of byte ranges in types/sfra/server.d.ts to the SFRA module
  // declared by their enclosing `declare module 'X' { ... }` block. Used to
  // map go-to-definition results back to the matching modules/<X>.js file.
  let sfraDtsRanges: Array<{start: number; end: number; module: string}> | undefined;
  const sfraModuleAtOffset = (offset: number): string | undefined => {
    if (!sfraDtsRanges) {
      const content = fileExists(SFRA_SERVER_DTS) ? ts.sys.readFile(SFRA_SERVER_DTS) : undefined;
      sfraDtsRanges = content ? parseDeclareModuleRanges(content) : [];
    }
    for (const r of sfraDtsRanges) {
      if (offset >= r.start && offset <= r.end) return r.module;
    }
    return undefined;
  };
  const parseDeclareModuleRanges = (content: string): Array<{start: number; end: number; module: string}> => {
    const ranges: Array<{start: number; end: number; module: string}> = [];
    const re = /declare module ['"]([^'"]+)['"]\s*\{/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      const start = m.index;
      // Walk forward from the opening brace to find the matching close.
      let depth = 1;
      let i = m.index + m[0].length;
      while (i < content.length && depth > 0) {
        const ch = content[i];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        i++;
      }
      ranges.push({start, end: i, module: m[1]});
    }
    return ranges;
  };

  const reorderForContainingFile = (list: NormalizedCartridge[], containingFile: string): NormalizedCartridge[] => {
    const owner = ownerCartridge(containingFile);
    if (!owner) return list;
    return [owner, ...list.filter((c) => c !== owner)];
  };

  function create(info: tsserver.server.PluginCreateInfo): tsserver.LanguageService {
    const log = (msg: string) => info.project.projectService.logger.info(`[${PLUGIN_NAME}] ${msg}`);

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
          log(
            `auto-discovered ${cartridges.length} cartridge(s) from ${projectRoot}` +
              (configured ? ` (ordered by dw.json cartridges)` : ''),
          );
        } catch (e) {
          log(`auto-discovery failed: ${(e as Error).message}`);
        }
      }
    }

    const host = info.languageServiceHost;

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
      if (!enabled || cartridges.length === 0) return list;
      if (!list.some((f) => isCartridgeFile(f))) return list;
      const additions: string[] = [];
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
      host.resolveModuleNameLiterals = (
        moduleLiterals,
        containingFile,
        redirectedReference,
        options,
        containingSourceFile,
        reusedNames,
      ) => {
        const original = origResolveModuleNameLiterals(
          moduleLiterals,
          containingFile,
          redirectedReference,
          options,
          containingSourceFile,
          reusedNames,
        );
        if (!isCartridgeFile(containingFile)) return original;
        return original.map((res, i) => {
          if (res.resolvedModule) return res;
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
            } satisfies tsserver.ResolvedModuleWithFailedLookupLocations;
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
            } satisfies tsserver.ResolvedModuleWithFailedLookupLocations;
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
            } satisfies tsserver.ResolvedModuleWithFailedLookupLocations;
          }
          return res;
        });
      };
    }

    // Legacy TS 4.x path
    const origResolveModuleNames = host.resolveModuleNames?.bind(host);
    if (origResolveModuleNames) {
      host.resolveModuleNames = (
        moduleNames,
        containingFile,
        reusedNames,
        redirectedReference,
        options,
        containingSourceFile,
      ) => {
        const original = origResolveModuleNames(
          moduleNames,
          containingFile,
          reusedNames,
          redirectedReference,
          options,
          containingSourceFile,
        );
        if (!isCartridgeFile(containingFile)) return original;
        return original.map((res, i) => {
          if (res) return res;
          const text = moduleNames[i];
          const dw = resolveDwModule(text);
          if (dw && fileExists(dw)) {
            return {
              resolvedFileName: dw,
              extension: ts.Extension.Dts,
              isExternalLibraryImport: true,
            } as tsserver.ResolvedModuleFull;
          }
          const cart = resolveCartridgeModule(text, containingFile);
          if (cart) {
            return {
              resolvedFileName: cart.resolved,
              extension: cart.resolved.endsWith('.json') ? ts.Extension.Json : ts.Extension.Js,
              isExternalLibraryImport: false,
            } as tsserver.ResolvedModuleFull;
          }
          const mod = resolveModulesCartridge(text);
          if (mod) {
            return {
              resolvedFileName: mod.resolved,
              extension: mod.resolved.endsWith('.json') ? ts.Extension.Json : ts.Extension.Js,
              isExternalLibraryImport: false,
            } as tsserver.ResolvedModuleFull;
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
    const proxy = Object.create(null) as tsserver.LanguageService;
    for (const k of Object.keys(info.languageService) as Array<keyof tsserver.LanguageService>) {
      const fn = info.languageService[k];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (proxy as any)[k] = (...args: unknown[]) =>
        (fn as (...a: unknown[]) => unknown).apply(info.languageService, args);
    }

    const remapDefinition = <T extends {fileName: string; textSpan: {start: number; length: number}}>(def: T): T => {
      if (cartridges.length === 0) return def;
      if (normalize(def.fileName) !== normalize(SFRA_SERVER_DTS)) return def;
      const modulesCart = cartridges.find((c) => c.name === 'modules');
      if (!modulesCart) return def;
      const moduleName = sfraModuleAtOffset(def.textSpan.start);
      if (!moduleName) return def;
      const candidates = [modulesCart.root + moduleName + '.js', modulesCart.root + moduleName + '/index.js'];
      for (const candidate of candidates) {
        if (fileExists(candidate)) {
          return {...def, fileName: candidate, textSpan: {start: 0, length: 0}};
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
      if (!result?.definitions) return result;
      return {...result, definitions: result.definitions.map(remapDefinition)};
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
    // Cached per (file, node position), invalidated on project version change
    // so cost is bounded to "recompute only what's under the cursor, only
    // when the program actually changed" rather than a whole-program scan.
    const inferenceCache = new Map<string, {projectVersion: string; types: tsserver.Type[]}>();
    const getCachedInference = (cacheKey: string, compute: () => tsserver.Type[]): tsserver.Type[] => {
      const projectVersion = info.project.getProjectVersion();
      const cached = inferenceCache.get(cacheKey);
      if (cached && cached.projectVersion === projectVersion) return cached.types;
      const types = compute();
      inferenceCache.set(cacheKey, {projectVersion, types});
      return types;
    };

    proxy.getQuickInfoAtPosition = (fileName, position, maximumLength) => {
      const original = info.languageService.getQuickInfoAtPosition(fileName, position, maximumLength);
      if (!enabled || !inferUsageEnabled || !isCartridgeFile(fileName) || !original) return original;
      try {
        const program = info.languageService.getProgram();
        const sourceFile = program?.getSourceFile(fileName);
        if (!program || !sourceFile) return original;
        const node = getNodeAtPosition(sourceFile, ts, position);
        if (!node || !ts.isIdentifier(node)) return original;
        const checker = program.getTypeChecker();
        if (!isAnyType(ts, checker.getTypeAtLocation(node))) return original;
        const types = getCachedInference(`hover:${fileName}:${node.getStart(sourceFile)}`, () => {
          const ctx = createInferenceContext(ts, info.languageService);
          return ctx ? inferTypeForNode(ctx, node) : [];
        });
        if (types.length === 0) return original;
        const note: tsserver.SymbolDisplayPart = {
          text: `\n\nInferred from usage: ${describeTypes(checker, types)}`,
          kind: 'text',
        };
        return {...original, documentation: [...(original.documentation ?? []), note]};
      } catch (e) {
        log(`inferUsage hover failed: ${(e as Error).message}`);
        return original;
      }
    };

    proxy.getCompletionsAtPosition = (fileName, position, options, formattingSettings) => {
      const original = info.languageService.getCompletionsAtPosition(fileName, position, options, formattingSettings);
      if (!enabled || !inferUsageEnabled || !isCartridgeFile(fileName)) return original;
      try {
        const program = info.languageService.getProgram();
        const sourceFile = program?.getSourceFile(fileName);
        if (!program || !sourceFile) return original;
        const node = getNodeAtPosition(sourceFile, ts, Math.max(position - 1, 0));
        if (!node) return original;
        const propAccess = findEnclosingPropertyAccess(node, ts);
        if (!propAccess || !ts.isIdentifier(propAccess.expression)) return original;
        const checker = program.getTypeChecker();
        if (!isAnyType(ts, checker.getTypeAtLocation(propAccess.expression))) return original;
        const baseNode = propAccess.expression;
        const types = getCachedInference(`completions:${fileName}:${baseNode.getStart(sourceFile)}`, () => {
          const ctx = createInferenceContext(ts, info.languageService);
          return ctx ? inferTypeForNode(ctx, baseNode) : [];
        });
        if (types.length === 0) return original;
        const inferredEntries = typesToCompletionEntries(ts, checker, types);
        if (inferredEntries.length === 0) return original;
        const existingNames = new Set((original?.entries ?? []).map((e) => e.name));
        const merged = [...(original?.entries ?? []), ...inferredEntries.filter((e) => !existingNames.has(e.name))];
        return {
          isGlobalCompletion: original?.isGlobalCompletion ?? false,
          isMemberCompletion: true,
          isNewIdentifierLocation: original?.isNewIdentifierLocation ?? false,
          entries: merged,
        };
      } catch (e) {
        log(`inferUsage completions failed: ${(e as Error).message}`);
        return original;
      }
    };

    log(`plugin initialized (cartridges=${cartridges.length}, enabled=${enabled})`);
    return proxy;
  }

  function onConfigurationChanged(config: unknown) {
    applyConfig(config);
  }

  return {create, onConfigurationChanged};
}

export = init;
