/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createRoot} from 'react-dom/client';
import {JobHistory} from './JobHistory.js';

const container = document.getElementById('root');
if (!container) throw new Error('Job History root container missing');
createRoot(container).render(<JobHistory />);
