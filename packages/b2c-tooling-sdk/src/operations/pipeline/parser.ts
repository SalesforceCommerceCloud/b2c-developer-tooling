/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Pipeline XML parser.
 *
 * Parses B2C Commerce pipeline XML files into an intermediate representation (IR)
 * that can be analyzed and converted to JavaScript controller code.
 *
 * @module operations/pipeline/parser
 */

import {parseStringPromise} from 'xml2js';
import type {
  CallNodeIR,
  ConfigProperty,
  DecisionNodeIR,
  EndNodeIR,
  InteractionContinueNodeIR,
  InteractionNodeIR,
  JoinNodeIR,
  JumpNodeIR,
  KeyBinding,
  LoopNodeIR,
  NodeIR,
  PipelineIR,
  PipeletNodeIR,
  RawBranch,
  RawNodeWrapper,
  RawPipelineDocument,
  RawSegment,
  RawTransition,
  StartNodeIR,
} from './types.js';

/**
 * Context for tracking node parsing state.
 */
interface ParseContext {
  /** Counter for generating unique node IDs. */
  nodeCounter: number;
  /** Map of path references to node IDs for resolving transitions. */
  pathToNodeId: Map<string, string>;
  /** Pending transitions that need to be resolved after all nodes are parsed. */
  pendingTransitions: Array<{
    sourceNodeId: string;
    targetPath: string;
    connector?: string;
    transactionControl?: 'begin' | 'commit' | 'rollback';
  }>;
  /** The pipeline name (for call node resolution). */
  pipelineName: string;
}

/**
 * Parses a pipeline XML file into an intermediate representation.
 *
 * @param xml - The pipeline XML content
 * @param pipelineName - The name of the pipeline (usually from filename)
 * @returns The parsed pipeline IR
 */
export async function parsePipeline(xml: string, pipelineName: string): Promise<PipelineIR> {
  const result = (await parseStringPromise(xml, {
    explicitArray: true,
    mergeAttrs: false,
  })) as RawPipelineDocument;

  const pipeline = result.pipeline;
  const nodes = new Map<string, NodeIR>();
  const startNodes: string[] = [];

  const context: ParseContext = {
    nodeCounter: 0,
    pathToNodeId: new Map(),
    pendingTransitions: [],
    pipelineName,
  };

  // Parse all branches
  if (pipeline.branch) {
    for (const branch of pipeline.branch) {
      parseBranch(branch, nodes, startNodes, context);
    }
  }

  // Resolve pending transitions
  resolvePendingTransitions(nodes, context);

  return {
    name: pipelineName,
    group: pipeline.$?.group,
    nodes,
    startNodes,
  };
}

/**
 * Parses a branch element and its segments.
 */
function parseBranch(
  branch: RawBranch,
  nodes: Map<string, NodeIR>,
  startNodes: string[],
  context: ParseContext,
  branchPath: string = '',
): void {
  const branchName = branch.$?.basename || `branch_${context.nodeCounter}`;
  const currentPath = branchPath ? `${branchPath}/${branchName}` : `/${branchName}`;

  if (branch.segment) {
    for (let segIdx = 0; segIdx < branch.segment.length; segIdx++) {
      const segment = branch.segment[segIdx];
      const segmentPath = `${currentPath}.${segIdx + 1}`;
      parseSegment(segment, nodes, startNodes, context, segmentPath);
    }
  }
}

/**
 * Parses a segment element and its nodes.
 */
function parseSegment(
  segment: RawSegment,
  nodes: Map<string, NodeIR>,
  startNodes: string[],
  context: ParseContext,
  segmentPath: string,
): void {
  let previousNodeId: string | undefined;

  if (segment.node) {
    for (let nodeIdx = 0; nodeIdx < segment.node.length; nodeIdx++) {
      const nodeWrapper = segment.node[nodeIdx];
      const nodePath = `${segmentPath}.${nodeIdx + 1}`;

      const parsedNode = parseNodeWrapper(nodeWrapper, nodes, startNodes, context, nodePath);

      if (parsedNode) {
        // Handle simple-transition from previous node
        if (previousNodeId && nodeIdx > 0) {
          const prevTransition = getTransitionAfterNode(segment, nodeIdx - 1);
          if (prevTransition) {
            addTransition(nodes, previousNodeId, parsedNode.id, prevTransition, context);
          } else {
            // Default simple transition
            const prevNode = nodes.get(previousNodeId);
            if (prevNode) {
              prevNode.transitions.push({targetId: parsedNode.id});
            }
          }
        }

        previousNodeId = parsedNode.id;
      }
    }
  }

  // Handle final transition in segment (to another segment or branch)
  if (previousNodeId && segment.node) {
    let lastTransition = getTransitionAfterNode(segment, segment.node.length - 1);

    // CRITICAL FIX: If no transition found at index, check for remaining transitions.
    // This handles the case where xml2js puts transitions in separate arrays by tag name,
    // so the transition array may have fewer items than the node array.
    // For example: 3 nodes with 2 simple-transitions and 1 transition at the end.
    // The transition for node[2] is at segment.transition[0], not segment.transition[2].
    //
    // The key insight: simple-transition elements are for BETWEEN nodes in a segment,
    // while transition elements (with target-path) are for jumping OUT of the segment.
    // For the final node, if there's an unmatched transition, it belongs to that node.
    if (!lastTransition && segment.transition && segment.transition.length > 0) {
      const simpleTransCount = segment['simple-transition']?.length ?? 0;
      const nodeCount = segment.node.length;
      const transitionCount = segment.transition.length;

      // Calculate how many transitions we've already consumed by the indexed lookup.
      // Within-segment transitions use simple-transition for nodes 0 to (nodeCount-2).
      // If there are fewer simple-transitions than (nodeCount-1), the transition array
      // may contain transitions for later nodes. The final node's transition is typically
      // the last unmatched one.
      if (simpleTransCount < nodeCount - 1) {
        // Not enough simple-transitions to cover all internal nodes,
        // so transition array has transitions for some nodes
        const transitionsUsedByNodes = Math.max(0, nodeCount - 1 - simpleTransCount);
        if (transitionCount > transitionsUsedByNodes) {
          // There's an extra transition for the final node's outgoing path
          lastTransition = segment.transition[transitionCount - 1];
        }
      } else {
        // Enough simple-transitions for internal nodes, so any transition is for final node
        lastTransition = segment.transition[transitionCount - 1];
      }
    }

    if (lastTransition && lastTransition.$?.['target-path']) {
      context.pendingTransitions.push({
        sourceNodeId: previousNodeId,
        targetPath: resolveTargetPath(segmentPath, lastTransition.$['target-path']),
        connector: lastTransition.$?.['target-connector'],
        transactionControl: lastTransition.$?.['transaction-control'],
      });
    }
  }
}

/**
 * Gets the transition element after a node at the given index.
 */
function getTransitionAfterNode(segment: RawSegment, nodeIndex: number): RawTransition | undefined {
  // Transitions can appear as simple-transition or transition elements
  // They are typically interleaved with nodes in the segment
  // For simplicity, we look at the structure of the segment

  // In xml2js output, simple-transition and transition are parallel to node
  // A simple approach: transitions apply to the preceding node
  // Note: empty <simple-transition/> elements are parsed as '' (empty string) by xml2js,
  // so we check for array length rather than truthiness of the value
  if (segment['simple-transition'] && nodeIndex < segment['simple-transition'].length) {
    const trans = segment['simple-transition'][nodeIndex];
    // Return the transition object, or an empty object for empty simple-transition elements
    return typeof trans === 'object' && trans !== null ? trans : {};
  }
  if (segment.transition && nodeIndex < segment.transition.length) {
    return segment.transition[nodeIndex];
  }
  return undefined;
}

/**
 * Resolves a relative target-path to an absolute path.
 */
function resolveTargetPath(currentPath: string, targetPath: string): string {
  if (targetPath.startsWith('/')) {
    return targetPath;
  }

  // Handle relative paths like ./+1, ../+2, etc.
  const pathParts = currentPath.split('/').filter(Boolean);
  const targetParts = targetPath.split('/').filter(Boolean);

  for (const part of targetParts) {
    if (part === '.') {
      continue;
    } else if (part === '..') {
      pathParts.pop();
    } else if (part.startsWith('+')) {
      // Segment offset like +1
      const lastPart = pathParts[pathParts.length - 1];
      const segmentMatch = lastPart.match(/^(.+)\.(\d+)$/);
      if (segmentMatch) {
        const [, base, segNum] = segmentMatch;
        const offset = parseInt(part.substring(1), 10);
        pathParts[pathParts.length - 1] = `${base}.${parseInt(segNum, 10) + offset}`;
      }
    } else {
      pathParts.push(part);
    }
  }

  return '/' + pathParts.join('/');
}

/**
 * Adds a transition from source node to target node.
 */
function addTransition(
  nodes: Map<string, NodeIR>,
  sourceNodeId: string,
  targetNodeId: string,
  transition: RawTransition,
  context: ParseContext,
): void {
  const sourceNode = nodes.get(sourceNodeId);
  if (!sourceNode) return;

  if (transition.$?.['target-path']) {
    // This is a jump to another segment/branch
    context.pendingTransitions.push({
      sourceNodeId,
      targetPath: transition.$['target-path'],
      connector: transition.$?.['target-connector'],
      transactionControl: transition.$?.['transaction-control'],
    });
  } else {
    // Direct transition to next node
    sourceNode.transitions.push({
      targetId: targetNodeId,
      connector: transition.$?.['target-connector'],
      transactionControl: transition.$?.['transaction-control'],
    });
  }
}

/**
 * Parses a node wrapper and returns the created IR node.
 */
function parseNodeWrapper(
  wrapper: RawNodeWrapper,
  nodes: Map<string, NodeIR>,
  startNodes: string[],
  context: ParseContext,
  nodePath: string,
): NodeIR | undefined {
  let node: NodeIR | undefined;

  // Start node
  if (wrapper['start-node']?.[0]) {
    const raw = wrapper['start-node'][0];
    node = {
      type: 'start',
      id: generateNodeId(context),
      name: raw.$.name,
      secure: raw.$.secure === 'true',
      isPrivate: raw.$['call-mode'] === 'private',
      transitions: [],
    } satisfies StartNodeIR;
    startNodes.push(node.id);
  }

  // End node (may be empty element with no attributes)
  if (wrapper['end-node']?.length) {
    const raw = wrapper['end-node'][0];
    // raw may be an empty string "" for <end-node/>
    const name = typeof raw === 'object' ? raw.$?.name : undefined;
    node = {
      type: 'end',
      id: generateNodeId(context),
      name,
      transitions: [],
    } satisfies EndNodeIR;
  }

  // Decision node
  if (wrapper['decision-node']?.[0]) {
    const raw = wrapper['decision-node'][0];
    node = {
      type: 'decision',
      id: generateNodeId(context),
      condition: raw.$['condition-key'],
      operator: raw.$['condition-operator'],
      transitions: [],
    } satisfies DecisionNodeIR;
  }

  // Pipelet node
  if (wrapper['pipelet-node']?.[0]) {
    const raw = wrapper['pipelet-node'][0];
    const keyBindings: KeyBinding[] = [];
    const configProperties: ConfigProperty[] = [];

    if (raw['key-binding']) {
      for (const kb of raw['key-binding']) {
        // Skip null bindings - only add if BOTH alias and key are not 'null'
        if (kb.$.alias !== 'null' && kb.$.key !== 'null') {
          keyBindings.push({
            key: kb.$.key,
            value: kb.$.alias,
          });
        }
      }
    }

    if (raw['config-property']) {
      for (const cp of raw['config-property']) {
        configProperties.push({
          key: cp.$.key,
          value: cp.$.value,
        });
      }
    }

    // Check if there's an error branch - can be in the wrapper OR inside the pipelet-node itself
    const hasErrorBranch =
      wrapper.branch?.some((b) => b.$?.['source-connector'] === 'error') ||
      raw.branch?.some((b) => b.$?.['source-connector'] === 'error') ||
      false;

    node = {
      type: 'pipelet',
      id: generateNodeId(context),
      pipeletName: raw.$['pipelet-name'],
      pipeletSet: raw.$['pipelet-set-identifier'],
      customName: raw.$['custom-name'],
      keyBindings,
      configProperties,
      hasErrorBranch,
      transitions: [],
    } satisfies PipeletNodeIR;

    // Store pipelet-level branches in wrapper.branch for unified handling below
    // This is needed because pipelet error branches can be inside the pipelet-node element
    if (raw.branch && raw.branch.length > 0) {
      if (!wrapper.branch) {
        wrapper.branch = [];
      }
      wrapper.branch.push(...raw.branch);
    }
  }

  // Call node
  if (wrapper['call-node']?.[0]) {
    const raw = wrapper['call-node'][0];
    const targetRef = raw.$['start-name-ref'];
    const dynamicKey = raw.$['start-name-key'];

    if (dynamicKey && !targetRef) {
      // Dynamic dispatch - target determined at runtime
      node = {
        type: 'call',
        id: generateNodeId(context),
        targetRef: dynamicKey,
        pipelineName: dynamicKey,
        startName: dynamicKey,
        isDynamic: true,
        dynamicKey,
        transitions: [],
      } satisfies CallNodeIR;
    } else {
      const [pipelineName, startName] = parseTargetRef(targetRef ?? '');
      node = {
        type: 'call',
        id: generateNodeId(context),
        targetRef: targetRef ?? '',
        pipelineName,
        startName,
        transitions: [],
      } satisfies CallNodeIR;
    }
  }

  // Jump node
  if (wrapper['jump-node']?.[0]) {
    const raw = wrapper['jump-node'][0];
    const targetRef = raw.$['start-name-ref'];
    const dynamicKey = raw.$['start-name-key'];

    if (dynamicKey && !targetRef) {
      // Dynamic dispatch - target determined at runtime
      node = {
        type: 'jump',
        id: generateNodeId(context),
        targetRef: dynamicKey,
        pipelineName: dynamicKey,
        startName: dynamicKey,
        isDynamic: true,
        dynamicKey,
        transitions: [],
      } satisfies JumpNodeIR;
    } else {
      const [pipelineName, startName] = parseTargetRef(targetRef ?? '');
      node = {
        type: 'jump',
        id: generateNodeId(context),
        targetRef: targetRef ?? '',
        pipelineName,
        startName,
        transitions: [],
      } satisfies JumpNodeIR;
    }
  }

  // Loop node
  if (wrapper['loop-node']?.[0]) {
    const raw = wrapper['loop-node'][0];
    node = {
      type: 'loop',
      id: generateNodeId(context),
      elementKey: raw.$['element-key'],
      iteratorKey: raw.$['iterator-key'],
      transitions: [],
    } satisfies LoopNodeIR;
  }

  // Join node (typically empty element with no attributes)
  if (wrapper['join-node']?.length) {
    node = {
      type: 'join',
      id: generateNodeId(context),
      transitions: [],
    } satisfies JoinNodeIR;
  }

  // Interaction node
  if (wrapper['interaction-node']?.[0]) {
    const raw = wrapper['interaction-node'][0];
    const templateName = raw.template?.[0]?.$.name || '';
    const dynamic = raw.template?.[0]?.$.dynamic === 'true';

    node = {
      type: 'interaction',
      id: generateNodeId(context),
      templateName,
      dynamic,
      buffered: raw.template?.[0]?.$.buffered === 'true',
      transactionRequired: raw.$?.['transaction-required'] === 'true',
      transitions: [],
    } satisfies InteractionNodeIR;
  }

  // Interaction-continue node
  if (wrapper['interaction-continue-node']?.[0]) {
    const raw = wrapper['interaction-continue-node'][0];
    const templateName = raw.template?.[0]?.$.name || '';

    // Collect branch connectors from the wrapper's branches
    const branchConnectors: string[] = [];
    if (wrapper.branch) {
      for (const b of wrapper.branch) {
        const connector = b.$?.['source-connector'];
        if (connector) {
          branchConnectors.push(connector);
        }
      }
    }

    node = {
      type: 'interaction-continue',
      id: generateNodeId(context),
      templateName,
      handlerStartName: raw.$['start-name'],
      secure: raw.$.secure === 'true',
      transactionRequired: raw.$['transaction-required'] === 'true',
      branchConnectors,
      transitions: [],
    } satisfies InteractionContinueNodeIR;
  }

  // Text nodes are documentation only, skip them
  if (wrapper['text-node']) {
    return undefined;
  }

  // Register the node
  if (node) {
    nodes.set(node.id, node);
    context.pathToNodeId.set(nodePath, node.id);

    // Parse nested branches (for decision nodes, pipelet error branches, etc.)
    // Note: pipelet-level branches are merged into wrapper.branch during pipelet parsing above
    if (wrapper.branch && wrapper.branch.length > 0) {
      // Extract the parent segment path from nodePath by removing the node index suffix.
      // nodePath is like "/Show.1.4/b2.1.1" (segment path + ".nodeIndex")
      // parentSegmentPath should be "/Show.1.4/b2.1" (just the segment path)
      // This is needed because XML relative paths (../+N) navigate relative to segments.
      const parentSegmentPath = nodePath.replace(/\.\d+$/, '');

      for (const nestedBranch of wrapper.branch) {
        const connector = nestedBranch.$?.['source-connector'];

        // Handle the transition from this node to the branch
        if (nestedBranch.transition?.[0]) {
          const trans = nestedBranch.transition[0];
          if (trans.$?.['target-path']) {
            context.pendingTransitions.push({
              sourceNodeId: node.id,
              targetPath: resolveTargetPath(nodePath, trans.$['target-path']),
              connector,
              transactionControl: trans.$?.['transaction-control'],
            });
          } else if (nestedBranch.segment?.[0]) {
            // Transition leads to nested segment - calculate path matching parseBranch logic
            const branchName = nestedBranch.$?.basename || `branch_${context.nodeCounter}`;
            const branchPath = `${parentSegmentPath}/${branchName}`;
            parseBranch(nestedBranch, nodes, startNodes, context, parentSegmentPath);

            // After parsing the branch, link the first node of the first segment
            const firstSegmentPath = `${branchPath}.1`;
            if (context.pathToNodeId.has(`${firstSegmentPath}.1`)) {
              node.transitions.push({
                targetId: context.pathToNodeId.get(`${firstSegmentPath}.1`)!,
                connector,
                transactionControl: trans.$?.['transaction-control'],
              });
            }
          }
        } else if (nestedBranch.segment?.[0]) {
          // Branch with segments but no explicit transition - parse and link
          // Calculate path matching parseBranch logic
          const branchName = nestedBranch.$?.basename || `branch_${context.nodeCounter}`;
          const branchPath = `${parentSegmentPath}/${branchName}`;
          parseBranch(nestedBranch, nodes, startNodes, context, parentSegmentPath);

          // Link the first node of the first segment to this node
          const firstSegmentPath = `${branchPath}.1`;
          if (context.pathToNodeId.has(`${firstSegmentPath}.1`)) {
            node.transitions.push({
              targetId: context.pathToNodeId.get(`${firstSegmentPath}.1`)!,
              connector,
            });
          }
        }
      }
    }
  }

  return node;
}

/**
 * Generates a unique node ID.
 */
function generateNodeId(context: ParseContext): string {
  return `node_${++context.nodeCounter}`;
}

/**
 * Parses a target reference like 'Pipeline-StartName' into its parts.
 */
function parseTargetRef(ref: string): [string, string] {
  const dashIndex = ref.indexOf('-');
  if (dashIndex === -1) {
    return [ref, ref];
  }
  return [ref.substring(0, dashIndex), ref.substring(dashIndex + 1)];
}

/**
 * Resolves pending transitions after all nodes have been parsed.
 */
function resolvePendingTransitions(nodes: Map<string, NodeIR>, context: ParseContext): void {
  for (const pending of context.pendingTransitions) {
    const sourceNode = nodes.get(pending.sourceNodeId);
    if (!sourceNode) continue;

    // First try exact match (for node paths)
    let targetNodeId = context.pathToNodeId.get(pending.targetPath);

    // If no exact match, the target might be a segment path.
    // Try to find the first node in that segment (path + ".1").
    if (!targetNodeId) {
      targetNodeId = context.pathToNodeId.get(`${pending.targetPath}.1`);
    }

    if (targetNodeId) {
      sourceNode.transitions.push({
        targetId: targetNodeId,
        connector: pending.connector,
        transactionControl: pending.transactionControl,
      });
    }
  }
}
