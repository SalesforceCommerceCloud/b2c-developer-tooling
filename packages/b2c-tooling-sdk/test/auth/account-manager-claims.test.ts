/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  readAccountManagerClaims,
  parseAccountManagerTenantFilter,
  formatAccountManagerTenantFilter,
  hasAccountManagerRole,
  hasAccountManagerTenantRole,
  getAccountManagerRoleTenants,
  getAccountManagerRoleDisplayName,
  isAccountManagerApiClientAdmin,
} from '@salesforce/b2c-tooling-sdk/auth';

function jwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({alg: 'RS256', typ: 'JWT'})}.${encode(payload)}.signature`;
}

// Shape of a real Account Manager PKCE user token (values synthetic).
const userPayload = {
  exp: 1_793_989_363,
  iss: 'https://account.demandware.com:443/dwsso/oauth2',
  sub: 'jane@example.com',
  client_id: 'public-client',
  azp: 'public-client',
  grant_type: 'authorization_code',
  scope: ['mail', 'externalId', 'openid', 'roles', 'tenantFilter'],
  roles: ['AM_ACCOUNT_ADMIN', 'ECOM_ADMIN', 'CCDX_SBX_USER', 'SLAS_ORGANIZATION_ADMIN'],
  tenantFilter:
    'CCDX_SBX_USER:zzpq_013,zzpq_014;ECOM_ADMIN:zzpq_013,abcd_prd,abcd_stg;SLAS_ORGANIZATION_ADMIN:zzpq_013',
};

describe('auth/account-manager-claims', () => {
  describe('readAccountManagerClaims', () => {
    it('reads identity, roles and tenants from a user token', () => {
      const claims = readAccountManagerClaims(jwt(userPayload));
      expect(claims.sub).to.equal('jane@example.com');
      expect(claims.clientId).to.equal('public-client');
      expect(claims.grantType).to.equal('authorization_code');
      expect(claims.isUser).to.equal(true);
      expect(claims.issuer).to.equal('https://account.demandware.com:443/dwsso/oauth2');
      expect(claims.expires?.getTime()).to.equal(1_793_989_363_000);
      expect(claims.scopes).to.include.members(['roles', 'tenantFilter']);
      expect(claims.roles).to.deep.equal(userPayload.roles);
      expect(claims.tenantFilter).to.deep.equal({
        CCDX_SBX_USER: ['zzpq_013', 'zzpq_014'],
        ECOM_ADMIN: ['zzpq_013', 'abcd_prd', 'abcd_stg'],
        SLAS_ORGANIZATION_ADMIN: ['zzpq_013'],
      });
      expect(claims.tenants).to.deep.equal(['abcd_prd', 'abcd_stg', 'zzpq_013', 'zzpq_014']);
    });

    it('marks client-credentials tokens as not a user and tolerates missing claims', () => {
      const claims = readAccountManagerClaims(
        jwt({sub: 'my-client', client_id: 'my-client', grant_type: 'client_credentials', scope: 'sfcc.products a'}),
      );
      expect(claims.isUser).to.equal(false);
      expect(claims.scopes).to.deep.equal(['sfcc.products', 'a']);
      expect(claims.roles).to.deep.equal([]);
      expect(claims.tenantFilter).to.deep.equal({});
      expect(claims.tenants).to.deep.equal([]);
      expect(claims.expires).to.equal(undefined);
    });

    it('marks JWT-bearer tokens as not a user and unknown grants as undefined', () => {
      expect(
        readAccountManagerClaims(jwt({grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer'})).isUser,
      ).to.equal(false);
      expect(readAccountManagerClaims(jwt({grant_type: 'something-new'})).isUser).to.equal(undefined);
      expect(readAccountManagerClaims(jwt({})).isUser).to.equal(undefined);
    });

    it('falls back to azp for the client ID', () => {
      expect(readAccountManagerClaims(jwt({azp: 'from-azp'})).clientId).to.equal('from-azp');
    });

    it('throws for a token that is not a JWT', () => {
      expect(() => readAccountManagerClaims('opaque')).to.throw('Invalid JWT format');
    });
  });

  describe('tenant filter parsing', () => {
    it('ignores empty segments and whitespace and merges repeated roles', () => {
      expect(parseAccountManagerTenantFilter(' A: t1 , t2 ;;B:;:x;A:t3,t1;')).to.deep.equal({
        A: ['t1', 't2', 't3'],
        B: [],
      });
      expect(parseAccountManagerTenantFilter(undefined)).to.deep.equal({});
      expect(parseAccountManagerTenantFilter('')).to.deep.equal({});
    });

    it('round-trips through formatAccountManagerTenantFilter, omitting empty roles', () => {
      const filter = {A: ['t1', 't2'], B: [], C: ['t3']};
      expect(formatAccountManagerTenantFilter(filter)).to.equal('A:t1,t2;C:t3');
      expect(parseAccountManagerTenantFilter(formatAccountManagerTenantFilter(filter))).to.deep.equal({
        A: ['t1', 't2'],
        C: ['t3'],
      });
    });
  });

  describe('role checks', () => {
    const claims = readAccountManagerClaims(jwt(userPayload));

    it('detects held roles', () => {
      expect(hasAccountManagerRole(claims, 'AM_ACCOUNT_ADMIN')).to.equal(true);
      expect(hasAccountManagerRole(claims, 'AM_USER_ADMIN')).to.equal(false);
    });

    it('treats Account or API Administrator as able to manage API clients', () => {
      expect(isAccountManagerApiClientAdmin(claims)).to.equal(true);
      expect(isAccountManagerApiClientAdmin({roles: ['AM_API_ADMIN']})).to.equal(true);
      expect(isAccountManagerApiClientAdmin({roles: ['ECOM_ADMIN', 'AM_USER_ADMIN']})).to.equal(false);
      expect(isAccountManagerApiClientAdmin({roles: []})).to.equal(false);
    });

    it('checks a role on a tenant, normalizing tenant IDs', () => {
      expect(getAccountManagerRoleTenants(claims, 'ECOM_ADMIN')).to.deep.equal(['zzpq_013', 'abcd_prd', 'abcd_stg']);
      expect(getAccountManagerRoleTenants(claims, 'AM_ACCOUNT_ADMIN')).to.deep.equal([]);
      expect(hasAccountManagerTenantRole(claims, 'ECOM_ADMIN', 'zzpq-013')).to.equal(true);
      expect(hasAccountManagerTenantRole(claims, 'ECOM_ADMIN', 'f_ecom_ABCD_PRD')).to.equal(true);
      expect(hasAccountManagerTenantRole(claims, 'ECOM_ADMIN', 'zzpq_014')).to.equal(false);
      expect(hasAccountManagerTenantRole(claims, 'CCDX_SBX_USER', 'zzpq_014')).to.equal(true);
    });

    it('maps role enum names to display names', () => {
      expect(getAccountManagerRoleDisplayName('AM_ACCOUNT_ADMIN')).to.equal('Account Administrator');
      expect(getAccountManagerRoleDisplayName('AM_API_ADMIN')).to.equal('API Administrator');
      expect(getAccountManagerRoleDisplayName('SOMETHING_ELSE')).to.equal('SOMETHING_ELSE');
    });
  });
});
