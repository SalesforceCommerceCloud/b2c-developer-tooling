/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Pipeline control flow analyzer.
 *
 * Analyzes the parsed pipeline IR to build structured control flow blocks
 * that can be easily converted to JavaScript code.
 *
 * @module operations/pipeline/analyzer
 */

import type {
  AnalysisResult,
  AnalyzedFunction,
  ControlFlowBlock,
  DecisionNodeIR,
  IfElseBlock,
  InteractionContinueNodeIR,
  LoopBlock,
  LoopNodeIR,
  NodeIR,
  PipelineIR,
  PipeletNodeIR,
  SequenceBlock,
  StartNodeIR,
  StatementBlock,
  TryCatchBlock,
} from './types.js';

/**
 * Context for control flow analysis.
 */
interface AnalysisContext {
  /** The pipeline IR being analyzed. */
  pipeline: PipelineIR;
  /** Set of visited node IDs (to detect cycles). */
  visited: Set<string>;
  /** Set of required imports. */
  requiredImports: Set<string>;
  /** Warnings accumulated during analysis. */
  warnings: string[];
}

/**
 * Analyzes a pipeline IR and produces structured functions ready for code generation.
 *
 * @param pipeline - The parsed pipeline IR
 * @returns Analysis result with functions and warnings
 */
export function analyzePipeline(pipeline: PipelineIR): AnalysisResult {
  const functions: AnalyzedFunction[] = [];
  const warnings: string[] = [];

  for (const startNodeId of pipeline.startNodes) {
    const startNode = pipeline.nodes.get(startNodeId) as StartNodeIR;
    if (!startNode) continue;

    const context: AnalysisContext = {
      pipeline,
      visited: new Set(),
      requiredImports: new Set(),
      warnings: [],
    };

    const body = analyzeFromNode(startNodeId, context);

    functions.push({
      name: startNode.name,
      isPublic: !startNode.isPrivate,
      secure: startNode.secure,
      isFormHandler: false,
      body,
      requiredImports: context.requiredImports,
    });

    warnings.push(...context.warnings);
  }

  // Handle interaction-continue nodes that generate additional handler functions
  for (const node of pipeline.nodes.values()) {
    if (node.type === 'interaction-continue') {
      const icNode = node as InteractionContinueNodeIR;
      const context: AnalysisContext = {
        pipeline,
        visited: new Set(),
        requiredImports: new Set(),
        warnings: [],
      };

      // Build handler function body from branch connectors
      const handlerBody = buildInteractionContinueHandler(icNode, context);

      functions.push({
        name: icNode.handlerStartName,
        isPublic: true,
        secure: icNode.secure,
        isFormHandler: true,
        body: handlerBody,
        requiredImports: context.requiredImports,
      });

      warnings.push(...context.warnings);
    }
  }

  return {functions, warnings};
}

/**
 * Analyzes control flow starting from a given node.
 */
function analyzeFromNode(nodeId: string, context: AnalysisContext): ControlFlowBlock {
  const blocks: ControlFlowBlock[] = [];

  let currentId: string | undefined = nodeId;

  while (currentId) {
    // Cycle detection
    if (context.visited.has(currentId)) {
      context.warnings.push(`Cycle detected at node ${currentId}`);
      break;
    }
    context.visited.add(currentId);

    const node = context.pipeline.nodes.get(currentId);
    if (!node) {
      context.warnings.push(`Node ${currentId} not found`);
      break;
    }

    // Process based on node type
    switch (node.type) {
      case 'start':
        // Start nodes just continue to their first transition
        currentId = getDefaultTransition(node);
        continue;

      case 'end':
        // End nodes are terminal statements
        blocks.push(createStatement(node.id));
        currentId = undefined;
        break;

      case 'decision': {
        const decisionBlock = analyzeDecisionNode(node, context);
        blocks.push(decisionBlock);
        // After if-else, we need to find the convergence point (join node)
        currentId = findConvergencePoint(node, context);
        break;
      }

      case 'loop': {
        const loopBlock = analyzeLoopNode(node, context);
        blocks.push(loopBlock);
        // Continue after the loop (done branch)
        currentId = node.transitions.find((t) => t.connector === 'done')?.targetId;
        break;
      }

      case 'pipelet': {
        if (node.hasErrorBranch) {
          const tryCatchBlock = analyzePipeletWithError(node, context);
          blocks.push(tryCatchBlock);
          // Continue after try-catch
          currentId = findConvergencePoint(node, context);
        } else {
          blocks.push(createStatement(node.id));
          collectPipeletImports(node, context);
          currentId = getDefaultTransition(node);
        }
        break;
      }

      case 'call':
      case 'jump':
      case 'interaction':
        blocks.push(createStatement(node.id));
        currentId = getDefaultTransition(node);
        break;

      case 'interaction-continue':
        // Interaction-continue renders and ends - handler is separate function
        blocks.push(createStatement(node.id));
        currentId = undefined;
        break;

      case 'join':
        // Join nodes are convergence points, continue past them
        currentId = getDefaultTransition(node);
        break;
    }
  }

  return simplifySequence({type: 'sequence', blocks});
}

/**
 * Analyzes a decision node into an if-else block.
 */
function analyzeDecisionNode(node: DecisionNodeIR, context: AnalysisContext): IfElseBlock {
  // Remove from visited so branches can be analyzed
  context.visited.delete(node.id);

  const yesTransition = node.transitions.find((t) => t.connector === 'yes');
  const noTransition = node.transitions.find((t) => t.connector === 'no');

  let thenBlock: ControlFlowBlock = {type: 'sequence', blocks: []};
  let elseBlock: ControlFlowBlock | undefined;

  if (yesTransition) {
    const branchContext = createBranchContext(context);
    thenBlock = analyzeFromNode(yesTransition.targetId, branchContext);
    context.warnings.push(...branchContext.warnings);
    mergeImports(context, branchContext);
  }

  if (noTransition) {
    const branchContext = createBranchContext(context);
    elseBlock = analyzeFromNode(noTransition.targetId, branchContext);
    context.warnings.push(...branchContext.warnings);
    mergeImports(context, branchContext);
  }

  return {
    type: 'if-else',
    condition: node.condition,
    thenBlock,
    elseBlock,
  };
}

/**
 * Analyzes a loop node into a loop block.
 */
function analyzeLoopNode(node: LoopNodeIR, context: AnalysisContext): LoopBlock {
  const doTransition = node.transitions.find((t) => t.connector === 'do');

  let body: ControlFlowBlock = {type: 'sequence', blocks: []};

  if (doTransition) {
    const branchContext = createBranchContext(context);
    // Mark the loop node as the loop-back target
    body = analyzeLoopBody(doTransition.targetId, node.id, branchContext);
    context.warnings.push(...branchContext.warnings);
    mergeImports(context, branchContext);
  }

  return {
    type: 'loop',
    elementVar: node.elementKey,
    iteratorVar: node.iteratorKey,
    body,
  };
}

/**
 * Analyzes a loop body, stopping when we loop back.
 */
function analyzeLoopBody(startId: string, loopNodeId: string, context: AnalysisContext): ControlFlowBlock {
  const blocks: ControlFlowBlock[] = [];
  let currentId: string | undefined = startId;

  while (currentId) {
    if (context.visited.has(currentId)) {
      break;
    }
    context.visited.add(currentId);

    const node = context.pipeline.nodes.get(currentId);
    if (!node) break;

    // Check if any transition leads back to loop node
    const loopsBack = node.transitions.some((t) => t.targetId === loopNodeId);

    blocks.push(createStatement(node.id));
    collectNodeImports(node, context);

    if (loopsBack) {
      break;
    }

    currentId = getDefaultTransition(node);
  }

  return simplifySequence({type: 'sequence', blocks});
}

/**
 * Analyzes a pipelet with error handling into a try-catch block.
 */
function analyzePipeletWithError(node: PipeletNodeIR, context: AnalysisContext): TryCatchBlock {
  const errorTransition = node.transitions.find((t) => t.connector === 'error');
  const successTransition = node.transitions.find((t) => !t.connector || t.connector === 'next');

  // Try block: the pipelet + success path
  const tryBlocks: ControlFlowBlock[] = [createStatement(node.id)];
  if (successTransition) {
    const successContext = createBranchContext(context);
    const successBlock = analyzeFromNode(successTransition.targetId, successContext);
    tryBlocks.push(successBlock);
    context.warnings.push(...successContext.warnings);
    mergeImports(context, successContext);
  }

  // Catch block: error path
  let catchBlock: ControlFlowBlock = {type: 'sequence', blocks: []};
  if (errorTransition) {
    const errorContext = createBranchContext(context);
    catchBlock = analyzeFromNode(errorTransition.targetId, errorContext);
    context.warnings.push(...errorContext.warnings);
    mergeImports(context, errorContext);
  }

  collectPipeletImports(node, context);

  return {
    type: 'try-catch',
    tryBlock: simplifySequence({type: 'sequence', blocks: tryBlocks}),
    catchBlock,
  };
}

/**
 * Builds the handler function body for an interaction-continue node.
 */
function buildInteractionContinueHandler(node: InteractionContinueNodeIR, context: AnalysisContext): ControlFlowBlock {
  // The handler function dispatches based on triggered form action
  // Each branch connector becomes an if block

  const blocks: ControlFlowBlock[] = [];

  for (const connector of node.branchConnectors) {
    const transition = node.transitions.find((t) => t.connector === connector);
    if (transition) {
      const branchContext = createBranchContext(context);
      const branchBody = analyzeFromNode(transition.targetId, branchContext);

      blocks.push({
        type: 'if-else',
        condition: `action.formId === '${connector}'`,
        thenBlock: branchBody,
      });

      context.warnings.push(...branchContext.warnings);
      mergeImports(context, branchContext);
    }
  }

  return simplifySequence({type: 'sequence', blocks});
}

/**
 * Creates a branch context for analyzing nested control flow.
 */
function createBranchContext(parent: AnalysisContext): AnalysisContext {
  return {
    pipeline: parent.pipeline,
    visited: new Set(parent.visited),
    requiredImports: new Set(),
    warnings: [],
  };
}

/**
 * Merges imports from a branch context into the parent.
 */
function mergeImports(parent: AnalysisContext, branch: AnalysisContext): void {
  for (const imp of branch.requiredImports) {
    parent.requiredImports.add(imp);
  }
}

/**
 * Collects imports required by a pipelet node.
 */
function collectPipeletImports(node: PipeletNodeIR, context: AnalysisContext): void {
  // Script pipelets require the script file
  if (node.pipeletName === 'Script') {
    const scriptFile = node.configProperties.find((p) => p.key === 'ScriptFile')?.value;
    if (scriptFile) {
      context.requiredImports.add(scriptFile);
    }
  }
}

/**
 * Collects imports required by any node type.
 */
function collectNodeImports(node: NodeIR, context: AnalysisContext): void {
  if (node.type === 'pipelet') {
    collectPipeletImports(node, context);
  } else if (node.type === 'call') {
    // Call nodes may require other controllers
    if (node.pipelineName !== context.pipeline.name) {
      context.requiredImports.add(`./${node.pipelineName}`);
    }
  } else if (node.type === 'interaction' || node.type === 'interaction-continue') {
    context.requiredImports.add('dw/template/ISML');
  } else if (node.type === 'jump') {
    context.requiredImports.add('dw/web/URLUtils');
  }
}

/**
 * Gets the default (non-branching) transition from a node.
 */
function getDefaultTransition(node: NodeIR): string | undefined {
  // Find transition without a connector or with 'next' connector
  return node.transitions.find((t) => !t.connector || t.connector === 'next' || t.connector === 'in')?.targetId;
}

/**
 * Finds the convergence point after branching control flow.
 */
function findConvergencePoint(node: NodeIR, context: AnalysisContext): string | undefined {
  // Look for a join node that all branches converge to
  // This is a simplified approach - full dominator analysis would be more robust

  const visited = new Set<string>();
  const queue: string[] = [];

  // Start from all transitions
  for (const t of node.transitions) {
    queue.push(t.targetId);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const currentNode = context.pipeline.nodes.get(current);
    if (!currentNode) continue;

    // Join nodes are convergence points
    if (currentNode.type === 'join') {
      return currentNode.id;
    }

    // End nodes terminate - no convergence needed
    if (currentNode.type === 'end') {
      continue;
    }

    // Add transitions to queue
    for (const t of currentNode.transitions) {
      queue.push(t.targetId);
    }
  }

  return undefined;
}

/**
 * Creates a statement block for a node.
 */
function createStatement(nodeId: string): StatementBlock {
  return {type: 'statement', nodeId};
}

/**
 * Simplifies a sequence block, unwrapping single-element sequences.
 */
function simplifySequence(seq: SequenceBlock): ControlFlowBlock {
  if (seq.blocks.length === 0) {
    return seq;
  }
  if (seq.blocks.length === 1) {
    return seq.blocks[0];
  }
  return seq;
}
