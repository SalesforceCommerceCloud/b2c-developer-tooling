/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import express, {type Express, type Request, type Response, type NextFunction, type RequestHandler} from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
import ejs from 'ejs';
import {isLocal, createMRTCommonMiddleware, createMRTCleanUpMiddleware} from '@salesforce/mrt-utilities';
import {echo} from '../utils/welcome-routes.js';

const extraRemappedHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.set('server', 'mrt welcome app');
  next();
};

export const createApp = (): Express => {
  const app = express();
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  app.disable('x-powered-by');
  app.use(extraRemappedHeadersMiddleware);
  app.use(createMRTCommonMiddleware() as RequestHandler);
  app.use(createMRTCleanUpMiddleware() as RequestHandler);

  app.engine('html', ejs.renderFile);
  const viewsPath = isLocal()
    ? path.resolve(__dirname, __dirname.includes(`${path.sep}src${path.sep}`) ? '../views' : 'views')
    : path.resolve(process.cwd(), 'build', 'views');
  app.set('views', viewsPath);
  app.set('view engine', 'html');

  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache');
    return next();
  });

  app.all('/{*splat}', echo);
  return app;
};
