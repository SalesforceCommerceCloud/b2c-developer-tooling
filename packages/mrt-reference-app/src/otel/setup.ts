/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {Tracer} from '@opentelemetry/api';
import {BasicTracerProvider, SimpleSpanProcessor} from '@opentelemetry/sdk-trace-base';
import {resourceFromAttributes} from '@opentelemetry/resources';
import {ATTR_SERVICE_NAME} from '@opentelemetry/semantic-conventions';
import {MrtConsoleSpanExporter} from './mrt-console-span-exporter.js';

export const SERVICE_NAME = 'mrt-reference-app';

let cachedProvider: BasicTracerProvider | null = null;

/**
 * Lazily create (and cache) a {@link BasicTracerProvider} wired to the
 * {@link MrtConsoleSpanExporter}.
 *
 * A `SimpleSpanProcessor` is used (rather than a batching processor) so spans
 * are exported synchronously when they end — the right choice for a
 * short-lived, Lambda-style request/response where the process may freeze
 * between invocations. We call `getTracer()` on the provider directly instead
 * of registering it globally, keeping the footprint minimal and avoiding the
 * need for a global context manager.
 */
export function getTracerProvider(): BasicTracerProvider {
  if (!cachedProvider) {
    cachedProvider = new BasicTracerProvider({
      resource: resourceFromAttributes({[ATTR_SERVICE_NAME]: SERVICE_NAME}),
      spanProcessors: [new SimpleSpanProcessor(new MrtConsoleSpanExporter())],
    });
  }
  return cachedProvider;
}

/** Get a tracer scoped to the reference app. */
export function getTracer(): Tracer {
  return getTracerProvider().getTracer(SERVICE_NAME);
}
