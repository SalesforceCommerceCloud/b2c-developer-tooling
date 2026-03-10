/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Types for SLAS Shopper Login token retrieval.
 *
 * @module slas/types
 */

/**
 * Response from SLAS token endpoints.
 */
export interface SlasTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  usid: string;
  customer_id: string;
  id_token?: string;
}

/**
 * Configuration for SLAS shopper token retrieval.
 */
export interface SlasTokenConfig {
  /** SCAPI short code */
  shortCode: string;
  /** Organization ID in f_ecom_xxxx_yyy format */
  organizationId: string;
  /** SLAS client ID */
  slasClientId: string;
  /** SLAS client secret (undefined = public client) */
  slasClientSecret?: string;
  /** B2C Commerce site/channel ID */
  siteId: string;
  /** OAuth redirect URI */
  redirectUri: string;
}

/**
 * Configuration for registered customer login.
 */
export interface SlasRegisteredLoginConfig extends SlasTokenConfig {
  /** Shopper login/username */
  shopperLogin: string;
  /** Shopper password */
  shopperPassword: string;
}
