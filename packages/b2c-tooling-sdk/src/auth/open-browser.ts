/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {getLogger} from '../logging/logger.js';

/**
 * Opens a URL in the system default browser, the default behavior of browser
 * OAuth flows. Failures are logged at debug level and otherwise ignored, since
 * the flows also log the URL for the user to open by hand.
 *
 * @param url - URL to open
 */
export async function openUrlInBrowser(url: string): Promise<void> {
  try {
    const open = await import('open');
    await open.default(url);
  } catch {
    getLogger().debug('Could not automatically open browser');
  }
}
