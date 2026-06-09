/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDirectory = path.resolve(__dirname, '../..', 'build');

const module = await import(path.resolve(buildDirectory, 'ssr.js'));
const app = module.default.app;

const server = app.listen(2401, 'localhost', () => {
  console.log('Server is running on port localhost:2401');
});

['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.once(signal, () => server?.close(console.error));
});
