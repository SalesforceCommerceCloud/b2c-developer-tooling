/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {ToolAnnotations} from '@modelcontextprotocol/server';
import {expect} from 'chai';
import {McpE2EClient} from './stdio-client.js';

// Reviewed effects, independent of factory metadata and annotation conversion.
const groups = [
  {
    names: [
      'skills_read',
      'config_inspect',
      'debug_list_sessions',
      'docs_list',
      'docs_search',
      'docs_schema_list',
      'docs_schema_search',
      'docs_schema_read',
      'logs_watch_poll',
      'mrt_logs_watch_poll',
    ],
    annotations: {readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false},
  },
  {
    names: [
      'docs_read',
      'debug_inspect',
      'debug_wait_for_stop',
      'logs_list_files',
      'logs_get_recent',
      'scapi_schemas_list',
      'scapi_custom_apis_get_status',
      'metrics_get',
      'logs_watch',
      'mrt_logs_watch',
    ],
    annotations: {readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true},
  },
  {
    names: ['debug_end_session', 'debug_set_breakpoints'],
    annotations: {readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true},
  },
  {
    names: ['mrt_bundle_push', 'debug_start_session', 'debug_control', 'debug_evaluate', 'debug_capture_at_breakpoint'],
    annotations: {readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true},
  },
  {
    names: ['cartridge_deploy'],
    annotations: {readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true},
  },
];

describe('tool effect annotations over stdio', function () {
  this.timeout(30_000);
  let client: McpE2EClient;

  before(async () => {
    client = new McpE2EClient({args: ['--allow-non-ga-tools']});
    await client.start();
  });

  after(async () => client.stop());

  it('publishes reviewed annotations for every tool, including mixed actions and optional metrics', async () => {
    const {tools} = (await client.call('tools/list')) as {
      tools: {name: string; annotations?: ToolAnnotations}[];
    };
    expect(tools.map(({name}) => name)).to.have.members(groups.flatMap(({names}) => names));
    for (const group of groups) {
      for (const name of group.names) {
        expect(tools.find((tool) => tool.name === name)?.annotations, name).to.deep.equal(group.annotations);
      }
    }
  });
});
