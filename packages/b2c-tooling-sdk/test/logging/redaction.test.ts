/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  createLogger,
  deepLogRedactor,
  globalLogRedactorRegistry,
  redactLogValue,
  resetLogger,
} from '@salesforce/b2c-tooling-sdk/logging';
import {CapturingStream} from '../helpers/null-stream.js';

const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.c2lnbmF0dXJl';

describe('logging/redaction', () => {
  afterEach(() => {
    globalLogRedactorRegistry.clear();
    resetLogger();
  });

  describe('redactLogValue', () => {
    it('redacts secret keys at any depth', () => {
      const out = redactLogValue({
        request: {headers: {authorization: 'Basic abc', accept: 'json'}},
        clientCredentials: {id: 'x', secret: 'y'},
        list: [{refresh_token: 'rt'}],
        clientId: 'keep-me',
      });
      expect(out).to.deep.equal({
        request: {headers: {authorization: 'REDACTED', accept: 'json'}},
        clientCredentials: 'REDACTED',
        list: [{refresh_token: 'REDACTED'}],
        clientId: 'keep-me',
      });
    });

    it('redacts tokens and form secrets inside strings', () => {
      expect(redactLogValue(`token ${JWT} sent`)).to.equal('token REDACTED sent');
      expect(redactLogValue('Authorization: Bearer abc.def-123')).to.equal('Authorization: Bearer REDACTED');
      expect(redactLogValue('grant_type=client_credentials&client_secret=s3cr3t&scope=a')).to.equal(
        'grant_type=client_credentials&client_secret=REDACTED&scope=a',
      );
    });

    it('does not change the input and survives cycles', () => {
      const input: Record<string, unknown> = {password: 'p'};
      input.self = input;
      const out = redactLogValue(input) as Record<string, unknown>;
      expect(input.password).to.equal('p');
      expect(out.password).to.equal('REDACTED');
      expect(out.self).to.equal('REDACTED');
    });
  });

  describe('logger integration', () => {
    it('writes entries unchanged when no redactor is registered', () => {
      const stream = new CapturingStream();
      const logger = createLogger({level: 'info', json: true, destination: stream});
      logger.info({request: {headers: {authorization: 'Bearer abcdefghijkl'}}}, `token ${JWT}`);
      const output = stream.getOutput();
      expect(output).to.include(JWT);
      expect(output).to.include('abcdefghijkl');
    });

    it('applies registered redactors to every entry', () => {
      globalLogRedactorRegistry.register(deepLogRedactor);
      const stream = new CapturingStream();
      const logger = createLogger({level: 'info', json: true, destination: stream});
      logger.info({request: {headers: {authorization: 'Bearer abcdefghijkl'}}}, `token ${JWT}`);
      const entry = JSON.parse(stream.getOutput()) as {msg: string; request: {headers: {authorization: string}}};
      expect(entry.msg).to.equal('token REDACTED');
      expect(entry.request.headers.authorization).to.equal('REDACTED');
    });

    it('applies redactors before pretty printing', () => {
      globalLogRedactorRegistry.register(deepLogRedactor);
      const stream = new CapturingStream();
      const logger = createLogger({level: 'info', colorize: false, destination: stream});
      logger.info(`token ${JWT}`);
      expect(stream.getOutput()).to.include('token REDACTED').and.not.include(JWT);
    });

    it('keeps logging when a redactor throws, and replaces by name', () => {
      globalLogRedactorRegistry.register({
        name: 'broken',
        redact() {
          throw new Error('boom');
        },
      });
      globalLogRedactorRegistry.register({
        name: 'tag',
        redact: (entry) => ({...entry, tagged: 1}),
      });
      globalLogRedactorRegistry.register({
        name: 'tag',
        redact: (entry) => ({...entry, tagged: 2}),
      });
      const stream = new CapturingStream();
      createLogger({level: 'info', json: true, destination: stream}).info('hello');
      const entry = JSON.parse(stream.getOutput()) as {msg: string; tagged: number};
      expect(entry.msg).to.equal('hello');
      expect(entry.tagged).to.equal(2);
      expect(globalLogRedactorRegistry.getRedactorNames()).to.deep.equal(['broken', 'tag']);
    });
  });
});
