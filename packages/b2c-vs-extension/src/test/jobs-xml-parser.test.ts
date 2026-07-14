/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import * as path from 'path';
import {
  detectCartridgeName,
  extractJobBlockXml,
  extractJobIdsFromXml,
  findJobBlockOffset,
  stripXmlComments,
} from '../jobs/jobs-xml-parser.js';

suite('jobs-xml-parser', () => {
  suite('extractJobIdsFromXml', () => {
    test('parses the canonical double-quoted form', () => {
      const xml = `<?xml version="1.0"?>
<jobs xmlns="http://www.demandware.com/xml/impex/jobs/2015-07-01">
  <job job-id="my-job"><description>x</description><flow/><triggers/></job>
</jobs>`;
      assert.deepStrictEqual(extractJobIdsFromXml(xml), ['my-job']);
    });

    test('tolerates attributes appearing in any order', () => {
      const xml = `<job name="ignored" job-id="import"><flow/><triggers/></job>`;
      assert.deepStrictEqual(extractJobIdsFromXml(xml), ['import']);
    });

    test('tolerates single-quoted attribute values', () => {
      const xml = `<job job-id='single-quoted'><flow/><triggers/></job>`;
      assert.deepStrictEqual(extractJobIdsFromXml(xml), ['single-quoted']);
    });

    test('tolerates whitespace around the attribute equals sign', () => {
      const xml = `<job job-id = "spaced-equals"><flow/><triggers/></job>`;
      assert.deepStrictEqual(extractJobIdsFromXml(xml), ['spaced-equals']);
    });

    test('ignores commented-out job blocks — disabled jobs must not populate the tree', () => {
      const xml = `<jobs>
  <!-- <job job-id="disabled"><flow/><triggers/></job> -->
  <job job-id="live"><flow/><triggers/></job>
</jobs>`;
      assert.deepStrictEqual(extractJobIdsFromXml(xml), ['live']);
    });

    test('ignores multi-line commented-out job blocks', () => {
      const xml = `<jobs>
  <!--
    <job job-id="also-disabled">
      <flow/><triggers/>
    </job>
  -->
  <job job-id="also-live"><flow/><triggers/></job>
</jobs>`;
      assert.deepStrictEqual(extractJobIdsFromXml(xml), ['also-live']);
    });

    test('returns each id once even if declared multiple times', () => {
      const xml = `<jobs>
  <job job-id="dup"><flow/><triggers/></job>
  <job job-id="dup"><flow/><triggers/></job>
</jobs>`;
      assert.deepStrictEqual(extractJobIdsFromXml(xml), ['dup']);
    });

    test('preserves file order across multiple jobs', () => {
      const xml = `<jobs>
  <job job-id="second"><flow/><triggers/></job>
  <job job-id="first"><flow/><triggers/></job>
</jobs>`;
      assert.deepStrictEqual(extractJobIdsFromXml(xml), ['second', 'first']);
    });

    test('returns empty array when no jobs are declared', () => {
      assert.deepStrictEqual(extractJobIdsFromXml('<jobs></jobs>'), []);
      assert.deepStrictEqual(extractJobIdsFromXml(''), []);
    });
  });

  suite('extractJobBlockXml', () => {
    test('returns the full <job>…</job> block for a matching id', () => {
      const xml = `<jobs>
  <job job-id="target"><description>x</description><flow/><triggers/></job>
</jobs>`;
      const block = extractJobBlockXml(xml, 'target');
      assert.ok(block?.startsWith('<job job-id="target">'));
      assert.ok(block?.endsWith('</job>'));
    });

    test('returns undefined when the id is only inside a comment', () => {
      const xml = `<jobs>
  <!-- <job job-id="commented"><flow/><triggers/></job> -->
</jobs>`;
      assert.strictEqual(extractJobBlockXml(xml, 'commented'), undefined);
    });

    test('handles single-quoted attributes', () => {
      const xml = `<jobs><job job-id='sq'><flow/><triggers/></job></jobs>`;
      const block = extractJobBlockXml(xml, 'sq');
      assert.ok(block?.startsWith("<job job-id='sq'>"));
    });

    test('is exact — different job-id returns undefined', () => {
      const xml = `<jobs><job job-id="alpha"><flow/><triggers/></job></jobs>`;
      assert.strictEqual(extractJobBlockXml(xml, 'beta'), undefined);
    });
  });

  suite('findJobBlockOffset', () => {
    test('returns the offset of the opening tag in the original text', () => {
      const xml = `<jobs>\n  <job job-id="hop">...</job>\n</jobs>`;
      const offset = findJobBlockOffset(xml, 'hop');
      assert.notStrictEqual(offset, undefined);
      assert.strictEqual(xml.slice(offset!, offset! + 5), '<job ');
    });

    test('returns undefined when the id is only inside a comment', () => {
      const xml = `<jobs><!-- <job job-id="ghost"/> --></jobs>`;
      assert.strictEqual(findJobBlockOffset(xml, 'ghost'), undefined);
    });

    test('skips a comment before the real block and still points at the real tag', () => {
      // A comment containing a similarly-named block precedes the real one.
      // The returned offset must land on the real tag, not inside the comment,
      // so opening the file jumps the user to the live definition.
      const xml = `<jobs>
  <!-- old:
    <job job-id="renamed"><flow/></job>
  -->
  <job job-id="renamed"><flow/><triggers/></job>
</jobs>`;
      const offset = findJobBlockOffset(xml, 'renamed');
      assert.notStrictEqual(offset, undefined);
      // Verify we're at the live tag, not inside the <!-- --> block.
      assert.ok(!xml.slice(0, offset!).endsWith('<!-- old:\n    '));
      assert.strictEqual(xml.slice(offset!, offset! + 20), '<job job-id="renamed');
    });
  });

  suite('detectCartridgeName', () => {
    test('prefers a known cartridge root over the path heuristic', () => {
      // Non-standard layout: cartridge lives directly under src/, no
      // `.../cartridge/...` segment in the jobs.xml path. Path heuristic would
      // fall back to the immediate parent dir ("app_storefront_base") but only
      // by coincidence — supplied roots make the label authoritative.
      const jobsPath = path.join('/repo', 'src', 'app_storefront_base', 'jobs.xml');
      const roots = [{name: 'app_storefront_base', src: path.join('/repo', 'src', 'app_storefront_base')}];
      assert.strictEqual(detectCartridgeName(jobsPath, roots), 'app_storefront_base');
    });

    test('picks the deepest matching root when cartridges nest', () => {
      // Contrived but tests the tiebreak — longest src prefix wins so an inner
      // cartridge label overrides an outer one.
      const jobsPath = path.join('/repo', 'outer', 'inner', 'cartridge', 'jobs.xml');
      const roots = [
        {name: 'outer', src: path.join('/repo', 'outer')},
        {name: 'inner', src: path.join('/repo', 'outer', 'inner')},
      ];
      assert.strictEqual(detectCartridgeName(jobsPath, roots), 'inner');
    });

    test('falls back to the path heuristic when no known roots are supplied', () => {
      const jobsPath = path.join('/repo', 'app_custom_core', 'cartridge', 'jobs.xml');
      assert.strictEqual(detectCartridgeName(jobsPath), 'app_custom_core');
    });

    test('exact-match segment lookup does not false-match on longer names', () => {
      // "my-cartridge-utils" contains "cartridge" as a substring, but the
      // segment lookup checks for an exact "cartridge" folder — no false match.
      const jobsPath = path.join('/repo', 'my-cartridge-utils', 'jobs.xml');
      assert.strictEqual(detectCartridgeName(jobsPath), 'my-cartridge-utils');
    });

    test('exact-match segment lookup does not false-match on the plural container', () => {
      // A top-level `cartridges/` container is a common layout — the heuristic
      // must not treat that segment as the canonical `cartridge` marker.
      const jobsPath = path.join('/repo', 'cartridges', 'app_custom_core', 'jobs.xml');
      assert.strictEqual(detectCartridgeName(jobsPath), 'app_custom_core');
    });

    test('returns the parent directory as a last-resort label', () => {
      // Nothing to anchor on — no known roots, no `cartridge` segment. We still
      // return a label so tree rows aren't unlabeled.
      const jobsPath = path.join('/tmp', 'ad-hoc', 'jobs.xml');
      assert.strictEqual(detectCartridgeName(jobsPath), 'ad-hoc');
    });
  });

  suite('stripXmlComments', () => {
    test('removes a single-line comment', () => {
      assert.strictEqual(stripXmlComments('a<!-- x -->b'), 'ab');
    });

    test('removes multi-line comments', () => {
      assert.strictEqual(stripXmlComments('a<!--\nline1\nline2\n-->b'), 'ab');
    });

    test('leaves comment-free XML untouched', () => {
      const xml = '<a><b/></a>';
      assert.strictEqual(stripXmlComments(xml), xml);
    });
  });
});
