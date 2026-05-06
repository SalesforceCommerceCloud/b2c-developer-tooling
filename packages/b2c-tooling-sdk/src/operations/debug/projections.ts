/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Shared projections that map SDAPI response types to JSON-friendly objects
 * with both server paths and resolved local file paths. Used by both the MCP
 * debugger tools and the CLI RPC mode.
 *
 * @module operations/debug/projections
 */

import type {SourceMapper} from './source-mapping.js';
import type {SdapiBreakpoint, SdapiObjectMember, SdapiScriptThread, SdapiStackFrame} from './types.js';

/** Default maximum length for variable values before truncation. */
export const DEFAULT_MAX_VALUE_LENGTH = 200;

/**
 * SDAPI primitive type names. Variables of these types are not expandable
 * (no children to drill into).
 */
const PRIMITIVE_TYPES = new Set(['boolean', 'Boolean', 'null', 'number', 'Number', 'string', 'String', 'undefined']);

/** A mapped source location with both server and local file paths. */
export interface MappedLocation {
  file: null | string;
  function_name: string;
  line: number;
  script_path: string;
}

/** A mapped stack frame. */
export interface MappedFrame {
  file: null | string;
  function_name: string;
  index: number;
  line: number;
  script_path: string;
}

/** A mapped variable for inspection. */
export interface MappedVariable {
  has_children: boolean;
  name: string;
  scope?: string;
  type: string;
  value: string;
}

/** A mapped breakpoint. */
export interface MappedBreakpoint {
  condition?: string;
  file: null | string;
  id: number;
  line: number;
  script_path: string;
}

/** True when the SDAPI type name represents a non-expandable primitive value. */
export function isPrimitiveType(type: string): boolean {
  return PRIMITIVE_TYPES.has(type);
}

/**
 * Truncate a string to at most `max` characters, appending `...` if truncated.
 */
export function truncateValue(value: string, max: number = DEFAULT_MAX_VALUE_LENGTH): string {
  if (value.length <= max) return value;
  return value.slice(0, max) + '...';
}

/**
 * Project an SDAPI stack frame to a structured object with mapped local file path.
 */
export function projectFrame(frame: SdapiStackFrame, mapper: SourceMapper): MappedFrame {
  return {
    file: mapper.toLocalPath(frame.location.script_path) ?? null,
    function_name: frame.location.function_name,
    index: frame.index,
    line: frame.location.line_number,
    script_path: frame.location.script_path,
  };
}

/**
 * Project an SDAPI object member to a structured variable.
 *
 * @param member - The SDAPI object member
 * @param options.includeScope - Whether to include the scope field (defaults to true)
 * @param options.maxValueLength - Maximum value length before truncation
 */
export function projectVariable(
  member: SdapiObjectMember,
  options: {includeScope?: boolean; maxValueLength?: number} = {},
): MappedVariable {
  const {includeScope = true, maxValueLength = DEFAULT_MAX_VALUE_LENGTH} = options;
  const result: MappedVariable = {
    has_children: !isPrimitiveType(member.type),
    name: member.name,
    type: member.type,
    value: truncateValue(member.value, maxValueLength),
  };
  if (includeScope) result.scope = member.scope;
  return result;
}

/**
 * Project an SDAPI breakpoint to a structured object with mapped local file path.
 */
export function projectBreakpoint(bp: SdapiBreakpoint, mapper: SourceMapper): MappedBreakpoint {
  return {
    condition: bp.condition,
    file: mapper.toLocalPath(bp.script_path) ?? null,
    id: bp.id,
    line: bp.line_number,
    script_path: bp.script_path,
  };
}

/**
 * Project the top-of-stack location for a thread, mapping the script path.
 * Returns null if the thread has no call stack.
 */
export function projectThreadLocation(thread: SdapiScriptThread, mapper: SourceMapper): MappedLocation | null {
  const topFrame = thread.call_stack?.[0];
  if (!topFrame) return null;
  const loc = topFrame.location;
  return {
    file: mapper.toLocalPath(loc.script_path) ?? null,
    function_name: loc.function_name,
    line: loc.line_number,
    script_path: loc.script_path,
  };
}
