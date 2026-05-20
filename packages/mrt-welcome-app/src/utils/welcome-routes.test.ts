/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import express, {type Express} from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
import ejs from 'ejs';
import {echo} from './welcome-routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseJsonFromHtml = (html: string): any => {
  const match = html.match(/<pre class="code">([\s\S]*?)<\/pre>/);
  if (!match || !match[1]) {
    throw new Error('Could not find JSON in HTML response');
  }
  return JSON.parse(match[1].trim());
};

describe('welcome-routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.engine('html', ejs.renderFile);
    app.set('views', path.resolve(__dirname, '../views'));
    app.set('view engine', 'html');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('echo', () => {
    it('should render HTML template', async () => {
      app.get('/test', echo);

      const response = await request(app).get('/test').expect(200).expect('Content-Type', /text\/html/);

      expect(response.text).to.include('Welcome to your Environment');

      const json = parseJsonFromHtml(response.text);
      expect(json).to.have.property('method', 'GET');
      expect(json).to.have.property('path', '/test');
      expect(json).to.have.property('protocol');
      expect(json).to.have.property('query');
      expect(json).to.have.property('headers');
      expect(json).to.have.property('ip');
      expect(json).to.have.property('env');
    });

    it('should include query parameters in response', async () => {
      app.get('/test', echo);

      const response = await request(app).get('/test?foo=bar&baz=qux');

      const json = parseJsonFromHtml(response.text);
      expect(json.query).to.deep.equal({
        foo: 'bar',
        baz: 'qux',
      });
    });

    it('should include request headers in response', async () => {
      app.get('/test', echo);

      const response = await request(app).get('/test').set('Custom-Header', 'custom-value');

      const json = parseJsonFromHtml(response.text);
      expect(json.headers).to.have.property('custom-header');
      expect(json.headers['custom-header']).to.equal('custom-value');
    });
  });

  describe('echo edge cases', () => {
    it('should handle IPv6 addresses', async () => {
      app.get('/test', echo);

      const response = await request(app).get('/test');

      const json = parseJsonFromHtml(response.text);
      expect(json.ip).to.not.be.undefined;
    });
  });
});
