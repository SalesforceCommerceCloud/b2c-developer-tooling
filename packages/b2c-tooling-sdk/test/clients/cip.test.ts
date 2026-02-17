/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {OAuthStrategy} from '../../src/auth/oauth.js';
import {createCipClient, DEFAULT_CIP_HOST, DEFAULT_CIP_STAGING_HOST} from '../../src/clients/cip.js';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

class TrackingOAuthStrategy extends OAuthStrategy {
  public capturedAdditionalScopes: string[] = [];

  public override withAdditionalScopes(scopes: string[]): OAuthStrategy {
    this.capturedAdditionalScopes = scopes;
    return super.withAdditionalScopes(scopes);
  }
}

describe('clients/cip', () => {
  it('adds CIP tenant scope when using OAuth strategy', () => {
    const auth = new TrackingOAuthStrategy({
      clientId: 'test-client',
      clientSecret: 'test-secret',
    });

    const client = createCipClient({instance: 'zzxy_prd'}, auth);

    expect(auth.capturedAdditionalScopes).to.deep.equal(['SALESFORCE_COMMERCE_API:zzxy_prd']);
    expect((client as unknown as {auth: unknown}).auth).to.not.equal(auth);
  });

  it('keeps non-OAuth auth strategy unchanged', () => {
    const auth = new MockAuthStrategy();

    const client = createCipClient({instance: 'zzxy_prd'}, auth);

    expect((client as unknown as {auth: unknown}).auth).to.equal(auth);
  });

  it('builds base URL with default and normalized host', () => {
    const auth = new MockAuthStrategy();

    const defaultHostClient = createCipClient({instance: 'zzxy_prd'}, auth);
    expect((defaultHostClient as unknown as {baseUrl: string}).baseUrl).to.equal(
      `https://${DEFAULT_CIP_HOST}/zzxy_prd`,
    );

    const normalizedHostClient = createCipClient(
      {
        instance: 'zzxy_prd',
        host: `https://${DEFAULT_CIP_STAGING_HOST}/some/path`,
      },
      auth,
    );
    expect((normalizedHostClient as unknown as {baseUrl: string}).baseUrl).to.equal(
      `https://${DEFAULT_CIP_STAGING_HOST}/zzxy_prd`,
    );
  });
});
