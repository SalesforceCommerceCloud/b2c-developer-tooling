/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Customer pipelet generators.
 *
 * @module operations/pipeline/generator/pipelets/customer
 */

import type {PipeletNodeIR} from '../../types.js';
import {type GeneratorContext, indent, transformExpression, transformVariable} from '../helpers.js';

/**
 * Generates code for GetCustomer pipelet.
 * Retrieves a customer by login.
 */
export function generateGetCustomerPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
export function generateGetCustomerAddressPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
export function generateCreateCustomerPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
 * Returns AuthenticationStatus to pdict for error checking.
 */
export function generateLoginCustomerPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  const login = node.keyBindings.find((kb) => kb.key === 'Login' || kb.key === 'AuthenticationProviderID')?.value;
  const password = node.keyBindings.find((kb) => kb.key === 'Password')?.value;
  const rememberMe = node.keyBindings.find((kb) => kb.key === 'RememberMe')?.value;
  const outputVar = node.keyBindings.find((kb) => kb.key === 'AuthenticationStatus')?.value;

  context.requires.set('CustomerMgr', 'dw/customer/CustomerMgr');

  if (login && password) {
    const rememberMeArg = rememberMe ? `, ${transformExpression(rememberMe)}` : '';
    const loginExpr = `CustomerMgr.loginCustomer(${transformExpression(login)}, ${transformExpression(password)}${rememberMeArg})`;

    if (outputVar) {
      return `${ind}${transformVariable(outputVar)} = ${loginExpr};`;
    }
    // Always capture to pdict.AuthenticationStatus for error checking
    return `${ind}pdict.AuthenticationStatus = ${loginExpr};`;
  }

  return `${ind}// LoginCustomer: missing Login or Password parameter`;
}

/**
 * Generates code for LogoutCustomer pipelet.
 */
export function generateLogoutCustomerPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
  const ind = indent(context.indent);
  context.requires.set('CustomerMgr', 'dw/customer/CustomerMgr');
  return `${ind}CustomerMgr.logoutCustomer(false);`;
}

/**
 * Generates code for CreateCustomerAddress pipelet.
 */
export function generateCreateCustomerAddressPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
export function generateRemoveCustomerAddressPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
export function generateRemoveCustomerPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
export function generateGetCustomerPaymentInstrumentsPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
export function generateCreateCustomerPaymentInstrumentPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
export function generateRemoveCustomerPaymentInstrumentPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
export function generateSetCustomerPasswordPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
export function generateGenerateResetPasswordTokenPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
export function generateResetCustomerPasswordPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
export function generateValidateResetPasswordTokenPipelet(node: PipeletNodeIR, context: GeneratorContext): string {
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
