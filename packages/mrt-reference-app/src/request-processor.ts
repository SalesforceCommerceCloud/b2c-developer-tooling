/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {ProxyConfig} from '@salesforce/mrt-utilities';

const exclusions = ['removeme'];

export interface ProcessRequestParameters {
  appHostname: string;
  proxyConfigs: ProxyConfig[];
  environment: string;
  deployTarget: string;
}

export const processRequest = ({
  path,
  querystring,
  parameters,
}: {
  path: string;
  querystring: string;
  parameters: ProcessRequestParameters;
}) => {
  console.assert(parameters, 'Missing parameters');

  const queryParameters = new URLSearchParams(querystring);

  for (const exclusion of exclusions) {
    queryParameters.delete(exclusion);
  }

  querystring = queryParameters.toString();

  return {
    path,
    querystring,
  };
};
