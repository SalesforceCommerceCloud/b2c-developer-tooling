# Spec: Simplified Streaming Lambda Adapter (V2)

**GUS:** N/A
**Date:** 2026-08-24
**Author:** Kieran Haberstock

---

## Context & Goal

The current streaming Lambda adapter (`packages/mrt-utilities/src/streaming/create-lambda-adapter.ts`, ~970 LOC) wraps an Express app and streams its response through AWS Lambda response streaming (`awslambda.HttpResponseStream`) for the Managed Runtime environment, with `Accept-Encoding`-negotiated compression. Over time it has accreted patches, redundant stream-state guards, and dead branches because it hand-builds a `ServerResponse` and overrides nearly every method Express might call (`write`/`end`/`writeHead`/`json`/`send`/`redirect`/`pipe`/`flush`/`flushHeaders`/`append`/`set`), threading compression manually through those overrides.

**Goal:** ship a clean-room V2, `createStreamingLambdaAdapterV2`, exported alongside the existing adapter, that delivers the **same requirements and features** (minus zstd, see below) with a drastically smaller, more maintainable implementation. V2 uses a **socket-intercept** design: Express writes to a genuine, unmodified `http.ServerResponse` whose socket is faked; V2 parses the status line + headers off the raw HTTP wire exactly once, then forwards the body — optionally through a single zlib `Transform` for compression — into the AWS response stream. This eliminates the per-method override surface and reduces compression to one pipeline.

**Who benefits:** MRT SSR bundle maintainers and anyone consuming `@salesforce/mrt-utilities/streaming` — a smaller, correct, and easier-to-reason-about adapter, validated against the existing feature set.

**Approach constraints:** V2's design is derived from the observable requirements/features, **not** from V1's structure. The only interface that must remain stable is the top-level factory signature. The design draws on the `@h4ad/serverless-adapter` `ServerlessStreamResponse` pattern (fake-socket + `onReceiveHeaders` callback + `waitForStreamComplete`), hand-rolled in this package so we own and control it. V2 supports only `br`, `gzip`, and `deflate` — zstd is dropped entirely (no negotiation entry, no override option, no runtime feature-detection).

## Acceptance Criteria

### Scenario: Drop-in factory signature parity

```gherkin
Given an Express app, an AWS Lambda response stream, and an optional compression config
When a caller invokes createStreamingLambdaAdapterV2(app, responseStream, compressionConfig?)
Then it returns an async handler (event: APIGatewayProxyEvent, context: Context) => Promise<void>
And the signature is interchangeable with V1's createStreamingLambdaAdapter
And the compression config defaults to { enabled: true } when omitted
```

### Scenario: Happy-path streamed response

```gherkin
Given an Express route that writes a body and ends the response
When the handler is invoked with a valid APIGatewayProxyEvent
Then the status code and headers are sent once via awslambda.HttpResponseStream.from
And the body is streamed to the response stream
And the response stream is ended exactly once
And the returned promise resolves after the stream completes
```

### Scenario: v1 API Gateway event → Express request conversion

```gherkin
Given an APIGatewayProxyEvent with headers, multiValueHeaders, query params, and a body
When the request is converted for the Express app
Then header keys are matched case-insensitively
And multiValueQueryStringParameters and queryStringParameters are merged
And a base64-encoded body (isBase64Encoded=true) is decoded to a Buffer
And remoteAddress is taken from requestContext.identity.sourceIp when present
```

### Scenario: Compression negotiation and preference order

```gherkin
Given compression is enabled and the response Content-Type is compressible
When the request Accept-Encoding advertises multiple encodings
Then the encoding is chosen in order br > gzip > deflate (via negotiator)
And zstd is never selected or offered
And Content-Encoding is set to the selected encoding
And the Content-Length header is removed
And the body is piped through the matching zlib transform
```

### Scenario: Compression skipped for non-compressible or missing negotiation

```gherkin
Given a response whose Content-Type is not compressible (e.g. image/jpeg, image/png, video/mp4)
  Or a request with no Accept-Encoding header
  Or the compression config has enabled = false
When the response is streamed
Then no compression transform is applied
And no Content-Encoding header is set
And the body is streamed uncompressed
```

### Scenario: Compression config override and options

```gherkin
Given the compression config encoding is set to 'br', 'gzip', or 'deflate'
Then that encoding is used regardless of the Accept-Encoding header
Given the compression config options are set
Then those options are passed to the corresponding zlib/brotli stream
```

### Scenario: Cookies, multi-value headers, and correlation id

```gherkin
Given a response with a set-cookie header (single or array)
Then cookies are placed in the AWS stream metadata cookies field and removed from headers
Given a response header with multiple values
Then it is flattened to a comma-separated string in the metadata
Given the request carries an x-correlation-id header (any casing)
Then that value is copied onto the response headers
```

### Scenario: Status codes

```gherkin
Given routes that respond with 200, an invalid path yielding 400, and an explicit 404
When each is invoked
Then the streamed metadata carries the correct status code
And the status defaults to 200 when none is set
```

### Scenario: Error handling

```gherkin
Given the Express app throws, or throws a non-Error value
When the handler runs
Then an "Internal Server Error" message is written if the stream is still open
And the response stream is always ended in a finally step
And a thrown error never leaves the stream un-ended or the promise unresolved
Given the response stream is already closed when an error occurs
Then the handler does not throw attempting to write to it
```

### Scenario: Backpressure on large / slow-consumer payloads

```gherkin
Given a response body larger than the downstream stream's high-water mark
And a downstream (AWS response stream / compressor) that is momentarily saturated
When the body is streamed (compressed or not)
Then the fake socket's write() returns the downstream write()'s real boolean
And Express pauses writing until the downstream emits 'drain'
And the response completes without data loss, truncation, or unbounded in-memory buffering
```

> **Decision (RIC-confirmed):** the AWS `responseStream` is a real `http.ClientRequest` (`ResponseStream extends ClientRequest`, per `aws-lambda-nodejs-runtime-interface-client` `src/stream/`), whose `write()` returns a genuine boolean and emits `'drain'`; `HttpResponseStream.from` returns that same stream unwrapped, preserving its backpressure. The h4ad reference discards this — its fake socket hardcodes `return true` and `on: NO_OP`, so `ServerResponse`/Express never sees the downstream saturation and can buffer unboundedly.
>
> V2 adopts **Option 1 — relay backpressure through the fake socket**: the fake socket's `write()` returns the downstream `write()`'s real boolean and forwards the downstream `'drain'` event, so Node's own `OutgoingMessage`/`ServerResponse` machinery propagates flow control to Express with no extra buffers. When compressing, the compressor Transform is the immediate downstream and `compressor.pipe(httpResponseStream, { end: true })` handles that leg natively. **Option 2** (a `PassThrough` driven by `stream/promises.pipeline(passThrough, compressor?, httpResponseStream)`) is the fallback if stronger unified error/cleanup semantics are wanted, at the cost of one extra stream hop. **Option 3** (naive always-`true`, the reference/SSE-sample behavior) is rejected because MRT SSR/asset bodies can be large and produced faster than the socket drains.

### Scenario: Empty / bodiless responses

```gherkin
Given a route that ends with no body, or a 204 response
When streamed
Then headers/metadata are still flushed once
And the stream ends cleanly and the promise resolves
```

### Scenario: Express 4 and Express 5 compatibility

```gherkin
Given the adapter is exercised under both express@4 and express@5
When the behavioral suite runs against each
Then all scenarios above pass identically
```

### Scenario: Live validation gate on Managed Runtime

```gherkin
Given V2 is implemented and the unit/behavioral suites pass
And the reference app is built with the V2 adapter selected and deployed to a live MRT environment
When the live compression matrix (br, gzip, deflate, identity) and edge-case suite are run against the deployed URL
Then every response carries the expected Content-Encoding (or none for identity)
And every decoded body matches the identity baseline
And streaming, status codes, cookies, headers, errors, and empty/204 all behave as specified
And no errors or warnings appear in the tailed runtime logs
And any failure triggers a fix → rebuild → redeploy → re-test iteration until the full matrix is green
```

## Constraints & Out of Scope

### Constraints
- **Only stable public contract:** the top-level factory `createStreamingLambdaAdapterV2(app, responseStream, compressionConfig?)`, matching V1's `createStreamingLambdaAdapter` signature and returning the same handler type.
- **No V1 influence on design.** V2 is a bottom-up rewrite driven by requirements/features only. It must not import or mirror V1's `createExpressResponse`/`writeChunk`/`initializeCompression` structure. Do **not** assume `createExpressRequestV2`/`createExpressResponseV2` exist — expose whatever V2's design naturally needs, and only export extra internals if the tests require them.
- **Feature/behavior parity with V1, minus zstd.** Full compression behavior is preserved (negotiation **br→gzip→deflate**, `compressible` gating, config `enabled`/`encoding`/`options`, `Content-Encoding` set, `Content-Length` removed), **but zstd support and its runtime feature-detection guard are removed completely.**
- **Compression config type:** because zstd is gone, V2 does **not** reuse V1's `CompressionConfig` (whose `encoding` union includes `'zstd'`). V2 owns a small config type with `encoding?: 'br' | 'gzip' | 'deflate'`, exported for callers to type the third argument.
- **Implementation approach:** socket-intercept — unmodified `http.ServerResponse` + fake socket, parse status/headers off the raw HTTP wire once, forward body through at most one zlib `Transform` into `awslambda.HttpResponseStream`. Wait for stream completion before ending.
- **Backpressure must be preserved (Option 1).** Unlike the h4ad reference, the fake socket must relay real flow control: its `write()` returns the downstream `write()`'s boolean and it forwards the downstream `'drain'` event, so Express pauses/resumes correctly and the body is not buffered unboundedly. This is safe to do because the AWS `responseStream` is a real `http.ClientRequest` with genuine backpressure (RIC-confirmed).
- **Input remains the v1 `APIGatewayProxyEvent`** and output remains `awslambda.HttpResponseStream` — this is the MRT runtime contract and does not change.
- Must satisfy repo standards: copyright header on new files, lint/format/typecheck clean, ESM+CJS builds, Node ≥ 22.16.
- A changeset targeting `@salesforce/mrt-utilities` is required (new feature → `minor`).

### Out of Scope
- Migrating the shipped consumer to V2 as the production default — the reference app's `streamingHandler.ts` stays on V1 by default; V2 ships available but unadopted. **Exception, for validation only:** a reversible, env-gated adapter selector (`MRT_ADAPTER_VERSION=v2`, defaulting to V1) is added to the reference app so a single test bundle can exercise V2 live (see the **Live / End-to-End Test Plan**). This is a test harness, not the production migration.
- Deprecating or removing V1 — both live side by side; V1 removal is a future decision.
- MRT / deployment / `InvokeMode` / Function URL / API Gateway infrastructure changes — same runtime invocation contract.
- Any new capabilities beyond V1 parity (e.g. HTTP trailers, HTTP/2, additional encodings, new config options).

## Technical Context & References

### Target Files / Directories
- `packages/mrt-utilities/src/streaming/create-lambda-adapter-v2.ts` — **new**, the V2 implementation (socket-intercept + compression transform).
- `packages/mrt-utilities/src/streaming/index.ts` — add `createStreamingLambdaAdapterV2` export (and the V2-owned compression config type); keep V1 exports (`createStreamingLambdaAdapter`, `createExpressRequest`, `createExpressResponse`, `CompressionConfig`) unchanged.
- `packages/mrt-utilities/src/streaming/create-lambda-adapter.ts` — **untouched** (V1 reference).
- `packages/mrt-reference-app/src/streamingHandler.ts` — **live-test harness only**: add a reversible `MRT_ADAPTER_VERSION=v2` selector so the deployed bundle can call `createStreamingLambdaAdapterV2`; default remains V1.
- `packages/mrt-reference-app/scripts/build.mjs`, `config.server.ts` — the streaming bundle is produced with `MRT_BUNDLE_TYPE=stream` (emits `build/streamingHandler.js`). Reference routes used by the live suite live in `packages/mrt-reference-app/src/utils/reference-routes.ts` and `src/app/server.ts`.

### Existing Patterns to Reuse
- **Reference design** (`@h4ad/serverless-adapter@4.4.0`, already a dependency; cloned at `/Users/khaberstock/amos/serverless-adapter`):
  - `src/network/response-stream.ts` — `ServerlessStreamResponse extends ServerResponse` with a fake socket + `onReceiveHeaders(status, headers) => Writable` callback; parses status line and `\r\n\r\n` header block, forwards de-chunked body writes.
  - `src/handlers/aws/aws-stream.handler.ts` — shows the `HttpResponseStream.from(stream, {statusCode, headers, cookies})` wiring, the mandatory empty `write('')` to flush metadata, `set-cookie`→`cookies` extraction, and `await waitForStreamComplete(response)` before `response.end()`.
  - `src/core/stream.ts` — `waitForStreamComplete`/`isStreamEnded`.
- **Compression libraries** (already dependencies): `negotiator` (negotiating over **`['br', 'gzip', 'deflate']`** only), `compressible` (content-type gating), `node:zlib` (`createBrotliCompress`/`createGzip`/`createDeflate` — **no** `createZstdCompress`), `node:stream/promises` `pipeline`.
- **Request side:** `ServerlessRequest` from `@h4ad/serverless-adapter` (as V1 uses) is an acceptable building block for converting the v1 event to an Express request.

### Test Strategy
- New black-box behavioral suites, e.g. `test/streaming/create-lambda-adapter-v2.test.ts` and `test/streaming/create-lambda-adapter-v2-compression.test.ts`, driving the handler with `APIGatewayProxyEvent` fixtures and asserting on the streamed output/metadata.
- Port only the observable/behavioral cases from V1's suites (status, headers, cookies, correlation-id, compression negotiation, content-type gating, Content-Length removal, streaming chunks, errors, backpressure, empty/204). Ignore V1 internal-unit tests.
- Run the matrix against **express@4 and express@5** (reuse `test/helpers/express-versions.ts`).
- Mocha + Chai + sinon per repo conventions; tests must not leak stdout (`runSilent` / silenced logger).
- **Live / end-to-end validation on Managed Runtime is a required final gate**, run only after the unit/behavioral suites pass — see the **Live / End-to-End Test Plan** section below.

### References
- Reference implementation: `@h4ad/serverless-adapter` — `src/network/response-stream.ts`, `src/handlers/aws/aws-stream.handler.ts`, `src/core/stream.ts` (GitHub: `H4ad/serverless-adapter`).
- AWS: Lambda response streaming (`awslambda.streamifyResponse`, `HttpResponseStream.from`); streaming is a Function-URL / `InvokeWithResponseStream` capability (MRT invokes accordingly).
- AWS Lambda Node.js Runtime Interface Client (`aws/aws-lambda-nodejs-runtime-interface-client`, `nodejs24.x` branch) — `src/stream/response-stream.ts`, `http-response-stream.ts`, `types.ts`. Confirms the response stream is an `http.ClientRequest` with genuine backpressure and that `HttpResponseStream.from` returns the same stream unwrapped (basis for the Option 1 backpressure decision).
- AWS backpressure guidance for streamed bodies (`stream/promises` `pipeline`) — Lambda docs `config-rs-write-functions.html`. Note the AWS API Gateway streaming blog and `aws-samples/serverless-samples` (`apigw-response-streaming`) use manual `write()`/`end()` without backpressure handling, but only for producer-limited SSE/LLM token streams — not representative of full-body responses.
- Current adapter under simplification: `packages/mrt-utilities/src/streaming/create-lambda-adapter.ts`.
- Test/reference consumer: `packages/mrt-reference-app/src/streamingHandler.ts` — stays on V1 by default; gains a reversible env-gated V2 selector for the live test.
- MRT tooling used by the live plan (all in this repo): push via `b2c mrt bundle deploy` (`packages/b2c-cli/src/commands/mrt/bundle/deploy.ts` → SDK `pushBundle`/`uploadBundle` in `packages/b2c-tooling-sdk/src/operations/mrt/push.ts`, `POST /api/projects/{slug}/builds/{target}/`); log tailing via `b2c mrt tail-logs` (`packages/b2c-cli/src/commands/mrt/tail-logs.ts` → SDK `tailMrtLogs`, WebSocket `wss://logs-noah.mobify-staging.com`); reference: `docs/cli/mrt.md`, skill `skills/b2c-cli/skills/b2c-mrt`.

## Live / End-to-End Test Plan

This is the **final validation gate**, executed during implementation **after** the unit/behavioral suites are green. It deploys the V2 adapter to a real Managed Runtime environment and exercises the full compression + edge-case matrix against the live URL, iterating (fix → rebuild → redeploy) until everything passes.

### Fixed environment

| Item | Value |
|------|-------|
| Cloud origin | `https://cloud-noah.mobify-staging.com` (custom staging MRT cloud) |
| Credentials file | `~/.mobify--cloud-noah.mobify-staging.com` (Bearer; verified working — `GET /api/organizations/` → 200) |
| Project | `playground-noah` |
| Environment / target | `production` (SSR stage = **Streaming**; `us-west-2`; `arm64`; Node 24.x) |
| Live origin URL | `https://playground-noah-production.mobify-storefront-staging.com` (HTTP/2 via CloudFront `d1gt6mlasnh6as.cloudfront.net`) |
| Log tail host | `wss://logs-noah.mobify-staging.com` (reached via `b2c mrt tail-logs`) |

### Test harness prerequisite (reversible)

Add an env-gated selector to `packages/mrt-reference-app/src/streamingHandler.ts` so the deployed bundle can call V2 while keeping V1 the default:

```ts
const useV2 = process.env.MRT_ADAPTER_VERSION === 'v2';
const adapter = useV2 ? createStreamingLambdaAdapterV2 : createStreamingLambdaAdapter;
// ...adapter(app, responseStream)(event, context)
```

This is a test harness (not the production migration) and is reverted/left defaulting to V1 after sign-off.

### Build & deploy (one iteration)

```bash
cd packages/mrt-reference-app
MRT_ADAPTER_VERSION=v2 MRT_BUNDLE_TYPE=stream pnpm build      # emits build/streamingHandler.js + build/config.server.js
b2c mrt bundle deploy \
  -p playground-noah -e production \
  -o https://cloud-noah.mobify-staging.com \
  -m "v2-adapter-test <iteration-n>" --wait
```

`--wait` blocks until the deploy finishes; `-o` selects the `~/.mobify--<host>` credentials file automatically.

### Log tailing (second terminal, during tests)

```bash
b2c mrt tail-logs -p playground-noah -e production \
  -o https://cloud-noah.mobify-staging.com \
  --level DEBUG -g 'encod|compress|stream|error'
```

Used to confirm the selected encoding branch, backpressure/stream completion, and the absence of errors/warnings. V2 should emit a DEBUG line naming the negotiated encoding so the branch taken is observable in logs (the edge stack can mask response headers — see nuances below).

### Verification method (per request)

```bash
curl -s -H 'Accept-Encoding: <enc>' -D headers.txt -o body.bin <url>/<route>
# 1. assert `content-encoding` header == expected (or absent for identity)
# 2. decode body.bin (brotli -d | gunzip | inflate for deflate) and diff against the identity baseline body
# 3. for streaming/timing: curl -w 'ttfb=%{time_starttransfer} total=%{time_total}\n' --no-buffer
```

### A. Compression matrix (core requirement)

Route: a compressible route with a body large enough to compress (e.g. `/streaming`, `text/plain`; add/confirm a larger compressible JSON route if needed).

| `Accept-Encoding` sent | Expected `Content-Encoding` | Body check |
|------------------------|-----------------------------|------------|
| `br` | `br` | decodes to baseline |
| `gzip` | `gzip` | decodes to baseline |
| `deflate` | `deflate` | decodes to baseline |
| `identity` | *(none)* | plain == baseline |
| *(header omitted)* | *(none)* | plain == baseline |
| `br, gzip, deflate` | `br` (preference order) | decodes to baseline |
| `gzip, deflate` | `gzip` | decodes to baseline |
| `deflate` only | `deflate` | decodes to baseline |
| `zstd` | *(none — zstd removed)* | plain == baseline; assert never `zstd` |
| `gzip;q=1.0, br;q=0.5` | confirm q-value behavior matches V1 (`negotiator`) | decodes to baseline |

### B. Compression gating / skip

- Non-compressible content types (`image/jpeg`, `image/png`, `video/mp4`) with `Accept-Encoding: br` → no `Content-Encoding`, body untouched.
- Compression config `enabled: false` (build/config variant) → never compresses regardless of `Accept-Encoding`.
- Verify `Content-Length` is absent whenever a `Content-Encoding` is applied.

### C. Streaming behavior & backpressure

- `GET /streaming-large` (streams ~1KB × 20 chunks with `res.flush()`, only when built as a stream bundle) → bytes arrive incrementally: `ttfb` ≪ `total`, no all-at-once buffering.
- Large body (multi-MB compressible payload) → completes with no truncation/data loss; combine with `Accept-Encoding: br` to exercise the compressor under backpressure (Option 1 relay).
- Confirm in logs the stream completes cleanly (no unhandled `drain`/write errors).

### D. Response correctness

- Status codes: `200` (normal), `GET /set-status?status=404`, `?status=400`, default-200 route.
- Cookies: `GET /cookie` → `set-cookie` present on the response (delivered via stream metadata `cookies`).
- Custom & multi-value headers: `GET /set-response-headers`, `GET /multi-value-headers` → present/flattened correctly.
- `x-correlation-id` copy: **verify via logs or an echoing route body**, not the edge response header (the CDN/API Gateway regenerates it — observed in baseline probe).
- Request conversion: `POST` to the echo catch-all with a body + query params (incl. repeated keys) → echoed values correct; base64/binary request body decodes correctly.
- `HEAD` request → headers only, no body, no hang.
- Empty / `204` response → headers/metadata flush once, stream ends, request returns promptly.

### E. Error handling

- `ALL /exception` (route throws) → `500` with an "Internal Server Error"-style body, stream ends, connection closes cleanly (no hang / no truncated stream). Confirm the error is logged and the stream is ended exactly once.

### F. Robustness

- Concurrent requests (e.g. `curl` in parallel across routes/encodings) → no cross-talk, no metadata corruption, each response independently correct.

### Baseline (already observed on the current deployed bundle)

`/streaming` returns `text/plain`; `Accept-Encoding: gzip → content-encoding: gzip`, `br → br`, `identity → none`. Served over HTTP/2 through CloudFront, so **no** `transfer-encoding: chunked` and **no** `content-length` at the edge — key live assertions on `content-encoding` + decoded body + streaming timing rather than chunked-transfer headers.

### Iterate loop

On any failed assertion: inspect the response + tailed logs → fix the V2 implementation (or harness) → rebuild (`MRT_ADAPTER_VERSION=v2 MRT_BUNDLE_TYPE=stream pnpm build`) → redeploy (`b2c mrt bundle deploy … -m "v2-adapter-test <n+1>" --wait`) → re-run the failing subset, then the full matrix. Repeat until every row/section is green.

### Exit criteria

- Compression matrix (A) fully green across **br / gzip / deflate / identity**, preference order correct, zstd never selected.
- Gating (B), streaming/backpressure (C), correctness (D), errors (E), robustness (F) all pass.
- No errors or warnings in the tailed logs across the run.
- Live behavior matches the V1 baseline except the intended zstd removal.

### Cleanup / rollback

Shared staging cloud — after sign-off, redeploy the V1 baseline (rebuild with `MRT_ADAPTER_VERSION` unset, or redeploy the prior bundle id) so the environment is not left on the test harness. Note the current bundle id before starting for a quick revert.
