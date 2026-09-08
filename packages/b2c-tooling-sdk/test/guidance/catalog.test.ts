/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {createHash} from 'node:crypto';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync, renameSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect} from 'chai';
import {
  GuidanceCatalog,
  guidanceHeadings,
  type GuidanceManifest,
  type GuidanceRead,
  type GuidancePage,
} from '@salesforce/b2c-tooling-sdk/guidance';

describe('offline guidance catalog', () => {
  let root: string;
  let manifest: GuidanceManifest;
  const unicode = String.fromCodePoint(0x1f680);
  const content = `# Deploy\n\n${`Deploy cartridges ${unicode}.\n`.repeat(5000)}\n## Cleanup\n\nVerify deployment.\n`;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'b2c-guidance-'));
    manifest = {
      version: 1,
      collections: [
        {id: 'b2c', title: 'B2C', isGA: true},
        {id: 'next', title: 'Next', isGA: false, workspaces: ['storefront-next']},
      ],
      entries: [],
    };
    for (const collection of manifest.collections) {
      const id = `${collection.id}/deploy`;
      mkdirSync(join(root, id, 'references'), {recursive: true});
      const files = [
        {path: 'SKILL.md', content},
        {path: 'references/cleanup.md', content: '# Cleanup\nDone.\n'},
      ];
      for (const file of files) writeFileSync(join(root, id, file.path), file.content);
      manifest.entries.push({
        id,
        collection: collection.id,
        title: 'Deploy cartridges',
        description: 'Deploy cartridges with cleanup',
        entrypoint: 'SKILL.md',
        featured: true,
        source: `skills/${id}/SKILL.md`,
        headings: 'Deploy Cleanup',
        files: files.map((file) => ({
          path: file.path,
          hash: createHash('sha256').update(file.content).digest('hex'),
          bytes: Buffer.byteLength(file.content),
        })),
      });
    }
    writeFileSync(join(root, 'index.json'), JSON.stringify(manifest));
  });
  afterEach(() => rmSync(root, {recursive: true, force: true}));

  it('reconstructs Unicode content exactly with bounded stateless continuation', () => {
    const catalog = new GuidanceCatalog(root);
    let read = catalog.read({id: 'b2c/deploy'}) as GuidanceRead;
    let reconstructed = read.content;
    while (!read.complete) {
      expect(Buffer.byteLength(JSON.stringify(read))).to.be.lessThan(30 * 1024);
      expect(read.content).not.to.include('\uFFFD');
      read = catalog.read({cursor: read.nextCursor}) as GuidanceRead;
      reconstructed += read.content;
    }
    expect(reconstructed).to.equal(content);
    expect(read.nextCursor).to.equal(undefined);
    expect(() => catalog.readResource('skill://b2c/deploy/SKILL.md')).to.throw('Use skills_read');
  });

  it('has identical resource, ID, and URI reference reads and supports sections', () => {
    const catalog = new GuidanceCatalog(root);
    expect(catalog.resources()[0]).to.include({
      uri: 'skill://b2c/deploy/SKILL.md',
      description: 'Deploy cartridges with cleanup',
    });
    expect(catalog.read({uri: 'skill://b2c/deploy/SKILL.md'})).to.deep.equal(catalog.read({id: 'b2c/deploy'}));
    const uri = 'skill://b2c/deploy/references/cleanup.md';
    const idRead = catalog.read({id: 'b2c/deploy', file: 'references/cleanup.md'}) as GuidanceRead;
    expect(idRead.source).to.equal('skills/b2c/deploy/references/cleanup.md');
    expect(catalog.read({uri})).to.deep.equal(idRead);
    expect(catalog.readResource(uri)).to.equal(idRead.content);
    expect((catalog.read({id: 'b2c/deploy', section: 'cleanup'}) as GuidanceRead).content).to.equal(
      '## Cleanup\n\nVerify deployment.\n',
    );
    expect(() => catalog.read({id: 'b2c/deploy', section: 'missing'})).to.throw('Unknown section');
  });

  it('lists only featured entrypoints while allowing all catalog files through resources', () => {
    manifest.entries[0].featured = false;
    writeFileSync(join(root, 'index.json'), JSON.stringify(manifest));
    const catalog = new GuidanceCatalog(root, {allowNonGa: true});
    expect(catalog.resources().map((resource) => resource.name)).to.deep.equal(['next/deploy']);
    const page = catalog.read({collection: 'b2c'}) as GuidancePage;
    expect(page.entries[0].id).to.equal('b2c/deploy');
    expect(page.entries[0].uri).to.equal('skill://b2c/deploy/SKILL.md');
    const read = catalog.read({id: 'b2c/deploy', file: 'references/cleanup.md'}) as GuidanceRead;
    expect(read.content).to.equal('# Cleanup\nDone.\n');
    expect(read.uri).to.equal('skill://b2c/deploy/references/cleanup.md');
    expect(catalog.readResource(read.uri)).to.equal(read.content);
    expect(catalog.readResource('skill://index')).to.include('[b2c/deploy](skill://b2c/deploy/SKILL.md)');
    expect(catalog.readResource('skill://index')).to.include('[next/deploy](skill://next/deploy/SKILL.md)');
    expect(catalog.read({uri: 'skill://index'})).to.deep.equal(catalog.read({}));
    expect(() => catalog.read({uri: 'skill://index', section: 'b2c'})).to.throw('index URI alone');
  });

  it('enforces collection and GA exposure on search, exact reads, resources, and cursors', () => {
    const all = new GuidanceCatalog(root, {allowNonGa: true});
    const cursor = (all.read({id: 'next/deploy'}) as GuidanceRead).nextCursor;
    const ga = new GuidanceCatalog(root);
    expect((ga.read({query: 'deploy'}) as GuidancePage).entries.map((entry) => entry.id)).to.deep.equal(['b2c/deploy']);
    expect(() => ga.read({id: 'next/deploy'})).to.throw('not available');
    expect(() => ga.read({cursor})).to.throw('not available');
    expect(() => ga.readResource('skill://next/deploy/SKILL.md')).to.throw('not available');
    expect(ga.readResource('skill://index')).to.include('skill://b2c/deploy/SKILL.md').and.not.include('next/deploy');
    const restricted = new GuidanceCatalog(root, {allowNonGa: true, collections: ['next']});
    expect(() => restricted.read({id: 'b2c/deploy'})).to.throw('not available');
    expect(() => restricted.readResource('skill://b2c/deploy/references/cleanup.md')).to.throw('not available');
    expect(restricted.readResource('skill://index')).to.include('next/deploy').and.not.include('b2c/deploy');
    expect(
      (all.read({query: 'deploy', workspace: 'storefront-next'}) as GuidancePage).entries.map((entry) => entry.id),
    ).to.deep.equal(['next/deploy', 'b2c/deploy']);
  });

  it('rejects traversal, encodings, unlisted files, conflicting selectors, and malformed cursors', () => {
    const catalog = new GuidanceCatalog(root);
    for (const file of ['../SKILL.md', '%2e%2e/SKILL.md', 'references/../../SKILL.md', '/SKILL.md', 'C:\\SKILL.md']) {
      expect(() => catalog.read({id: 'b2c/deploy', file})).to.throw();
    }
    for (const uri of [
      'file:///etc/passwd',
      'skill://index?collection=next',
      'skill://index/../index',
      'skill://b2c/deploy?x=1',
      'skill://b2c/deploy#cleanup',
      'skill://b2c/deploy/',
      'skill://b2c/../deploy',
      'skill://b2c/%64eploy',
      'skill://b2c/deploy/../deploy/SKILL.md',
      'skill://b2c/deploy/%53KILL.md',
    ]) {
      expect(() => catalog.readResource(uri)).to.throw();
    }
    expect(() => catalog.read({id: 'b2c/deploy', file: 'unlisted.md'})).to.throw('not available');
    expect(() => catalog.read({id: 'b2c/deploy', query: 'deploy'})).to.throw('Exact reads');
    expect(() => catalog.read({id: 'b2c/deploy', uri: 'anything'})).to.throw('Use id or uri');
    expect(() => catalog.read({cursor: 'invalid'})).to.throw('Invalid continuation');
    const cursor = (catalog.read({id: 'b2c/deploy'}) as GuidanceRead).nextCursor;
    expect(() => catalog.read({cursor, offset: 0})).to.throw('cursor alone');
    expect(() => catalog.read({limit: 21})).to.throw('limit 1-20');
  });

  it('rejects symlink leaves and parent directories', () => {
    const catalog = new GuidanceCatalog(root);
    const reference = join(root, 'b2c/deploy/references/cleanup.md');
    rmSync(reference);
    symlinkSync(join(root, 'next/deploy/references/cleanup.md'), reference);
    expect(() => catalog.read({id: 'b2c/deploy', file: 'references/cleanup.md'})).to.throw('Symbolic links');
    rmSync(reference);
    renameSync(join(root, 'b2c/deploy/references'), join(root, 'original'));
    symlinkSync(join(root, 'next/deploy/references'), join(root, 'b2c/deploy/references'), 'dir');
    expect(() => catalog.read({id: 'b2c/deploy', file: 'references/cleanup.md'})).to.throw('Symbolic links');
  });

  it('rejects changed content and stale cursors even after a new manifest is loaded', () => {
    const catalog = new GuidanceCatalog(root);
    const cursor = (catalog.read({id: 'b2c/deploy'}) as GuidanceRead).nextCursor;
    writeFileSync(join(root, 'b2c/deploy/SKILL.md'), `${content}changed`);
    expect(() => catalog.read({cursor})).to.throw('changed since packaging');
    manifest.entries[0].files[0].hash = createHash('sha256').update(`${content}changed`).digest('hex');
    writeFileSync(join(root, 'index.json'), JSON.stringify(manifest));
    expect(() => new GuidanceCatalog(root).read({cursor})).to.throw('Cursor content changed');
  });

  it('generates unique heading IDs and ignores examples inside fences', () => {
    const headings = guidanceHeadings(
      '---\nname: x\n---\n# Read\n```md\n# Fake\n```\n## Read\n# Read-1\n~~~\n# Fake\n~~~\n# Read\n',
    );
    expect(headings.map((heading) => heading.id)).to.deep.equal(['read', 'read-1', 'read-1-1', 'read-2']);
  });
});
