/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {APIGatewayProxyEvent, Context} from 'aws-lambda';
import {PassThrough, Writable} from 'node:stream';
import type {Express} from 'express';
import {expect} from 'chai';
import sinon from 'sinon';
import {expressVersions} from '../helpers/express-versions.js';
import {createStreamingLambdaAdapterV2} from '@salesforce/mrt-utilities/streaming';

/**
 * Collecting stream that also captures the AWS metadata written via the mocked
 * `awslambda.HttpResponseStream.from`. `from` returns this same stream (identity),
 * so both compressed and uncompressed bytes land here.
 */
type CollectingStream = PassThrough & {
  getData: () => Buffer;
  getMetadata: () => {statusCode: number; headers: Record<string, string>; cookies?: string[]};
  waitForEnd: () => Promise<void>;
};

function createCollectingStream(): CollectingStream {
  const stream = new PassThrough() as CollectingStream;
  const chunks: Buffer[] = [];
  stream.on('data', (chunk: Buffer) => chunks.push(chunk));

  stream.getData = () => Buffer.concat(chunks);
  stream.getMetadata = () => (stream as any).__metadata;
  stream.waitForEnd = () =>
    new Promise<void>((resolve) => {
      if (stream.readableEnded || stream.writableEnded) return resolve();
      const timeout = setTimeout(resolve, 1000);
      const finish = () => {
        clearTimeout(timeout);
        resolve();
      };
      stream.once('end', finish);
      stream.once('finish', finish);
    });

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
    requestContext: {
      identity: {sourceIp: '127.0.0.1'},
    },
    resource: '/test',
    stageVariables: null,
    ...overrides,
  } as APIGatewayProxyEvent;
}

function createMockContext(overrides?: Partial<Context>): Context {
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
    ...overrides,
  } as Context;
}

describe('create-lambda-adapter-v2', () => {
  let consoleErrorStub: sinon.SinonStub;

  beforeEach(() => {
    installAwslambda();
    // Silence the adapter's and Express's error logging so test output stays clean.
    consoleErrorStub = sinon.stub(console, 'error');
  });

  afterEach(() => {
    consoleErrorStub.restore();
  });

  expressVersions.forEach(({label, express}) => {
    describe(`create-lambda-adapter-v2 (${label})`, () => {
      let app: Express;
      let stream: CollectingStream;

      beforeEach(() => {
        app = express();
        stream = createCollectingStream();
      });

      describe('factory', () => {
        it('returns a handler function', () => {
          const handler = createStreamingLambdaAdapterV2(app, stream);
          expect(typeof handler).to.equal('function');
        });
      });

      describe('happy path', () => {
        it('streams a JSON response with status and body', async () => {
          app.get('/test', (req, res) => {
            res.status(200).json({message: 'success'});
          });

          await createStreamingLambdaAdapterV2(app, stream)(createMockEvent(), createMockContext());

          const metadata = stream.getMetadata();
          expect(metadata.statusCode).to.equal(200);
          expect(metadata.headers['content-type']).to.contain('application/json');
          expect(JSON.parse(stream.getData().toString())).to.deep.equal({message: 'success'});
        });

        it('streams a plain text response via res.send', async () => {
          app.get('/test', (req, res) => {
            res.type('text/plain').send('hello world');
          });

          await createStreamingLambdaAdapterV2(app, stream)(createMockEvent(), createMockContext());

          expect(stream.getMetadata().statusCode).to.equal(200);
          expect(stream.getData().toString()).to.equal('hello world');
        });

        it('honors a custom status code', async () => {
          app.get('/test', (req, res) => {
            res.status(201).json({created: true});
          });

          await createStreamingLambdaAdapterV2(app, stream)(createMockEvent(), createMockContext());

          expect(stream.getMetadata().statusCode).to.equal(201);
        });

        it('strips content-length from the streamed metadata', async () => {
          app.get('/test', (req, res) => {
            const body = 'fixed-length-body';
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Length', Buffer.byteLength(body));
            res.end(body);
          });

          await createStreamingLambdaAdapterV2(app, stream)(createMockEvent(), createMockContext());

          expect(stream.getMetadata().headers['content-length']).to.be.undefined;
          expect(stream.getData().toString()).to.equal('fixed-length-body');
        });
      });

      describe('event to request conversion', () => {
        it('exposes merged query parameters to the app', async () => {
          app.get('/test', (req, res) => {
            res.type('text/plain').send(`foo=${req.query.foo}`);
          });

          await createStreamingLambdaAdapterV2(app, stream)(
            createMockEvent({queryStringParameters: {foo: 'bar'}}),
            createMockContext(),
          );

          expect(stream.getData().toString()).to.equal('foo=bar');
        });

        it('decodes a base64-encoded request body', async () => {
          app.post('/test', express.text({type: '*/*'}), (req, res) => {
            res.type('text/plain').send(`body=${req.body}`);
          });

          await createStreamingLambdaAdapterV2(app, stream)(
            createMockEvent({
              httpMethod: 'POST',
              body: Buffer.from('payload').toString('base64'),
              isBase64Encoded: true,
              headers: {'content-type': 'text/plain'},
            }),
            createMockContext(),
          );

          expect(stream.getData().toString()).to.equal('body=payload');
        });

        it('passes request headers through to the app', async () => {
          app.get('/test', (req, res) => {
            res.type('text/plain').send(`ua=${req.get('user-agent')}`);
          });

          await createStreamingLambdaAdapterV2(app, stream)(
            createMockEvent({headers: {'User-Agent': 'test-agent'}}),
            createMockContext(),
          );

          expect(stream.getData().toString()).to.equal('ua=test-agent');
        });
      });

      describe('response headers, cookies and correlation id', () => {
        it('extracts multiple Set-Cookie values into metadata cookies', async () => {
          app.get('/test', (req, res) => {
            res.setHeader('Set-Cookie', ['a=1', 'b=2']);
            res.end('ok');
          });

          await createStreamingLambdaAdapterV2(app, stream)(createMockEvent(), createMockContext());

          const metadata = stream.getMetadata();
          expect(metadata.cookies).to.deep.equal(['a=1', 'b=2']);
          expect(metadata.headers['set-cookie']).to.be.undefined;
        });

        it('handles a single Set-Cookie value', async () => {
          app.get('/test', (req, res) => {
            res.setHeader('Set-Cookie', 'only=1');
            res.end('ok');
          });

          await createStreamingLambdaAdapterV2(app, stream)(createMockEvent(), createMockContext());

          expect(stream.getMetadata().cookies).to.deep.equal(['only=1']);
        });

        it('joins multi-value response headers', async () => {
          app.get('/test', (req, res) => {
            res.setHeader('X-Multi', ['v1', 'v2']);
            res.end('ok');
          });

          await createStreamingLambdaAdapterV2(app, stream)(createMockEvent(), createMockContext());

          expect(stream.getMetadata().headers['x-multi']).to.equal('v1, v2');
        });

        it('copies x-correlation-id from the request onto the response metadata', async () => {
          app.get('/test', (req, res) => {
            res.end('ok');
          });

          await createStreamingLambdaAdapterV2(app, stream)(
            createMockEvent({headers: {'X-Correlation-ID': 'corr-123'}}),
            createMockContext(),
          );

          expect(stream.getMetadata().headers['x-correlation-id']).to.equal('corr-123');
        });

        it('does not add x-correlation-id when the request lacks it', async () => {
          app.get('/test', (req, res) => {
            res.end('ok');
          });

          await createStreamingLambdaAdapterV2(app, stream)(createMockEvent(), createMockContext());

          expect(stream.getMetadata().headers['x-correlation-id']).to.be.undefined;
        });

        it('strips hop-by-hop connection headers from metadata', async () => {
          app.get('/test', (req, res) => {
            res.end('ok');
          });

          await createStreamingLambdaAdapterV2(app, stream)(createMockEvent(), createMockContext());

          const headers = stream.getMetadata().headers;
          expect(headers.connection).to.be.undefined;
          expect(headers['transfer-encoding']).to.be.undefined;
        });
      });

      describe('empty and no-body responses', () => {
        it('streams a 204 with no body', async () => {
          app.get('/test', (req, res) => {
            res.status(204).end();
          });

          await createStreamingLambdaAdapterV2(app, stream)(createMockEvent(), createMockContext());

          expect(stream.getMetadata().statusCode).to.equal(204);
          expect(stream.getData().length).to.equal(0);
        });

        it('streams headers only for a HEAD request', async () => {
          app.get('/test', (req, res) => {
            res.setHeader('Content-Type', 'text/plain');
            res.end('this body should be suppressed for HEAD');
          });

          await createStreamingLambdaAdapterV2(app, stream)(createMockEvent({httpMethod: 'HEAD'}), createMockContext());

          expect(stream.getMetadata().statusCode).to.equal(200);
          expect(stream.getData().length).to.equal(0);
        });
      });

      describe('error handling', () => {
        it('returns a 500 when a route handler throws', async () => {
          app.get('/test', () => {
            throw new Error('boom');
          });

          await createStreamingLambdaAdapterV2(app, stream)(createMockEvent(), createMockContext());

          expect(stream.getMetadata().statusCode).to.equal(500);
          expect(stream.getData().length).to.be.greaterThan(0);
        });

        it('returns a 404 when a route throws with status 404', async () => {
          app.get('/test', () => {
            const err = new Error('Not Found') as Error & {status: number};
            err.status = 404;
            throw err;
          });

          await createStreamingLambdaAdapterV2(app, stream)(createMockEvent(), createMockContext());

          expect(stream.getMetadata().statusCode).to.equal(404);
          expect(stream.getData().toString()).to.contain('Not Found');
        });

        it('returns a 404 for an unmatched route', async () => {
          app.get('/other', (req, res) => res.end('ok'));

          await createStreamingLambdaAdapterV2(app, stream)(createMockEvent({path: '/missing'}), createMockContext());

          expect(stream.getMetadata().statusCode).to.equal(404);
        });
      });

      describe('backpressure', () => {
        it('surfaces backpressure to the app and resumes on drain without losing data', async function () {
          this.timeout(10000);

          // A deliberately slow sink with a tiny buffer so writes return false and
          // the adapter must wait for the relayed drain event.
          const received: Buffer[] = [];
          const slowSink = new Writable({
            highWaterMark: 256,
            write(chunk: Buffer, _enc, cb) {
              received.push(Buffer.from(chunk));
              setImmediate(cb);
            },
          });
          let finished = false;
          slowSink.on('finish', () => {
            finished = true;
          });
          // from() returns the slow sink as the response stream.
          (globalThis as any).awslambda = {
            HttpResponseStream: {
              from: (_stream: any, metadata: any) => {
                (slowSink as any).__metadata = metadata;
                return slowSink;
              },
            },
          };

          const chunk = Buffer.alloc(4096, 0x61); // 'a'
          const totalChunks = 64;
          const expected = Buffer.concat(Array.from({length: totalChunks}, () => chunk));
          let sawBackpressure = false;

          app.get('/test', async (req, res) => {
            res.setHeader('Content-Type', 'application/octet-stream');
            for (let i = 0; i < totalChunks; i++) {
              const ok = res.write(chunk);
              if (!ok) {
                sawBackpressure = true;
                await new Promise<void>((resolve) => res.once('drain', () => resolve()));
              }
            }
            res.end();
          });

          // Compression disabled so the slow sink is the direct write target.
          await createStreamingLambdaAdapterV2(app, slowSink as any, {enabled: false})(
            createMockEvent(),
            createMockContext(),
          );

          expect(sawBackpressure, 'expected at least one write to return false').to.be.true;
          expect(finished, 'expected the sink to finish').to.be.true;
          expect(Buffer.concat(received).equals(expected)).to.be.true;
        });
      });

      describe('flush (streaming SSR / RSC parity)', () => {
        it('provides res.flush() and streams all data when flush is called from a timer', async function () {
          // Mirrors the reference-app /streaming-large handler, which calls
          // res.flush() from within a setTimeout (i.e. outside the adapter's
          // synchronous app() try/catch). Native http.ServerResponse has no
          // flush(); without the adapter providing one this throws unhandled,
          // res.end() never runs, and the invocation hangs until timeout.
          this.timeout(4000);
          app.get('/test', (req, res) => {
            res.setHeader('Content-Type', 'text/plain');
            res.write('first\n');
            setTimeout(() => {
              (res as unknown as {flush: () => void}).flush();
              res.write('second\n');
              (res as unknown as {flush: () => void}).flush();
              res.end();
            }, 10);
          });

          await createStreamingLambdaAdapterV2(app, stream, {enabled: false})(createMockEvent(), createMockContext());

          expect(stream.getMetadata().statusCode).to.equal(200);
          expect(stream.getData().toString()).to.equal('first\nsecond\n');
        });

        it('res.flush() is a safe no-op when called before any write', async () => {
          app.get('/test', (req, res) => {
            (res as unknown as {flush: () => void}).flush();
            res.setHeader('Content-Type', 'text/plain');
            res.end('ok');
          });

          await createStreamingLambdaAdapterV2(app, stream, {enabled: false})(createMockEvent(), createMockContext());

          expect(stream.getMetadata().statusCode).to.equal(200);
          expect(stream.getData().toString()).to.equal('ok');
        });
      });

      describe('large body integrity', () => {
        it('streams a large body intact', async function () {
          this.timeout(10000);
          const body = 'x'.repeat(512 * 1024);
          app.get('/test', (req, res) => {
            res.setHeader('Content-Type', 'application/octet-stream');
            res.end(body);
          });

          await createStreamingLambdaAdapterV2(app, stream, {enabled: false})(createMockEvent(), createMockContext());

          expect(stream.getData().toString()).to.equal(body);
        });
      });

      describe('empty-body prelude (502 regression)', () => {
        // The real AWS runtime interface client emits the status/headers metadata
        // prelude LAZILY — only just before the first write to the response stream.
        // A body-less response (redirect, 204/304, HEAD, bare res.end()) that reaches
        // end() without ever writing therefore ships with no prelude, and the MRT
        // streaming edge returns its own 502 InternalServerErrorException. The
        // identity `from` stub used elsewhere in this file cannot catch that; this
        // mock faithfully models the lazy prelude so these tests fail if the adapter
        // ever stops forcing it (V2 forces it via the empty write in onReceiveHead).
        type RicStream = Writable & {
          readonly preludeEmitted: boolean;
          readonly metadata: {statusCode: number; headers: Record<string, any>; cookies?: string[]};
          setMetadata: (m: any) => void;
        };

        function createRicStream(): RicStream {
          let preludeEmitted = false;
          let metadata: any;
          const ricStream = new Writable({
            write(_chunk, _enc, cb) {
              // The RIC flushes the prelude immediately before the first body write.
              preludeEmitted = true;
              cb();
            },
          }) as RicStream;
          Object.defineProperties(ricStream, {
            preludeEmitted: {get: () => preludeEmitted},
            metadata: {get: () => metadata},
          });
          ricStream.setMetadata = (m: any) => {
            metadata = m;
          };
          return ricStream;
        }

        beforeEach(() => {
          (globalThis as any).awslambda = {
            HttpResponseStream: {
              // Matches the real RIC: returns the SAME stream (which installs the
              // lazy prelude hook), not a wrapper.
              from: (s: RicStream, meta: any) => {
                s.setMetadata(meta);
                return s;
              },
            },
          };
        });

        const runHandler = async (wire: (a: Express) => void, acceptEncoding?: string): Promise<RicStream> => {
          wire(app);
          const ricStream = createRicStream();
          const headers: Record<string, string> = {};
          if (acceptEncoding) headers['Accept-Encoding'] = acceptEncoding;
          const event = createMockEvent({path: '/t', headers});
          await createStreamingLambdaAdapterV2(app, ricStream)(event, createMockContext());
          return ricStream;
        };

        it('emits the prelude for a bare res.end() with no body', async () => {
          const ricStream = await runHandler((a) => a.get('/t', (_req, res) => res.end()));
          expect(ricStream.preludeEmitted, 'no metadata prelude -> edge 502').to.be.true;
        });

        it('emits the prelude for a body-less redirect', async () => {
          const ricStream = await runHandler((a) => a.get('/t', (_req, res) => res.redirect('/login')));
          expect(ricStream.preludeEmitted, 'no metadata prelude -> edge 502').to.be.true;
          expect(ricStream.metadata.statusCode).to.equal(302);
        });

        it('emits the prelude for a 204 No Content', async () => {
          const ricStream = await runHandler((a) =>
            a.get('/t', (_req, res) => {
              res.status(204);
              res.end();
            }),
          );
          expect(ricStream.preludeEmitted, 'no metadata prelude -> edge 502').to.be.true;
          expect(ricStream.metadata.statusCode).to.equal(204);
        });

        it('emits the prelude for a body-less compressed response', async () => {
          const ricStream = await runHandler(
            (a) =>
              a.get('/t', (_req, res) => {
                res.setHeader('Content-Type', 'text/html');
                res.end();
              }),
            'gzip',
          );
          expect(ricStream.preludeEmitted, 'no metadata prelude -> edge 502').to.be.true;
        });
      });
    });
  });
});
