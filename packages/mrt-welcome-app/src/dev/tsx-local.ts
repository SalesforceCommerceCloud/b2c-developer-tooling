/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createApp} from '../app/server.js';

const app = createApp();

const server = app.listen(2401, 'localhost', () => {
  console.log('Server is running on port localhost:2401');
});

['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.once(signal, () => server?.close(console.error));
});
