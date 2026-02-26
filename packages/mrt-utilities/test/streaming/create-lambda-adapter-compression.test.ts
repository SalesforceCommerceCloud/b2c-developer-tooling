/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {APIGatewayProxyEvent, Context} from 'aws-lambda';
import {PassThrough, type Writable} from 'stream';
import zlib from 'node:zlib';
import eventMocks from '@serverless/event-mocks';
import {expect} from 'chai';

// ESM/CJS interop: default may be the function or a namespace with .default
const createEvent = typeof eventMocks === 'function' ? eventMocks : eventMocks.default;
import sinon from 'sinon';
import {createExpressResponse, createExpressRequest, type CompressionConfig} from '@salesforce/mrt-utilities/streaming';

// Mock awslambda global - creates a pass-through stream that stores metadata
const compressionAwslambdaMock = {
  HttpResponseStream: {
    from: (stream: Writable, metadata: {statusCode: number; headers: Record<string, any>}) => {
      // Store metadata on the original stream for verification
      const originalStream = (stream as any).__originalStream || stream;
      originalStream.__metadata = metadata;
      // Return a pass-through stream that forwards data to the original stream
      const passThrough = new PassThrough();
      passThrough.pipe(stream);
      return passThrough;
    },
  },
};

// Helper to create a real writable stream that collects data
function createCollectingStream(): PassThrough & {
  getData: () => Buffer;
  getMetadata: () => any;
  waitForEnd: () => Promise<void>;
} {
  const stream = new PassThrough();
  const chunks: Buffer[] = [];

  // Mark this as the original stream for metadata storage
  (stream as any).__originalStream = stream;

  stream.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });

  return Object.assign(stream, {
    getData: () => Buffer.concat(chunks),
    getMetadata: () => (stream as any).__metadata,
    waitForEnd: () => {
      return new Promise<void>((resolve) => {
        if (stream.writableEnded) {
          resolve();
        } else {
          const timeout = setTimeout(resolve, 500);
          stream.once('finish', () => {
            clearTimeout(timeout);
            resolve();
          });
          stream.once('end', () => {
            clearTimeout(timeout);
            resolve();
          });
        }
      });
    },
  });
}

// Helper to create a mock API Gateway event using @serverless/event-mocks
function createMockEvent(overrides?: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent {
  const event = createEvent('aws:apiGateway', {
    path: '/test',
    httpMethod: 'GET',
    ...(overrides as any),
  });
  // Ensure body is null if undefined (createEvent may return undefined for body)
  if (event.body === undefined) {
    event.body = null;
  }
  // Remove Accept-Encoding header if not explicitly provided in overrides
  // (createEvent may add default headers)
  if (overrides?.headers?.['Accept-Encoding'] === undefined && overrides?.headers?.['accept-encoding'] === undefined) {
    if (event.headers) {
      delete event.headers['Accept-Encoding'];
      delete event.headers['accept-encoding'];
    }
    if (event.multiValueHeaders) {
      delete event.multiValueHeaders['Accept-Encoding'];
      delete event.multiValueHeaders['accept-encoding'];
    }
  }
  return event;
}

// Helper to create a mock Lambda context
function createMockContext(overrides?: Partial<Context>): Context {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2023/01/01/[$LATEST]test',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
    ...overrides,
  };
}

describe('Compression Streaming', () => {
  beforeEach(() => {
    (globalThis as any).awslambda = compressionAwslambdaMock;
  });

  describe('Gzip compression', () => {
    it('should compress text/html content with gzip', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'text/html');
      const testData = 'This is a test string that should be compressed. '.repeat(100);
      response.end(testData);

      // Wait for stream to finish
      await stream.waitForEnd();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const compressedData = stream.getData();
      const metadata = stream.getMetadata();

      expect(metadata).to.exist;
      expect(metadata.headers['content-encoding']).to.equal('gzip');
      expect(compressedData.length).to.be.greaterThan(0);
      // Compressed data should typically be smaller than original for repetitive text
      expect(compressedData.length).to.be.lessThan(Buffer.from(testData).length);
    });

    it('should compress application/json content with gzip', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'application/json');
      const testData = JSON.stringify({message: 'test', data: Array(100).fill('x').join('')});
      response.end(testData);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const compressedData = stream.getData();
      const metadata = stream.getMetadata();

      expect(metadata.headers['content-encoding']).to.equal('gzip');
      expect(compressedData.length).to.be.greaterThan(0);
      expect(compressedData.length).to.be.lessThan(Buffer.from(testData).length);
    });

    it('should compress streaming chunks with gzip', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'text/plain');
      response.write('chunk1');
      response.write('chunk2');
      response.write('chunk3');
      response.end();

      await new Promise((resolve) => setTimeout(resolve, 50));

      const compressedData = stream.getData();
      const metadata = stream.getMetadata();

      expect(metadata.headers['content-encoding']).to.equal('gzip');
      expect(compressedData.length).to.be.greaterThan(0);
    });
  });

  describe('Deflate compression', () => {
    it('should compress content with deflate when deflate is preferred', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'deflate, gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'text/html');
      const testData = 'This is a test string. '.repeat(50);
      response.end(testData);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const compressedData = stream.getData();
      const metadata = stream.getMetadata();

      expect(metadata.headers['content-encoding']).to.equal('deflate');
      expect(compressedData.length).to.be.greaterThan(0);
      expect(compressedData.length).to.be.lessThan(Buffer.from(testData).length);
    });
  });

  describe('Brotli compression', () => {
    it('should compress content with brotli when br is preferred', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'br, gzip, deflate'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'text/html');
      const testData = 'This is a test string for brotli compression. '.repeat(100);
      response.end(testData);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const compressedData = stream.getData();
      const metadata = stream.getMetadata();

      expect(metadata.headers['content-encoding']).to.equal('br');
      expect(compressedData.length).to.be.greaterThan(0);
      expect(compressedData.length).to.be.lessThan(Buffer.from(testData).length);
    });

    it('should prefer brotli over gzip when both are available', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'br, gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'application/json');
      const testData = JSON.stringify({data: 'test'.repeat(100)});
      response.end(testData);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      // Negotiator prefers based on order in Accept-Encoding, but our code prefers br first
      // So br should be selected when available
      expect(metadata.headers['content-encoding']).to.equal('br');
    });
  });

  describe('Compressible content types', () => {
    it('should compress text/css', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'text/css');
      const testData = 'body { color: red; } '.repeat(50);
      response.end(testData);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      expect(metadata.headers['content-encoding']).to.equal('gzip');
    });

    it('should compress application/javascript', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'application/javascript');
      const testData = 'function test() { return true; } '.repeat(50);
      response.end(testData);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      expect(metadata.headers['content-encoding']).to.equal('gzip');
    });

    it('should compress text/xml', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'text/xml');
      const testData = '<root><item>test</item></root>'.repeat(50);
      response.end(testData);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      expect(metadata.headers['content-encoding']).to.equal('gzip');
    });

    it('should compress image/svg+xml', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'image/svg+xml');
      const testData = '<svg><circle r="10"/></svg>'.repeat(50);
      response.end(testData);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      expect(metadata.headers['content-encoding']).to.equal('gzip');
    });
  });

  describe('Non-compressible content types', () => {
    it('should not compress image/jpeg', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'image/jpeg');
      const testData = Buffer.alloc(1000, 0xff); // Mock JPEG data
      response.end(testData);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      expect(metadata.headers['content-encoding']).to.be.undefined;
      const data = stream.getData();
      expect(data).to.deep.equal(testData);
    });

    it('should not compress image/png', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'image/png');
      const testData = Buffer.alloc(1000, 0x89); // Mock PNG data
      response.end(testData);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      expect(metadata.headers['content-encoding']).to.be.undefined;
    });

    it('should not compress video/mp4', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'video/mp4');
      const testData = Buffer.alloc(1000);
      response.end(testData);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      expect(metadata.headers['content-encoding']).to.be.undefined;
    });

    it('should compress application/octet-stream (compressible package considers it compressible)', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'application/octet-stream');
      const testData = Buffer.alloc(1000, 0xff);
      response.end(testData);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      // Note: The compressible package considers application/octet-stream as compressible
      // because it starts with "application/". This is the package's behavior.
      expect(metadata.headers['content-encoding']).to.equal('gzip');
    });
  });

  describe('No Accept-Encoding header', () => {
    it('should not compress when Accept-Encoding is missing', async () => {
      const stream = createCollectingStream();
      // Explicitly set headers to empty to ensure no Accept-Encoding header
      const event = createMockEvent({headers: {}, multiValueHeaders: {}});
      const context = createMockContext();

      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'text/html');
      const testData = 'This should not be compressed';
      response.end(testData);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      expect(metadata.headers['content-encoding']).to.be.undefined;
      const data = stream.getData();
      expect(data.toString()).to.equal(testData);
    });
  });

  describe('Content-Length header removal', () => {
    it('should remove Content-Length header when compression is enabled', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'text/html');
      // Don't set Content-Length initially - compression setup should prevent it
      const testData = 'test data';
      response.end(testData);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      expect(metadata.headers['content-encoding']).to.equal('gzip');
      // Content-Length should not be present when compression is used
      // (it's removed during compression setup)
      expect(metadata.headers['content-length']).to.be.undefined;
    });
  });

  describe('Multiple writes with compression', () => {
    it('should compress multiple chunks correctly', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'text/plain');
      const chunks = ['chunk1', 'chunk2', 'chunk3', 'chunk4', 'chunk5'];

      for (const chunk of chunks) {
        response.write(chunk);
      }
      response.end();

      await new Promise((resolve) => setTimeout(resolve, 50));

      const compressedData = stream.getData();
      const metadata = stream.getMetadata();

      expect(metadata.headers['content-encoding']).to.equal('gzip');
      expect(compressedData.length).to.be.greaterThan(0);
    });
  });

  describe('Encoding negotiation', () => {
    it('should handle quality values in Accept-Encoding', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip;q=0.8, br;q=0.9'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'text/html');
      response.end('test data');

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      // Should prefer br due to higher quality value
      expect(metadata.headers['content-encoding']).to.equal('br');
    });

    it('should handle wildcard Accept-Encoding', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': '*'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'text/html');
      response.end('test data');

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      // Should use br as it's first in our preference list
      expect(metadata.headers['content-encoding']).to.equal('br');
    });
  });

  describe('Error handling', () => {
    it('should handle compression stream errors gracefully', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'text/html');

      // Write some data to trigger compression setup
      response.write('test');

      // Simulate an error by destroying the compression stream
      // This is a bit tricky since we don't have direct access to the compression stream
      // But we can verify the response still works
      response.end('more data');

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Response should still complete even if compression has issues
      const metadata = stream.getMetadata();
      expect(metadata).to.exist;
    });
  });

  describe('Content type with parameters', () => {
    it('should handle content type with charset parameter', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      const testData = 'test data';
      response.end(testData);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      expect(metadata.headers['content-encoding']).to.equal('gzip');
    });

    it('should handle content type with boundary parameter', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'multipart/form-data; boundary=----WebKitFormBoundary');
      const testData = 'test data';
      response.end(testData);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      // multipart/form-data is NOT compressible according to the compressible package
      // It doesn't start with text/ or application/ (it's multipart/)
      expect(metadata.headers['content-encoding']).to.be.undefined;
    });
  });

  describe('Response methods with compression', () => {
    it('should compress when using res.send()', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'text/html');
      response.send('test data');

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      expect(metadata.headers['content-encoding']).to.equal('gzip');
    });

    it('should compress when using res.json()', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.json({message: 'test', data: 'x'.repeat(100)});

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      expect(metadata.headers['content-encoding']).to.equal('gzip');
    });

    it('should compress when using writeHead()', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.writeHead(200, {'Content-Type': 'text/html'});
      response.end('test data');

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      expect(metadata.headers['content-encoding']).to.equal('gzip');
    });

    it('should compress when using flushHeaders()', async () => {
      const stream = createCollectingStream();
      const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
      const context = createMockContext();
      const request = createExpressRequest(event, context);
      const response = createExpressResponse(stream, event, context, request);

      response.setHeader('Content-Type', 'text/html');
      response.flushHeaders();
      response.end('test data');

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metadata = stream.getMetadata();
      expect(metadata.headers['content-encoding']).to.equal('gzip');
    });
  });

  describe('CompressionConfig', () => {
    describe('Encoding override', () => {
      it('should use compressionConfig.encoding to override Accept-Encoding negotiation', async () => {
        const stream = createCollectingStream();
        const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
        const context = createMockContext();
        const request = createExpressRequest(event, context);
        const compressionConfig: CompressionConfig = {
          enabled: true,
          encoding: 'br', // But we override to use br
        };
        const response = createExpressResponse(stream, event, context, request, compressionConfig);

        response.setHeader('Content-Type', 'text/html');
        response.end('test data');

        await new Promise((resolve) => setTimeout(resolve, 50));

        const metadata = stream.getMetadata();
        // Should use br from compressionConfig, not gzip from Accept-Encoding
        expect(metadata.headers['content-encoding']).to.equal('br');
      });

      it('should use compressionConfig.encoding even when client does not support it', async () => {
        const stream = createCollectingStream();
        const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
        const context = createMockContext();
        const request = createExpressRequest(event, context);
        const compressionConfig: CompressionConfig = {
          enabled: true,
          encoding: 'deflate', // But we override to use deflate
        };
        const response = createExpressResponse(stream, event, context, request, compressionConfig);

        response.setHeader('Content-Type', 'text/html');
        response.end('test data');

        await new Promise((resolve) => setTimeout(resolve, 50));

        const metadata = stream.getMetadata();
        // Should use deflate from compressionConfig, not gzip from Accept-Encoding
        expect(metadata.headers['content-encoding']).to.equal('deflate');
      });

      it('should use compressionConfig.encoding when no Accept-Encoding header is present', async () => {
        const stream = createCollectingStream();
        const event = createMockEvent(); // No Accept-Encoding header
        const context = createMockContext();

        const request = createExpressRequest(event, context);
        const compressionConfig: CompressionConfig = {
          enabled: true,
          encoding: 'gzip',
        };
        const response = createExpressResponse(stream, event, context, request, compressionConfig);

        response.setHeader('Content-Type', 'text/html');
        response.end('test data');

        await new Promise((resolve) => setTimeout(resolve, 50));

        const metadata = stream.getMetadata();
        // Should use gzip from compressionConfig even without Accept-Encoding header
        expect(metadata.headers['content-encoding']).to.equal('gzip');
      });
    });

    describe('Compression options', () => {
      it('should pass compression options to gzip stream', async () => {
        const stream = createCollectingStream();
        const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
        const context = createMockContext();
        const request = createExpressRequest(event, context);
        const compressionConfig: CompressionConfig = {
          enabled: true,
          encoding: 'gzip',
          options: {
            level: 9, // Maximum compression
          },
        };

        // Spy on createGzip to verify options are passed
        const createGzipStub = sinon.stub(zlib, 'createGzip').callThrough();

        const response = createExpressResponse(stream, event, context, request, compressionConfig);
        response.setHeader('Content-Type', 'text/html');
        response.end('test data');

        await new Promise((resolve) => setTimeout(resolve, 50));

        // Verify createGzip was called with the options
        expect(createGzipStub.calledWith(compressionConfig.options)).to.be.true;
        createGzipStub.restore();
      });

      it('should pass compression options to brotli stream', async () => {
        const stream = createCollectingStream();
        const event = createMockEvent({headers: {'Accept-Encoding': 'br'}});
        const context = createMockContext();
        const request = createExpressRequest(event, context);
        const compressionConfig: CompressionConfig = {
          enabled: true,
          encoding: 'br',
          options: {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 11, // Maximum quality
            },
          },
        };

        // Spy on createBrotliCompress to verify options are passed
        const createBrotliStub = sinon.stub(zlib, 'createBrotliCompress').callThrough();

        const response = createExpressResponse(stream, event, context, request, compressionConfig);
        response.setHeader('Content-Type', 'text/html');
        response.end('test data');

        await new Promise((resolve) => setTimeout(resolve, 50));

        // Verify createBrotliCompress was called with the options
        expect(createBrotliStub.calledWith(compressionConfig.options)).to.be.true;
        createBrotliStub.restore();
      });

      it('should pass compression options to deflate stream', async () => {
        const stream = createCollectingStream();
        const event = createMockEvent({headers: {'Accept-Encoding': 'deflate'}});
        const context = createMockContext();
        const request = createExpressRequest(event, context);
        const compressionConfig: CompressionConfig = {
          enabled: true,
          encoding: 'deflate',
          options: {
            level: 9, // Maximum compression
          },
        };

        // Spy on createDeflate to verify options are passed
        const createDeflateStub = sinon.stub(zlib, 'createDeflate').callThrough();

        const response = createExpressResponse(stream, event, context, request, compressionConfig);
        response.setHeader('Content-Type', 'text/html');
        response.end('test data');

        await new Promise((resolve) => setTimeout(resolve, 50));

        // Verify createDeflate was called with the options
        expect(createDeflateStub.calledWith(compressionConfig.options)).to.be.true;
        createDeflateStub.restore();
      });

      it('should work with compression options but no encoding override', async () => {
        const stream = createCollectingStream();
        const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
        const context = createMockContext();
        const request = createExpressRequest(event, context);
        const compressionConfig: CompressionConfig = {
          enabled: true,
          // No encoding override, should use Accept-Encoding negotiation
          options: {
            level: 6,
          },
        };

        const createGzipStub = sinon.stub(zlib, 'createGzip').callThrough();

        const response = createExpressResponse(stream, event, context, request, compressionConfig);
        response.setHeader('Content-Type', 'text/html');
        response.end('test data');

        await new Promise((resolve) => setTimeout(resolve, 50));

        const metadata = stream.getMetadata();
        // Should still use gzip from Accept-Encoding
        expect(metadata.headers['content-encoding']).to.equal('gzip');
        // But with the custom options
        expect(createGzipStub.calledWith(compressionConfig.options)).to.be.true;
        createGzipStub.restore();
      });
    });

    describe('CompressionConfig edge cases', () => {
      it('should handle undefined compressionConfig', async () => {
        const stream = createCollectingStream();
        const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
        const context = createMockContext();
        const request = createExpressRequest(event, context);
        const response = createExpressResponse(stream, event, context, request, undefined);

        response.setHeader('Content-Type', 'text/html');
        response.end('test data');

        await new Promise((resolve) => setTimeout(resolve, 50));

        const metadata = stream.getMetadata();
        // Should work normally without compressionConfig
        expect(metadata.headers['content-encoding']).to.equal('gzip');
      });

      it('should handle empty compressionConfig', async () => {
        const stream = createCollectingStream();
        const event = createMockEvent({headers: {'Accept-Encoding': 'gzip'}});
        const context = createMockContext();
        const request = createExpressRequest(event, context);
        const compressionConfig: CompressionConfig = {enabled: true};
        const response = createExpressResponse(stream, event, context, request, compressionConfig);

        response.setHeader('Content-Type', 'text/html');
        response.end('test data');

        await new Promise((resolve) => setTimeout(resolve, 50));

        const metadata = stream.getMetadata();
        // Should work normally with empty compressionConfig
        expect(metadata.headers['content-encoding']).to.equal('gzip');
      });

      it('should handle compressionConfig with only options (no encoding)', async () => {
        const stream = createCollectingStream();
        const event = createMockEvent({headers: {'Accept-Encoding': 'br'}});
        const context = createMockContext();
        const request = createExpressRequest(event, context);
        const compressionConfig: CompressionConfig = {
          enabled: true,
          options: {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 5,
            },
          },
        };

        const createBrotliStub = sinon.stub(zlib, 'createBrotliCompress').callThrough();

        const response = createExpressResponse(stream, event, context, request, compressionConfig);
        response.setHeader('Content-Type', 'text/html');
        response.end('test data');

        await new Promise((resolve) => setTimeout(resolve, 50));

        const metadata = stream.getMetadata();
        // Should use br from Accept-Encoding
        expect(metadata.headers['content-encoding']).to.equal('br');
        // But with custom options
        expect(createBrotliStub.calledWith(compressionConfig.options)).to.be.true;
        createBrotliStub.restore();
      });
    });

    describe('Disabled compression', () => {
      it('should disable compression when enabled is false', async () => {
        const stream = createCollectingStream();
        const event = createMockEvent({headers: {'Accept-Encoding': 'gzip, br'}});
        const context = createMockContext();
        const request = createExpressRequest(event, context);
        const compressionConfig: CompressionConfig = {
          enabled: false,
        };
        const response = createExpressResponse(stream, event, context, request, compressionConfig);

        response.setHeader('Content-Type', 'text/html');
        const testData = 'This is a test string that should NOT be compressed. '.repeat(100);
        response.end(testData);

        await new Promise((resolve) => setTimeout(resolve, 50));

        const metadata = stream.getMetadata();
        // Should NOT have content-encoding header
        expect(metadata.headers['content-encoding']).to.be.undefined;

        // Verify data is not compressed (should be larger or same size)
        const data = stream.getData();
        // The data should be the original text, not compressed
        expect(data.toString()).to.include('This is a test string');
      });

      it('should disable compression even when client supports compression', async () => {
        const stream = createCollectingStream();
        const event = createMockEvent({headers: {'Accept-Encoding': 'gzip, br, deflate'}});
        const context = createMockContext();
        const request = createExpressRequest(event, context);
        const compressionConfig: CompressionConfig = {
          enabled: false,
        };
        const response = createExpressResponse(stream, event, context, request, compressionConfig);

        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({message: 'test', data: 'x'.repeat(1000)}));

        await new Promise((resolve) => setTimeout(resolve, 50));

        const metadata = stream.getMetadata();
        // Should NOT have content-encoding header
        expect(metadata.headers['content-encoding']).to.be.undefined;
      });

      it('should disable compression when enabled is false without Accept-Encoding header', async () => {
        const stream = createCollectingStream();
        const event = createMockEvent(); // No Accept-Encoding header
        const context = createMockContext();

        const request = createExpressRequest(event, context);
        const compressionConfig: CompressionConfig = {
          enabled: false,
        };
        const response = createExpressResponse(stream, event, context, request, compressionConfig);

        response.setHeader('Content-Type', 'text/html');
        response.end('test data');

        await new Promise((resolve) => setTimeout(resolve, 50));

        const metadata = stream.getMetadata();
        // Should NOT have content-encoding header
        expect(metadata.headers['content-encoding']).to.be.undefined;
      });
    });
  });
});
