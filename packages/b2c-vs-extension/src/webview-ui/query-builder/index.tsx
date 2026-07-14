/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Browser entry for the Query Builder webview. Mounts the React app into the
// shell HTML supplied by cip-webview-manager.ts.
import {createRoot} from 'react-dom/client';
import {QueryBuilder} from './QueryBuilder.js';

const container = document.getElementById('root');
if (!container) throw new Error('Query Builder root container missing');
createRoot(container).render(<QueryBuilder />);
