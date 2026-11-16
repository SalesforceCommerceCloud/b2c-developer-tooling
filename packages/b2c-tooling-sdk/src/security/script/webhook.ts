/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/*
 * Recognizes server-to-server (webhook-shaped) SFRA routes: payment, order
 * management, and notification callbacks that read the raw request body and
 * never use the shopper's session. A CSRF token can't protect these (the
 * caller is another server, not the shopper's browser); what matters is that
 * the route verifies the caller with a signature or a shared secret.
 */
import type {AstNode, ScriptSourceCode} from '../rule.js';
import {calleeName, memberChain, propertyName} from './helpers.js';
import {resolveFunction, walk} from './routes.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = AstNode & Record<string, any>;

/** What the handlers of a route do, as far as webhook detection is concerned. */
export interface WebhookShape {
  /** Reads the raw request body (`requestBodyAsString`, SFRA `req.body`). */
  readsRawBody: boolean;
  /** Uses the shopper's session: customer, basket, session, form, or rendering a page. */
  usesShopperSession: boolean;
  /**
   * Checks the caller: compares a request value with a secret (`token !== reqToken`),
   * reads an `Authorization` or signature header, or calls or runs middleware named
   * like verification (`validateRequest`, `verifySignature`, `authenticate`).
   */
  verifiesCaller: boolean;
}

/** Calls and middleware that check something; names that produce a signature (`generateSignature`, `sign`) don't count. */
const VERIFY_NAME = /verif|validat|authenticat|authoriz|isvalid|check(sig|hmac|token|auth|request)/i;
const SESSION_ROOTS = new Set(['customer', 'session']);
const SESSION_REQ_PROPS = new Set(['currentCustomer', 'session', 'form', 'locale']);
const SECRET_SOURCE = /preferences|getCustomPreferenceValue|token|secret|signature|apikey|api_key/i;
const AUTH_HEADER = /authorization|signature|x-[a-z-]*(token|key|hmac)/i;

/**
 * Inspects a route's middleware and handler arguments (inline or declared in
 * the same file). Middleware referenced from other modules counts as caller
 * verification when its name looks like verification (`apn.validateRequest`).
 */
export function webhookShape(args: readonly AstNode[], sourceCode: ScriptSourceCode): WebhookShape {
  const shape: WebhookShape = {readsRawBody: false, usesShopperSession: false, verifiesCaller: false};
  for (const arg of args) {
    const fn = resolveFunction(arg, sourceCode);
    if (!fn) {
      const chain = memberChain(arg);
      if (chain && !(chain[0] === 'server' && chain[1] === 'middleware') && VERIFY_NAME.test(chain.at(-1) ?? ''))
        shape.verifiesCaller = true;
      continue;
    }
    walk(fn, (node) => inspect(node, shape, sourceCode));
  }
  return shape;
}

/** Whether a route looks like a server-to-server endpoint: reads the raw body and never uses the shopper session. */
export function isWebhookShaped(shape: WebhookShape): boolean {
  return shape.readsRawBody && !shape.usesShopperSession;
}

function inspect(node: Node, shape: WebhookShape, sourceCode: ScriptSourceCode): void {
  if (node.type === 'MemberExpression') {
    const chain = memberChain(node);
    const last = propertyName(node);
    if (last === 'requestBodyAsString' || last === 'getRequestBodyAsString') shape.readsRawBody = true;
    if (chain?.[0] === 'req' && chain.length >= 2) {
      if (chain[1] === 'body') shape.readsRawBody = true;
      if (SESSION_REQ_PROPS.has(chain[1])) shape.usesShopperSession = true;
    }
    if (chain && SESSION_ROOTS.has(chain[0]) && chain.length >= 2 && node.object.type === 'Identifier') {
      // The `customer` and `session` globals, unless shadowed by a local.
      if (!sourceCode.getScope(node).references.some((r) => r.identifier === node.object && r.resolved))
        shape.usesShopperSession = true;
    }
    if (chain?.[0] === 'res' && (last === 'render' || chain[1] === 'render')) shape.usesShopperSession = true;
    if (last === 'getCurrentBasket' || last === 'getCurrentOrNewBasket') shape.usesShopperSession = true;
    return;
  }
  if (node.type === 'CallExpression') {
    const name = calleeName(node) ?? '';
    if (VERIFY_NAME.test(name)) shape.verifiesCaller = true;
    // req.httpHeaders.get('Authorization'), request.httpHeaders['x-signature']
    const arg = node.arguments[0] as Node | undefined;
    if (
      propertyName(node.callee) === 'get' &&
      memberChain((node.callee as Node).object)?.at(-1) === 'httpHeaders' &&
      arg?.type === 'Literal' &&
      typeof arg.value === 'string' &&
      AUTH_HEADER.test(arg.value)
    )
      shape.verifiesCaller = true;
    return;
  }
  if (node.type === 'BinaryExpression' && ['===', '!==', '==', '!='].includes(node.operator)) {
    const text = `${sourceCode.getText(node.left)} ${sourceCode.getText(node.right)}`;
    if (SECRET_SOURCE.test(text)) shape.verifiesCaller = true;
  }
}
