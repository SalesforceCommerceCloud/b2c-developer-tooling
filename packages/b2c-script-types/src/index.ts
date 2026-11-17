/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';

import {
  CartridgeResolver,
  discoverCartridges,
  orderCartridges,
  parseCartridgePath,
  type CartridgeFileSystemHost,
} from '@salesforce/b2c-tooling-sdk/cartridges';
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
  /**
   * Extra declaration files (for example generated custom attribute types)
   * added to every project that contains cartridge files.
   */
  extraTypeFiles?: string[];
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

function init({typescript: ts}: {typescript: typeof tsserver}) {
  // Module-scoped state shared across all projects in the TS server. The host
  // calls onConfigurationChanged() on this module when configurePlugin() runs;
  // each project's wrapped resolver reads from these variables.
  let cartridges: ConfiguredCartridge[] = [];
  let enabled = true;
  let autoDiscoverEnabled = true;
  // Whether the most recent applyConfig() received an explicit cartridges list.
  // When true, we skip auto-discovery; when false, create() may auto-populate.
  let cartridgesFromHost = false;
  let extraTypeFiles: string[] = [];
  // Projects created by this plugin instance, so a configuration change can
  // ask tsserver to rebuild their programs and refresh diagnostics.
  const projects = new Set<tsserver.server.Project>();

  // All cartridge path logic (ownership, ~/ */ and modules resolution, case
  // folding on case-insensitive filesystems, Windows path normalization) lives
  // in the SDK's CartridgeResolver. tsserver canonicalizes file paths to forward
  // slashes; the resolver accepts either form and returns forward slashes.
  const caseSensitive = ts.sys.useCaseSensitiveFileNames;
  const normalize = (p: string): string => {
    const slashed = p.replace(/\\/g, '/');
    return caseSensitive ? slashed : slashed.toLowerCase();
  };

  const fileExists = (p: string): boolean => {
    try {
      return ts.sys.fileExists(p);
    } catch {
      return false;
    }
  };

  const fsHost: CartridgeFileSystemHost = {
    fileExists,
    readFile(p) {
      try {
        return ts.sys.readFile(p);
      } catch {
        return undefined;
      }
    },
    getDirectories(p) {
      try {
        return ts.sys.getDirectories(p);
      } catch {
        return [];
      }
    },
    useCaseSensitiveFileNames: caseSensitive,
  };

  let resolver = new CartridgeResolver([], fsHost);

  const setCartridges = (list: ConfiguredCartridge[]) => {
    cartridges = list;
    resolver = new CartridgeResolver(list, fsHost);
  };

  // Forward-slash src root (original case, trailing '/') of the SFRA `modules`
  // cartridge, if configured.
  const modulesSrcRoot = (): string | undefined => {
    const m = resolver.getCartridge('modules');
    if (!m) return undefined;
    const raw = m.src.replace(/\\/g, '/');
    return raw.endsWith('/') ? raw : raw + '/';
  };

  const applyConfig = (config: unknown) => {
    const c = (config ?? {}) as PluginConfig;
    enabled = c.enabled !== false;
    autoDiscoverEnabled = c.autoDiscover !== false;
    if (c.extraTypeFiles !== undefined) {
      extraTypeFiles = Array.isArray(c.extraTypeFiles)
        ? c.extraTypeFiles
            .filter((p): p is string => typeof p === 'string' && p.length > 0)
            .map((p) => p.replace(/\\/g, '/'))
        : [];
    }

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

  // Read the top-level dw.json `cartridges` field for an explicit cartridge-path
  // order. Mirrors what the b2c CLI's resolved config exposes; we don't try to
  // honor SFCC_CARTRIDGES / .env / plugins here — hosts that need that
  // complexity should push the resolved list in via configurePlugin().
  const readDwJsonCartridges = (projectRoot: string): string[] | undefined => {
    const content = fsHost.readFile(path.join(projectRoot, 'dw.json'));
    if (!content) return undefined;
    try {
      const names = parseCartridgePath((JSON.parse(content) as {cartridges?: unknown})?.cartridges);
      return names.length > 0 ? names : undefined;
    } catch {
      return undefined;
    }
  };

  const isCartridgeFile = (filePath: string): boolean => {
    if (!enabled || cartridges.length === 0) return false;
    return resolver.isCartridgeFile(filePath);
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

  // Resolve a cartridge-style require (~/, */, <cartridge>/, or a bare name in
  // the SFRA `modules` cartridge). */ walks the cartridge path left to right in
  // the order the host pushed (the Cartridges panel order), as the platform
  // does at runtime. Relative specifiers are left
  // to TypeScript, and the bare names covered by the bundled SFRA ambient
  // declarations are not redirected to modules/<name>.js, so TS keeps the
  // ambient types (it can't infer the dynamic assignments in modules/server.js).
  const resolveCartridgeRequire = (moduleName: string, containingFile: string): string | undefined =>
    resolver.resolveRequire(moduleName, containingFile, {
      relative: false,
      modulesExclude: SFRA_AMBIENT_MODULES,
    })?.path;

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
          const discovered = discoverCartridges(projectRoot, fsHost);
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
      for (const file of extraTypeFiles) {
        if (fileExists(file) && !present.has(normalize(file))) {
          additions.push(file);
          present.add(normalize(file));
        }
      }
      const hasModules = resolver.getCartridge('modules') !== undefined;
      if (hasModules && fileExists(SFRA_SERVER_DTS) && !present.has(normalize(SFRA_SERVER_DTS))) {
        additions.push(SFRA_SERVER_DTS);
      }
      return additions.length > 0 ? [...list, ...additions] : list;
    };

    // TS derives a file's ScriptKind from its extension and falls back to TS
    // for anything it doesn't recognize, which would parse legacy .ds scripts
    // as TypeScript. Report JS so they get the same JavaScript semantics
    // (allowJs/checkJs, JSDoc types) as their .js siblings. Returning Unknown
    // for everything else lets TS fall back to its own extension mapping.
    const origGetScriptKind = host.getScriptKind?.bind(host);
    host.getScriptKind = (fileName) => {
      if (enabled && fileName.endsWith('.ds')) return ts.ScriptKind.JS;
      return origGetScriptKind ? origGetScriptKind(fileName) : ts.ScriptKind.Unknown;
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
          const resolved = resolveCartridgeRequire(text, containingFile);
          if (resolved) {
            return {
              resolvedModule: {
                resolvedFileName: resolved,
                extension: resolved.endsWith('.json') ? ts.Extension.Json : ts.Extension.Js,
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
          const resolved = resolveCartridgeRequire(text, containingFile);
          if (resolved) {
            return {
              resolvedFileName: resolved,
              extension: resolved.endsWith('.json') ? ts.Extension.Json : ts.Extension.Js,
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
      const modulesRoot = modulesSrcRoot();
      if (!modulesRoot) return def;
      const moduleName = sfraModuleAtOffset(def.textSpan.start);
      if (!moduleName) return def;
      const candidates = [modulesRoot + moduleName + '.js', modulesRoot + moduleName + '/index.js'];
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

    projects.add(info.project);
    log(
      `plugin initialized (cartridges=${cartridges.length}, extraTypeFiles=${extraTypeFiles.length}, enabled=${enabled})`,
    );
    return proxy;
  }

  function onConfigurationChanged(config: unknown) {
    applyConfig(config);
    // The script file list is computed when a program is built; mark projects
    // dirty so added or removed type files take effect without a restart.
    for (const project of projects) {
      try {
        if (project.isClosed()) {
          projects.delete(project);
          continue;
        }
        (project as unknown as {markAsDirty?: () => void}).markAsDirty?.();
        project.refreshDiagnostics();
      } catch {
        // best-effort
      }
    }
  }

  return {create, onConfigurationChanged};
}

export = init;
