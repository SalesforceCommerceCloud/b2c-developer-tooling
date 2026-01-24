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
    // Common pipelets
    case 'Assign':
      return generateAssignPipelet(node, context);
    case 'Script':
      return generateScriptPipelet(node, context);
    case 'Eval':
      return generateEvalPipelet(node, context);

    // Form pipelets
    case 'ClearFormElement':
      return generateClearFormElementPipelet(node, context);
    case 'UpdateFormWithObject':
      return generateUpdateFormWithObjectPipelet(node, context);
    case 'InvalidateFormElement':
      return generateInvalidateFormElementPipelet(node, context);
    case 'SetFormOptions':
      return generateSetFormOptionsPipelet(node, context);
    case 'UpdateObjectWithForm':
      return generateUpdateObjectWithFormPipelet(node, context);
    case 'AcceptForm':
      return generateAcceptFormPipelet(node, context);

    // Product/Catalog pipelets
    case 'GetProduct':
      return generateGetProductPipelet(node, context);
    case 'GetCategory':
      return generateGetCategoryPipelet(node, context);
    case 'UpdateProductOptionSelections':
      return generateUpdateProductOptionSelectionsPipelet(node, context);
    case 'UpdateProductVariationSelections':
      return generateUpdateProductVariationSelectionsPipelet(node, context);

    // Customer pipelets
    case 'GetCustomer':
      return generateGetCustomerPipelet(node, context);
    case 'GetCustomerAddress':
      return generateGetCustomerAddressPipelet(node, context);
    case 'CreateCustomer':
      return generateCreateCustomerPipelet(node, context);
    case 'LoginCustomer':
      return generateLoginCustomerPipelet(node, context);
    case 'LogoutCustomer':
      return generateLogoutCustomerPipelet(node, context);
    case 'CreateCustomerAddress':
      return generateCreateCustomerAddressPipelet(node, context);
    case 'RemoveCustomerAddress':
      return generateRemoveCustomerAddressPipelet(node, context);
    case 'RemoveCustomer':
      return generateRemoveCustomerPipelet(node, context);
    case 'GetCustomerPaymentInstruments':
      return generateGetCustomerPaymentInstrumentsPipelet(node, context);
    case 'CreateCustomerPaymentInstrument':
      return generateCreateCustomerPaymentInstrumentPipelet(node, context);
    case 'RemoveCustomerPaymentInstrument':
      return generateRemoveCustomerPaymentInstrumentPipelet(node, context);
    case 'SetCustomerPassword':
      return generateSetCustomerPasswordPipelet(node, context);
    case 'GenerateResetPasswordToken':
      return generateGenerateResetPasswordTokenPipelet(node, context);
    case 'ResetCustomerPassword':
    case 'ResetCustomerPasswordWithToken':
      return generateResetCustomerPasswordPipelet(node, context);
    case 'ValidateResetPasswordToken':
      return generateValidateResetPasswordTokenPipelet(node, context);

    // Basket pipelets
    case 'GetBasket':
      return generateGetBasketPipelet(node, context);
    case 'AddProductToBasket':
      return generateAddProductToBasketPipelet(node, context);
    case 'RemoveProductLineItem':
      return generateRemoveProductLineItemPipelet(node, context);
    case 'UpdateProductLineItemQuantity':
      return generateUpdateProductLineItemQuantityPipelet(node, context);
    case 'AddPaymentInstrumentToBasket':
      return generateAddPaymentInstrumentToBasketPipelet(node, context);
    case 'RemoveBasketPaymentInstrument':
      return generateRemoveBasketPaymentInstrumentPipelet(node, context);
    case 'CreateBillingAddress':
      return generateCreateBillingAddressPipelet(node, context);
    case 'CreateShipment':
      return generateCreateShipmentPipelet(node, context);
    case 'CreateShippingAddress':
      return generateCreateShippingAddressPipelet(node, context);
    case 'SetShippingMethod':
      return generateSetShippingMethodPipelet(node, context);
    case 'AddCouponToBasket':
    case 'AddCouponToBasket2':
      return generateAddCouponToBasketPipelet(node, context);
    case 'RemoveCouponLineItem':
      return generateRemoveCouponLineItemPipelet(node, context);

    // Order pipelets
    case 'GetOrder':
      return generateGetOrderPipelet(node, context);
    case 'CreateOrder':
    case 'CreateOrder2':
      return generateCreateOrderPipelet(node, context);
    case 'CreateOrderNo':
      return generateCreateOrderNoPipelet(node, context);
    case 'PlaceOrder':
      return generatePlaceOrderPipelet(node, context);
    case 'FailOrder':
      return generateFailOrderPipelet(node, context);
    case 'CancelOrder':
      return generateCancelOrderPipelet(node, context);

    // Additional basket pipelets
    case 'AddBonusProductToBasket':
      return generateAddBonusProductToBasketPipelet(node, context);
    case 'CreateBasketForOrderEdit':
      return generateCreateBasketForOrderEditPipelet(node, context);
    case 'StartCheckout':
      return generateStartCheckoutPipelet(node, context);
    case 'ReserveInventoryForOrder':
      return generateReserveInventoryForOrderPipelet(node, context);
    case 'ReplaceLineItemProduct':
      return generateReplaceLineItemProductPipelet(node, context);
    case 'VerifyPaymentCard':
      return generateVerifyPaymentCardPipelet(node, context);

    // Payment pipelets
    case 'GetPaymentProcessor':
      return generateGetPaymentProcessorPipelet(node, context);

    // Search pipelets
    case 'Search':
      return generateSearchPipelet(node, context);
    case 'SearchSystemObject':
      return generateSearchSystemObjectPipelet(node, context);
    case 'Paging':
      return generatePagingPipelet(node, context);
    case 'GetSearchSuggestions':
      return generateGetSearchSuggestionsPipelet(node, context);
    case 'SearchRedirectURL':
      return generateSearchRedirectURLPipelet(node, context);

    // Store pipelets
    case 'GetNearestStores':
      return generateGetNearestStoresPipelet(node, context);

    // Content pipelets
    case 'GetContent':
      return generateGetContentPipelet(node, context);

    // ProductList pipelets
    case 'GetProductList':
      return generateGetProductListPipelet(node, context);
    case 'GetProductLists':
      return generateGetProductListsPipelet(node, context);
    case 'CreateProductList':
      return generateCreateProductListPipelet(node, context);
    case 'AddProductToProductList':
      return generateAddProductToProductListPipelet(node, context);
    case 'RemoveProductListItem':
      return generateRemoveProductListItemPipelet(node, context);
    case 'RemoveProductList':
      return generateRemoveProductListPipelet(node, context);
    case 'SearchProductLists':
      return generateSearchProductListsPipelet(node, context);

    // Gift certificate pipelets
    case 'GetGiftCertificate':
      return generateGetGiftCertificatePipelet(node, context);
    case 'CreateGiftCertificate':
      return generateCreateGiftCertificatePipelet(node, context);
    case 'RedeemGiftCertificate':
      return generateRedeemGiftCertificatePipelet(node, context);
    case 'AddGiftCertificateToBasket':
      return generateAddGiftCertificateToBasketPipelet(node, context);
    case 'RemoveGiftCertificateLineItem':
      return generateRemoveGiftCertificateLineItemPipelet(node, context);

    // Mail pipelet
    case 'SendMail':
      return generateSendMailPipelet(node, context);

    // Page metadata pipelet
    case 'UpdatePageMetaData':
      return generateUpdatePageMetaDataPipelet(node, context);

    // CSRF pipelets
    case 'GenerateCSRFToken':
      return generateGenerateCSRFTokenPipelet(node, context);
    case 'ValidateCSRFToken':
      return generateValidateCSRFTokenPipelet(node, context);

    // Locale/Currency pipelets
    case 'SetRequestLocale':
      return generateSetRequestLocalePipelet(node, context);
    case 'SetSessionCurrency':
      return generateSetSessionCurrencyPipelet(node, context);

    // CustomObject pipelets
    case 'CreateCustomObject':
      return generateCreateCustomObjectPipelet(node, context);
    case 'RemoveCustomObject':
      return generateRemoveCustomObjectPipelet(node, context);
    case 'SearchCustomObject':
      return generateSearchCustomObjectPipelet(node, context);

    default:
      // For unknown pipelets, generate a commented placeholder
      lines.push(`${ind}// TODO: Convert pipelet ${node.pipeletName}`);
      for (const kb of node.keyBindings) {
        lines.push(`${ind}//   ${kb.key} = ${kb.value}`);
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

// ============================================================================
// Form Pipelets
// ============================================================================

/**
 * Generates code for ClearFormElement pipelet.
 * Clears a form element's value and validation state.
 */
function generateClearFormElementPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const formElement = node.keyBindings.find((kb) => kb.key === 'FormElement')?.value;
  if (!formElement) {
    return `${ind}// ClearFormElement: missing FormElement parameter`;
  }
  return `${ind}${transformExpression(formElement)}.clearFormElement();`;
}

/**
 * Generates code for UpdateFormWithObject pipelet.
 * Copies values from a business object to a form.
 */
function generateUpdateFormWithObjectPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const form = node.keyBindings.find((kb) => kb.key === 'Form' || kb.key === 'FormGroup')?.value;
  const object = node.keyBindings.find((kb) => kb.key === 'Object')?.value;
  if (!form || !object) {
    return `${ind}// UpdateFormWithObject: missing Form or Object parameter`;
  }
  return `${ind}${transformExpression(form)}.copyFrom(${transformExpression(object)});`;
}

/**
 * Generates code for InvalidateFormElement pipelet.
 * Invalidates a form element (marks it as having an error).
 */
function generateInvalidateFormElementPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const formElement = node.keyBindings.find((kb) => kb.key === 'FormElement')?.value;
  if (!formElement) {
    return `${ind}// InvalidateFormElement: missing FormElement parameter`;
  }
  return `${ind}${transformExpression(formElement)}.invalidateFormElement();`;
}

/**
 * Generates code for SetFormOptions pipelet.
 * Sets options for a form field (dropdown, select, etc).
 */
function generateSetFormOptionsPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const formField = node.keyBindings.find((kb) => kb.key === 'FormField')?.value;
  const options = node.keyBindings.find((kb) => kb.key === 'Iterator' || kb.key === 'Options')?.value;
  if (!formField || !options) {
    return `${ind}// SetFormOptions: missing FormField or Iterator parameter`;
  }
  return `${ind}${transformExpression(formField)}.setOptions(${transformExpression(options)});`;
}

/**
 * Generates code for UpdateObjectWithForm pipelet.
 * Copies values from a form to a business object.
 */
function generateUpdateObjectWithFormPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const form = node.keyBindings.find((kb) => kb.key === 'Form' || kb.key === 'FormGroup')?.value;
  const object = node.keyBindings.find((kb) => kb.key === 'Object')?.value;
  if (!form || !object) {
    return `${ind}// UpdateObjectWithForm: missing Form or Object parameter`;
  }
  return `${ind}${transformExpression(form)}.copyTo(${transformExpression(object)});`;
}

/**
 * Generates code for AcceptForm pipelet.
 * Validates and accepts form submission.
 */
function generateAcceptFormPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const form = node.keyBindings.find((kb) => kb.key === 'Form' || kb.key === 'FormGroup')?.value;
  if (!form) {
    return `${ind}// AcceptForm: missing Form parameter`;
  }
  return `${ind}${transformExpression(form)}.accept();`;
}

// ============================================================================
// Product/Catalog Pipelets
// ============================================================================

/**
 * Generates code for GetProduct pipelet.
 * Retrieves a product by ID.
 */
function generateGetProductPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const productId = node.keyBindings.find((kb) => kb.key === 'ProductID')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Product')?.value;

  if (!productId) {
    return `${ind}// GetProduct: missing ProductID parameter`;
  }

  context.requires.set('ProductMgr', 'dw/catalog/ProductMgr');
  const productExpr = `ProductMgr.getProduct(${transformExpression(productId)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${productExpr};`;
  }
  return `${ind}${productExpr};`;
}

/**
 * Generates code for GetCategory pipelet.
 * Retrieves a category by ID.
 */
function generateGetCategoryPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const categoryId = node.keyBindings.find((kb) => kb.key === 'CategoryID')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Category')?.value;

  if (!categoryId) {
    return `${ind}// GetCategory: missing CategoryID parameter`;
  }

  context.requires.set('CatalogMgr', 'dw/catalog/CatalogMgr');
  const categoryExpr = `CatalogMgr.getCategory(${transformExpression(categoryId)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${categoryExpr};`;
  }
  return `${ind}${categoryExpr};`;
}

/**
 * Generates code for UpdateProductOptionSelections pipelet.
 */
function generateUpdateProductOptionSelectionsPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  const product = node.keyBindings.find((kb) => kb.key === 'Product')?.value;
  const optionModel = node.keyBindings.find((kb) => kb.key === 'ProductOptionModel')?.value;
  const selectedOptions = node.keyBindings.find((kb) => kb.key === 'SelectedOptions')?.value;

  lines.push(`${ind}// UpdateProductOptionSelections`);
  if (optionModel && selectedOptions) {
    lines.push(
      `${ind}${transformExpression(optionModel)}.setSelectedOptionValue(${transformExpression(selectedOptions)});`,
    );
  } else if (product) {
    lines.push(`${ind}// Update product option selections for ${product}`);
    lines.push(`${ind}// See dw.catalog.ProductOptionModel for API details`);
  }

  return lines.join('\n');
}

/**
 * Generates code for UpdateProductVariationSelections pipelet.
 */
function generateUpdateProductVariationSelectionsPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  const product = node.keyBindings.find((kb) => kb.key === 'Product')?.value;
  const variationModel = node.keyBindings.find((kb) => kb.key === 'ProductVariationModel')?.value;

  lines.push(`${ind}// UpdateProductVariationSelections`);
  if (variationModel) {
    lines.push(`${ind}// See dw.catalog.ProductVariationModel for API details`);
  } else if (product) {
    lines.push(`${ind}// Update product variation selections for ${product}`);
  }

  return lines.join('\n');
}

// ============================================================================
// Customer Pipelets
// ============================================================================

/**
 * Generates code for GetCustomer pipelet.
 * Retrieves a customer by login.
 */
function generateGetCustomerPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const login = node.keyBindings.find((kb) => kb.key === 'Login')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Customer')?.value;

  if (!login) {
    return `${ind}// GetCustomer: missing Login parameter`;
  }

  context.requires.set('CustomerMgr', 'dw/customer/CustomerMgr');
  const customerExpr = `CustomerMgr.getCustomerByLogin(${transformExpression(login)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${customerExpr};`;
  }
  return `${ind}${customerExpr};`;
}

/**
 * Generates code for GetCustomerAddress pipelet.
 * Retrieves a customer address by ID.
 */
function generateGetCustomerAddressPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const addressId = node.keyBindings.find((kb) => kb.key === 'AddressID')?.value;
  const customer = node.keyBindings.find((kb) => kb.key === 'Customer')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Address')?.value;

  if (!addressId) {
    return `${ind}// GetCustomerAddress: missing AddressID parameter`;
  }

  const customerRef = customer ? transformExpression(customer) : 'customer';
  const addressExpr = `${customerRef}.addressBook.getAddress(${transformExpression(addressId)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${addressExpr};`;
  }
  return `${ind}${addressExpr};`;
}

/**
 * Generates code for CreateCustomer pipelet.
 */
function generateCreateCustomerPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const login = node.keyBindings.find((kb) => kb.key === 'Login')?.value;
  const password = node.keyBindings.find((kb) => kb.key === 'Password')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Customer')?.value;

  if (!login || !password) {
    return `${ind}// CreateCustomer: missing Login or Password parameter`;
  }

  context.requires.set('CustomerMgr', 'dw/customer/CustomerMgr');
  const customerExpr = `CustomerMgr.createCustomer(${transformExpression(login)}, ${transformExpression(password)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${customerExpr};`;
  }
  return `${ind}${customerExpr};`;
}

/**
 * Generates code for LoginCustomer pipelet.
 */
function generateLoginCustomerPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const login = node.keyBindings.find((kb) => kb.key === 'Login' || kb.key === 'AuthenticationProviderID')?.value;
  const password = node.keyBindings.find((kb) => kb.key === 'Password')?.value;
  const rememberMe = node.keyBindings.find((kb) => kb.key === 'RememberMe')?.value;

  context.requires.set('CustomerMgr', 'dw/customer/CustomerMgr');

  if (login && password) {
    const rememberMeArg = rememberMe ? `, ${transformExpression(rememberMe)}` : '';
    return `${ind}CustomerMgr.loginCustomer(${transformExpression(login)}, ${transformExpression(password)}${rememberMeArg});`;
  }

  return `${ind}// LoginCustomer: missing Login or Password parameter`;
}

/**
 * Generates code for LogoutCustomer pipelet.
 */
function generateLogoutCustomerPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  context.requires.set('CustomerMgr', 'dw/customer/CustomerMgr');
  return `${ind}CustomerMgr.logoutCustomer(false);`;
}

/**
 * Generates code for CreateCustomerAddress pipelet.
 */
function generateCreateCustomerAddressPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const addressId = node.keyBindings.find((kb) => kb.key === 'AddressID')?.value;
  const customer = node.keyBindings.find((kb) => kb.key === 'Customer')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Address')?.value;

  if (!addressId) {
    return `${ind}// CreateCustomerAddress: missing AddressID parameter`;
  }

  const customerRef = customer ? transformExpression(customer) : 'customer';
  const addressExpr = `${customerRef}.addressBook.createAddress(${transformExpression(addressId)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${addressExpr};`;
  }
  return `${ind}${addressExpr};`;
}

/**
 * Generates code for RemoveCustomerAddress pipelet.
 */
function generateRemoveCustomerAddressPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const address = node.keyBindings.find((kb) => kb.key === 'Address')?.value;
  const customer = node.keyBindings.find((kb) => kb.key === 'Customer')?.value;

  if (!address) {
    return `${ind}// RemoveCustomerAddress: missing Address parameter`;
  }

  const customerRef = customer ? transformExpression(customer) : 'customer';
  return `${ind}${customerRef}.addressBook.removeAddress(${transformExpression(address)});`;
}

/**
 * Generates code for RemoveCustomer pipelet.
 */
function generateRemoveCustomerPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const customer = node.keyBindings.find((kb) => kb.key === 'Customer')?.value;

  if (!customer) {
    return `${ind}// RemoveCustomer: missing Customer parameter`;
  }

  context.requires.set('CustomerMgr', 'dw/customer/CustomerMgr');
  return `${ind}CustomerMgr.removeCustomer(${transformExpression(customer)});`;
}

/**
 * Generates code for GetCustomerPaymentInstruments pipelet.
 */
function generateGetCustomerPaymentInstrumentsPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const customer = node.keyBindings.find((kb) => kb.key === 'Customer')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'PaymentInstruments')?.value;

  const customerRef = customer ? transformExpression(customer) : 'customer';
  const piExpr = `${customerRef}.profile.wallet.getPaymentInstruments()`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${piExpr};`;
  }
  return `${ind}${piExpr};`;
}

/**
 * Generates code for CreateCustomerPaymentInstrument pipelet.
 */
function generateCreateCustomerPaymentInstrumentPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const customer = node.keyBindings.find((kb) => kb.key === 'Customer')?.value;
  const methodId = node.keyBindings.find((kb) => kb.key === 'PaymentMethodID')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'PaymentInstrument')?.value;

  if (!methodId) {
    return `${ind}// CreateCustomerPaymentInstrument: missing PaymentMethodID parameter`;
  }

  const customerRef = customer ? transformExpression(customer) : 'customer';
  const piExpr = `${customerRef}.profile.wallet.createPaymentInstrument(${transformExpression(methodId)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${piExpr};`;
  }
  return `${ind}${piExpr};`;
}

/**
 * Generates code for RemoveCustomerPaymentInstrument pipelet.
 */
function generateRemoveCustomerPaymentInstrumentPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const customer = node.keyBindings.find((kb) => kb.key === 'Customer')?.value;
  const pi = node.keyBindings.find((kb) => kb.key === 'PaymentInstrument')?.value;

  if (!pi) {
    return `${ind}// RemoveCustomerPaymentInstrument: missing PaymentInstrument parameter`;
  }

  const customerRef = customer ? transformExpression(customer) : 'customer';
  return `${ind}${customerRef}.profile.wallet.removePaymentInstrument(${transformExpression(pi)});`;
}

/**
 * Generates code for SetCustomerPassword pipelet.
 */
function generateSetCustomerPasswordPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const customer = node.keyBindings.find((kb) => kb.key === 'Customer')?.value;
  const password = node.keyBindings.find((kb) => kb.key === 'Password')?.value;

  if (!password) {
    return `${ind}// SetCustomerPassword: missing Password parameter`;
  }

  const customerRef = customer ? transformExpression(customer) : 'customer';
  return `${ind}${customerRef}.profile.credentials.setPassword(${transformExpression(password)});`;
}

/**
 * Generates code for GenerateResetPasswordToken pipelet.
 */
function generateGenerateResetPasswordTokenPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const customer = node.keyBindings.find((kb) => kb.key === 'Customer')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Token')?.value;

  if (!customer) {
    return `${ind}// GenerateResetPasswordToken: missing Customer parameter`;
  }

  const tokenExpr = `${transformExpression(customer)}.profile.credentials.createResetPasswordToken()`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${tokenExpr};`;
  }
  return `${ind}${tokenExpr};`;
}

/**
 * Generates code for ResetCustomerPassword pipelet.
 */
function generateResetCustomerPasswordPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const customer = node.keyBindings.find((kb) => kb.key === 'Customer')?.value;
  const password = node.keyBindings.find((kb) => kb.key === 'Password')?.value;
  const token = node.keyBindings.find((kb) => kb.key === 'Token')?.value;

  if (!password || !token) {
    return `${ind}// ResetCustomerPassword: missing Password or Token parameter`;
  }

  const customerRef = customer ? transformExpression(customer) : 'customer';
  return `${ind}${customerRef}.profile.credentials.setPasswordWithToken(${transformExpression(password)}, ${transformExpression(token)});`;
}

/**
 * Generates code for ValidateResetPasswordToken pipelet.
 */
function generateValidateResetPasswordTokenPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const token = node.keyBindings.find((kb) => kb.key === 'Token')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Customer')?.value;

  if (!token) {
    return `${ind}// ValidateResetPasswordToken: missing Token parameter`;
  }

  context.requires.set('CustomerMgr', 'dw/customer/CustomerMgr');
  const customerExpr = `CustomerMgr.getCustomerByToken(${transformExpression(token)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${customerExpr};`;
  }
  return `${ind}${customerExpr};`;
}

// ============================================================================
// Basket Pipelets
// ============================================================================

/**
 * Generates code for GetBasket pipelet.
 * Gets the current shopping basket.
 */
function generateGetBasketPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Basket')?.value;
  const createIfAbsent = node.configProperties.find((p) => p.key === 'CreateBasket')?.value === 'true';

  context.requires.set('BasketMgr', 'dw/order/BasketMgr');

  const basketMethod = createIfAbsent ? 'getCurrentOrNewBasket()' : 'getCurrentBasket()';

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = BasketMgr.${basketMethod};`;
  }
  return `${ind}BasketMgr.${basketMethod};`;
}

/**
 * Generates code for AddProductToBasket pipelet.
 */
function generateAddProductToBasketPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  const basket = node.keyBindings.find((kb) => kb.key === 'Basket')?.value;
  const product = node.keyBindings.find((kb) => kb.key === 'Product' || kb.key === 'ProductID')?.value;
  const quantity = node.keyBindings.find((kb) => kb.key === 'Quantity')?.value;
  const shipment = node.keyBindings.find((kb) => kb.key === 'Shipment')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'ProductLineItem')?.value;

  if (!basket || !product) {
    return `${ind}// AddProductToBasket: missing Basket or Product parameter`;
  }

  const basketRef = transformExpression(basket);
  const productRef = transformExpression(product);
  const shipmentRef = shipment ? transformExpression(shipment) : `${basketRef}.defaultShipment`;
  const quantityVal = quantity ? transformExpression(quantity) : '1';

  const pliExpr = `${basketRef}.createProductLineItem(${productRef}, ${shipmentRef})`;

  if (outputVar) {
    lines.push(`${ind}${transformVariable(outputVar)} = ${pliExpr};`);
    lines.push(`${ind}${transformVariable(outputVar)}.setQuantityValue(${quantityVal});`);
  } else {
    lines.push(`${ind}var pli = ${pliExpr};`);
    lines.push(`${ind}pli.setQuantityValue(${quantityVal});`);
  }

  return lines.join('\n');
}

/**
 * Generates code for RemoveProductLineItem pipelet.
 */
function generateRemoveProductLineItemPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const pli = node.keyBindings.find((kb) => kb.key === 'ProductLineItem')?.value;

  if (!basket || !pli) {
    return `${ind}// RemoveProductLineItem: missing Basket or ProductLineItem parameter`;
  }

  return `${ind}${transformExpression(basket)}.removeProductLineItem(${transformExpression(pli)});`;
}

/**
 * Generates code for UpdateProductLineItemQuantity pipelet.
 */
function generateUpdateProductLineItemQuantityPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const pli = node.keyBindings.find((kb) => kb.key === 'ProductLineItem')?.value;
  const quantity = node.keyBindings.find((kb) => kb.key === 'Quantity')?.value;

  if (!pli || !quantity) {
    return `${ind}// UpdateProductLineItemQuantity: missing ProductLineItem or Quantity parameter`;
  }

  return `${ind}${transformExpression(pli)}.setQuantityValue(${transformExpression(quantity)});`;
}

/**
 * Generates code for AddPaymentInstrumentToBasket pipelet.
 */
function generateAddPaymentInstrumentToBasketPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const methodId = node.keyBindings.find((kb) => kb.key === 'PaymentMethodID')?.value;
  const amount = node.keyBindings.find((kb) => kb.key === 'Amount')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'PaymentInstrument')?.value;

  if (!basket || !methodId) {
    return `${ind}// AddPaymentInstrumentToBasket: missing Basket or PaymentMethodID parameter`;
  }

  const basketRef = transformExpression(basket);
  const amountArg = amount ? `, ${transformExpression(amount)}` : '';
  const piExpr = `${basketRef}.createPaymentInstrument(${transformExpression(methodId)}${amountArg})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${piExpr};`;
  }
  return `${ind}${piExpr};`;
}

/**
 * Generates code for RemoveBasketPaymentInstrument pipelet.
 */
function generateRemoveBasketPaymentInstrumentPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const pi = node.keyBindings.find((kb) => kb.key === 'PaymentInstrument')?.value;

  if (!basket || !pi) {
    return `${ind}// RemoveBasketPaymentInstrument: missing Basket or PaymentInstrument parameter`;
  }

  return `${ind}${transformExpression(basket)}.removePaymentInstrument(${transformExpression(pi)});`;
}

/**
 * Generates code for CreateBillingAddress pipelet.
 */
function generateCreateBillingAddressPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'BillingAddress' || kb.key === 'Address')?.value;

  if (!basket) {
    return `${ind}// CreateBillingAddress: missing Basket parameter`;
  }

  const addressExpr = `${transformExpression(basket)}.createBillingAddress()`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${addressExpr};`;
  }
  return `${ind}${addressExpr};`;
}

/**
 * Generates code for CreateShipment pipelet.
 */
function generateCreateShipmentPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const shipmentId = node.keyBindings.find((kb) => kb.key === 'ShipmentID')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Shipment')?.value;

  if (!basket) {
    return `${ind}// CreateShipment: missing Basket parameter`;
  }

  const shipmentIdArg = shipmentId ? transformExpression(shipmentId) : 'null';
  const shipmentExpr = `${transformExpression(basket)}.createShipment(${shipmentIdArg})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${shipmentExpr};`;
  }
  return `${ind}${shipmentExpr};`;
}

/**
 * Generates code for CreateShippingAddress pipelet.
 */
function generateCreateShippingAddressPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const shipment = node.keyBindings.find((kb) => kb.key === 'Shipment')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'ShippingAddress' || kb.key === 'Address')?.value;

  if (!shipment) {
    return `${ind}// CreateShippingAddress: missing Shipment parameter`;
  }

  const addressExpr = `${transformExpression(shipment)}.createShippingAddress()`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${addressExpr};`;
  }
  return `${ind}${addressExpr};`;
}

/**
 * Generates code for SetShippingMethod pipelet.
 */
function generateSetShippingMethodPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const shipment = node.keyBindings.find((kb) => kb.key === 'Shipment')?.value;
  const shippingMethod = node.keyBindings.find((kb) => kb.key === 'ShippingMethod')?.value;

  if (!shipment || !shippingMethod) {
    return `${ind}// SetShippingMethod: missing Shipment or ShippingMethod parameter`;
  }

  return `${ind}${transformExpression(shipment)}.setShippingMethod(${transformExpression(shippingMethod)});`;
}

/**
 * Generates code for AddCouponToBasket pipelet.
 */
function generateAddCouponToBasketPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const couponCode = node.keyBindings.find((kb) => kb.key === 'CouponCode')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'CouponLineItem')?.value;

  if (!basket || !couponCode) {
    return `${ind}// AddCouponToBasket: missing Basket or CouponCode parameter`;
  }

  const couponExpr = `${transformExpression(basket)}.createCouponLineItem(${transformExpression(couponCode)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${couponExpr};`;
  }
  return `${ind}${couponExpr};`;
}

/**
 * Generates code for RemoveCouponLineItem pipelet.
 */
function generateRemoveCouponLineItemPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const couponLineItem = node.keyBindings.find((kb) => kb.key === 'CouponLineItem')?.value;

  if (!basket || !couponLineItem) {
    return `${ind}// RemoveCouponLineItem: missing Basket or CouponLineItem parameter`;
  }

  return `${ind}${transformExpression(basket)}.removeCouponLineItem(${transformExpression(couponLineItem)});`;
}

/**
 * Generates code for AddBonusProductToBasket pipelet.
 */
function generateAddBonusProductToBasketPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const bonusDiscountLineItem = node.keyBindings.find((kb) => kb.key === 'BonusDiscountLineItem')?.value;
  const product = node.keyBindings.find((kb) => kb.key === 'Product')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'ProductLineItem')?.value;

  if (!basket || !bonusDiscountLineItem || !product) {
    return `${ind}// AddBonusProductToBasket: missing required parameters`;
  }

  const pliExpr = `${transformExpression(basket)}.createBonusProductLineItem(${transformExpression(bonusDiscountLineItem)}, ${transformExpression(product)}, null)`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${pliExpr};`;
  }
  return `${ind}${pliExpr};`;
}

/**
 * Generates code for CreateBasketForOrderEdit pipelet.
 */
function generateCreateBasketForOrderEditPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const order = node.keyBindings.find((kb) => kb.key === 'Order')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Basket')?.value;

  if (!order) {
    return `${ind}// CreateBasketForOrderEdit: missing Order parameter`;
  }

  context.requires.set('BasketMgr', 'dw/order/BasketMgr');
  const basketExpr = `BasketMgr.createBasketFromOrder(${transformExpression(order)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${basketExpr};`;
  }
  return `${ind}${basketExpr};`;
}

/**
 * Generates code for StartCheckout pipelet.
 */
function generateStartCheckoutPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket')?.value;

  if (!basket) {
    return `${ind}// StartCheckout: missing Basket parameter`;
  }

  return `${ind}${transformExpression(basket)}.startCheckout();`;
}

/**
 * Generates code for ReserveInventoryForOrder pipelet.
 */
function generateReserveInventoryForOrderPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket')?.value;

  if (!basket) {
    return `${ind}// ReserveInventoryForOrder: missing Basket parameter`;
  }

  return `${ind}${transformExpression(basket)}.reserveInventory();`;
}

/**
 * Generates code for ReplaceLineItemProduct pipelet.
 */
function generateReplaceLineItemProductPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const pli = node.keyBindings.find((kb) => kb.key === 'ProductLineItem')?.value;
  const product = node.keyBindings.find((kb) => kb.key === 'Product')?.value;

  if (!pli || !product) {
    return `${ind}// ReplaceLineItemProduct: missing ProductLineItem or Product parameter`;
  }

  return `${ind}${transformExpression(pli)}.replaceProduct(${transformExpression(product)});`;
}

/**
 * Generates code for VerifyPaymentCard pipelet.
 */
function generateVerifyPaymentCardPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const paymentCard = node.keyBindings.find((kb) => kb.key === 'PaymentCard')?.value;
  const cardNumber = node.keyBindings.find((kb) => kb.key === 'CardNumber')?.value;

  if (!paymentCard) {
    return `${ind}// VerifyPaymentCard: missing PaymentCard parameter`;
  }

  if (cardNumber) {
    return `${ind}${transformExpression(paymentCard)}.verify(${transformExpression(cardNumber)});`;
  }
  return `${ind}${transformExpression(paymentCard)}.verify();`;
}

// ============================================================================
// Order Pipelets
// ============================================================================

/**
 * Generates code for GetOrder pipelet.
 */
function generateGetOrderPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const orderNo = node.keyBindings.find((kb) => kb.key === 'OrderNo')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Order')?.value;

  if (!orderNo) {
    return `${ind}// GetOrder: missing OrderNo parameter`;
  }

  context.requires.set('OrderMgr', 'dw/order/OrderMgr');
  const orderExpr = `OrderMgr.getOrder(${transformExpression(orderNo)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${orderExpr};`;
  }
  return `${ind}${orderExpr};`;
}

/**
 * Generates code for CreateOrder pipelet.
 */
function generateCreateOrderPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket')?.value;
  const orderNo = node.keyBindings.find((kb) => kb.key === 'OrderNo')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Order')?.value;

  if (!basket) {
    return `${ind}// CreateOrder: missing Basket parameter`;
  }

  context.requires.set('OrderMgr', 'dw/order/OrderMgr');
  const orderNoArg = orderNo ? `, ${transformExpression(orderNo)}` : '';
  const orderExpr = `OrderMgr.createOrder(${transformExpression(basket)}${orderNoArg})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${orderExpr};`;
  }
  return `${ind}${orderExpr};`;
}

/**
 * Generates code for PlaceOrder pipelet.
 */
function generatePlaceOrderPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const order = node.keyBindings.find((kb) => kb.key === 'Order')?.value;

  if (!order) {
    return `${ind}// PlaceOrder: missing Order parameter`;
  }

  context.requires.set('OrderMgr', 'dw/order/OrderMgr');
  return `${ind}OrderMgr.placeOrder(${transformExpression(order)});`;
}

/**
 * Generates code for FailOrder pipelet.
 */
function generateFailOrderPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const order = node.keyBindings.find((kb) => kb.key === 'Order')?.value;

  if (!order) {
    return `${ind}// FailOrder: missing Order parameter`;
  }

  context.requires.set('OrderMgr', 'dw/order/OrderMgr');
  return `${ind}OrderMgr.failOrder(${transformExpression(order)});`;
}

/**
 * Generates code for CancelOrder pipelet.
 */
function generateCancelOrderPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const order = node.keyBindings.find((kb) => kb.key === 'Order')?.value;

  if (!order) {
    return `${ind}// CancelOrder: missing Order parameter`;
  }

  context.requires.set('OrderMgr', 'dw/order/OrderMgr');
  return `${ind}OrderMgr.cancelOrder(${transformExpression(order)});`;
}

/**
 * Generates code for CreateOrderNo pipelet.
 */
function generateCreateOrderNoPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const outputVar = node.keyBindings.find((kb) => kb.key === 'OrderNo')?.value;

  context.requires.set('OrderMgr', 'dw/order/OrderMgr');
  const orderNoExpr = 'OrderMgr.createOrderNo()';

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${orderNoExpr};`;
  }
  return `${ind}${orderNoExpr};`;
}

// ============================================================================
// Gift Certificate Pipelets
// ============================================================================

/**
 * Generates code for GetGiftCertificate pipelet.
 */
function generateGetGiftCertificatePipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const gcCode = node.keyBindings.find((kb) => kb.key === 'GiftCertificateCode' || kb.key === 'Code')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'GiftCertificate')?.value;

  if (!gcCode) {
    return `${ind}// GetGiftCertificate: missing GiftCertificateCode parameter`;
  }

  context.requires.set('GiftCertificateMgr', 'dw/order/GiftCertificateMgr');
  const gcExpr = `GiftCertificateMgr.getGiftCertificate(${transformExpression(gcCode)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${gcExpr};`;
  }
  return `${ind}${gcExpr};`;
}

/**
 * Generates code for CreateGiftCertificate pipelet.
 */
function generateCreateGiftCertificatePipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  const amount = node.keyBindings.find((kb) => kb.key === 'Amount')?.value;
  const recipientEmail = node.keyBindings.find((kb) => kb.key === 'RecipientEmail')?.value;
  const recipientName = node.keyBindings.find((kb) => kb.key === 'RecipientName')?.value;
  const senderName = node.keyBindings.find((kb) => kb.key === 'SenderName')?.value;
  const message = node.keyBindings.find((kb) => kb.key === 'Message')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'GiftCertificate')?.value;

  if (!amount) {
    return `${ind}// CreateGiftCertificate: missing Amount parameter`;
  }

  context.requires.set('GiftCertificateMgr', 'dw/order/GiftCertificateMgr');

  const gcVar = outputVar ? transformVariable(outputVar) : 'pdict.giftCertificate';
  lines.push(`${ind}${gcVar} = GiftCertificateMgr.createGiftCertificate(${transformExpression(amount)});`);

  if (recipientEmail) {
    lines.push(`${ind}${gcVar}.setRecipientEmail(${transformExpression(recipientEmail)});`);
  }
  if (recipientName) {
    lines.push(`${ind}${gcVar}.setRecipientName(${transformExpression(recipientName)});`);
  }
  if (senderName) {
    lines.push(`${ind}${gcVar}.setSenderName(${transformExpression(senderName)});`);
  }
  if (message) {
    lines.push(`${ind}${gcVar}.setMessage(${transformExpression(message)});`);
  }

  return lines.join('\n');
}

/**
 * Generates code for RedeemGiftCertificate pipelet.
 */
function generateRedeemGiftCertificatePipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const gc = node.keyBindings.find((kb) => kb.key === 'GiftCertificate')?.value;
  const amount = node.keyBindings.find((kb) => kb.key === 'Amount')?.value;
  const order = node.keyBindings.find((kb) => kb.key === 'Order')?.value;

  if (!gc || !amount) {
    return `${ind}// RedeemGiftCertificate: missing GiftCertificate or Amount parameter`;
  }

  context.requires.set('GiftCertificateMgr', 'dw/order/GiftCertificateMgr');
  const orderArg = order ? `, ${transformExpression(order)}` : '';
  return `${ind}GiftCertificateMgr.redeemGiftCertificate(${transformExpression(gc)}, ${transformExpression(amount)}${orderArg});`;
}

/**
 * Generates code for AddGiftCertificateToBasket pipelet.
 */
function generateAddGiftCertificateToBasketPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const amount = node.keyBindings.find((kb) => kb.key === 'Amount')?.value;
  const recipientEmail = node.keyBindings.find((kb) => kb.key === 'RecipientEmail')?.value;
  const recipientName = node.keyBindings.find((kb) => kb.key === 'RecipientName')?.value;
  const senderName = node.keyBindings.find((kb) => kb.key === 'SenderName')?.value;
  const message = node.keyBindings.find((kb) => kb.key === 'Message')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'GiftCertificateLineItem')?.value;

  if (!basket || !amount) {
    return `${ind}// AddGiftCertificateToBasket: missing Basket or Amount parameter`;
  }

  const gcliVar = outputVar ? transformVariable(outputVar) : 'pdict.gcLineItem';
  lines.push(
    `${ind}${gcliVar} = ${transformExpression(basket)}.createGiftCertificateLineItem(${transformExpression(amount)});`,
  );

  if (recipientName) {
    lines.push(`${ind}${gcliVar}.setRecipientName(${transformExpression(recipientName)});`);
  }
  if (senderName) {
    lines.push(`${ind}${gcliVar}.setSenderName(${transformExpression(senderName)});`);
  }
  if (recipientEmail) {
    lines.push(`${ind}${gcliVar}.setRecipientEmail(${transformExpression(recipientEmail)});`);
  }
  if (message) {
    lines.push(`${ind}${gcliVar}.setMessage(${transformExpression(message)});`);
  }

  return lines.join('\n');
}

/**
 * Generates code for RemoveGiftCertificateLineItem pipelet.
 */
function generateRemoveGiftCertificateLineItemPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const basket = node.keyBindings.find((kb) => kb.key === 'Basket' || kb.key === 'LineItemCtnr')?.value;
  const gcli = node.keyBindings.find((kb) => kb.key === 'GiftCertificateLineItem')?.value;

  if (!basket || !gcli) {
    return `${ind}// RemoveGiftCertificateLineItem: missing Basket or GiftCertificateLineItem parameter`;
  }

  return `${ind}${transformExpression(basket)}.removeGiftCertificateLineItem(${transformExpression(gcli)});`;
}

// ============================================================================
// Payment Pipelets
// ============================================================================

/**
 * Generates code for GetPaymentProcessor pipelet.
 */
function generateGetPaymentProcessorPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const paymentMethod = node.keyBindings.find((kb) => kb.key === 'PaymentMethod')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'PaymentProcessor')?.value;

  if (!paymentMethod) {
    return `${ind}// GetPaymentProcessor: missing PaymentMethod parameter`;
  }

  const processorExpr = `${transformExpression(paymentMethod)}.getPaymentProcessor()`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${processorExpr};`;
  }
  return `${ind}${processorExpr};`;
}

// ============================================================================
// Search Pipelets
// ============================================================================

/**
 * Generates code for Search pipelet (ProductSearchModel).
 */
function generateSearchPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  context.requires.set('ProductSearchModel', 'dw/catalog/ProductSearchModel');

  const searchPhrase = node.keyBindings.find((kb) => kb.key === 'SearchPhrase')?.value;
  const categoryId = node.keyBindings.find((kb) => kb.key === 'CategoryID')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'ProductSearchResult' || kb.key === 'SearchResult')?.value;

  const searchModelVar = outputVar ? transformVariable(outputVar) : 'pdict.productSearchModel';

  lines.push(`${ind}${searchModelVar} = new ProductSearchModel();`);

  if (categoryId) {
    lines.push(`${ind}${searchModelVar}.setCategoryID(${transformExpression(categoryId)});`);
  }
  if (searchPhrase) {
    lines.push(`${ind}${searchModelVar}.setSearchPhrase(${transformExpression(searchPhrase)});`);
  }

  lines.push(`${ind}${searchModelVar}.search();`);

  return lines.join('\n');
}

/**
 * Generates code for SearchSystemObject pipelet.
 */
function generateSearchSystemObjectPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  const objectType = node.keyBindings.find((kb) => kb.key === 'ObjectType')?.value;
  const queryString = node.keyBindings.find((kb) => kb.key === 'QueryString' || kb.key === 'Query')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'SearchResult' || kb.key === 'Result')?.value;

  lines.push(`${ind}// SearchSystemObject: ${objectType || 'unknown type'}`);

  if (queryString) {
    lines.push(`${ind}// Query: ${queryString}`);
  }

  // Add appropriate manager based on object type
  if (objectType) {
    const typeStr = objectType.replace(/"/g, '');
    if (typeStr === 'Order') {
      context.requires.set('OrderMgr', 'dw/order/OrderMgr');
      if (outputVar && queryString) {
        lines.push(
          `${ind}${transformVariable(outputVar)} = OrderMgr.searchOrders(${transformExpression(queryString)}, null);`,
        );
      }
    } else if (typeStr === 'Customer') {
      context.requires.set('CustomerMgr', 'dw/customer/CustomerMgr');
      if (outputVar && queryString) {
        lines.push(
          `${ind}${transformVariable(outputVar)} = CustomerMgr.searchProfiles(${transformExpression(queryString)}, null);`,
        );
      }
    } else if (typeStr === 'GiftCertificate') {
      context.requires.set('GiftCertificateMgr', 'dw/order/GiftCertificateMgr');
      if (outputVar && queryString) {
        lines.push(
          `${ind}${transformVariable(outputVar)} = GiftCertificateMgr.queryGiftCertificates(${transformExpression(queryString)});`,
        );
      }
    } else {
      lines.push(`${ind}// Use appropriate *Mgr.query* or *Mgr.search* method`);
    }
  }

  return lines.join('\n');
}

/**
 * Generates code for Paging pipelet.
 */
function generatePagingPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  context.requires.set('PagingModel', 'dw/web/PagingModel');

  const iterator = node.keyBindings.find((kb) => kb.key === 'Iterator' || kb.key === 'SearchResult')?.value;
  const pageSize = node.keyBindings.find((kb) => kb.key === 'PageSize')?.value;
  const start = node.keyBindings.find((kb) => kb.key === 'Start')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'PagingModel')?.value;

  const pagingModelVar = outputVar ? transformVariable(outputVar) : 'pdict.pagingModel';

  if (iterator) {
    lines.push(`${ind}${pagingModelVar} = new PagingModel(${transformExpression(iterator)});`);
  } else {
    lines.push(`${ind}${pagingModelVar} = new PagingModel();`);
  }

  if (pageSize) {
    lines.push(`${ind}${pagingModelVar}.setPageSize(${transformExpression(pageSize)});`);
  }
  if (start) {
    lines.push(`${ind}${pagingModelVar}.setStart(${transformExpression(start)});`);
  }

  return lines.join('\n');
}

/**
 * Generates code for GetSearchSuggestions pipelet.
 */
function generateGetSearchSuggestionsPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  context.requires.set('SuggestModel', 'dw/suggest/SuggestModel');

  const searchPhrase = node.keyBindings.find((kb) => kb.key === 'SearchPhrase')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Suggestions' || kb.key === 'SuggestModel')?.value;

  const suggestModelVar = outputVar ? transformVariable(outputVar) : 'pdict.suggestModel';

  lines.push(`${ind}${suggestModelVar} = new SuggestModel();`);
  if (searchPhrase) {
    lines.push(`${ind}${suggestModelVar}.setSearchPhrase(${transformExpression(searchPhrase)});`);
  }

  return lines.join('\n');
}

/**
 * Generates code for SearchRedirectURL pipelet.
 */
function generateSearchRedirectURLPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const searchModel = node.keyBindings.find((kb) => kb.key === 'SearchModel' || kb.key === 'ProductSearchModel')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'RedirectURL' || kb.key === 'URL')?.value;

  if (!searchModel) {
    return `${ind}// SearchRedirectURL: missing SearchModel parameter`;
  }

  const urlExpr = `${transformExpression(searchModel)}.getRedirectURL()`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${urlExpr};`;
  }
  return `${ind}${urlExpr};`;
}

/**
 * Generates code for GetNearestStores pipelet.
 */
function generateGetNearestStoresPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  context.requires.set('StoreMgr', 'dw/catalog/StoreMgr');

  const latitude = node.keyBindings.find((kb) => kb.key === 'Latitude')?.value;
  const longitude = node.keyBindings.find((kb) => kb.key === 'Longitude')?.value;
  const postalCode = node.keyBindings.find((kb) => kb.key === 'PostalCode')?.value;
  const countryCode = node.keyBindings.find((kb) => kb.key === 'CountryCode')?.value;
  const radius = node.keyBindings.find((kb) => kb.key === 'Radius' || kb.key === 'DistanceUnit')?.value;
  const maxCount = node.keyBindings.find((kb) => kb.key === 'MaxCount')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Stores')?.value;

  const storesVar = outputVar ? transformVariable(outputVar) : 'pdict.stores';

  if (latitude && longitude) {
    const radiusArg = radius ? `, ${transformExpression(radius)}` : '';
    const maxArg = maxCount ? `, ${transformExpression(maxCount)}` : '';
    lines.push(
      `${ind}${storesVar} = StoreMgr.searchStoresByCoordinates(${transformExpression(latitude)}, ${transformExpression(longitude)}${radiusArg}${maxArg});`,
    );
  } else if (postalCode && countryCode) {
    const radiusArg = radius ? `, ${transformExpression(radius)}` : '';
    const maxArg = maxCount ? `, ${transformExpression(maxCount)}` : '';
    lines.push(
      `${ind}${storesVar} = StoreMgr.searchStoresByPostalCode(${transformExpression(countryCode)}, ${transformExpression(postalCode)}${radiusArg}${maxArg});`,
    );
  } else {
    lines.push(`${ind}// GetNearestStores: provide Latitude/Longitude or PostalCode/CountryCode`);
  }

  return lines.join('\n');
}

// ============================================================================
// Content Pipelets
// ============================================================================

/**
 * Generates code for GetContent pipelet.
 */
function generateGetContentPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const contentId = node.keyBindings.find((kb) => kb.key === 'ContentID')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'Content')?.value;

  if (!contentId) {
    return `${ind}// GetContent: missing ContentID parameter`;
  }

  context.requires.set('ContentMgr', 'dw/content/ContentMgr');
  const contentExpr = `ContentMgr.getContent(${transformExpression(contentId)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${contentExpr};`;
  }
  return `${ind}${contentExpr};`;
}

// ============================================================================
// ProductList Pipelets
// ============================================================================

/**
 * Generates code for GetProductList pipelet.
 */
function generateGetProductListPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const productListId = node.keyBindings.find((kb) => kb.key === 'ProductListID')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'ProductList')?.value;

  if (!productListId) {
    return `${ind}// GetProductList: missing ProductListID parameter`;
  }

  context.requires.set('ProductListMgr', 'dw/customer/ProductListMgr');
  const listExpr = `ProductListMgr.getProductList(${transformExpression(productListId)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${listExpr};`;
  }
  return `${ind}${listExpr};`;
}

/**
 * Generates code for GetProductLists pipelet.
 */
function generateGetProductListsPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const customer = node.keyBindings.find((kb) => kb.key === 'Customer')?.value;
  const type = node.keyBindings.find((kb) => kb.key === 'Type')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'ProductLists')?.value;

  context.requires.set('ProductListMgr', 'dw/customer/ProductListMgr');

  const customerRef = customer ? transformExpression(customer) : 'customer';
  const typeArg = type ? transformExpression(type) : 'null';
  const listsExpr = `ProductListMgr.getProductLists(${customerRef}, ${typeArg})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${listsExpr};`;
  }
  return `${ind}${listsExpr};`;
}

/**
 * Generates code for CreateProductList pipelet.
 */
function generateCreateProductListPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const customer = node.keyBindings.find((kb) => kb.key === 'Customer')?.value;
  const type = node.keyBindings.find((kb) => kb.key === 'Type')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'ProductList')?.value;

  if (!type) {
    return `${ind}// CreateProductList: missing Type parameter`;
  }

  context.requires.set('ProductListMgr', 'dw/customer/ProductListMgr');

  const customerRef = customer ? transformExpression(customer) : 'customer';
  const listExpr = `ProductListMgr.createProductList(${customerRef}, ${transformExpression(type)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${listExpr};`;
  }
  return `${ind}${listExpr};`;
}

/**
 * Generates code for AddProductToProductList pipelet.
 */
function generateAddProductToProductListPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const productList = node.keyBindings.find((kb) => kb.key === 'ProductList')?.value;
  const product = node.keyBindings.find((kb) => kb.key === 'Product')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'ProductListItem')?.value;

  if (!productList || !product) {
    return `${ind}// AddProductToProductList: missing ProductList or Product parameter`;
  }

  const itemExpr = `${transformExpression(productList)}.createProductItem(${transformExpression(product)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${itemExpr};`;
  }
  return `${ind}${itemExpr};`;
}

/**
 * Generates code for RemoveProductListItem pipelet.
 */
function generateRemoveProductListItemPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const productList = node.keyBindings.find((kb) => kb.key === 'ProductList')?.value;
  const productListItem = node.keyBindings.find((kb) => kb.key === 'ProductListItem')?.value;

  if (!productList || !productListItem) {
    return `${ind}// RemoveProductListItem: missing ProductList or ProductListItem parameter`;
  }

  return `${ind}${transformExpression(productList)}.removeItem(${transformExpression(productListItem)});`;
}

/**
 * Generates code for RemoveProductList pipelet.
 */
function generateRemoveProductListPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const productList = node.keyBindings.find((kb) => kb.key === 'ProductList')?.value;

  if (!productList) {
    return `${ind}// RemoveProductList: missing ProductList parameter`;
  }

  context.requires.set('ProductListMgr', 'dw/customer/ProductListMgr');
  return `${ind}ProductListMgr.removeProductList(${transformExpression(productList)});`;
}

/**
 * Generates code for SearchProductLists pipelet.
 */
function generateSearchProductListsPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const queryString = node.keyBindings.find((kb) => kb.key === 'QueryString' || kb.key === 'Query')?.value;
  const type = node.keyBindings.find((kb) => kb.key === 'Type')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'ProductLists' || kb.key === 'SearchResult')?.value;

  context.requires.set('ProductListMgr', 'dw/customer/ProductListMgr');

  const queryArg = queryString ? transformExpression(queryString) : 'null';
  const typeArg = type ? `, ${transformExpression(type)}` : '';
  const searchExpr = `ProductListMgr.queryProductLists(${queryArg}${typeArg})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${searchExpr};`;
  }
  return `${ind}${searchExpr};`;
}

// ============================================================================
// Mail Pipelet
// ============================================================================

/**
 * Generates code for SendMail pipelet.
 */
function generateSendMailPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  context.requires.set('Mail', 'dw/net/Mail');

  const mailFrom = node.keyBindings.find((kb) => kb.key === 'MailFrom' || kb.key === 'From')?.value;
  const mailTo = node.keyBindings.find((kb) => kb.key === 'MailTo' || kb.key === 'To')?.value;
  const mailSubject = node.keyBindings.find((kb) => kb.key === 'MailSubject' || kb.key === 'Subject')?.value;
  const mailTemplate = node.keyBindings.find((kb) => kb.key === 'MailTemplate' || kb.key === 'Template')?.value;

  lines.push(`${ind}var mail = new Mail();`);

  if (mailFrom) {
    lines.push(`${ind}mail.setFrom(${transformExpression(mailFrom)});`);
  }
  if (mailTo) {
    lines.push(`${ind}mail.addTo(${transformExpression(mailTo)});`);
  }
  if (mailSubject) {
    lines.push(`${ind}mail.setSubject(${transformExpression(mailSubject)});`);
  }
  if (mailTemplate) {
    lines.push(`${ind}mail.setContent(${transformExpression(mailTemplate)});`);
  }
  lines.push(`${ind}mail.send();`);

  return lines.join('\n');
}

// ============================================================================
// Page Metadata Pipelet
// ============================================================================

/**
 * Generates code for UpdatePageMetaData pipelet.
 */
function generateUpdatePageMetaDataPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  const product = node.keyBindings.find((kb) => kb.key === 'Product')?.value;
  const category = node.keyBindings.find((kb) => kb.key === 'Category')?.value;
  const content = node.keyBindings.find((kb) => kb.key === 'Content')?.value;

  lines.push(`${ind}var pageMetaData = request.pageMetaData;`);

  if (product) {
    lines.push(`${ind}pageMetaData.setTitle(${transformExpression(product)}.name);`);
    lines.push(`${ind}pageMetaData.setDescription(${transformExpression(product)}.shortDescription);`);
  } else if (category) {
    lines.push(`${ind}pageMetaData.setTitle(${transformExpression(category)}.displayName);`);
    lines.push(`${ind}pageMetaData.setDescription(${transformExpression(category)}.description);`);
  } else if (content) {
    lines.push(`${ind}pageMetaData.setTitle(${transformExpression(content)}.name);`);
    lines.push(`${ind}pageMetaData.setDescription(${transformExpression(content)}.description);`);
  }

  return lines.join('\n');
}

// ============================================================================
// CSRF Pipelets
// ============================================================================

/**
 * Generates code for GenerateCSRFToken pipelet.
 */
function generateGenerateCSRFTokenPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  context.requires.set('CSRFProtection', 'dw/web/CSRFProtection');
  return `${ind}pdict.csrf = CSRFProtection.generateToken();`;
}

/**
 * Generates code for ValidateCSRFToken pipelet.
 */
function generateValidateCSRFTokenPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const lines: string[] = [];

  context.requires.set('CSRFProtection', 'dw/web/CSRFProtection');

  lines.push(`${ind}if (!CSRFProtection.validateRequest()) {`);
  lines.push(`${ind}    // CSRF validation failed`);
  lines.push(`${ind}    return 'error';`);
  lines.push(`${ind}}`);

  return lines.join('\n');
}

// ============================================================================
// Locale/Currency Pipelets
// ============================================================================

/**
 * Generates code for SetRequestLocale pipelet.
 */
function generateSetRequestLocalePipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const locale = node.keyBindings.find((kb) => kb.key === 'Locale' || kb.key === 'LocaleID')?.value;

  if (!locale) {
    return `${ind}// SetRequestLocale: missing Locale parameter`;
  }

  return `${ind}request.setLocale(${transformExpression(locale)});`;
}

/**
 * Generates code for SetSessionCurrency pipelet.
 */
function generateSetSessionCurrencyPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const currency = node.keyBindings.find((kb) => kb.key === 'Currency' || kb.key === 'CurrencyCode')?.value;

  if (!currency) {
    return `${ind}// SetSessionCurrency: missing Currency parameter`;
  }

  return `${ind}session.setCurrency(${transformExpression(currency)});`;
}

// ============================================================================
// CustomObject Pipelets
// ============================================================================

/**
 * Generates code for CreateCustomObject pipelet.
 */
function generateCreateCustomObjectPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const objectType = node.keyBindings.find((kb) => kb.key === 'ObjectType')?.value;
  const keyValue = node.keyBindings.find((kb) => kb.key === 'KeyValue')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'CustomObject')?.value;

  if (!objectType || !keyValue) {
    return `${ind}// CreateCustomObject: missing ObjectType or KeyValue parameter`;
  }

  context.requires.set('CustomObjectMgr', 'dw/object/CustomObjectMgr');
  const objectExpr = `CustomObjectMgr.createCustomObject(${transformExpression(objectType)}, ${transformExpression(keyValue)})`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${objectExpr};`;
  }
  return `${ind}${objectExpr};`;
}

/**
 * Generates code for RemoveCustomObject pipelet.
 */
function generateRemoveCustomObjectPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const customObject = node.keyBindings.find((kb) => kb.key === 'CustomObject')?.value;

  if (!customObject) {
    return `${ind}// RemoveCustomObject: missing CustomObject parameter`;
  }

  context.requires.set('CustomObjectMgr', 'dw/object/CustomObjectMgr');
  return `${ind}CustomObjectMgr.remove(${transformExpression(customObject)});`;
}

/**
 * Generates code for SearchCustomObject pipelet.
 */
function generateSearchCustomObjectPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const objectType = node.keyBindings.find((kb) => kb.key === 'ObjectType')?.value;
  const queryString = node.keyBindings.find((kb) => kb.key === 'QueryString' || kb.key === 'Query')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'SearchResult' || kb.key === 'Result')?.value;

  if (!objectType) {
    return `${ind}// SearchCustomObject: missing ObjectType parameter`;
  }

  context.requires.set('CustomObjectMgr', 'dw/object/CustomObjectMgr');

  const queryArg = queryString ? transformExpression(queryString) : 'null';
  const searchExpr = `CustomObjectMgr.queryCustomObjects(${transformExpression(objectType)}, ${queryArg}, null)`;

  if (outputVar) {
    return `${ind}${transformVariable(outputVar)} = ${searchExpr};`;
  }
  return `${ind}${searchExpr};`;
}

// ============================================================================
// Common Pipelets
// ============================================================================

/**
 * Generates code for Eval pipelet.
 * Eval is replaced by plain JavaScript expression.
 */
function generateEvalPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
