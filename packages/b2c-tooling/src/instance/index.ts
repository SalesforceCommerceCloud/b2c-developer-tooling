import {AuthStrategy} from '../auth/types.js';

export interface InstanceConfig {
  hostname: string;
  codeVersion?: string;
  /** Separate hostname for WebDAV (if different from main hostname) */
  webdavHostname?: string;
}

const DEFAULT_OCAPI_VERSION = 'v24_5';

/**
 * Represents a specific B2C Instance.
 * Holds configuration + An authentication strategy.
 */
export class B2CInstance {
  constructor(
    public readonly config: InstanceConfig,
    public readonly auth: AuthStrategy,
  ) {}

  /**
   * The hostname to use for WebDAV operations.
   * Falls back to main hostname if not specified.
   */
  get webdavHost(): string {
    return this.config.webdavHostname || this.config.hostname;
  }

  /**
   * Helper to make requests relative to the instance root.
   * Delegates the actual network call to the Auth Strategy.
   */
  async request(path: string, init?: RequestInit): Promise<Response> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const url = `https://${this.config.hostname}/${cleanPath}`;
    return this.auth.fetch(url, init);
  }

  /**
   * Helper to make WebDAV requests.
   * Uses webdavHostname if configured, otherwise falls back to hostname.
   */
  async webdavRequest(path: string, init?: RequestInit): Promise<Response> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const url = `https://${this.webdavHost}/on/demandware.servlet/webdav/Sites/${cleanPath}`;
    return this.auth.fetch(url, init);
  }

  /**
   * Helper to make OCAPI Data API requests.
   * @param path - The API path (e.g., 'sites', 'code_versions')
   * @param init - Optional fetch init options
   * @param apiVersion - OCAPI version (defaults to v24_5)
   */
  async ocapiDataRequest(
    path: string,
    init?: RequestInit,
    apiVersion: string = DEFAULT_OCAPI_VERSION,
  ): Promise<Response> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const url = `https://${this.config.hostname}/s/-/dw/data/${apiVersion}/${cleanPath}`;
    return this.auth.fetch(url, init);
  }

  /**
   * Helper to make OCAPI Shop API requests.
   * @param siteId - The site ID
   * @param path - The API path
   * @param init - Optional fetch init options
   * @param apiVersion - OCAPI version (defaults to v24_5)
   */
  async ocapiShopRequest(
    siteId: string,
    path: string,
    init?: RequestInit,
    apiVersion: string = DEFAULT_OCAPI_VERSION,
  ): Promise<Response> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const url = `https://${this.config.hostname}/s/${siteId}/dw/shop/${apiVersion}/${cleanPath}`;
    return this.auth.fetch(url, init);
  }
}
