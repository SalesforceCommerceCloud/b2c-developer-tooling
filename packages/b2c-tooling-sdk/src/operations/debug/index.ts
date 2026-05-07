/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * B2C Commerce Script Debugger operations.
 *
 * Provides the SDAPI client, debug session manager, DAP adapter, and supporting
 * utilities for source mapping and variable reference management.
 *
 * @module operations/debug
 */
export {SdapiClient, SdapiError, createSdapiClient} from './sdapi-client.js';
export type {SdapiClientConfig} from './sdapi-client.js';
export {DebugSessionManager} from './debug-session.js';
export {B2CScriptDebugAdapter} from './dap-adapter.js';
export {createSourceMapper} from './source-mapping.js';
export type {SourceMapper} from './source-mapping.js';
export {VariableStore} from './variable-store.js';
export type {VariableRef} from './variable-store.js';
export type {
  SdapiLocation,
  SdapiStackFrame,
  SdapiScriptThread,
  SdapiBreakpoint,
  SdapiBreakpoints,
  SdapiObjectMember,
  SdapiObjectMembers,
  SdapiEvalResult,
  SdapiFault,
  BreakpointInput,
  DebugSessionConfig,
  DebugSessionCallbacks,
} from './types.js';
