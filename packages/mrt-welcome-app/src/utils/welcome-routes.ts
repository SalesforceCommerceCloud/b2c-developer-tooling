/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable camelcase -- snake_case identifiers match the JSON wire format the welcome app exposes (e.g., additional_info parameter). */
import type {Request, Response} from 'express';

const ENVS_TO_EXPOSE = [
  'aws_execution_env',
  'aws_lambda_function_memory_size',
  'aws_lambda_function_name',
  'aws_lambda_function_version',
  'aws_lambda_log_group_name',
  'aws_lambda_log_stream_name',
  'aws_region',
  'bundle_id',
  // These "customer" defined environment variables are set by the Manager
  // and expected by the MRT smoke test suite
  'customer_*',
  'deploy_id',
  'deploy_target',
  'external_domain_name',
  'mobify_property_id',
  'mrt_allow_cookies',
  'node_env',
  'node_options',
  'tz',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sortObjectKeys = (o: Record<string, any>): Record<string, any> => {
  return Object.assign(
    {},
    ...Object.keys(o)
      .sort()
      .map((k) => ({[k]: o[k]})),
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const filterAndSortObjectKeys = (o: Record<string, any>, whitelist: string[]): Record<string, any> =>
  o &&
  Object.keys(o)
    .filter((key) => {
      const keylc = key.toLowerCase().trim();
      return whitelist.some(
        (pattern) => (pattern.endsWith('*') && keylc.startsWith(pattern.slice(0, -1))) || pattern === keylc,
      );
    })
    .sort()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .reduce((acc: Record<string, any>, key) => {
      acc[key] = o[key];
      return acc;
    }, {});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jsonFromRequest = (req: Request, additional_info?: any): any => {
  return {
    protocol: req.protocol,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    headers: sortObjectKeys(req.headers),
    ip: req.ip,
    env: filterAndSortObjectKeys(process.env, ENVS_TO_EXPOSE),
    ...(typeof additional_info === 'object' ? {additional_info} : {}),
  };
};

export const echo = (req: Request, res: Response) => {
  const content = jsonFromRequest(req);
  res.render('layout', {json_content: content});
};
