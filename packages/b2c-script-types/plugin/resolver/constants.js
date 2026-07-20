"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_JSON_BYTES = exports.DISCOVERY_MAX_DEPTH = exports.DISCOVERY_IGNORE = exports.BASE_CARTRIDGE_RANK = exports.CANDIDATE_EXTENSIONS = exports.SFRA_AMBIENT_MODULES = exports.PLUGIN_NAME = void 0;
// Shared types and plain-data constants for the plugin's cartridge resolution
// and discovery. Kept separate from index.ts so the plugin factory there reads
// as "what the plugin does", not "what its lookup tables are". Path constants
// that depend on the plugin's on-disk location (the bundled types dir) stay in
// index.ts, where `__dirname` points at the right place.
exports.PLUGIN_NAME = '@salesforce/b2c-script-types';
// Bare-name requires that the SFRA server.d.ts ambient declaration covers.
// We deliberately do NOT redirect these to modules/<name>.js, so TS uses the
// ambient declaration's types instead of the inferred .js types (which can't
// see the dynamic `server.middleware = ...` assignments in modules/server.js).
exports.SFRA_AMBIENT_MODULES = new Set([
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
exports.CANDIDATE_EXTENSIONS = ['.js', '.json', '/index.js'];
// Cartridges that conventionally sit at the bottom of the cartridge path when
// the user hasn't told us otherwise (no `cartridges` in dw.json/SFCC_CARTRIDGES).
// Higher rank = lower in the cartridge path. SFRA's runtime path ends with
// `app_storefront_base:modules`, so `modules` sorts strictly last.
// Mirrors BASE_CARTRIDGE_RANK in packages/b2c-vs-extension/src/cartridges/cartridge-service.ts.
exports.BASE_CARTRIDGE_RANK = {
    app_storefront_base: 1,
    modules: 2,
};
// Directories skipped during recursive .project discovery. Mirrors the ignore
// list in @salesforce/b2c-tooling-sdk's findCartridges() so plain LSP usage
// matches CLI/extension discovery.
exports.DISCOVERY_IGNORE = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.cache', 'tmp', 'temp']);
exports.DISCOVERY_MAX_DEPTH = 8;
// Hard size ceiling for workspace JSON files (dw.json, a cartridge's
// package.json) parsed on tsserver's thread. Both are attacker-controlled in a
// cloned repo, so a multi-hundred-megabyte file would be a denial-of-service
// vector (memory + parse time) — a real file is a few KB, so anything past
// 1 MiB is refused outright rather than best-effort parsed.
exports.MAX_JSON_BYTES = 1024 * 1024;
