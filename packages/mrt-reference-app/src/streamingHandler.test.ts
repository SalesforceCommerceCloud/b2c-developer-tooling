/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import type {APIGatewayProxyEvent, Context} from 'aws-lambda';
import type {Writable} from 'stream';
import {EventEmitter} from 'events';
import {buildHandler} from './streamingHandler.js';

const mockHttpResponseStream = {
  from: sinon.stub().callsFake((stream: Writable) => stream),
};

(globalThis as any).awslambda = {
  HttpResponseStream: mockHttpResponseStream,
};

function createMockWritable(): Writable & EventEmitter {
  const stream = new EventEmitter() as any;
  let ended = false;
  let destroyed = false;

  stream.writable = true;
  stream.writableEnded = false;
  stream.writableFinished = false;
  stream.destroyed = false;

  stream.write = sinon.stub().callsFake((chunk: unknown) => {
    if (destroyed || ended) return false;
    void chunk;
    return true;
  });

  stream.end = sinon.stub().callsFake((chunk?: unknown) => {
    if (destroyed) return stream;
    if (chunk) void chunk;
    ended = true;
    stream.writableEnded = true;
    stream.writableFinished = true;
    stream.emit('finish');
    return stream;
  });

  stream.destroy = sinon.stub().callsFake(() => {
    destroyed = true;
    stream.destroyed = true;
    stream.writable = false;
    stream.emit('close');
    return stream;
  });

  stream.flush = sinon.stub();

  return stream as Writable & EventEmitter;
}

function createMockEvent(overrides?: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent {
  return {
    httpMethod: 'GET',
    path: '/test',
    pathParameters: null,
    queryStringParameters: null,
    headers: {'Content-Type': 'application/json', Host: 'example.com'},
    multiValueHeaders: {},
    body: null,
    isBase64Encoded: false,
    requestContext: {
      requestId: 'test-request-id',
      accountId: '123456789012',
      apiId: 'test-api-id',
      protocol: 'HTTP/1.1',
      httpMethod: 'GET',
      path: '/test',
      stage: 'test',
      requestTime: '09/Apr/2015:12:34:56 +0000',
      requestTimeEpoch: 1428582896000,
      identity: {
        sourceIp: '127.0.0.1',
        userAgent: 'test-agent',
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        user: null,
        userArn: null,
        clientCert: null,
      },
      resourceId: 'test-resource-id',
      resourcePath: '/test',
    },
    ...overrides,
  } as APIGatewayProxyEvent;
}

function createMockContext(overrides?: Partial<Context>): Context {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2024/01/01/[$LATEST]test',
    getRemainingTimeInMillis: () => 30000,
    done: sinon.stub() as never,
    fail: sinon.stub() as never,
    succeed: sinon.stub() as never,
    ...overrides,
  } as Context;
}

describe('streamingHandler', () => {
  let mockResponseStream: Writable & EventEmitter;

  beforeEach(() => {
    mockResponseStream = createMockWritable();
    mockHttpResponseStream.from.resetHistory();
    mockHttpResponseStream.from.callsFake((stream: Writable) => stream);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('buildHandler', () => {
    it('should be a function', () => {
      expect(typeof buildHandler).to.equal('function');
    });

    it('should return a handler function when called with responseStream', () => {
      const handler = buildHandler(mockResponseStream);
      expect(typeof handler).to.equal('function');
    });

    it('should return a handler that accepts event and context', async () => {
      const handler = buildHandler(mockResponseStream);
      const event = createMockEvent();
      const context = createMockContext();

      const result = handler(event, context);
      expect(result).to.be.instanceOf(Promise);

      await result;

      expect((mockResponseStream.write as sinon.SinonStub).called).to.equal(true);
      expect((mockResponseStream.end as sinon.SinonStub).called).to.equal(true);
    });

    it('should handle requests to existing routes', async () => {
      const handler = buildHandler(mockResponseStream);
      await handler(createMockEvent({path: '/test'}), createMockContext());
      expect((mockResponseStream.write as sinon.SinonStub).called).to.equal(true);
      expect((mockResponseStream.end as sinon.SinonStub).called).to.equal(true);
    });

    it('should handle requests to echo route', async () => {
      const handler = buildHandler(mockResponseStream);
      await handler(createMockEvent({path: '/echo'}), createMockContext());
      expect((mockResponseStream.write as sinon.SinonStub).called).to.equal(true);
      expect((mockResponseStream.end as sinon.SinonStub).called).to.equal(true);
    });

    it('should handle requests to streaming route', async () => {
      const handler = buildHandler(mockResponseStream);
      await handler(createMockEvent({path: '/streaming'}), createMockContext());
      expect((mockResponseStream.write as sinon.SinonStub).called).to.equal(true);
      expect((mockResponseStream.end as sinon.SinonStub).called).to.equal(true);
    });

    it('should handle different HTTP methods', async () => {
      const handler = buildHandler(mockResponseStream);
      await handler(createMockEvent({httpMethod: 'POST', path: '/test'}), createMockContext());
      expect((mockResponseStream.write as sinon.SinonStub).called).to.equal(true);
      expect((mockResponseStream.end as sinon.SinonStub).called).to.equal(true);
    });

    it('should handle requests with query parameters', async () => {
      const handler = buildHandler(mockResponseStream);
      await handler(
        createMockEvent({path: '/test', queryStringParameters: {foo: 'bar', baz: 'qux'}}),
        createMockContext(),
      );
      expect((mockResponseStream.write as sinon.SinonStub).called).to.equal(true);
      expect((mockResponseStream.end as sinon.SinonStub).called).to.equal(true);
    });

    it('should handle requests with path parameters', async () => {
      const handler = buildHandler(mockResponseStream);
      await handler(createMockEvent({path: '/test', pathParameters: {id: '123'}}), createMockContext());
      expect((mockResponseStream.write as sinon.SinonStub).called).to.equal(true);
      expect((mockResponseStream.end as sinon.SinonStub).called).to.equal(true);
    });

    it('should handle errors gracefully', async () => {
      const handler = buildHandler(mockResponseStream);
      await handler(createMockEvent({path: '/exception'}), createMockContext());
      expect((mockResponseStream.end as sinon.SinonStub).called).to.equal(true);
    });

    it('should create a new handler for each responseStream', () => {
      const stream1 = createMockWritable();
      const stream2 = createMockWritable();
      const handler1 = buildHandler(stream1);
      const handler2 = buildHandler(stream2);
      expect(handler1).to.not.equal(handler2);
    });

    it('should use the provided responseStream for each handler', async () => {
      const stream1 = createMockWritable();
      const stream2 = createMockWritable();

      const handler1 = buildHandler(stream1);
      const handler2 = buildHandler(stream2);

      const event = createMockEvent();
      const context = createMockContext();

      await handler1(event, context);
      expect((stream1.write as sinon.SinonStub).called).to.equal(true);
      expect((stream2.write as sinon.SinonStub).called).to.equal(false);

      (stream1.write as sinon.SinonStub).resetHistory();
      (stream2.write as sinon.SinonStub).resetHistory();

      await handler2(event, context);
      expect((stream2.write as sinon.SinonStub).called).to.equal(true);
      expect((stream1.write as sinon.SinonStub).called).to.equal(false);
    });
  });
});
