/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {Application, Request, Response, NextFunction, RequestHandler} from 'express';
import fs from 'fs';
import path from 'path';
import http from 'node:http';
import os from 'node:os';
import {expect} from 'chai';
import sinon from 'sinon';
import {expressVersions} from './helpers/express-versions.js';
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

const startServer = async (app: Application): Promise<{server: http.Server; baseUrl: string}> => {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'string' ? 0 : address?.port;
      resolve({server, baseUrl: `http://127.0.0.1:${port}`});
    });
  });
};

const requestJson = async (
  baseUrl: string,
  requestPath: string,
  options?: {headers?: Record<string, string>},
): Promise<{status: number; headers: http.IncomingHttpHeaders; body: unknown}> => {
  return new Promise((resolve, reject) => {
    const url = new URL(requestPath, baseUrl);
    const req = http.request(
      url,
      {
        method: 'GET',
        headers: options?.headers,
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          const parsed = data ? JSON.parse(data) : null;
          resolve({status: res.statusCode ?? 0, headers: res.headers, body: parsed});
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
};

const requestText = async (
  baseUrl: string,
  requestPath: string,
): Promise<{status: number; headers: http.IncomingHttpHeaders; body: string}> => {
  return new Promise((resolve, reject) => {
    const url = new URL(requestPath, baseUrl);
    const req = http.request(url, {method: 'GET'}, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf-8'),
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
};

describe('middleware', () => {
  expressVersions.forEach(({label, express}) => {
    describe(`middleware (${label})`, () => {
      let mockRequest: Partial<Request>;
      let mockResponse: MockResponse;
      let mockNext: NextFunction & sinon.SinonStub;
      let expressLib: (typeof expressVersions)[number]['express'];

      beforeEach(() => {
        expressLib = express;
        mockRequest = {
          originalUrl: '/test',
          method: 'GET',
          headers: {},
          query: {},
          app: {set: sinon.stub()} as unknown as Application,
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
          await new Promise<void>((resolve) => {
            mockNext.callsFake(() => resolve());
            middleware(mockRequest as Request, mockResponse as Response, mockNext);
          });

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

          await new Promise<void>((resolve) => {
            mockNext.callsFake(() => resolve());
            middleware(testRequest, mockResponse as Response, mockNext);
          });

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

          await new Promise<void>((resolve) => {
            mockNext.callsFake(() => resolve());
            middleware(mockRequest as Request, mockResponse as Response, mockNext);
          });

          expect((mockRequest as Request).headers['x-api-key']).to.be.undefined;
          expect((mockRequest as Request).headers['x-mobify-access-key']).to.be.undefined;
          expect((mockRequest as Request).headers['x-sfdc-access-control']).to.equal('control');
          expect((mockRequest as Request).headers['content-type']).to.equal('application/json');
        });

        it('sets X_MOBIFY_REQUEST_PROCESSOR_LOCAL header after processing', async () => {
          sinon.stub(fs, 'existsSync').returns(false);
          const middleware = createMRTRequestProcessorMiddleware('/path/to/processor.js', []);

          (mockRequest as Request).headers = {};
          (mockRequest as Request).originalUrl = '/test';

          await new Promise<void>((resolve) => {
            mockNext.callsFake(() => resolve());
            middleware(mockRequest as Request, mockResponse as Response, mockNext);
          });

          expect((mockRequest as Request).headers[X_MOBIFY_REQUEST_PROCESSOR_LOCAL]).to.equal('true');
          expect(mockNext.calledOnce).to.be.true;
        });

        it('forwards request processor errors via next', async () => {
          const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mrt-processor-'));
          const processorPath = path.join(tempDir, 'processor.mjs');
          fs.writeFileSync(processorPath, "export function processRequest() { throw new Error('boom'); }", 'utf-8');

          const middleware = createMRTRequestProcessorMiddleware(processorPath, []);

          const testRequest = {
            ...mockRequest,
            path: '/test',
          } as Request;

          let nextStub: sinon.SinonStub | undefined;
          await new Promise<void>((resolve) => {
            nextStub = sinon.stub().callsFake(() => {
              resolve();
            });
            middleware(testRequest, mockResponse as Response, nextStub as unknown as NextFunction);
          });

          if (!nextStub) {
            throw new Error('Expected next to be called');
          }
          expect(nextStub.calledOnce).to.be.true;
          expect(nextStub.getCall(0).args[0]).to.be.instanceOf(Error);
        });
      });

      describe('createMRTProxyMiddlewares', () => {
        const mockProxyFn = sinon.stub() as unknown as RequestHandler & {upgrade: sinon.SinonStub};
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
        it('creates express static middleware', () => {
          const result = createMRTStaticAssetServingMiddleware('/static');

          expect(result).to.be.a('function');
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

      describe('express integration', () => {
        it('updates query from x-mobify-querystring header', async () => {
          const app = expressLib();
          app.use(createMRTRequestProcessorMiddleware(undefined, []));
          app.get('/test', (req, res) => {
            res.json({
              originalUrl: req.originalUrl,
              query: req.query,
              header: req.headers[X_MOBIFY_QUERYSTRING],
            });
          });

          const {server, baseUrl} = await startServer(app);
          try {
            const response = await requestJson(baseUrl, '/test?foo=1', {
              headers: {
                [X_MOBIFY_QUERYSTRING]: 'bar=2',
              },
            });

            expect(response.status).to.equal(200);
            const body = response.body as {originalUrl: string; query: Record<string, string>; header?: string};
            expect(body.originalUrl).to.equal('/test?bar=2');
            expect(body.query).to.deep.equal({bar: '2'});
            expect(body.header).to.be.undefined;
          } finally {
            server.close();
          }
        });

        it('cleanup middleware updates query when request processor is not used', async () => {
          const app = expressLib();
          app.use(createMRTCleanUpMiddleware());
          app.get('/test', (req, res) => {
            res.json({
              originalUrl: req.originalUrl,
              query: req.query,
              header: req.headers[X_MOBIFY_QUERYSTRING],
            });
          });

          const {server, baseUrl} = await startServer(app);
          try {
            const response = await requestJson(baseUrl, '/test?foo=1', {
              headers: {
                [X_MOBIFY_QUERYSTRING]: 'bar=2',
              },
            });

            expect(response.status).to.equal(200);
            const body = response.body as {originalUrl: string; query: Record<string, string>; header?: string};
            expect(body.originalUrl).to.equal('/test?bar=2');
            expect(body.query).to.deep.equal({bar: '2'});
            expect(body.header).to.be.undefined;
          } finally {
            server.close();
          }
        });

        it('serves static assets with MRT headers', async () => {
          const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mrt-static-'));
          const filePath = path.join(tempDir, 'test.txt');
          fs.writeFileSync(filePath, 'hello', 'utf-8');

          const app = expressLib();
          app.use('/static', createMRTStaticAssetServingMiddleware(tempDir));

          const {server, baseUrl} = await startServer(app);
          try {
            const response = await requestText(baseUrl, '/static/test.txt');

            expect(response.status).to.equal(200);
            expect(response.body).to.equal('hello');
            expect(response.headers['cache-control']).to.equal('max-age=0, nocache, nostore, must-revalidate');
            expect(response.headers['content-type']).to.include('text/plain');
            expect(response.headers.etag).to.exist;
          } finally {
            server.close();
          }
        });
      });
    });
  });
});
