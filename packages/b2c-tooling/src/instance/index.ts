import { AuthStrategy } from '../auth/types.js';

export interface InstanceConfig {
  hostname: string;
  codeVersion?: string;
}

/**
 * Represents a specific B2C Instance.
 * Holds configuration + An authentication strategy.
 */
export class B2CInstance {
  constructor(
    public readonly config: InstanceConfig,
    public readonly auth: AuthStrategy
  ) {}

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
   */
  async webdavRequest(path: string, init?: RequestInit): Promise<Response> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const url = `https://${this.config.hostname}/on/demandware.servlet/webdav/Sites/${cleanPath}`;
    return this.auth.fetch(url, init);
  }
}
