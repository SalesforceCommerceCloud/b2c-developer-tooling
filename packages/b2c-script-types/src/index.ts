/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';

import type tsserver from 'typescript/lib/tsserverlibrary';

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
}

interface NormalizedCartridge {
  name: string;
  /** Forward-slash path with trailing '/'. Lowercased on case-insensitive filesystems. */
  root: string;
}

const PLUGIN_NAME = '@salesforce/b2c-script-types';
const TYPES_DIR = path.resolve(__dirname, '..', 'types').replace(/\\/g, '/');

// Candidate suffixes appended when resolving a SFCC-style relative require to
// a cartridge file. SFRA convention is to omit the .js extension, so .js wins
// first; .json captures the occasional resource bundle import.
const CANDIDATE_EXTENSIONS = ['.js', '.json', '/index.js'];

// Cartridges that conventionally sit at the bottom of the cartridge path when
// the user hasn't told us otherwise (no `cartridges` in dw.json/SFCC_CARTRIDGES).
// Mirrors KNOWN_BASE_CARTRIDGES in packages/b2c-vs-extension/src/cartridges/cartridge-service.ts.
const KNOWN_BASE_CARTRIDGES = new Set(['modules', 'app_storefront_base']);

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
      const ab = KNOWN_BASE_CARTRIDGES.has(a.c.name) ? 1 : 0;
      const bb = KNOWN_BASE_CARTRIDGES.has(b.c.name) ? 1 : 0;
      if (ab !== bb) return ab - bb;
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

  const ownerCartridge = (containingFile: string): NormalizedCartridge | undefined => {
    const f = normalize(containingFile);
    return cartridges.find((c) => f.startsWith(c.root));
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
          return res;
        });
      };
    }

    log(`plugin initialized (cartridges=${cartridges.length}, enabled=${enabled})`);
    return info.languageService;
  }

  function onConfigurationChanged(config: unknown) {
    applyConfig(config);
  }

  return {create, onConfigurationChanged};
}

export = init;
