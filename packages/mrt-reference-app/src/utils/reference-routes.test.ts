/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import express, {type Express} from 'express';
import fs from 'fs/promises';
import {mockClient} from 'aws-sdk-client-mock';
import {SecretsManagerClient, GetSecretValueCommand} from '@aws-sdk/client-secrets-manager';
import {DataStore, DataStoreNotFoundError, DataStoreServiceError, DataStoreUnavailableError} from '@salesforce/mrt-utilities';
import {
  echo,
  exception,
  tlsVersionTest,
  cacheTest,
  cookieTest,
  responseHeadersTest,
  memoryTest,
  headerTest,
  loggingMiddleware,
  streamingTest,
  multiValueHeadersTest,
  setStatusTest,
  ssrBundleFileTest,
  streamingResponseLarge,
  winstonLogging,
  delayedLogging,
  massLogging,
  largeLogging,
  dataStoreTest,
  secretsManagerTest,
  proxyTransformationTest,
} from './reference-routes.js';

describe('reference-routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    sinon.stub(fs, 'readFile');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('echo', () => {
    it('should return JSON with diagnostic values', async () => {
      app.get('/test', echo);
      const response = await request(app).get('/test').expect(200).expect('Content-Type', /json/);
      expect(response.body).to.have.property('args');
      expect(response.body).to.have.property('protocol');
      expect(response.body).to.have.property('method');
      expect(response.body).to.have.property('path');
      expect(response.body).to.have.property('query');
      expect(response.body).to.have.property('headers');
      expect(response.body).to.have.property('ip');
      expect(response.body).to.have.property('env');
      expect(response.body).to.have.property('timestamp');
      expect(response.body).to.have.property('route_path');
    });

    it('should include query parameters in response', async () => {
      app.get('/test', echo);
      const response = await request(app).get('/test?foo=bar&baz=qux');
      expect(response.body.query).to.deep.equal({foo: 'bar', baz: 'qux'});
    });

    it('should include request headers in response', async () => {
      app.get('/test', echo);
      const response = await request(app).get('/test').set('Custom-Header', 'custom-value');
      expect(response.body.headers).to.have.property('custom-header');
      expect(response.body.headers['custom-header']).to.equal('custom-value');
    });
  });

  describe('exception', () => {
    it('should throw an IntentionalError', () => {
      app.get('/test', exception);
      return request(app).get('/test').expect(500);
    });
  });

  describe('tlsVersionTest', () => {
    it('should make requests to TLS test domains', async () => {
      app.get('/test', tlsVersionTest);
      const response = await request(app).get('/test').expect(200).expect('Content-Type', /application\/json/);
      expect(response.text).to.include('tls1.1');
      expect(response.text).to.include('tls1.2');
    });
  });

  describe('cacheTest', () => {
    it('should set default cache control', async () => {
      app.get('/test', cacheTest);
      const response = await request(app).get('/test').expect(200);
      expect(response.headers['cache-control']).to.equal('s-maxage=60');
    });

    it('should set custom cache control duration', async () => {
      app.get('/cache/:duration', cacheTest);
      const response = await request(app).get('/cache/120').expect(200);
      expect(response.headers['cache-control']).to.equal('s-maxage=120');
    });

    it('should fallback to default for invalid duration', async () => {
      app.get('/cache/:duration', cacheTest);
      const response = await request(app).get('/cache/invalid').expect(200);
      expect(response.headers['cache-control']).to.equal('s-maxage=60');
    });
  });

  describe('cookieTest', () => {
    it('should set a cookie when name and value are provided', async () => {
      app.get('/test', cookieTest);
      const response = await request(app).get('/test?name=test-cookie&value=test-value').expect(200);
      expect(response.headers['set-cookie']).to.include('test-cookie=test-value; Path=/');
      expect(response.headers['cache-control']).to.equal('private, max-age=60');
    });

    it('should not set cookie when name is not provided', async () => {
      app.get('/test', cookieTest);
      const response = await request(app).get('/test?value=test-value').expect(200);
      expect(response.headers['set-cookie']).to.be.undefined;
    });

    it('should return JSON with diagnostic values', async () => {
      app.get('/test', cookieTest);
      const response = await request(app).get('/test');
      expect(response.body).to.have.property('timestamp');
      expect(response.body).to.have.property('headers');
    });
  });

  describe('responseHeadersTest', () => {
    it('should set response headers from query parameters', async () => {
      app.get('/test', responseHeadersTest);
      const response = await request(app).get('/test?header1=value1&header2=value2').expect(200);
      expect(response.headers.header1).to.equal('value1');
      expect(response.headers.header2).to.equal('value2');
    });

    it('should handle multi-value headers', async () => {
      app.get('/test', responseHeadersTest);
      const response = await request(app).get('/test?header3=value3&header3=value4').expect(200);
      expect(response.headers.header3).to.not.be.undefined;
    });
  });

  describe('memoryTest', () => {
    it('should allocate memory and return diagnostic info', async () => {
      app.get('/test', memoryTest);
      const response = await request(app).get('/test').expect(200);
      expect(response.body.additional_info).to.have.property('memory_end');
      expect(response.body.additional_info).to.have.property('memory_delta');
      expect(response.body.additional_info).to.have.property('malloc_time');
      expect(response.body.additional_info).to.have.property('gc_time');
    });

    it('should handle custom test parameters', async () => {
      app.get('/test', memoryTest);
      const response = await request(app).get('/test?count=5&size=2048').expect(200);
      expect(response.body.additional_info.test_count).to.equal(5);
      expect(response.body.additional_info.test_size).to.equal(2048);
    });

    it('should perform garbage collection when requested', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).gc = sinon.stub();
      app.get('/test', memoryTest);
      const response = await request(app).get('/test?forcegc=true').expect(200);
      expect(response.body.additional_info.force_gc).to.equal(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(((global as any).gc as sinon.SinonStub).called).to.equal(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).gc;
    });
  });

  describe('headerTest', () => {
    it('should return sorted headers', async () => {
      app.get('/test', headerTest);
      const response = await request(app)
        .get('/test')
        .set('Random-Header', 'random')
        .set('Another-Header', 'another')
        .expect(200);
      expect(response.body).to.have.property('headers');
      expect(response.body.headers).to.be.instanceOf(Object);
    });

    it('should convert headers to lowercase', async () => {
      app.get('/test', headerTest);
      const response = await request(app)
        .get('/test')
        .set('Mixed-Case-Header', 'value')
        .set('UPPERCASE', 'value')
        .expect(200);
      const headerKeys = Object.keys(response.body.headers);
      headerKeys.forEach((key) => {
        expect(key).to.equal(key.toLowerCase());
      });
    });
  });

  describe('loggingMiddleware', () => {
    it('should log request information', async () => {
      const consoleSpy = sinon.stub(console, 'log');
      app.use(loggingMiddleware);
      app.get('/test', echo);
      await request(app).get('/test?foo=bar').expect(200);
      expect(consoleSpy.args.some((args) => String(args[0]).includes('Request:'))).to.equal(true);
      expect(consoleSpy.args.some((args) => String(args[0]).includes('Request headers:'))).to.equal(true);
      consoleSpy.restore();
    });

    it('should log response information', async () => {
      const consoleSpy = sinon.stub(console, 'log');
      app.use(loggingMiddleware);
      app.get('/test', echo);
      await request(app).get('/test').expect(200);
      expect(consoleSpy.args.some((args) => String(args[0]).includes('Response status:'))).to.equal(true);
      expect(consoleSpy.args.some((args) => String(args[0]).includes('Response headers:'))).to.equal(true);
      consoleSpy.restore();
    });

    it('should call next function', () => {
      const nextFn = sinon.stub();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockReq = {method: 'GET', originalUrl: '/test'} as any;
      const mockRes = {
        headersSent: true,
        statusCode: 200,
        on: sinon.stub().callsFake((event: string, cb: () => void) => {
          if (event === 'finish') cb();
        }),
        getHeaders: sinon.stub().returns({}),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      loggingMiddleware(mockReq, mockRes, nextFn);
      expect(nextFn.called).to.equal(true);
    });

    it('should handle responses without headers sent', () => {
      const consoleSpy = sinon.stub(console, 'log');
      const nextFn = sinon.stub();
      const mockReq = {method: 'GET', originalUrl: '/test', headers: {}} as never;
      const mockRes = {
        headersSent: false,
        statusCode: 200,
        on: sinon.stub().callsFake((event: string, cb: () => void) => {
          if (event === 'finish') cb();
        }),
        getHeaders: sinon.stub().returns({}),
      } as never;
      loggingMiddleware(mockReq, mockRes, nextFn);
      expect(nextFn.called).to.equal(true);
      consoleSpy.restore();
    });
  });

  describe('echo edge cases', () => {
    it('should handle POST requests with body', async () => {
      app.use(express.json());
      app.post('/test', echo);
      const response = await request(app).post('/test').send({foo: 'bar'}).expect(200);
      expect(response.body.body).to.deep.equal({foo: 'bar'});
    });

    it('should handle requests with complex headers', async () => {
      app.get('/test', echo);
      const response = await request(app)
        .get('/test')
        .set('X-Forwarded-For', '192.168.1.1')
        .set('User-Agent', 'Test-Agent')
        .set('Accept-Language', 'en-US,en;q=0.9');
      expect(response.body.headers).to.have.property('x-forwarded-for');
      expect(response.body.headers).to.have.property('user-agent');
      expect(response.body.headers).to.have.property('accept-language');
    });

    it('should handle IPv6 addresses', async () => {
      app.get('/test', echo);
      const response = await request(app).get('/test');
      expect(response.body.ip).to.not.be.undefined;
    });
  });

  describe('cacheTest edge cases', () => {
    it('should handle very large cache durations', async () => {
      app.get('/cache/:duration', cacheTest);
      const response = await request(app).get('/cache/999999').expect(200);
      expect(response.headers['cache-control']).to.equal('s-maxage=999999');
    });

    it('should handle zero duration', async () => {
      app.get('/cache/:duration', cacheTest);
      const response = await request(app).get('/cache/0').expect(200);
      expect(response.headers['cache-control']).to.equal('s-maxage=0');
    });

    it('should handle negative duration', async () => {
      app.get('/cache/:duration', cacheTest);
      const response = await request(app).get('/cache/-1').expect(200);
      expect(response.headers['cache-control']).to.equal('s-maxage=-1');
    });

    it('should handle float duration', async () => {
      app.get('/cache/:duration', cacheTest);
      const response = await request(app).get('/cache/60.5').expect(200);
      expect(response.headers['cache-control']).to.equal('s-maxage=60.5');
    });
  });

  describe('cookieTest edge cases', () => {
    it('should handle cookie without value', async () => {
      app.get('/test', cookieTest);
      const response = await request(app).get('/test?name=test-cookie').expect(200);
      expect(response.headers['set-cookie']).to.include('test-cookie=undefined; Path=/');
    });

    it('should handle empty cookie value', async () => {
      app.get('/test', cookieTest);
      const response = await request(app).get('/test?name=test-cookie&value=').expect(200);
      expect(response.headers['set-cookie']).to.satisfy(
        (v: string | string[]) => (Array.isArray(v) ? v.join(',') : v).includes('test-cookie=; Path=/'),
      );
    });

    it('should handle special characters in cookie values', async () => {
      app.get('/test', cookieTest);
      const response = await request(app).get('/test?name=test-cookie&value=test%20value!').expect(200);
      expect(response.headers['set-cookie']).to.not.be.undefined;
      const cookieVal = Array.isArray(response.headers['set-cookie'])
        ? response.headers['set-cookie'][0]
        : response.headers['set-cookie'];
      expect(cookieVal).to.include('test-cookie=');
    });
  });

  describe('responseHeadersTest edge cases', () => {
    it('should handle single header value', async () => {
      app.get('/test', responseHeadersTest);
      const response = await request(app).get('/test?header1=value1').expect(200);
      expect(response.headers.header1).to.equal('value1');
    });

    it('should handle multiple values for the same header', async () => {
      app.get('/test', responseHeadersTest);
      const response = await request(app).get('/test?header1=value1&header1=value2').expect(200);
      expect(response.headers.header1).to.not.be.undefined;
    });
  });

  describe('multiValueHeadersTest', () => {
    it('should set multi-value header with array of values', async () => {
      app.get('/test', multiValueHeadersTest);
      const response = await request(app).get('/test').expect(200);
      expect(response.headers['x-multi-value-header']).to.not.be.undefined;
      const headerValue = response.headers['x-multi-value-header'];
      expect(headerValue).to.include('value1');
      expect(headerValue).to.include('value2');
      expect(headerValue).to.include('value3');
    });

    it('should return JSON response with request info', async () => {
      app.get('/test', multiValueHeadersTest);
      const response = await request(app).get('/test?param1=value1').expect(200);
      expect(response.body).to.not.be.undefined;
      expect(typeof response.body).to.equal('object');
    });
  });

  describe('memoryTest edge cases', () => {
    it('should handle zero test count', async () => {
      app.get('/test', memoryTest);
      const response = await request(app).get('/test?count=0').expect(200);
      expect(response.body.additional_info.test_count).to.equal(0);
    });

    it('should handle very small test size', async () => {
      app.get('/test', memoryTest);
      const response = await request(app).get('/test?size=1').expect(200);
      expect(response.body.additional_info.test_size).to.equal(1);
    });

    it('should handle very large test size', async () => {
      app.get('/test', memoryTest);
      const response = await request(app).get('/test?size=1048576').expect(200);
      expect(response.body.additional_info.test_size).to.equal(1048576);
    });

    it('should handle fractional test count', async () => {
      app.get('/test', memoryTest);
      const response = await request(app).get('/test?count=5.5').expect(200);
      expect(response.body.additional_info.test_count).to.equal(5);
    });

    it('should handle multiple gc-related parameters', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).gc = sinon.stub();
      app.get('/test', memoryTest);
      const response = await request(app).get('/test?gc=true&forcegc=true').expect(200);
      expect(response.body.additional_info.force_gc).to.equal(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).gc;
    });
  });

  describe('streamingTest', () => {
    it('should set Content-Type header to text/plain', async () => {
      app.get('/test', streamingTest);
      const response = await request(app).get('/test').expect(200);
      expect(response.headers['content-type']).to.equal('text/plain');
    });

    it('should write multiple chunks to the response', async () => {
      app.get('/test', streamingTest);
      const response = await request(app).get('/test').expect(200);
      expect(response.text).to.include('Here is a streaming chunk0');
      expect(response.text).to.include('Here is a streaming chunk50');
      expect(response.text).to.include('Here is a streaming chunk99');
    });

    it('should write exactly 100 chunks', async () => {
      app.get('/test', streamingTest);
      const response = await request(app).get('/test').expect(200);
      const chunkMatches = response.text.match(/Here is a streaming chunk\d+/g);
      expect(chunkMatches).to.have.lengthOf(100);
    });

    it('should write chunks in sequential order', async () => {
      app.get('/test', streamingTest);
      const response = await request(app).get('/test').expect(200);
      for (let i = 0; i < 100; i++) {
        expect(response.text).to.include(`Here is a streaming chunk${i}`);
      }
    });

    it('should end the response after all chunks', async () => {
      app.get('/test', streamingTest);
      const response = await request(app).get('/test').expect(200);
      expect(response.text).to.be.ok;
    });
  });

  describe('setStatusTest', () => {
    it('should return 200 by default', async () => {
      app.get('/test', setStatusTest);
      const response = await request(app).get('/test').expect(200);
      expect(response.body).to.have.property('method');
      expect(response.headers['x-status-code']).to.equal('200');
    });

    it('should return custom status from query parameter', async () => {
      app.get('/test', setStatusTest);
      const response = await request(app).get('/test?status=201').expect(201);
      expect(response.headers['x-status-code']).to.equal('201');
    });

    it('should return 404 when status=404', async () => {
      app.get('/test', setStatusTest);
      await request(app).get('/test?status=404').expect(404);
    });

    it('should return 500 when status=500', async () => {
      app.get('/test', setStatusTest);
      await request(app).get('/test?status=500').expect(500);
    });
  });

  describe('ssrBundleFileTest', () => {
    it('should return JSON from file when read succeeds', async () => {
      (fs.readFile as sinon.SinonStub).resolves('{"message":"test content"}');
      app.get('/test', ssrBundleFileTest);
      const response = await request(app).get('/test').expect(200);
      expect(response.body).to.deep.equal({message: 'test content'});
    });

    it('should return 500 when file read fails', async () => {
      (fs.readFile as sinon.SinonStub).rejects(new Error('ENOENT'));
      app.get('/test', ssrBundleFileTest);
      const response = await request(app).get('/test').expect(500);
      expect(response.body).to.have.property('error');
    });
  });

  describe('streamingResponseLarge', () => {
    it('should return streaming: false when MRT_BUNDLE_TYPE is not stream', async () => {
      const originalEnv = process.env.MRT_BUNDLE_TYPE;
      delete process.env.MRT_BUNDLE_TYPE;
      app.get('/test', streamingResponseLarge);
      const response = await request(app).get('/test').expect(200);
      expect(response.body).to.deep.equal({streaming: false});
      if (originalEnv !== undefined) process.env.MRT_BUNDLE_TYPE = originalEnv;
    });

    it('should set status and content-type and write first chunk when MRT_BUNDLE_TYPE is stream', () => {
      const originalEnv = process.env.MRT_BUNDLE_TYPE;
      process.env.MRT_BUNDLE_TYPE = 'stream';
      const write = sinon.stub();
      const end = sinon.stub();
      const mockRes = {
        status: sinon.stub().returnsThis(),
        setHeader: sinon.stub(),
        write,
        end,
        flush: sinon.stub(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      streamingResponseLarge({} as never, mockRes);
      expect((mockRes.status as sinon.SinonStub).calledWith(200)).to.equal(true);
      expect((mockRes.setHeader as sinon.SinonStub).calledWith('Content-Type', 'text/plain')).to.equal(true);
      expect(write.calledWith('This is the first piece of streamed data.\n')).to.equal(true);
      if (originalEnv !== undefined) process.env.MRT_BUNDLE_TYPE = originalEnv;
      else delete process.env.MRT_BUNDLE_TYPE;
    });
  });

  describe('winstonLogging', () => {
    it('should run without throwing', () => {
      const mockReq = {} as never;
      const mockRes = {json: sinon.stub()} as never;
      expect(() => winstonLogging(mockReq, mockRes)).to.not.throw();
    });

    it('should log via console and return JSON response', () => {
      const consoleSpy = sinon.stub(console, 'log');
      const mockReq = {} as never;
      const mockRes = {json: sinon.stub()} as never;
      winstonLogging(mockReq, mockRes);
      expect(consoleSpy.called).to.equal(true);
      expect((mockRes as {json: sinon.SinonStub}).json.calledWith({message: 'Winston logging completed'})).to.equal(
        true,
      );
      consoleSpy.restore();
    });
  });

  describe('delayedLogging', () => {
    it('should return JSON with duration after delay', async () => {
      const clock = sinon.useFakeTimers();
      const mockReq = {query: {}} as never;
      const mockRes = {json: sinon.stub()} as never;
      const promise = delayedLogging(mockReq, mockRes);
      await clock.tickAsync(10000);
      await promise;
      expect(
        (mockRes as {json: sinon.SinonStub}).json.calledWith(
          sinon.match({message: 'Delayed logging 10000ms'}),
        ),
      ).to.equal(true);
      expect((mockRes as {json: sinon.SinonStub}).json.args[0][0]).to.have.property('duration');
      clock.restore();
    });
  });

  describe('massLogging', () => {
    it('should return 200 with duration and message using default count', async () => {
      app.get('/test', massLogging);
      const response = await request(app).get('/test').expect(200);
      expect(response.body).to.have.property('duration');
      expect(response.body).to.have.property('message', 'Mass logging 10000 logs');
    });

    it('should use custom count from query parameter', async () => {
      app.get('/test', massLogging);
      const response = await request(app).get('/test?count=100').expect(200);
      expect(response.body).to.have.property('duration');
      expect(response.body).to.have.property('message', 'Mass logging 100 logs');
    });

    it('should include size in response', async () => {
      app.get('/test', massLogging);
      const response = await request(app).get('/test?count=10').expect(200);
      expect(response.body).to.have.property('size');
      expect(response.body.size).to.match(/^\d+(\.\d+)?KB$/);
    });
  });

  describe('largeLogging', () => {
    it('should return 200 with duration, message and size', async () => {
      app.get('/test', largeLogging);
      const response = await request(app).get('/test?count=10').expect(200);
      expect(response.body).to.have.property('duration');
      expect(response.body).to.have.property('message', 'Large logging');
      expect(response.body).to.have.property('size');
      expect(response.body.size).to.match(/^\d+(\.\d+)?KB$/);
    });

    it('should use custom count from query parameter', async () => {
      app.get('/test', largeLogging);
      const response = await request(app).get('/test?count=50').expect(200);
      expect(response.body).to.have.property('duration');
      expect(response.body).to.have.property('message', 'Large logging');
      expect(response.body).to.have.property('size');
    });
  });

  describe('dataStoreTest', () => {
    let mockGetEntry: sinon.SinonStub;
    let mockIsDataStoreAvailable: sinon.SinonStub;
    let originalInstance: DataStore | null;

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originalInstance = (DataStore as any)._instance;
      mockGetEntry = sinon.stub();
      mockIsDataStoreAvailable = sinon.stub().returns(true);
      const mockDataStore = {getEntry: mockGetEntry, isDataStoreAvailable: mockIsDataStoreAvailable} as never;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (DataStore as any)._instance = mockDataStore;
    });

    afterEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (DataStore as any)._instance = originalInstance;
    });

    it('should return 200 with { dataStore: false } when the data store is unavailable', async () => {
      mockIsDataStoreAvailable.returns(false);
      app.get('/data-store/:key', dataStoreTest);
      const response = await request(app).get('/data-store/my-key').expect(200);
      expect(response.body).to.deep.equal({dataStore: false});
    });

    it('should return 200 with the entry when getEntry returns data', async () => {
      const entry = {key: 'my-key', value: {foo: 'bar'}};
      mockGetEntry.resolves(entry);
      app.get('/data-store/:key', dataStoreTest);
      const response = await request(app).get('/data-store/my-key').expect(200);
      expect(response.body).to.deep.equal(entry);
    });

    it('should return 400 when getEntry throws DataStoreUnavailableError', async () => {
      mockGetEntry.rejects(new DataStoreUnavailableError('The data store is unavailable.'));
      app.get('/data-store/:key', dataStoreTest);
      const response = await request(app).get('/data-store/my-key').expect(400);
      expect(response.body).to.have.property('error', 'The data store is unavailable.');
    });

    it('should return 404 when getEntry throws DataStoreNotFoundError', async () => {
      mockGetEntry.rejects(new DataStoreNotFoundError("Data store entry 'my-key' not found."));
      app.get('/data-store/:key', dataStoreTest);
      const response = await request(app).get('/data-store/my-key').expect(404);
      expect(response.body).to.have.property('error', "Data store entry 'my-key' not found.");
    });

    it('should return 500 when getEntry throws DataStoreServiceError', async () => {
      mockGetEntry.rejects(new DataStoreServiceError('Data store request failed.'));
      app.get('/data-store/:key', dataStoreTest);
      const response = await request(app).get('/data-store/my-key').expect(500);
      expect(response.body).to.have.property('error', 'Data store request failed.');
    });
  });

  describe('secretsManagerTest', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const secretsManagerMock: any = mockClient(SecretsManagerClient as any);

    beforeEach(() => {
      secretsManagerMock.reset();
    });

    it('should return 400 when secretId is missing', async () => {
      app.get('/test', secretsManagerTest);
      const response = await request(app).get('/test').expect(400);
      expect(response.body).to.deep.equal({error: 'Missing required query parameter: secretId'});
    });

    it('should return 200 with secret metadata on success', async () => {
      secretsManagerMock.on(GetSecretValueCommand).resolves({
        ARN: 'arn:aws:secretsmanager:us-west-2:123456789:secret:test-secret',
        VersionId: 'version-123',
        SecretString: 'secret-value',
      });
      app.get('/test', secretsManagerTest);
      const response = await request(app).get('/test?secretId=test-secret').expect(200);
      expect(response.body).to.deep.equal({
        success: true,
        secretId: 'test-secret',
        arn: 'arn:aws:secretsmanager:us-west-2:123456789:secret:test-secret',
        versionId: 'version-123',
        hasSecretString: true,
        hasSecretBinary: false,
      });
    });

    it('should return 200 with binary secret metadata', async () => {
      secretsManagerMock.on(GetSecretValueCommand).resolves({
        ARN: 'arn:aws:secretsmanager:us-west-2:123456789:secret:binary-secret',
        VersionId: 'version-456',
        SecretBinary: Buffer.from('binary-data'),
      });
      app.get('/test', secretsManagerTest);
      const response = await request(app).get('/test?secretId=binary-secret').expect(200);
      expect(response.body).to.deep.equal({
        success: true,
        secretId: 'binary-secret',
        arn: 'arn:aws:secretsmanager:us-west-2:123456789:secret:binary-secret',
        versionId: 'version-456',
        hasSecretString: false,
        hasSecretBinary: true,
      });
    });

    it('should return 404 when secret is not found', async () => {
      secretsManagerMock.on(GetSecretValueCommand).rejects({name: 'ResourceNotFoundException', message: 'Secret not found'});
      app.get('/test', secretsManagerTest);
      const response = await request(app).get('/test?secretId=nonexistent').expect(404);
      expect(response.body).to.deep.equal({
        success: false,
        error: 'Secret not found',
        errorCode: 'ResourceNotFoundException',
        secretId: 'nonexistent',
      });
    });

    it('should return 403 when access is denied', async () => {
      secretsManagerMock.on(GetSecretValueCommand).rejects({name: 'AccessDeniedException', message: 'User is not authorized to perform action'});
      app.get('/test', secretsManagerTest);
      const response = await request(app).get('/test?secretId=forbidden-secret').expect(403);
      expect(response.body).to.deep.equal({
        success: false,
        error: 'User is not authorized to perform action',
        errorCode: 'AccessDeniedException',
        secretId: 'forbidden-secret',
      });
    });

    it('should return 400 for invalid request', async () => {
      secretsManagerMock.on(GetSecretValueCommand).rejects({name: 'InvalidRequestException', message: 'Invalid request'});
      app.get('/test', secretsManagerTest);
      const response = await request(app).get('/test?secretId=invalid').expect(400);
      expect(response.body).to.deep.equal({
        success: false,
        error: 'Invalid request',
        errorCode: 'InvalidRequestException',
        secretId: 'invalid',
      });
    });

    it('should return 500 for decryption failure', async () => {
      secretsManagerMock.on(GetSecretValueCommand).rejects({name: 'DecryptionFailure', message: 'Failed to decrypt secret'});
      app.get('/test', secretsManagerTest);
      const response = await request(app).get('/test?secretId=encrypted-secret').expect(500);
      expect(response.body).to.deep.equal({
        success: false,
        error: 'Failed to decrypt secret',
        errorCode: 'DecryptionFailure',
        secretId: 'encrypted-secret',
      });
    });

    it('should return 500 for unknown errors', async () => {
      secretsManagerMock.on(GetSecretValueCommand).rejects({name: 'UnknownError', message: 'Something went wrong'});
      app.get('/test', secretsManagerTest);
      const response = await request(app).get('/test?secretId=test-secret').expect(500);
      expect(response.body).to.deep.equal({
        success: false,
        error: 'Something went wrong',
        errorCode: 'UnknownError',
        secretId: 'test-secret',
      });
    });
  });

  describe('proxyTransformationTest', () => {
    it('should return success when all validations pass', async () => {
      app.get('/test', proxyTransformationTest);
      const response = await request(app)
        .get('/test')
        .set('x-site-id', 'test-site')
        .set('authorization', 'Bearer token123')
        .set('sfdc_dwsid', 'session456')
        .set('cookie', 'cc-at_test-site=token123; dwsid=session456')
        .expect(200);
      expect(response.body).to.deep.equal({
        success: true,
        validations: {
          siteIdPresent: true,
          siteId: 'test-site',
          authHeaderPresent: true,
          authHeader: 'Bearer token123',
          expectedCookieName: 'cc-at_test-site',
          expectedCookieValue: 'token123',
          authHeaderMatchesCookie: true,
          sfdc_dwsidPresent: true,
          sfdc_dwsidValue: 'session456',
          dwsidPresent: true,
          dwsidValue: 'session456',
          sfdc_dwsidMatchesDwsid: true,
        },
        allCookies: {'cc-at_test-site': 'token123', dwsid: 'session456'},
        headers: {
          'x-site-id': 'test-site',
          authorization: 'Bearer token123',
          cookie: 'cc-at_test-site=token123; dwsid=session456',
          sfdc_dwsid: 'session456',
        },
      });
    });

    it('should return failure when site ID is missing', async () => {
      app.get('/test', proxyTransformationTest);
      const response = await request(app)
        .get('/test')
        .set('authorization', 'Bearer token123')
        .set('sfdc_dwsid', 'session456')
        .set('cookie', 'dwsid=session456')
        .expect(200);
      expect(response.body.success).to.equal(false);
      expect(response.body.validations.siteIdPresent).to.equal(false);
    });

    it('should return failure when authorization header is missing', async () => {
      app.get('/test', proxyTransformationTest);
      const response = await request(app)
        .get('/test')
        .set('x-site-id', 'test-site')
        .set('sfdc_dwsid', 'session456')
        .set('cookie', 'cc-at_test-site=token123; dwsid=session456')
        .expect(200);
      expect(response.body.success).to.equal(false);
      expect(response.body.validations.authHeaderPresent).to.equal(false);
    });

    it('should return failure when authorization header does not match cookie', async () => {
      app.get('/test', proxyTransformationTest);
      const response = await request(app)
        .get('/test')
        .set('x-site-id', 'test-site')
        .set('authorization', 'Bearer wrong-token')
        .set('sfdc_dwsid', 'session456')
        .set('cookie', 'cc-at_test-site=token123; dwsid=session456')
        .expect(200);
      expect(response.body.success).to.equal(false);
      expect(response.body.validations.authHeaderMatchesCookie).to.equal(false);
    });

    it('should return failure when sfdc_dwsid header is missing', async () => {
      app.get('/test', proxyTransformationTest);
      const response = await request(app)
        .get('/test')
        .set('x-site-id', 'test-site')
        .set('authorization', 'Bearer token123')
        .set('cookie', 'cc-at_test-site=token123; dwsid=session456')
        .expect(200);
      expect(response.body.success).to.equal(false);
      expect(response.body.validations.sfdc_dwsidPresent).to.equal(false);
    });

    it('should return failure when dwsid cookie is missing', async () => {
      app.get('/test', proxyTransformationTest);
      const response = await request(app)
        .get('/test')
        .set('x-site-id', 'test-site')
        .set('authorization', 'Bearer token123')
        .set('sfdc_dwsid', 'session456')
        .set('cookie', 'cc-at_test-site=token123')
        .expect(200);
      expect(response.body.success).to.equal(false);
      expect(response.body.validations.dwsidPresent).to.equal(false);
    });

    it('should return failure when sfdc_dwsid and dwsid do not match', async () => {
      app.get('/test', proxyTransformationTest);
      const response = await request(app)
        .get('/test')
        .set('x-site-id', 'test-site')
        .set('authorization', 'Bearer token123')
        .set('sfdc_dwsid', 'different-session')
        .set('cookie', 'cc-at_test-site=token123; dwsid=session456')
        .expect(200);
      expect(response.body.success).to.equal(false);
      expect(response.body.validations.sfdc_dwsidMatchesDwsid).to.equal(false);
    });

    it('should handle requests with no cookies', async () => {
      app.get('/test', proxyTransformationTest);
      const response = await request(app)
        .get('/test')
        .set('x-site-id', 'test-site')
        .set('authorization', 'Bearer token123')
        .set('sfdc_dwsid', 'session456')
        .expect(200);
      expect(response.body.success).to.equal(false);
      expect(response.body.allCookies).to.deep.equal({});
    });

    it('should parse cookies with spaces correctly', async () => {
      app.get('/test', proxyTransformationTest);
      const response = await request(app)
        .get('/test')
        .set('x-site-id', 'test-site')
        .set('authorization', 'Bearer token123')
        .set('sfdc_dwsid', 'session456')
        .set('cookie', 'cc-at_test-site=token123;  dwsid=session456')
        .expect(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.allCookies).to.deep.equal({'cc-at_test-site': 'token123', dwsid: 'session456'});
    });
  });
});
