/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import type {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';
import {
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
      const dynamoError = new Error('DynamoDB throttled');
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
          tableName: 'DataAccessLayer-ca-central-1',
        }),
      ).to.be.true;
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
