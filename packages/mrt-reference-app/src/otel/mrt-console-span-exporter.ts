/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable camelcase -- snake_case identifiers (start_time/end_time) match the JSON wire format MRT's log infrastructure parses. */
import {ConsoleSpanExporter, type ReadableSpan} from '@opentelemetry/sdk-trace-base';
import {ExportResultCode, type ExportResult, hrTimeToTimeStamp} from '@opentelemetry/core';

/**
 * MRT-compatible console span exporter.
 *
 * Extends the default {@link ConsoleSpanExporter} to output structured JSON
 * that Managed Runtime's log infrastructure can parse. The default exporter
 * uses `console.dir` with a human-readable format; this override uses
 * `console.info(JSON.stringify(...))` to produce machine-parseable JSON, one
 * line per span, matching the format MRT expects. It mirrors the exporter used
 * by the storefront-next dev tooling.
 *
 * Inherits `shutdown()` and `forceFlush()` from {@link ConsoleSpanExporter}.
 */
export class MrtConsoleSpanExporter extends ConsoleSpanExporter {
  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
    for (const span of spans) {
      try {
        const ctx = span.spanContext();
        const spanData = {
          traceId: ctx.traceId,
          // OpenTelemetry SDK 2.x moved the parent span id onto parentSpanContext.
          parentId: span.parentSpanContext?.spanId,
          name: span.name,
          id: ctx.spanId,
          kind: span.kind,
          timestamp: hrTimeToTimeStamp(span.startTime),
          duration: span.duration,
          attributes: span.attributes,
          status: span.status,
          events: span.events,
          links: span.links,
          start_time: span.startTime,
          end_time: span.endTime,
          forwardTrace: true,
        };
        // eslint-disable-next-line no-console -- intentional: MRT collects stdout as the telemetry transport
        console.info(JSON.stringify(spanData));
      } catch {
        // Skip malformed spans — never let a serialization failure propagate.
      }
    }
    resultCallback({code: ExportResultCode.SUCCESS});
  }
}
