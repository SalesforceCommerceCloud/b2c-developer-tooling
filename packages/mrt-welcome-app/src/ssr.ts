/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {Express} from 'express';
import {createApp} from './app/server.js';
import {ServerlessAdapter, getFlattenedHeadersMap} from '@h4ad/serverless-adapter';
import {DefaultHandler} from '@h4ad/serverless-adapter/lib/handlers/default';
import {CallbackResolver} from '@h4ad/serverless-adapter/lib/resolvers/callback';
import {ApiGatewayV1Adapter} from '@h4ad/serverless-adapter/lib/adapters/aws';
import {ExpressFramework} from '@h4ad/serverless-adapter/lib/frameworks/express';
import type {APIGatewayProxyEvent, Context, APIGatewayProxyResult, Callback} from 'aws-lambda';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HandlerFunction = (event: APIGatewayProxyEvent, context: Context, callback: Callback) => any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const processLambdaResponse = (response: APIGatewayProxyResult, _event: APIGatewayProxyEvent): any => {
  if (!response) return response;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const joinedHeaders = getFlattenedHeadersMap(response.multiValueHeaders || ({} as any), ',', true);
  joinedHeaders.date = new Date().toUTCString();
  delete response.multiValueHeaders;

  const result = {
    ...response,
    headers: joinedHeaders,
  };
  return result;
};

const createLambdaHandler = (app: Express): HandlerFunction => {
  const handler = (event: APIGatewayProxyEvent, context: Context, callback: Callback) => {
    const serverlessAdapterHandler = ServerlessAdapter.new(app)
      .setFramework(new ExpressFramework())
      .setHandler(new DefaultHandler())
      .setResolver(new CallbackResolver())
      .addAdapter(new ApiGatewayV1Adapter({lowercaseRequestHeaders: true, throwOnChunkedTransferEncoding: false}))
      .build() as HandlerFunction;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (context as any).callbackWaitsForEmptyEventLoop = false;

    const managedCallback = (err: Error | null, response: APIGatewayProxyResult) => {
      return callback(err, processLambdaResponse(response, event));
    };

    return serverlessAdapterHandler(event, context, managedCallback as Callback);
  };
  return handler;
};

const mrtApp = createApp();

export const app = mrtApp;
export const get = createLambdaHandler(mrtApp);
