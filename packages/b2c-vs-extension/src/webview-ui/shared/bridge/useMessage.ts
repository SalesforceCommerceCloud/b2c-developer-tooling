/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// React hook that subscribes to inbound messages from the extension host.
// Mirrors the global `window.addEventListener('message', …)` pattern used by
// the original webviews, but lifts cleanup and freshness handling into one place.
import {useEffect} from 'react';
import type {InboundMessage} from './vscode.js';

export function useInboundMessages(handler: (message: InboundMessage) => void): void {
  useEffect(() => {
    function onMessage(event: MessageEvent<InboundMessage>) {
      handler(event.data);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [handler]);
}
