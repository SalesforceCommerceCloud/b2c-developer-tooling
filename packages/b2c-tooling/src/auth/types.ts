/**
 * The contract for any authentication mechanism.
 * Allows the consumer to be agnostic about HOW requests are authenticated.
 */
export interface AuthStrategy {
  /**
   * Performs a fetch request.
   * Implementations MUST handle header injection and 401 retries (token refresh) internally.
   */
  fetch(url: string, init?: RequestInit): Promise<Response>;

  /**
   * Optional: Helper for legacy clients (like a strict WebDAV lib) that need the raw header.
   */
  getAuthorizationHeader?(): Promise<string>;
}
