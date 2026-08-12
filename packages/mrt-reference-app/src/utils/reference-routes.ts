/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable camelcase -- snake_case identifiers match the JSON wire format the reference app exposes (e.g., memtest metrics keys, additional_info parameter). */
import type {Request, Response, NextFunction} from 'express';
import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';
import winston from 'winston';
import crypto from 'crypto';
import {SecretsManagerClient, GetSecretValueCommand} from '@aws-sdk/client-secrets-manager';
import {
  DataStore,
  DataStoreNotFoundError,
  DataStoreServiceError,
  DataStoreUnavailableError,
} from '@salesforce/mrt-utilities';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class IntentionalError extends Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(diagnostics: any, ...params: any[]) {
    super(...params);
    this.message = JSON.stringify(diagnostics, null, 2);
    this.name = 'IntentionalError';
  }
}

const ENVS_TO_EXPOSE = [
  'aws_execution_env',
  'aws_lambda_function_memory_size',
  'aws_lambda_function_name',
  'aws_lambda_function_version',
  'aws_lambda_log_group_name',
  'aws_lambda_log_stream_name',
  'aws_region',
  'bundle_id',
  'customer_*',
  'deploy_id',
  'deploy_target',
  'external_domain_name',
  'mobify_property_id',
  'mrt_allow_cookies',
  'mrt_env_base_path',
  'node_env',
  'node_options',
  'tz',
];

const BADSSL_TLS1_1_URL = 'https://tls-v1-1.badssl.com:1011/';
const BADSSL_TLS1_2_URL = 'https://tls-v1-2.badssl.com:1012/';

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
    args: req.query,
    protocol: req.protocol,
    method: req.method,
    path: req.path,
    query: req.query,
    route_path: req.route.path,
    body: req.body,
    headers: sortObjectKeys(req.headers),
    ip: req.ip,
    env: filterAndSortObjectKeys(process.env, ENVS_TO_EXPOSE),
    timestamp: new Date().toISOString(),
    ...(typeof additional_info === 'object' ? {additional_info} : {}),
  };
};

export const echo = (req: Request, res: Response) => res.json(jsonFromRequest(req));

export const exception = (req: Request) => {
  throw new IntentionalError(jsonFromRequest(req));
};

export const tlsVersionTest = async (_: Request, res: Response) => {
  const response11 = await fetch(BADSSL_TLS1_1_URL)
    .then((response) => response.ok)
    .catch(() => false);
  const response12 = await fetch(BADSSL_TLS1_2_URL)
    .then((response) => response.ok)
    .catch(() => false);
  res.header('Content-Type', 'application/json');
  res.send(JSON.stringify({'tls1.1': response11, 'tls1.2': response12}, null, 4));
};

export const outboundLoopTest = async (req: Request, res: Response) => {
  const externalDomain = process.env.EXTERNAL_DOMAIN_NAME;
  if (!externalDomain) {
    return res.status(400).json({error: 'EXTERNAL_DOMAIN_NAME environment variable is not set'});
  }

  const baseUrl = /^https?:\/\//.test(externalDomain) ? externalDomain : `https://${externalDomain}`;
  const requestPath = typeof req.query.path === 'string' ? req.query.path : '/';
  const target = new URL(requestPath, baseUrl).toString();

  const response = await fetch(target, {
    headers: {
      'x-mrt-loop': 'true',
    },
  });
  const body = await response.text();
  res.status(response.status);
  const contentType = response.headers.get('content-type');
  if (contentType) {
    res.set('Content-Type', contentType);
  }
  return res.send(body);
};

export const cacheTest = async (req: Request, res: Response) => {
  let duration = String(req.params.duration || '60');
  if (isNaN(parseInt(duration))) {
    duration = '60';
  }
  res.set('Cache-Control', `s-maxage=${duration}`);
  res.json(jsonFromRequest(req));
};

export const cookieTest = async (req: Request, res: Response) => {
  if (Object.hasOwn(req.query, 'name')) {
    const name = req.query.name as string;
    const value = req.query.value as string;
    res.cookie(name, value);
  }
  res.set('Cache-Control', 'private, max-age=60');
  res.json(jsonFromRequest(req));
};

export const responseHeadersTest = async (req: Request, res: Response) => {
  for (const [key, value] of Object.entries(req.query)) {
    res.set(key, value as string | string[] | undefined);
  }
  res.json(jsonFromRequest(req));
};

export const multiValueHeadersTest = async (req: Request, res: Response) => {
  res.set('X-Multi-Value-Header', ['value1', 'value2', 'value3']);
  res.json(jsonFromRequest(req));
};

export const setStatusTest = async (req: Request, res: Response) => {
  const status = req.query.status ? parseInt(req.query.status as string) : 200;
  res.status(status);
  res.set('X-Status-Code', status.toString());
  res.json(jsonFromRequest(req));
};

export const memoryTest = async (req: Request, res: Response) => {
  const memory_before = process.memoryUsage();
  const test_count = req?.query?.count ? parseInt(req.query.count as string) : 1;
  const test_size = req?.query?.size ? parseInt(req.query.size as string) : 1024;
  const force_gc =
    global?.gc && req?.query && (parseBoolean(req.query.forcegc as string) || parseBoolean(req.query.gc as string));

  const malloc_time_start = Date.now();
  allocateMemory(test_count, test_size);
  const malloc_time_ms = Date.now() - malloc_time_start;

  const gc_time_start = Date.now();
  if (force_gc && global.gc) {
    global.gc();
  }
  const gc_time_ms = Date.now() - gc_time_start;

  const memory_after = process.memoryUsage();
  const memory_delta = calculateNumericDeltas(memory_after, memory_before);
  const factor = 10;
  const test_total_alloc_mb = Math.round(((test_count * test_size) / 1024 / 1024) * factor) / factor;
  const additional_info = {
    memory_end: memory_after,
    memory_delta,
    malloc_time: malloc_time_ms,
    gc_time: gc_time_ms,
    force_gc,
    test_count,
    test_size,
    test_total_alloc_mb,
  };
  res.json(jsonFromRequest(req, additional_info));
};

const allocateMemory = (test_count: number, test_size: number): number => {
  const buffer: Buffer[] = [];
  for (let index = 0; index < test_count; index++) {
    buffer.push(Buffer.alloc(test_size, 0, 'ascii'));
  }
  return buffer.length;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const calculateNumericDeltas = (obj1: Record<string, any>, obj2: Record<string, any>): Record<string, number> => {
  const delta: Record<string, number> = {};
  for (const key in obj1) {
    if (Object.prototype.hasOwnProperty.call(obj1, key) && Object.prototype.hasOwnProperty.call(obj2, key)) {
      if (typeof obj1[key] === 'number' && typeof obj2[key] === 'number') {
        delta[key] = obj1[key] - obj2[key];
      }
    }
  }
  return delta;
};

const parseBoolean = (string_value: string) => {
  if (
    string_value === null ||
    string_value === undefined ||
    typeof string_value !== 'string' ||
    string_value.trim() === ''
  ) {
    return false;
  }
  const lowerCaseValue = string_value.toLowerCase();
  return (
    lowerCaseValue === 'true' ||
    lowerCaseValue === '1' ||
    lowerCaseValue === 'on' ||
    lowerCaseValue === 'enable' ||
    lowerCaseValue === 'enabled' ||
    lowerCaseValue === 'yes'
  );
};

export const headerTest = async (req: Request, res: Response) => {
  res.json({headers: sortObjectKeys(req.headers)});
};

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log(`Request: ${req.method} ${req.originalUrl}`);
  console.log(`Request headers: ${JSON.stringify(req.headers, null, 2)}`);
  const values = {
    string: 'string value',
    number: 1234567890,
    boolean: true,
    null: null,
    undefined,
    NaN,
    object: {foo: 'bar'},
    array: [1, 2, 3],
    date: new Date(),
  };
  for (const value of Object.values(values)) {
    console.log(value);
  }
  res.on('finish', () => {
    const statusCode = res.headersSent ? String(res.statusCode) : String(-1);
    console.log(`Response status: ${statusCode}`);
    if (res.headersSent) {
      const headers = JSON.stringify(res.getHeaders(), null, 2);
      console.log(`Response headers: ${headers}`);
    }
  });
  return next();
};

export const envBasePathMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const basePath = process.env.MRT_ENV_BASE_PATH;
  console.debug(`Base path: Base path: ${basePath}`);
  console.debug(`Request path: Request path: ${req.url}`);
  if (basePath && (req.path.startsWith(`${basePath}/`) || req.path === basePath)) {
    req.url = req.url.slice(basePath.length) || '/';
    console.debug(`Base path: Rewrote ${basePath} -> Original url: ${req.originalUrl} -> New url: ${req.url}`);
  }
  return next();
};

export const streamingTest = async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  const delayMs = 20;
  for (let i = 0; i < 100; i++) {
    res.write(`Here is a streaming chunk${i}\n`);
    if (i < 99) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  res.end();
};

export const ssrBundleFileTest = async (req: Request, res: Response) => {
  try {
    const fileName = `${__dirname}/static/example.json`;
    const data = await fs.readFile(fileName, {encoding: 'utf8'});
    const jsonData = JSON.parse(data);
    res.json(jsonData);
  } catch (error) {
    res.status(500).json({error});
  }
};

const generateRandomText = (numChars: number): string => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < numChars; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
};

export const streamingResponseLarge = (req: Request, res: Response) => {
  if (process.env.MRT_BUNDLE_TYPE !== 'stream') {
    res.status(200);
    res.json({streaming: false});
    return;
  }
  res.status(200);
  res.setHeader('Content-Type', 'text/plain');
  res.write('This is the first piece of streamed data.\n');
  const startTime = Date.now();
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const item = `${Date.now() - startTime}ms This is the ${i + 1} piece of streamed data after a delay ${generateRandomText(1024)}.\n`;
      res.write(item);
      // @ts-expect-error - flush added by streaming adapter
      res.flush();
      if (i === 19) {
        res.end();
      }
    }, i * 500);
  }
};

export const winstonLogging = (req: Request, res: Response) => {
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: {service: 'user-service'},
  });
  logger.add(new winston.transports.Console({format: winston.format.json()}));
  logger.log('info', 'json log using winston that triggers KeyError');
  logger.log({
    metadata: 'defined by cust',
    level: 'info',
    log: 'json log using winston',
    telemetryEvent: 'telemetryEvent field defined by customer',
  } as unknown as winston.LogEntry);
  console.log({'winston-test': 'this is a json log using console.log'});
  console.warn({'winston-test': 'this is a json log using console.warn'});
  console.debug({'winston-test': 'this is a json log using console.debug'});
  console.info({'winston-test': 'this is a json log using console.info'});
  console.error({'winston-test': 'this is a json log using console.error'});
  res.json({message: 'Winston logging completed'});
};

export const delayedLogging = async (req: Request, res: Response) => {
  const delay = req.query.delay ? parseInt(req.query.delay as string) : 10000;
  const startTime = Date.now();
  console.log({duration: Date.now() - startTime, message: `Pre-delayed logging ${delay}ms`});
  await new Promise((resolve) => setTimeout(resolve, delay));
  console.log({duration: Date.now() - startTime, message: `Delayed logging ${delay}ms`});
  res.json({duration: Date.now() - startTime, message: `Delayed logging ${delay}ms`});
};

export const massLogging = (req: Request, res: Response) => {
  const count = req.query.count ? parseInt(req.query.count as string) : 10000;
  const textEncoder = new TextEncoder();
  const startTime = Date.now();
  let size = 0;
  for (let i = 0; i < count; i++) {
    const message = `Mass logging ${i} of ${count}`;
    size += textEncoder.encode(message).length;
    console.log(message);
  }
  const sizeInKB = (size / 1024).toFixed(2);
  res.json({duration: Date.now() - startTime, message: `Mass logging ${count} logs`, size: `${sizeInKB}KB`});
};

export const largeLogging = (req: Request, res: Response) => {
  const count = req.query.count ? parseInt(req.query.count as string) : 10000;
  const textEncoder = new TextEncoder();
  const startTime = Date.now();
  let size = 0;
  let message = '';
  for (let i = 0; i < count; i++) {
    const msg = `Mass logging ${i} of ${count}`;
    size += textEncoder.encode(msg).length;
    message += msg;
  }
  console.log(message);
  const sizeInKB = (size / 1024).toFixed(2);
  res.json({duration: Date.now() - startTime, message: 'Large logging', size: `${sizeInKB}KB`});
};

export const traceLogging = (req: Request, res: Response) => {
  const start = [new Date().getTime(), Number(process.hrtime.bigint())];
  const trace = {
    name: 'mrt.ref.trace',
    traceId: crypto.randomBytes(16).toString('hex'),
    id: crypto.randomBytes(8).toString('hex'),
    forwardTrace: true,
    start_time: start,
    end_time: [new Date().getTime(), Number(process.hrtime.bigint())],
  };
  console.log(JSON.stringify(trace));
  res.json(trace);
};

export const dataStoreTest = async (req: Request, res: Response) => {
  const store = DataStore.getDataStore();
  if (!store.isDataStoreAvailable()) {
    return res.json({dataStore: false});
  }
  let result;
  try {
    result = await store.getEntry(String(req.params.key));
  } catch (err) {
    if (err instanceof DataStoreUnavailableError) {
      return res.status(400).json({error: err.message});
    } else if (err instanceof DataStoreNotFoundError) {
      return res.status(404).json({error: err.message});
    } else if (err instanceof DataStoreServiceError) {
      return res.status(500).json({error: err.message});
    }
    throw err;
  }
  return res.json(result);
};

export const secretsManagerTest = async (req: Request, res: Response) => {
  const secretId = req.query.secretId as string;
  if (!secretId) {
    return res.status(400).json({error: 'Missing required query parameter: secretId'});
  }
  const client = new SecretsManagerClient({region: process.env.AWS_REGION});
  const command = new GetSecretValueCommand({SecretId: secretId});
  try {
    const response = await client.send(command);
    return res.status(200).json({
      success: true,
      secretId,
      arn: response.ARN,
      versionId: response.VersionId,
      hasSecretString: !!response.SecretString,
      hasSecretBinary: !!response.SecretBinary,
    });
  } catch (error: unknown) {
    const err = error as {name?: string; code?: string; message?: string};
    const errorCode = err.name || err.code;
    let statusCode = 500;
    const errorMessage = err.message || 'Unknown error';
    switch (errorCode) {
      case 'ResourceNotFoundException':
        statusCode = 404;
        break;
      case 'InvalidRequestException':
      case 'InvalidParameterException':
        statusCode = 400;
        break;
      case 'DecryptionFailure':
      case 'InternalServiceError':
        statusCode = 500;
        break;
      case 'AccessDeniedException':
        statusCode = 403;
        break;
      default:
        statusCode = 500;
    }
    return res.status(statusCode).json({success: false, error: errorMessage, errorCode, secretId});
  }
};

export const proxyTransformationTest = (req: Request, res: Response) => {
  const siteId = req.headers['x-site-id'] as string;
  const authHeader = req.headers.authorization as string;
  const cookies = req.headers.cookie as string;

  const cookieMap: Record<string, string> = {};
  if (cookies) {
    cookies.split(';').forEach((cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        cookieMap[key] = value;
      }
    });
  }

  const sfdcDwsidFromHeader = req.headers.sfdc_dwsid as string;

  // After the CloudFront proxy origin rewriter runs, all auth cookies should
  // be stripped. We check by prefix to catch the site-id-suffixed names
  // (cc-at_<siteId>, cc-nx-g_<siteId>, cc-nx_<siteId>) without the lambda
  // having to know the original site id (the x-site-id header is also stripped).
  const ccAtCookiePresent = Object.keys(cookieMap).some((k) => k.startsWith('cc-at_'));
  const ccNxGuestCookiePresent = Object.keys(cookieMap).some((k) => k.startsWith('cc-nx-g_'));
  const ccNxRegisteredCookiePresent = Object.keys(cookieMap).some((k) => k.startsWith('cc-nx_'));

  // Validation results — all assertions reflect the EXPECTED post-transformation
  // state: x-site-id and the auth cookies should be gone, Authorization and
  // sfdc_dwsid headers should be present.
  const validations = {
    siteIdPresent: !!siteId,
    siteId: siteId || null,
    authHeaderPresent: !!authHeader,
    authHeader,
    sfdc_dwsidPresent: !!sfdcDwsidFromHeader,
    sfdc_dwsidValue: sfdcDwsidFromHeader,
    dwsidPresent: !!cookieMap.dwsid,
    dwsidValue: cookieMap.dwsid,
    sfdc_dwsidMatchesDwsid: false,
    ccAtCookiePresent,
    ccNxGuestCookiePresent,
    ccNxRegisteredCookiePresent,
  };

  // Determine overall success — post-transformation, the header/cookies that
  // were used as input should be gone, and the derived headers should be present.
  const allValidationsPassed =
    !validations.siteIdPresent &&
    validations.authHeaderPresent &&
    validations.sfdc_dwsidPresent &&
    !validations.dwsidPresent &&
    !ccAtCookiePresent &&
    !ccNxGuestCookiePresent &&
    !ccNxRegisteredCookiePresent;

  return res.json({
    success: allValidationsPassed,
    validations,
    allCookies: cookieMap,
    headers: {
      'x-site-id': req.headers['x-site-id'],
      authorization: req.headers.authorization,
      cookie: req.headers.cookie,
      sfdc_dwsid: req.headers.sfdc_dwsid,
    },
  });
};
