/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as assert from 'assert';
import {
  isJobsDefinitionXml,
  parseJobsXml,
  parseStepTypesJson,
  referencedStepTypes,
} from '../jobs/job-definitions-parser.js';

const JOBS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<jobs xmlns="http://www.demandware.com/xml/impex/jobs/2015-07-01">
  <job job-id="my-nightly-export">
    <description>Nightly product export</description>
    <flow>
      <context site-id="RefArch"/>
      <step step-id="my-nightly-export-step" type="custom.ProductExport"/>
    </flow>
    <triggers/>
  </job>
  <job job-id="cleanup">
    <flow>
      <step type="custom.Cleanup" step-id="cleanup-step"/>
    </flow>
    <triggers/>
  </job>
</jobs>`;

const STEPTYPES_JSON = `{
  "step-types": {
    "script-module-step": [
      {
        "@type-id": "custom.ProductExport",
        "module": "app_custom/cartridge/scripts/jobsteps/productExport.js",
        "function": "execute",
        "description": "Exports products"
      }
    ],
    "chunk-script-module-step": [
      {
        "@type-id": "custom.BulkImport",
        "module": "app_custom/cartridge/scripts/jobsteps/bulkImport.js",
        "chunk-size": 100
      }
    ]
  }
}`;

suite('job-definitions-parser', () => {
  suite('parseJobsXml', () => {
    test('parses jobs, descriptions, and steps', () => {
      const jobs = parseJobsXml(JOBS_XML);
      assert.strictEqual(jobs.length, 2);

      const [exportJob, cleanupJob] = jobs;
      assert.strictEqual(exportJob.jobId, 'my-nightly-export');
      assert.strictEqual(exportJob.description, 'Nightly product export');
      assert.deepStrictEqual(exportJob.steps, [{stepId: 'my-nightly-export-step', type: 'custom.ProductExport'}]);

      // Handles type-before-step-id attribute order.
      assert.strictEqual(cleanupJob.jobId, 'cleanup');
      assert.deepStrictEqual(cleanupJob.steps, [{stepId: 'cleanup-step', type: 'custom.Cleanup'}]);
    });

    test('returns empty array for non-jobs content', () => {
      assert.deepStrictEqual(parseJobsXml('<not-jobs/>'), []);
    });

    test('lists self-closing job elements without steps', () => {
      const jobs = parseJobsXml('<jobs><job job-id="solo"/></jobs>');
      assert.strictEqual(jobs.length, 1);
      assert.strictEqual(jobs[0].jobId, 'solo');
      assert.deepStrictEqual(jobs[0].steps, []);
    });
  });

  suite('parseStepTypesJson', () => {
    test('parses task and chunk step types', () => {
      const types = parseStepTypesJson(STEPTYPES_JSON);
      assert.strictEqual(types.length, 2);

      const task = types.find((t) => t.typeId === 'custom.ProductExport');
      assert.ok(task);
      assert.strictEqual(task!.kind, 'task');
      assert.strictEqual(task!.module, 'app_custom/cartridge/scripts/jobsteps/productExport.js');

      const chunk = types.find((t) => t.typeId === 'custom.BulkImport');
      assert.ok(chunk);
      assert.strictEqual(chunk!.kind, 'chunk');
    });

    test('returns empty array for malformed JSON', () => {
      assert.deepStrictEqual(parseStepTypesJson('{ not valid'), []);
    });

    test('returns empty array when step-types missing', () => {
      assert.deepStrictEqual(parseStepTypesJson('{"other": {}}'), []);
    });
  });

  suite('referencedStepTypes', () => {
    test('returns distinct step types across all jobs', () => {
      const types = referencedStepTypes(JOBS_XML).sort();
      assert.deepStrictEqual(types, ['custom.Cleanup', 'custom.ProductExport']);
    });
  });

  suite('isJobsDefinitionXml', () => {
    test('accepts documents in the jobs namespace', () => {
      assert.strictEqual(isJobsDefinitionXml(JOBS_XML), true);
    });

    test('accepts documents with a job element even without the namespace', () => {
      assert.strictEqual(isJobsDefinitionXml('<jobs><job job-id="x"><triggers/></job></jobs>'), true);
    });

    test('rejects unrelated XML (e.g. catalog/inventory)', () => {
      assert.strictEqual(
        isJobsDefinitionXml('<catalog xmlns="http://www.demandware.com/xml/impex/catalog/2006-10-31"></catalog>'),
        false,
      );
    });
  });
});
