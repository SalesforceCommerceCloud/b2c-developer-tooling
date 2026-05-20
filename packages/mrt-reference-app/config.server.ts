/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {MrtServerConfig} from '@salesforce/b2c-tooling-sdk/operations/mrt';

const bundleType = process.env.MRT_BUNDLE_TYPE;
const ssrEntryPoint = ['stream', 'streaming', 'streamingHandler'].includes(bundleType ?? '') ? 'streamingHandler' : 'ssr';

export const config: MrtServerConfig = {
  ssrOnly: [
    `${ssrEntryPoint}.{js,mjs,cjs}`,
    `${ssrEntryPoint}.{js,mjs,cjs}.map`,
    'request-processor.js',
    'loader.js',
    'package.json',
    '!static/**/*',
  ],
  ssrShared: [
    'static/**/*',
    '**/*.css',
    '**/*.png',
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.gif',
    '**/*.svg',
    '**/*.ico',
    '**/*.woff',
    '**/*.woff2',
    '**/*.ttf',
    '**/*.eot',
  ],
  ssrParameters: {
    ssrFunctionNodeVersion: '24.x',
  },
};
