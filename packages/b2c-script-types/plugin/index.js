"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_node_path3 = __toESM(require("node:path"));

// ../b2c-tooling-sdk/src/cartridges/host.ts
function toForwardSlashes(p) {
  return p.replace(/\\/g, "/");
}

// ../b2c-tooling-sdk/src/cartridges/order.ts
var BASE_CARTRIDGE_RANK = Object.freeze({
  app_storefront_base: 1,
  modules: 2
});
function parseCartridgePath(value) {
  if (typeof value === "string") {
    return value.split(/[,:]/).map((s) => s.trim()).filter(Boolean);
  }
  if (Array.isArray(value)) {
    return value.filter((s) => typeof s === "string" && s.trim().length > 0).map((s) => s.trim());
  }
  return [];
}
function orderCartridges(discovered, configured) {
  if (configured && configured.length > 0) {
    const byName = new Map(discovered.map((c) => [c.name, c]));
    const ordered = [];
    const seen = /* @__PURE__ */ new Set();
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
  const indexed = discovered.map((c, i) => ({ c, i }));
  indexed.sort((a, b) => {
    const ar = BASE_CARTRIDGE_RANK[a.c.name] ?? 0;
    const br = BASE_CARTRIDGE_RANK[b.c.name] ?? 0;
    if (ar !== br) return ar - br;
    return a.i - b.i;
  });
  return indexed.map((x) => x.c);
}

// ../b2c-tooling-sdk/src/cartridges/discover.ts
var import_node_path = __toESM(require("node:path"), 1);
var DISCOVERY_IGNORED_DIRECTORIES = /* @__PURE__ */ new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".cache",
  "tmp",
  "temp"
]);
var DEFAULT_DISCOVERY_MAX_DEPTH = 8;
function discoverCartridges(root, host, options = {}) {
  const maxDepth = options.maxDepth ?? DEFAULT_DISCOVERY_MAX_DEPTH;
  const found = [];
  const stack = [{ dir: root, depth: 0 }];
  while (stack.length > 0) {
    const { dir, depth } = stack.pop();
    if (host.fileExists(import_node_path.default.join(dir, ".project"))) {
      found.push({ name: import_node_path.default.basename(dir), src: dir });
      continue;
    }
    if (depth >= maxDepth) continue;
    for (const sub of host.getDirectories(dir)) {
      if (DISCOVERY_IGNORED_DIRECTORIES.has(sub)) continue;
      stack.push({ dir: import_node_path.default.join(dir, sub), depth: depth + 1 });
    }
  }
  found.sort((a, b) => a.src.localeCompare(b.src));
  return found;
}

// ../b2c-tooling-sdk/src/cartridges/resolver.ts
var import_node_path2 = __toESM(require("node:path"), 1);
var CARTRIDGE_MODULE_EXTENSIONS = Object.freeze([
  ".js",
  ".json",
  ".ds",
  "/index.js",
  "/index.ds"
]);
var SCRIPT_EXTENSIONS = [".js", ".ds"];
var EXPLICIT_EXTENSION = /\.(js|json|ds)$/;
var CartridgeResolver = class {
  /**
   * @param cartridges - Cartridges in cartridge path order (leftmost, highest priority, first).
   * @param host - Filesystem access.
   */
  constructor(cartridges, host) {
    this.host = host;
    this.entries = cartridges.map((location, index) => {
      const raw = withTrailingSlash(toForwardSlashes(location.src));
      return { index, location, name: location.name, root: this.normalize(raw), srcRoot: raw };
    });
  }
  entries;
  /** The cartridges this resolver was created with, in cartridge path order. */
  get cartridges() {
    return this.entries.map((e) => e.location);
  }
  /** Returns the cartridge with the given name, if it is on the path. */
  getCartridge(name) {
    return this.entries.find((e) => e.name === name)?.location;
  }
  /** Returns true when `filePath` is inside one of the cartridges. */
  isCartridgeFile(filePath) {
    return this.ownerEntry(filePath) !== void 0;
  }
  /** Returns the cartridge that contains `filePath`, if any. */
  ownerOf(filePath) {
    return this.ownerEntry(filePath)?.location;
  }
  /**
   * Returns `filePath` relative to the root of its owning cartridge (forward
   * slashes, original case), for example `cartridge/controllers/Cart.js`.
   */
  relativePath(filePath) {
    const owner = this.ownerEntry(filePath);
    if (!owner) return void 0;
    return toForwardSlashes(filePath).slice(owner.srcRoot.length);
  }
  /**
   * Resolves a `require()` specifier from `fromFile` to a file.
   *
   * Returns undefined for Script API modules (`dw/...`) and for specifiers
   * that don't resolve to a file in any cartridge.
   */
  resolveRequire(specifier, fromFile, options = {}) {
    if (!specifier || specifier.startsWith("dw/")) return void 0;
    if (specifier.startsWith("./") || specifier.startsWith("../")) {
      if (options.relative === false) return void 0;
      return this.resolveRelative(specifier, fromFile);
    }
    if (specifier.startsWith("~/")) {
      const owner = this.ownerEntry(fromFile);
      if (!owner) return void 0;
      return this.probe([owner], specifier.slice(2), "current-cartridge");
    }
    if (specifier.startsWith("*/")) {
      return this.probe(this.entries, specifier.slice(2), "cartridge-path");
    }
    if (specifier.startsWith("/")) return void 0;
    const slash = specifier.indexOf("/");
    if (slash > 0) {
      const named = this.entries.find((e) => e.name === specifier.slice(0, slash));
      if (named) return this.probe([named], specifier.slice(slash + 1), "named-cartridge");
    }
    if (options.modules === false || options.modulesExclude?.has(specifier)) return void 0;
    return this.resolveModules(specifier);
  }
  /**
   * Resolves `module.superModule` for `fromFile`: the module with the same
   * cartridge-relative path in the next cartridge to the right on the path.
   */
  resolveSuperModule(fromFile) {
    const owner = this.ownerEntry(fromFile);
    if (!owner) return void 0;
    const relative = toForwardSlashes(fromFile).slice(owner.srcRoot.length);
    const base = relative.replace(/\.(js|ds)$/, "");
    for (const entry of this.entries.slice(owner.index + 1)) {
      for (const ext of SCRIPT_EXTENSIONS) {
        const candidate = entry.srcRoot + base + ext;
        if (this.host.fileExists(candidate)) {
          return { path: candidate, cartridge: entry.name, kind: "super-module" };
        }
      }
    }
    return void 0;
  }
  normalize(p) {
    const slashed = toForwardSlashes(p);
    return this.host.useCaseSensitiveFileNames ? slashed : slashed.toLowerCase();
  }
  ownerEntry(filePath) {
    const f = this.normalize(filePath);
    let best;
    for (const e of this.entries) {
      if (f.startsWith(e.root) && (!best || e.root.length > best.root.length)) best = e;
    }
    return best;
  }
  probe(order, subpath, kind) {
    if (!subpath) return void 0;
    for (const entry of order) {
      const found = this.probeFile(entry.srcRoot + subpath);
      if (found) return { path: found, cartridge: entry.name, kind };
    }
    return void 0;
  }
  probeFile(base) {
    if (EXPLICIT_EXTENSION.test(base) && this.host.fileExists(base)) return base;
    for (const ext of CARTRIDGE_MODULE_EXTENSIONS) {
      const candidate = base + ext;
      if (this.host.fileExists(candidate)) return candidate;
    }
    return void 0;
  }
  resolveModules(specifier) {
    const modules = this.entries.find((e) => e.name === "modules");
    if (!modules) return void 0;
    const base = modules.srcRoot + specifier;
    const found = this.probeFile(base);
    if (found) return { path: found, cartridge: modules.name, kind: "modules" };
    const pkg = this.host.readFile(base + "/package.json");
    if (!pkg) return void 0;
    try {
      const main = JSON.parse(pkg).main;
      if (typeof main === "string" && main.length > 0) {
        const resolved = toForwardSlashes(base + "/" + main.replace(/^\.\//, ""));
        if (this.host.fileExists(resolved)) return { path: resolved, cartridge: modules.name, kind: "modules" };
      }
    } catch {
    }
    return void 0;
  }
  resolveRelative(specifier, fromFile) {
    const base = toForwardSlashes(import_node_path2.default.posix.join(import_node_path2.default.posix.dirname(toForwardSlashes(fromFile)), specifier));
    const found = this.probeFile(base);
    if (!found) return void 0;
    return { path: found, cartridge: this.ownerEntry(found)?.name, kind: "relative" };
  }
};
function withTrailingSlash(p) {
  return p.endsWith("/") ? p : p + "/";
}

// src/index.ts
var PLUGIN_NAME = "@salesforce/b2c-script-types";
var TYPES_DIR = import_node_path3.default.resolve(__dirname, "..", "types").replace(/\\/g, "/");
var GLOBAL_DTS = import_node_path3.default.join(TYPES_DIR, "global.d.ts").replace(/\\/g, "/");
var SFRA_SERVER_DTS = import_node_path3.default.join(TYPES_DIR, "sfra", "server.d.ts").replace(/\\/g, "/");
var SFRA_AMBIENT_MODULES = /* @__PURE__ */ new Set([
  "server",
  "server/server",
  "server/middleware",
  "server/render",
  "server/route",
  "server/request",
  "server/response",
  "server/queryString",
  "server/forms",
  "server/forms/forms"
]);
function init({ typescript: ts }) {
  let cartridges = [];
  let enabled = true;
  let autoDiscoverEnabled = true;
  let cartridgesFromHost = false;
  let extraTypeFiles = [];
  const projects = /* @__PURE__ */ new Set();
  const caseSensitive = ts.sys.useCaseSensitiveFileNames;
  const normalize = (p) => {
    const slashed = p.replace(/\\/g, "/");
    return caseSensitive ? slashed : slashed.toLowerCase();
  };
  const fileExists = (p) => {
    try {
      return ts.sys.fileExists(p);
    } catch {
      return false;
    }
  };
  const fsHost = {
    fileExists,
    readFile(p) {
      try {
        return ts.sys.readFile(p);
      } catch {
        return void 0;
      }
    },
    getDirectories(p) {
      try {
        return ts.sys.getDirectories(p);
      } catch {
        return [];
      }
    },
    useCaseSensitiveFileNames: caseSensitive
  };
  let resolver = new CartridgeResolver([], fsHost);
  const setCartridges = (list) => {
    cartridges = list;
    resolver = new CartridgeResolver(list, fsHost);
  };
  const modulesSrcRoot = () => {
    const m = resolver.getCartridge("modules");
    if (!m) return void 0;
    const raw = m.src.replace(/\\/g, "/");
    return raw.endsWith("/") ? raw : raw + "/";
  };
  const applyConfig = (config) => {
    const c = config ?? {};
    enabled = c.enabled !== false;
    autoDiscoverEnabled = c.autoDiscover !== false;
    if (c.extraTypeFiles !== void 0) {
      extraTypeFiles = Array.isArray(c.extraTypeFiles) ? c.extraTypeFiles.filter((p) => typeof p === "string" && p.length > 0).map((p) => p.replace(/\\/g, "/")) : [];
    }
    const cartridgesFieldPresent = c.cartridges !== void 0 || c.cartridgeRoots !== void 0;
    if (!cartridgesFieldPresent) return;
    const list = Array.isArray(c.cartridges) ? c.cartridges.filter((x) => Boolean(x?.name) && Boolean(x?.src)).map((x) => ({ name: x.name, src: x.src })) : Array.isArray(c.cartridgeRoots) ? c.cartridgeRoots.filter((p) => typeof p === "string" && p.length > 0).map((p) => ({ name: import_node_path3.default.basename(p), src: p })) : [];
    cartridgesFromHost = list.length > 0;
    setCartridges(list);
  };
  const readDwJsonCartridges = (projectRoot) => {
    const content = fsHost.readFile(import_node_path3.default.join(projectRoot, "dw.json"));
    if (!content) return void 0;
    try {
      const names = parseCartridgePath(JSON.parse(content)?.cartridges);
      return names.length > 0 ? names : void 0;
    } catch {
      return void 0;
    }
  };
  const isCartridgeFile = (filePath) => {
    if (!enabled || cartridges.length === 0) return false;
    return resolver.isCartridgeFile(filePath);
  };
  const resolveDwModule = (moduleName) => {
    if (moduleName.startsWith("dw/")) {
      return import_node_path3.default.join(TYPES_DIR, moduleName + ".d.ts").replace(/\\/g, "/");
    }
    return void 0;
  };
  const resolveCartridgeRequire = (moduleName, containingFile) => resolver.resolveRequire(moduleName, containingFile, {
    relative: false,
    modulesExclude: SFRA_AMBIENT_MODULES
  })?.path;
  let sfraDtsRanges;
  const sfraModuleAtOffset = (offset) => {
    if (!sfraDtsRanges) {
      const content = fileExists(SFRA_SERVER_DTS) ? ts.sys.readFile(SFRA_SERVER_DTS) : void 0;
      sfraDtsRanges = content ? parseDeclareModuleRanges(content) : [];
    }
    for (const r of sfraDtsRanges) {
      if (offset >= r.start && offset <= r.end) return r.module;
    }
    return void 0;
  };
  const parseDeclareModuleRanges = (content) => {
    const ranges = [];
    const re = /declare module ['"]([^'"]+)['"]\s*\{/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      const start = m.index;
      let depth = 1;
      let i = m.index + m[0].length;
      while (i < content.length && depth > 0) {
        const ch = content[i];
        if (ch === "{") depth++;
        else if (ch === "}") depth--;
        i++;
      }
      ranges.push({ start, end: i, module: m[1] });
    }
    return ranges;
  };
  function create(info) {
    const log = (msg) => info.project.projectService.logger.info(`[${PLUGIN_NAME}] ${msg}`);
    applyConfig(info.config);
    if (enabled && autoDiscoverEnabled && !cartridgesFromHost && cartridges.length === 0) {
      const projectRoot = info.project.getCurrentDirectory();
      if (projectRoot) {
        try {
          const discovered = discoverCartridges(projectRoot, fsHost);
          const configured = readDwJsonCartridges(projectRoot);
          const ordered = orderCartridges(discovered, configured);
          setCartridges(ordered);
          log(
            `auto-discovered ${cartridges.length} cartridge(s) from ${projectRoot}` + (configured ? ` (ordered by dw.json cartridges)` : "")
          );
        } catch (e) {
          log(`auto-discovery failed: ${e.message}`);
        }
      }
    }
    const host = info.languageServiceHost;
    const origGetScriptFileNames = host.getScriptFileNames.bind(host);
    host.getScriptFileNames = () => {
      const list = origGetScriptFileNames();
      if (!enabled || cartridges.length === 0) return list;
      if (!list.some((f) => isCartridgeFile(f))) return list;
      const additions = [];
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
      const hasModules = resolver.getCartridge("modules") !== void 0;
      if (hasModules && fileExists(SFRA_SERVER_DTS) && !present.has(normalize(SFRA_SERVER_DTS))) {
        additions.push(SFRA_SERVER_DTS);
      }
      return additions.length > 0 ? [...list, ...additions] : list;
    };
    const origGetScriptKind = host.getScriptKind?.bind(host);
    host.getScriptKind = (fileName) => {
      if (enabled && fileName.endsWith(".ds")) return ts.ScriptKind.JS;
      return origGetScriptKind ? origGetScriptKind(fileName) : ts.ScriptKind.Unknown;
    };
    const origResolveModuleNameLiterals = host.resolveModuleNameLiterals?.bind(host);
    if (origResolveModuleNameLiterals) {
      host.resolveModuleNameLiterals = (moduleLiterals, containingFile, redirectedReference, options, containingSourceFile, reusedNames) => {
        const original = origResolveModuleNameLiterals(
          moduleLiterals,
          containingFile,
          redirectedReference,
          options,
          containingSourceFile,
          reusedNames
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
                packageId: void 0
              }
            };
          }
          const resolved = resolveCartridgeRequire(text, containingFile);
          if (resolved) {
            return {
              resolvedModule: {
                resolvedFileName: resolved,
                extension: resolved.endsWith(".json") ? ts.Extension.Json : ts.Extension.Js,
                isExternalLibraryImport: false,
                packageId: void 0
              }
            };
          }
          return res;
        });
      };
    }
    const origResolveModuleNames = host.resolveModuleNames?.bind(host);
    if (origResolveModuleNames) {
      host.resolveModuleNames = (moduleNames, containingFile, reusedNames, redirectedReference, options, containingSourceFile) => {
        const original = origResolveModuleNames(
          moduleNames,
          containingFile,
          reusedNames,
          redirectedReference,
          options,
          containingSourceFile
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
              isExternalLibraryImport: true
            };
          }
          const resolved = resolveCartridgeRequire(text, containingFile);
          if (resolved) {
            return {
              resolvedFileName: resolved,
              extension: resolved.endsWith(".json") ? ts.Extension.Json : ts.Extension.Js,
              isExternalLibraryImport: false
            };
          }
          return res;
        });
      };
    }
    const proxy = /* @__PURE__ */ Object.create(null);
    for (const k of Object.keys(info.languageService)) {
      const fn = info.languageService[k];
      proxy[k] = (...args) => fn.apply(info.languageService, args);
    }
    const remapDefinition = (def) => {
      if (cartridges.length === 0) return def;
      if (normalize(def.fileName) !== normalize(SFRA_SERVER_DTS)) return def;
      const modulesRoot = modulesSrcRoot();
      if (!modulesRoot) return def;
      const moduleName = sfraModuleAtOffset(def.textSpan.start);
      if (!moduleName) return def;
      const candidates = [modulesRoot + moduleName + ".js", modulesRoot + moduleName + "/index.js"];
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
      if (!result?.definitions) return result;
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
    projects.add(info.project);
    log(
      `plugin initialized (cartridges=${cartridges.length}, extraTypeFiles=${extraTypeFiles.length}, enabled=${enabled})`
    );
    return proxy;
  }
  function onConfigurationChanged(config) {
    applyConfig(config);
    for (const project of projects) {
      try {
        if (project.isClosed()) {
          projects.delete(project);
          continue;
        }
        project.markAsDirty?.();
        project.refreshDiagnostics();
      } catch {
      }
    }
  }
  return { create, onConfigurationChanged };
}
module.exports = init;
