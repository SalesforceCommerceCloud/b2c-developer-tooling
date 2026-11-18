/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * The script one code-mode program runs as inside the QuickJS VM. The VM has no network, file
 * system, modules, process or timers; the only way out is the `__b2c` host function, which the
 * SDK answers and limits. This prelude builds `scapi`, `spec`, `codemode`, `auth` and `sleep` on
 * top of it.
 *
 * The program and every snippet are spliced in as source when the script is built, so nothing
 * is evaluated at run time. The prelude shares the VM with the program, so it holds no authority:
 * a program that calls `__b2c` directly is limited and checked by the host exactly like one that
 * uses `scapi.request`.
 */
const PRELUDE = String.raw`
let __pending = 0;
const __call = (kind, payload) => {
  __pending++;
  return __b2c(kind, payload).finally(() => { __pending--; });
};
const __lock = (name, value) => Object.defineProperty(globalThis, name, {value, writable: false, configurable: false, enumerable: false});
const __directNetwork = function () {
  throw new Error('SCAPI_DIRECT_NETWORK_DISABLED: Use scapi.request() in code mode. For direct HTTP calls, use a client outside code mode with a token from b2c auth token; SDK safety does not govern those calls.');
};
const __restricted = (name) => function () {
  throw new Error('SCAPI_RUNTIME_RESTRICTED: ' + name + ' is not available. Code mode supports API discovery, managed requests, and result processing. Use terminal or file tools outside code mode for filesystem access, subprocesses, or other local development work.');
};
for (const name of ['fetch', 'WebSocket', 'EventSource', 'XMLHttpRequest']) __lock(name, __directNetwork);
__lock('require', __restricted('require()'));
__lock('process', new Proxy({}, {get: (_target, key) => typeof key === 'symbol' ? undefined : __restricted('process.' + String(key))()}));
for (const name of ['setTimeout', 'setInterval', 'setImmediate']) {
  __lock(name, () => {
    throw new Error('SCAPI_RUNTIME_RESTRICTED: ' + name + ' is not available in code mode. Use await sleep(ms) to wait.');
  });
}
__lock('structuredClone', (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value)));
const sleep = (ms) => __call('sleep', {ms: Number(ms)}).then(() => undefined);
__lock('sleep', sleep);
let __consoleChars = 0;
const __log = (...values) => {
  for (const value of values) {
    let text;
    try { text = typeof value === 'string' ? value : JSON.stringify(value); } catch { text = String(value); }
    __consoleChars += String(text).length + 1;
  }
  if (__consoleChars > 65536) throw new Error('SCAPI_CONSOLE_LIMIT: return results instead of logging.');
};
const __console = Object.freeze({log: __log, info: __log, warn: __log, error: __log, debug: __log});
const __specMembers = 'spec has only apis({api}), operations({api, method}), operation(path, method), resolve(value, apiId) and search(query, {limit}); every member is async.';
const spec = new Proxy(Object.freeze({
  apis: (options) => __call('spec', {op: 'apis', api: options?.api}),
  operations: (options) => __call('spec', {op: 'operations', api: options?.api, method: options?.method}),
  operation: (path, method) => __call('spec', {op: 'operation', path: String(path ?? ''), method: String(method ?? '')}),
  resolve: (value, api) => __call('spec', {op: 'resolve', value, api: String(api ?? '')}),
  search: (query, options) => __call('search', {query: String(query ?? ''), options: {limit: options?.limit}}),
}), {get(target, key, receiver) {
  if (typeof key === 'symbol' || key in target || key === 'then' || key === 'toJSON') return Reflect.get(target, key, receiver);
  throw new Error('SCAPI_SPEC_UNKNOWN_MEMBER: spec.' + String(key) + ' does not exist. ' + __specMembers + ' Rank operations with await spec.search("gift certificate balance"), list them with await spec.operations({api: "product/products/v1"}), and read one with await spec.operation(match.path, match.method).');
}});
const scapi = Object.freeze({request: (options) => __call('request', options)});
const auth = __config.auth ? Object.freeze({slas: (options) => __call('auth', {operation: 'slas', options: options ?? {}})}) : undefined;
const organizationId = __config.organizationId;
const siteId = __config.siteId;
let __activeSnippets = 0;
const codemode = Object.freeze({
  search: (query = '') => __call('snippet', {operation: 'search', name: String(query)}),
  describe: (name) => __call('snippet', {operation: 'describe', name: String(name)}),
  run: async (name, input) => {
    if (__activeSnippets >= 16) throw new Error('SCAPI_SNIPPET_LIMIT: at most 16 active snippet calls.');
    __activeSnippets++;
    try {
      // The host validates input and counts the call; the source was compiled with this script.
      const key = await __call('snippet', {operation: 'run', name: String(name), input});
      const snippet = __snippetPrograms[key];
      if (typeof snippet !== 'function') throw new Error('SCAPI_SNIPPET_NOT_FOUND: ' + String(name) + '.');
      return await snippet(input);
    } finally { __activeSnippets--; }
  },
});
`;

/** Strip the trailing semicolons a model may add after the function expression. */
function programExpression(code: string): string {
  return code.trim().replace(/;+$/, '');
}

// Each program sees `console` as the bounded logger, alongside the prelude's bindings.
const wrap = (code: string) => `((console) => (\n${programExpression(code)}\n))(__console)`;

/**
 * Build the VM script for one program. Configuration crosses as a JSON string literal; the
 * program and snippet sources are inserted as expressions, each on its own lines so a trailing
 * line comment cannot swallow the closing parenthesis.
 */
export function buildScapiScript(
  code: string,
  config: Record<string, unknown>,
  snippets: ReadonlyArray<{key: string; code: string}> = [],
): string {
  const programs = snippets.map(({key, code: source}) => `  ${JSON.stringify(key)}: ${wrap(source)},`).join('\n');
  return [
    `const __config = JSON.parse(${JSON.stringify(JSON.stringify(config))});`,
    PRELUDE,
    `const __snippetPrograms = Object.freeze({\n${programs}\n});`,
    `const __value = await ${wrap(code)}(__config.input);`,
    "if (__pending || __activeSnippets) throw new Error('Await every scapi.request, auth, sleep, and codemode call before returning. Requests may already have taken effect.');",
    'return __value === undefined ? null : __value;',
  ].join('\n');
}
