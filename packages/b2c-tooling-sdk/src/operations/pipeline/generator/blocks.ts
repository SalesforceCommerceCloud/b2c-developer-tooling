/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Control flow block generators for pipeline-to-controller conversion.
 *
 * @module operations/pipeline/generator/blocks
 */

import type {ControlFlowBlock, IfElseBlock, LoopBlock, SequenceBlock, StatementBlock, TryCatchBlock} from '../types.js';
import {type GeneratorContext, indent, transformExpression, transformVariable} from './helpers.js';
import {generateNode} from './nodes.js';

/**
 * Generates code for a control flow block.
 */
export function generateBlock(block: ControlFlowBlock, context: GeneratorContext): string {
  switch (block.type) {
    case 'sequence':
      return generateSequence(block, context);
    case 'if-else':
      return generateIfElse(block, context);
    case 'loop':
      return generateLoop(block, context);
    case 'try-catch':
      return generateTryCatch(block, context);
    case 'statement':
      return generateStatement(block, context);
    default:
      return '';
  }
}

/**
 * Generates code for a sequence of blocks.
 */
function generateSequence(block: SequenceBlock, context: GeneratorContext): string {
  return block.blocks.map((b) => generateBlock(b, context)).join('\n');
}

/**
 * Generates code for an if-else block.
 */
function generateIfElse(block: IfElseBlock, context: GeneratorContext): string {
  const lines: string[] = [];
  const ind = indent(context.indent);

  const condition = transformExpression(block.condition);
  lines.push(`${ind}if (${condition}) {`);

  context.indent++;
  const thenCode = generateBlock(block.thenBlock, context);
  context.indent--;
  if (thenCode.trim()) {
    lines.push(thenCode);
  }

  if (block.elseBlock) {
    lines.push(`${ind}} else {`);
    context.indent++;
    const elseCode = generateBlock(block.elseBlock, context);
    context.indent--;
    if (elseCode.trim()) {
      lines.push(elseCode);
    }
  }

  lines.push(`${ind}}`);

  return lines.join('\n');
}

/**
 * Generates code for a loop block.
 */
function generateLoop(block: LoopBlock, context: GeneratorContext): string {
  const lines: string[] = [];
  const ind = indent(context.indent);

  const iteratorVar = transformVariable(block.iteratorVar);
  const elementVar = block.elementVar;

  // Use for..of for iterators
  lines.push(`${ind}for (var ${elementVar} of ${iteratorVar}) {`);

  context.indent++;
  const bodyCode = generateBlock(block.body, context);
  context.indent--;
  if (bodyCode.trim()) {
    lines.push(bodyCode);
  }

  lines.push(`${ind}}`);

  return lines.join('\n');
}

/**
 * Generates code for a try-catch block.
 */
function generateTryCatch(block: TryCatchBlock, context: GeneratorContext): string {
  const lines: string[] = [];
  const ind = indent(context.indent);

  lines.push(`${ind}try {`);

  context.indent++;
  const tryCode = generateBlock(block.tryBlock, context);
  context.indent--;
  if (tryCode.trim()) {
    lines.push(tryCode);
  }

  lines.push(`${ind}} catch (e) {`);

  context.indent++;
  const catchCode = generateBlock(block.catchBlock, context);
  context.indent--;
  if (catchCode.trim()) {
    lines.push(catchCode);
  }

  lines.push(`${ind}}`);

  return lines.join('\n');
}

/**
 * Generates code for a statement (single node).
 */
function generateStatement(block: StatementBlock, context: GeneratorContext): string {
  const node = context.pipeline.nodes.get(block.nodeId);
  if (!node) return '';

  return generateNode(node, context);
}
