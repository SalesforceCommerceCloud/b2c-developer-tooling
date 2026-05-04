/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import request from 'supertest';
import {expect} from 'chai';
import sinon from 'sinon';
import {mockClient} from 'aws-sdk-client-mock';
import {LambdaClient} from '@aws-sdk/client-lambda';
import {S3Client} from '@aws-sdk/client-s3';
import {CloudWatchLogsClient} from '@aws-sdk/client-cloudwatch-logs';
import {MetricsSender} from '@salesforce/mrt-utilities';
import {createApp} from './server.js';

describe('server', () => {
  const lambdaMock = mockClient(LambdaClient);
  const s3Mock = mockClient(S3Client);
  const logsMock = mockClient(CloudWatchLogsClient);

  beforeEach(() => {
    lambdaMock.reset();
    s3Mock.reset();
    logsMock.reset();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createApp', () => {
    it('should create an Express app', () => {
      const app = createApp();
      expect(app).to.not.be.undefined;
      expect(typeof app.get).to.equal('function');
      expect(typeof app.use).to.equal('function');
      expect(typeof app.all).to.equal('function');
    });

    it('should create app without MRT middleware by default', () => {
      const app = createApp();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const routes = (app as any)._router?.stack || [];
      const hasMRTMiddleware = routes.some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (route: any) => route?.handle?.name?.includes('mrt') || route?.handle?.name?.includes('MRT'),
      );
      expect(hasMRTMiddleware).to.equal(false);
    });

    it('should disable x-powered-by header', async () => {
      const app = createApp();
      const response = await request(app).get('/test');
      expect(response.headers['x-powered-by']).to.be.undefined;
    });

    it('should set server header to "mrt-reference-app"', async () => {
      const app = createApp();
      const response = await request(app).get('/test');
      expect(response.headers.server).to.equal('mrt-reference-app');
    });

    it('should set server header on all routes', async () => {
      const app = createApp();
      for (const route of ['/test', '/headers', '/cache', '/tls']) {
        const response = await request(app).get(route);
        expect(response.headers.server).to.equal('mrt-reference-app');
      }
    });

    it('should set Cache-Control to no-cache for all responses', async () => {
      const app = createApp();
      const response = await request(app).get('/test');
      expect(response.headers['cache-control']).to.equal('no-cache');
    });

    it('should handle /exception route', async () => {
      const app = createApp();
      const response = await request(app).get('/exception');
      expect(response.status).to.equal(500);
    });

    it('should handle /tls route', async () => {
      const app = createApp();
      const response = await request(app).get('/tls');
      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.include('application/json');
    });

    it('should handle /cache route without duration', async () => {
      const app = createApp();
      const response = await request(app).get('/cache');
      expect(response.status).to.equal(200);
      expect(response.headers['cache-control']).to.equal('s-maxage=60');
    });

    it('should handle /cache/:duration route', async () => {
      const app = createApp();
      const response = await request(app).get('/cache/120');
      expect(response.status).to.equal(200);
      expect(response.headers['cache-control']).to.equal('s-maxage=120');
    });

    it('should handle /memtest route', async () => {
      const app = createApp();
      const response = await request(app).get('/memtest');
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('additional_info');
    });

    it('should handle /cookie route', async () => {
      const app = createApp();
      const response = await request(app).get('/cookie');
      expect(response.status).to.equal(200);
      expect(response.headers['cache-control']).to.equal('private, max-age=60');
    });

    it('should handle /headers route', async () => {
      const app = createApp();
      const response = await request(app).get('/headers').set('Custom-Header', 'custom-value');
      expect(response.status).to.equal(200);
      expect(response.body.headers).to.have.property('custom-header');
    });

    it('should handle /isolation route', async () => {
      const app = createApp();
      const response = await request(app).get('/isolation');
      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.include('application/json');
    });

    it('should handle /set-response-headers route', async () => {
      const app = createApp();
      const response = await request(app).get('/set-response-headers?header1=value1');
      expect(response.status).to.equal(200);
      expect(response.headers.header1).to.equal('value1');
    });

    it('should handle /streaming route', async () => {
      const app = createApp();
      const response = await request(app).get('/streaming').expect(200);
      expect(response.headers['content-type']).to.equal('text/plain');
      expect(response.text).to.include('Here is a streaming chunk0');
      expect(response.text).to.include('Here is a streaming chunk99');
    });

    it('should handle /large-logging route', async () => {
      const app = createApp();
      const response = await request(app).get('/large-logging?count=10').expect(200);
      expect(response.body).to.have.property('duration');
      expect(response.body).to.have.property('message', 'Large logging');
      expect(response.body).to.have.property('size');
    });

    it('should stream 100 chunks from /streaming route', async () => {
      const app = createApp();
      const response = await request(app).get('/streaming').expect(200);
      const chunkMatches = response.text.match(/Here is a streaming chunk\d+/g);
      expect(chunkMatches).to.have.lengthOf(100);
    });

    it('should handle /auth/logout route', async () => {
      const app = createApp();
      const response = await request(app).get('/auth/logout');
      expect(response.status).to.equal(401);
      expect(response.text).to.equal('Logged out');
    });

    it('should set json spaces to 4', async () => {
      const app = createApp();
      const response = await request(app).get('/test');
      expect(response.text).to.include('    ');
    });

    it('should handle wildcard routes with /{*splat}', async () => {
      const app = createApp();
      const response = await request(app).get('/any/random/path');
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('path');
    });

    it('should disable x-powered-by header in response', async () => {
      const app = createApp();
      const response = await request(app).get('/test');
      expect(response.headers).to.not.have.property('x-powered-by');
    });

    it('should handle POST requests to echo route', async () => {
      const app = createApp();
      const response = await request(app).post('/test/endpoint');
      expect(response.status).to.equal(200);
      expect(response.body.method).to.equal('POST');
    });

    it('should handle PUT requests to echo route', async () => {
      const app = createApp();
      const response = await request(app).put('/test/endpoint');
      expect(response.status).to.equal(200);
      expect(response.body.method).to.equal('PUT');
    });

    it('should handle DELETE requests to echo route', async () => {
      const app = createApp();
      const response = await request(app).delete('/test/endpoint');
      expect(response.status).to.equal(200);
      expect(response.body.method).to.equal('DELETE');
    });
  });

  describe('Authentication routes', () => {
    it('should return 401 for unauthorized access to /auth/* routes', async () => {
      const app = createApp();
      const response = await request(app).get('/auth/protected');
      expect([401, 500]).to.include(response.status);
    });

    it('should handle /auth/logout with POST method', async () => {
      const app = createApp();
      const response = await request(app).post('/auth/logout');
      expect(response.status).to.equal(401);
      expect(response.text).to.equal('Logged out');
    });
  });

  describe('Request timing middleware', () => {
    let mockSend: sinon.SinonStub;
    let originalInstance: MetricsSender | null;

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originalInstance = (MetricsSender as any)._instance;
      mockSend = sinon.stub();
      const mockMetricsSender = {send: mockSend} as unknown as MetricsSender;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MetricsSender as any)._instance = mockMetricsSender;
    });

    afterEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MetricsSender as any)._instance = originalInstance;
    });

    it('should send RequestTime metric when response finishes', async () => {
      const app = createApp();
      await request(app).get('/test');
      expect(mockSend.callCount).to.equal(1);
      const callArgs = mockSend.args[0];
      expect(callArgs[0]).to.have.lengthOf(2);
      expect(callArgs[0][0]).to.include({name: 'RequestTime', unit: 'Milliseconds'});
      expect(callArgs[0][0].value).to.be.at.least(0);
      expect(callArgs[0][0].dimensions).to.not.be.undefined;
      expect(callArgs[0][1]).to.include({name: 'RequestSuccess', unit: 'Count', value: 1});
      expect(callArgs[1]).to.equal(true);
    });

    it('should calculate response time correctly', async () => {
      const app = createApp();
      const startTime = Date.now();
      await request(app).get('/test');
      const actualDuration = Date.now() - startTime;
      expect(mockSend.callCount).to.equal(1);
      const metrics = mockSend.args[0][0];
      const requestTimeMetric = metrics.find((m: {name: string}) => m.name === 'RequestTime');
      expect(requestTimeMetric).to.not.be.undefined;
      expect(requestTimeMetric.value).to.be.at.least(0);
      expect(requestTimeMetric.value).to.be.at.most(actualDuration + 100);
    });

    it('should send RequestTime metric for different routes', async () => {
      const app = createApp();
      await request(app).get('/headers');
      await request(app).get('/cache');
      await request(app).post('/test');
      expect(mockSend.callCount).to.equal(3);
      mockSend.args.forEach((call) => {
        expect(call[0]).to.have.lengthOf(2);
        const requestTimeMetric = call[0].find((m: {name: string}) => m.name === 'RequestTime');
        expect(requestTimeMetric).to.not.be.undefined;
        expect(requestTimeMetric.unit).to.equal('Milliseconds');
      });
    });

    it('should send RequestTime metric even when response has error', async () => {
      const app = createApp();
      await request(app).get('/exception');
      expect(mockSend.callCount).to.equal(1);
      const metrics = mockSend.args[0][0];
      expect(metrics).to.have.lengthOf(2);
      const requestTimeMetric = metrics.find((m: {name: string}) => m.name === 'RequestTime');
      expect(requestTimeMetric).to.not.be.undefined;
      const requestFailedMetric = metrics.find((m: {name: string}) => m.name === 'RequestFailed500');
      expect(requestFailedMetric).to.not.be.undefined;
    });

    it('should include dimensions in the metric', async () => {
      const app = createApp();
      await request(app).get('/test');
      expect(mockSend.callCount).to.equal(1);
      const dimensions = mockSend.args[0][0][0].dimensions;
      expect(dimensions).to.not.be.undefined;
      expect(typeof dimensions).to.equal('object');
    });

    it('should handle multiple concurrent requests', async () => {
      const app = createApp();
      await Promise.all([request(app).get('/test'), request(app).get('/headers'), request(app).get('/cache')]);
      expect(mockSend.callCount).to.equal(3);
    });
  });
});
