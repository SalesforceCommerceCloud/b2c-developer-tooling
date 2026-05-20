/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import express, {type Express, type Request, type Response, type NextFunction, type RequestHandler} from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
import basicAuth from 'express-basic-auth';
import {
  createMRTProxyMiddlewares,
  createMRTRequestProcessorMiddleware,
  createMRTStaticAssetServingMiddleware,
  isLocal,
  createMRTCommonMiddleware,
  createMRTCleanUpMiddleware,
  MetricsSender,
  getDimensions,
} from '@salesforce/mrt-utilities';
import {
  echo,
  exception,
  tlsVersionTest,
  cacheTest,
  memoryTest,
  cookieTest,
  headerTest,
  responseHeadersTest,
  loggingMiddleware,
  envBasePathMiddleware,
  streamingTest,
  ssrBundleFileTest,
  streamingResponseLarge,
  multiValueHeadersTest,
  setStatusTest,
  winstonLogging,
  massLogging,
  delayedLogging,
  largeLogging,
  traceLogging,
  dataStoreTest,
  secretsManagerTest,
  proxyTransformationTest,
} from '../utils/reference-routes.js';
import {isolationTests} from '../utils/isolation-actions.js';

const extraRemappedHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.set('server', 'mrt-reference-app');
  next();
};

const createRequestTimingMiddleware = (app: AppWithMetrics) => (req: Request, res: Response, next: NextFunction) => {
  res.locals.requestStartTime = Date.now();
  const afterResponse = () => {
    const responseTime = Date.now() - res.locals.requestStartTime;
    if (app.metrics) {
      const metrics = [
        {name: 'RequestTime', value: responseTime, unit: 'Milliseconds', dimensions: getDimensions()},
      ];
      const requestResult = {name: 'RequestSuccess', value: 1, unit: 'Count', dimensions: getDimensions()};
      if (res.statusCode === 404) {
        requestResult.name = 'RequestFailed404';
      } else if (res.statusCode >= 400 && res.statusCode <= 499) {
        requestResult.name = 'RequestFailed400';
      } else if (res.statusCode >= 500 && res.statusCode <= 599) {
        requestResult.name = 'RequestFailed500';
      }
      metrics.push(requestResult);
      app.metrics.send(metrics, true);
    }
  };
  res.on('finish', afterResponse);
  res.on('error', afterResponse);
  next();
};

type AppWithMetrics = Express & {
  metrics: MetricsSender;
};

export const createApp = (): AppWithMetrics => {
  const app = express() as AppWithMetrics;
  app.disable('x-powered-by');
  app.use(extraRemappedHeadersMiddleware);
  app.metrics = MetricsSender.getSender();
  app.use(createRequestTimingMiddleware(app));
  app.use(createMRTCommonMiddleware() as RequestHandler);

  if (isLocal()) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const rpExtension = process.env.RP_EXTENSION ? '.ts' : '.js';
    const requestProcessorPath = path.resolve(__dirname, `../request-processor${rpExtension}`);
    console.log('Using request processor:', requestProcessorPath);

    const proxyConfigs = [
      {
        host: 'https://playground-22x-us-west-1.mobify-storefront.com',
        path: 'api',
      },
    ];
    app.use(createMRTRequestProcessorMiddleware(requestProcessorPath, proxyConfigs) as RequestHandler);
    const mrtProxies = createMRTProxyMiddlewares(proxyConfigs);
    mrtProxies.forEach((proxy) => {
      app.use(proxy.path, proxy.fn);
    });
    const staticAssetDir = path.resolve(__dirname, '../static');
    console.log('Using static asset directory:', staticAssetDir);
    app.use(
      `/mobify/bundle/${process.env.BUNDLE_ID || '1'}/static/`,
      createMRTStaticAssetServingMiddleware(staticAssetDir) as RequestHandler,
    );
  }
  app.use(createMRTCleanUpMiddleware() as RequestHandler);

  app.get('/favicon.ico', express.static('static/favicon.ico'));
  app.get('/robots.txt', express.static('static/robots.txt'));

  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache');
    return next();
  });

  app.use(loggingMiddleware);
  app.use(envBasePathMiddleware);

  app.all('/exception', exception);
  app.get('/tls', tlsVersionTest);
  app.get('/cache', cacheTest);
  app.get('/cache/:duration', cacheTest);
  app.get('/memtest', memoryTest);
  app.get('/cookie', cookieTest);
  app.get('/headers', headerTest);
  app.get('/isolation', isolationTests);
  app.get('/set-response-headers', responseHeadersTest);
  app.get('/multi-value-headers', multiValueHeadersTest);
  app.get('/streaming', streamingTest);
  app.get('/ssr-shared', ssrBundleFileTest);
  app.get('/streaming-large', streamingResponseLarge);
  app.get('/set-status', setStatusTest);
  app.get('/winston-logging', winstonLogging);
  app.get('/delayed-logging', delayedLogging);
  app.get('/mass-logging', massLogging);
  app.get('/large-logging', largeLogging);
  app.get('/trace-logging', traceLogging);
  app.get('/data-store/:key', dataStoreTest);
  app.get('/secrets-manager', secretsManagerTest);
  app.get('/proxy-transformation', proxyTransformationTest);

  app.all('/auth/logout', (req, res) => res.status(401).send('Logged out'));
  app.use(
    '/auth{*alias}',
    basicAuth({
      users: {mobify: 'supersecret'},
      challenge: true,
      realm: process.env.EXTERNAL_DOMAIN_NAME || 'echo-test',
    }),
  );
  app.all('/auth{*alias}', echo);
  app.all('/{*splat}', echo);
  app.set('json spaces', 4);
  return app;
};
