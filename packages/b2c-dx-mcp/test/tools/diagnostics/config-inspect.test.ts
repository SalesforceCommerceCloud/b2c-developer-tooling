/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {createConfigInspectTool} from '../../../src/tools/diagnostics/config-inspect.js';
import {Services} from '../../../src/services.js';
import type {ServicesResolutionInputs} from '../../../src/services.js';
import {createMockResolvedConfig, createMockLoadServices} from '../../test-helpers.js';
import type {ToolResult} from '../../../src/utils/types.js';
import type {NormalizedConfig, ConfigSourceInfo} from '@salesforce/b2c-tooling-sdk/config';
import type {SkillReference} from '../../../src/skill-references.js';

interface ConfigInspectOutput {
  config: Record<string, unknown>;
  resolution: {projectDirectory: {path: string; source: 'argument' | 'config' | 'cwd'}};
  sources: ConfigSourceInfo[];
  warnings?: string[];
  skillReferences?: SkillReference[];
}

function getResultJson<T>(result: ToolResult): T {
  const content = result.content[0];
  if (content.type !== 'text') {
    throw new Error(`Expected text content, got ${content.type}`);
  }
  return JSON.parse(content.text) as T;
}

function createServices(
  values: Partial<NormalizedConfig> = {},
  sources: ConfigSourceInfo[] = [],
  resolution?: ServicesResolutionInputs,
): Services {
  const config = createMockResolvedConfig(values);
  // Mock config helper does not accept sources; attach them for this test.
  (config as {sources: ConfigSourceInfo[]}).sources = sources;
  return new Services({resolvedConfig: config, resolution});
}

describe('config_inspect tool', () => {
  it('is registered in the DIAGNOSTICS toolset and does not require an instance', () => {
    const tool = createConfigInspectTool(createMockLoadServices(createServices()));
    expect(tool.name).to.equal('config_inspect');
    expect(tool.toolsets).to.include('DIAGNOSTICS');
  });

  it('masks sensitive values by default', async () => {
    const services = createServices({
      hostname: 'example.demandware.net',
      clientId: 'aaaa-bbbb',
      clientSecret: 'super-secret-value-1234',
      password: 'my-web-dav-password',
    });
    const tool = createConfigInspectTool(createMockLoadServices(services));

    const result = getResultJson<ConfigInspectOutput>(await tool.handler({}));

    expect(result.config.hostname).to.equal('example.demandware.net');
    expect(result.config.clientId).to.equal('aaaa-bbbb');
    expect(result.config.clientSecret).to.equal('supe...REDACTED');
    expect(result.config.password).to.equal('my-w...REDACTED');
    expect(result).not.to.have.property('skillReferences');
  });

  it('points source warnings to configuration guidance while preserving masked output and resolution', async () => {
    const config = createMockResolvedConfig({clientSecret: 'super-secret-value-1234'});
    config.warnings.push({
      code: 'SOURCE_ERROR',
      details: {source: 'dw.json'},
      message: 'Unable to load selected source',
    });
    const services = new Services({resolvedConfig: config});
    const response = await createConfigInspectTool(createMockLoadServices(services)).handler({});
    const result = getResultJson<ConfigInspectOutput>(response);
    expect(result.warnings).to.deep.equal(['Unable to load selected source']);
    expect(result.skillReferences).to.deep.equal([
      {uri: 'skill://mcp/b2c-config/SKILL.md', section: 'where-configuration-comes-from'},
    ]);
    expect(result.config.clientSecret).to.equal('supe...REDACTED');
    expect(response.structuredContent).to.deep.equal(result);
    expect(result).to.have.property('resolution');
  });

  it('shows secrets unmasked when unmask is true', async () => {
    const services = createServices({clientSecret: 'super-secret-value-1234'});
    const tool = createConfigInspectTool(createMockLoadServices(services));

    const result = getResultJson<ConfigInspectOutput>(await tool.handler({unmask: true}));

    expect(result.config.clientSecret).to.equal('super-secret-value-1234');
  });

  it('reports the configured project directory through canonical resolution', async () => {
    const services = createServices({projectDirectory: '/tmp/my-project'}, [], {
      projectDirectory: {path: '/tmp/my-project', source: 'config'},
    });
    const tool = createConfigInspectTool(createMockLoadServices(services));

    const result = getResultJson<ConfigInspectOutput>(await tool.handler({}));

    expect(result.resolution.projectDirectory).to.deep.equal({path: '/tmp/my-project', source: 'config'});
    expect(result).to.not.have.own.property('projectDirectory');
  });

  it('keeps cwd provenance when normalized configuration contains the implicit path', async () => {
    const services = createServices({projectDirectory: process.cwd(), workingDirectory: process.cwd()}, [], {
      projectDirectory: {path: process.cwd(), source: 'cwd'},
    });
    const tool = createConfigInspectTool(createMockLoadServices(services));

    const result = getResultJson<ConfigInspectOutput>(await tool.handler({}));

    expect(result.config.projectDirectory).to.equal(process.cwd());
    expect(result.resolution.projectDirectory).to.deep.equal({path: process.cwd(), source: 'cwd'});
    expect(result).to.not.have.own.property('projectDirectory');
  });

  it('includes contributing sources', async () => {
    const sources: ConfigSourceInfo[] = [{name: 'dw.json', location: '/tmp/dw.json', fields: ['hostname']}];
    const services = createServices({hostname: 'example.demandware.net'}, sources);
    const tool = createConfigInspectTool(createMockLoadServices(services));

    const result = getResultJson<ConfigInspectOutput>(await tool.handler({}));

    expect(result.sources).to.have.lengthOf(1);
    expect(result.sources[0].name).to.equal('dw.json');
  });
});
