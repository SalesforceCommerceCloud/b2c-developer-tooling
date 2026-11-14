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
}

/** One statement that defined or changed an SFRA route, in the order the platform applies them. */
export interface RouteStep {
  method: 'append' | 'get' | 'post' | 'prepend' | 'replace' | 'use';
  cartridge: string;
  relPath: string;
  line: number;
  /** For `replace`: the chain that was replaced. */
  replaced?: IndexedMiddleware[];
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

/** A hook registration from a cartridge's hooks.json. */
export interface IndexedHook {
  name: string;
  cartridge: string;
  /** Script path as written in hooks.json. */
  script: string;
  /** Resolved script file relative to the cartridge, when it exists. */
  relPath?: string;
}

/** A Custom API endpoint from `rest-apis/<api>/api.json`. */
export interface IndexedCustomApiEndpoint {
  api: string;
  endpoint: string;
  cartridge: string;
  schema?: string;
  implementation?: string;
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
