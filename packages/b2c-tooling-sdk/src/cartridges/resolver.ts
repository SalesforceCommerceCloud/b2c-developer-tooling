/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';

import {type CartridgeFileSystemHost, toForwardSlashes} from './host.js';

/** A cartridge on the cartridge path: its name and the directory that holds it. */
export interface CartridgeLocation {
  name: string;
  src: string;
}

/**
 * How a module specifier was resolved.
 *
 * - `current-cartridge`: `~/cartridge/...`, resolved in the cartridge that owns the calling file.
 * - `cartridge-path`: `*\/cartridge/...`, resolved by walking the cartridge path left to right.
 * - `named-cartridge`: `<cartridge>/cartridge/...`, resolved in that cartridge only.
 * - `modules`: a bare specifier such as `server`, resolved in the SFRA `modules` cartridge.
 * - `relative`: `./x` or `../x`, resolved against the calling file.
 * - `super-module`: `module.superModule`, the same path in the next cartridge to the right.
 */
export type CartridgeResolutionKind =
  | 'cartridge-path'
  | 'current-cartridge'
  | 'modules'
  | 'named-cartridge'
  | 'relative'
  | 'super-module';

/** The result of resolving a module specifier to a file. */
export interface ResolvedCartridgeModule {
  /** Forward-slash path to the resolved file, in its original case. */
  path: string;
  /** Name of the cartridge the file belongs to, or undefined for a relative file outside any cartridge. */
  cartridge?: string;
  kind: CartridgeResolutionKind;
}

/** Options for {@link CartridgeResolver.resolveRequire}. */
export interface ResolveRequireOptions {
  /** Resolve bare specifiers against the SFRA `modules` cartridge. Defaults to true. */
  modules?: boolean;
  /** Bare specifiers to leave unresolved even when `modules` is enabled. */
  modulesExclude?: ReadonlySet<string>;
  /** Resolve `./` and `../` specifiers. Defaults to true. */
  relative?: boolean;
}

/**
 * File suffixes tried, in order, when resolving a specifier without an
 * extension. SFRA omits `.js`; `.json` covers resource imports; `.ds` covers
 * legacy pipeline-era scripts, which the platform resolves after `.js`.
 */
export const CARTRIDGE_MODULE_EXTENSIONS: readonly string[] = Object.freeze([
  '.js',
  '.json',
  '.ds',
  '/index.js',
  '/index.ds',
]);

const SCRIPT_EXTENSIONS = ['.js', '.ds'];
const EXPLICIT_EXTENSION = /\.(js|json|ds)$/;

interface NormalizedCartridge {
  index: number;
  location: CartridgeLocation;
  name: string;
  /** Forward-slash path with trailing '/', case-folded when the host is case-insensitive. Compare only. */
  root: string;
  /** Forward-slash path with trailing '/', original case. Use for filesystem probes and results. */
  srcRoot: string;
}

/**
 * Resolves B2C Commerce cartridge module specifiers to files, following the
 * platform's cartridge path rules.
 *
 * The resolver is synchronous and does all filesystem access through a
 * {@link CartridgeFileSystemHost}, so it can run inside the TypeScript language
 * service as well as in Node.
 *
 * @example
 * ```typescript
 * import {CartridgeResolver, createNodeFileSystemHost, orderCartridges} from '@salesforce/b2c-tooling-sdk/cartridges';
 * import {findCartridges} from '@salesforce/b2c-tooling-sdk/operations/code';
 *
 * const resolver = new CartridgeResolver(orderCartridges(findCartridges(), ['app_custom', 'app_storefront_base', 'modules']), createNodeFileSystemHost());
 * resolver.resolveRequire('*\/cartridge/scripts/middleware/csrf', '/proj/cartridges/app_custom/cartridge/controllers/Cart.js');
 * resolver.resolveSuperModule('/proj/cartridges/app_custom/cartridge/controllers/Cart.js');
 * ```
 */
export class CartridgeResolver {
  private readonly entries: NormalizedCartridge[];

  /**
   * @param cartridges - Cartridges in cartridge path order (leftmost, highest priority, first).
   * @param host - Filesystem access.
   */
  constructor(
    cartridges: readonly CartridgeLocation[],
    private readonly host: CartridgeFileSystemHost,
  ) {
    this.entries = cartridges.map((location, index) => {
      const raw = withTrailingSlash(toForwardSlashes(location.src));
      return {index, location, name: location.name, root: this.normalize(raw), srcRoot: raw};
    });
  }

  /** The cartridges this resolver was created with, in cartridge path order. */
  get cartridges(): readonly CartridgeLocation[] {
    return this.entries.map((e) => e.location);
  }

  /** Returns the cartridge with the given name, if it is on the path. */
  getCartridge(name: string): CartridgeLocation | undefined {
    return this.entries.find((e) => e.name === name)?.location;
  }

  /** Returns true when `filePath` is inside one of the cartridges. */
  isCartridgeFile(filePath: string): boolean {
    return this.ownerEntry(filePath) !== undefined;
  }

  /** Returns the cartridge that contains `filePath`, if any. */
  ownerOf(filePath: string): CartridgeLocation | undefined {
    return this.ownerEntry(filePath)?.location;
  }

  /**
   * Returns `filePath` relative to the root of its owning cartridge (forward
   * slashes, original case), for example `cartridge/controllers/Cart.js`.
   */
  relativePath(filePath: string): string | undefined {
    const owner = this.ownerEntry(filePath);
    if (!owner) return undefined;
    return toForwardSlashes(filePath).slice(owner.srcRoot.length);
  }

  /**
   * Resolves a `require()` specifier from `fromFile` to a file.
   *
   * Returns undefined for Script API modules (`dw/...`) and for specifiers
   * that don't resolve to a file in any cartridge.
   */
  resolveRequire(
    specifier: string,
    fromFile: string,
    options: ResolveRequireOptions = {},
  ): ResolvedCartridgeModule | undefined {
    if (!specifier || specifier.startsWith('dw/')) return undefined;

    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      if (options.relative === false) return undefined;
      return this.resolveRelative(specifier, fromFile);
    }

    if (specifier.startsWith('~/')) {
      const owner = this.ownerEntry(fromFile);
      if (!owner) return undefined;
      return this.probe([owner], specifier.slice(2), 'current-cartridge');
    }

    if (specifier.startsWith('*/')) {
      // The platform always walks the cartridge path left to right for */,
      // regardless of which cartridge the calling file belongs to.
      return this.probe(this.entries, specifier.slice(2), 'cartridge-path');
    }

    if (specifier.startsWith('/')) return undefined;

    const slash = specifier.indexOf('/');
    if (slash > 0) {
      const named = this.entries.find((e) => e.name === specifier.slice(0, slash));
      if (named) return this.probe([named], specifier.slice(slash + 1), 'named-cartridge');
    }

    if (options.modules === false || options.modulesExclude?.has(specifier)) return undefined;
    return this.resolveModules(specifier);
  }

  /**
   * Resolves `module.superModule` for `fromFile`: the module with the same
   * cartridge-relative path in the next cartridge to the right on the path.
   */
  resolveSuperModule(fromFile: string): ResolvedCartridgeModule | undefined {
    const owner = this.ownerEntry(fromFile);
    if (!owner) return undefined;
    const relative = toForwardSlashes(fromFile).slice(owner.srcRoot.length);
    const base = relative.replace(/\.(js|ds)$/, '');
    for (const entry of this.entries.slice(owner.index + 1)) {
      for (const ext of SCRIPT_EXTENSIONS) {
        const candidate = entry.srcRoot + base + ext;
        if (this.host.fileExists(candidate)) {
          return {path: candidate, cartridge: entry.name, kind: 'super-module'};
        }
      }
    }
    return undefined;
  }

  private normalize(p: string): string {
    const slashed = toForwardSlashes(p);
    return this.host.useCaseSensitiveFileNames ? slashed : slashed.toLowerCase();
  }

  private ownerEntry(filePath: string): NormalizedCartridge | undefined {
    const f = this.normalize(filePath);
    let best: NormalizedCartridge | undefined;
    for (const e of this.entries) {
      if (f.startsWith(e.root) && (!best || e.root.length > best.root.length)) best = e;
    }
    return best;
  }

  private probe(
    order: readonly NormalizedCartridge[],
    subpath: string,
    kind: CartridgeResolutionKind,
  ): ResolvedCartridgeModule | undefined {
    if (!subpath) return undefined;
    for (const entry of order) {
      const found = this.probeFile(entry.srcRoot + subpath);
      if (found) return {path: found, cartridge: entry.name, kind};
    }
    return undefined;
  }

  private probeFile(base: string): string | undefined {
    if (EXPLICIT_EXTENSION.test(base) && this.host.fileExists(base)) return base;
    for (const ext of CARTRIDGE_MODULE_EXTENSIONS) {
      const candidate = base + ext;
      if (this.host.fileExists(candidate)) return candidate;
    }
    return undefined;
  }

  private resolveModules(specifier: string): ResolvedCartridgeModule | undefined {
    const modules = this.entries.find((e) => e.name === 'modules');
    if (!modules) return undefined;
    const base = modules.srcRoot + specifier;
    const found = this.probeFile(base);
    if (found) return {path: found, cartridge: modules.name, kind: 'modules'};

    // package.json `main` fallback for directories without an index file.
    const pkg = this.host.readFile(base + '/package.json');
    if (!pkg) return undefined;
    try {
      const main = (JSON.parse(pkg) as {main?: unknown}).main;
      if (typeof main === 'string' && main.length > 0) {
        const resolved = toForwardSlashes(base + '/' + main.replace(/^\.\//, ''));
        if (this.host.fileExists(resolved)) return {path: resolved, cartridge: modules.name, kind: 'modules'};
      }
    } catch {
      // Malformed package.json: treat as unresolved.
    }
    return undefined;
  }

  private resolveRelative(specifier: string, fromFile: string): ResolvedCartridgeModule | undefined {
    const base = toForwardSlashes(path.posix.join(path.posix.dirname(toForwardSlashes(fromFile)), specifier));
    const found = this.probeFile(base);
    if (!found) return undefined;
    return {path: found, cartridge: this.ownerEntry(found)?.name, kind: 'relative'};
  }
}

function withTrailingSlash(p: string): string {
  return p.endsWith('/') ? p : p + '/';
}
