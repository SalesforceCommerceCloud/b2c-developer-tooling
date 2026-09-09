/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {McpE2EClient} from './stdio-client.js';

describe('SCAPI code mode over stdio', function () {
  this.timeout(30_000);

  it('keeps preview tools opt-in', async () => {
    const client = new McpE2EClient();
    await client.start();
    try {
      const {tools} = (await client.call('tools/list')) as {tools: {name: string}[]};
      expect(tools.map(({name}) => name)).not.to.include.members(['scapi_search', 'scapi_execute']);
    } finally {
      await client.stop();
    }
  });

  it('discovers product fields with bundled schemas and no Commerce authentication', async () => {
    const client = new McpE2EClient({args: ['--allow-non-ga-tools', '--tools', 'scapi_search']});
    await client.start();
    try {
      const required = (await client.call('tools/call', {
        name: 'scapi_search',
        arguments: {code: 'async () => 1'},
      })) as {isError?: boolean; structuredContent: {error: string}};
      expect(required.isError).to.equal(true);
      expect(required.structuredContent.error).to.include('SCAPI_SKILL_REQUIRED');
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
          const body = spec.resolve(op.requestBody, op.api).content['application/json'].schema;
          return {operation: op.operationId, required: body.required, fields: Object.keys(body.properties), auth:op.auth};
        }`,
        },
      })) as {
        isError?: boolean;
        structuredContent: {
          result: {
            operation: string;
            required: string[];
            fields: string[];
            auth: {types: string[]; executable: boolean};
          };
        };
      };
      expect(response.isError).not.to.equal(true);
      expect(response.structuredContent.result.operation).to.equal('createProduct');
      expect(response.structuredContent.result.required).to.include('id');
      expect(response.structuredContent.result.fields).to.include('owningCatalogId');
      expect(response.structuredContent.result.auth).to.include({executable: true});
      expect(response.structuredContent.result.auth.types).to.deep.equal(['admin']);
      expect(resource.contents[0].text).to.include('scapi_execute');
    } finally {
      await client.stop();
    }
  });

  it('accepts the same acknowledgment after reading with skills_read', async () => {
    const client = new McpE2EClient({args: ['--allow-non-ga-tools', '--tools', 'skills_read,scapi_search']});
    await client.start();
    try {
      const read = (await client.call('tools/call', {name: 'skills_read', arguments: {id: 'mcp/scapi'}})) as {
        isError?: boolean;
      };
      expect(read.isError).not.to.equal(true);
      const result = (await client.call('tools/call', {
        name: 'scapi_search',
        arguments: {skillRead: true, authType: 'shopper', code: 'async () => spec.apis.length'},
      })) as {isError?: boolean; structuredContent: {result: number}};
      expect(result.isError).not.to.equal(true);
      expect(result.structuredContent.result).to.be.greaterThan(0);
    } finally {
      await client.stop();
    }
  });
});
