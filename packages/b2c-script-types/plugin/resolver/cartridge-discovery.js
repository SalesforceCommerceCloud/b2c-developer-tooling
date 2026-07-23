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
exports.readJsonFile = readJsonFile;
exports.discoverCartridgesOnDisk = discoverCartridgesOnDisk;
exports.readDwJsonCartridges = readDwJsonCartridges;
exports.orderCartridges = orderCartridges;
exports.parseDeclareModuleRanges = parseDeclareModuleRanges;
// Standalone helpers for finding and ordering cartridges without any of the
// plugin's mutable state. They take the `ts` namespace (and, where needed, a
// `fileExists` probe) as plain arguments and return data, so they're easy to
// read and test in isolation. index.ts wires them into the plugin's
// auto-discovery step.
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const constants_1 = require("./constants");
/**
 * Parses a workspace JSON file (dw.json, a cartridge's package.json) with a
 * hard size ceiling (see MAX_JSON_BYTES). Never throws: a missing, oversized,
 * or malformed file yields `undefined`, and callers treat that as "absent"
 * rather than failing the whole request.
 *
 * The size check always uses `fs.statSync` rather than `ts.sys.getFileSize`
 * (which is optional per the TS API and, when absent, would otherwise force
 * `ts.sys.readFile` to load the whole file before we can measure it) so the
 * DoS guard holds on every host.
 */
function readJsonFile(ts, filePath) {
    try {
        if ((0, node_fs_1.statSync)(filePath).size > constants_1.MAX_JSON_BYTES)
            return undefined;
        const content = ts.sys.readFile(filePath);
        if (content === undefined || content.length > constants_1.MAX_JSON_BYTES)
            return undefined;
        return JSON.parse(content);
    }
    catch {
        return undefined;
    }
}
/**
 * Recursively walks projectRoot for `.project` markers. Stops descending into
 * a cartridge once found (cartridges don't nest). Depth-limited to keep
 * tsserver startup snappy on huge monorepos.
 */
function discoverCartridgesOnDisk(ts, projectRoot, fileExists) {
    const found = [];
    const stack = [{ dir: projectRoot, depth: 0 }];
    while (stack.length > 0) {
        const { dir, depth } = stack.pop();
        if (fileExists(node_path_1.default.join(dir, '.project'))) {
            found.push({ name: node_path_1.default.basename(dir), src: dir });
            continue;
        }
        if (depth >= constants_1.DISCOVERY_MAX_DEPTH)
            continue;
        let subdirs = [];
        try {
            subdirs = ts.sys.getDirectories(dir);
        }
        catch {
            subdirs = [];
        }
        for (const sub of subdirs) {
            if (constants_1.DISCOVERY_IGNORE.has(sub))
                continue;
            stack.push({ dir: node_path_1.default.join(dir, sub), depth: depth + 1 });
        }
    }
    // Stable ordering for deterministic auto-discovery output.
    found.sort((a, b) => a.src.localeCompare(b.src));
    return found;
}
/**
 * Reads the top-level dw.json `cartridges` field (string with comma/colon
 * separators OR array of names) for an explicit cartridge-path order.
 * Mirrors what the b2c CLI's resolved config exposes; we don't try to honor
 * SFCC_CARTRIDGES / .env / plugins here — hosts that need that complexity
 * should push the resolved list in via configurePlugin().
 */
function readDwJsonCartridges(ts, projectRoot, fileExists) {
    const dwJsonPath = node_path_1.default.join(projectRoot, 'dw.json');
    if (!fileExists(dwJsonPath))
        return undefined;
    const parsed = readJsonFile(ts, dwJsonPath);
    const value = parsed?.cartridges;
    if (typeof value === 'string') {
        return value
            .split(/[,:]/)
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (Array.isArray(value)) {
        return value.filter((s) => typeof s === 'string' && s.length > 0);
    }
    return undefined;
}
/**
 * Applies cartridge ordering: if `configured` is set, named-first then any
 * remaining discovered cartridges in their original order; otherwise
 * discovery order with the known base cartridges sorted last.
 */
function orderCartridges(discovered, configured) {
    if (configured && configured.length > 0) {
        const byName = new Map(discovered.map((c) => [c.name, c]));
        const ordered = [];
        const seen = new Set();
        for (const name of configured) {
            const found = byName.get(name);
            if (found && !seen.has(name)) {
                ordered.push(found);
                seen.add(name);
            }
        }
        for (const c of discovered) {
            if (!seen.has(c.name))
                ordered.push(c);
        }
        return ordered;
    }
    const indexed = discovered.map((c, i) => ({ c, i }));
    // hasOwn guard so a cartridge directory literally named `__proto__` or
    // `constructor` can't read an inherited Object.prototype value here (which
    // would make the rank a non-number and corrupt the sort comparator).
    const rankOf = (name) => Object.prototype.hasOwnProperty.call(constants_1.BASE_CARTRIDGE_RANK, name) ? constants_1.BASE_CARTRIDGE_RANK[name] : 0;
    indexed.sort((a, b) => {
        const ar = rankOf(a.c.name);
        const br = rankOf(b.c.name);
        if (ar !== br)
            return ar - br;
        return a.i - b.i;
    });
    return indexed.map((x) => x.c);
}
/**
 * Finds the byte ranges of each `declare module 'X' { ... }` block in a .d.ts
 * file, so go-to-definition results landing inside the bundled SFRA
 * server.d.ts can be mapped back to the module they belong to. Linear scan
 * with brace-matching — the regex only matches the block opener, never the
 * whole (possibly huge) body.
 */
function parseDeclareModuleRanges(content) {
    const ranges = [];
    const re = /declare module ['"]([^'"]+)['"]\s*\{/g;
    let m;
    while ((m = re.exec(content)) !== null) {
        const start = m.index;
        // Walk forward from the opening brace to find the matching close.
        let depth = 1;
        let i = m.index + m[0].length;
        while (i < content.length && depth > 0) {
            const ch = content[i];
            if (ch === '{')
                depth++;
            else if (ch === '}')
                depth--;
            i++;
        }
        ranges.push({ start, end: i, module: m[1] });
    }
    return ranges;
}
