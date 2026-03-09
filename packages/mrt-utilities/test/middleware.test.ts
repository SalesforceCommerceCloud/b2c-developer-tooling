/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import express, {type Request, type Response, type NextFunction} from 'express';
import fs from 'fs';
import path from 'path';
import {expect} from 'chai';
import sinon from 'sinon';
import {
  createMRTRequestProcessorMiddleware,
  createMRTProxyMiddlewares,
  setLocalAssetHeaders,
  createMRTStaticAssetServingMiddleware,
  createMRTCommonMiddleware,
  createMRTCleanUpMiddleware,
  X_MOBIFY_REQUEST_PROCESSOR_LOCAL,
  X_MOBIFY_QUERYSTRING,
} from '@salesforce/mrt-utilities';

interface MockResponse extends Partial<Response> {
  sendStatus: sinon.SinonStub;
  set: sinon.SinonStub;
}

describe('middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: MockResponse;
  let mockNext: NextFunction & sinon.SinonStub;

  beforeEach(() => {
    mockRequest = {
      originalUrl: '/test',
      method: 'GET',
      headers: {},
      query: {},
      app: {set: sinon.stub()} as unknown as express.Application,
    } as Partial<Request>;

    mockResponse = {
      sendStatus: sinon.stub(),
      redirect: sinon.stub(),
      set: sinon.stub(),
      locals: {},
    } as unknown as MockResponse;
    mockNext = sinon.stub() as NextFunction & sinon.SinonStub;
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createMRTRequestProcessorMiddleware', () => {
    it('creates middleware that processes requests', () => {
      const middleware = createMRTRequestProcessorMiddleware('/path/to/processor.js', []);
      expect(middleware).to.be.a('function');
    });

    it('skips processing for proxy or bundle paths', async () => {
      const stubExists = sinon.stub(fs, 'existsSync').returns(false);
      const middleware = createMRTRequestProcessorMiddleware('/path/to/processor.js', []);

      (mockRequest as Request).originalUrl = '/mobify/proxy/api/test';
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext.calledOnce).to.be.true;
      stubExists.restore();
    });

    it('rejects non-GET/HEAD/OPTIONS requests to root path', async () => {
      sinon.stub(fs, 'existsSync').returns(false);
      const middleware = createMRTRequestProcessorMiddleware('/path/to/processor.js', []);

      const testRequest = {
        ...mockRequest,
        path: '/',
        method: 'POST',
      } as Request;

      await middleware(testRequest, mockResponse as Response, mockNext);

      expect(mockResponse.sendStatus.calledWith(405)).to.be.true;
      expect(mockNext.called).to.be.false;
    });

    it('allows GET requests to root path', async () => {
      sinon.stub(fs, 'existsSync').returns(false);
      const middleware = createMRTRequestProcessorMiddleware('/path/to/processor.js', []);

      const testRequest = {
        ...mockRequest,
        path: '/',
        method: 'GET',
      } as Request;

      await middleware(testRequest, mockResponse as Response, mockNext);

      expect(mockResponse.sendStatus.called).to.be.false;
      expect(mockNext.calledOnce).to.be.true;
    });

    it('removes API Gateway headers', async () => {
      sinon.stub(fs, 'existsSync').returns(false);
      const middleware = createMRTRequestProcessorMiddleware('/path/to/processor.js', []);

      (mockRequest as Request).headers = {
        'x-api-key': 'secret',
        'x-mobify-access-key': 'mobify-secret',
        'x-apigateway-event': '{}',
        'x-apigateway-context': '{}',
        'x-sfdc-access-control': 'control',
        'content-type': 'application/json',
      };

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as Request).headers['x-api-key']).to.be.undefined;
      expect((mockRequest as Request).headers['x-mobify-access-key']).to.be.undefined;
      expect((mockRequest as Request).headers['content-type']).to.equal('application/json');
    });

    it('sets X_MOBIFY_REQUEST_PROCESSOR_LOCAL header after processing', async () => {
      sinon.stub(fs, 'existsSync').returns(false);
      const middleware = createMRTRequestProcessorMiddleware('/path/to/processor.js', []);

      (mockRequest as Request).headers = {};
      (mockRequest as Request).originalUrl = '/test';

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as Request).headers[X_MOBIFY_REQUEST_PROCESSOR_LOCAL]).to.equal('true');
      expect(mockNext.calledOnce).to.be.true;
    });
  });

  describe('createMRTProxyMiddlewares', () => {
    const mockProxyFn = sinon.stub() as unknown as express.RequestHandler & {upgrade: sinon.SinonStub};
    mockProxyFn.upgrade = sinon.stub();

    it('creates proxy middlewares with createProxyFn', () => {
      const createProxyFn = sinon.stub().returns(mockProxyFn);
      const proxyConfigs = [{host: 'https://api.example.com', path: 'api'}];

      const result = createMRTProxyMiddlewares(proxyConfigs, 'https', false, createProxyFn);

      expect(result).to.have.length(1);
      expect(result[0].path).to.equal('/mobify/proxy/api');
      expect(result[0].fn).to.equal(mockProxyFn);
    });

    it('includes caching middlewares when requested', () => {
      const createProxyFn = sinon.stub().returns(mockProxyFn);
      const proxyConfigs = [{host: 'https://api.example.com', path: 'api'}];

      const result = createMRTProxyMiddlewares(proxyConfigs, 'https', true, createProxyFn);

      expect(result).to.have.length(2);
      expect(result[0].path).to.equal('/mobify/proxy/api');
      expect(result[1].path).to.equal('/mobify/caching/api');
    });

    it('returns empty array for null proxy configs', () => {
      const result = createMRTProxyMiddlewares(
        null as unknown as import('@salesforce/mrt-utilities').ProxyConfig[],
        'https',
        false,
      );

      expect(result).to.deep.equal([]);
    });
  });

  describe('setLocalAssetHeaders', () => {
    beforeEach(() => {
      sinon.stub(path, 'basename').returns('test.js');
      sinon.stub(fs, 'statSync').returns({
        mtime: new Date('2023-01-01T00:00:00Z'),
      } as fs.Stats);
    });

    it('sets correct headers for asset', () => {
      setLocalAssetHeaders(mockResponse as Response, '/path/to/test.js');

      expect((path.basename as sinon.SinonStub).calledWith('/path/to/test.js')).to.be.true;
      expect(mockResponse.set.calledWith('content-type', 'text/javascript')).to.be.true;
      expect(mockResponse.set.calledWith('etag', '1672531200000')).to.be.true;
    });
  });

  describe('createMRTStaticAssetServingMiddleware', () => {
    it('creates express static middleware with correct options', () => {
      const mockStaticMiddleware = sinon.stub();
      const staticStub = sinon.stub(express, 'static');
      staticStub.returns(mockStaticMiddleware as unknown as ReturnType<typeof express.static>);

      const result = createMRTStaticAssetServingMiddleware('/static');

      expect(staticStub.calledWith('/static', sinon.match.has('dotfiles', 'deny'))).to.be.true;
      expect(result as unknown).to.equal(mockStaticMiddleware);
    });
  });

  describe('createMRTCommonMiddleware', () => {
    it('creates a middleware function', () => {
      const middleware = createMRTCommonMiddleware();
      expect(middleware).to.be.a('function');
    });

    it('sets host header to EXTERNAL_DOMAIN_NAME when set', () => {
      const originalEnv = process.env.EXTERNAL_DOMAIN_NAME;
      process.env.EXTERNAL_DOMAIN_NAME = 'external.example.com';

      const middleware = createMRTCommonMiddleware();
      const testRequest = {...mockRequest, headers: {}} as Request;

      middleware(testRequest, mockResponse as Response, mockNext);

      expect(testRequest.headers!.host).to.equal('external.example.com');
      expect(mockNext.calledOnce).to.be.true;

      if (originalEnv !== undefined) {
        process.env.EXTERNAL_DOMAIN_NAME = originalEnv;
      } else {
        delete process.env.EXTERNAL_DOMAIN_NAME;
      }
    });

    it('defaults to localhost:2401 when EXTERNAL_DOMAIN_NAME is not set', () => {
      const originalEnv = process.env.EXTERNAL_DOMAIN_NAME;
      delete process.env.EXTERNAL_DOMAIN_NAME;

      const middleware = createMRTCommonMiddleware();
      const testRequest = {...mockRequest, headers: {}} as Request;

      middleware(testRequest, mockResponse as Response, mockNext);

      expect(testRequest.headers!.host).to.equal('localhost:2401');

      if (originalEnv !== undefined) {
        process.env.EXTERNAL_DOMAIN_NAME = originalEnv;
      }
    });
  });

  describe('createMRTCleanUpMiddleware', () => {
    it('creates a middleware function', () => {
      const middleware = createMRTCleanUpMiddleware();
      expect(middleware).to.be.a('function');
    });

    it('removes X_MOBIFY_REQUEST_PROCESSOR_LOCAL header', async () => {
      const middleware = createMRTCleanUpMiddleware();

      (mockRequest as Request).headers = {[X_MOBIFY_REQUEST_PROCESSOR_LOCAL]: 'true'};

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as Request).headers[X_MOBIFY_REQUEST_PROCESSOR_LOCAL]).to.be.undefined;
      expect(mockNext.calledOnce).to.be.true;
    });

    it('removes X_MOBIFY_QUERYSTRING header', async () => {
      const middleware = createMRTCleanUpMiddleware();

      (mockRequest as Request).headers = {[X_MOBIFY_QUERYSTRING]: 'test=value'};

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as Request).headers[X_MOBIFY_QUERYSTRING]).to.be.undefined;
      expect(mockNext.calledOnce).to.be.true;
    });
  });
});
