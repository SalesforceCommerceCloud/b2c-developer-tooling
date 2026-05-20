/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import request from 'supertest';
import {expect} from 'chai';
import sinon from 'sinon';
import type {Express} from 'express';
import {processLambdaResponse, get} from './ssr.js';
import type {APIGatewayProxyResult, APIGatewayProxyEvent, Context} from 'aws-lambda';
import createEventModule from '@serverless/event-mocks';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createEvent = ((createEventModule as any).default ?? createEventModule) as typeof createEventModule;

describe('server', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let app: Express;

  beforeEach(async () => {
    originalEnv = process.env;
    process.env = Object.assign({}, process.env, {
      MRT_ALLOW_COOKIES: 'true',
      LISTEN_ADDRESS: '',
      BUNDLE_ID: '1',
      DEPLOY_TARGET: 'test',
      EXTERNAL_DOMAIN_NAME: 'test.com',
      MOBIFY_PROPERTY_ID: 'test',
      AWS_LAMBDA_FUNCTION_NAME: 'pretend-to-be-remote',
      AWS_REGION: 'us-east-2',
    });
    app = (await import('./ssr.js')).app;
  });

  afterEach(() => {
    process.env = originalEnv;
    sinon.restore();
  });

  it('Path / should render correctly', async () => {
    const response = await request(app).get('/').expect(200).expect('Content-Type', /text\/html/);
    expect(response.text).to.include('Welcome to your Environment');
  });

  it('Check incoming headers are lowercase', async () => {
    const response = await request(app)
      .get('/headers')
      .set('Random-Header', 'random')
      .set('Another-Mixed-Case-Header', 'value')
      .set('UPPERCASE-HEADER', 'test');
    for (const header in response.body.headers) {
      expect(header).to.equal(header.toLowerCase());
    }
  });
});

const base64Body = 'SGVsbG8gV29ybGQ=';

describe('processLambdaResponse', () => {
  it('should add date header to response', () => {
    const response = {statusCode: 200, headers: {}, body: ''};
    const event = {multiValueHeaders: {}};
    const result = processLambdaResponse(response as APIGatewayProxyResult, event as APIGatewayProxyEvent);
    expect(result.headers.date).to.not.be.undefined;
    expect(result.headers.date).to.match(/^\w+, \d+ \w+ \d+ \d+:\d+:\d+ GMT$/);
  });

  it('should preserve original headers', () => {
    const response = {
      statusCode: 200,
      multiValueHeaders: {'content-type': ['application/json'], 'x-custom': ['value']},
      body: base64Body,
    };
    const event = {headers: {}};
    const result = processLambdaResponse(response as APIGatewayProxyResult, event as APIGatewayProxyEvent);
    expect(result.headers['content-type']).to.equal('application/json');
    expect(result.headers['x-custom']).to.equal('value');
  });

  it('should remove multiValueHeaders from response', () => {
    const response = {
      statusCode: 200,
      multiValueHeaders: {'set-cookie': ['cookie1=value1', 'cookie2=value2']},
      body: base64Body,
    };
    const event = {headers: {}};
    const result = processLambdaResponse(response as APIGatewayProxyResult, event as APIGatewayProxyEvent);
    expect(result.multiValueHeaders).to.be.undefined;
  });

  it('should not add correlation ID when not present in event', () => {
    const response = {statusCode: 200, headers: {}, body: base64Body};
    const event = {headers: {}};
    const result = processLambdaResponse(response as APIGatewayProxyResult, event as APIGatewayProxyEvent);
    expect(result.headers['x-correlation-id']).to.be.undefined;
  });

  it('should handle event with no headers', () => {
    const response = {statusCode: 200, headers: {}, body: base64Body};
    const event = {};
    const result = processLambdaResponse(response as APIGatewayProxyResult, event as APIGatewayProxyEvent);
    expect(result.statusCode).to.equal(200);
    expect(result.headers.date).to.not.be.undefined;
  });

  it('should flatten multi-value headers', () => {
    const response = {
      statusCode: 200,
      body: base64Body,
      multiValueHeaders: {
        'set-cookie': ['cookie1=value1', 'cookie2=value2'],
        'x-custom': ['header1', 'header2'],
      },
    };
    const event = {headers: {}};
    const result = processLambdaResponse(response as APIGatewayProxyResult, event as APIGatewayProxyEvent);
    expect(result.headers['set-cookie']).to.equal('cookie1=value1,cookie2=value2');
    expect(result.headers['x-custom']).to.equal('header1,header2');
  });

  it('should handle status code correctly', () => {
    const response = {statusCode: 404, headers: {}, body: base64Body};
    const event = {headers: {}};
    const result = processLambdaResponse(response as APIGatewayProxyResult, event as APIGatewayProxyEvent);
    expect(result.statusCode).to.equal(404);
  });

  it('should preserve response body when present', () => {
    const response = {statusCode: 200, multiValueHeaders: {}, body: base64Body};
    const event = {headers: {}};
    const result = processLambdaResponse(response as APIGatewayProxyResult, event as APIGatewayProxyEvent);
    expect(result.body).to.equal(base64Body);
  });

  it('should add date header with correct format', () => {
    const response = {statusCode: 200, multiValueHeaders: {}, body: base64Body};
    const event = {headers: {}};
    const result = processLambdaResponse(response as APIGatewayProxyResult, event as APIGatewayProxyEvent);
    expect(result.headers.date).to.not.be.undefined;
    expect(result.headers.date).to.match(/^\w+, \d+ \w+ \d+ \d+:\d+:\d+ GMT$/);
  });
});

describe('createLambdaHandler', () => {
  it('should handle Lambda event and return processed response', async () => {
    const event = createEvent('aws:apiGateway', {
      path: '/',
      httpMethod: 'GET',
      headers: {},
      body: null,
      isBase64Encoded: false,
      multiValueHeaders: {},
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      // @ts-expect-error - requestContext is not required
      requestContext: {},
    });

    const context = {
      callbackWaitsForEmptyEventLoop: true,
      functionName: 'test-function',
      functionVersion: '$LATEST',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
      memoryLimitInMB: '128',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/test-function',
      logStreamName: '2024/01/01/[$LATEST]test',
      getRemainingTimeInMillis: () => 30000,
      done: () => {},
      fail: () => {},
      succeed: () => {},
    } as Context;

    const response = await new Promise<APIGatewayProxyResult>((resolve, reject) => {
      get(event, context, (err, res) => {
        if (err) reject(err);
        else resolve(res as APIGatewayProxyResult);
      });
    });

    expect(response).to.not.be.undefined;
    expect(response?.statusCode).to.equal(200);
    expect(response?.headers).to.not.be.undefined;
    expect(response?.headers?.date).to.not.be.undefined;
  });
});
