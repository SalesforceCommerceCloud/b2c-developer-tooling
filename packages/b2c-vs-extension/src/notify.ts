/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';

const DEFAULT_THROTTLE_MS = 30_000;

// Last-shown timestamp per throttle key. Module-scoped so it survives across
// tree refreshes and the periodic sandbox poll (each provider is re-created on
// config reset, but the spam we collapse happens within a single session).
const lastShown = new Map<string, number>();

/**
 * Show an error toast at most once per `windowMs` for a given key.
 *
 * Tree-data providers call `getChildren()` on every expand, manual Refresh, and
 * (for sandboxes) every background poll tick. When the configured instance is
 * unreachable, each of those would otherwise stack an identical error toast —
 * the sandbox poll alone fires roughly every 10s. Throttling collapses those
 * bursts into a single notification while still surfacing the failure.
 *
 * Reserve this for automatic, render/poll-triggered failures. User-initiated
 * command failures should toast unconditionally so the click always gets
 * feedback.
 *
 * @param message - the toast text
 * @param key - throttle bucket; defaults to the message itself. Pass a coarse
 *   key (e.g. a realm or library id) to collapse many distinct-but-related
 *   failures into one toast.
 * @param windowMs - minimum gap between toasts for the same key
 */
export function showThrottledError(
  message: string,
  key: string = message,
  windowMs: number = DEFAULT_THROTTLE_MS,
): void {
  const now = Date.now();
  const last = lastShown.get(key);
  if (last !== undefined && now - last < windowMs) {
    return;
  }
  lastShown.set(key, now);
  void vscode.window.showErrorMessage(message);
}
