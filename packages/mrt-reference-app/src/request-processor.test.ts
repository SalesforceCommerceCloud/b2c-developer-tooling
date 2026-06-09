/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {processRequest, type ProcessRequestParameters} from './request-processor.js';

describe('request-processor', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('processRequest', () => {
    const defaultParameters: ProcessRequestParameters = {
      appHostname: 'localhost:2401',
      proxyConfigs: [],
      environment: 'development',
      deployTarget: 'local-target',
    };

    it('should return path and querystring unchanged when no exclusions', () => {
      const result = processRequest({path: '/test', querystring: 'foo=bar&baz=qux', parameters: defaultParameters});
      expect(result.path).to.equal('/test');
      expect(result.querystring).to.equal('foo=bar&baz=qux');
    });

    it('should remove excluded query parameters', () => {
      const result = processRequest({
        path: '/test',
        querystring: 'removeme=value&keep=this',
        parameters: defaultParameters,
      });
      expect(result.path).to.equal('/test');
      expect(result.querystring).to.equal('keep=this');
    });

    it('should remove multiple excluded parameters', () => {
      const result = processRequest({
        path: '/test',
        querystring: 'removeme=value1&keep=this&removeme=value2',
        parameters: defaultParameters,
      });
      expect(result.path).to.equal('/test');
      expect(result.querystring).to.equal('keep=this');
    });

    it('should handle empty querystring', () => {
      const result = processRequest({path: '/test', querystring: '', parameters: defaultParameters});
      expect(result.path).to.equal('/test');
      expect(result.querystring).to.equal('');
    });

    it('should handle querystring with only excluded parameters', () => {
      const result = processRequest({path: '/test', querystring: 'removeme=value', parameters: defaultParameters});
      expect(result.path).to.equal('/test');
      expect(result.querystring).to.equal('');
    });

    it('should handle special characters in querystring', () => {
      const result = processRequest({
        path: '/test',
        querystring: 'param=value%20with%20spaces&removeme=delete',
        parameters: defaultParameters,
      });
      expect(result.path).to.equal('/test');
      expect(result.querystring).to.equal('param=value+with+spaces');
    });

    it('should handle URL encoded excluded parameter', () => {
      const result = processRequest({
        path: '/test',
        querystring: 'keep=this&removeme=encoded%20value',
        parameters: defaultParameters,
      });
      expect(result.path).to.equal('/test');
      expect(result.querystring).to.equal('keep=this');
    });

    it('should preserve path when querystring changes', () => {
      const result = processRequest({
        path: '/api/users/123',
        querystring: 'removeme=value&page=1',
        parameters: defaultParameters,
      });
      expect(result.path).to.equal('/api/users/123');
      expect(result.querystring).to.equal('page=1');
    });

    it('should handle complex querystring with excluded parameter', () => {
      const result = processRequest({
        path: '/search',
        querystring: 'q=test&removeme=value&sort=name&order=asc',
        parameters: defaultParameters,
      });
      expect(result.path).to.equal('/search');
      expect(result.querystring).to.equal('q=test&sort=name&order=asc');
    });

    it('should handle multiple values for same parameter', () => {
      const result = processRequest({
        path: '/test',
        querystring: 'removeme=value1&keep=this&removeme=value2&keep=that',
        parameters: defaultParameters,
      });
      expect(result.path).to.equal('/test');
      expect(result.querystring).to.equal('keep=this&keep=that');
    });

    it('should handle edge case with just key and no value for exclusion', () => {
      const result = processRequest({
        path: '/test',
        querystring: 'removeme=&keep=value',
        parameters: defaultParameters,
      });
      expect(result.path).to.equal('/test');
      expect(result.querystring).to.equal('keep=value');
    });

    it('should handle various parameter types', () => {
      const result = processRequest({
        path: '/test',
        querystring: 'string=value&number=123&removeme=remove&boolean=true',
        parameters: defaultParameters,
      });
      expect(result.path).to.equal('/test');
      expect(result.querystring).to.equal('string=value&number=123&boolean=true');
    });

    it('should accept parameters with different values', () => {
      const parameters: ProcessRequestParameters = {
        appHostname: 'example.com',
        proxyConfigs: [{host: 'https://api.example.com', path: 'api'}],
        environment: 'production',
        deployTarget: 'production-target',
      };
      const result = processRequest({path: '/test', querystring: 'foo=bar', parameters});
      expect(result.path).to.equal('/test');
      expect(result.querystring).to.equal('foo=bar');
    });

    it('should preserve parameter order after filtering', () => {
      const result = processRequest({
        path: '/test',
        querystring: 'a=1&removeme=del&b=2&c=3',
        parameters: defaultParameters,
      });
      expect(result.path).to.equal('/test');
      expect(result.querystring).to.equal('a=1&b=2&c=3');
    });
  });
});
