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
const TYPES_DIR = node_path_1.default.resolve(__dirname, '..', 'types');
function init({ typescript: ts }) {
    // Module-scoped state shared across all projects in the TS server. The host
    // calls onConfigurationChanged() on this module when configurePlugin() runs;
    // each project's wrapped resolver reads from these variables.
    let cartridgeRoots = [];
    let enabled = true;
    const applyConfig = (config) => {
        const c = (config ?? {});
        enabled = c.enabled !== false;
        const roots = Array.isArray(c.cartridgeRoots) ? c.cartridgeRoots : [];
        cartridgeRoots = roots
            .filter((p) => typeof p === 'string' && p.length > 0)
            .map((p) => (p.endsWith(node_path_1.default.sep) || p.endsWith('/') ? p : p + node_path_1.default.sep));
    };
    const isCartridgeFile = (filePath) => {
        if (!enabled || cartridgeRoots.length === 0)
            return false;
        for (const root of cartridgeRoots) {
            if (filePath.startsWith(root))
                return true;
        }
        return false;
    };
    const resolveDwModule = (moduleName) => {
        // require('dw/catalog/Product') -> <typesDir>/dw/catalog/Product.d.ts
        if (moduleName.startsWith('dw/')) {
            return node_path_1.default.join(TYPES_DIR, moduleName + '.d.ts');
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
                    const candidate = resolveDwModule(moduleLiterals[i].text);
                    if (!candidate || !fileExists(candidate))
                        return res;
                    return {
                        resolvedModule: {
                            resolvedFileName: candidate,
                            extension: ts.Extension.Dts,
                            isExternalLibraryImport: true,
                            packageId: undefined,
                        },
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
                    const candidate = resolveDwModule(moduleNames[i]);
                    if (!candidate || !fileExists(candidate))
                        return res;
                    return {
                        resolvedFileName: candidate,
                        extension: ts.Extension.Dts,
                        isExternalLibraryImport: true,
                    };
                });
            };
        }
        log(`plugin initialized (cartridgeRoots=${cartridgeRoots.length}, enabled=${enabled})`);
        return info.languageService;
    }
    function onConfigurationChanged(config) {
        applyConfig(config);
    }
    return { create, onConfigurationChanged };
}
module.exports = init;
