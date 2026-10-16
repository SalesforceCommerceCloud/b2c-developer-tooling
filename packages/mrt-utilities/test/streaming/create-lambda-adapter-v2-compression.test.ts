/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {APIGatewayProxyEvent, Context} from 'aws-lambda';
import {PassThrough} from 'node:stream';
import zlib from 'node:zlib';
import type {Express} from 'express';
import {expect} from 'chai';
import sinon from 'sinon';
import {expressVersions} from '../helpers/express-versions.js';
import {createStreamingLambdaAdapterV2, type StreamingCompressionConfig} from '@salesforce/mrt-utilities/streaming';

type CollectingStream = PassThrough & {
  getData: () => Buffer;
  getMetadata: () => {statusCode: number; headers: Record<string, string>; cookies?: string[]};
};

function createCollectingStream(): CollectingStream {
  const stream = new PassThrough() as CollectingStream;
  const chunks: Buffer[] = [];
  stream.on('data', (chunk: Buffer) => chunks.push(chunk));
  stream.getData = () => Buffer.concat(chunks);
  stream.getMetadata = () => (stream as any).__metadata;
  return stream;
}

function installAwslambda(): void {
  (globalThis as any).awslambda = {
    HttpResponseStream: {
      from: (stream: any, metadata: any) => {
        stream.__metadata = metadata;
        return stream;
      },
    },
  };
}

function createMockEvent(overrides?: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent {
  return {
    httpMethod: 'GET',
    path: '/test',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    headers: {},
    multiValueHeaders: {},
    body: null,
    isBase64Encoded: false,
    requestContext: {identity: {sourceIp: '127.0.0.1'}},
    resource: '/test',
    stageVariables: null,
    ...overrides,
  } as APIGatewayProxyEvent;
}

function createMockContext(): Context {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2024/01/01/[$LATEST]test',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  } as Context;
}

function decode(encoding: string | undefined, data: Buffer): string {
  switch (encoding) {
    case 'br':
      return zlib.brotliDecompressSync(data).toString();
    case 'gzip':
      return zlib.gunzipSync(data).toString();
    case 'deflate':
      return zlib.inflateSync(data).toString();
    default:
      return data.toString();
  }
}

describe('create-lambda-adapter-v2 compression', () => {
  beforeEach(() => {
    installAwslambda();
  });

  expressVersions.forEach(({label, express}) => {
    describe(`compression (${label})`, () => {
      let app: Express;
      let stream: CollectingStream;

      beforeEach(() => {
        app = express();
        stream = createCollectingStream();
      });

      function serveHtml(body: string): void {
        app.get('/test', (req, res) => {
          res.setHeader('Content-Type', 'text/html');
          res.end(body);
        });
      }

      const body = 'This is compressible content. '.repeat(200);

      (['br', 'gzip', 'deflate'] as const).forEach((encoding) => {
        it(`compresses with ${encoding} and the body round-trips`, async () => {
          serveHtml(body);

          await createStreamingLambdaAdapterV2(app, stream)(
            createMockEvent({headers: {'Accept-Encoding': encoding}}),
            createMockContext(),
          );

          const metadata = stream.getMetadata();
          expect(metadata.headers['content-encoding']).to.equal(encoding);
          const data = stream.getData();
          expect(data.length).to.be.lessThan(Buffer.byteLength(body));
          expect(decode(encoding, data)).to.equal(body);
        });
      });

      it('does not compress when Accept-Encoding is absent (identity)', async () => {
        serveHtml(body);

        await createStreamingLambdaAdapterV2(app, stream)(createMockEvent(), createMockContext());

        expect(stream.getMetadata().headers['content-encoding']).to.be.undefined;
        expect(stream.getData().toString()).to.equal(body);
      });

      it('does not compress when Accept-Encoding is identity', async () => {
        serveHtml(body);

        await createStreamingLambdaAdapterV2(app, stream)(
          createMockEvent({headers: {'Accept-Encoding': 'identity'}}),
          createMockContext(),
        );

        expect(stream.getMetadata().headers['content-encoding']).to.be.undefined;
        expect(stream.getData().toString()).to.equal(body);
      });

      it('prefers br when the client accepts br, gzip and deflate', async () => {
        serveHtml(body);

        await createStreamingLambdaAdapterV2(app, stream)(
          createMockEvent({headers: {'Accept-Encoding': 'br, gzip, deflate'}}),
          createMockContext(),
        );

        expect(stream.getMetadata().headers['content-encoding']).to.equal('br');
      });

      it('prefers gzip over deflate', async () => {
        serveHtml(body);

        await createStreamingLambdaAdapterV2(app, stream)(
          createMockEvent({headers: {'Accept-Encoding': 'gzip, deflate'}}),
          createMockContext(),
        );

        expect(stream.getMetadata().headers['content-encoding']).to.equal('gzip');
      });

      it('honors quality values in Accept-Encoding', async () => {
        serveHtml(body);

        await createStreamingLambdaAdapterV2(app, stream)(
          createMockEvent({headers: {'Accept-Encoding': 'gzip;q=0.8, br;q=0.9'}}),
          createMockContext(),
        );

        expect(stream.getMetadata().headers['content-encoding']).to.equal('br');
      });

      it('never selects zstd even when the client only accepts zstd', async () => {
        serveHtml(body);

        await createStreamingLambdaAdapterV2(app, stream)(
          createMockEvent({headers: {'Accept-Encoding': 'zstd'}}),
          createMockContext(),
        );

        expect(stream.getMetadata().headers['content-encoding']).to.be.undefined;
        expect(stream.getData().toString()).to.equal(body);
      });

      it('does not compress a non-compressible content type', async () => {
        app.get('/test', (req, res) => {
          res.setHeader('Content-Type', 'image/jpeg');
          res.end(Buffer.alloc(2048, 0xff));
        });

        await createStreamingLambdaAdapterV2(app, stream)(
          createMockEvent({headers: {'Accept-Encoding': 'gzip'}}),
          createMockContext(),
        );

        expect(stream.getMetadata().headers['content-encoding']).to.be.undefined;
      });

      it('compresses multiple streamed chunks so the concatenation round-trips', async () => {
        app.get('/test', (req, res) => {
          res.setHeader('Content-Type', 'text/plain');
          res.write('chunk1');
          res.write('chunk2');
          res.write('chunk3');
          res.end();
        });

        await createStreamingLambdaAdapterV2(app, stream)(
          createMockEvent({headers: {'Accept-Encoding': 'gzip'}}),
          createMockContext(),
        );

        const metadata = stream.getMetadata();
        expect(metadata.headers['content-encoding']).to.equal('gzip');
        expect(decode('gzip', stream.getData())).to.equal('chunk1chunk2chunk3');
      });

      it('removes content-length when compressing', async () => {
        app.get('/test', (req, res) => {
          res.setHeader('Content-Type', 'text/html');
          res.setHeader('Content-Length', Buffer.byteLength(body));
          res.end(body);
        });

        await createStreamingLambdaAdapterV2(app, stream)(
          createMockEvent({headers: {'Accept-Encoding': 'gzip'}}),
          createMockContext(),
        );

        expect(stream.getMetadata().headers['content-encoding']).to.equal('gzip');
        expect(stream.getMetadata().headers['content-length']).to.be.undefined;
      });

      it('round-trips a gzip response when res.flush() is interspersed with writes', async function () {
        this.timeout(4000);
        app.get('/test', (req, res) => {
          res.setHeader('Content-Type', 'text/plain');
          res.write('a'.repeat(1000));
          (res as unknown as {flush: () => void}).flush();
          setTimeout(() => {
            res.write('b'.repeat(1000));
            (res as unknown as {flush: () => void}).flush();
            res.end();
          }, 10);
        });

        await createStreamingLambdaAdapterV2(app, stream)(
          createMockEvent({headers: {'Accept-Encoding': 'gzip'}}),
          createMockContext(),
        );

        expect(stream.getMetadata().headers['content-encoding']).to.equal('gzip');
        expect(decode('gzip', stream.getData())).to.equal('a'.repeat(1000) + 'b'.repeat(1000));
      });

      describe('config', () => {
        it('uses config.encoding to override negotiation', async () => {
          serveHtml(body);
          const config: StreamingCompressionConfig = {enabled: true, encoding: 'br'};

          await createStreamingLambdaAdapterV2(
            app,
            stream,
            config,
          )(createMockEvent({headers: {'Accept-Encoding': 'gzip'}}), createMockContext());

          expect(stream.getMetadata().headers['content-encoding']).to.equal('br');
          expect(decode('br', stream.getData())).to.equal(body);
        });

        it('uses config.encoding even without an Accept-Encoding header', async () => {
          serveHtml(body);
          const config: StreamingCompressionConfig = {enabled: true, encoding: 'gzip'};

          await createStreamingLambdaAdapterV2(app, stream, config)(createMockEvent(), createMockContext());

          expect(stream.getMetadata().headers['content-encoding']).to.equal('gzip');
        });

        it('disables compression when enabled is false', async () => {
          serveHtml(body);
          const config: StreamingCompressionConfig = {enabled: false};

          await createStreamingLambdaAdapterV2(
            app,
            stream,
            config,
          )(createMockEvent({headers: {'Accept-Encoding': 'br, gzip, deflate'}}), createMockContext());

          expect(stream.getMetadata().headers['content-encoding']).to.be.undefined;
          expect(stream.getData().toString()).to.equal(body);
        });

        it('passes compression options to the underlying stream factory', async () => {
          serveHtml(body);
          const options = {level: 9};
          const config: StreamingCompressionConfig = {enabled: true, encoding: 'gzip', options};
          const createGzipStub = sinon.stub(zlib, 'createGzip').callThrough();

          try {
            await createStreamingLambdaAdapterV2(
              app,
              stream,
              config,
            )(createMockEvent({headers: {'Accept-Encoding': 'gzip'}}), createMockContext());

            expect(createGzipStub.calledWith(options)).to.be.true;
          } finally {
            createGzipStub.restore();
          }
        });
      });
    });
  });
});
