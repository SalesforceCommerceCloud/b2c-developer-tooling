/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {expect} from 'chai';
import {buildDwJsonSchema, normalizeConfigKeys, type DwJsonConfig} from '@salesforce/b2c-tooling-sdk/config';

/**
 * Every DwJsonConfig field. `satisfies` makes typecheck fail when a field is
 * added to DwJsonConfig without being listed here (and thus in the schema).
 */
const DW_JSON_CONFIG_KEYS = {
  name: true,
  active: true,
  hostname: true,
  codeVersion: true,
  username: true,
  password: true,
  clientId: true,
  clientSecret: true,
  oauthScopes: true,
  slasClientId: true,
  slasClientSecret: true,
  siteId: true,
  shortCode: true,
  webdavHostname: true,
  authMethods: true,
  userAuth: true,
  accountManagerHost: true,
  clientAuthMethod: true,
  mrtProject: true,
  mrtEnvironment: true,
  mrtApiKey: true,
  mrtOrigin: true,
  tenantId: true,
  sandboxApiHost: true,
  realm: true,
  autoUpload: true,
  cartridges: true,
  importSetExclude: true,
  contentLibrary: true,
  catalogs: true,
  libraries: true,
  assetQuery: true,
  cipHost: true,
  docsCategories: true,
  certificate: true,
  certificatePassphrase: true,
  selfSigned: true,
  apiBackend: true,
  mrtBackend: true,
  jwtCertPath: true,
  jwtKeyPath: true,
  jwtPassphrase: true,
  safety: true,
} satisfies Record<keyof DwJsonConfig, true>;

type Schema = {
  definitions: {instance: {properties: Record<string, {description?: string}>}};
  properties: Record<string, unknown>;
};

describe('config/dw-json-schema', () => {
  const schema = buildDwJsonSchema() as unknown as Schema;
  const properties = schema.definitions.instance.properties;

  it('covers every DwJsonConfig field in camelCase', () => {
    const missing = Object.keys(DW_JSON_CONFIG_KEYS).filter((key) => !properties[key]);
    expect(missing).to.deep.equal([]);
  });

  it('lists only spellings that normalize to a DwJsonConfig field', () => {
    for (const key of Object.keys(properties)) {
      const normalized = Object.keys(normalizeConfigKeys({[key]: 'x'}));
      expect(normalized, key).to.have.lengthOf(1);
      expect(DW_JSON_CONFIG_KEYS, `${key} → ${normalized[0]}`).to.have.property(normalized[0]);
    }
  });

  it('includes legacy aliases and marks alternates', () => {
    expect(properties.server?.description).to.match(/^Alternate spelling of `hostname`/);
    expect(properties.selfsigned?.description).to.match(/^Alternate spelling of `self-signed`/);
    expect(properties['client-id']?.description).not.to.match(/^Alternate/);
  });

  it('supports a configs array of instances', () => {
    expect(schema.properties.configs).to.deep.include({items: {$ref: '#/definitions/instance'}});
  });

  it('matches the committed data/schemas/dw.schema.json', () => {
    const file = fileURLToPath(new URL('../../data/schemas/dw.schema.json', import.meta.url));
    const committed = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(committed, 'run: pnpm --filter @salesforce/b2c-tooling-sdk run generate:dw-json-schema').to.deep.equal(
      buildDwJsonSchema(),
    );
  });
});
