/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * SLAS shopper token retrieval.
 *
 * Supports guest and registered customer flows for both public (PKCE) and
 * private (client_credentials) SLAS clients.
 *
 * @module slas/token
 */
import {encodeBasicClientCredentials} from '../auth/client-credentials.js';
import {createSlasShopperClient} from '../clients/slas-shopper.js';
import {getLogger} from '../logging/logger.js';
import {generateCodeChallenge, generateCodeVerifier} from './pkce.js';
import type {SlasTokenConfig, SlasTokenResponse, SlasRegisteredLoginConfig} from './types.js';

/**
 * Parses an authorization code and usid from a redirect Location header.
 *
 * @throws Error if the redirect does not contain the expected code parameter
 */
function parseRedirectCode(locationHeader: string): {code: string; usid: string} {
  const url = new URL(locationHeader, 'http://localhost');
  const code = url.searchParams.get('code');
  const usid = url.searchParams.get('usid') ?? '';

  if (!code) {
    throw new Error(`SLAS redirect did not contain authorization code. Location: ${locationHeader}`);
  }

  return {code, usid};
}

/**
 * Checks a SLAS response for errors and throws with details.
 */
function checkResponse(response: Response, context: string, error: unknown): void {
  if (response.ok) return;

  const body = typeof error === 'string' ? error : error ? JSON.stringify(error) : '';
  throw new Error(`SLAS ${context} failed (HTTP ${response.status})${body ? ` — ${body}` : ''}`);
}

/**
 * Retrieves a guest shopper access token from SLAS.
 *
 * - **Private client** (slasClientSecret set): Uses `client_credentials` grant.
 * - **Public client** (no secret): Uses PKCE authorization code flow with `hint=guest`.
 *
 * @param config - SLAS token configuration
 * @returns The token response including access_token and refresh_token
 */
export async function getGuestToken(config: SlasTokenConfig): Promise<SlasTokenResponse> {
  const logger = getLogger();

  if (config.slasClientSecret) {
    return getPrivateClientGuestToken(config);
  }

  logger.debug({clientId: config.slasClientId}, '[SLAS] Using public client PKCE guest flow');

  const client = createSlasShopperClient(config);
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);

  // Step 1: Authorize — get authorization code via 303 redirect
  const authorizeParams = {
    client_id: config.slasClientId,
    response_type: 'code' as const,
    redirect_uri: config.redirectUri,
    hint: 'guest' as const,
    code_challenge: challenge,
  };

  const {response: authorizeResponse, error: authorizeError} = await client.GET('/oauth2/authorize', {
    params: {query: authorizeParams},
    parseAs: 'text',
  });

  if (authorizeResponse.status !== 303) {
    checkResponse(authorizeResponse, 'authorize', authorizeError);
    throw new Error(`Expected 303 redirect from SLAS authorize, got ${authorizeResponse.status}`);
  }

  const location = authorizeResponse.headers.get('location');
  if (!location) {
    throw new Error('SLAS authorize response missing Location header');
  }

  const {code, usid} = parseRedirectCode(location);
  logger.debug({usid}, '[SLAS] Got authorization code');

  // Step 2: Exchange code for token
  const tokenBody = {
    grant_type: 'authorization_code_pkce' as const,
    client_id: config.slasClientId,
    code,
    code_verifier: verifier,
    redirect_uri: config.redirectUri,
    channel_id: config.siteId,
    usid,
  };

  const {
    data,
    error,
    response: tokenResponse,
  } = await client.POST('/oauth2/token', {
    redirect: 'error',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: tokenBody,
  });

  checkResponse(tokenResponse, 'token exchange (authorization_code_pkce)', error);
  return data!;
}

/**
 * Private client guest token via client_credentials grant.
 */
async function getPrivateClientGuestToken(config: SlasTokenConfig): Promise<SlasTokenResponse> {
  const logger = getLogger();
  logger.debug({clientId: config.slasClientId}, '[SLAS] Using private client client_credentials guest flow');

  const client = createSlasShopperClient(config);
  const basicAuth = encodeBasicClientCredentials(config.slasClientId, config.slasClientSecret!);

  const tokenBody = {
    grant_type: 'client_credentials' as const,
    channel_id: config.siteId,
  };

  const {
    data,
    error,
    response: tokenResponse,
  } = await client.POST('/oauth2/token', {
    redirect: 'error',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: tokenBody,
  });

  checkResponse(tokenResponse, 'token (client_credentials)', error);
  return data!;
}

/**
 * Retrieves a registered customer access token from SLAS.
 *
 * Uses the `/oauth2/login` endpoint with shopper credentials, then exchanges
 * the authorization code for an access token.
 *
 * The registered-customer flow is PKCE-protected for **both** public and
 * private clients: a `code_challenge` is always presented at the
 * `/oauth2/login` step, so the matching `code_verifier` must always be sent at
 * the token exchange with the `authorization_code_pkce` grant.
 *
 * - **Public client**: PKCE token exchange (no client secret).
 * - **Private client**: PKCE token exchange, plus HTTP Basic authentication
 *   using the client secret. The client must NOT drop PKCE, or SLAS rejects the
 *   exchange with `400 code_verifier is required`.
 *
 * @param config - SLAS token configuration including shopper credentials
 * @returns The token response including access_token and refresh_token
 */
export async function getRegisteredToken(config: SlasRegisteredLoginConfig): Promise<SlasTokenResponse> {
  const logger = getLogger();
  const client = createSlasShopperClient(config);
  const isPrivate = Boolean(config.slasClientSecret);

  logger.debug({clientId: config.slasClientId, isPrivate}, '[SLAS] Using registered customer login flow');

  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);

  // Step 1: Login with shopper credentials
  const shopperAuth = Buffer.from(`${config.shopperLogin}:${config.shopperPassword}`).toString('base64');

  const loginBody = {
    client_id: config.slasClientId,
    channel_id: config.siteId,
    code_challenge: challenge,
    redirect_uri: config.redirectUri,
  };

  const {response: loginResponse, error: loginError} = await client.POST('/oauth2/login', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${shopperAuth}`,
    },
    body: loginBody,
    parseAs: 'text',
  });

  if (loginResponse.status !== 303) {
    checkResponse(loginResponse, 'login', loginError);
    throw new Error(`Expected 303 redirect from SLAS login, got ${loginResponse.status}`);
  }

  const location = loginResponse.headers.get('location');
  if (!location) {
    throw new Error('SLAS login response missing Location header');
  }

  const {code, usid} = parseRedirectCode(location);
  logger.debug({usid}, '[SLAS] Got authorization code from login');

  // Step 2: Exchange code for token.
  //
  // The login step always presents a `code_challenge`, so the token exchange
  // must always send the matching `code_verifier` with the
  // `authorization_code_pkce` grant — for both public and private clients.
  // A private client additionally authenticates with HTTP Basic using its
  // secret; it must NOT downgrade to the plain `authorization_code` grant or
  // SLAS rejects the exchange with `400 code_verifier is required`.

  const tokenBody = {
    grant_type: 'authorization_code_pkce' as const,
    client_id: config.slasClientId,
    code,
    code_verifier: verifier,
    redirect_uri: config.redirectUri,
    channel_id: config.siteId,
    usid,
  };

  const tokenHeaders: Record<string, string> = {'Content-Type': 'application/x-www-form-urlencoded'};
  if (isPrivate) {
    const basicAuth = encodeBasicClientCredentials(config.slasClientId, config.slasClientSecret!);
    tokenHeaders.Authorization = `Basic ${basicAuth}`;
  }

  const {
    data,
    error,
    response: tokenResponse,
  } = await client.POST('/oauth2/token', {
    redirect: 'error',
    headers: tokenHeaders,
    body: tokenBody,
  });

  checkResponse(tokenResponse, 'token exchange (authorization_code_pkce)', error);
  return data!;
}
