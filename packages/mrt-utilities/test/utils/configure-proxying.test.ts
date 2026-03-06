/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {IncomingMessage, ClientRequest} from 'http';
import {expect} from 'chai';
import sinon from 'sinon';
import {
  applyProxyRequestHeaders,
  configureProxy,
  configureProxying,
  type ProxyConfig,
  type CreateProxyMiddlewareFn,
} from '../../src/utils/configure-proxying.js';

describe('proxying', () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe('applyProxyRequestHeaders', () => {
    let mockProxyRequest: {setHeader: sinon.SinonStub; removeHeader: sinon.SinonStub};
    let mockIncomingRequest: {headers: Record<string, string>};

    beforeEach(() => {
      mockProxyRequest = {
        setHeader: sinon.stub(),
        removeHeader: sinon.stub(),
      };
      mockIncomingRequest = {
        headers: {
          'content-type': 'application/json',
          'user-agent': 'test-agent',
          'x-custom-header': 'test-value',
        },
      };
    });

    it('applies rewritten headers to proxy request', () => {
      const mockRewrittenHeaders = {
        'content-type': 'application/json',
        'user-agent': 'modified-agent',
        'x-new-header': 'new-value',
      };

      applyProxyRequestHeaders({
        proxyRequest: mockProxyRequest as unknown as ClientRequest,
        incomingRequest: mockIncomingRequest as unknown as IncomingMessage,
        caching: false,
        proxyPath: '/test',
        targetHost: 'example.com',
        targetProtocol: 'https',
        rewriteRequestHeaders: () => mockRewrittenHeaders,
      });

      expect(mockProxyRequest.setHeader.calledWith('content-type', 'application/json')).to.be.true;
      expect(mockProxyRequest.setHeader.calledWith('user-agent', 'modified-agent')).to.be.true;
      expect(mockProxyRequest.setHeader.calledWith('x-new-header', 'new-value')).to.be.true;
    });

    it('removes headers that are not in rewritten headers', () => {
      const mockRewrittenHeaders = {
        'content-type': 'application/json',
        'x-new-header': 'new-value',
      };

      applyProxyRequestHeaders({
        proxyRequest: mockProxyRequest as unknown as ClientRequest,
        incomingRequest: mockIncomingRequest as unknown as IncomingMessage,
        caching: true,
        proxyPath: '/test',
        targetHost: 'example.com',
        targetProtocol: 'http',
        rewriteRequestHeaders: () => mockRewrittenHeaders,
      });

      expect(mockProxyRequest.removeHeader.calledWith('user-agent')).to.be.true;
      expect(mockProxyRequest.removeHeader.calledWith('x-custom-header')).to.be.true;
    });

    it('handles empty headers object', () => {
      mockIncomingRequest.headers = {};

      applyProxyRequestHeaders({
        proxyRequest: mockProxyRequest as unknown as ClientRequest,
        incomingRequest: mockIncomingRequest as unknown as IncomingMessage,
        caching: false,
        proxyPath: '/test',
        targetHost: 'example.com',
        targetProtocol: 'https',
        rewriteRequestHeaders: () => ({}),
      });

      expect(mockProxyRequest.setHeader.called).to.be.false;
      expect(mockProxyRequest.removeHeader.called).to.be.false;
    });
  });

  describe('configureProxy', () => {
    let mockProxyMiddleware: sinon.SinonStub;
    let createProxyFn: CreateProxyMiddlewareFn & sinon.SinonStub;

    beforeEach(() => {
      mockProxyMiddleware = sinon.stub();
      createProxyFn = sinon
        .stub()
        .returns(
          mockProxyMiddleware as unknown as import('http-proxy-middleware').RequestHandler,
        ) as CreateProxyMiddlewareFn & sinon.SinonStub;
    });

    it('creates proxy middleware with correct configuration', () => {
      const params = {
        appHostname: 'localhost:3000',
        proxyPath: '/api',
        targetProtocol: 'https',
        targetHost: 'api.example.com',
        appProtocol: 'http',
        caching: false,
      };

      const result = configureProxy(params, createProxyFn);

      expect(createProxyFn.calledOnce).to.be.true;
      const config = createProxyFn.firstCall.args[0];
      expect(config).to.include({
        changeOrigin: true,
        cookiePathRewrite: false,
        followRedirects: false,
        target: 'https://api.example.com',
      });
      expect(config.cookieDomainRewrite).to.deep.equal({targetHost: 'localhost:3000'});
      expect(result).to.deep.equal({
        fn: mockProxyMiddleware,
        path: '/api',
      });
    });

    it('handles error in proxy request', () => {
      const params = {
        appHostname: 'localhost:3000',
        proxyPath: '/api',
        targetProtocol: 'https',
        targetHost: 'api.example.com',
        caching: false,
      };

      configureProxy(params, createProxyFn);

      const config = createProxyFn.firstCall.args[0];
      const mockRes = {
        writeHead: sinon.stub(),
        end: sinon.stub(),
      };
      const mockReq = {url: '/api/test'};
      const error = new Error('Connection failed');

      config.onError(error, mockReq as IncomingMessage, mockRes as unknown as import('http').ServerResponse);

      expect(
        mockRes.writeHead.calledWith(500, {
          'Content-Type': 'text/plain',
        }),
      ).to.be.true;
      expect(mockRes.end.calledWith('Error in proxy request to /api/test: Error: Connection failed')).to.be.true;
    });
  });

  describe('configureProxying', () => {
    let mockProxyMiddleware: sinon.SinonStub;
    let createProxyFn: CreateProxyMiddlewareFn & sinon.SinonStub;

    beforeEach(() => {
      mockProxyMiddleware = sinon.stub();
      createProxyFn = sinon
        .stub()
        .returns(
          mockProxyMiddleware as unknown as import('http-proxy-middleware').RequestHandler,
        ) as CreateProxyMiddlewareFn & sinon.SinonStub;
    });

    it('configures multiple proxies correctly', () => {
      const proxyConfigs: ProxyConfig[] = [
        {host: 'https://api1.example.com', path: '/api1'},
        {host: 'http://api2.example.com', path: '/api2'},
        {host: 'https://api3.example.com', path: '/api3'},
      ];

      const result = configureProxying(proxyConfigs, 'localhost:3000', 'http', createProxyFn);

      expect(result).to.have.length(3);
      expect(result[0]).to.deep.equal({fn: mockProxyMiddleware, path: '/api1'});
      expect(result[1]).to.deep.equal({fn: mockProxyMiddleware, path: '/api2'});
      expect(result[2]).to.deep.equal({fn: mockProxyMiddleware, path: '/api3'});
      expect(createProxyFn.callCount).to.equal(3);
    });

    it('handles empty proxy configs array', () => {
      const result = configureProxying([], 'localhost:3000', undefined, createProxyFn);

      expect(result).to.have.length(0);
      expect(createProxyFn.called).to.be.false;
    });

    it('correctly parses HTTPS hosts', () => {
      const proxyConfigs: ProxyConfig[] = [{host: 'https://secure.example.com', path: '/secure'}];

      configureProxying(proxyConfigs, 'localhost:3000', undefined, createProxyFn);

      expect(createProxyFn.firstCall.args[0]).to.include({
        target: 'https://secure.example.com',
      });
    });

    it('correctly parses HTTP hosts', () => {
      const proxyConfigs: ProxyConfig[] = [{host: 'http://insecure.example.com', path: '/insecure'}];

      configureProxying(proxyConfigs, 'localhost:3000', undefined, createProxyFn);

      expect(createProxyFn.firstCall.args[0]).to.include({
        target: 'http://insecure.example.com',
      });
    });

    it('handles hosts without protocol (default to http)', () => {
      const proxyConfigs: ProxyConfig[] = [{host: 'example.com', path: '/api'}];

      configureProxying(proxyConfigs, 'localhost:3000', undefined, createProxyFn);

      expect(createProxyFn.firstCall.args[0]).to.include({
        target: 'http://example.com',
      });
    });
  });
});
