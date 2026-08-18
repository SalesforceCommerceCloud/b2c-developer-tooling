/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import type {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';
import {
  createDalDynamoDBClient,
  DataStore,
  DataStoreNotFoundError,
  DataStoreServiceError,
  DataStoreUnavailableError,
} from '@salesforce/mrt-utilities';

describe('DataStore', () => {
  let mockSend: sinon.SinonStub;
  let mockDocumentClient: DynamoDBDocumentClient;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = {...process.env};
    (DataStore as unknown as {_instance: DataStore | null})._instance = null;
    DataStore._testDocumentClient = null;
    DataStore._testLogMRTError = null;
    DataStore._testRandom = null;

    mockSend = sinon.stub();
    mockDocumentClient = {send: mockSend} as unknown as DynamoDBDocumentClient;
    DataStore._testDocumentClient = mockDocumentClient;

    process.env.AWS_REGION = 'ca-central-1';
    process.env.MOBIFY_PROPERTY_ID = 'my-project';
    process.env.DEPLOY_TARGET = 'my-target';
  });

  afterEach(() => {
    process.env = originalEnv;
    (DataStore as unknown as {_instance: DataStore | null})._instance = null;
    DataStore._testDocumentClient = null;
    DataStore._testLogMRTError = null;
    DataStore._testRandom = null;
    sinon.restore();
  });

  describe('getDataStore', () => {
    it('returns singleton instance', () => {
      const store1 = DataStore.getDataStore();
      const store2 = DataStore.getDataStore();

      expect(store1).to.equal(store2);
      expect(store1).to.be.an.instanceOf(DataStore);
    });
  });

  describe('isDataStoreAvailable', () => {
    it('returns true when all required env vars are set', () => {
      const store = DataStore.getDataStore();
      expect(store.isDataStoreAvailable()).to.equal(true);
    });

    for (const envVar of ['AWS_REGION', 'MOBIFY_PROPERTY_ID', 'DEPLOY_TARGET']) {
      it(`returns false when ${envVar} is missing`, () => {
        delete process.env[envVar];

        const store = DataStore.getDataStore();

        expect(store.isDataStoreAvailable()).to.equal(false);
      });
    }
  });

  describe('getEntry', () => {
    for (const envVar of ['AWS_REGION', 'MOBIFY_PROPERTY_ID', 'DEPLOY_TARGET']) {
      it(`throws DataStoreUnavailableError when ${envVar} is missing`, async () => {
        delete process.env[envVar];

        const store = DataStore.getDataStore();

        try {
          await store.getEntry('my-key');
          expect.fail('should have thrown');
        } catch (e) {
          expect(e).to.be.an.instanceOf(DataStoreUnavailableError);
          expect((e as Error).message).to.include('The data store is unavailable');
        }
      });
    }

    const valueCases = [
      {Item: {value: {}}},
      {Item: {value: {theme: 'dark'}}},
      {Item: {value: {nested: {theme: 'light'}}}},
    ];
    for (const mockValue of valueCases) {
      it(`returns entry when value exists (${JSON.stringify(mockValue)})`, async () => {
        mockSend.resolves(mockValue);

        const store = DataStore.getDataStore();
        const result = await store.getEntry('my-key');

        expect(result).to.deep.equal({key: 'my-key', value: mockValue.Item!.value});
        expect(mockSend.callCount).to.equal(1);
        const sendArg = mockSend.firstCall.args[0];
        expect(sendArg.input).to.deep.include({
          TableName: 'DataAccessLayer-ca-central-1',
          Key: {
            projectEnvironment: 'my-project my-target',
            key: 'my-key',
          },
        });
      });
    }

    const notFoundCases = [{}, {Item: {}}, {Item: {key: 'my-key'}}, {Item: {value: null}}, {Item: {value: undefined}}];
    for (const mockValue of notFoundCases) {
      it(`throws DataStoreNotFoundError when value not found (${JSON.stringify(mockValue)})`, async () => {
        mockSend.resolves(mockValue);

        const store = DataStore.getDataStore();

        try {
          await store.getEntry('my-key');
          expect.fail('should have thrown');
        } catch (e) {
          expect(e).to.be.an.instanceOf(DataStoreNotFoundError);
          expect((e as Error).message).to.include("Data store entry 'my-key' not found");
        }
      });
    }

    it('throws DataStoreServiceError and logs internal error when send throws', async () => {
      const dynamoError = new Error('boom');
      mockSend.rejects(dynamoError);

      const logStub = sinon.stub();
      DataStore._testLogMRTError = logStub;

      const store = DataStore.getDataStore();

      try {
        await store.getEntry('my-key');
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).to.be.an.instanceOf(DataStoreServiceError);
        expect((e as Error).message).to.include('Data store request failed');
      }
      expect(
        logStub.calledOnceWith('data_store', dynamoError, {
          key: 'my-key',
          projectEnvironment: 'my-project my-target',
          tableName: 'DataAccessLayer-ca-central-1',
          errorName: 'Error',
          throttled: false,
        }),
      ).to.be.true;
    });

    for (const throttleName of [
      'ThrottlingException',
      'ProvisionedThroughputExceededException',
      'RequestLimitExceeded',
      'TooManyRequestsException',
    ]) {
      it(`marks ${throttleName} as throttled in the log context`, async () => {
        const dynamoError = new Error('rate exceeded');
        dynamoError.name = throttleName;
        mockSend.rejects(dynamoError);

        const logStub = sinon.stub();
        DataStore._testLogMRTError = logStub;

        const store = DataStore.getDataStore();

        try {
          await store.getEntry('my-key');
          expect.fail('should have thrown');
        } catch (e) {
          expect(e).to.be.an.instanceOf(DataStoreServiceError);
        }
        expect(
          logStub.calledOnceWith('data_store', dynamoError, {
            key: 'my-key',
            projectEnvironment: 'my-project my-target',
            tableName: 'DataAccessLayer-ca-central-1',
            errorName: throttleName,
            throttled: true,
          }),
        ).to.be.true;
      });
    }

    it('marks an error carrying the retryable throttling trait as throttled', async () => {
      const dynamoError = Object.assign(new Error('slow down'), {
        name: 'ServiceError',
        $retryable: {throttling: true},
      });
      mockSend.rejects(dynamoError);

      const logStub = sinon.stub();
      DataStore._testLogMRTError = logStub;

      const store = DataStore.getDataStore();

      try {
        await store.getEntry('my-key');
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).to.be.an.instanceOf(DataStoreServiceError);
      }
      const context = logStub.firstCall.args[2] as {throttled: boolean};
      expect(context.throttled).to.equal(true);
    });

    it('marks an HTTP 429 response as throttled', async () => {
      const dynamoError = Object.assign(new Error('too many requests'), {
        name: 'ServiceError',
        $metadata: {httpStatusCode: 429},
      });
      mockSend.rejects(dynamoError);

      const logStub = sinon.stub();
      DataStore._testLogMRTError = logStub;

      const store = DataStore.getDataStore();

      try {
        await store.getEntry('my-key');
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).to.be.an.instanceOf(DataStoreServiceError);
      }
      const context = logStub.firstCall.args[2] as {throttled: boolean};
      expect(context.throttled).to.equal(true);
    });

    it('records errorName as undefined and not throttled for a non-Error rejection', async () => {
      // Reject with a raw string (not an Error) to exercise the non-Error branch.
      mockSend.callsFake(() => Promise.reject('a string failure'));

      const logStub = sinon.stub();
      DataStore._testLogMRTError = logStub;

      const store = DataStore.getDataStore();

      try {
        await store.getEntry('my-key');
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).to.be.an.instanceOf(DataStoreServiceError);
      }
      const context = logStub.firstCall.args[2] as {errorName: unknown; throttled: boolean};
      expect(context.errorName).to.equal(undefined);
      expect(context.throttled).to.equal(false);
    });

    describe('sharding (MRT_NUM_SHARDS)', () => {
      const legacyKey = 'my-project my-target';

      it('reads the legacy unsuffixed key when MRT_NUM_SHARDS is unset', async () => {
        delete process.env.MRT_NUM_SHARDS;
        mockSend.resolves({Item: {value: {theme: 'dark'}}});

        await DataStore.getDataStore().getEntry('my-key');

        expect(mockSend.callCount).to.equal(1);
        expect(mockSend.firstCall.args[0].input.Key.projectEnvironment).to.equal(legacyKey);
      });

      it('reads the legacy unsuffixed key when MRT_NUM_SHARDS is 1', async () => {
        process.env.MRT_NUM_SHARDS = '1';
        mockSend.resolves({Item: {value: {theme: 'dark'}}});

        await DataStore.getDataStore().getEntry('my-key');

        expect(mockSend.callCount).to.equal(1);
        expect(mockSend.firstCall.args[0].input.Key.projectEnvironment).to.equal(legacyKey);
      });

      it('reads the legacy unsuffixed key when the random pick is shard 0', async () => {
        process.env.MRT_NUM_SHARDS = '4';
        DataStore._testRandom = () => 0; // floor(0 * 4) = 0
        mockSend.resolves({Item: {value: {theme: 'dark'}}});

        await DataStore.getDataStore().getEntry('my-key');

        expect(mockSend.callCount).to.equal(1);
        expect(mockSend.firstCall.args[0].input.Key.projectEnvironment).to.equal(legacyKey);
      });

      it('reads a suffixed shard key when the random pick is a non-zero shard', async () => {
        process.env.MRT_NUM_SHARDS = '4';
        DataStore._testRandom = () => 0.5; // floor(0.5 * 4) = 2
        mockSend.resolves({Item: {value: {theme: 'dark'}}});

        await DataStore.getDataStore().getEntry('my-key');

        expect(mockSend.callCount).to.equal(1);
        expect(mockSend.firstCall.args[0].input.Key.projectEnvironment).to.equal(`${legacyKey} 2`);
      });

      it('reads the highest shard when random approaches 1', async () => {
        process.env.MRT_NUM_SHARDS = '4';
        DataStore._testRandom = () => 0.999; // floor(0.999 * 4) = 3
        mockSend.resolves({Item: {value: {theme: 'dark'}}});

        await DataStore.getDataStore().getEntry('my-key');

        expect(mockSend.firstCall.args[0].input.Key.projectEnvironment).to.equal(`${legacyKey} 3`);
      });

      it('honors a large shard count', async () => {
        process.env.MRT_NUM_SHARDS = '64';
        DataStore._testRandom = () => 0.5; // floor(0.5 * 64) = 32
        mockSend.resolves({Item: {value: {theme: 'dark'}}});

        await DataStore.getDataStore().getEntry('my-key');

        expect(mockSend.callCount).to.equal(1);
        expect(mockSend.firstCall.args[0].input.Key.projectEnvironment).to.equal(`${legacyKey} 32`);
      });

      it('surfaces a miss on the picked shard as DataStoreNotFoundError with no fallback', async () => {
        process.env.MRT_NUM_SHARDS = '4';
        DataStore._testRandom = () => 0.5; // shard 2
        mockSend.resolves({}); // miss

        try {
          await DataStore.getDataStore().getEntry('my-key');
          expect.fail('should have thrown');
        } catch (e) {
          expect(e).to.be.an.instanceOf(DataStoreNotFoundError);
        }
        // no runtime fallback: exactly one read of the picked shard
        expect(mockSend.callCount).to.equal(1);
        expect(mockSend.firstCall.args[0].input.Key.projectEnvironment).to.equal(`${legacyKey} 2`);
      });

      const invalidCases = ['0', '-1', 'abc', '1.5', ''];
      for (const value of invalidCases) {
        it(`defaults to the legacy key when MRT_NUM_SHARDS is invalid (${JSON.stringify(value)})`, async () => {
          process.env.MRT_NUM_SHARDS = value;
          DataStore._testRandom = () => 0.999; // would pick a high shard if honored
          mockSend.resolves({Item: {value: {theme: 'dark'}}});

          await DataStore.getDataStore().getEntry('my-key');

          expect(mockSend.callCount).to.equal(1);
          expect(mockSend.firstCall.args[0].input.Key.projectEnvironment).to.equal(legacyKey);
        });
      }
    });
  });
});

describe('DataStoreUnavailableError', () => {
  it('has correct name and message', () => {
    const err = new DataStoreUnavailableError('the data store is unavailable');
    expect(err.name).to.equal('DataStoreUnavailableError');
    expect(err.message).to.equal('the data store is unavailable');
    expect(err).to.be.an.instanceOf(Error);
  });
});

describe('DataStoreNotFoundError', () => {
  it('has correct name and message', () => {
    const err = new DataStoreNotFoundError('entry not found');
    expect(err.name).to.equal('DataStoreNotFoundError');
    expect(err.message).to.equal('entry not found');
    expect(err).to.be.an.instanceOf(Error);
  });
});

describe('DataStoreServiceError', () => {
  it('has correct name and message', () => {
    const err = new DataStoreServiceError('this request failed');
    expect(err.name).to.equal('DataStoreServiceError');
    expect(err.message).to.equal('this request failed');
    expect(err).to.be.an.instanceOf(Error);
  });
});

describe('createDalDynamoDBClient', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = {...process.env};
    process.env.AWS_REGION = 'ca-central-1';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('configures the client region from AWS_REGION', async () => {
    const client = createDalDynamoDBClient();
    expect(await client.config.region()).to.equal('ca-central-1');
  });

  it('bounds retries with maxAttempts', async () => {
    const client = createDalDynamoDBClient();
    expect(await client.config.maxAttempts()).to.equal(2);
  });

  it('uses the adaptive retry strategy', async () => {
    const client = createDalDynamoDBClient();
    const strategy = (await client.config.retryStrategy()) as {mode?: string};
    expect(strategy.mode).to.equal('adaptive');
  });

  it('applies bounded connection and request timeouts to the request handler', async () => {
    const client = createDalDynamoDBClient();
    const config = await (
      client.config.requestHandler as unknown as {
        configProvider: Promise<{
          connectionTimeout?: number;
          requestTimeout?: number;
          throwOnRequestTimeout?: boolean;
        }>;
      }
    ).configProvider;
    expect(config.connectionTimeout).to.equal(300);
    expect(config.requestTimeout).to.equal(500);
    // Required for requestTimeout to actually abort a hung request rather than only warn.
    expect(config.throwOnRequestTimeout).to.equal(true);
  });
});
