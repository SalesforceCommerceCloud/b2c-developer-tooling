/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {isNewerVersion, isUpdateCheckDisabled, UpdateCheck} from '../src/update-check.js';

const DAY = 86_400_000;

describe('update check', () => {
  let dir: string;
  let cacheFile: string;
  let requests: string[];

  const registry = (body: unknown, status = 200): typeof fetch =>
    (async (url: string | URL) => {
      requests.push(String(url));
      return new Response(JSON.stringify(body), {status});
    }) as typeof fetch;

  const create = (options: {fetch?: typeof fetch; now?: number; env?: NodeJS.ProcessEnv; currentVersion?: string}) =>
    new UpdateCheck({
      packageName: '@salesforce/b2c-dx-mcp',
      currentVersion: options.currentVersion ?? '1.2.3',
      cacheFile,
      env: options.env ?? {},
      fetch: options.fetch ?? registry({latest: '1.3.0'}),
      now: () => options.now ?? 10 * DAY,
    });

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'mcp-update-'));
    cacheFile = path.join(dir, 'nested', 'mcp-update.json');
    requests = [];
  });

  afterEach(() => rmSync(dir, {recursive: true, force: true}));

  it('compares release versions only', () => {
    expect(isNewerVersion('1.10.0', '1.9.9')).to.equal(true);
    expect(isNewerVersion('2.0.0', '2.0.0')).to.equal(false);
    expect(isNewerVersion('1.0.0', '1.0.1')).to.equal(false);
    expect(isNewerVersion('2.0.0-beta.1', '1.0.0')).to.equal(false);
    expect(isNewerVersion('2.0.0', '0.0.0-dev')).to.equal(false);
  });

  it('is disabled by its own variable, telemetry opt-outs, and CI', () => {
    expect(isUpdateCheckDisabled({})).to.equal(false);
    expect(isUpdateCheckDisabled({SFCC_DISABLE_UPDATE_CHECK: 'true'})).to.equal(true);
    expect(isUpdateCheckDisabled({SFCC_DISABLE_TELEMETRY: '1'})).to.equal(true);
    expect(isUpdateCheckDisabled({SF_DISABLE_TELEMETRY: 'true'})).to.equal(true);
    expect(isUpdateCheckDisabled({CI: 'true'})).to.equal(true);
    expect(isUpdateCheckDisabled({CI: 'false', SFCC_DISABLE_UPDATE_CHECK: 'false'})).to.equal(false);
  });

  it('fetches the latest dist-tag, caches it, and reports it on the next start', async () => {
    const first = create({});
    expect(first.note()).to.equal(undefined);
    await first.refresh();
    expect(requests).to.deep.equal(['https://registry.npmjs.org/-/package/%40salesforce%2Fb2c-dx-mcp/dist-tags']);
    expect(first.status()).to.deep.equal({current: '1.2.3', latest: '1.3.0', updateAvailable: true});
    expect(JSON.parse(readFileSync(cacheFile, 'utf8'))).to.deep.equal({latest: '1.3.0', checkedAt: 10 * DAY});

    const next = create({});
    expect(next.note()).to.equal(
      'b2c-dx-mcp 1.3.0 is available (running 1.2.3). To upgrade, update the agent plugin or MCP server configuration and restart.',
    );
    await next.refresh();
    expect(requests).to.have.length(1);
  });

  it('refreshes a day-old cache and uses the configured registry', async () => {
    writeFileSync(path.join(dir, 'mcp-update.json'), JSON.stringify({latest: '1.2.3', checkedAt: 8 * DAY}));
    cacheFile = path.join(dir, 'mcp-update.json');
    const check = create({env: {npm_config_registry: 'https://registry.example.com/npm'}});
    expect(check.note()).to.equal(undefined);
    await check.refresh();
    expect(requests[0]).to.equal('https://registry.example.com/npm/-/package/%40salesforce%2Fb2c-dx-mcp/dist-tags');
    expect(check.status().latest).to.equal('1.3.0');
  });

  it('ignores registry failures and retries at most hourly', async () => {
    const check = create({fetch: registry({}, 503)});
    await check.refresh();
    await check.refresh();
    expect(requests).to.have.length(1);
    expect(check.status()).to.deep.equal({current: '1.2.3'});
  });

  it('makes no request and reads no cache when disabled', async () => {
    writeFileSync(path.join(dir, 'mcp-update.json'), JSON.stringify({latest: '9.0.0', checkedAt: 10 * DAY}));
    cacheFile = path.join(dir, 'mcp-update.json');
    const check = create({env: {SFCC_DISABLE_UPDATE_CHECK: 'true'}});
    await check.refresh();
    expect(requests).to.have.length(0);
    expect(check.note()).to.equal(undefined);
  });
});
