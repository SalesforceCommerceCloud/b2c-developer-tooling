/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * JavaScript code generator for converted pipelines.
 *
 * Generates controller code from the analyzed pipeline structure.
 *
 * @module operations/pipeline/generator
 */

import type {AnalyzedFunction, AnalysisResult, PipelineIR} from '../types.js';
import {generateBlock} from './blocks.js';
import {type GeneratorContext, type GeneratorOptions, getRequireVarName, indent} from './helpers.js';

/**
 * Generates JavaScript controller code from the analysis result.
 *
 * @param pipeline - The parsed pipeline IR
 * @param analysis - The control flow analysis result
 * @param options - Generator options
 * @returns Generated JavaScript code
 */
export function generateController(pipeline: PipelineIR, analysis: AnalysisResult, options?: GeneratorOptions): string {
  // Collect all requires from all functions
  // Only include dw/* modules and relative controller paths at the top
  // Script pipelets use inline require() calls
  const allRequires = new Map<string, string>();
  allRequires.set('ISML', 'dw/template/ISML');
  allRequires.set('URLUtils', 'dw/web/URLUtils');

  for (const func of analysis.functions) {
    for (const imp of func.requiredImports) {
      // Skip script file paths (they contain : or end with .ds)
      if (imp.includes(':') || imp.endsWith('.ds')) {
        continue;
      }
      // Only add dw/* modules and relative paths to top-level requires
      if (imp.startsWith('dw/') || imp.startsWith('./')) {
        const varName = getRequireVarName(imp);
        allRequires.set(varName, imp);
      }
    }
  }

  // Generate each function FIRST so that pipelet generators can add requires
  const functionCodes: string[] = [];
  for (const func of analysis.functions) {
    const context: GeneratorContext = {
      pipeline,
      indent: 1,
      declaredVars: new Set(),
      requires: allRequires,
      pipelineName: pipeline.name,
      options,
    };

    const funcCode = generateFunction(func, context);
    functionCodes.push(funcCode);
  }

  // Now build the output with requires (which may have been added during generation)
  const lines: string[] = [];

  // Strict mode
  lines.push("'use strict';");
  lines.push('');

  // Write require statements (now includes any added during function generation)
  for (const [varName, modulePath] of allRequires) {
    lines.push(`var ${varName} = require('${modulePath}');`);
  }
  lines.push('');

  // Add the generated functions
  for (const funcCode of functionCodes) {
    lines.push(funcCode);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generates code for a single function.
 */
function generateFunction(func: AnalyzedFunction, context: GeneratorContext): string {
  const lines: string[] = [];

  // Function declaration
  lines.push(`function ${func.name}() {`);

  // Initialize pdict
  lines.push(`${indent(1)}var pdict = {};`);
  context.declaredVars.add('pdict');

  // For form handlers, declare the action variable
  if (func.isFormHandler) {
    lines.push(`${indent(1)}var action = request.triggeredFormAction;`);
    context.declaredVars.add('action');
  }

  // Generate function body
  const bodyCode = generateBlock(func.body, context);
  if (bodyCode.trim()) {
    lines.push(bodyCode);
  } else {
    lines.push(`${indent(1)}// TODO: Empty pipeline - no nodes to convert`);
  }

  lines.push('}');

  // Export
  lines.push(`exports.${func.name} = ${func.name};`);

  // Public flag for non-private start nodes
  if (func.isPublic) {
    lines.push(`exports.${func.name}.public = true;`);
  }

  return lines.join('\n');
}
