# Implementation Plan: Simplified Streaming Lambda Adapter (V2)

**Spec:** `docs/work/features/simplified-streaming-lambda-adapter-v2/SPEC.md`
**Branch:** `streaming-lambda-adapter-v2`
**GUS:** N/A

## Story Context

Clean-room V2 of the streaming Lambda adapter (`createStreamingLambdaAdapterV2`), a socket-intercept
design with feature parity to V1 minus zstd. Only the top-level factory signature is a stable contract.

### Empirically de-risked before planning (Node 22.17.1)

- `OutgoingMessage.write()` returns the fake socket's `write()` boolean → backpressure relays.
- Emitting `'drain'` on the **response** (not the socket) resumes a stalled `pipe()` (all chunks
  delivered, `finish` fires) → Option-1 wiring is `sink.on('drain', () => res.emit('drain'))`.
- Disabling chunked encoding (`useChunkedEncodingByDefault = false` + `shouldKeepAlive = false`) makes
  the socket receive the **head block + raw body** — no chunk-size framing — so the parser is trivial
  and robust (not the Node-version-pinned de-chunker in the h4ad reference). Validated for 204/empty,
  `setHeader`+`end` with no `writeHead`, and multiple `Set-Cookie` lines.

## Implementation Steps

### Step 1: V2 core (socket-intercept response + factory)
**Files**: `packages/mrt-utilities/src/streaming/create-lambda-adapter-v2.ts` (new), `src/streaming/index.ts`
- `StreamingCompressionConfig` type (`encoding?: 'br' | 'gzip' | 'deflate'`), owned by V2 (no zstd).
- `createStreamingLambdaAdapterV2(app, responseStream, config = {enabled: true})`.
- `ServerResponse` in raw mode + fake socket: parse head once, `onReceiveHeaders` callback, Option-1 drain relay.
- Event → Express request via `ServerlessRequest`.
- Await response completion; end the AWS stream in `finally`; error path writes "Internal Server Error" if open.
- Export the factory + config type.

### Step 2: Compression negotiation + pipeline
**Files**: same
- `negotiateEncoding` (br > gzip > deflate via `negotiator`; `config.encoding` override; `enabled:false`; no zstd).
- `createCompressor` (br/gzip/deflate).
- In `onReceiveHeaders`: gate on `compressible` + enabled, set `content-encoding`, strip `content-length` +
  hop-by-hop headers, `compressor.pipe(httpResponseStream, {end: true})`; extract `set-cookie` → `cookies`,
  flatten multi-value headers, copy `x-correlation-id`.

### Step 3: Unit/behavioral tests (black-box, express4 + express5)
**Files**: `test/streaming/create-lambda-adapter-v2.test.ts`, `test/streaming/create-lambda-adapter-v2-compression.test.ts`
- Drive the factory with a real Express app + collecting stream (mock `awslambda`).
- All acceptance scenarios: signature/defaults, happy path, event→request conversion, status codes,
  cookies/multi-value/correlation-id, errors, empty/204, backpressure (large body + saturated sink →
  no loss + drain resume), compression matrix (br/gzip/deflate/identity, preference, zstd-never, override,
  options, gating, content-length removed). Run `test:agent` + typecheck + lint.

### Step 4: Reference-app V2 harness (reversible)
**Files**: `packages/mrt-reference-app/src/streamingHandler.ts`
- `MRT_ADAPTER_VERSION=v2` selector, default V1.

### Step 5: Live E2E on cloud-noah / playground-noah / production
- Build (`MRT_ADAPTER_VERSION=v2 MRT_BUNDLE_TYPE=stream pnpm build`) → `b2c mrt bundle deploy … --wait`.
- Run the spec's compression matrix + edge cases against the live URL while tailing logs; iterate on failure.

### Step 6: Self-review + changeset (no commit)
- `code-review` subagent on the diff; fix findings; add `@salesforce/mrt-utilities` **minor** changeset.
- Everything left uncommitted for review.

## Test Strategy
Unit (mocha, express4+5) → typecheck → lint → live compression matrix + edge cases with log verification → iterate.

## Risks & Mitigations
- **Socket framing coupling** → raw non-chunked mode (validated Node 22); unit tests capture regressions.
- **Backpressure** → validated empirically (drain on response resumes pipe).
- **Live shared env** → reversible harness; current bundle id **71** is the rollback point; tagged deploy messages.
- **HTTP/2 edge** masks chunked/content-length headers and regenerates `x-correlation-id` → assert on
  `content-encoding` + decoded body + timing; verify correlation-id via logs.
