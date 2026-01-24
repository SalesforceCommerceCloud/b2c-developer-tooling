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
 * Generates code for a Script pipelet.
 */
export function generateScriptPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const scriptFile = node.configProperties.find((p) => p.key === 'ScriptFile')?.value;

  if (!scriptFile) {
    return `${ind}// TODO: Script pipelet missing ScriptFile`;
  }

  // Convert script path: cartridge:path/to/script.ds -> cartridge/cartridge/scripts/path/to/script
  const scriptPath = convertScriptPath(scriptFile);

  // Build parameter object from key bindings
  const params: string[] = [];
  for (const kb of node.keyBindings) {
    if (kb.key !== 'ScriptLog' && kb.value !== 'null') {
      const transformedValue = transformExpression(kb.value);
      params.push(`${ind}    ${kb.key}: ${transformedValue}`);
    }
  }

  if (params.length > 0) {
    return `${ind}require('${scriptPath}').execute({\n${params.join(',\n')}\n${ind}});`;
  } else {
    return `${ind}require('${scriptPath}').execute();`;
  }
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
