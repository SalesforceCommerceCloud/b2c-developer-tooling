/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Pipeline-to-Controller converter for B2C Commerce.
 *
 * This module provides functionality to convert legacy B2C Commerce pipeline XML files
 * into modern JavaScript controller code.
 *
 * ## Overview
 *
 * Pipelines are the legacy way of implementing storefront logic in B2C Commerce.
 * Controllers are the modern approach using JavaScript. This converter helps migrate
 * pipeline-based code to controllers.
 *
 * ## Usage
 *
 * ```typescript
 * import { convertPipeline, parsePipeline, analyzePipeline, generateController } from '@salesforce/b2c-tooling-sdk/operations/pipeline';
 * import { readFileSync, writeFileSync } from 'fs';
 *
 * // High-level API
 * const result = await convertPipeline('./Account.xml');
 * console.log(result.code);
 *
 * // Low-level API for more control
 * const xml = readFileSync('./Account.xml', 'utf-8');
 * const pipeline = await parsePipeline(xml, 'Account');
 * const analysis = analyzePipeline(pipeline);
 * const code = generateController(pipeline, analysis);
 * writeFileSync('./Account.js', code);
 * ```
 *
 * ## Supported Node Types
 *
 * - **start-node**: Entry points → exported functions
 * - **end-node**: Exit points → return statements
 * - **decision-node**: Conditionals → if/else blocks
 * - **pipelet-node**: Business logic → function calls
 * - **call-node**: Sub-pipeline calls → require + call
 * - **jump-node**: Redirects → response.redirect
 * - **loop-node**: Iteration → for loops
 * - **interaction-node**: Template rendering → ISML.renderTemplate
 * - **interaction-continue-node**: Form handling → render + handler functions
 *
 * @module operations/pipeline
 */

import {readFile, writeFile} from 'fs/promises';
import {basename} from 'path';
import {analyzePipeline} from './analyzer.js';
import {generateController} from './generator/index.js';
import {parsePipeline} from './parser.js';
import {getUnconvertablePipelet} from './pipelets/index.js';
import type {ConvertOptions, ConvertResult, PipelineIR, PipeletNodeIR} from './types.js';

/**
 * Error thrown when a pipeline contains unconvertable pipelets.
 */
export class UnconvertablePipelineError extends Error {
  constructor(
    public readonly pipelineName: string,
    public readonly unconvertablePipelets: Array<{name: string; reason: string}>,
  ) {
    const pipeletList = unconvertablePipelets.map((p) => `  - ${p.name}: ${p.reason}`).join('\n');
    super(`Pipeline "${pipelineName}" contains unconvertable pipelets:\n${pipeletList}`);
    this.name = 'UnconvertablePipelineError';
  }
}

/**
 * Validates a pipeline for unconvertable pipelets.
 * @throws UnconvertablePipelineError if any unconvertable pipelets are found
 */
function validatePipeline(pipeline: PipelineIR): void {
  const unconvertable: Array<{name: string; reason: string}> = [];

  for (const node of pipeline.nodes.values()) {
    if (node.type === 'pipelet') {
      const pipeletNode = node as PipeletNodeIR;
      const info = getUnconvertablePipelet(pipeletNode.pipeletName);
      if (info) {
        // Only add if not already in the list
        if (!unconvertable.some((p) => p.name === pipeletNode.pipeletName)) {
          unconvertable.push({
            name: pipeletNode.pipeletName,
            reason: info.unconvertableReason ?? 'No script API equivalent',
          });
        }
      }
    }
  }

  if (unconvertable.length > 0) {
    throw new UnconvertablePipelineError(pipeline.name, unconvertable);
  }
}

// Re-export all types
export type {
  AnalysisResult,
  AnalyzedFunction,
  CallNodeIR,
  ConfigProperty,
  ControlFlowBlock,
  ConvertOptions,
  ConvertResult,
  DecisionNodeIR,
  EndNodeIR,
  IfElseBlock,
  InteractionContinueNodeIR,
  InteractionNodeIR,
  JoinNodeIR,
  JumpNodeIR,
  KeyBinding,
  LoopBlock,
  LoopNodeIR,
  NodeIR,
  PipelineIR,
  PipeletNodeIR,
  SequenceBlock,
  StartNodeIR,
  StatementBlock,
  TransitionIR,
  TryCatchBlock,
} from './types.js';

// Re-export core functions
export {parsePipeline} from './parser.js';
export {analyzePipeline} from './analyzer.js';
export {generateController} from './generator/index.js';

// Re-export pipelet utilities
export {
  getPipeletMapping,
  getUnconvertablePipelet,
  isPipeletMapped,
  isUnconvertablePipelet,
  PIPELET_MAPPINGS,
  UNCONVERTABLE_PIPELETS,
} from './pipelets/index.js';
export type {PipeletMapping} from './pipelets/index.js';

/**
 * Converts a pipeline XML file to JavaScript controller code.
 *
 * This is the high-level API that combines parsing, analysis, and code generation.
 *
 * @param inputPath - Path to the pipeline XML file
 * @param options - Conversion options
 * @returns Conversion result with generated code and any warnings
 *
 * @example
 * ```typescript
 * const result = await convertPipeline('./Account.xml');
 * if (result.warnings.length > 0) {
 *   console.warn('Warnings:', result.warnings);
 * }
 * console.log(result.code);
 * ```
 */
export async function convertPipeline(inputPath: string, options: ConvertOptions = {}): Promise<ConvertResult> {
  // Read the XML file
  const xml = await readFile(inputPath, 'utf-8');

  // Extract pipeline name from filename
  const pipelineName = basename(inputPath, '.xml');

  // Parse
  const pipeline = await parsePipeline(xml, pipelineName);

  // Validate for unconvertable pipelets
  validatePipeline(pipeline);

  // Analyze
  const analysis = analyzePipeline(pipeline);

  // Generate
  const code = generateController(pipeline, analysis);

  // Write output if not dry-run
  let outputPath: string | undefined;
  if (!options.dryRun && options.outputPath) {
    outputPath = options.outputPath;
    await writeFile(outputPath, code, 'utf-8');
  }

  return {
    pipelineName,
    code,
    outputPath,
    warnings: analysis.warnings,
  };
}

/**
 * Converts pipeline XML content to JavaScript controller code.
 *
 * Use this when you already have the XML content in memory.
 *
 * @param xml - The pipeline XML content
 * @param pipelineName - Name for the pipeline (used in generated code)
 * @returns Conversion result with generated code and any warnings
 *
 * @example
 * ```typescript
 * const xml = await readFile('./Account.xml', 'utf-8');
 * const result = await convertPipelineContent(xml, 'Account');
 * console.log(result.code);
 * ```
 */
export async function convertPipelineContent(xml: string, pipelineName: string): Promise<ConvertResult> {
  const pipeline = await parsePipeline(xml, pipelineName);
  validatePipeline(pipeline);
  const analysis = analyzePipeline(pipeline);
  const code = generateController(pipeline, analysis);

  return {
    pipelineName,
    code,
    warnings: analysis.warnings,
  };
}
