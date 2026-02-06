/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Common pipelet generators: Assign, Script, Eval.
 *
 * @module operations/pipeline/generator/pipelets/common
 */

import type {PipeletNodeIR} from '../../types.js';
import {type GeneratorContext, convertScriptPath, indent, transformExpression, transformVariable} from '../helpers.js';

/**
 * Generates code for an Assign pipelet.
 */
export function generateAssignPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  // Assign pipelets have From_N/To_N pairs
  for (let i = 0; i <= 9; i++) {
    const from = node.keyBindings.find((kb) => kb.key === `From_${i}`)?.value;
    const to = node.keyBindings.find((kb) => kb.key === `To_${i}`)?.value;

    if (from && to && from !== 'null' && to !== 'null') {
      const transformedFrom = transformExpression(from);
      const transformedTo = transformVariable(to);

      // Check if this is a pdict assignment or a session/request assignment
      if (transformedTo.startsWith('pdict.')) {
        const varName = transformedTo.substring(6);
        if (!context.declaredVars.has(varName)) {
          lines.push(`${ind}${transformedTo} = ${transformedFrom};`);
        } else {
          lines.push(`${ind}${transformedTo} = ${transformedFrom};`);
        }
      } else {
        lines.push(`${ind}${transformedTo} = ${transformedFrom};`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Checks if a pipeline variable name refers to a session/request object
 * that should not be written back as output.
 */
function isSessionOrRequestObject(varName: string): boolean {
  const sessionPrefixes = [
    'CurrentForms',
    'CurrentSession',
    'CurrentRequest',
    'CurrentHttpParameterMap',
    'CurrentCustomer',
  ];
  return sessionPrefixes.some((prefix) => varName.startsWith(prefix));
}

/**
 * Generates code for a Script pipelet.
 * Script pipelets work by passing an args object to execute(), which mutates
 * the args object to set output values. We need to read back those outputs
 * after execution.
 */
export function generateScriptPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];
  const scriptFile = node.configProperties.find((p) => p.key === 'ScriptFile')?.value;

  if (!scriptFile) {
    return `${ind}// TODO: Script pipelet missing ScriptFile`;
  }

  // Convert script path: cartridge:path/to/script.ds -> cartridge/cartridge/scripts/path/to/script
  const scriptPath = convertScriptPath(scriptFile);

  // Build parameter object from key bindings and track output mappings
  // Key bindings map: alias (pdict key) -> key (script arg name)
  // Input: pdict.alias value is passed as args.key
  // Output: after execution, args.key is read back to pdict.alias (but NOT for session objects)
  const params: string[] = [];
  const outputMappings: Array<{pdictKey: string; argsKey: string}> = [];

  for (const kb of node.keyBindings) {
    if (kb.key === 'ScriptLog') continue;

    if (kb.value !== 'null') {
      const transformedValue = transformExpression(kb.value);
      params.push(`${ind}    ${kb.key}: ${transformedValue}`);

      // Only track output mappings for pdict variables, not session/request objects
      // Session objects like CurrentForms, CurrentSession, etc. are input-only
      if (!isSessionOrRequestObject(kb.value)) {
        outputMappings.push({pdictKey: kb.value, argsKey: kb.key});
      }
    }
  }

  // Create args object and call script
  if (params.length > 0) {
    lines.push(`${ind}var scriptArgs = {`);
    lines.push(params.join(',\n'));
    lines.push(`${ind}};`);
    lines.push(`${ind}var scriptResult = require('${scriptPath}').execute(scriptArgs);`);
  } else {
    lines.push(`${ind}var scriptResult = require('${scriptPath}').execute();`);
  }

  // Read back outputs from the args object to pdict
  // Scripts mutate the args object to set output values
  for (const mapping of outputMappings) {
    const transformedPdictKey = transformVariable(mapping.pdictKey);
    lines.push(`${ind}${transformedPdictKey} = scriptArgs.${mapping.argsKey};`);
  }

  return lines.join('\n');
}

/**
 * Generates code for Eval pipelet.
 * Eval is replaced by plain JavaScript expression.
 */
export function generateEvalPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  // Eval pipelet has Expression_N properties
  for (let i = 0; i <= 9; i++) {
    const expr = node.configProperties.find((p) => p.key === `Expression_${i}`)?.value;
    if (expr && expr !== 'null') {
      lines.push(`${ind}${transformExpression(expr)};`);
    }
  }

  if (lines.length === 0) {
    return `${ind}// Eval: no expressions found`;
  }

  return lines.join('\n');
}
