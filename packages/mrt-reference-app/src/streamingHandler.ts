/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {APIGatewayProxyEvent, Context} from 'aws-lambda';
import type {Writable} from 'stream';
import type {Express} from 'express';
import {createApp} from './app/server.js';
import {createStreamingLambdaAdapter} from '@salesforce/mrt-utilities';

type AsyncHandlerFunction = (event: APIGatewayProxyEvent, context: Context) => Promise<void>;

type BuildHandler = (responseStream: Writable) => AsyncHandlerFunction;

const createBuildHandler = (app: Express): BuildHandler => {
  return (responseStream: Writable) => {
    return async (event: APIGatewayProxyEvent, context: Context) => {
      const streamingLambdaAdapter = createStreamingLambdaAdapter(app, responseStream);
      return streamingLambdaAdapter(event, context);
    };
  };
};

const mrtApp = createApp();

export const buildHandler = createBuildHandler(mrtApp);
