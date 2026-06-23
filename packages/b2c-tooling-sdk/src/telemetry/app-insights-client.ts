/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Zero-dependency Application Insights ingestion client.
 *
 * This is a deliberately tiny replacement for the `applicationinsights` npm
 * package. We only ever did manual event/exception tracking (every
 * auto-collection feature was disabled), so the full SDK — which in v3.x pulls
 * in ~98 transitive packages (OpenTelemetry, the Azure SDK, gRPC/protobuf, DB
 * instrumentations) — was vastly more than we needed.
 *
 * Instead we POST classic "Breeze" telemetry envelopes directly to the
 * ingestion endpoint using Node's built-in global `fetch` (Node >= 22). The
 * wire format and `/v2.1/track` endpoint were verified by capturing what the
 * real v3 SDK emits and by a live round-trip against the ingestion endpoint
 * (which returned `itemsAccepted` for these exact envelopes).
 *
 * Only the surface the {@link Telemetry} wrapper uses is implemented:
 * {@link AppInsightsClient.trackEvent}, {@link AppInsightsClient.trackException},
 * and {@link AppInsightsClient.flush}. The shape mirrors the SDK's
 * `TelemetryClient` (`config`, `context.tags`/`context.keys`) so the wrapper
 * stays a thin adapter.
 *
 * @module telemetry/app-insights-client
 * @internal
 */

/** Path appended to the ingestion endpoint. The v3 SDK uses v2.1. */
const TRACK_PATH = '/v2.1/track';
/** Default ingestion endpoint when the connection string omits one. */
const DEFAULT_INGESTION_ENDPOINT = 'https://dc.services.visualstudio.com';
/** Envelope-level schema version (Breeze `ver`). */
const ENVELOPE_VERSION = 1;
/** baseData schema version (Breeze EventData/ExceptionData `ver`). */
const BASE_DATA_VERSION = 2;
/** We never sample client-side. */
const SAMPLE_RATE = 100;
/** Default request timeout so a hung endpoint never blocks CLI exit. */
const DEFAULT_TIMEOUT_MS = 5000;

/** Breeze property/measurement limits (server truncates beyond these). */
const MAX_KEY_LENGTH = 150;
const MAX_VALUE_LENGTH = 8192;

/**
 * Context tag keys, mirroring `client.context.keys` from the SDK so callers can
 * keep using the familiar `tags[keys.userId]` idiom.
 */
export const contextTagKeys = {
  userId: 'ai.user.id',
  cloudRoleInstance: 'ai.cloud.roleInstance',
} as const;

/** A single Breeze telemetry envelope as serialized on the wire. */
interface Envelope {
  ver: number;
  name: string;
  time: string;
  sampleRate: number;
  iKey: string;
  tags: Record<string, string>;
  data: {
    baseType: 'EventData' | 'ExceptionData';
    baseData: Record<string, unknown>;
  };
}

/** Arguments for {@link AppInsightsClient.trackEvent}. */
export interface TrackEventArgs {
  name: string;
  properties?: Record<string, string>;
  measurements?: Record<string, number>;
}

/** Arguments for {@link AppInsightsClient.trackException}. */
export interface TrackExceptionArgs {
  exception: Error;
  properties?: Record<string, string>;
  measurements?: Record<string, number>;
}

/**
 * Parse an Application Insights connection string into the instrumentation key
 * and resolved ingestion `/v2.1/track` URL.
 *
 * The connection string is semicolon-delimited `key=value` pairs with
 * case-insensitive keys, e.g.
 * `InstrumentationKey=<guid>;IngestionEndpoint=https://<region>.in.applicationinsights.azure.com/`.
 *
 * Plain GUIDs (legacy instrumentation keys with no `=`) are also accepted.
 *
 * @returns the iKey and track URL, or `null` if no instrumentation key is present.
 */
export function parseConnectionString(connectionString: string): {iKey: string; trackUrl: string} | null {
  const fields: Record<string, string> = {};
  let bareKey: string | undefined;

  for (const part of connectionString.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) {
      // A bare token with no '=' — treat as a legacy instrumentation key.
      bareKey = trimmed;
      continue;
    }
    fields[trimmed.slice(0, eq).trim().toLowerCase()] = trimmed.slice(eq + 1).trim();
  }

  const iKey = fields.instrumentationkey ?? bareKey;
  if (!iKey) return null;

  let endpoint: string;
  if (fields.ingestionendpoint) {
    endpoint = fields.ingestionendpoint;
  } else if (fields.endpointsuffix) {
    const locationPrefix = fields.location ? `${fields.location}.` : '';
    endpoint = `https://${locationPrefix}dc.${fields.endpointsuffix}`;
  } else {
    endpoint = DEFAULT_INGESTION_ENDPOINT;
  }

  // Sanitize: upgrade http -> https and strip any trailing slash, matching the SDK.
  endpoint = endpoint.replace(/^http:\/\//i, 'https://').replace(/\/+$/, '');

  return {iKey, trackUrl: endpoint + TRACK_PATH};
}

/**
 * Truncate a string to a maximum length (Breeze enforces server-side; we mirror
 * it to keep payloads tidy).
 */
function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

/** Clamp a Record's keys/values to Breeze limits. */
function clampProperties(properties: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(properties)) {
    out[truncate(key, MAX_KEY_LENGTH)] = truncate(value, MAX_VALUE_LENGTH);
  }
  return out;
}

function clampMeasurementKeys(measurements: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(measurements)) {
    out[truncate(key, MAX_KEY_LENGTH)] = value;
  }
  return out;
}

/**
 * A minimal, dependency-free Application Insights client.
 *
 * Construct with an instrumentation key or connection string, optionally set
 * {@link AppInsightsClient.context} tags, then buffer telemetry via
 * {@link AppInsightsClient.trackEvent}/{@link AppInsightsClient.trackException}
 * and deliver it with {@link AppInsightsClient.flush}.
 *
 * If the connection string has no instrumentation key, the client becomes an
 * inert no-op (every method silently does nothing) — it never throws into
 * calling code.
 */
export class AppInsightsClient {
  /**
   * SDK-compatible config bag. Retained so callers can read
   * `config.connectionString`; the SDK's auto-collection toggles are obsolete
   * here (this client only does manual tracking) and are intentionally absent.
   */
  readonly config: {connectionString: string};

  /** SDK-compatible context: per-envelope tags plus the canonical key names. */
  readonly context: {tags: Record<string, string>; keys: typeof contextTagKeys};

  private readonly iKey: string | undefined;
  private readonly trackUrl: string | undefined;
  private readonly timeoutMs: number;
  private buffer: Envelope[] = [];

  constructor(connectionString: string, options: {timeoutMs?: number} = {}) {
    this.config = {connectionString};
    this.context = {tags: {}, keys: contextTagKeys};
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const parsed = parseConnectionString(connectionString);
    if (parsed) {
      this.iKey = parsed.iKey;
      this.trackUrl = parsed.trackUrl;
    }
  }

  /** Buffer an event envelope. Delivered on the next {@link flush}. */
  trackEvent(args: TrackEventArgs): void {
    if (!this.iKey) return;
    this.buffer.push(
      this.envelope('EventData', {
        ver: BASE_DATA_VERSION,
        name: args.name,
        properties: clampProperties(args.properties ?? {}),
        measurements: clampMeasurementKeys(args.measurements ?? {}),
      }),
    );
  }

  /** Buffer an exception envelope. Delivered on the next {@link flush}. */
  trackException(args: TrackExceptionArgs): void {
    if (!this.iKey) return;
    const {exception} = args;
    const stack = exception.stack;
    const details: Record<string, unknown> = {
      typeName: truncate(exception.name || 'Error', 1024),
      message: truncate(exception.message || '', 32768),
      hasFullStack: Boolean(stack),
    };
    if (stack) details.stack = truncate(stack, 32768);

    this.buffer.push(
      this.envelope('ExceptionData', {
        ver: BASE_DATA_VERSION,
        exceptions: [details],
        severityLevel: 'Error',
        properties: clampProperties(args.properties ?? {}),
        measurements: clampMeasurementKeys(args.measurements ?? {}),
      }),
    );
  }

  /**
   * POST all buffered envelopes to the ingestion endpoint in one request and
   * clear the buffer. Best-effort: any network/HTTP error is swallowed (the
   * buffer is still cleared) so telemetry never affects the caller.
   */
  async flush(): Promise<void> {
    if (!this.trackUrl || this.buffer.length === 0) {
      this.buffer = [];
      return;
    }
    const body = JSON.stringify(this.buffer);
    this.buffer = [];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      await fetch(this.trackUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Accept: 'application/json'},
        body,
        signal: controller.signal,
      });
    } catch {
      // best-effort: ignore network errors, timeouts, and abort
    } finally {
      clearTimeout(timer);
    }
  }

  /** Build a Breeze envelope, stamping the current context tags and time. */
  private envelope(baseType: 'EventData' | 'ExceptionData', baseData: Record<string, unknown>): Envelope {
    return {
      ver: ENVELOPE_VERSION,
      name:
        baseType === 'EventData' ? 'Microsoft.ApplicationInsights.Event' : 'Microsoft.ApplicationInsights.Exception',
      time: new Date().toISOString(),
      sampleRate: SAMPLE_RATE,
      iKey: this.iKey as string,
      tags: {...this.context.tags},
      data: {baseType, baseData},
    };
  }
}
