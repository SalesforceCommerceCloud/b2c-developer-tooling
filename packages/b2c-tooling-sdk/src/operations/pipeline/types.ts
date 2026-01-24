/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Type definitions for the pipeline-to-controller converter.
 *
 * This module defines:
 * - Raw XML types (what xml2js returns after parsing)
 * - Intermediate Representation (IR) types for the parsed pipeline
 * - Configuration and options types
 *
 * @module operations/pipeline/types
 */

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Options for converting a pipeline to controller code.
 */
export interface ConvertOptions {
  /** Output file path. If not specified, outputs to stdout. */
  outputPath?: string;
  /** If true, don't write the file, just return the generated code. */
  dryRun?: boolean;
}

/**
 * Result of a pipeline conversion.
 */
export interface ConvertResult {
  /** The pipeline name (from filename). */
  pipelineName: string;
  /** The generated JavaScript controller code. */
  code: string;
  /** Path where the code was written (if not dry-run). */
  outputPath?: string;
  /** Warnings encountered during conversion. */
  warnings: string[];
}

// ============================================================================
// Raw XML Types (what xml2js returns)
// ============================================================================

/**
 * Key-binding element from pipeline XML.
 * Maps a value (alias) to a named parameter (key).
 */
export interface RawKeyBinding {
  $: {
    alias: string;
    key: string;
  };
}

/**
 * Config property element from pipeline XML.
 */
export interface RawConfigProperty {
  $: {
    key: string;
    value: string;
  };
}

/**
 * Start node element from pipeline XML.
 */
export interface RawStartNode {
  $: {
    name: string;
    secure?: string;
    'call-mode'?: 'private';
  };
}

/**
 * End node element from pipeline XML.
 */
export interface RawEndNode {
  $?: {
    name?: string;
  };
}

/**
 * Decision node element from pipeline XML.
 */
export interface RawDecisionNode {
  $: {
    'condition-key': string;
    'condition-operator': string;
  };
}

/**
 * Pipelet node element from pipeline XML.
 */
export interface RawPipeletNode {
  $: {
    'pipelet-name': string;
    'pipelet-set-identifier': string;
    'custom-name'?: string;
  };
  'config-property'?: RawConfigProperty[];
  'key-binding'?: RawKeyBinding[];
}

/**
 * Call node element from pipeline XML.
 */
export interface RawCallNode {
  $: {
    'start-name-ref': string;
  };
}

/**
 * Jump node element from pipeline XML.
 */
export interface RawJumpNode {
  $: {
    'start-name-ref': string;
  };
}

/**
 * Loop node element from pipeline XML.
 */
export interface RawLoopNode {
  $: {
    'element-key': string;
    'iterator-key': string;
  };
}

/**
 * Join node element from pipeline XML.
 * Join nodes have no attributes - they're typically empty elements.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RawJoinNode {}

/**
 * Template element within interaction nodes.
 */
export interface RawTemplate {
  $: {
    name: string;
    buffered?: string;
    dynamic?: string;
  };
}

/**
 * Interaction node element from pipeline XML.
 */
export interface RawInteractionNode {
  $?: {
    'transaction-required'?: string;
  };
  template?: RawTemplate[];
}

/**
 * Interaction-continue node element from pipeline XML.
 */
export interface RawInteractionContinueNode {
  $: {
    'start-name': string;
    secure?: string;
    'transaction-required'?: string;
  };
  template?: RawTemplate[];
}

/**
 * Text node element from pipeline XML (documentation only).
 */
export interface RawTextNode {
  description?: string[];
}

/**
 * Transition element from pipeline XML.
 */
export interface RawTransition {
  $?: {
    'target-connector'?: string;
    'target-path'?: string;
    'transaction-control'?: 'begin' | 'commit' | 'rollback';
  };
}

/**
 * Branch element from pipeline XML.
 */
export interface RawBranch {
  $?: {
    basename?: string;
    'source-connector'?: string;
  };
  segment?: RawSegment[];
  transition?: RawTransition[];
}

/**
 * Node wrapper element from pipeline XML.
 */
export interface RawNodeWrapper {
  'start-node'?: RawStartNode[];
  'end-node'?: RawEndNode[];
  'decision-node'?: RawDecisionNode[];
  'pipelet-node'?: RawPipeletNode[];
  'call-node'?: RawCallNode[];
  'jump-node'?: RawJumpNode[];
  'loop-node'?: RawLoopNode[];
  'join-node'?: RawJoinNode[];
  'interaction-node'?: RawInteractionNode[];
  'interaction-continue-node'?: RawInteractionContinueNode[];
  'text-node'?: RawTextNode[];
  'node-display'?: unknown[];
  branch?: RawBranch[];
}

/**
 * Segment element from pipeline XML.
 */
export interface RawSegment {
  node?: RawNodeWrapper[];
  'simple-transition'?: RawTransition[];
  transition?: RawTransition[];
}

/**
 * Pipeline root element from pipeline XML.
 */
export interface RawPipeline {
  $?: {
    group?: string;
  };
  branch?: RawBranch[];
}

/**
 * Root structure returned by xml2js.
 */
export interface RawPipelineDocument {
  pipeline: RawPipeline;
}

// ============================================================================
// Intermediate Representation (IR) Types
// ============================================================================

/**
 * Base interface for all IR nodes.
 */
export interface NodeIRBase {
  /** Unique identifier for this node within the pipeline. */
  id: string;
  /** Array of node IDs this node can transition to. */
  transitions: TransitionIR[];
}

/**
 * Transition in the IR.
 */
export interface TransitionIR {
  /** Target node ID. */
  targetId: string;
  /** Connector type (e.g., 'yes', 'no', 'error', 'do', 'done'). */
  connector?: string;
  /** Transaction control action. */
  transactionControl?: 'begin' | 'commit' | 'rollback';
}

/**
 * Start node - entry point for a pipeline function.
 */
export interface StartNodeIR extends NodeIRBase {
  type: 'start';
  /** Function name for this start node. */
  name: string;
  /** Whether this endpoint requires HTTPS. */
  secure: boolean;
  /** Whether this is a private (internal-only) start node. */
  isPrivate: boolean;
}

/**
 * End node - exit point from a pipeline function.
 */
export interface EndNodeIR extends NodeIRBase {
  type: 'end';
  /** Optional name for the end node (used for return value). */
  name?: string;
}

/**
 * Decision node - conditional branching.
 */
export interface DecisionNodeIR extends NodeIRBase {
  type: 'decision';
  /** The condition expression. */
  condition: string;
  /** The condition operator (e.g., 'expr', 'isTrue'). */
  operator: string;
}

/**
 * Key-value binding for pipelet parameters.
 */
export interface KeyBinding {
  /** The parameter key name. */
  key: string;
  /** The value expression (alias). */
  value: string;
}

/**
 * Config property for pipelet configuration.
 */
export interface ConfigProperty {
  key: string;
  value: string;
}

/**
 * Pipelet node - executes a pipelet (built-in or custom).
 */
export interface PipeletNodeIR extends NodeIRBase {
  type: 'pipelet';
  /** The pipelet name (e.g., 'Assign', 'Script', 'GetCustomer'). */
  pipeletName: string;
  /** The pipelet set identifier (e.g., 'bc_api'). */
  pipeletSet: string;
  /** Optional custom display name. */
  customName?: string;
  /** Key bindings (parameter mappings). */
  keyBindings: KeyBinding[];
  /** Config properties. */
  configProperties: ConfigProperty[];
  /** Whether this pipelet has an error branch. */
  hasErrorBranch: boolean;
}

/**
 * Call node - invokes another pipeline's start node.
 */
export interface CallNodeIR extends NodeIRBase {
  type: 'call';
  /** The target in format 'PipelineName-StartName'. */
  targetRef: string;
  /** Parsed pipeline name. */
  pipelineName: string;
  /** Parsed start node name. */
  startName: string;
}

/**
 * Jump node - redirects to another pipeline's start node.
 */
export interface JumpNodeIR extends NodeIRBase {
  type: 'jump';
  /** The target in format 'PipelineName-StartName'. */
  targetRef: string;
  /** Parsed pipeline name. */
  pipelineName: string;
  /** Parsed start node name. */
  startName: string;
}

/**
 * Loop node - iterates over a collection.
 */
export interface LoopNodeIR extends NodeIRBase {
  type: 'loop';
  /** The variable name for each element. */
  elementKey: string;
  /** The collection variable to iterate over. */
  iteratorKey: string;
}

/**
 * Join node - convergence point for multiple branches.
 */
export interface JoinNodeIR extends NodeIRBase {
  type: 'join';
}

/**
 * Interaction node - renders a template and ends the request.
 */
export interface InteractionNodeIR extends NodeIRBase {
  type: 'interaction';
  /** Template path. */
  templateName: string;
  /** Whether the response is buffered. */
  buffered: boolean;
  /** Whether a transaction is required. */
  transactionRequired: boolean;
}

/**
 * Interaction-continue node - renders a template with form handling.
 * This generates two functions: the render function and a handler function.
 */
export interface InteractionContinueNodeIR extends NodeIRBase {
  type: 'interaction-continue';
  /** Template path. */
  templateName: string;
  /** Name for the generated handler start node. */
  handlerStartName: string;
  /** Whether this endpoint requires HTTPS. */
  secure: boolean;
  /** Whether a transaction is required. */
  transactionRequired: boolean;
  /** Branch connectors (form action IDs) that this node handles. */
  branchConnectors: string[];
}

/**
 * Union type for all IR node types.
 */
export type NodeIR =
  | StartNodeIR
  | EndNodeIR
  | DecisionNodeIR
  | PipeletNodeIR
  | CallNodeIR
  | JumpNodeIR
  | LoopNodeIR
  | JoinNodeIR
  | InteractionNodeIR
  | InteractionContinueNodeIR;

/**
 * Parsed pipeline in IR form.
 */
export interface PipelineIR {
  /** Pipeline name (from filename). */
  name: string;
  /** Pipeline group (optional metadata). */
  group?: string;
  /** Map of node ID to node IR. */
  nodes: Map<string, NodeIR>;
  /** List of start node IDs (entry points). */
  startNodes: string[];
}

// ============================================================================
// Control Flow Analysis Types
// ============================================================================

/**
 * Represents a control flow block in the analyzed pipeline.
 */
export type ControlFlowBlock = SequenceBlock | IfElseBlock | LoopBlock | TryCatchBlock | StatementBlock;

/**
 * A sequence of blocks executed in order.
 */
export interface SequenceBlock {
  type: 'sequence';
  blocks: ControlFlowBlock[];
}

/**
 * An if-else conditional block.
 */
export interface IfElseBlock {
  type: 'if-else';
  condition: string;
  thenBlock: ControlFlowBlock;
  elseBlock?: ControlFlowBlock;
}

/**
 * A loop block.
 */
export interface LoopBlock {
  type: 'loop';
  elementVar: string;
  iteratorVar: string;
  body: ControlFlowBlock;
}

/**
 * A try-catch block for error handling.
 */
export interface TryCatchBlock {
  type: 'try-catch';
  tryBlock: ControlFlowBlock;
  catchBlock: ControlFlowBlock;
}

/**
 * A single statement (leaf node).
 */
export interface StatementBlock {
  type: 'statement';
  nodeId: string;
}

/**
 * Analyzed function ready for code generation.
 */
export interface AnalyzedFunction {
  /** Function name. */
  name: string;
  /** Whether this is a public endpoint. */
  isPublic: boolean;
  /** Whether this endpoint requires HTTPS. */
  secure: boolean;
  /** Whether this is an interaction-continue handler (needs action variable). */
  isFormHandler: boolean;
  /** The control flow structure. */
  body: ControlFlowBlock;
  /** Required imports (module paths). */
  requiredImports: Set<string>;
}

/**
 * Result of control flow analysis.
 */
export interface AnalysisResult {
  /** List of functions to generate. */
  functions: AnalyzedFunction[];
  /** Warnings encountered during analysis. */
  warnings: string[];
}
