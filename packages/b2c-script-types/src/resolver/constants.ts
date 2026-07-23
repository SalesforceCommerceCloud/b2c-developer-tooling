/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Shared types and plain-data constants for the plugin's cartridge resolution
// and discovery. Kept separate from index.ts so the plugin factory there reads
// as "what the plugin does", not "what its lookup tables are". Path constants
// that depend on the plugin's on-disk location (the bundled types dir) stay in
// index.ts, where `__dirname` points at the right place.

export const PLUGIN_NAME = '@salesforce/b2c-script-types';

export interface ConfiguredCartridge {
  name: string;
  src: string;
}

export interface PluginConfig {
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

export interface NormalizedCartridge {
  name: string;
  /**
   * Forward-slash path with trailing '/', lowercased on case-insensitive
   * filesystems — use ONLY for prefix comparisons (ownerCartridge,
   * isCartridgeFile) against another `normalize()`d path. Never build a path
   * to hand back to TypeScript from this: on a case-insensitive filesystem
   * the lowercased form usually still opens the right file by luck, but it's
   * not the file's real name, and on a case-sensitive filesystem a
   * mixed-case cartridge root would make every resolution through it fail.
   * Use `rawRoot` for that instead.
   */
  root: string;
  /** Forward-slash path with trailing '/', original case preserved — use to build any path returned to callers. */
  rawRoot: string;
}

// Bare-name requires that the SFRA server.d.ts ambient declaration covers.
// We deliberately do NOT redirect these to modules/<name>.js, so TS uses the
// ambient declaration's types instead of the inferred .js types (which can't
// see the dynamic `server.middleware = ...` assignments in modules/server.js).
export const SFRA_AMBIENT_MODULES = new Set([
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
export const CANDIDATE_EXTENSIONS = ['.js', '.json', '/index.js'];

// Cartridges that conventionally sit at the bottom of the cartridge path when
// the user hasn't told us otherwise (no `cartridges` in dw.json/SFCC_CARTRIDGES).
// Higher rank = lower in the cartridge path. SFRA's runtime path ends with
// `app_storefront_base:modules`, so `modules` sorts strictly last.
// Mirrors BASE_CARTRIDGE_RANK in packages/b2c-vs-extension/src/cartridges/cartridge-service.ts.
export const BASE_CARTRIDGE_RANK: Record<string, number> = {
  app_storefront_base: 1,
  modules: 2,
};

// Directories skipped during recursive .project discovery. Mirrors the ignore
// list in @salesforce/b2c-tooling-sdk's findCartridges() so plain LSP usage
// matches CLI/extension discovery.
export const DISCOVERY_IGNORE = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.cache', 'tmp', 'temp']);

export const DISCOVERY_MAX_DEPTH = 8;

// Hard size ceiling for workspace JSON files (dw.json, a cartridge's
// package.json) parsed on tsserver's thread. Both are attacker-controlled in a
// cloned repo, so a multi-hundred-megabyte file would be a denial-of-service
// vector (memory + parse time) — a real file is a few KB, so anything past
// 1 MiB is refused outright rather than best-effort parsed.
export const MAX_JSON_BYTES = 1024 * 1024;
