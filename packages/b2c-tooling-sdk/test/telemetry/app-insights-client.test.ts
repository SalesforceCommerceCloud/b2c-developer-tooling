/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {AppInsightsClient, contextTagKeys, parseConnectionString} from '../../src/telemetry/app-insights-client.js';

const FULL_CONN =
  'InstrumentationKey=6fcc215f-0b11-4864-ad5c-3945ae19e2f3;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/;ApplicationId=a60f17ec-265a-4dfc-b8df-03a64695697d';

interface CapturedRequest {
  url: string;
  init: RequestInit;
  body: unknown;
}

/**
 * Stub global fetch and capture the request. Returns a 200 ingestion response.
 */
function stubFetch(sandbox: sinon.SinonSandbox, captured: CapturedRequest[]): sinon.SinonStub {
  return sandbox.stub(globalThis, 'fetch').callsFake(async (url: string | URL | Request, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(init.body as string) : undefined;
    captured.push({url: String(url), init: init ?? {}, body});
    return new Response(JSON.stringify({itemsReceived: 1, itemsAccepted: 1, errors: []}), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    });
  });
}

describe('telemetry/app-insights-client', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('parseConnectionString', () => {
    it('parses a full connection string into iKey and v2.1/track URL', () => {
      const parsed = parseConnectionString(FULL_CONN);
      expect(parsed).to.not.be.null;
      expect(parsed!.iKey).to.equal('6fcc215f-0b11-4864-ad5c-3945ae19e2f3');
      // trailing slash stripped, /v2.1/track appended
      expect(parsed!.trackUrl).to.equal('https://eastus-8.in.applicationinsights.azure.com/v2.1/track');
    });

    it('is case-insensitive on keys', () => {
      const parsed = parseConnectionString('instrumentationkey=abc;ingestionendpoint=https://example.com/');
      expect(parsed!.iKey).to.equal('abc');
      expect(parsed!.trackUrl).to.equal('https://example.com/v2.1/track');
    });

    it('upgrades http endpoints to https', () => {
      const parsed = parseConnectionString('InstrumentationKey=abc;IngestionEndpoint=http://insecure.example.com/');
      expect(parsed!.trackUrl).to.equal('https://insecure.example.com/v2.1/track');
    });

    it('builds endpoint from EndpointSuffix when no IngestionEndpoint is given', () => {
      const parsed = parseConnectionString('InstrumentationKey=abc;EndpointSuffix=applicationinsights.azure.cn');
      expect(parsed!.trackUrl).to.equal('https://dc.applicationinsights.azure.cn/v2.1/track');
    });

    it('includes the location prefix with EndpointSuffix', () => {
      const parsed = parseConnectionString(
        'InstrumentationKey=abc;EndpointSuffix=applicationinsights.azure.cn;Location=chinaeast',
      );
      expect(parsed!.trackUrl).to.equal('https://chinaeast.dc.applicationinsights.azure.cn/v2.1/track');
    });

    it('falls back to the default ingestion endpoint', () => {
      const parsed = parseConnectionString('InstrumentationKey=abc');
      expect(parsed!.trackUrl).to.equal('https://dc.services.visualstudio.com/v2.1/track');
    });

    it('accepts a bare GUID (legacy instrumentation key)', () => {
      const parsed = parseConnectionString('00000000-0000-0000-0000-000000000000');
      expect(parsed!.iKey).to.equal('00000000-0000-0000-0000-000000000000');
      expect(parsed!.trackUrl).to.equal('https://dc.services.visualstudio.com/v2.1/track');
    });

    it('returns null when no instrumentation key is present', () => {
      expect(parseConnectionString('IngestionEndpoint=https://example.com/')).to.be.null;
      expect(parseConnectionString('')).to.be.null;
    });
  });

  describe('trackEvent envelope', () => {
    it('produces a Breeze EventData envelope accepted by the ingestion endpoint', async () => {
      const captured: CapturedRequest[] = [];
      stubFetch(sandbox, captured);

      const client = new AppInsightsClient(FULL_CONN);
      client.context.tags[contextTagKeys.userId] = 'cliid-123';
      client.context.tags[contextTagKeys.cloudRoleInstance] = '';
      client.trackEvent({
        name: 'b2c-cli/TEST_EVENT',
        properties: {action: 'click', version: '1.0.0'},
        measurements: {duration: 42},
      });
      await client.flush();

      expect(captured).to.have.length(1);
      const req = captured[0];
      expect(req.url).to.equal('https://eastus-8.in.applicationinsights.azure.com/v2.1/track');
      expect(req.init.method).to.equal('POST');
      expect((req.init.headers as Record<string, string>)['Content-Type']).to.equal('application/json');

      // body is a JSON array of envelopes
      expect(req.body).to.be.an('array').with.length(1);
      const env = (req.body as Record<string, unknown>[])[0];
      expect(env.ver).to.equal(1);
      expect(env.name).to.equal('Microsoft.ApplicationInsights.Event');
      expect(env.sampleRate).to.equal(100);
      expect(env.iKey).to.equal('6fcc215f-0b11-4864-ad5c-3945ae19e2f3');
      expect(env.time).to.be.a('string').and.match(/Z$/); // ISO-8601 UTC

      // GDPR tags live on the envelope, not in properties
      const tags = env.tags as Record<string, string>;
      expect(tags['ai.user.id']).to.equal('cliid-123');
      expect(tags['ai.cloud.roleInstance']).to.equal('');

      const data = env.data as {baseType: string; baseData: Record<string, unknown>};
      expect(data.baseType).to.equal('EventData');
      expect(data.baseData.ver).to.equal(2);
      expect(data.baseData.name).to.equal('b2c-cli/TEST_EVENT');
      expect(data.baseData.properties).to.deep.equal({action: 'click', version: '1.0.0'});
      expect(data.baseData.measurements).to.deep.equal({duration: 42});
    });

    it('defaults properties and measurements to empty objects', async () => {
      const captured: CapturedRequest[] = [];
      stubFetch(sandbox, captured);

      const client = new AppInsightsClient(FULL_CONN);
      client.trackEvent({name: 'b2c-cli/BARE'});
      await client.flush();

      const data = (captured[0].body as Record<string, unknown>[])[0].data as {baseData: Record<string, unknown>};
      expect(data.baseData.properties).to.deep.equal({});
      expect(data.baseData.measurements).to.deep.equal({});
    });
  });

  describe('trackException envelope', () => {
    it('produces a Breeze ExceptionData envelope with the raw stack', async () => {
      const captured: CapturedRequest[] = [];
      stubFetch(sandbox, captured);

      const client = new AppInsightsClient(FULL_CONN);
      const error = new TypeError('Something failed');
      client.trackException({exception: error, properties: {context: 'test'}, measurements: {count: 1}});
      await client.flush();

      const env = (captured[0].body as Record<string, unknown>[])[0];
      expect(env.name).to.equal('Microsoft.ApplicationInsights.Exception');
      const data = env.data as {baseType: string; baseData: Record<string, unknown>};
      expect(data.baseType).to.equal('ExceptionData');
      expect(data.baseData.ver).to.equal(2);
      expect(data.baseData.severityLevel).to.equal('Error');
      expect(data.baseData.properties).to.deep.equal({context: 'test'});
      expect(data.baseData.measurements).to.deep.equal({count: 1});

      const exceptions = data.baseData.exceptions as Record<string, unknown>[];
      expect(exceptions).to.have.length(1);
      expect(exceptions[0].typeName).to.equal('TypeError');
      expect(exceptions[0].message).to.equal('Something failed');
      expect(exceptions[0].hasFullStack).to.equal(true);
      expect(exceptions[0].stack).to.be.a('string');
    });

    it('omits stack and sets hasFullStack false when the error has no stack', async () => {
      const captured: CapturedRequest[] = [];
      stubFetch(sandbox, captured);

      const client = new AppInsightsClient(FULL_CONN);
      const error = new Error('no stack');
      delete error.stack;
      client.trackException({exception: error});
      await client.flush();

      const data = (captured[0].body as Record<string, unknown>[])[0].data as {baseData: Record<string, unknown>};
      const ex = (data.baseData.exceptions as Record<string, unknown>[])[0];
      expect(ex.hasFullStack).to.equal(false);
      expect(ex).to.not.have.property('stack');
    });
  });

  describe('property/measurement clamping', () => {
    it('truncates over-long property keys (150) and values (8192)', async () => {
      const captured: CapturedRequest[] = [];
      stubFetch(sandbox, captured);

      const client = new AppInsightsClient(FULL_CONN);
      const longKey = 'k'.repeat(200);
      const longValue = 'v'.repeat(10_000);
      client.trackEvent({
        name: 'b2c-cli/LONG',
        properties: {[longKey]: longValue},
        measurements: {['m'.repeat(200)]: 1},
      });
      await client.flush();

      const data = (captured[0].body as Record<string, unknown>[])[0].data as {baseData: Record<string, unknown>};
      const props = data.baseData.properties as Record<string, string>;
      const [emittedKey] = Object.keys(props);
      expect(emittedKey).to.have.lengthOf(150);
      expect(props[emittedKey]).to.have.lengthOf(8192);

      const measurements = data.baseData.measurements as Record<string, number>;
      expect(Object.keys(measurements)[0]).to.have.lengthOf(150);
    });

    it('truncates exception typeName (1024) and message (32768)', async () => {
      const captured: CapturedRequest[] = [];
      stubFetch(sandbox, captured);

      const client = new AppInsightsClient(FULL_CONN);
      const error = new Error('m'.repeat(40_000));
      error.name = 'N'.repeat(2000);
      client.trackException({exception: error});
      await client.flush();

      const data = (captured[0].body as Record<string, unknown>[])[0].data as {baseData: Record<string, unknown>};
      const ex = (data.baseData.exceptions as Record<string, unknown>[])[0];
      expect((ex.typeName as string).length).to.equal(1024);
      expect((ex.message as string).length).to.equal(32768);
    });
  });

  describe('buffering and flush', () => {
    it('batches multiple items into one request', async () => {
      const captured: CapturedRequest[] = [];
      stubFetch(sandbox, captured);

      const client = new AppInsightsClient(FULL_CONN);
      client.trackEvent({name: 'A'});
      client.trackEvent({name: 'B'});
      client.trackException({exception: new Error('C')});
      await client.flush();

      expect(captured).to.have.length(1);
      expect(captured[0].body).to.be.an('array').with.length(3);
    });

    it('clears the buffer after flush so a second flush sends nothing', async () => {
      const captured: CapturedRequest[] = [];
      stubFetch(sandbox, captured);

      const client = new AppInsightsClient(FULL_CONN);
      client.trackEvent({name: 'A'});
      await client.flush();
      await client.flush();

      expect(captured).to.have.length(1);
    });

    it('does not call fetch when the buffer is empty', async () => {
      const fetchStub = stubFetch(sandbox, []);
      const client = new AppInsightsClient(FULL_CONN);
      await client.flush();
      expect(fetchStub.called).to.be.false;
    });
  });

  describe('no-op when no instrumentation key', () => {
    it('does not buffer or send when the connection string has no key', async () => {
      const fetchStub = stubFetch(sandbox, []);
      const client = new AppInsightsClient('IngestionEndpoint=https://example.com/');
      client.trackEvent({name: 'A'});
      client.trackException({exception: new Error('B')});
      await client.flush();
      expect(fetchStub.called).to.be.false;
    });
  });

  describe('error handling', () => {
    it('swallows network errors and still clears the buffer', async () => {
      const fetchStub = sandbox.stub(globalThis, 'fetch').rejects(new Error('network down'));
      const client = new AppInsightsClient(FULL_CONN);
      client.trackEvent({name: 'A'});

      // must not throw
      await client.flush();
      expect(fetchStub.calledOnce).to.be.true;

      // buffer was cleared despite the failure: a second flush sends nothing
      await client.flush();
      expect(fetchStub.calledOnce).to.be.true;
    });

    it('aborts the request after the timeout', async () => {
      let signal: AbortSignal | undefined;
      sandbox.stub(globalThis, 'fetch').callsFake(async (_url, init?: RequestInit) => {
        signal = init?.signal ?? undefined;
        // Never resolves on its own; rely on the abort signal.
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        });
      });

      const client = new AppInsightsClient(FULL_CONN, {timeoutMs: 10});
      client.trackEvent({name: 'A'});
      await client.flush(); // resolves because the abort rejection is swallowed
      expect(signal?.aborted).to.equal(true);
    });
  });
});
