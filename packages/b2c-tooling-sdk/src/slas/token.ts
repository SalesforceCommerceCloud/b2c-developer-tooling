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
import {getLogger} from '../logging/logger.js';
import {generateCodeChallenge, generateCodeVerifier} from './pkce.js';
import type {SlasTokenConfig, SlasTokenResponse, SlasRegisteredLoginConfig} from './types.js';

/**
 * Builds the SLAS shopper auth base URL.
 */
function buildBaseUrl(shortCode: string, organizationId: string): string {
  return `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${organizationId}`;
}

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
async function checkResponse(response: Response, context: string): Promise<void> {
  if (response.ok) return;

  let detail = '';
  try {
    const body = await response.text();
    detail = body ? ` — ${body}` : '';
  } catch {
    // ignore body parse errors
  }

  throw new Error(`SLAS ${context} failed (HTTP ${response.status})${detail}`);
}

/**
 * Helper to collect response headers as a plain object for logging.
 */
function serializeHeaders(response: Response): Record<string, string> {
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
}

/**
 * Performs a logged fetch request following the Auth logging conventions.
 * Returns the response (caller must check status).
 */
async function loggedFetch(url: string, init: RequestInit): Promise<{response: Response; duration: number}> {
  const logger = getLogger();
  const method = init.method ?? 'GET';

  logger.debug({method, url}, `[SLAS REQ] ${method} ${url}`);
  logger.trace({method, url, headers: init.headers, body: init.body?.toString()}, `[SLAS REQ BODY] ${method} ${url}`);

  const startTime = Date.now();
  const response = await fetch(url, init);
  const duration = Date.now() - startTime;

  logger.debug(
    {method, url, status: response.status, duration},
    `[SLAS RESP] ${method} ${url} ${response.status} ${duration}ms`,
  );

  return {response, duration};
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

  const baseUrl = buildBaseUrl(config.shortCode, config.organizationId);
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);

  // Step 1: Authorize — get authorization code via 303 redirect
  const authorizeParams = new URLSearchParams({
    client_id: config.slasClientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    hint: 'guest',
    code_challenge: challenge,
  });

  const authorizeUrl = `${baseUrl}/oauth2/authorize?${authorizeParams.toString()}`;

  const {response: authorizeResponse} = await loggedFetch(authorizeUrl, {redirect: 'manual'});

  if (authorizeResponse.status !== 303) {
    const respHeaders = serializeHeaders(authorizeResponse);
    logger.trace({headers: respHeaders}, `[SLAS RESP BODY] GET ${authorizeUrl}`);
    await checkResponse(authorizeResponse, 'authorize');
    throw new Error(`Expected 303 redirect from SLAS authorize, got ${authorizeResponse.status}`);
  }

  const location = authorizeResponse.headers.get('location');
  if (!location) {
    throw new Error('SLAS authorize response missing Location header');
  }

  const {code, usid} = parseRedirectCode(location);
  logger.debug({usid}, '[SLAS] Got authorization code');

  // Step 2: Exchange code for token
  const tokenBody = new URLSearchParams({
    grant_type: 'authorization_code_pkce',
    client_id: config.slasClientId,
    code,
    code_verifier: verifier,
    redirect_uri: config.redirectUri,
    channel_id: config.siteId,
    usid,
  });

  const tokenUrl = `${baseUrl}/oauth2/token`;
  const {response: tokenResponse} = await loggedFetch(tokenUrl, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: tokenBody,
  });

  await checkResponse(tokenResponse, 'token exchange (authorization_code_pkce)');
  const data = (await tokenResponse.json()) as SlasTokenResponse;
  const respHeaders = serializeHeaders(tokenResponse);
  logger.trace({headers: respHeaders, body: data}, `[SLAS RESP BODY] POST ${tokenUrl}`);

  return data;
}

/**
 * Private client guest token via client_credentials grant.
 */
async function getPrivateClientGuestToken(config: SlasTokenConfig): Promise<SlasTokenResponse> {
  const logger = getLogger();
  logger.debug({clientId: config.slasClientId}, '[SLAS] Using private client client_credentials guest flow');

  const baseUrl = buildBaseUrl(config.shortCode, config.organizationId);
  const basicAuth = Buffer.from(`${config.slasClientId}:${config.slasClientSecret}`).toString('base64');

  const tokenBody = new URLSearchParams({
    grant_type: 'client_credentials',
    channel_id: config.siteId,
  });

  const tokenUrl = `${baseUrl}/oauth2/token`;
  const {response: tokenResponse} = await loggedFetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: tokenBody,
  });

  await checkResponse(tokenResponse, 'token (client_credentials)');
  const data = (await tokenResponse.json()) as SlasTokenResponse;
  const respHeaders = serializeHeaders(tokenResponse);
  logger.trace({headers: respHeaders, body: data}, `[SLAS RESP BODY] POST ${tokenUrl}`);

  return data;
}

/**
 * Retrieves a registered customer access token from SLAS.
 *
 * Uses the `/oauth2/login` endpoint with shopper credentials, then exchanges
 * the authorization code for an access token.
 *
 * - **Public client**: Uses PKCE for code exchange.
 * - **Private client**: Uses client credentials (Basic auth) for code exchange.
 *
 * @param config - SLAS token configuration including shopper credentials
 * @returns The token response including access_token and refresh_token
 */
export async function getRegisteredToken(config: SlasRegisteredLoginConfig): Promise<SlasTokenResponse> {
  const logger = getLogger();
  const baseUrl = buildBaseUrl(config.shortCode, config.organizationId);
  const isPrivate = Boolean(config.slasClientSecret);

  logger.debug({clientId: config.slasClientId, isPrivate}, '[SLAS] Using registered customer login flow');

  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);

  // Step 1: Login with shopper credentials
  const shopperAuth = Buffer.from(`${config.shopperLogin}:${config.shopperPassword}`).toString('base64');

  const loginBody = new URLSearchParams({
    client_id: config.slasClientId,
    channel_id: config.siteId,
    code_challenge: challenge,
    redirect_uri: config.redirectUri,
  });

  const loginUrl = `${baseUrl}/oauth2/login`;
  const {response: loginResponse} = await loggedFetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${shopperAuth}`,
    },
    body: loginBody,
    redirect: 'manual',
  });

  if (loginResponse.status !== 303) {
    const respHeaders = serializeHeaders(loginResponse);
    logger.trace({headers: respHeaders}, `[SLAS RESP BODY] POST ${loginUrl}`);
    await checkResponse(loginResponse, 'login');
    throw new Error(`Expected 303 redirect from SLAS login, got ${loginResponse.status}`);
  }

  const location = loginResponse.headers.get('location');
  if (!location) {
    throw new Error('SLAS login response missing Location header');
  }

  const {code, usid} = parseRedirectCode(location);
  logger.debug({usid}, '[SLAS] Got authorization code from login');

  // Step 2: Exchange code for token
  const tokenUrl = `${baseUrl}/oauth2/token`;

  if (isPrivate) {
    const basicAuth = Buffer.from(`${config.slasClientId}:${config.slasClientSecret}`).toString('base64');
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      channel_id: config.siteId,
      usid,
    });

    const {response: tokenResponse} = await loggedFetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: tokenBody,
    });

    await checkResponse(tokenResponse, 'token exchange (authorization_code)');
    const data = (await tokenResponse.json()) as SlasTokenResponse;
    const respHeaders = serializeHeaders(tokenResponse);
    logger.trace({headers: respHeaders, body: data}, `[SLAS RESP BODY] POST ${tokenUrl}`);

    return data;
  }

  // Public client — use PKCE
  const tokenBody = new URLSearchParams({
    grant_type: 'authorization_code_pkce',
    client_id: config.slasClientId,
    code,
    code_verifier: verifier,
    redirect_uri: config.redirectUri,
    channel_id: config.siteId,
    usid,
  });

  const {response: tokenResponse} = await loggedFetch(tokenUrl, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: tokenBody,
  });

  await checkResponse(tokenResponse, 'token exchange (authorization_code_pkce)');
  const data = (await tokenResponse.json()) as SlasTokenResponse;
  const respHeaders = serializeHeaders(tokenResponse);
  logger.trace({headers: respHeaders, body: data}, `[SLAS RESP BODY] POST ${tokenUrl}`);

  return data;
}
