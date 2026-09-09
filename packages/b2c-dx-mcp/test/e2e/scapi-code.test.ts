/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {McpE2EClient} from './stdio-client.js';

function readJson<T>(response: unknown): T {
  expect(response).not.to.have.property('structuredContent');
  const {content} = response as {content: {type: string; text: string}[]};
  expect(content).to.have.length(1);
  expect(content[0].type).to.equal('text');
  const parsed = JSON.parse(content[0].text) as T;
  expect(content[0].text).to.equal(JSON.stringify(parsed));
  return parsed;
}

describe('SCAPI code mode over stdio', function () {
  this.timeout(30_000);

  it('includes code mode in the default catalog', async () => {
    const client = new McpE2EClient();
    await client.start();
    try {
      const {tools} = (await client.call('tools/list')) as {tools: {name: string}[]};
      expect(tools.map(({name}) => name)).to.include.members(['scapi_search', 'scapi_execute']);
    } finally {
      await client.stop();
    }
  });

  it('discovers product fields with bundled schemas and no Commerce authentication', async () => {
    const client = new McpE2EClient({args: ['--tools', 'scapi_search']});
    await client.start();
    try {
      const {tools} = (await client.call('tools/list')) as {tools: {name: string; title: string}[]};
      expect(tools).to.have.length(1);
      expect(tools[0]).to.include({name: 'scapi_search', title: 'SCAPI Spec Search'});
      expect(tools[0]).not.to.have.property('outputSchema');
      const required = (await client.call('tools/call', {
        name: 'scapi_search',
        arguments: {code: 'async () => 1'},
      })) as {isError?: boolean};
      expect(required.isError).to.equal(true);
      expect(readJson<{error: string}>(required).error).to.include('SCAPI_SKILL_REQUIRED');
      const resource = (await client.call('resources/read', {uri: 'skill://mcp/scapi/SKILL.md'})) as {
        contents: {text: string}[];
      };
      expect(resource.contents[0].text).to.include('skillRead');
      const response = (await client.call('tools/call', {
        name: 'scapi_search',
        arguments: {
          skillRead: true,
          authType: 'admin',
          api: 'product/products/v1',
          code: `async () => {
          const op = spec.paths['/product/products/v1/organizations/{organizationId}/products/{productId}'].put;
          const body = op.requestBody.content['application/json'].schema;
          return {operation: op.operationId, required: body.required, fields: Object.keys(body.properties), auth:op.auth};
        }`,
        },
      })) as {isError?: boolean};
      const parsed = readJson<{
        result: {
          operation: string;
          required: string[];
          fields: string[];
          auth: {types: string[]; executable: boolean};
        };
      }>(response);
      expect(response.isError).not.to.equal(true);
      expect(parsed.result.operation).to.equal('createProduct');
      expect(parsed.result.required).to.include('id');
      expect(parsed.result.fields).to.include('owningCatalogId');
      expect(parsed.result.auth).to.include({executable: true});
      expect(parsed.result.auth.types).to.deep.equal(['admin']);
      expect(resource.contents[0].text).to.include('scapi_execute');
    } finally {
      await client.stop();
    }
  });

  it('returns execution JSON and provenance without a duplicate payload over stdio', async () => {
    const client = new McpE2EClient({
      args: ['--tools', 'scapi_execute'],
      env: {SFCC_SHORTCODE: 'test', SFCC_TENANT_ID: 'test_001'},
    });
    await client.start();
    try {
      const {tools} = (await client.call('tools/list')) as {tools: {name: string; title: string}[]};
      expect(tools[0]).to.include({name: 'scapi_execute', title: 'SCAPI Code Executor'});
      expect(tools[0]).not.to.have.property('outputSchema');
      const response = (await client.call('tools/call', {
        name: 'scapi_execute',
        arguments: {skillRead: true, code: 'async () => ({organizationId})'},
      })) as {isError?: boolean};
      expect(response.isError).not.to.equal(true);
      expect(readJson(response)).to.deep.include({result: {organizationId: 'f_ecom_test_001'}});
      expect(readJson(response)).to.have.property('resolution');
      const failed = (await client.call('tools/call', {
        name: 'scapi_execute',
        arguments: {skillRead: true, code: 'async () => { throw new Error("PROGRAM_FAILED"); }'},
      })) as {isError?: boolean};
      expect(failed.isError).to.equal(true);
      expect(readJson(failed)).to.include({error: 'PROGRAM_FAILED'}).and.to.have.property('resolution');
    } finally {
      await client.stop();
    }
  });

  it('accepts the same acknowledgment after reading with skills_read', async () => {
    const client = new McpE2EClient({args: ['--tools', 'skills_read,scapi_search']});
    await client.start();
    try {
      const read = (await client.call('tools/call', {name: 'skills_read', arguments: {id: 'mcp/scapi'}})) as {
        isError?: boolean;
      };
      expect(read.isError).not.to.equal(true);
      const result = (await client.call('tools/call', {
        name: 'scapi_search',
        arguments: {skillRead: true, authType: 'shopper', code: 'async () => spec.apis.length'},
      })) as {isError?: boolean};
      expect(result.isError).not.to.equal(true);
      expect(readJson<{result: number}>(result).result).to.be.greaterThan(0);
    } finally {
      await client.stop();
    }
  });
});
