/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {ServerResponse} from 'node:http';
import type {Socket} from 'node:net';
import {EventEmitter} from 'node:events';
import type {Writable} from 'node:stream';
import zlib, {type BrotliCompress, type Gzip, type Deflate, type ZlibOptions, type BrotliOptions} from 'node:zlib';
import Negotiator from 'negotiator';
import compressible from 'compressible';
import type {APIGatewayProxyEvent, Context} from 'aws-lambda';
import type {Express} from 'express';
import {ServerlessRequest} from '@h4ad/serverless-adapter';

/**
 * Request header keys copied verbatim from the request onto the streamed response.
 * These are used for tracing / correlation (matching a response back to its request).
 */
const REQUEST_HEADERS_TO_COPY = ['x-correlation-id'] as const;

/**
 * Hop-by-hop and framing headers that must never be forwarded as AWS response metadata.
 * `content-length` is stripped because the streamed (and possibly compressed) body length
 * is not known up front.
 */
const HEADERS_TO_STRIP = new Set([
  'connection',
  'keep-alive',
  'proxy-connection',
  'transfer-encoding',
  'upgrade',
  'content-length',
]);

/**
 * Encodings supported by the V2 streaming adapter. Unlike V1, zstd is intentionally excluded.
 */
export type StreamingEncoding = 'br' | 'gzip' | 'deflate';

/**
 * Compression configuration for {@link createStreamingLambdaAdapterV2}.
 *
 * @property enabled  - Whether compression is enabled. Defaults to `true`.
 * @property encoding - Force a specific encoding regardless of the request's Accept-Encoding.
 *                      When omitted, the best encoding is negotiated from Accept-Encoding.
 * @property options  - Options passed directly to the underlying zlib/brotli stream factory.
 */
export interface StreamingCompressionConfig {
  enabled?: boolean;
  encoding?: StreamingEncoding;
  options?: ZlibOptions | BrotliOptions;
}

type AsyncHandlerFunction = (event: APIGatewayProxyEvent, context: Context) => Promise<void>;

type CompressionStream = BrotliCompress | Gzip | Deflate;

// Provided by the AWS Lambda response-streaming runtime.
declare const awslambda: {
  HttpResponseStream: {
    from(
      stream: Writable,
      metadata: {statusCode: number; headers: Record<string, string>; cookies?: string[]},
    ): Writable;
  };
};

// Available encodings in server-preference order (mirrors V1, minus zstd).
const AVAILABLE_ENCODINGS: StreamingEncoding[] = ['br', 'gzip', 'deflate'];

/**
 * Parsed HTTP response head (status line + header block).
 */
interface ParsedHead {
  statusCode: number;
  headers: Record<string, string | string[]>;
  cookies: string[];
}

/**
 * Creates a Lambda adapter (V2) that wraps an Express app and streams the response
 * for API Gateway v1 proxy integrations using AWS Lambda response streaming.
 *
 * Unlike V1 — which overrides the Express response methods — V2 drives an unmodified
 * `http.ServerResponse` and intercepts its raw HTTP output through a fake socket. The
 * head block is parsed once to derive the AWS response metadata, then the body is piped
 * (optionally through a compression stream) into the Lambda response stream. Backpressure
 * from the response stream is relayed back to Express so large responses do not buffer
 * unbounded in memory.
 *
 * @param app - Express application instance
 * @param responseStream - AWS Lambda response stream
 * @param config - Optional compression configuration
 * @returns Async Lambda handler function
 */
export function createStreamingLambdaAdapterV2(
  app: Express,
  responseStream: Writable,
  config: StreamingCompressionConfig = {enabled: true},
): AsyncHandlerFunction {
  return async (event: APIGatewayProxyEvent, context: Context): Promise<void> => {
    try {
      await streamResponse(app, responseStream, event, context, config);
    } catch (error) {
      console.error('Error in streaming handler (v2):', error);
      if (isStreamOpen(responseStream)) {
        const message = error instanceof Error ? error.message : String(error);
        responseStream.write(`Internal Server Error: ${message}`);
      } else {
        console.error('[error handler] Cannot write error - stream is closed');
      }
    } finally {
      if (isStreamOpen(responseStream)) {
        responseStream.end();
      }
    }
  };
}

/**
 * Drives the Express app through the socket-intercept response and resolves once the
 * AWS response stream has fully flushed (including any compression trailer).
 */
function streamResponse(
  app: Express,
  responseStream: Writable,
  event: APIGatewayProxyEvent,
  context: Context,
  config: StreamingCompressionConfig,
): Promise<void> {
  const request = eventToExpressRequest(event, context);
  const {response, done} = createStreamingResponse(responseStream, event, config);

  // Surface synchronous framework errors (e.g. a route handler that throws before writing).
  try {
    app(request, response);
  } catch (error) {
    response.emit('error', error instanceof Error ? error : new Error(String(error)));
  }

  return done;
}

/**
 * Converts an API Gateway v1 proxy event into an Express-compatible request.
 */
function eventToExpressRequest(event: APIGatewayProxyEvent, context: Context): ServerlessRequest {
  const {httpMethod, headers, multiValueHeaders, body, isBase64Encoded, requestContext} = event;

  const normalizedHeaders: Record<string, string> = {};
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      if (value === undefined) continue;
      normalizedHeaders[key.toLowerCase()] = value;
    }
  }
  // Merge in multi-value headers (only when they carry more than one value).
  for (const key of Object.keys(multiValueHeaders || {})) {
    const values = multiValueHeaders?.[key];
    if (!values || values.length <= 1) continue;
    normalizedHeaders[key.toLowerCase()] = values.join(',');
  }

  const requestBody: Buffer | undefined = body ? Buffer.from(body, isBase64Encoded ? 'base64' : 'utf-8') : undefined;

  const request = new ServerlessRequest({
    method: httpMethod,
    url: getPathFromEvent(event),
    headers: normalizedHeaders,
    body: requestBody,
    remoteAddress: requestContext?.identity?.sourceIp ?? undefined,
  });

  // Stash the raw invocation for handlers that want it.
  (request as unknown as {apiGateway?: {event: APIGatewayProxyEvent; context: Context}}).apiGateway = {event, context};

  return request;
}

/**
 * Builds the request path with a merged query string from the API Gateway event.
 * Combines multiValueQueryStringParameters and queryStringParameters, de-duplicating values.
 */
function getPathFromEvent(event: APIGatewayProxyEvent): string {
  const mergedParams: Record<string, string[]> = {};

  if (event.multiValueQueryStringParameters) {
    for (const [key, values] of Object.entries(event.multiValueQueryStringParameters)) {
      if (values) mergedParams[key] = [...values];
    }
  }

  if (event.queryStringParameters) {
    for (const [key, value] of Object.entries(event.queryStringParameters)) {
      if (value === undefined) continue;
      if (mergedParams[key]) {
        if (!mergedParams[key].includes(value)) mergedParams[key].push(value);
      } else {
        mergedParams[key] = [value];
      }
    }
  }

  const searchParams = new URLSearchParams();
  for (const [key, values] of Object.entries(mergedParams)) {
    for (const value of values) searchParams.append(key, value);
  }

  const queryString = searchParams.toString();
  return queryString ? `${event.path}?${queryString}` : event.path;
}

/**
 * Creates the socket-intercept response.
 *
 * Returns the `http.ServerResponse` to hand to Express plus a `done` promise that settles
 * when the AWS response stream has fully finished (resolve) or the response errored (reject).
 */
function createStreamingResponse(
  responseStream: Writable,
  event: APIGatewayProxyEvent,
  config: StreamingCompressionConfig,
): {response: ServerResponse; done: Promise<void>} {
  // Values needed at head-parse time, captured up front from the request.
  const acceptEncoding = getRequestHeader(event, 'accept-encoding');
  const copiedHeaders: Record<string, string> = {};
  for (const name of REQUEST_HEADERS_TO_COPY) {
    const value = getRequestHeader(event, name);
    if (value) copiedHeaders[name] = value;
  }

  // @ts-expect-error - ServerResponse expects an IncomingMessage; a minimal shim is sufficient.
  const response = new ServerResponse({method: event.httpMethod});
  // Raw mode: emit the head block + unframed body (no chunked transfer-encoding) so the
  // fake socket receives plain bytes and the head can be split on the first CRLF-CRLF.
  response.useChunkedEncodingByDefault = false;
  response.shouldKeepAlive = false;

  let sink: Writable | null = null;
  let sinkEnded = false;

  // Provide a `flush()` hook on the (otherwise unmodified) ServerResponse for parity
  // with V1. Streaming SSR / RSC handlers call res.flush() to force buffered output —
  // especially partially-filled compression blocks — downstream immediately. Native
  // http.ServerResponse has no flush(), so without this an app that calls it throws
  // (and, when called from a timer, hangs the invocation because res.end() never runs).
  // Flushing a non-compression sink is a no-op: writes are already forwarded straight
  // through the fake socket.
  (response as unknown as {flush: () => void}).flush = (): void => {
    const flushable = sink as (Writable & {flush?: (kind?: number) => void}) | null;
    if (!sinkEnded && flushable && typeof flushable.flush === 'function') {
      flushable.flush();
    }
  };

  // Ends the downstream sink (flushing any compression trailer). Idempotent.
  const endSink = (): void => {
    if (sinkEnded) return;
    sinkEnded = true;
    if (sink) {
      sink.end();
    } else if (isStreamOpen(responseStream)) {
      // No head was ever written (shouldn't happen for a well-behaved app).
      responseStream.end();
    }
  };

  // Called exactly once, when Express writes the first byte. Parses the head, derives AWS
  // metadata, wires compression if applicable, and returns the writable body sink.
  const onReceiveHead = (rawHead: string): Writable => {
    const parsed = parseHead(rawHead);

    // Copy tracing headers from the request (request value wins, matching V1).
    for (const [key, value] of Object.entries(copiedHeaders)) {
      parsed.headers[key] = value;
    }

    const contentType = firstHeaderValue(parsed.headers['content-type']);
    const encoding = negotiateEncoding(acceptEncoding, config);
    const shouldCompress = !!encoding && isCompressible(contentType);

    // Strip hop-by-hop / framing headers; add content-encoding when compressing.
    for (const key of HEADERS_TO_STRIP) delete parsed.headers[key];
    if (shouldCompress) parsed.headers['content-encoding'] = encoding;

    const metadata: {statusCode: number; headers: Record<string, string>; cookies?: string[]} = {
      statusCode: parsed.statusCode,
      headers: flattenHeaders(parsed.headers),
    };
    if (parsed.cookies.length > 0) metadata.cookies = parsed.cookies;

    const httpResponseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
    // Empty write forces the AWS runtime to emit the metadata prelude.
    // See https://github.com/aws/aws-lambda-nodejs-runtime-interface-client HttpResponseStream.
    httpResponseStream.write('');

    if (!shouldCompress) return httpResponseStream;

    const compressor = createCompressionStream(encoding, config.options);
    compressor.on('error', (err: Error) => {
      response.emit('error', err);
    });
    // { end: true } ends httpResponseStream (and therefore responseStream) when the compressor ends.
    compressor.pipe(httpResponseStream, {end: true});
    return compressor;
  };

  const socket = createFakeSocket(
    (head: string, firstBody: Buffer, cb?: () => void): boolean => {
      sink = onReceiveHead(head);
      // Option-1 backpressure: Node does not forward socket 'drain' to a manually-assigned
      // response, so relay the sink's 'drain' onto the response to resume a stalled pipe.
      sink.on('drain', () => response.emit('drain'));
      if (firstBody.length > 0) {
        return sink.write(firstBody, cb);
      }
      if (cb) process.nextTick(cb);
      return true;
    },
    (chunk: Buffer, cb?: () => void): boolean => {
      // Body writes after the head. `sink` is always set by the time we get here.
      return sink ? sink.write(chunk, cb) : true;
    },
  );

  response.assignSocket(socket);

  // Flush/close the sink once Express is done writing the response body.
  response.once('finish', endSink);
  response.once('close', endSink);

  const done = new Promise<void>((resolve, reject) => {
    let settled = false;
    const resolveOnce = (): void => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const rejectOnce = (err: Error): void => {
      if (settled) return;
      settled = true;
      reject(err);
    };

    // Completion is driven by the real AWS stream fully flushing (past any compressor).
    responseStream.once('finish', resolveOnce);
    responseStream.once('close', resolveOnce);
    responseStream.once('error', rejectOnce);
    response.once('error', rejectOnce);
  });

  return {response, done};
}

/**
 * Builds a minimal fake socket that turns the response's raw HTTP output into head + body
 * callbacks. The head is accumulated until the CRLF-CRLF terminator so a head split across
 * multiple writes is still handled correctly.
 */
function createFakeSocket(
  onFirstWrite: (head: string, firstBody: Buffer, cb?: () => void) => boolean,
  onBody: (chunk: Buffer, cb?: () => void) => boolean,
): Socket {
  const socket = new EventEmitter() as unknown as Socket & {_writableState: unknown};
  socket._writableState = {};
  (socket as unknown as {writable: boolean}).writable = true;

  let headParsed = false;
  let headBuffer: Buffer = Buffer.alloc(0);

  const noop = (): void => {};
  Object.assign(socket, {
    cork: noop,
    uncork: noop,
    destroy: noop,
    end: noop,
    setKeepAlive: noop,
    setNoDelay: noop,
    setTimeout: noop,
    ref: noop,
    unref: noop,
  });

  const writeFn = (
    data: Buffer | string,
    encodingOrCb?: BufferEncoding | (() => void),
    maybeCb?: () => void,
  ): boolean => {
    const cb = typeof encodingOrCb === 'function' ? encodingOrCb : maybeCb;
    const encoding: BufferEncoding = typeof encodingOrCb === 'string' ? encodingOrCb : 'utf-8';
    const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data, encoding);

    if (!headParsed) {
      headBuffer = headBuffer.length > 0 ? Buffer.concat([headBuffer, chunk]) : chunk;
      const separator = headBuffer.indexOf('\r\n\r\n');
      if (separator === -1) {
        // Head not complete yet; keep accumulating.
        if (cb) process.nextTick(cb);
        return true;
      }
      headParsed = true;
      const head = headBuffer.subarray(0, separator).toString('latin1');
      const firstBody = headBuffer.subarray(separator + 4);
      headBuffer = Buffer.alloc(0);
      return onFirstWrite(head, firstBody, cb);
    }

    return onBody(chunk, cb);
  };

  (socket as unknown as {write: unknown}).write = writeFn;

  return socket;
}

/**
 * Parses an HTTP response head (status line + headers) into a status code, headers map
 * (repeated keys collected into arrays), and a list of Set-Cookie values.
 */
function parseHead(rawHead: string): ParsedHead {
  const lines = rawHead.split('\r\n');
  const statusParts = (lines[0] || '').split(' ');
  const statusCode = Number.parseInt(statusParts[1], 10) || 200;

  const headers: Record<string, string | string[]> = {};
  const cookies: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (key === 'set-cookie') {
      cookies.push(value);
      continue;
    }

    const existing = headers[key];
    if (existing === undefined) {
      headers[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      headers[key] = [existing, value];
    }
  }

  return {statusCode, headers, cookies};
}

/**
 * Flattens header values into the string map expected by the AWS metadata contract.
 * Multi-value headers are joined with ", ".
 */
function flattenHeaders(headers: Record<string, string | string[]>): Record<string, string> {
  const flattened: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    flattened[key] = Array.isArray(value) ? value.join(', ') : value;
  }
  return flattened;
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Reads a request header from the event case-insensitively, checking both single- and
 * multi-value header maps.
 */
function getRequestHeader(event: APIGatewayProxyEvent, name: string): string | undefined {
  const target = name.toLowerCase();
  if (event.headers) {
    for (const [key, value] of Object.entries(event.headers)) {
      if (value !== undefined && key.toLowerCase() === target) return value;
    }
  }
  if (event.multiValueHeaders) {
    for (const [key, values] of Object.entries(event.multiValueHeaders)) {
      if (values && values.length > 0 && key.toLowerCase() === target) return values.join(',');
    }
  }
  return undefined;
}

/**
 * Determines the compression encoding to use, or null for no compression.
 * Honors an explicit config override, disables when configured off, otherwise negotiates
 * the best available encoding (br > gzip > deflate) from the Accept-Encoding header.
 */
function negotiateEncoding(
  acceptEncoding: string | undefined,
  config: StreamingCompressionConfig,
): StreamingEncoding | null {
  if (config.enabled === false) return null;
  if (config.encoding) return config.encoding;
  if (!acceptEncoding) return null;

  const negotiator = new Negotiator({headers: {'accept-encoding': acceptEncoding}});
  const best = negotiator.encoding(AVAILABLE_ENCODINGS);
  return (best as StreamingEncoding | undefined) || null;
}

/**
 * Checks whether a content type is compressible using the `compressible` package.
 */
function isCompressible(contentType: string | undefined): boolean {
  return contentType ? !!compressible(contentType) : false;
}

/**
 * Creates a compression stream for the given encoding.
 */
function createCompressionStream(
  encoding: StreamingEncoding,
  options?: ZlibOptions | BrotliOptions,
): CompressionStream {
  switch (encoding) {
    case 'br':
      return zlib.createBrotliCompress(options as BrotliOptions);
    case 'gzip':
      return zlib.createGzip(options as ZlibOptions);
    case 'deflate':
      return zlib.createDeflate(options as ZlibOptions);
  }
}

/**
 * Returns true if the stream can still accept writes.
 */
function isStreamOpen(stream: Writable): boolean {
  return !!stream && stream.writable && !stream.destroyed && !stream.writableEnded;
}
