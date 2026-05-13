/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {createRoot} from 'react-dom/client';
import {ReportDashboard} from './ReportDashboard.js';

const container = document.getElementById('root');
if (!container) throw new Error('Report Dashboard root container missing');
createRoot(container).render(<ReportDashboard />);
