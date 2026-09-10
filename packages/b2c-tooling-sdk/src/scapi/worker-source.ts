/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/** Plain Node JavaScript, packaged with the SDK. This is local execution, not a security sandbox. */
export const SCAPI_WORKER_SOURCE = String.raw`
const send = process.send.bind(process);
const pending = new Map();
let sequence = 0;
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
  const spec = {apis: documents.map(d => d.entry), paths: {}, resolve};
  for (const {entry, schema} of documents) {
    for (const [path, item] of Object.entries(schema.paths || {})) {
      const methods = {};
      for (const method of ['get','head','post','put','patch','delete','options']) {
        if (item[method]) methods[method] = resolve({...item[method], api: entry.id,
          parameters: [...(item.parameters || []), ...(item[method].parameters || [])],
          security: item[method].security ?? schema.security ?? []}, entry.id);
      }
      spec.paths['/' + entry.id + path] = methods;
    }
  }
  const scapi = {request: options => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, {resolve, reject});
    send({type:'request', id, options});
  })};
  const snippetCall = (operation, name, input) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, {resolve, reject});
    send({type:'snippet', id, operation, name, input});
  });
  let runningSnippets = 0;
  const evaluate = (code, input) => new Function('spec', 'scapi', 'codemode', 'organizationId', 'siteId', 'input',
    'return (' + code + ')(input);')(spec, scapi, codemode, message.organizationId, message.siteId, input);
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
    if (pending.size || runningSnippets) throw new Error('Await every scapi.request and codemode call before returning. Requests may already have taken effect.');
    const json = JSON.stringify(value === undefined ? null : value);
    if (Buffer.byteLength(json) > message.maxOutputBytes) throw new Error('SCAPI_RESULT_TOO_LARGE: return fewer fields or a smaller page.');
    send({type:'result', value: JSON.parse(json)});
  } catch (error) {
    send({type:'error', error: String(error.message || error).slice(0, 4000)});
  }
});
`;
