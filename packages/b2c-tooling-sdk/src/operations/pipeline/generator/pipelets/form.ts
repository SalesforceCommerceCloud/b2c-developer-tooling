/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Form pipelet generators.
 *
 * @module operations/pipeline/generator/pipelets/form
 */

import type {PipeletNodeIR} from '../../types.js';
import {type GeneratorContext, indent, transformExpression} from '../helpers.js';

/**
 * Generates code for ClearFormElement pipelet.
 * Clears a form element's value and validation state.
 */
export function generateClearFormElementPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
export function generateUpdateFormWithObjectPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
export function generateInvalidateFormElementPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
export function generateSetFormOptionsPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
export function generateUpdateObjectWithFormPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
export function generateAcceptFormPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const form = node.keyBindings.find((kb) => kb.key === 'Form' || kb.key === 'FormGroup')?.value;
  if (!form) {
    return `${ind}// AcceptForm: missing Form parameter`;
  }
  return `${ind}${transformExpression(form)}.accept();`;
}
