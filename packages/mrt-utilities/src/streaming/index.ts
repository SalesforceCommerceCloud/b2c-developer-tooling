/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

export {
  type CompressionConfig,
  createExpressRequest,
  createExpressResponse,
  createStreamingLambdaAdapter,
} from './create-lambda-adapter.js';

export {
  createStreamingLambdaAdapterV2,
  type StreamingCompressionConfig,
  type StreamingEncoding,
} from './create-lambda-adapter-v2.js';
