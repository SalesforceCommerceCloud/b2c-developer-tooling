/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import request from 'supertest';
import {createApp} from './server.js';

describe('server', () => {
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

      const routes = (app as any)._router?.stack || [];

      const hasMRTMiddleware = routes.some(
        (route: any) => route?.handle?.name?.includes('mrt') || route?.handle?.name?.includes('MRT'),
      );
      expect(hasMRTMiddleware).to.equal(false);
    });

    it('should disable x-powered-by header', async () => {
      const app = createApp();
      const response = await request(app).get('/test');
      expect(response.headers['x-powered-by']).to.be.undefined;
    });

    it('should set server header to "mrt welcome app"', async () => {
      const app = createApp();
      const response = await request(app).get('/');
      expect(response.headers.server).to.equal('mrt welcome app');
    });

    it('should set Cache-Control to no-cache for all responses', async () => {
      const app = createApp();
      const response = await request(app).get('/test');
      expect(response.headers['cache-control']).to.equal('no-cache');
    });

    it('should handle wildcard routes with /{*splat}', async () => {
      const app = createApp();
      const response = await request(app).get('/any/random/path');
      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.include('text/html');
      expect(response.text).to.include('Welcome to your Environment');
    });

    it('should disable x-powered-by header in response', async () => {
      const app = createApp();
      const response = await request(app).get('/test');
      expect(response.headers).to.not.have.property('x-powered-by');
    });

    it('should use build views path when not in local environment', () => {
      const originalEnv = process.env.AWS_LAMBDA_FUNCTION_NAME;
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';

      const app = createApp();
      const viewsPath = app.get('views');

      expect(viewsPath).to.include('build');
      expect(viewsPath).to.include('views');

      if (originalEnv !== undefined) {
        process.env.AWS_LAMBDA_FUNCTION_NAME = originalEnv;
      } else {
        delete process.env.AWS_LAMBDA_FUNCTION_NAME;
      }
    });
  });
});
