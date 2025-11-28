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

/**
 * Configuration for Basic authentication (username/access-key).
 * Used primarily for WebDAV operations.
 */
export interface BasicAuthConfig {
  username: string;
  password: string;
}

/**
 * Configuration for OAuth authentication.
 * Used for OCAPI and platform API operations.
 */
export interface OAuthAuthConfig {
  clientId: string;
  clientSecret?: string;
  scopes?: string[];
  accountManagerHost?: string;
}

/**
 * Configuration for API key authentication.
 * Used for MRT and external services.
 */
export interface ApiKeyAuthConfig {
  key: string;
  headerName?: string;
}

/**
 * Combined authentication configuration.
 * B2CInstance uses this to determine which auth strategy to use for each operation type.
 */
export interface AuthConfig {
  /** Basic auth for WebDAV (username/access-key) */
  basic?: BasicAuthConfig;

  /** OAuth credentials for OCAPI/platform APIs */
  oauth?: OAuthAuthConfig;

  /** API key for MRT/external services */
  apiKey?: ApiKeyAuthConfig;
}

/**
 * Access token response structure from Account Manager
 */
export interface AccessTokenResponse {
  accessToken: string;
  expires: Date;
  scopes: string[];
}

/**
 * Decoded JWT structure
 */
export interface DecodedJWT {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
}
