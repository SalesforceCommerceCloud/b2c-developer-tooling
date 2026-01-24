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

import type {
  AnalyzedFunction,
  AnalysisResult,
  CallNodeIR,
  ControlFlowBlock,
  EndNodeIR,
  IfElseBlock,
  InteractionContinueNodeIR,
  InteractionNodeIR,
  JumpNodeIR,
  LoopBlock,
  NodeIR,
  PipelineIR,
  PipeletNodeIR,
  SequenceBlock,
  StatementBlock,
  TryCatchBlock,
} from './types.js';

/**
 * Maps pipeline variable prefixes to their JavaScript global equivalents.
 */
const VARIABLE_MAPPINGS: Record<string, string> = {
  CurrentCustomer: 'customer',
  CurrentSession: 'session',
  CurrentRequest: 'request',
  CurrentForms: 'session.forms',
  CurrentHttpParameterMap: 'request.httpParameterMap',
};

/**
 * Context for code generation.
 */
interface GeneratorContext {
  /** The pipeline IR (for looking up nodes). */
  pipeline: PipelineIR;
  /** Current indentation level. */
  indent: number;
  /** Set of variable names that have been declared. */
  declaredVars: Set<string>;
  /** Collected require statements. */
  requires: Map<string, string>;
  /** The current pipeline name (for call node resolution). */
  pipelineName: string;
}

/**
 * Generates JavaScript controller code from the analysis result.
 *
 * @param pipeline - The parsed pipeline IR
 * @param analysis - The control flow analysis result
 * @returns Generated JavaScript code
 */
export function generateController(pipeline: PipelineIR, analysis: AnalysisResult): string {
  const lines: string[] = [];

  // Strict mode
  lines.push("'use strict';");
  lines.push('');

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

  // Write require statements
  for (const [varName, modulePath] of allRequires) {
    lines.push(`var ${varName} = require('${modulePath}');`);
  }
  lines.push('');

  // Generate each function
  for (const func of analysis.functions) {
    const context: GeneratorContext = {
      pipeline,
      indent: 1,
      declaredVars: new Set(),
      requires: allRequires,
      pipelineName: pipeline.name,
    };

    const funcCode = generateFunction(func, context);
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

/**
 * Generates code for a control flow block.
 */
function generateBlock(block: ControlFlowBlock, context: GeneratorContext): string {
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

/**
 * Generates code for a single node.
 */
function generateNode(node: NodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);

  switch (node.type) {
    case 'start':
      // Start nodes don't generate code (they become function definitions)
      return '';

    case 'end':
      return generateEndNode(node, context);

    case 'pipelet':
      return generatePipeletNode(node, context);

    case 'call':
      return generateCallNode(node, context);

    case 'jump':
      return generateJumpNode(node, context);

    case 'interaction':
      return generateInteractionNode(node, context);

    case 'interaction-continue':
      return generateInteractionContinueNode(node, context);

    case 'join':
      // Join nodes are structural, no code generated
      return '';

    case 'decision':
    case 'loop':
      // These are handled at the block level
      return '';

    default:
      return `${ind}// TODO: Unhandled node type`;
  }
}

/**
 * Generates code for an end node.
 */
function generateEndNode(node: EndNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);

  if (node.name) {
    return `${ind}return '${node.name}';`;
  }
  return `${ind}return;`;
}

/**
 * Generates code for a pipelet node.
 */
function generatePipeletNode(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  switch (node.pipeletName) {
    case 'Assign':
      return generateAssignPipelet(node, context);

    case 'Script':
      return generateScriptPipelet(node, context);

    default:
      // For unknown pipelets, generate a commented placeholder
      lines.push(`${ind}// TODO: Convert pipelet ${node.pipeletName}`);
      for (const kb of node.keyBindings) {
        lines.push(`${ind}// ${kb.key} = ${kb.value}`);
      }
      return lines.join('\n');
  }
}

/**
 * Generates code for an Assign pipelet.
 */
function generateAssignPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
function generateScriptPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
 * Generates code for a call node.
 */
function generateCallNode(node: CallNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);

  if (node.pipelineName === context.pipelineName) {
    // Same pipeline - direct function call
    return `${ind}${node.startName}();`;
  } else {
    // Different pipeline - require and call
    return `${ind}require('./${node.pipelineName}').${node.startName}();`;
  }
}

/**
 * Generates code for a jump node.
 */
function generateJumpNode(node: JumpNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);

  // Convert Pipeline-Start to Controller-Action URL
  return `${ind}response.redirect(URLUtils.url('${node.pipelineName}-${node.startName}'));`;
}

/**
 * Generates code for an interaction node.
 */
function generateInteractionNode(node: InteractionNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);

  return `${ind}ISML.renderTemplate('${node.templateName}', pdict);`;
}

/**
 * Generates code for an interaction-continue node (the render part).
 */
function generateInteractionContinueNode(node: InteractionContinueNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  // Set ContinueURL to point to the handler function
  const handlerUrl = `${context.pipelineName}-${node.handlerStartName}`;
  const urlMethod = node.secure ? 'https' : 'url';

  lines.push(`${ind}pdict.ContinueURL = URLUtils.${urlMethod}('${handlerUrl}');`);
  lines.push(`${ind}ISML.renderTemplate('${node.templateName}', pdict);`);

  return lines.join('\n');
}

/**
 * Transforms a pipeline expression to JavaScript.
 * Handles complex expressions with operators and multiple variable references.
 */
function transformExpression(expr: string): string {
  if (!expr) return expr;

  // Handle string literals (already JavaScript)
  if (expr.startsWith('"') && expr.endsWith('"')) {
    return expr;
  }

  // Handle &quot; escaped strings from XML
  let result = expr.replace(/&quot;/g, '"');

  // Handle special keywords that should not become pdict.X
  // true, false, null are JavaScript keywords
  result = result.replace(/\btrue\b/g, '___TRUE___');
  result = result.replace(/\bfalse\b/g, '___FALSE___');
  result = result.replace(/\bnull\b/g, '___NULL___');

  // Handle empty() function - it's a Script API function
  result = result.replace(/\bempty\s*\(/g, '___EMPTY___(');

  // Transform all known pipeline variable prefixes
  for (const [prefix, replacement] of Object.entries(VARIABLE_MAPPINGS)) {
    // Match prefix followed by dot or end of word
    const regex = new RegExp(`\\b${prefix}\\b(\\.)?`, 'g');
    result = result.replace(regex, (match, dot) => {
      return dot ? replacement + '.' : replacement;
    });
  }

  // Transform simple identifiers to pdict.X if they look like pipeline variables
  // We need to be careful not to transform things that are already qualified (x.y)
  // Use a more targeted regex that looks for standalone identifiers
  const skipNames = new Set([
    // JavaScript keywords
    'true',
    'false',
    'null',
    'undefined',
    'typeof',
    'instanceof',
    'new',
    'var',
    'let',
    'const',
    'if',
    'else',
    'for',
    'while',
    'return',
    'function',
    'this',
    'throw',
    'try',
    'catch',
    'finally',
    'break',
    'continue',
    'switch',
    'case',
    'default',
    // Already transformed/known globals
    'session',
    'request',
    'customer',
    'response',
    'pdict',
    'action',
    'empty',
    'e',
    // DW API root
    'dw',
  ]);

  // Match capitalized identifiers that are NOT preceded by a dot (not property access)
  // and NOT followed by a dot or open paren (not a namespace or function call)
  result = result.replace(/(?<![.\w])([A-Z][a-zA-Z0-9_]*)(?!\s*[.(])/g, (match, name, offset) => {
    // Skip our placeholder tokens
    if (name.startsWith('___') && name.endsWith('___')) {
      return match;
    }
    // Skip if it's in the skip list (exact match, case-sensitive)
    if (skipNames.has(name)) {
      return match;
    }
    // Check if this is followed by a dot (meaning it's a namespace/object, not a simple var)
    const afterMatch = result.substring(offset + match.length);
    if (afterMatch.startsWith('.')) {
      return match; // It's like Customer.profile - keep as-is for now
    }
    // This looks like a simple variable reference - prefix with pdict.
    return `pdict.${name}`;
  });

  // Restore keywords
  result = result.replace(/___TRUE___/g, 'true');
  result = result.replace(/___FALSE___/g, 'false');
  result = result.replace(/___NULL___/g, 'null');
  result = result.replace(/___EMPTY___/g, 'empty');

  return result;
}

/**
 * Transforms a pipeline variable reference to JavaScript.
 */
function transformVariable(varRef: string): string {
  if (!varRef) return varRef;

  // Apply known mappings
  for (const [prefix, replacement] of Object.entries(VARIABLE_MAPPINGS)) {
    if (varRef === prefix) {
      return replacement;
    }
    if (varRef.startsWith(prefix + '.')) {
      return replacement + varRef.substring(prefix.length);
    }
  }

  // Check if it's a simple variable (should be in pdict)
  if (!varRef.includes('.') && !varRef.startsWith('dw.')) {
    return `pdict.${varRef}`;
  }

  return varRef;
}

/**
 * Converts a script file path from pipeline format to controller format.
 * Example: app_storefront_core:checkout/Script.ds -> app_storefront_core/cartridge/scripts/checkout/Script
 */
function convertScriptPath(scriptFile: string): string {
  const colonIndex = scriptFile.indexOf(':');
  if (colonIndex === -1) {
    return scriptFile.replace(/\.ds$/, '');
  }

  const cartridge = scriptFile.substring(0, colonIndex);
  let path = scriptFile.substring(colonIndex + 1);
  path = path.replace(/\.ds$/, '');

  return `${cartridge}/cartridge/scripts/${path}`;
}

/**
 * Gets a variable name for a require statement.
 */
function getRequireVarName(modulePath: string): string {
  // Extract the last part of the path
  const parts = modulePath.split('/');
  let name = parts[parts.length - 1];

  // Remove extension
  name = name.replace(/\.\w+$/, '');

  // Convert to valid identifier
  name = name.replace(/[^a-zA-Z0-9_]/g, '_');

  // Capitalize first letter for class-like names
  if (modulePath.startsWith('dw/')) {
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  return name;
}

/**
 * Creates indentation string.
 */
function indent(level: number): string {
  return '    '.repeat(level);
}
