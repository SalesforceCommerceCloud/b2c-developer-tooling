/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import yaml from 'js-yaml';
import type {NormalizedConfig} from '@salesforce/b2c-tooling-sdk/config';
import {
  buildOpenShellDockerfile,
  buildOpenShellSetup,
  secretNeedsBodyAuth,
} from '@salesforce/b2c-tooling-sdk/openshell';

interface Endpoint {
  host: string;
  credential_binding?: {provider: string};
  request_body_credential_rewrite?: boolean;
  rules: Array<{allow: {method: string; path: string}}>;
}
interface Policy {
  network_policies: Record<string, {endpoints: Endpoint[]}>;
}

const CONFIG: NormalizedConfig = {
  hostname: 'abcd-001.dx.commercecloud.salesforce.com',
  clientId: 'my-client',
  clientSecret: 'real-secret',
  username: 'user@example.com',
  password: 'real-access-key',
  shortCode: 'kv7kzm78',
  tenantId: 'abcd_001',
  mrtApiKey: 'real-mrt-key',
  mrtProject: 'my-project',
};

function parsePolicy(policy: string): Policy {
  return yaml.load(policy) as Policy;
}

function methods(endpoint: Endpoint, path = '/**'): string[] {
  return endpoint.rules.filter((r) => r.allow.path === path).map((r) => r.allow.method);
}

describe('openshell/setup', () => {
  describe('buildOpenShellSetup', () => {
    it('never includes secret values', () => {
      const setup = buildOpenShellSetup(CONFIG);
      const serialized = JSON.stringify(setup);
      for (const secret of ['real-secret', 'real-access-key', 'real-mrt-key']) {
        expect(serialized).to.not.include(secret);
      }
    });

    it('creates one provider per secret, named after the sandbox', () => {
      const setup = buildOpenShellSetup(CONFIG);
      expect(setup.sandboxName).to.equal('b2c-abcd-001');
      expect(setup.providers.map((p) => [p.name, p.type, p.envVar])).to.deep.equal([
        ['b2c-abcd-001-client-secret', 'b2c-client-secret', 'SFCC_CLIENT_SECRET'],
        ['b2c-abcd-001-webdav', 'b2c-webdav-access-key', 'SFCC_PASSWORD'],
        ['b2c-abcd-001-mrt', 'b2c-mrt-api-key', 'MRT_API_KEY'],
      ]);
      expect(setup.profiles.map((p) => p.id)).to.deep.equal([
        'b2c-client-secret',
        'b2c-webdav-access-key',
        'b2c-mrt-api-key',
      ]);
    });

    it('declares no endpoints in profiles and configures the auth style', () => {
      const setup = buildOpenShellSetup(CONFIG);
      const profiles = Object.fromEntries(
        setup.profiles.map((p) => [p.id, yaml.load(p.content) as {credentials: Array<Record<string, unknown>>}]),
      );
      for (const profile of Object.values(profiles)) {
        expect(profile).to.not.have.property('endpoints');
      }
      expect(profiles['b2c-webdav-access-key'].credentials[0].auth_style).to.equal('basic');
      expect(profiles['b2c-mrt-api-key'].credentials[0]).to.include({
        auth_style: 'bearer',
        header_name: 'Authorization',
      });
    });

    it('binds each secret only to its own host', () => {
      const policy = parsePolicy(buildOpenShellSetup(CONFIG).policy).network_policies;
      const am = policy.b2c_account_manager.endpoints[0];
      expect(am.host).to.equal('account.demandware.com');
      expect(am.credential_binding).to.deep.equal({provider: 'b2c-abcd-001-client-secret'});
      expect(am.rules[0]).to.deep.equal({allow: {method: 'POST', path: '/dwsso/oauth2/access_token'}});
      expect(methods(am, '/dw/rest/**')).to.deep.equal(['GET', 'HEAD', 'OPTIONS']);
      expect(policy.b2c_instance.endpoints[0].credential_binding).to.deep.equal({provider: 'b2c-abcd-001-webdav'});
      expect(policy.b2c_scapi.endpoints[0].host).to.equal('kv7kzm78.api.commercecloud.salesforce.com');
      expect(policy.b2c_scapi.endpoints[0]).to.not.have.property('credential_binding');
      expect(policy.b2c_mrt.endpoints[0]).to.include({host: 'cloud.mobify.com'});
      expect(policy.b2c_mrt.endpoints[0].credential_binding).to.deep.equal({provider: 'b2c-abcd-001-mrt'});
    });

    it('limits methods by access level', () => {
      const instance = (level: 'NONE' | 'NO_DELETE' | 'READ_ONLY') =>
        parsePolicy(buildOpenShellSetup(CONFIG, {accessLevel: level}).policy).network_policies.b2c_instance
          .endpoints[0];
      const webdav = '/on/demandware.servlet/webdav/**';

      expect(methods(instance('READ_ONLY'))).to.deep.equal(['GET', 'HEAD', 'OPTIONS']);
      expect(methods(instance('READ_ONLY'), webdav)).to.deep.equal(['PROPFIND']);
      expect(methods(instance('NO_DELETE'))).to.deep.equal(['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH']);
      expect(methods(instance('NO_DELETE'), webdav)).to.deep.equal(['PROPFIND', 'MKCOL', 'MOVE', 'COPY']);
      expect(methods(instance('NONE'))).to.include('DELETE');
    });

    it('sets matching non-secret environment for the sandbox', () => {
      const setup = buildOpenShellSetup(CONFIG, {accessLevel: 'NO_DELETE'});
      expect(setup.env).to.include({
        SFCC_CLIENT_ID: 'my-client',
        SFCC_SERVER: 'abcd-001.dx.commercecloud.salesforce.com',
        SFCC_USERNAME: 'user@example.com',
        SFCC_SHORTCODE: 'kv7kzm78',
        MRT_PROJECT: 'my-project',
        SFCC_SAFETY_LEVEL: 'NO_DELETE',
      });
      expect(setup.env).to.not.have.property('SFCC_CLIENT_AUTH_METHOD');
    });

    it('uses body client authentication when the secret contains + or %', () => {
      const setup = buildOpenShellSetup({...CONFIG, clientSecret: 'abc+def'});
      expect(setup.env.SFCC_CLIENT_AUTH_METHOD).to.equal('body');
      const am = parsePolicy(setup.policy).network_policies.b2c_account_manager.endpoints[0];
      expect(am.request_body_credential_rewrite).to.equal(true);
    });

    it('only includes what is configured', () => {
      const setup = buildOpenShellSetup({
        hostname: 'abcd-001.dx.commercecloud.salesforce.com',
        clientId: 'c',
        clientSecret: 's',
      });
      expect(setup.providers.map((p) => p.source)).to.deep.equal(['clientSecret']);
      expect(Object.keys(parsePolicy(setup.policy).network_policies)).to.deep.equal([
        'b2c_account_manager',
        'b2c_instance',
        'b2c_sandbox_api',
        'b2c_cip',
        'b2c_docs',
      ]);
      expect(setup.env).to.not.have.property('SFCC_USERNAME');
    });

    it('allows the default service hosts', () => {
      const setup = buildOpenShellSetup(CONFIG);
      const policy = parsePolicy(setup.policy).network_policies;
      expect(policy.b2c_sandbox_api.endpoints[0].host).to.equal('admin.dx.commercecloud.salesforce.com');
      expect(policy.b2c_cip.endpoints.map((e) => e.host)).to.deep.equal([
        'jdbc.analytics.commercecloud.salesforce.com',
        'jdbc.stg.analytics.commercecloud.salesforce.com',
      ]);
      // CIP sends every query as a POST
      expect(methods(policy.b2c_cip.endpoints[0])).to.deep.equal(['POST']);
      expect(policy.b2c_mrt.endpoints[1].host).to.equal('logs.mobify.com');
      expect(methods(policy.b2c_mrt.endpoints[0], '/api/projects/*/target/*/jwt/')).to.deep.equal(['POST']);
      expect(policy.b2c_docs.endpoints.map((e) => e.host)).to.deep.equal([
        'developer.salesforce.com',
        'salesforcecommercecloud.github.io',
      ]);
      expect(methods(policy.b2c_docs.endpoints[0])).to.deep.equal(['GET', 'HEAD', 'OPTIONS']);
      expect(setup.env).to.include({SFCC_DISABLE_TELEMETRY: 'true', B2C_SKIP_NEW_VERSION_CHECK: 'true'});
      expect(setup.env).to.not.have.any.keys('SFCC_SANDBOX_API_HOST', 'SFCC_CIP_HOST', 'SFCC_ACCOUNT_MANAGER_HOST');
    });

    it('uses overridden hosts and passes them to the sandbox', () => {
      const setup = buildOpenShellSetup({
        ...CONFIG,
        accountManagerHost: 'account-pod5.demandware.net',
        sandboxApiHost: 'admin.eu01.dx.commercecloud.salesforce.com',
        cipHost: 'jdbc.stg.analytics.commercecloud.salesforce.com',
        mrtOrigin: 'https://cloud-soak.mrt-soak.com',
      });
      const policy = parsePolicy(setup.policy).network_policies;
      expect(policy.b2c_account_manager.endpoints[0].host).to.equal('account-pod5.demandware.net');
      expect(policy.b2c_sandbox_api.endpoints[0].host).to.equal('admin.eu01.dx.commercecloud.salesforce.com');
      expect(policy.b2c_cip.endpoints.map((e) => e.host)).to.deep.equal([
        'jdbc.stg.analytics.commercecloud.salesforce.com',
      ]);
      expect(policy.b2c_mrt.endpoints.map((e) => e.host)).to.deep.equal([
        'cloud-soak.mrt-soak.com',
        'logs-soak.mrt-soak.com',
      ]);
      expect(setup.env).to.include({
        SFCC_ACCOUNT_MANAGER_HOST: 'account-pod5.demandware.net',
        SFCC_SANDBOX_API_HOST: 'admin.eu01.dx.commercecloud.salesforce.com',
        SFCC_CIP_HOST: 'jdbc.stg.analytics.commercecloud.salesforce.com',
        MRT_CLOUD_ORIGIN: 'https://cloud-soak.mrt-soak.com',
      });
    });

    it('adds extra hosts and honors the sandbox name', () => {
      const setup = buildOpenShellSetup(CONFIG, {sandboxName: 'My Sandbox', allowHosts: ['https://example.com/x']});
      expect(setup.sandboxName).to.equal('b2c-my-sandbox');
      expect(parsePolicy(setup.policy).network_policies.b2c_additional.endpoints[0].host).to.equal('example.com');
    });
  });

  it('secretNeedsBodyAuth detects characters Account Manager form-decodes', () => {
    expect(secretNeedsBodyAuth('a+b')).to.equal(true);
    expect(secretNeedsBodyAuth('a%2Fb')).to.equal(true);
    expect(secretNeedsBodyAuth('a/b=c')).to.equal(false);
  });

  it('buildOpenShellDockerfile installs the requested packages', () => {
    expect(buildOpenShellDockerfile({cliVersion: '1.2.3'}))
      .to.include('@salesforce/b2c-cli@1.2.3')
      .and.not.include('b2c-dx-mcp');
    expect(buildOpenShellDockerfile({mcp: true})).to.include('@salesforce/b2c-dx-mcp@latest');
  });
});
