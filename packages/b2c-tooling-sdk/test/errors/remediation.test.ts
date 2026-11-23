/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {expect} from 'chai';
import {guidanceHeadings} from '@salesforce/b2c-tooling-sdk/guidance';
import {REMEDIATION_DOCS, describeRemediation, withRemediationHint} from '@salesforce/b2c-tooling-sdk/errors';

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));

describe('errors/remediation', () => {
  // Messages as reported in telemetry for each failure.
  const cases: Array<[string, string]> = [
    [
      'Failed to get access token: 400 Bad Request - {"error":"invalid_scope","error_description":"Invalid scopes: SALESFORCE_COMMERCE_API:zzxy_prd sfcc.object-definitions"}',
      'account-manager-scope-rejected',
    ],
    [
      'Failed to get access token: 400 Bad Request - {"error":"invalid_scope","error_description":"Unknown/invalid tenant scope: SALESFORCE_COMMERCE_API:zzxy_prd"}',
      'account-manager-tenant-rejected',
    ],
    [
      'Failed to get access token: 401 Unauthorized - {"error":"invalid_client","error_description":"Client authentication failed"}',
      'account-manager-client-rejected',
    ],
    [
      "Failed to fetch sites: Access to resource 'GET /data/v25_6/sites' isn't allowed for the current client.",
      'ocapi-permission',
    ],
    ['PROPFIND failed: 404 Not Found', 'webdav-not-found'],
    ['GET failed: 404 Not Found', 'webdav-not-found'],
    ['PROPFIND failed: 401 Unauthorized', 'webdav-unauthorized'],
    ['Deployment failed: PUT failed: 403 Forbidden', 'webdav-unauthorized'],
  ];

  for (const [message, kind] of cases) {
    it(`recognizes ${kind}: ${message.slice(0, 50)}`, () => {
      expect(describeRemediation(new Error(message))?.kind).to.equal(kind);
    });
  }

  it('leaves unrelated errors alone', () => {
    expect(describeRemediation(new Error('fetch failed'))).to.equal(undefined);
    expect(describeRemediation(new Error('Import failed: ERROR'))).to.equal(undefined);
    expect(describeRemediation(undefined)).to.equal(undefined);
  });

  it('does not repeat advice the error already gives', () => {
    expect(
      describeRemediation(
        'Cannot list Logs: PROPFIND failed: 401 Unauthorized. API client abc was refused. Grant it read access to "/logs" in Business Manager under Administration > Organization > WebDAV Client Permissions.',
      ),
    ).to.equal(undefined);
    expect(
      describeRemediation(
        "Access to resource 'GET /data/v25_6/sites' isn't allowed for the current client.\nTo allow it, add this resource for the client ID in Business Manager (Administration > Site Development > Open Commerce API Settings, type Data API, context Global)",
      ),
    ).to.equal(undefined);
    expect(describeRemediation('SCAPI_SCOPE_MISSING: Admin authentication rejected scopes (invalid_scope)')).to.equal(
      undefined,
    );
  });

  it('appends the hint and documentation link for terminal output', () => {
    const message = withRemediationHint('PROPFIND failed: 401 Unauthorized');
    expect(message).to.match(/^PROPFIND failed: 401 Unauthorized\n\n.*WebDAV Client Permissions/s);
    expect(message).to.contain(`See: ${REMEDIATION_DOCS.webdav.url}`);
    expect(withRemediationHint('fetch failed')).to.equal('fetch failed');
  });

  describe('documentation targets', () => {
    const index = JSON.parse(readFileSync(new URL('../../data/tooling/index.json', import.meta.url), 'utf8')) as {
      entries: Array<{id: string; url: string}>;
    };

    for (const [name, target] of Object.entries(REMEDIATION_DOCS)) {
      it(`${name} names an indexed page and an existing heading`, () => {
        const entry = index.entries.find((item) => item.id === target.id);
        expect(entry, target.id).to.not.equal(undefined);
        expect(target.url.split('#')[0]).to.equal(entry!.url);
        const page = entry!.url.split('/b2c-developer-tooling/')[1].replace(/\.html$/, '.md');
        const headings = guidanceHeadings(readFileSync(`${repoRoot}docs/${page}`, 'utf8'));
        const heading = headings.find((item) => item.id === target.section);
        expect(heading?.title, `${target.section} in docs/${page}`).to.equal(target.heading);
      });
    }
  });
});
