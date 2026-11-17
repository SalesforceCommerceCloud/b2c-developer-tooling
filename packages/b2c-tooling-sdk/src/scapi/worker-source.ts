/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Plain Node JavaScript, packaged with the SDK. Runs under `--permission` with no credentials in its
 * environment, and denies every built-in module outside a short allow-list, so programs can't open
 * network connections directly. It is not a general-purpose sandbox: CPU, memory and output are
 * limited by the host.
 */
export const SCAPI_WORKER_SOURCE = String.raw`
const send = process.send.bind(process);
const pending = new Map();
let sequence = 0;
function directNetwork() {
  throw new Error('SCAPI_DIRECT_NETWORK_DISABLED: Use scapi.request() in code mode. For direct HTTP calls, use a client outside code mode with a token from b2c auth token; SDK safety does not govern those calls.');
}
// Network access goes only through scapi.request(), which the host authenticates and governs.
for (const name of ['fetch', 'WebSocket', 'EventSource']) {
  Object.defineProperty(globalThis, name, {value: directNetwork, writable: false, configurable: false});
}
// Fail closed if the permission model is off (for example a custom worker command that ignores
// --permission): the module guard below assumes subprocesses, workers and file writes are denied.
if (!process.permission || ['child', 'worker', 'fs.write', 'inspector'].some(scope => process.permission.has(scope))) {
  process.send({type: 'error', error: 'SCAPI_WORKER_UNRESTRICTED: the code-mode worker must run with --permission; check the worker command.'});
  process.exit(1);
}
// Node has no network permission yet, so program code may load only these built-in modules.
// Every other built-in (http, net, dns, tls, _http_client, fs, module, ...) is denied, through
// require(), import() and process.getBuiltinModule() alike.
const ALLOWED_BUILTINS = new Set(['assert', 'buffer', 'crypto', 'events', 'path', 'querystring', 'stream', 'string_decoder', 'timers', 'url', 'util', 'zlib']);
const NETWORK_BUILTINS = new Set(['http', 'https', 'http2', 'net', 'tls', 'dgram', 'dns', 'undici']);
function builtinName(request) {
  const name = String(request);
  return (name.startsWith('node:') ? name.slice(5) : name).split('/')[0];
}
function moduleDenied(request) {
  const name = builtinName(request);
  const network = NETWORK_BUILTINS.has(name) || name.startsWith('_http') || name.startsWith('_tls') || name.startsWith('_stream_wrap');
  const error = new Error(network
    ? 'SCAPI_DIRECT_NETWORK_DISABLED: ' + String(request) + ' is not available in code mode. Use scapi.request() for SCAPI calls.'
    : String(request) + ' is not available in code mode.');
  if (!network) error.code = 'ERR_ACCESS_DENIED';
  throw error;
}
{
  const Module = require('module');
  if (typeof Module.registerHooks !== 'function') {
    process.send({type: 'error', error: 'SCAPI_WORKER_UNSUPPORTED: code mode needs Node.js 22.15 or later (module.registerHooks).'});
    process.exit(1);
  }
  const denied = (request) => Module.isBuiltin(String(request)) && !ALLOWED_BUILTINS.has(builtinName(request));
  // Resolve hooks cover require(), createRequire() and dynamic import().
  Module.registerHooks({
    resolve(specifier, context, nextResolve) {
      if (denied(specifier)) moduleDenied(specifier);
      // Only built-ins and nothing on disk: --permission denies file reads, and code mode has no packages.
      return nextResolve(specifier, context);
    },
  });
  const lock = (target, name, value) => Object.defineProperty(target, name, {value, writable: false, configurable: false});
  // A later hook could short-circuit resolution past the guard; allow no more hooks.
  lock(Module, 'registerHooks', () => moduleDenied('module.registerHooks'));
  const load = Module._load;
  lock(Module, '_load', function (request, ...rest) { return denied(request) ? moduleDenied(request) : load.call(this, request, ...rest); });
  const getBuiltinModule = process.getBuiltinModule;
  if (typeof getBuiltinModule === 'function') {
    lock(process, 'getBuiltinModule', (request) => denied(request) ? moduleDenied(request) : getBuiltinModule.call(process, request));
  }
  // Internal bindings expose raw sockets (tcp_wrap, udp_wrap, cares_wrap); code mode needs none.
  for (const name of ['binding', '_linkedBinding', 'dlopen']) lock(process, name, () => moduleDenied('process.' + name));
}
process.on('disconnect', () => process.exit(0));
process.on('message', async message => {
  if (message.type === 'reply') {
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error));
    else waiter.resolve(message.value);
    return;
  }
  if (message.type !== 'run') return;
  const documents = message.documents || [];
  const byId = new Map(documents.map(d => [d.entry.id, d.schema]));
  function resolve(value, api, seen = new Set(), depth = 0) {
    if (depth > 20) return value;
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(v => resolve(v, api, seen, depth + 1));
    if (typeof value.$ref === 'string') {
      if (!value.$ref.startsWith('#/') || seen.has(value.$ref)) return value;
      const next = new Set(seen); next.add(value.$ref);
      const target = value.$ref.slice(2).split('/').reduce((obj, key) => obj?.[key.replaceAll('~1','/').replaceAll('~0','~')], byId.get(api));
      if (!target) throw new Error('Unresolved schema reference: ' + value.$ref);
      return resolve(target, api, next, depth + 1);
    }
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, resolve(v, api, seen, depth + 1)]));
  }
  // Keys of these objects are names chosen by the API, not schema keywords, so a property called description survives.
  const NAME_MAPS = new Set(['properties', 'patternProperties', 'headers', 'content', 'responses', 'schemas', 'scopes', 'links', 'callbacks', 'securitySchemes']);
  const VALUE_KEYS = new Set(['default', 'enum', 'const']);
  function outline(value, nameMap = false) {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(v => outline(v));
    const out = {};
    for (const [key, v] of Object.entries(value)) {
      if (!nameMap && (key === 'description' || key === 'example' || key === 'examples')) continue;
      out[key] = !nameMap && VALUE_KEYS.has(key) ? v : outline(v, !nameMap && NAME_MAPS.has(key));
    }
    return out;
  }
  const outlined = message.detail === 'outline';
  const resolveDetail = (value, api) => outlined ? outline(resolve(value, api)) : resolve(value, api);
  const call = (fields) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, {resolve, reject});
    send({...fields, id});
  });
  const search = (query, options = {}) => call({type:'search', query: String(query ?? ''), options: {limit: options?.limit}});
  const specData = {apis: documents.map(d => d.entry), paths: {}, resolve: resolveDetail, search};
  const spec = new Proxy(specData, {get(target, key, receiver) {
    if (typeof key === 'symbol' || key in target || key === 'then' || key === 'toJSON') return Reflect.get(target, key, receiver);
    throw new Error('SCAPI_SPEC_UNKNOWN_MEMBER: spec.' + key + ' does not exist. spec has only apis (array of API entries), paths ({[fullPath]: {[method]: operation}}), resolve(value, apiId) and search(query, {limit}). Rank operations with await spec.search("gift certificate balance") or list them with Object.entries(spec.paths).');
  }});
  for (const {entry, schema} of documents) {
    for (const [path, item] of Object.entries(schema.paths || {})) {
      const methods = {};
      for (const method of ['get','head','post','put','patch','delete','options']) {
        if (item[method]) {
          const operation = {...item[method], api: entry.id,
            parameters: [...(item.parameters || []), ...(item[method].parameters || [])],
            security: item[method].security ?? schema.security ?? []};
          // Keep the operation's own prose; only what it references is trimmed.
          const {summary, description, ...rest} = operation;
          methods[method] = {...(summary === undefined ? {} : {summary}), ...(description === undefined ? {} : {description}), ...resolveDetail(rest, entry.id)};
        }
      }
      specData.paths['/' + entry.id + (entry.apiFamily === 'custom' ? '/organizations/{organizationId}' : '') + path] = methods;
    }
  }
  const scapi = {request: options => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, {resolve, reject});
    send({type:'request', id, options});
  })};
  const authCall = (operation, options = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, {resolve, reject});
    send({type:'auth', id, operation, options});
  });
  // Present only when the host can export SLAS tokens.
  const auth = message.auth ? {slas: options => authCall('slas', options)} : undefined;
  const snippetCall = (operation, name, input) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, {resolve, reject});
    send({type:'snippet', id, operation, name, input});
  });
  let runningSnippets = 0;
  const evaluate = (code, input) => new Function('spec', 'scapi', 'codemode', 'auth', 'organizationId', 'siteId', 'input',
    'return (' + code.trim().replace(/;+$/, '') + '\n)(input);')(spec, scapi, codemode, auth, message.organizationId, message.siteId, input);
  const codemode = {
    search: (query = '') => snippetCall('search', String(query)),
    describe: name => snippetCall('describe', String(name)),
    run: async (name, input) => {
      if (runningSnippets >= 16) throw new Error('SCAPI_SNIPPET_LIMIT: at most 16 active snippet calls.');
      runningSnippets++;
      try {
        const code = await snippetCall('run', String(name), input);
        return await evaluate(code, input);
      } finally { runningSnippets--; }
    }
  };
  try {
    const value = await evaluate(message.code, message.input);
    if (pending.size || runningSnippets) throw new Error('Await every scapi.request, auth, and codemode call before returning. Requests may already have taken effect.');
    const json = JSON.stringify(value === undefined ? null : value);
    if (Buffer.byteLength(json) > message.maxOutputBytes) throw new Error('SCAPI_RESULT_TOO_LARGE: return fewer fields or a smaller page. Whole operations include every parameter and schema description; return operationId, method, path and summary to list candidates, and only the parts you need (parameters, requestBody) for one.');
    send({type:'result', value: JSON.parse(json)});
  } catch (error) {
    const message = error.code === 'ERR_ACCESS_DENIED'
      ? 'SCAPI_RUNTIME_RESTRICTED: Code mode supports API discovery, managed requests, and result processing. Use terminal or file tools outside code mode for filesystem access, subprocesses, or other local development work.'
      : String(error.message || error);
    send({type:'error', error: message.slice(0, 4000)});
  }
});
`;
