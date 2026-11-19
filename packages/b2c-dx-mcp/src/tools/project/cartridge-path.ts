/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Cartridge path resolution for the project tools. Order of precedence:
 *
 * 1. a `siteId` tool argument: that site's cartridge path read from the instance;
 * 2. `cartridges` in configuration (dw.json or SFCC_CARTRIDGES);
 * 3. the instance: the configured `siteId`, or the site whose path names the most local cartridges;
 * 4. a site import file in the project, then a guess (both handled by the SDK project index).
 *
 * Instance lookups use SCAPI with system credentials only (client credentials or JWT), so they never
 * start a browser login, and are best effort: a failure is reported and the next source is used.
 * Results are cached per tenant and site for the life of the server.
 */
import {
  createNodeFileSystemHost,
  discoverCartridges,
  parseCartridgePath,
  selectSiteCartridgePath,
} from '@salesforce/b2c-tooling-sdk/cartridges';
import {ScapiSitesBackend, type SitesBackend} from '@salesforce/b2c-tooling-sdk/operations/sites';
import type {CartridgeOrder} from '@salesforce/b2c-tooling-sdk/project-index';
import type {ScapiClientConfig} from '@salesforce/b2c-tooling-sdk';
import type {Services} from '../../services.js';

/** How long a cartridge path read from the instance is reused. */
const CACHE_TTL_MS = 10 * 60 * 1000;
/** Cartridges listed in `notOnPath` before truncating (the total is reported). */
const MAX_NOT_ON_PATH = 30;
/** Bound on one instance lookup, so a slow instance can't stall a code question. */
const LOOKUP_TIMEOUT_MS = 15_000;

interface InstanceSite {
  siteId: string;
  cartridges: string[];
}

/** Options passed to the SDK project index and security scan, and what happened on the way. */
export interface ResolvedCartridgePath {
  cartridgePath?: string[];
  cartridgePathSource?: CartridgeOrder;
  /** Site for the SDK's site import file fallback. */
  siteId?: string;
  /** Why the instance cartridge path could not be used, when a lookup was attempted. */
  instanceError?: string;
  /** Whether an instance lookup is possible with the current configuration. */
  instanceAvailable: boolean;
}

/** Reads sites and their cartridge paths from an instance. Replaceable in tests. */
export type SitesBackendFactory = (config: ScapiClientConfig) => Pick<SitesBackend, 'getCartridgePath' | 'listSites'>;

const defaultBackend: SitesBackendFactory = (config) => new ScapiSitesBackend(config);

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${LOOKUP_TIMEOUT_MS / 1000}s`)), LOOKUP_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function message(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).split('\n')[0];
}

/** Resolves and caches site cartridge paths from the instance for the project tools. */
export class CartridgePathResolver {
  private readonly cache = new Map<string, {expires: number; value: Promise<unknown>}>();

  constructor(private readonly createBackend: SitesBackendFactory = defaultBackend) {}

  /**
   * Resolves the cartridge path options for a project directory.
   *
   * @param services - Tool services (configuration and instance).
   * @param projectDirectory - Project root, used to match local cartridges against instance sites.
   * @param siteIdArg - The tool's `siteId` argument, if given.
   */
  async resolve(services: Services, projectDirectory: string, siteIdArg?: string): Promise<ResolvedCartridgePath> {
    const {cartridges: configured, siteId: configuredSite} = services.getResolvedConfig().values;
    const scapi = services.b2cInstance?.scapiClientConfig;
    const hostname = services.b2cInstance?.config.hostname;
    const instanceAvailable = Boolean(scapi);
    const fallback = (instanceError?: string): ResolvedCartridgePath => ({
      ...(configured && configured.length > 0 ? {cartridgePath: configured} : {}),
      siteId: siteIdArg ?? configuredSite,
      ...(instanceError ? {instanceError} : {}),
      instanceAvailable,
    });

    if (!siteIdArg && configured && configured.length > 0) return fallback();
    if (!scapi) {
      return fallback(
        siteIdArg
          ? 'reading the cartridge path from the instance needs SCAPI (shortCode, tenantId, and an API client with a secret)'
          : undefined,
      );
    }

    try {
      const siteId = siteIdArg ?? configuredSite;
      if (siteId) {
        const cartridges = await this.cached(`${scapi.tenantId}:${siteId}`, async () =>
          parseCartridgePath(await this.createBackend(scapi).getCartridgePath(siteId)),
        );
        return {
          cartridgePath: cartridges,
          cartridgePathSource: {source: 'instance', siteId, ...(hostname ? {hostname} : {})},
          instanceAvailable,
        };
      }

      const sites = await this.cached(`${scapi.tenantId}:*`, async () =>
        (await this.createBackend(scapi).listSites())
          .filter((s) => s.id && s.cartridges !== undefined)
          .map((s): InstanceSite => ({siteId: s.id, cartridges: parseCartridgePath(s.cartridges)})),
      );
      const local = discoverCartridges(projectDirectory, createNodeFileSystemHost()).map((c) => c.name);
      const site = selectSiteCartridgePath(sites, local);
      if (!site) return fallback('no site on the instance has these cartridges on its cartridge path');
      return {
        cartridgePath: site.cartridges,
        cartridgePathSource: {
          source: 'instance',
          siteId: site.siteId,
          ...(hostname ? {hostname} : {}),
          ...(site.alternatives.length > 0 ? {otherSites: site.alternatives} : {}),
        },
        instanceAvailable,
      };
    } catch (error) {
      return fallback(`could not read the cartridge path from the instance: ${message(error)}`);
    }
  }

  private cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && hit.expires > Date.now()) return hit.value as Promise<T>;
    const value = withTimeout(load());
    this.cache.set(key, {expires: Date.now() + CACHE_TTL_MS, value});
    // Failures aren't cached; the next call tries again.
    value.catch(() => {
      if (this.cache.get(key)?.value === value) this.cache.delete(key);
    });
    return value;
  }
}

/**
 * Where the cartridge order came from, for tool output, with a hint when the
 * order may not match the site.
 */
export function describeCartridgeOrder(
  order: CartridgeOrder | undefined,
  resolved: ResolvedCartridgePath,
): {cartridgePathSource: Record<string, unknown>; cartridgePathHint?: string} {
  const source: Record<string, unknown> = {
    ...order,
    ...(resolved.instanceError ? {instanceError: resolved.instanceError} : {}),
  };
  if (order?.notOnPath && order.notOnPath.length > MAX_NOT_ON_PATH) {
    source.notOnPath = order.notOnPath.slice(0, MAX_NOT_ON_PATH);
    source.notOnPathTotal = order.notOnPath.length;
  }
  const pickSite = resolved.instanceAvailable
    ? 'Pass siteId to read that site’s cartridge path from the instance'
    : 'Set cartridges in dw.json (or SFCC_CARTRIDGES) to the site’s cartridge path, or configure SCAPI so siteId can read it from the instance';
  const hints: string[] = [];
  switch (order?.source) {
    case 'discovery': {
      hints.push(`Guessed order; it may not match the site. ${pickSite}.`);
      break;
    }
    case 'instance': {
      if (order.otherSites?.length)
        hints.push(
          `Site ${order.siteId} was the best match for the local cartridges; other sites differ. Pass siteId to use another site.`,
        );
      break;
    }
    case 'site-file': {
      hints.push(`Order from a site import file in the project, not the instance. ${pickSite}.`);
      break;
    }
  }
  const notOnPath = order?.notOnPath?.length ?? 0;
  if (notOnPath > 0 && order?.source !== 'discovery') {
    hints.push(
      `${notOnPath} local cartridge${notOnPath === 1 ? ' is' : 's are'} not on this cartridge path (notOnPath); ` +
        'the site does not run their code. If the user asks about one, it is likely meant for another site: pass that siteId.',
    );
  }
  return {cartridgePathSource: source, ...(hints.length > 0 ? {cartridgePathHint: hints.join(' ')} : {})};
}
