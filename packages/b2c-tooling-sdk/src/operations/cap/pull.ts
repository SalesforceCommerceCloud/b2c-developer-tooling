/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import JSZip from 'jszip';
import {B2CInstance} from '../../instance/index.js';
import {getLogger} from '../../logging/logger.js';
import type {CommerceFeatureState} from './list.js';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/SalesforceCommerceCloud/commerce-apps/main';

export interface PullCommerceAppsOptions {
  outputDir?: string;
}

export type PullSource = 'instance' | 'github';

export interface PulledApp {
  featureName: string;
  version: string;
  domain: string;
  source: PullSource;
  extractedPath: string;
}

export interface PullCommerceAppsResult {
  pulled: PulledApp[];
  failed: Array<{featureName: string; error: string}>;
}

export async function pullCommerceApps(
  instance: B2CInstance,
  features: CommerceFeatureState[],
  options: PullCommerceAppsOptions = {},
): Promise<PullCommerceAppsResult> {
  const logger = getLogger();
  const outputDir = path.resolve(options.outputDir ?? 'commerce-apps');

  await fs.promises.mkdir(outputDir, {recursive: true});

  const pulled: PulledApp[] = [];
  const failed: Array<{featureName: string; error: string}> = [];

  for (const feature of features) {
    const {featureName, featureVersionId, featureDomain} = feature;

    if (!featureVersionId) {
      failed.push({featureName, error: 'No version available'});
      continue;
    }

    const zipFilename = `${featureName}-v${featureVersionId}.zip`;
    const webdavPath = `Impex/commerce-apps/${zipFilename}`;

    let zipData: Buffer | null = null;
    let source: PullSource = 'instance';

    // Try instance first
    if (await instance.webdav.exists(webdavPath)) {
      logger.debug({path: webdavPath}, `Downloading ${zipFilename} from instance`);
      zipData = Buffer.from(await instance.webdav.get(webdavPath));
    }

    // Fall back to GitHub
    if (!zipData) {
      const githubUrl = `${GITHUB_RAW_BASE}/${featureDomain}/${featureName}/${zipFilename}`;
      logger.warn({url: githubUrl}, `${zipFilename} not found on instance, trying GitHub`);
      source = 'github';

      try {
        const response = await fetch(githubUrl);
        if (!response.ok) {
          failed.push({featureName, error: `Not found on instance or GitHub (${githubUrl})`});
          continue;
        }
        zipData = Buffer.from(await response.arrayBuffer());
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        failed.push({featureName, error: `GitHub download failed: ${msg}`});
        continue;
      }
    }

    // Extract zip
    const zip = await JSZip.loadAsync(zipData);
    const extractDir = path.join(outputDir, featureName);
    await fs.promises.mkdir(extractDir, {recursive: true});

    for (const [filePath, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;

      // Strip the top-level archive directory (e.g. "avalara-tax-v1.1.0/...")
      const parts = filePath.split('/');
      const relativePath = parts.length > 1 ? parts.slice(1).join('/') : filePath;
      const fullPath = path.join(extractDir, relativePath);

      await fs.promises.mkdir(path.dirname(fullPath), {recursive: true});
      const content = await entry.async('nodebuffer');
      await fs.promises.writeFile(fullPath, content);
    }

    logger.debug({featureName, extractDir}, `Extracted ${featureName} to ${extractDir}`);

    pulled.push({
      featureName,
      version: featureVersionId,
      domain: featureDomain,
      source,
      extractedPath: extractDir,
    });
  }

  return {pulled, failed};
}
