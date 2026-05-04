/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import request from 'supertest';
import {LambdaClient, InvokeCommand} from '@aws-sdk/client-lambda';
import {S3Client, GetObjectCommand} from '@aws-sdk/client-s3';
import {CloudWatchLogsClient, CreateLogStreamCommand} from '@aws-sdk/client-cloudwatch-logs';
import {mockClient} from 'aws-sdk-client-mock';
import {ServiceException} from '@smithy/smithy-client';
import {expect} from 'chai';
import sinon from 'sinon';
import type {Express} from 'express';
import {processLambdaResponse, CONTENT_TYPE, X_ORIGINAL_CONTENT_TYPE} from './ssr.js';
import type {APIGatewayProxyResult, APIGatewayProxyEvent} from 'aws-lambda';
import createEventModule from '@serverless/event-mocks';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createEvent = ((createEventModule as any).default ?? createEventModule) as typeof createEventModule;

class AccessDenied extends ServiceException {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(options?: any) {
    super({...options, name: 'AccessDenied'});
  }
}

type PathStatusCodeContentType = [string, number, string];

const pathsToCheck: PathStatusCodeContentType[] = [
  ['/', 200, 'application/json; charset=utf-8'],
  ['/tls', 200, 'application/json; charset=utf-8'],
  ['/exception', 500, 'text/html; charset=utf-8'],
  ['/cache', 200, 'application/json; charset=utf-8'],
  ['/cookie', 200, 'application/json; charset=utf-8'],
  ['/set-response-headers', 200, 'application/json; charset=utf-8'],
  ['/isolation', 200, 'application/json; charset=utf-8'],
  ['/memtest', 200, 'application/json; charset=utf-8'],
  ['/streaming-large', 200, 'application/json; charset=utf-8'],
];

const pathsToCheckWithBasePath = (basePath: string): PathStatusCodeContentType[] =>
  pathsToCheck.map(([p, s, c]) => [`${basePath}${p}`, s, c]);

describe('server', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let app: Express;
  const lambdaMock = mockClient(LambdaClient);
  const s3Mock = mockClient(S3Client);
  const logsMock = mockClient(CloudWatchLogsClient);

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
    lambdaMock.reset();
    s3Mock.reset();
    logsMock.reset();
    app = (await import('./ssr.js')).app;
  });

  afterEach(() => {
    process.env = originalEnv;
    sinon.restore();
  });

  const checkPath = async (path: string, expectedStatus: number, expectedContentType: string) => {
    await request(app).get(path).expect(expectedStatus).expect('Content-Type', expectedContentType);
  };

  pathsToCheck.forEach(([path, status, ct]) => {
    it(`Path ${path} should render correctly`, () => checkPath(path, status, ct));
  });

  pathsToCheckWithBasePath('/test-base-path').forEach(([path, status, ct]) => {
    it(`Path ${path} should render correctly with base path set`, async () => {
      process.env.MRT_ENV_BASE_PATH = '/test-base-path';
      return checkPath(path, status, ct);
    });
  });

  it('Path /echo should work with base path', async () => {
    const basePath = '/test-base-path';
    process.env.MRT_ENV_BASE_PATH = basePath;
    const response = await request(app).get(`${basePath}/echo?x=foo&y=bar`);
    expect(response.status).to.equal(200);
    expect(response.body.query.x).to.equal('foo');
    expect(response.body.query.y).to.equal('bar');
    expect(response.body.path).to.equal('/echo');
    expect(response.body.env.MRT_ENV_BASE_PATH).to.equal(basePath);
  });

  it('Path "/cache" has Cache-Control set', () => {
    return request(app).get('/cache').expect('Cache-Control', 's-maxage=60');
  });

  it('Path "/cache/:duration" has Cache-Control set correctly', () => {
    return request(app).get('/cache/123').expect('Cache-Control', 's-maxage=123');
  });

  it('Path "/headers" echoes request headers', async () => {
    const response = await request(app).get('/headers').set('Random-Header', 'random');
    expect(response.body.headers['random-header']).to.equal('random');
  });

  it('Path "/cookie" sets cookie', async () => {
    return request(app)
      .get('/cookie?name=test-cookie&value=test-value')
      .expect('set-cookie', 'test-cookie=test-value; Path=/');
  });

  it('Path "/set-response-headers" sets response header', () => {
    return request(app)
      .get('/set-response-headers?header1=value1&header2=test-value')
      .expect('header1', 'value1')
      .expect('header2', 'test-value');
  });

  it('Path "/isolation" succeeds', async () => {
    const consoleSpy = sinon.stub(console, 'error');
    const lambdaError = new ServiceException({$fault: 'client', $metadata: {}} as never);
    lambdaError.name = 'AccessDeniedException';
    const logsError = new ServiceException({$fault: 'client', $metadata: {}} as never);
    logsError.name = 'AccessDeniedException';
    lambdaMock.on(InvokeCommand).rejects(lambdaError);
    s3Mock.on(GetObjectCommand).rejects(new AccessDenied());
    logsMock.on(CreateLogStreamCommand).rejects(logsError);
    const params = `FunctionName=name&Bucket=bucket&Key=key&logGroupName=lgName`;
    const response = await request(app).get(`/isolation?${params}`);
    expect(response.body.origin).to.equal(true);
    expect(response.body.storage).to.equal(true);
    expect(response.body.logs).to.equal(true);
    consoleSpy.restore();
  });

  it('Path "/isolation" succeeds with Region', async () => {
    const consoleSpy = sinon.stub(console, 'error');
    const lambdaError = new ServiceException({$fault: 'client', $metadata: {}} as never);
    lambdaError.name = 'AccessDeniedException';
    const logsError = new ServiceException({$fault: 'client', $metadata: {}} as never);
    logsError.name = 'AccessDeniedException';
    lambdaMock.on(InvokeCommand).rejects(lambdaError);
    s3Mock.on(GetObjectCommand).rejects(new AccessDenied());
    logsMock.on(CreateLogStreamCommand).rejects(logsError);
    const params = `FunctionName=name&Bucket=bucket&Key=key&logGroupName=lgName&Region=us-west-1`;
    const response = await request(app).get(`/isolation?${params}`);
    expect(response.body.origin).to.equal(true);
    expect(response.body.storage).to.equal(true);
    expect(response.body.logs).to.equal(true);
    consoleSpy.restore();
  });

  it('Path "/isolation" fails', async () => {
    const consoleSpy = sinon.stub(console, 'error');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lambdaMock.on(InvokeCommand).resolves({} as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    s3Mock.on(GetObjectCommand).resolves({} as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logsMock.on(CreateLogStreamCommand).resolves({} as any);
    const params = `FunctionName=name&Bucket=bucket&Key=key&logGroupName=lgName`;
    const response = await request(app).get(`/isolation?${params}`);
    expect(response.body.origin).to.equal(false);
    expect(response.body.storage).to.equal(false);
    expect(response.body.logs).to.equal(false);
    const errors = ['Lambda isolation test failed!', 'S3 isolation test failed!', 'Log group isolation test failed!'];
    const calls = consoleSpy.args.map((call) => call[0]);
    expect(errors.some((error) => calls.includes(error))).to.equal(true);
    consoleSpy.restore();
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

  it('should add correlation ID from event headers', () => {
    const response = {
      statusCode: 200,
      multiValueHeaders: {'content-type': ['application/json'], 'x-custom': ['value']},
      body: base64Body,
    };
    const event = createEvent('aws:apiGateway', {
      path: '/',
      httpMethod: 'GET',
      headers: {'x-correlation-id': 'test-correlation-123'},
      body: null,
      multiValueHeaders: {'x-correlation-id': ['test-correlation-123']},
      isBase64Encoded: false,
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      // @ts-expect-error - requestContext is not required
      requestContext: {},
    });
    const result = processLambdaResponse(response as APIGatewayProxyResult, event);
    expect(result.headers['x-correlation-id']).to.equal('test-correlation-123');
  });

  it('should not add correlation ID when not present in event', () => {
    const response = {statusCode: 200, headers: {}, body: base64Body};
    const event = {headers: {}};
    const result = processLambdaResponse(response as APIGatewayProxyResult, event as APIGatewayProxyEvent);
    expect(result.headers['x-correlation-id']).to.be.undefined;
  });

  it('should replace content-type with x-original-content-type', () => {
    const response = {
      statusCode: 200,
      multiValueHeaders: {[X_ORIGINAL_CONTENT_TYPE]: ['application/pdf'], [CONTENT_TYPE]: ['text/plain']},
      body: base64Body,
    };
    const event = {headers: {}};
    const result = processLambdaResponse(response as APIGatewayProxyResult, event as APIGatewayProxyEvent);
    expect(result.headers[CONTENT_TYPE]).to.equal('application/pdf');
    expect(result.headers[X_ORIGINAL_CONTENT_TYPE]).to.be.undefined;
  });

  it('should preserve content-type when x-original-content-type is not present', () => {
    const response = {
      statusCode: 200,
      body: base64Body,
      multiValueHeaders: {[CONTENT_TYPE]: ['application/json']},
    };
    const event = {headers: {}};
    const result = processLambdaResponse(response as APIGatewayProxyResult, event as APIGatewayProxyEvent);
    expect(result.headers[CONTENT_TYPE]).to.equal('application/json');
    expect(result.headers[X_ORIGINAL_CONTENT_TYPE]).to.be.undefined;
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
