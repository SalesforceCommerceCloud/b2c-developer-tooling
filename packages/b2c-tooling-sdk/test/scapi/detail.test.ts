/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {loadScapiSchemas, runScapiCode, type ScapiSchemaDocument} from '@salesforce/b2c-tooling-sdk/scapi';

const document: ScapiSchemaDocument = {
  entry: {
    id: 'test/things/v1',
    apiFamily: 'test',
    apiName: 'things',
    apiVersion: 'v1',
    schemaVersion: '1.0.0',
    status: 'current',
    file: '',
    source: '',
  },
  schema: {
    openapi: '3.0.3',
    security: [{AmOAuth2: ['sfcc.things']}],
    paths: {
      '/things': {
        post: {
          operationId: 'createThing',
          summary: 'Create a thing.',
          description: 'Creates a thing from the body.',
          parameters: [{name: 'siteId', in: 'query', description: 'Site to use.', schema: {type: 'string'}}],
          requestBody: {
            content: {
              'application/json': {
                schema: {$ref: '#/components/schemas/Thing'},
                examples: {sample: {value: {description: 'An example thing'}}},
              },
            },
          },
          responses: {'200': {description: 'OK'}},
        },
      },
    },
    components: {
      schemas: {
        Thing: {
          type: 'object',
          description: 'A thing.',
          properties: {
            // A property named like a schema keyword must survive trimming.
            description: {type: 'string', description: 'What the thing is.', example: 'shiny'},
            kind: {type: 'string', enum: ['a', 'b'], default: 'a'},
          },
        },
      },
    },
  },
};
type OperationShape = {
  summary: string;
  description: string;
  parameters: Array<Record<string, unknown>>;
  requestBody: {content: Record<string, {schema: {properties: Record<string, unknown>}; examples?: unknown}>};
  responses: Record<string, unknown>;
};
const code = `async () => spec.paths['/test/things/v1/things'].post`;

describe('scapi/detail', () => {
  it('keeps the operation prose but drops nested descriptions and examples in an outline', async () => {
    const op = (await runScapiCode({code, documents: [document], detail: 'outline'})) as OperationShape;
    expect(op.summary).to.equal('Create a thing.');
    expect(op.description).to.equal('Creates a thing from the body.');
    const thing = op.requestBody.content['application/json'];
    expect(thing).to.not.have.property('examples');
    expect(thing.schema).to.not.have.property('description');
    expect(thing.schema.properties).to.have.property('description').that.deep.equals({type: 'string'});
    expect(thing.schema.properties.kind).to.deep.equal({type: 'string', enum: ['a', 'b'], default: 'a'});
    expect(op.parameters[0]).to.deep.equal({name: 'siteId', in: 'query', schema: {type: 'string'}});
    expect(op.responses['200']).to.deep.equal({});
  });

  it('keeps everything by default and with full', async () => {
    for (const detail of [undefined, 'full'] as const) {
      const op = (await runScapiCode({code, documents: [document], detail})) as OperationShape;
      const thing = op.requestBody.content['application/json'];
      expect(thing.examples.sample.value.description).to.equal('An example thing');
      expect(thing.schema.properties.description.description).to.equal('What the thing is.');
      expect(op.parameters[0].description).to.equal('Site to use.');
    }
  });

  it('is much smaller for the bundled corpus', async () => {
    const documents = loadScapiSchemas();
    const measure = `async () => JSON.stringify(Object.values(spec.paths).flatMap(Object.values)).length`;
    const full = (await runScapiCode({code: measure, documents, maxOutputBytes: 1000})) as number;
    const outline = (await runScapiCode({code: measure, documents, detail: 'outline', maxOutputBytes: 1000})) as number;
    expect(outline).to.be.lessThan(full * 0.6);
  });
});
