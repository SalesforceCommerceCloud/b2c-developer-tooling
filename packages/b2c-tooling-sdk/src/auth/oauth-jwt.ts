/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * JWT Bearer OAuth authentication strategy (RFC 7523).
 *
 * Implements OAuth 2.0 JWT Bearer Token flow for Account Manager authentication.
 * Uses client certificate/key pair instead of client secret for enhanced security.
 *
 * @module auth/oauth-jwt
 */
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import type {AuthStrategy, FetchInit, AccessTokenResponse} from './types.js';
import {getLogger} from '../logging/logger.js';
import {
  getOAuthCacheKey,
  getCachedOAuthToken,
  setCachedOAuthToken,
  invalidateCachedOAuthToken,
  decodeJWT,
} from './oauth.js';
import {globalAuthMiddlewareRegistry, applyAuthRequestMiddleware, applyAuthResponseMiddleware} from './middleware.js';

/**
 * Configuration for JWT Bearer authentication.
 */
export interface JwtOAuthConfig {
  /** OAuth client ID */
  clientId: string;
  /** Path to JWT certificate file (cert.pem) */
  certPath: string;
  /** Path to JWT private key file (key.pem) */
  keyPath: string;
  /** Optional passphrase for encrypted private key */
  passphrase?: string;
  /** Account Manager hostname */
  accountManagerHost: string;
  /** OAuth scopes to request */
  scopes?: string[];
}

interface JwtPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
}

interface JwtHeader {
  alg: string;
  typ: string;
}

/**
 * OAuth 2.0 JWT Bearer authentication strategy.
 *
 * Implements RFC 7523 (JSON Web Token (JWT) Profile for OAuth 2.0 Client
 * Authentication and Authorization Grants).
 *
 * Key differences from client credentials flow:
 * - Uses public/private key pair instead of client secret
 * - Sends JWT as `client_assertion` in POST body (not Authorization header)
 * - JWT is self-signed and short-lived (60 seconds)
 *
 * @example
 * ```typescript
 * const strategy = new JwtOAuthStrategy({
 *   clientId: 'my-client-id',
 *   certPath: './cert.pem',
 *   keyPath: './key.pem',
 *   accountManagerHost: 'account.demandware.com',
 * });
 *
 * const response = await strategy.fetch('https://api.example.com/data');
 * ```
 */
export class JwtOAuthStrategy implements AuthStrategy {
  private readonly config: JwtOAuthConfig;
  private readonly logger = getLogger();
  private readonly cacheKey: string;
  private _hasHadSuccess = false;
  private readonly privateKey: crypto.KeyObject;

  constructor(config: JwtOAuthConfig) {
    this.validateConfig(config);
    this.config = config;
    this.cacheKey = getOAuthCacheKey(this.config.clientId, 'jwt', this.config.accountManagerHost, this.config.scopes);

    // Cache private key to avoid file I/O on every token request
    const keyContent = fs.readFileSync(config.keyPath, 'utf8');
    this.privateKey = crypto.createPrivateKey({
      key: keyContent,
      passphrase: config.passphrase,
    });
  }

  /**
   * Validates JWT configuration and checks that certificate/key files exist and are readable.
   */
  private validateConfig(config: JwtOAuthConfig): void {
    // Validate required fields
    if (!config.clientId) {
      throw new Error('JWT authentication requires clientId');
    }
    if (!config.certPath) {
      throw new Error('JWT authentication requires certificate path (--jwt-cert)');
    }
    if (!config.keyPath) {
      throw new Error('JWT authentication requires private key path (--jwt-key)');
    }
    if (!config.accountManagerHost) {
      throw new Error('JWT authentication requires accountManagerHost');
    }

    // Validate certificate file exists and has content
    if (!fs.existsSync(config.certPath)) {
      throw new Error(
        `JWT certificate file not found: ${config.certPath}\n` +
          `Generate a certificate pair with: openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes`,
      );
    }

    // Check certificate file is readable
    try {
      const certContent = fs.readFileSync(config.certPath, 'utf8');
      if (!certContent.includes('BEGIN CERTIFICATE')) {
        throw new Error(`Invalid certificate format in ${config.certPath}. Expected PEM format (BEGIN CERTIFICATE).`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid certificate format')) {
        throw error;
      }
      throw new Error(`Failed to read JWT certificate from ${config.certPath}: ${error}`);
    }

    // Validate key file exists
    if (!fs.existsSync(config.keyPath)) {
      throw new Error(
        `JWT private key file not found: ${config.keyPath}\n` +
          `Generate a key pair with: openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes`,
      );
    }

    // Validate private key is readable and valid
    try {
      const keyContent = fs.readFileSync(config.keyPath, 'utf8');

      // Check key format
      if (!keyContent.includes('BEGIN') || !keyContent.includes('PRIVATE KEY')) {
        throw new Error(
          `Invalid private key format in ${config.keyPath}. Expected PEM format (BEGIN PRIVATE KEY or BEGIN RSA PRIVATE KEY).`,
        );
      }

      // Validate key can be loaded (will throw if encrypted and passphrase is wrong)
      crypto.createPrivateKey({
        key: keyContent,
        passphrase: config.passphrase,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      // Specific error for wrong passphrase
      if (message.includes('bad decrypt') || message.includes('wrong passphrase') || message.includes('incorrect')) {
        throw new Error(
          `Invalid passphrase for encrypted JWT private key.\n` +
            `Use --jwt-passphrase flag or SFCC_JWT_PASSPHRASE environment variable to provide the passphrase.`,
        );
      }

      // Specific error for encrypted key without passphrase
      if (message.includes('encrypted') || message.includes('passphrase')) {
        throw new Error(
          `JWT private key is encrypted but no passphrase provided.\n` +
            `Use --jwt-passphrase flag or SFCC_JWT_PASSPHRASE environment variable.`,
        );
      }

      // Specific error for invalid format
      if (message.includes('Invalid private key format')) {
        throw error;
      }

      // Generic error
      throw new Error(`Invalid JWT private key at ${config.keyPath}: ${message}`);
    }
  }

  /**
   * Performs a fetch request with JWT Bearer authentication.
   * Automatically injects the Authorization header with a fresh access token.
   * Includes 401 retry logic and x-dw-client-id header.
   */
  async fetch(url: string, init: FetchInit = {}): Promise<Response> {
    const token = await this.getAccessToken();

    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('x-dw-client-id', this.config.clientId);

    // Pass through dispatcher for TLS/mTLS support
    let res = await fetch(url, {...init, headers} as RequestInit);

    if (res.status !== 401) {
      this._hasHadSuccess = true;
    }

    // If we previously had a successful response and now get a 401,
    // the token likely expired. Retry once after invalidating the cached token.
    // Skip retry on initial 401 to avoid retrying with bad credentials.
    if (res.status === 401 && this._hasHadSuccess) {
      this.invalidateToken();
      const newToken = await this.getAccessToken();
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(url, {...init, headers} as RequestInit);
    }

    return res;
  }

  /**
   * Returns the Authorization header value for legacy clients.
   */
  async getAuthorizationHeader(): Promise<string> {
    const token = await this.getAccessToken();
    return `Bearer ${token}`;
  }

  /**
   * Gets the decoded JWT payload.
   */
  async getJWT(): Promise<ReturnType<typeof decodeJWT>> {
    const token = await this.getAccessToken();
    return decodeJWT(token);
  }

  /**
   * Creates a new JwtOAuthStrategy with additional scopes merged in.
   * Used by clients that have specific scope requirements.
   *
   * @param additionalScopes - Scopes to add to this strategy's existing scopes
   * @returns A new JwtOAuthStrategy instance with merged scopes
   */
  withAdditionalScopes(additionalScopes: string[]): JwtOAuthStrategy {
    const mergedScopes = [...new Set([...(this.config.scopes || []), ...additionalScopes])];
    return new JwtOAuthStrategy({
      ...this.config,
      scopes: mergedScopes,
    });
  }

  /**
   * Gets the full token response including expiration and scopes.
   * Useful for commands that need to display or return token metadata.
   */
  async getTokenResponse(): Promise<AccessTokenResponse> {
    const cached = getCachedOAuthToken(this.cacheKey, this.config.scopes || []);

    if (cached) {
      this.logger.debug('[JwtOAuthStrategy] Reusing cached access token');
      return cached;
    }

    // Get new token (returns full response)
    return this.requestNewToken();
  }

  /**
   * Invalidates the cached access token, forcing re-authentication on next request.
   */
  invalidateToken(): void {
    invalidateCachedOAuthToken(this.cacheKey);
    this.logger.trace('[JwtOAuthStrategy] Token invalidated');
  }

  /**
   * Gets an access token string, using cached token if still valid.
   */
  private async getAccessToken(): Promise<string> {
    // Check global cache first
    const cached = getCachedOAuthToken(this.cacheKey, this.config.scopes || []);
    if (cached) {
      this.logger.trace('[JwtOAuthStrategy] Using cached access token from global cache');
      return cached.accessToken;
    }

    // Request new token and return just the access token string
    const tokenResponse = await this.requestNewToken();
    return tokenResponse.accessToken;
  }

  /**
   * Requests a new access token from Account Manager using JWT Bearer flow.
   * Returns the full token response and caches it.
   */
  private async requestNewToken(): Promise<AccessTokenResponse> {
    this.logger.trace('[JwtOAuthStrategy] Requesting new access token with JWT Bearer flow');

    // Generate signed JWT
    const jwt = await this.createSignedJwt();

    // Request access token using JWT Bearer flow
    const tokenUrl = `https://${this.config.accountManagerHost}/dwsso/oauth2/access_token`;

    // IMPORTANT: JWT credentials go in POST body, NOT Authorization header
    // This is the key difference from client_credentials flow
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: jwt, // ← JWT in body, not header
    });

    if (this.config.scopes && this.config.scopes.length > 0) {
      params.append('scope', this.config.scopes.join(' '));
    }

    this.logger.trace(
      {
        tokenUrl,
        clientId: this.config.clientId,
        scopes: this.config.scopes,
      },
      '[JwtOAuthStrategy] Sending JWT Bearer token request',
    );

    // Build request object for middleware
    let request = new Request(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    // Apply auth middleware (e.g., User-Agent)
    const middleware = globalAuthMiddlewareRegistry.getMiddleware();
    request = await applyAuthRequestMiddleware(request, middleware);

    let response = await fetch(request);

    // Apply auth response middleware
    response = await applyAuthResponseMiddleware(request, response, middleware);

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        },
        '[JwtOAuthStrategy] JWT authentication failed',
      );

      // Provide helpful error messages for common issues
      if (response.status === 401) {
        throw new Error(
          `JWT authentication failed (401): Invalid JWT signature or unregistered certificate. ` +
            `Ensure the certificate (${this.config.certPath}) is registered in Account Manager.`,
        );
      }
      if (response.status === 400) {
        throw new Error(`JWT authentication failed (400): ${errorText}`);
      }

      throw new Error(`JWT authentication failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = (await response.json()) as {access_token?: string; expires_in?: number};
    if (!data.access_token) {
      throw new Error('No access token in response from Account Manager');
    }

    // Calculate token expiry (default 30 minutes if not specified)
    const expiresInSeconds = data.expires_in ?? 1800;
    const expiryDate = new Date(Date.now() + expiresInSeconds * 1000);

    // Decode JWT to extract scopes (scope can be string or array)
    const decoded = decodeJWT(data.access_token);
    const scope = decoded.payload.scope as string | string[] | undefined;
    const scopes = Array.isArray(scope) ? scope : scope?.split(' ') || this.config.scopes || [];

    // Build and cache token response
    const tokenResponse: AccessTokenResponse = {
      accessToken: data.access_token,
      expires: expiryDate,
      scopes,
    };
    setCachedOAuthToken(this.cacheKey, tokenResponse);

    this.logger.trace(
      {
        expiresIn: expiresInSeconds,
        expiresAt: expiryDate.toISOString(),
        scopes,
      },
      '[JwtOAuthStrategy] Access token obtained successfully',
    );

    return tokenResponse;
  }

  /**
   * Creates and signs a JWT token for OAuth authentication.
   * Uses RS256 algorithm and Base64URL encoding per RFC 7519.
   */
  private async createSignedJwt(): Promise<string> {
    const header: JwtHeader = {
      alg: 'RS256',
      typ: 'JWT',
    };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const now = Math.floor(Date.now() / 1000);
    const tokenUrl = `https://${this.config.accountManagerHost}/dwsso/oauth2/access_token`;
    const payload: JwtPayload = {
      iss: this.config.clientId,
      sub: this.config.clientId,
      aud: tokenUrl,
      exp: now + 60,
    };
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));

    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto.sign('RSA-SHA256', Buffer.from(signatureInput), this.privateKey);
    const encodedSignature = base64UrlEncode(signature);

    const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;

    this.logger.trace(
      {
        header,
        payload: {
          ...payload,
          exp: new Date(payload.exp * 1000).toISOString(),
        },
      },
      '[JwtOAuthStrategy] Generated JWT token',
    );

    return jwt;
  }
}

/**
 * Encodes data as Base64URL (RFC 4648 Section 5).
 * Replaces +/= with URL-safe characters.
 */
function base64UrlEncode(data: string | Buffer): string {
  const buffer = typeof data === 'string' ? Buffer.from(data) : data;
  const base64 = buffer.toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
