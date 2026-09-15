/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {context, trace, SpanKind, SpanStatusCode} from '@opentelemetry/api';
import {BasicTracerProvider, SimpleSpanProcessor} from '@opentelemetry/sdk-trace-base';
import {ExportResultCode} from '@opentelemetry/core';
import {MrtConsoleSpanExporter} from './mrt-console-span-exporter.js';

describe('MrtConsoleSpanExporter', () => {
  let infoStub: sinon.SinonStub;

  beforeEach(() => {
    infoStub = sinon.stub(console, 'info');
  });

  afterEach(() => {
    sinon.restore();
  });

  const emittedSpans = () => infoStub.getCalls().map((call) => JSON.parse(call.args[0] as string));

  it('prints one JSON line per span with the MRT-compatible shape', () => {
    const provider = new BasicTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(new MrtConsoleSpanExporter())],
    });
    const tracer = provider.getTracer('test');

    const parent = tracer.startSpan('request', {
      kind: SpanKind.SERVER,
      attributes: {'http.request.method': 'GET', 'url.path': '/products'},
    });
    const child = tracer.startSpan('work', {}, trace.setSpan(context.active(), parent));
    child.addEvent('did-something', {detail: 'x'});
    child.setStatus({code: SpanStatusCode.OK});
    child.end();
    parent.setStatus({code: SpanStatusCode.OK});
    parent.end();

    const spans = emittedSpans();
    expect(spans).to.have.lengthOf(2);

    const [childData, parentData] = spans;

    // Parent span shape.
    expect(parentData).to.include({
      name: 'request',
      id: parent.spanContext().spanId,
      traceId: parent.spanContext().traceId,
      kind: SpanKind.SERVER,
      forwardTrace: true,
    });
    expect(parentData.attributes).to.deep.equal({'http.request.method': 'GET', 'url.path': '/products'});
    expect(parentData.status).to.deep.equal({code: SpanStatusCode.OK});
    // timestamp is an ISO-8601 string; start_time/end_time are raw HrTime tuples.
    expect(parentData.timestamp).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z$/);
    expect(parentData.start_time).to.be.an('array').with.lengthOf(2);
    expect(parentData.end_time).to.be.an('array').with.lengthOf(2);
    expect(parentData.duration).to.be.an('array').with.lengthOf(2);
    expect(parentData.links).to.deep.equal([]);

    // Child span carries parent linkage and its recorded event.
    expect(childData.parentId).to.equal(parent.spanContext().spanId);
    expect(childData.traceId).to.equal(parent.spanContext().traceId);
    expect(childData.events).to.have.lengthOf(1);
    expect(childData.events[0]).to.include({name: 'did-something'});
  });

  it('reports SUCCESS and skips malformed spans without throwing', () => {
    const exporter = new MrtConsoleSpanExporter();
    const callback = sinon.stub();
    const badSpan = {
      spanContext: () => {
        throw new Error('boom');
      },
    } as never;

    expect(() => exporter.export([badSpan], callback)).to.not.throw();
    expect(infoStub.called).to.equal(false);
    expect(callback.calledOnceWith({code: ExportResultCode.SUCCESS})).to.equal(true);
  });
});
