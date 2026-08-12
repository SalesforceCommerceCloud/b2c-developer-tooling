/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Routes clipboard writes through the extension host. The webview's
// navigator.clipboard.writeText() works only while the panel holds a transient
// user-activation, so repeat copies fail silently after the first paste-and-blur.
// The extension-host path uses vscode.env.clipboard, which doesn't depend on
// webview focus and stays reliable across consecutive clicks.
import {useCallback, useState} from 'react';
import {postMessage} from '../bridge/vscode.js';

export function useClipboardCopy(resetMs = 1400): {copied: boolean; copy: (text: string) => void} {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    (text: string) => {
      if (!text) return;
      postMessage({command: 'copyToClipboard', params: {text}});
      setCopied(true);
      window.setTimeout(() => setCopied(false), resetMs);
    },
    [resetMs],
  );

  return {copied, copy};
}
