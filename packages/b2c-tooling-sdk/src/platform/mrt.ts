import type {AuthStrategy} from '../auth/types.js';

export interface MrtProject {
  org: string;
  project: string;
  env: string;
}

/**
 * Client for MRT (Multi-Runtime) operations.
 * Handles project-level operations that span across instances.
 */
export class MrtClient {
  constructor(
    public readonly project: MrtProject,
    public readonly auth: AuthStrategy,
  ) {}

  /**
   * Helper to make requests to the MRT API.
   */
  async request(path: string, init?: RequestInit): Promise<Response> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    // TODO: Update with actual MRT API base URL
    const url = `https://api.commercecloud.salesforce.com/mrt/${cleanPath}`;
    return this.auth.fetch(url, init);
  }
}
