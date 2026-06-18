/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Typed bridge between the Job History webview and the extension host.
//
// The CIP shared bridge (webview-ui/shared/bridge/vscode.ts) owns a CIP-specific
// message contract, so Job History keeps its own contract here while still
// reusing the shared visual component library. This is the natural seam: UI
// primitives are shared, message contracts are per-app.
import {useEffect} from 'react';

/** One execution row, pre-formatted by the host for display. */
export interface JobHistoryRow {
  jobId: string;
  executionId: string;
  status: 'running' | 'failed' | 'completed' | 'scheduled';
  start: string;
  startMs: number | null;
  duration: string;
  durationMs: number | null;
  message: string;
  isSystem: boolean;
}

export type OutboundMessage =
  | {command: 'openLog'; jobId: string; executionId: string}
  | {command: 'rerun'; jobId: string}
  | {command: 'viewDetails'; jobId: string; executionId: string}
  | {command: 'openInBusinessManager'}
  | {command: 'refresh'};

export type InboundMessage = {command: 'data'; rows: JobHistoryRow[]};

interface VsCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare global {
  interface Window {
    acquireVsCodeApi?: () => VsCodeApi;
    __JOB_HISTORY__?: JobHistoryRow[];
  }
}

let cached: VsCodeApi | null = null;

function getVsCode(): VsCodeApi {
  if (cached) return cached;
  if (typeof window === 'undefined' || !window.acquireVsCodeApi) {
    cached = {postMessage: () => {}, getState: () => undefined, setState: () => {}};
    return cached;
  }
  cached = window.acquireVsCodeApi();
  return cached;
}

export function postMessage(message: OutboundMessage): void {
  getVsCode().postMessage(message);
}

export function getInitialRows(): JobHistoryRow[] {
  if (typeof window !== 'undefined' && Array.isArray(window.__JOB_HISTORY__)) {
    return window.__JOB_HISTORY__;
  }
  return [];
}

export function useInboundMessages(handler: (message: InboundMessage) => void): void {
  useEffect(() => {
    function onMessage(event: MessageEvent<InboundMessage>) {
      handler(event.data);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [handler]);
}
