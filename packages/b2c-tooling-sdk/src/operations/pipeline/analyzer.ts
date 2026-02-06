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
  /** Stop node ID - analysis stops when reaching this node (for branch convergence). */
  stopAtNodeId?: string;
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
      endsWithInteraction: checkEndsWithInteraction(body, context.pipeline),
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
        endsWithInteraction: checkEndsWithInteraction(handlerBody, context.pipeline),
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
    // Stop if we've reached the convergence point
    if (context.stopAtNodeId && currentId === context.stopAtNodeId) {
      break;
    }

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
          const pipeletBlock = analyzePipeletWithError(node, context);
          blocks.push(pipeletBlock);
          // Continue from the convergence point (join node) after the if-else
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

  // If no explicit "no" connector, look for implicit path (any non-"yes" transition)
  // In pipelines, transitions can have various target-connector values (like "in1")
  // that represent the destination connector, not the source connector.
  // For decision nodes, only "yes" and "no" are valid source connectors,
  // so any other transition is effectively the "no" path.
  const implicitNoTransition = !noTransition
    ? node.transitions.find((t) => t.connector !== 'yes' && t.connector !== 'error')
    : undefined;

  const effectiveNoTransition = noTransition || implicitNoTransition;

  // Find convergence point to limit branch analysis
  const convergencePoint = findConvergencePoint(node, context);

  let thenBlock: ControlFlowBlock = {type: 'sequence', blocks: []};
  let elseBlock: ControlFlowBlock | undefined;

  if (yesTransition) {
    const branchContext = createBranchContext(context, convergencePoint);
    thenBlock = analyzeFromNode(yesTransition.targetId, branchContext);
    context.warnings.push(...branchContext.warnings);
    mergeImports(context, branchContext);
  }

  if (effectiveNoTransition) {
    const branchContext = createBranchContext(context, convergencePoint);
    elseBlock = analyzeFromNode(effectiveNoTransition.targetId, branchContext);
    context.warnings.push(...branchContext.warnings);
    mergeImports(context, branchContext);
    // If else block is empty (just led to convergence), check if we need to include post-convergence content
    if (elseBlock.type === 'sequence' && elseBlock.blocks.length === 0) {
      elseBlock = undefined;
    }
  }

  // If the else path was empty (led directly to convergence) but the yes path doesn't reach convergence,
  // what's after convergence is the else block's content (like error/notfound).
  // This mirrors the fix in analyzePipeletWithError for error branches through join-nodes.
  if (convergencePoint && !elseBlock && effectiveNoTransition) {
    const yesReachesConvergence = yesTransition
      ? pathReachesNode(yesTransition.targetId, convergencePoint, context.pipeline)
      : false;

    if (!yesReachesConvergence) {
      // Yes path terminates before convergence, so what's after convergence is error handling
      const afterConvergenceContext = createBranchContext(context);
      const afterConvergence = analyzeFromNode(convergencePoint, afterConvergenceContext);
      if (hasContent(afterConvergence)) {
        elseBlock = afterConvergence;
        context.warnings.push(...afterConvergenceContext.warnings);
        mergeImports(context, afterConvergenceContext);
        // Mark these nodes as visited so they won't be re-analyzed
        for (const id of afterConvergenceContext.visited) {
          context.visited.add(id);
        }
      }
    }
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
 * Gets the success condition expression for a pipelet with error handling.
 * This determines what to check after the pipelet executes to know if it succeeded.
 */
function getPipeletSuccessCondition(node: PipeletNodeIR): string {
  // Common output variable keys - check if this pipelet assigns one of these
  const commonOutputKeys = [
    'Product',
    'Category',
    'Customer',
    'Address',
    'Basket',
    'Order',
    'Content',
    'ProductList',
    'GiftCertificate',
    'SearchResult',
    'ProductLineItem',
    'PaymentInstrument',
  ];

  // Check for common output key bindings
  for (const key of commonOutputKeys) {
    const binding = node.keyBindings.find((kb) => kb.key === key);
    if (binding && binding.value && binding.value !== 'null') {
      // Transform the output variable and check it
      const varName = binding.value.startsWith('pdict.') ? binding.value : `pdict.${binding.value}`;
      return varName;
    }
  }

  // Map pipelet names to their success conditions for special cases
  const conditions: Record<string, string> = {
    // LoginCustomer returns AuthenticationStatus
    LoginCustomer: 'pdict.AuthenticationStatus && pdict.AuthenticationStatus.isAuthenticated()',

    // Form pipelets - AcceptForm returns boolean via accept()
    AcceptForm: 'pdict.FormValid',

    // CSRF validation - set by ValidateCSRFToken
    ValidateCSRFToken: 'pdict.CSRFTokenValid',

    // ValidateResetPasswordToken returns Customer (null if invalid)
    ValidateResetPasswordToken: 'pdict.Customer',

    // Script pipelet - uses scriptResult variable
    Script: 'scriptResult !== PIPELET_ERROR',
  };

  // Check if this pipelet has a known condition
  const condition = conditions[node.pipeletName];
  if (condition) {
    return condition;
  }

  // For pipelets with output bindings, check the first output variable
  // Look for common output parameter patterns
  const outputBinding = node.keyBindings.find(
    (kb) =>
      kb.key === node.pipeletName ||
      kb.key === 'Output' ||
      kb.key === 'Result' ||
      (kb.key.endsWith('_out') && kb.value !== 'null'),
  );

  if (outputBinding && outputBinding.value !== 'null') {
    return `pdict.${outputBinding.value.replace(/^pdict\./, '')}`;
  }

  // Default: check for a truthy result
  return 'true';
}

/**
 * Analyzes a pipelet with error handling into a sequence with if-else block.
 * This creates: [pipelet statement] + [if (success) { successPath } else { errorPath }]
 */
function analyzePipeletWithError(node: PipeletNodeIR, context: AnalysisContext): ControlFlowBlock {
  const errorTransition = node.transitions.find((t) => t.connector === 'error');
  const successTransition = node.transitions.find((t) => !t.connector || t.connector === 'next');

  // Find convergence point to limit branch analysis
  const convergencePoint = findConvergencePoint(node, context);

  // 1. Create the pipelet statement
  const pipeletStatement = createStatement(node.id);
  collectPipeletImports(node, context);

  // 2. Analyze success path (up to convergence, NOT including convergence)
  let thenBlock: ControlFlowBlock = {type: 'sequence', blocks: []};
  if (successTransition && convergencePoint) {
    const successContext = createBranchContext(context, convergencePoint);
    thenBlock = analyzeFromNode(successTransition.targetId, successContext);
    context.warnings.push(...successContext.warnings);
    mergeImports(context, successContext);
  } else if (successTransition && !convergencePoint) {
    // No convergence point - analyze success path fully
    const successContext = createBranchContext(context);
    thenBlock = analyzeFromNode(successTransition.targetId, successContext);
    context.warnings.push(...successContext.warnings);
    mergeImports(context, successContext);
  }

  // 3. Analyze error path (up to convergence)
  let elseBlock: ControlFlowBlock | undefined;
  if (errorTransition) {
    const errorContext = createBranchContext(context, convergencePoint);
    elseBlock = analyzeFromNode(errorTransition.targetId, errorContext);
    context.warnings.push(...errorContext.warnings);
    mergeImports(context, errorContext);
    // Only include else block if it has content
    if (elseBlock.type === 'sequence' && elseBlock.blocks.length === 0) {
      elseBlock = undefined;
    }
  }

  // 4. If error path was empty (led directly to convergence), check what comes after.
  // This handles cases where error transitions go through join-nodes to error handling
  // (e.g., error -> join-node -> error/notfound interaction).
  // Only use this if the success path doesn't also reach the convergence point
  // (i.e., success terminates at end-node or interaction before convergence).
  if (convergencePoint && !elseBlock && errorTransition) {
    const successReachesConvergence = successTransition
      ? pathReachesNode(successTransition.targetId, convergencePoint, context.pipeline)
      : false;

    if (!successReachesConvergence) {
      // Success path terminates before convergence, so what's after convergence is error handling
      const afterConvergenceContext = createBranchContext(context);
      const afterConvergence = analyzeFromNode(convergencePoint, afterConvergenceContext);
      if (hasContent(afterConvergence)) {
        elseBlock = afterConvergence;
        context.warnings.push(...afterConvergenceContext.warnings);
        mergeImports(context, afterConvergenceContext);
        // Mark these nodes as visited in the parent context so the main loop
        // won't re-analyze them when continuing from the convergence point
        for (const id of afterConvergenceContext.visited) {
          context.visited.add(id);
        }
      }
    }
  }

  // 5. Build if-else block with success condition
  const ifElseBlock: IfElseBlock = {
    type: 'if-else',
    condition: getPipeletSuccessCondition(node),
    thenBlock,
    elseBlock,
  };

  // 6. Return sequence: pipelet, then if-else
  return simplifySequence({
    type: 'sequence',
    blocks: [pipeletStatement, ifElseBlock],
  });
}

/**
 * Checks if the SUCCESS path from startId would reach targetId without terminating.
 * Used to determine if both branches of a decision converge or if one terminates early.
 * Only follows non-error transitions to check the main success path.
 */
function pathReachesNode(startId: string, targetId: string, pipeline: PipelineIR): boolean {
  const visited = new Set<string>();
  const queue = [startId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === targetId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const node = pipeline.nodes.get(current);
    if (!node) continue;

    // End nodes and interaction nodes are terminal - path doesn't continue
    if (node.type === 'end' || node.type === 'interaction' || node.type === 'interaction-continue') {
      continue;
    }

    // Only follow success transitions (non-error paths)
    // This ensures we're checking if the main success path reaches the target,
    // not whether any path (including error handling) reaches it.
    for (const t of node.transitions) {
      if (t.connector !== 'error') {
        queue.push(t.targetId);
      }
    }
  }

  return false;
}

/**
 * Checks if a control flow block has any content.
 */
function hasContent(block: ControlFlowBlock): boolean {
  if (block.type === 'statement') {
    return true;
  }
  if (block.type === 'sequence') {
    return block.blocks.length > 0 && block.blocks.some(hasContent);
  }
  if (block.type === 'if-else') {
    return hasContent(block.thenBlock) || (block.elseBlock ? hasContent(block.elseBlock) : false);
  }
  if (block.type === 'loop') {
    return hasContent(block.body);
  }
  return false;
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
function createBranchContext(parent: AnalysisContext, stopAtNodeId?: string): AnalysisContext {
  return {
    pipeline: parent.pipeline,
    visited: new Set(parent.visited),
    requiredImports: new Set(),
    warnings: [],
    stopAtNodeId,
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

/**
 * Checks if a control flow block ends with an interaction node.
 * Used to determine if a function should return pdict or render a template.
 */
function checkEndsWithInteraction(block: ControlFlowBlock, pipeline: PipelineIR): boolean {
  switch (block.type) {
    case 'statement': {
      const node = pipeline.nodes.get(block.nodeId);
      return node?.type === 'interaction' || node?.type === 'interaction-continue';
    }
    case 'sequence': {
      // Check if the last non-empty block ends with interaction
      for (let i = block.blocks.length - 1; i >= 0; i--) {
        if (checkEndsWithInteraction(block.blocks[i], pipeline)) {
          return true;
        }
      }
      return false;
    }
    case 'if-else': {
      // Both branches should end with interaction for consistent behavior
      const thenEnds = checkEndsWithInteraction(block.thenBlock, pipeline);
      const elseEnds = block.elseBlock ? checkEndsWithInteraction(block.elseBlock, pipeline) : false;
      return thenEnds || elseEnds;
    }
    case 'loop': {
      return checkEndsWithInteraction(block.body, pipeline);
    }
    default:
      return false;
  }
}
