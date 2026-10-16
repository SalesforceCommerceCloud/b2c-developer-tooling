/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {APIGatewayProxyEvent, Context} from 'aws-lambda';
import type {Writable} from 'stream';
import type {Express} from 'express';
import {createApp} from './app/server.js';
import {createStreamingLambdaAdapter, createStreamingLambdaAdapterV2} from '@salesforce/mrt-utilities';

type AsyncHandlerFunction = (event: APIGatewayProxyEvent, context: Context) => Promise<void>;

type BuildHandler = (responseStream: Writable) => AsyncHandlerFunction;

// Reversible adapter selector: set MRT_ADAPTER_VERSION=v2 to exercise the V2
// (socket-intercept) streaming adapter. Defaults to the V1 adapter so existing
// behavior is unchanged when the variable is unset.
const useV2Adapter = (): boolean => process.env.MRT_ADAPTER_VERSION?.toLowerCase() === 'v2';

const createBuildHandler = (app: Express): BuildHandler => {
  return (responseStream: Writable) => {
    return async (event: APIGatewayProxyEvent, context: Context) => {
      const streamingLambdaAdapter = useV2Adapter()
        ? createStreamingLambdaAdapterV2(app, responseStream)
        : createStreamingLambdaAdapter(app, responseStream);
      return streamingLambdaAdapter(event, context);
    };
  };
};

const mrtApp = createApp();

export const buildHandler = createBuildHandler(mrtApp);
