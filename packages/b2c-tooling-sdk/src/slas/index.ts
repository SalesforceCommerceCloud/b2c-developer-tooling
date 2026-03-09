/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * SLAS Shopper Login token retrieval.
 *
 * Provides functions to obtain shopper access tokens from the SLAS
 * Shopper Login service, supporting public (PKCE) and private
 * (client_credentials) client flows for both guest and registered customers.
 *
 * @module slas
 */
export type {SlasTokenConfig, SlasTokenResponse, SlasRegisteredLoginConfig} from './types.js';
export {generateCodeChallenge, generateCodeVerifier} from './pkce.js';
export {getGuestToken, getRegisteredToken} from './token.js';
