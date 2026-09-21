/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {McpE2EClient} from './stdio-client.js';

describe('CIP over stdio', function () {
  this.timeout(30_000);
  let client: McpE2EClient;

  before(async () => {
    client = new McpE2EClient({args: ['--toolsets', 'CIP']});
    await client.start();
  });

  after(async () => client.stop());

  it('provides offline report discovery and supporting documentation in the CIP toolset', async () => {
    const {tools} = (await client.call('tools/list')) as {tools: {name: string}[]};
    expect(tools.map(({name}) => name)).to.include.members([
      'cip_discover',
      'cip_query',
      'docs_read',
      'skills_read',
      'config_inspect',
    ]);
    const response = (await client.call('tools/call', {
      name: 'cip_discover',
      arguments: {query: 'sales analytics'},
    })) as {
      content: {text: string}[];
      isError?: boolean;
      structuredContent?: unknown;
    };
    expect(response.isError).not.to.equal(true);
    expect(response.structuredContent).to.equal(undefined);
    expect(JSON.parse(response.content[0].text).reports.map((r: {name: string}) => r.name)).to.include(
      'sales-analytics',
    );
  });

  it('requires acknowledgment before configuration and exposes the required resource', async () => {
    const response = (await client.call('tools/call', {name: 'cip_query', arguments: {sql: 'SELECT 1'}})) as {
      isError?: boolean;
      content: {text: string}[];
    };
    expect(response.isError).to.equal(true);
    expect(JSON.parse(response.content[0].text).error).to.include('CIP_SKILL_REQUIRED');
    const {contents} = (await client.call('resources/read', {uri: 'skill://mcp/cip/SKILL.md'})) as {
      contents: {text: string}[];
    };
    expect(contents[0].text).to.include('skill://b2c-cli/b2c-cip/SKILL.md');
    expect(contents[0].text).to.include('/guide/analytics-reports-cip-ccac');
  });
});
