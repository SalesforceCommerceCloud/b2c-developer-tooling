import {
  AuthStrategy,
  BasicAuthStrategy,
  OAuthStrategy,
  ApiKeyStrategy,
} from '@salesforce/b2c-tooling';
import { ResolvedConfig } from './loader.js';

/**
 * The Auth Resolver is the "Mix-Mode" brain.
 * It decides which authentication strategy to use based on available credentials
 * and the specific operation being performed.
 */
export class AuthResolver {
  constructor(private config: ResolvedConfig) {}

  /**
   * Resolution Strategy: WebDAV
   * Preference: Basic (Stability) -> OAuth (Fallback)
   *
   * Basic auth is preferred for WebDAV because it's simpler and more reliable
   * for file operations. OAuth is used as a fallback when credentials aren't available.
   */
  getForWebDav(): AuthStrategy {
    if (this.config.username && this.config.password) {
      return new BasicAuthStrategy(this.config.username, this.config.password);
    }

    // Fallback to OAuth if no password provided
    if (this.config.clientId && this.config.clientSecret) {
      return new OAuthStrategy({
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
      });
    }

    throw new Error(
      'No valid WebDAV credentials found. Provide either username/password or clientId/clientSecret.'
    );
  }

  /**
   * Resolution Strategy: OCAPI
   * Preference: OAuth (Required)
   *
   * OCAPI always requires OAuth authentication.
   */
  getForApi(): AuthStrategy {
    if (this.config.clientId && this.config.clientSecret) {
      return new OAuthStrategy({
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
      });
    }

    throw new Error('OCAPI requires Client ID and Secret.');
  }

  /**
   * Resolution Strategy: MRT
   * Preference: API Key
   *
   * MRT uses API key authentication.
   */
  getForMrt(): AuthStrategy {
    if (this.config.mrtApiKey) {
      return new ApiKeyStrategy(this.config.mrtApiKey);
    }

    throw new Error('MRT requires an API Key.');
  }

  /**
   * Check if WebDAV credentials are available.
   */
  hasWebDavCredentials(): boolean {
    return Boolean(
      (this.config.username && this.config.password) ||
        (this.config.clientId && this.config.clientSecret)
    );
  }

  /**
   * Check if API credentials are available.
   */
  hasApiCredentials(): boolean {
    return Boolean(this.config.clientId && this.config.clientSecret);
  }

  /**
   * Check if MRT credentials are available.
   */
  hasMrtCredentials(): boolean {
    return Boolean(this.config.mrtApiKey);
  }
}
