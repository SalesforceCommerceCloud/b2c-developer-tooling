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
  /** The reference as written in the route, such as `csrfProtection.generateToken`. Unset for inline functions. */
  expression?: string;
  cartridge: string;
  /** Path relative to the cartridge directory, with forward slashes. */
  relPath: string;
  line: number;
  validatesCsrf?: boolean;
  readsForm?: boolean;
  /** Route event listeners this inline function registers with `this.on('route:...', fn)`. */
  listens?: Array<{event: string; line: number; conditional?: boolean}>;
  /** Set when the entry was added by server.append or server.prepend. */
  via?: 'append' | 'prepend';
  /** For required middleware: the file that implements it, when it resolves on the cartridge path. */
  source?: {cartridge: string; relPath: string; line?: number};
}

/**
 * An SFRA route event listener registered by middleware in the chain
 * (`this.on('route:BeforeComplete', fn)`). `route:Redirect` listeners run when
 * a step sets a redirect and the chain stops; `route:BeforeComplete` and then
 * `route:Complete` listeners run after the last step. The platform renders
 * the response in its own `route:Complete` listener, which runs before any
 * registered by middleware.
 */
export interface RouteEventListener {
  event: string;
  cartridge: string;
  relPath: string;
  line: number;
  /** Index into `chain` of the middleware that registers the listener. */
  step: number;
  /** Registered inside a condition, so it may not run on every request. */
  conditional?: boolean;
  /** Set when the registering middleware was added by server.append or server.prepend. */
  via?: 'append' | 'prepend';
}

/** One statement that defined or changed an SFRA route, in the order the platform applies them. */
export interface RouteStep {
  /**
   * The `server.*` call, or `delegate` for a controller that defines no routes
   * itself and passes `module` to a helper; what the helper changes isn't known.
   */
  method: 'append' | 'delegate' | 'get' | 'post' | 'prepend' | 'replace' | 'use';
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
  /** SFRA: route event listeners registered by the chain, in the order they run. */
  events?: RouteEventListener[];
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
  /** Resolved script file relative to its cartridge, when it exists. */
  relPath?: string;
  /** The cartridge the script resolved to, when it isn't `cartridge` (a `*\/cartridge/...` script). */
  scriptCartridge?: string;
  /** Line of the system hook's function in the script, when found. */
  line?: number;
  /** For system hooks: whether the function returns a value. `unknown` for custom hooks. */
  returnsValue: ReturnBehavior;
  /** The hooks.json that registers this hook, relative to `cartridge`, and the line of its entry. */
  registeredIn?: {relPath: string; line?: number};
  /**
   * For custom hooks: each function the project names in `HookMgr.callHook(name, fn, ...)`,
   * with its line in this script when the script exports it and the call sites that use it.
   */
  calledFunctions?: Array<{name: string; line?: number; callers: HookCaller[]}>;
}

/** A `HookMgr.callHook()` call site. */
export interface HookCaller {
  cartridge: string;
  relPath: string;
  line: number;
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

/** A parameter of a custom job step type. */
export interface IndexedJobStepParameter {
  name: string;
  type?: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
}

/** A custom job step type from steptypes.json. */
export interface IndexedJobStep {
  typeId: string;
  /** `script-module-step` (task) or `chunk-script-module-step` (chunk). */
  kind: string;
  cartridge: string;
  /** The `module` value as written. */
  module?: string;
  /** For task steps: the function the platform calls (`function`, default `execute`). */
  function?: string;
  description?: string;
  /** The steptypes.json that declares the step, relative to `cartridge`, and the line of its `@type-id`. */
  registeredIn: {relPath: string; line?: number};
  /** Resolved module file, when it exists. */
  implementationFile?: {cartridge: string; relPath: string; line?: number};
  parameters: IndexedJobStepParameter[];
  /** Problems found, such as a module that doesn't resolve. */
  problems: string[];
}

/** A cartridge in the index, in cartridge path order. */
export interface IndexedCartridge {
  name: string;
  /** Absolute path, forward slashes. */
  src: string;
}

/**
 * Where the index's cartridge order came from:
 *
 * - `configured`: the `cartridgePath` option (`cartridges` in dw.json or `SFCC_CARTRIDGES`).
 * - `instance`: a site's cartridge path read from the instance (the caller passed it as `cartridgePath`).
 * - `provided`: the caller passed ordered cartridges (for example the VS Code Cartridges view order).
 * - `site-file`: a site's `<custom-cartridges>` in a site import file in the project
 *   (`sites/<id>/site.xml`, the latest by migration or import set timestamp).
 * - `discovery`: a guess: discovery order with known base cartridges last.
 */
export interface CartridgeOrder {
  source: 'configured' | 'discovery' | 'instance' | 'provided' | 'site-file';
  /** For `instance` and `site-file`: the site whose path was used. */
  siteId?: string;
  /** For `instance`: the instance the path was read from. */
  hostname?: string;
  /** For `site-file`: the file, relative to the project root. */
  file?: string;
  /**
   * Cartridges in the project that the cartridge path doesn't name. The index still includes them,
   * after the named cartridges, but the site doesn't run their code.
   */
  notOnPath?: string[];
  /** For `instance` and `site-file`: other sites (on the instance, or in the project) with a different cartridge path. */
  otherSites?: string[];
}

/** A JSON-serializable model of a B2C Commerce project's server-side entry points. */
export interface ProjectIndex {
  version: 1;
  cartridges: IndexedCartridge[];
  /** Where the cartridge order came from. */
  cartridgeOrder?: CartridgeOrder;
  endpoints: IndexedEndpoint[];
  hooks: IndexedHook[];
  customApis: IndexedCustomApiEndpoint[];
  jobSteps: IndexedJobStep[];
  /** Files that could not be parsed while indexing. */
  errors: Array<{cartridge: string; relPath: string; message: string}>;
}
