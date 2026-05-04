/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {
  isolationOriginLambdaTest,
  isolationS3Test,
  isolationLogsTest,
  executeIsolationTests,
} from './isolation-actions.js';
import {LambdaClient, InvokeCommand} from '@aws-sdk/client-lambda';
import {S3Client, GetObjectCommand} from '@aws-sdk/client-s3';
import {CloudWatchLogsClient, CreateLogStreamCommand} from '@aws-sdk/client-cloudwatch-logs';
import {mockClient} from 'aws-sdk-client-mock';
import {ServiceException} from '@smithy/smithy-client';

const lambdaMock = mockClient(LambdaClient);
const s3Mock = mockClient(S3Client);
const logsMock = mockClient(CloudWatchLogsClient);

class AccessDenied extends ServiceException {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(options?: any) {
    super({...options, name: 'AccessDenied'});
  }
}

describe('isolation-actions', () => {
  beforeEach(() => {
    lambdaMock.reset();
    s3Mock.reset();
    logsMock.reset();
  });

  afterEach(() => {
    lambdaMock.reset();
    s3Mock.reset();
    logsMock.reset();
    sinon.restore();
  });

  describe('isolationOriginLambdaTest', () => {
    it('should return true when AccessDeniedException is thrown', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      const error = new ServiceException({$fault: 'client', $metadata: {}} as never);
      error.name = 'AccessDeniedException';
      lambdaMock.on(InvokeCommand).rejects(error);

      const result = await isolationOriginLambdaTest({FunctionName: 'test-function'});
      expect(result).to.equal(true);
      expect(consoleSpy.called).to.equal(false);
      consoleSpy.restore();
    });

    it('should return false when access is granted', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lambdaMock.on(InvokeCommand).resolves({} as any);
      const result = await isolationOriginLambdaTest({FunctionName: 'test-function'});
      expect(result).to.equal(false);
      expect(consoleSpy.called).to.equal(true);
      consoleSpy.restore();
    });

    it('should return false for other errors', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      lambdaMock.on(InvokeCommand).rejects(new Error('Network error'));
      const result = await isolationOriginLambdaTest({FunctionName: 'test-function'});
      expect(result).to.equal(false);
      expect(consoleSpy.called).to.equal(true);
      consoleSpy.restore();
    });
  });

  describe('isolationS3Test', () => {
    it('should return true when AccessDenied is thrown', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      s3Mock.on(GetObjectCommand).rejects(new AccessDenied());
      const result = await isolationS3Test({Bucket: 'test-bucket', Key: 'test-key', Region: 'us-east-1'});
      expect(result).to.equal(true);
      expect(consoleSpy.called).to.equal(false);
      consoleSpy.restore();
    });

    it('should use specified region', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      s3Mock.on(GetObjectCommand).rejects(new AccessDenied());
      const result = await isolationS3Test({Bucket: 'test-bucket', Key: 'test-key', Region: 'us-west-2'});
      expect(result).to.equal(true);
      expect(s3Mock.call(0).args[0].input).to.not.have.property('Region');
      consoleSpy.restore();
    });

    it('should return false when access is granted', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      s3Mock.on(GetObjectCommand).resolves({} as any);
      const result = await isolationS3Test({Bucket: 'test-bucket', Key: 'test-key'});
      expect(result).to.equal(false);
      expect(consoleSpy.called).to.equal(true);
      consoleSpy.restore();
    });

    it('should use default region when Region is not specified', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      const originalEnv = process.env.AWS_REGION;
      process.env.AWS_REGION = 'us-east-1';
      s3Mock.on(GetObjectCommand).rejects(new AccessDenied());
      const result = await isolationS3Test({Bucket: 'test-bucket', Key: 'test-key'});
      expect(result).to.equal(true);
      consoleSpy.restore();
      process.env.AWS_REGION = originalEnv;
    });
  });

  describe('isolationLogsTest', () => {
    it('should return true when AccessDeniedException is thrown', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      const error = new ServiceException({$fault: 'client', $metadata: {}} as never);
      error.name = 'AccessDeniedException';
      logsMock.on(CreateLogStreamCommand).rejects(error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await isolationLogsTest({logGroupName: 'test-log-group', logStreamName: 'test-stream'} as any);
      expect(result).to.equal(true);
      expect(consoleSpy.called).to.equal(false);
      consoleSpy.restore();
    });

    it('should generate unique log stream names', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      const error = new ServiceException({$fault: 'client', $metadata: {}} as never);
      error.name = 'AccessDeniedException';
      logsMock.on(CreateLogStreamCommand).rejects(error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result1 = await isolationLogsTest({logGroupName: 'test-log-group', logStreamName: 'test-stream-1'} as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result2 = await isolationLogsTest({logGroupName: 'test-log-group', logStreamName: 'test-stream-2'} as any);
      expect(result1).to.equal(true);
      expect(result2).to.equal(true);
      expect(logsMock.calls().length).to.equal(2);
      consoleSpy.restore();
    });

    it('should return false when access is granted', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logsMock.on(CreateLogStreamCommand).resolves({} as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await isolationLogsTest({logGroupName: 'test-log-group', logStreamName: 'test-stream'} as any);
      expect(result).to.equal(false);
      expect(consoleSpy.called).to.equal(true);
      consoleSpy.restore();
    });
  });

  describe('executeIsolationTests', () => {
    it('should execute all tests with valid parameters', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      const lambdaError = new ServiceException({$fault: 'client', $metadata: {}} as never);
      lambdaError.name = 'AccessDeniedException';
      lambdaMock.on(InvokeCommand).rejects(lambdaError);
      s3Mock.on(GetObjectCommand).rejects(new AccessDenied());
      const logsError = new ServiceException({$fault: 'client', $metadata: {}} as never);
      logsError.name = 'AccessDeniedException';
      logsMock.on(CreateLogStreamCommand).rejects(logsError);

      const results = await executeIsolationTests({
        FunctionName: 'test-function',
        Bucket: 'test-bucket',
        Key: 'test-key',
        logGroupName: 'test-log-group',
      });
      expect(results.origin).to.equal(true);
      expect(results.storage).to.equal(true);
      expect(results.logs).to.equal(true);
      consoleSpy.restore();
    });

    it('should execute tests with region parameter', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      const lambdaError = new ServiceException({$fault: 'client', $metadata: {}} as never);
      lambdaError.name = 'AccessDeniedException';
      lambdaMock.on(InvokeCommand).rejects(lambdaError);
      s3Mock.on(GetObjectCommand).rejects(new AccessDenied());
      const logsError = new ServiceException({$fault: 'client', $metadata: {}} as never);
      logsError.name = 'AccessDeniedException';
      logsMock.on(CreateLogStreamCommand).rejects(logsError);

      const results = await executeIsolationTests({
        FunctionName: 'test-function',
        Bucket: 'test-bucket',
        Key: 'test-key',
        Region: 'us-west-2',
        logGroupName: 'test-log-group',
      });
      expect(results.origin).to.equal(true);
      expect(results.storage).to.equal(true);
      expect(results.logs).to.equal(true);
      consoleSpy.restore();
    });

    it('should return false for all tests when access is granted', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lambdaMock.on(InvokeCommand).resolves({} as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      s3Mock.on(GetObjectCommand).resolves({} as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logsMock.on(CreateLogStreamCommand).resolves({} as any);

      const results = await executeIsolationTests({
        FunctionName: 'test-function',
        Bucket: 'test-bucket',
        Key: 'test-key',
        logGroupName: 'test-log-group',
      });
      expect(results.origin).to.equal(false);
      expect(results.storage).to.equal(false);
      expect(results.logs).to.equal(false);
      consoleSpy.restore();
    });

    it('should execute tests with partial parameters', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      const lambdaError = new ServiceException({$fault: 'client', $metadata: {}} as never);
      lambdaError.name = 'AccessDeniedException';
      lambdaMock.on(InvokeCommand).rejects(lambdaError);
      s3Mock.on(GetObjectCommand).rejects(new AccessDenied());
      const logsError = new ServiceException({$fault: 'client', $metadata: {}} as never);
      logsError.name = 'AccessDeniedException';
      logsMock.on(CreateLogStreamCommand).rejects(logsError);

      const results = await executeIsolationTests({FunctionName: 'test-function'});
      expect(results.origin).to.equal(true);
      expect(results.storage).to.equal(true);
      expect(results.logs).to.equal(true);
      consoleSpy.restore();
    });

    it('should handle mixed results', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      const lambdaError = new ServiceException({$fault: 'client', $metadata: {}} as never);
      lambdaError.name = 'AccessDeniedException';
      lambdaMock.on(InvokeCommand).rejects(lambdaError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      s3Mock.on(GetObjectCommand).resolves({} as any);
      const logsError = new ServiceException({$fault: 'client', $metadata: {}} as never);
      logsError.name = 'AccessDeniedException';
      logsMock.on(CreateLogStreamCommand).rejects(logsError);

      const results = await executeIsolationTests({
        FunctionName: 'test-function',
        Bucket: 'test-bucket',
        Key: 'test-key',
        logGroupName: 'test-log-group',
      });
      expect(results.origin).to.equal(true);
      expect(results.storage).to.equal(false);
      expect(results.logs).to.equal(true);
      consoleSpy.restore();
    });

    it('should handle empty parameters object', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      lambdaMock.on(InvokeCommand).rejects(new Error('Missing function name'));
      lambdaMock.on(InvokeCommand).rejects(new Error('Missing parameters'));
      logsMock.on(CreateLogStreamCommand).rejects(new Error('Missing log group name'));

      const results = await executeIsolationTests({});
      expect(results.origin).to.equal(false);
      expect(results.storage).to.equal(false);
      expect(results.logs).to.equal(false);
      consoleSpy.restore();
    });
  });

  describe('isolationOriginLambdaTest edge cases', () => {
    it('should handle different error types correctly', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      lambdaMock.on(InvokeCommand).rejects(new Error('Network timeout'));
      const result = await isolationOriginLambdaTest({FunctionName: 'test-function'});
      expect(result).to.equal(false);
      expect(consoleSpy.called).to.equal(true);
      consoleSpy.restore();
    });

    it('should handle missing FunctionName', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      lambdaMock.on(InvokeCommand).rejects(new Error('Missing parameter'));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await isolationOriginLambdaTest({FunctionName: ''} as any);
      expect(result).to.equal(false);
      expect(consoleSpy.called).to.equal(true);
      consoleSpy.restore();
    });
  });

  describe('isolationS3Test edge cases', () => {
    it('should handle missing bucket parameter', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      s3Mock.on(GetObjectCommand).rejects(new AccessDenied());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await isolationS3Test({Key: 'test-key'} as any);
      expect(result).to.equal(true);
      expect(consoleSpy.called).to.equal(false);
      consoleSpy.restore();
    });

    it('should handle missing key parameter', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      s3Mock.on(GetObjectCommand).rejects(new AccessDenied());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await isolationS3Test({Bucket: 'test-bucket'} as any);
      expect(result).to.equal(true);
      expect(consoleSpy.called).to.equal(false);
      consoleSpy.restore();
    });

    it('should handle different AWS regions', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      s3Mock.on(GetObjectCommand).rejects(new AccessDenied());
      const result = await isolationS3Test({Bucket: 'test-bucket', Key: 'test-key', Region: 'eu-west-1'});
      expect(result).to.equal(true);
      expect(consoleSpy.called).to.equal(false);
      consoleSpy.restore();
    });
  });

  describe('isolationLogsTest edge cases', () => {
    it('should handle missing logGroupName', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logsMock.on(CreateLogStreamCommand).resolves({} as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await isolationLogsTest({} as any);
      expect(result).to.equal(false);
      expect(consoleSpy.called).to.equal(true);
      consoleSpy.restore();
    });

    it('should handle different error names', async () => {
      const consoleSpy = sinon.stub(console, 'error');
      const error = new ServiceException({$fault: 'server', $metadata: {}} as never);
      error.name = 'ServiceException';
      logsMock.on(CreateLogStreamCommand).rejects(error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await isolationLogsTest({logGroupName: 'test-log-group', logStreamName: 'test-stream'} as any);
      expect(result).to.equal(false);
      expect(consoleSpy.called).to.equal(true);
      consoleSpy.restore();
    });
  });
});
