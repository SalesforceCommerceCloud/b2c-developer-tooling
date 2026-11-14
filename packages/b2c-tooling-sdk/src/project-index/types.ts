/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/** HTTP methods an endpoint accepts. `ANY` means no method restriction. */
export type EndpointMethod = 'ANY' | 'GET' | 'POST';

/** How a storefront endpoint is implemented. */
export type EndpointKind = 'pipeline' | 'sfra' | 'sg-controller';

/** A middleware or handler in an endpoint's composed chain. */
export interface IndexedMiddleware {
  /** See MiddlewareRef.id: `csrf.validateAjaxRequest`, `server.middleware.post`, `function`, ... */
  id: string;
  cartridge: string;
  /** Path relative to the cartridge directory, with forward slashes. */
  relPath: string;
  line: number;
  validatesCsrf?: boolean;
  readsForm?: boolean;
  /** Set when the entry was added by server.append or server.prepend. */
  via?: 'append' | 'prepend';
  /** For required middleware: the file that implements it, when it resolves on the cartridge path. */
  source?: {cartridge: string; relPath: string};
}

/** One statement that defined or changed an SFRA route, in the order the platform applies them. */
export interface RouteStep {
  method: 'append' | 'get' | 'post' | 'prepend' | 'replace' | 'use';
  cartridge: string;
  relPath: string;
  line: number;
  /** For `replace`: the chain that was replaced. */
  replaced?: IndexedMiddleware[];
  /** For `replace`: security middleware IDs the replaced chain had and the new one lacks. */
  dropped?: string[];
}

/** A storefront endpoint (`Controller-Action`). */
export interface IndexedEndpoint {
  /** `Cart-AddProduct`. */
  id: string;
  controller: string;
  action: string;
  kind: EndpointKind;
  /** Cartridge that serves the endpoint (leftmost on the cartridge path). */
  cartridge: string;
  /** File that defines the effective endpoint, relative to its cartridge. */
  relPath: string;
  line: number;
  methods: EndpointMethod[];
  /** Whether the endpoint requires HTTPS (SFRA `server.middleware.https`, SiteGenesis `https`, pipeline `secure`). */
  https: boolean;
  /** Whether the endpoint requires a logged-in customer. */
  loginRequired: boolean;
  /** How CSRF tokens are checked. `none` for endpoints that accept POST without a check. */
  csrf: 'in-handler' | 'middleware' | 'none' | 'not-applicable';
  /** SFRA: the composed middleware chain. */
  chain?: IndexedMiddleware[];
  /** SFRA: the statements that produced the chain, across cartridges. */
  steps?: RouteStep[];
  /** SiteGenesis: guard filters. */
  filters?: string[];
  /** Pipelines: whether the start node is public (not `call-mode="private"`). */
  public?: boolean;
}

/**
 * Whether an implementation returns a value: `yes` when any `return` has a
 * value, `no` when none does, `unknown` when the function wasn't found.
 */
export type ReturnBehavior = 'no' | 'unknown' | 'yes';

/** A hook registration from a cartridge's hooks.json. */
export interface IndexedHook {
  /** Extension point, for example `dw.ocapi.shop.basket.afterPOST`. */
  name: string;
  /**
   * `system` for platform extension points (`dw.*`: OCAPI/SCAPI hooks and hooks
   * such as dw.order.calculate): registrations run in cartridge path order, and
   * the first one that returns a value skips later registrations and the system
   * implementation. `custom` for your own extension points: every registration runs.
   */
  kind: 'custom' | 'system';
  /**
   * For system extension points, the function the platform calls: the
   * extension point's last segment (`afterPOST`, `calculate`). Custom
   * extension points have no fixed function; callers name it in
   * `HookMgr.callHook(extensionPoint, functionName, ...)`.
   */
  function?: string;
  /** Functions the script exports (custom hooks can be called with any of them). */
  exports?: string[];
  cartridge: string;
  /** Script path as written in hooks.json. */
  script: string;
  /** Resolved script file relative to the cartridge, when it exists. */
  relPath?: string;
  /** Line of the system hook's function in the script, when found. */
  line?: number;
  /** For system hooks: whether the function returns a value. `unknown` for custom hooks. */
  returnsValue: ReturnBehavior;
}

/** A Custom API endpoint from `rest-apis/<api>/api.json`, joined with its schema.yaml operation. */
export interface IndexedCustomApiEndpoint {
  api: string;
  /** Endpoint name in api.json; matches the schema's operationId and the exported function. */
  endpoint: string;
  cartridge: string;
  schema?: string;
  implementation?: string;
  /** HTTP method from schema.yaml (`GET`). */
  method?: string;
  /** Path from schema.yaml (`/loyalty-info`). */
  path?: string;
  /** Security schemes that apply (`ShopperToken`, `AmOAuth2`). */
  security?: string[];
  /** Scopes required by the security requirement (`c_loyalty`). */
  scopes?: string[];
  /** `shopper` (ShopperToken), `admin` (AmOAuth2), or `unknown`. */
  apiType: 'admin' | 'shopper' | 'unknown';
  /** Implementation script relative to the cartridge, and the exported function's line. */
  implementationFile?: {relPath: string; line?: number};
  /** Whether the exported function is marked `.public = true` (required). */
  public?: boolean;
  /** Problems found while joining api.json, schema.yaml, and the script. */
  problems: string[];
}

/** A custom job step type from steptypes.json. */
export interface IndexedJobStep {
  typeId: string;
  kind: string;
  cartridge: string;
  module?: string;
}

/** A cartridge in the index, in cartridge path order. */
export interface IndexedCartridge {
  name: string;
  /** Absolute path, forward slashes. */
  src: string;
}

/** A JSON-serializable model of a B2C Commerce project's server-side entry points. */
export interface ProjectIndex {
  version: 1;
  cartridges: IndexedCartridge[];
  endpoints: IndexedEndpoint[];
  hooks: IndexedHook[];
  customApis: IndexedCustomApiEndpoint[];
  jobSteps: IndexedJobStep[];
  /** Files that could not be parsed while indexing. */
  errors: Array<{cartridge: string; relPath: string; message: string}>;
}
