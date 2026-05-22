/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';

import type tsserver from 'typescript/lib/tsserverlibrary';

interface PluginConfig {
  cartridgeRoots?: string[];
  enabled?: boolean;
}

const PLUGIN_NAME = '@salesforce/b2c-script-types';
const TYPES_DIR = path.resolve(__dirname, '..', 'types');

function init({typescript: ts}: {typescript: typeof tsserver}) {
  // Module-scoped state shared across all projects in the TS server. The host
  // calls onConfigurationChanged() on this module when configurePlugin() runs;
  // each project's wrapped resolver reads from these variables.
  let cartridgeRoots: string[] = [];
  let enabled = true;

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

  const applyConfig = (config: unknown) => {
    const c = (config ?? {}) as PluginConfig;
    enabled = c.enabled !== false;
    const roots = Array.isArray(c.cartridgeRoots) ? c.cartridgeRoots : [];
    cartridgeRoots = roots
      .filter((p): p is string => typeof p === 'string' && p.length > 0)
      .map((p) => {
        const n = normalize(p);
        return n.endsWith('/') ? n : n + '/';
      });
  };

  const isCartridgeFile = (filePath: string): boolean => {
    if (!enabled || cartridgeRoots.length === 0) return false;
    const f = normalize(filePath);
    for (const root of cartridgeRoots) {
      if (f.startsWith(root)) return true;
    }
    return false;
  };

  const resolveDwModule = (moduleName: string): string | undefined => {
    // require('dw/catalog/Product') -> <typesDir>/dw/catalog/Product.d.ts
    if (moduleName.startsWith('dw/')) {
      return path.join(TYPES_DIR, moduleName + '.d.ts');
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

  function create(info: tsserver.server.PluginCreateInfo): tsserver.LanguageService {
    const log = (msg: string) => info.project.projectService.logger.info(`[${PLUGIN_NAME}] ${msg}`);

    applyConfig(info.config);

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
          const candidate = resolveDwModule(moduleLiterals[i].text);
          if (!candidate || !fileExists(candidate)) return res;
          return {
            resolvedModule: {
              resolvedFileName: candidate,
              extension: ts.Extension.Dts,
              isExternalLibraryImport: true,
              packageId: undefined,
            },
          } satisfies tsserver.ResolvedModuleWithFailedLookupLocations;
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
          const candidate = resolveDwModule(moduleNames[i]);
          if (!candidate || !fileExists(candidate)) return res;
          return {
            resolvedFileName: candidate,
            extension: ts.Extension.Dts,
            isExternalLibraryImport: true,
          } as tsserver.ResolvedModuleFull;
        });
      };
    }

    log(`plugin initialized (cartridgeRoots=${cartridgeRoots.length}, enabled=${enabled})`);
    return info.languageService;
  }

  function onConfigurationChanged(config: unknown) {
    applyConfig(config);
  }

  return {create, onConfigurationChanged};
}

export = init;
