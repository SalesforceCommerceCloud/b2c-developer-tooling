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
exports.readHookRegistrations = readHookRegistrations;
// Hook registrations: which script implements which extension point. The
// platform reads the `hooks` entry of a cartridge's package.json, which names
// a hooks.json file listing `{name, script}` pairs; each script path is
// relative to that hooks.json and, like a require(), may leave out its
// extension. Usage inference reads the registrations to treat
// `HookMgr.callHook('dw.order.calculate', 'calculate', basket)` as a call of
// the `calculate` export of every script registered for `dw.order.calculate`.
//
// Both files are project content: they are only ever parsed as JSON, and every
// path they name is contained to the cartridge that declares it.
const node_path_1 = __importDefault(require("node:path"));
// A registered script resolves like a require(): as written, then with the
// extensions the platform tries for a script.
const SCRIPT_EXTENSIONS = ['', '.js', '.ds'];
function readJson(deps, fileName) {
    try {
        const text = deps.readFile(fileName);
        return text === undefined ? undefined : JSON.parse(text);
    }
    catch {
        return undefined;
    }
}
/** `value[key]` when `value` is an object and that field holds a non-empty string. */
function stringField(value, key) {
    const field = value !== null && typeof value === 'object' ? value[key] : undefined;
    return typeof field === 'string' && field.length > 0 ? field : undefined;
}
/** `relative` resolved against the directory `dir`, when that stays inside `cartridge`. */
function containedPath(deps, cartridge, dir, relative) {
    const candidate = node_path_1.default.posix.join(dir, relative.replace(/\\/g, '/'));
    return deps.isWithinRoot(candidate, cartridge.root) ? candidate : undefined;
}
function resolveScript(deps, cartridge, dir, script) {
    const base = containedPath(deps, cartridge, dir, script);
    if (base === undefined)
        return undefined;
    return SCRIPT_EXTENSIONS.map((ext) => base + ext).find((candidate) => deps.fileExists(candidate));
}
/** The hooks.json file a cartridge's package.json names, if any. */
function hooksFileOf(deps, cartridge) {
    const hooksPath = stringField(readJson(deps, cartridge.rawRoot + 'package.json'), 'hooks');
    return hooksPath === undefined ? undefined : containedPath(deps, cartridge, cartridge.rawRoot, hooksPath);
}
/** The registrations one cartridge's package.json and hooks.json declare. */
function cartridgeRegistrations(deps, cartridge) {
    const hooksFile = hooksFileOf(deps, cartridge);
    const hooks = hooksFile === undefined ? undefined : readJson(deps, hooksFile);
    const entries = hooks !== null && typeof hooks === 'object' ? hooks.hooks : undefined;
    if (hooksFile === undefined || !Array.isArray(entries))
        return [];
    const hooksDir = node_path_1.default.posix.dirname(hooksFile);
    return entries.flatMap((entry) => {
        const extensionPoint = stringField(entry, 'name');
        const script = stringField(entry, 'script');
        const resolved = extensionPoint && script ? resolveScript(deps, cartridge, hooksDir, script) : undefined;
        return extensionPoint && resolved ? [{ extensionPoint, script: resolved }] : [];
    });
}
/** Every hook registration the configured cartridges declare. Unreadable or malformed files declare none. */
function readHookRegistrations(cartridges, deps) {
    return cartridges.flatMap((cartridge) => cartridgeRegistrations(deps, cartridge));
}
