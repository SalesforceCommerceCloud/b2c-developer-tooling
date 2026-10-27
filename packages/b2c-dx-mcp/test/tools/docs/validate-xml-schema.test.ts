/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Services} from '../../../src/services.js';
import {createMockResolvedConfig} from '../../test-helpers.js';
import {createValidateXmlSchemaTool} from '../../../src/tools/docs/validate-xml-schema.js';
import type {ToolResult} from '../../../src/utils/index.js';

const INVENTORY_NS = 'http://www.demandware.com/xml/impex/inventory/2007-05-31';

function inventory(instock: string): string {
  return `<?xml version="1.0"?>
<inventory xmlns="${INVENTORY_NS}">
  <inventory-list>
    <header list-id="inventory"><default-instock>${instock}</default-instock></header>
  </inventory-list>
</inventory>
`;
}

interface Output {
  failedFiles: number;
  moreFiles?: number;
  files: Array<{errorCount: number; errors: Array<{line: number}>; file: string; schema?: string; status: string}>;
  skippedFiles: number;
  totalFiles: number;
  unmatched?: string[];
  valid: boolean;
  validFiles: number;
}

function json(result: ToolResult): Output {
  const text = result.content[0];
  if (text?.type !== 'text') throw new Error('Expected text content');
  return JSON.parse(text.text);
}

describe('tools/docs/validate_xml_schema', () => {
  const tool = createValidateXmlSchemaTool(() => new Services({resolvedConfig: createMockResolvedConfig()}));
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'b2c-mcp-validate-'));
  });

  afterEach(() => rmSync(root, {recursive: true, force: true}));

  function write(name: string, contents: string): void {
    mkdirSync(join(root, name, '..'), {recursive: true});
    writeFileSync(join(root, name), contents);
  }

  it('is a closed-world read in every toolset', () => {
    expect(tool).to.include({effect: 'read', idempotent: true, openWorld: false});
    expect(tool.toolsets).to.include('CARTRIDGES');
    expect(tool.inputSchema).to.have.property('projectDirectory');
  });

  it('validates inline content', async () => {
    const ok = json(await tool.handler({content: inventory('true')}));
    expect(ok).to.include({valid: true, totalFiles: 1, validFiles: 1});
    expect(ok.files).to.deep.equal([]);

    const bad = json(await tool.handler({content: inventory('maybe')}));
    expect(bad).to.include({valid: false, failedFiles: 1});
    expect(bad.files[0]).to.include({file: '<content>', schema: 'inventory', status: 'fail', errorCount: 1});
    expect(bad.files[0].errors[0].line).to.equal(4);
  });

  it('validates files relative to projectDirectory, listing only files with problems', async () => {
    write('site/good.xml', inventory('true'));
    write('site/bad.xml', inventory('maybe'));
    write('site/other.xml', '<root xmlns="urn:example"/>');

    const result = json(await tool.handler({paths: ['site', 'missing.xml'], projectDirectory: root}));

    expect(result).to.include({valid: false, totalFiles: 3, validFiles: 1, failedFiles: 1, skippedFiles: 1});
    expect(result.files.map((f) => [f.file, f.status])).to.deep.equal([
      [join('site', 'bad.xml'), 'fail'],
      [join('site', 'other.xml'), 'skip'],
    ]);
    expect(result.unmatched).to.deep.equal(['missing.xml']);
  });

  it('applies an explicit schema and rejects ambiguous input', async () => {
    const result = json(await tool.handler({content: inventory('true'), schema: 'catalog'}));
    expect(result.files[0]).to.include({schema: 'catalog', status: 'fail'});

    const neither = await tool.handler({});
    expect(neither.isError).to.equal(true);
    const both = await tool.handler({content: '<a/>', paths: ['a.xml']});
    expect(both.isError).to.equal(true);
  });

  it('caps the listed files, putting failures before skipped files', async () => {
    for (let i = 0; i < 60; i++) write(`site/a-skip-${String(i).padStart(2, '0')}.xml`, '<root xmlns="urn:example"/>');
    write('site/z-bad.xml', inventory('maybe'));

    const result = json(await tool.handler({paths: ['site'], projectDirectory: root}));

    expect(result).to.include({totalFiles: 61, failedFiles: 1, skippedFiles: 60, moreFiles: 11});
    expect(result.files).to.have.length(50);
    expect(result.files[0]).to.include({file: join('site', 'z-bad.xml'), status: 'fail'});
  });
});
