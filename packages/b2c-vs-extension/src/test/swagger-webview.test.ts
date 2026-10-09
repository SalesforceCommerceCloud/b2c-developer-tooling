/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as assert from 'node:assert';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';

interface Element {
  textContent: string;
  className: string;
  addEventListener: (event: string, callback: () => void) => void;
}

interface SwaggerOptions {
  requestInterceptor: (request: {headers: Record<string, string>}) => {headers: Record<string, string>};
  plugins: Array<() => {components: Record<string, () => null>}>;
}

function loadWebview(token: string, error = '', offlineWarning: string | null = null) {
  const template = readFileSync(
    fileURLToPath(new URL('../../src/api-browser/swagger-webview.html', import.meta.url)),
    'utf8',
  );
  const script = template.match(/<script nonce="__NONCE__">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  const elements = new Map<string, Element>();
  const clicks = new Map<string, () => void>();
  const messages: Array<{type: string}> = [];
  let onMessage: (event: {data: Record<string, unknown>}) => void;
  let options: SwaggerOptions;
  const swaggerBundle = Object.assign(
    (value: SwaggerOptions) => {
      options = value;
    },
    {presets: {apis: {}}},
  );

  runInNewContext(
    script
      .replace('__INITIAL_TOKEN__', token)
      .replace('__INITIAL_TOKEN_ERROR__', () => JSON.stringify(error))
      .replace('__OFFLINE_WARNING__', () => JSON.stringify(offlineWarning))
      .replace('__OFFLINE_STATUS__', () => JSON.stringify('Offline: read-only'))
      .replace('__SPEC_JSON__', '{}'),
    {
      acquireVsCodeApi: () => ({postMessage: (message: {type: string}) => messages.push(message)}),
      document: {
        getElementById(id: string) {
          if (!elements.has(id)) {
            elements.set(id, {
              textContent: '',
              className: '',
              addEventListener: (_event, callback) => clicks.set(id, callback),
            });
          }
          return elements.get(id);
        },
      },
      window: {
        fetch: () => Promise.reject(new Error('Unexpected network request')),
        addEventListener: (_event: string, handler: typeof onMessage) => {
          onMessage = handler;
        },
      },
      SwaggerUIBundle: swaggerBundle,
      SwaggerUIStandalonePreset: {},
    },
  );

  return {
    status: () => elements.get('tokenStatus')!,
    notice: () => elements.get('offlineNotice')!,
    click: (id: string) => clicks.get(id)!(),
    receive: (data: Record<string, unknown>) => onMessage({data}),
    authorization: () => options.requestInterceptor({headers: {}}).headers.Authorization,
    components: () => options.plugins[0]().components,
    messages,
  };
}

suite('API Browser webview authentication', () => {
  test('uses extension tokens initially and after refresh without Swagger authorization state', () => {
    const view = loadWebview('first-token');
    assert.strictEqual(view.authorization(), 'Bearer first-token');
    assert.strictEqual(view.status().textContent, 'Token acquired');
    view.click('refreshTokenBtn');
    assert.strictEqual(view.messages[0].type, 'refreshToken');
    assert.strictEqual(view.status().className, 'token-status pending');
    view.receive({type: 'updateToken', token: 'second-token'});
    assert.strictEqual(view.authorization(), 'Bearer second-token');
    assert.strictEqual(view.status().className, 'token-status ok');
  });

  test('shows an initial authentication failure instead of an indefinite pending status', () => {
    const view = loadWebview('', 'Check SLAS credentials. See Setup Help.');
    assert.strictEqual(view.status().className, 'token-status error');
    assert.match(view.status().textContent, /Check SLAS credentials/);
    assert.strictEqual(view.authorization(), undefined);
  });

  test('does not continue sending an old token after a failed refresh', () => {
    const view = loadWebview('old-token');
    view.receive({type: 'tokenError', error: 'Client access denied'});
    assert.strictEqual(view.authorization(), undefined);
    assert.match(view.status().textContent, /Client access denied/);
    view.receive({type: 'updateToken', token: 'recovered-token'});
    assert.strictEqual(view.authorization(), 'Bearer recovered-token');
  });

  test('removes global and operation authorization controls and provides setup help', () => {
    const view = loadWebview('token');
    const components = view.components();
    assert.strictEqual(components.authorizeBtn(), null);
    assert.strictEqual(components.authorizeOperationBtn(), null);
    assert.strictEqual(components.authorizationPopup(), null);
    view.click('setupHelpBtn');
    assert.strictEqual(view.messages[0].type, 'showSetupHelp');
  });

  test('shows the offline warning and sends no token when a bundled contract is displayed', () => {
    const view = loadWebview('', '', 'Live schema unavailable (no access). Showing the bundled contract.');
    assert.match(view.notice().textContent, /Live schema unavailable/);
    assert.strictEqual(view.status().textContent, 'Offline: read-only');
    assert.strictEqual(view.authorization(), undefined);
  });
});
