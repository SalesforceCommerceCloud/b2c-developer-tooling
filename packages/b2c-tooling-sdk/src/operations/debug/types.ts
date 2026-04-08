/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Types for the B2C Commerce Script Debugger API (SDAPI 2.0).
 *
 * @module operations/debug/types
 */
import type {CartridgeMapping} from '../code/cartridges.js';

// ---------------------------------------------------------------------------
// SDAPI response document types
// ---------------------------------------------------------------------------

export interface SdapiLocation {
  function_name: string;
  line_number: number;
  script_path: string;
}

export interface SdapiStackFrame {
  index: number;
  location: SdapiLocation;
}

export interface SdapiScriptThread {
  id: number;
  status: 'running' | 'halted';
  call_stack: SdapiStackFrame[];
}

export interface SdapiScriptThreads {
  _v: string;
  script_threads: SdapiScriptThread[];
}

export interface SdapiBreakpoint {
  id: number;
  line_number: number;
  script_path: string;
  condition?: string;
}

export interface SdapiBreakpoints {
  _v: string;
  breakpoints: SdapiBreakpoint[];
}

export interface SdapiObjectMember {
  name: string;
  parent: string;
  type: string;
  value: string;
  scope?: 'local' | 'closure' | 'global';
}

export interface SdapiObjectMembers {
  _v: string;
  count: number;
  start: number;
  total: number;
  object_members: SdapiObjectMember[];
}

export interface SdapiEvalResult {
  _v: string;
  expression: string;
  result: string;
}

export interface SdapiFault {
  _v: string;
  type: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Breakpoint input (for creating breakpoints — no server-assigned id yet)
// ---------------------------------------------------------------------------

export interface BreakpointInput {
  line_number: number;
  script_path: string;
  condition?: string;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface DebugSessionConfig {
  /** B2C instance hostname */
  hostname: string;
  /** Basic auth username (BM user with WebDAV_Manage_Customization) */
  username: string;
  /** Basic auth password / access key */
  password: string;
  /** Client ID for x-dw-client-id header (defaults to "b2c-cli") */
  clientId?: string;
  /** Cartridge mappings for source path resolution */
  cartridgeRoots: CartridgeMapping[];
  /** Thread polling interval in ms (default: 500) */
  pollInterval?: number;
  /** Keepalive/reset interval in ms (default: 15000) */
  keepaliveInterval?: number;
}

// ---------------------------------------------------------------------------
// Debug session event callbacks
// ---------------------------------------------------------------------------

export interface DebugSessionCallbacks {
  /** Debugger client connected and polling started */
  onConnected?: (hostname: string) => void;
  /** Debugger client disconnected and timers stopped */
  onDisconnected?: () => void;
  /** A thread hit a breakpoint or was otherwise halted */
  onThreadStopped?: (thread: SdapiScriptThread) => void;
  /** A previously halted thread resumed execution */
  onThreadContinued?: (threadId: number) => void;
  /** A thread disappeared from the server (request completed) */
  onThreadExited?: (threadId: number) => void;
  /** The debugger was disabled externally (e.g. BM, another client) */
  onDebuggerDisabled?: () => void;
  /** Non-fatal error during polling or keepalive */
  onError?: (error: Error) => void;
}
