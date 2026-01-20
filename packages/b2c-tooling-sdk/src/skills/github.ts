/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import JSZip from 'jszip';
import type {CachedArtifact, DownloadSkillsOptions, ReleaseInfo, SkillSet} from './types.js';
import {getLogger} from '../logging/logger.js';

const GITHUB_REPO = 'SalesforceCommerceCloud/b2c-developer-tooling';
const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Asset filename patterns for skill archives.
 */
const ASSET_NAMES: Record<SkillSet, string> = {
  b2c: 'b2c-skills.zip',
  'b2c-cli': 'b2c-cli-skills.zip',
};

/**
 * Get the cache directory for skills.
 * Uses XDG_CACHE_HOME on Linux, ~/.cache otherwise.
 *
 * @returns Absolute path to cache directory
 */
export function getCacheDir(): string {
  const xdgCache = process.env.XDG_CACHE_HOME;
  const baseCache = xdgCache || path.join(os.homedir(), '.cache');
  return path.join(baseCache, 'b2c-cli', 'skills');
}

/**
 * Parse GitHub API release response into ReleaseInfo.
 */
function parseRelease(release: {
  tag_name: string;
  published_at: string;
  assets: Array<{name: string; browser_download_url: string}>;
}): ReleaseInfo {
  const b2cAsset = release.assets.find((a) => a.name === ASSET_NAMES['b2c']);
  const b2cCliAsset = release.assets.find((a) => a.name === ASSET_NAMES['b2c-cli']);

  return {
    tagName: release.tag_name,
    version: release.tag_name.replace(/^v/, ''),
    publishedAt: release.published_at,
    b2cSkillsAssetUrl: b2cAsset?.browser_download_url ?? null,
    b2cCliSkillsAssetUrl: b2cCliAsset?.browser_download_url ?? null,
  };
}

/**
 * Fetch release information from GitHub API.
 *
 * @param version - 'latest' or specific version (e.g., 'v0.1.0')
 * @returns Release information
 * @throws Error if release not found or API request fails
 */
export async function getRelease(version: string = 'latest'): Promise<ReleaseInfo> {
  const logger = getLogger();
  const endpoint =
    version === 'latest'
      ? `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/releases/latest`
      : `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/releases/tags/${version.startsWith('v') ? version : `v${version}`}`;

  logger.debug({endpoint}, 'Fetching release info');

  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'b2c-cli',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Release not found: ${version}`);
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    tag_name: string;
    published_at: string;
    assets: Array<{name: string; browser_download_url: string}>;
  };

  return parseRelease(data);
}

/**
 * List available releases with skills artifacts.
 *
 * @param limit - Maximum number of releases to return (default: 10)
 * @returns Array of release information
 */
export async function listReleases(limit: number = 10): Promise<ReleaseInfo[]> {
  const logger = getLogger();
  const endpoint = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/releases?per_page=${limit}`;

  logger.debug({endpoint}, 'Listing releases');

  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'b2c-cli',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as Array<{
    tag_name: string;
    published_at: string;
    assets: Array<{name: string; browser_download_url: string}>;
  }>;

  // Only return releases that have at least one skills artifact
  return data.map(parseRelease).filter((r) => r.b2cSkillsAssetUrl || r.b2cCliSkillsAssetUrl);
}

/**
 * Get cached artifact metadata if available.
 *
 * @param version - Release version
 * @param skillSet - Skill set to check
 * @returns Cached artifact info or null if not cached
 */
export function getCachedArtifact(version: string, skillSet: SkillSet): CachedArtifact | null {
  const cacheDir = getCacheDir();
  const manifestPath = path.join(cacheDir, version, skillSet, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(content) as CachedArtifact;
  } catch {
    return null;
  }
}

/**
 * Download and extract skills artifact.
 *
 * @param skillSet - Which skill set to download ('b2c' or 'b2c-cli')
 * @param options - Download options
 * @returns Path to extracted skills directory
 * @throws Error if download fails or artifact not available
 */
export async function downloadSkillsArtifact(skillSet: SkillSet, options: DownloadSkillsOptions = {}): Promise<string> {
  const logger = getLogger();
  const {version = 'latest', forceDownload = false} = options;

  // Get release info to determine version and asset URL
  const release = await getRelease(version);
  const actualVersion = release.tagName;

  // Check cache first (unless forced)
  if (!forceDownload) {
    const cached = getCachedArtifact(actualVersion, skillSet);
    if (cached && fs.existsSync(cached.path)) {
      logger.debug({version: actualVersion, skillSet, path: cached.path}, 'Using cached skills');
      return cached.path;
    }
  }

  // Determine asset URL
  const assetUrl = skillSet === 'b2c' ? release.b2cSkillsAssetUrl : release.b2cCliSkillsAssetUrl;

  if (!assetUrl) {
    throw new Error(`Skills artifact '${ASSET_NAMES[skillSet]}' not found in release ${actualVersion}`);
  }

  logger.debug({url: assetUrl, skillSet}, 'Downloading skills artifact');

  // Download artifact
  const response = await fetch(assetUrl, {
    headers: {
      'User-Agent': 'b2c-cli',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download skills: ${response.status} ${response.statusText}`);
  }

  const zipBuffer = Buffer.from(await response.arrayBuffer());
  logger.debug({size: zipBuffer.length}, 'Downloaded skills archive');

  // Extract to cache directory
  const cacheDir = options.cacheDir || getCacheDir();
  const extractDir = path.join(cacheDir, actualVersion, skillSet);

  // Clean existing extraction if present
  if (fs.existsSync(extractDir)) {
    await fs.promises.rm(extractDir, {recursive: true});
  }

  await fs.promises.mkdir(extractDir, {recursive: true});

  // Extract zip contents
  const zip = await JSZip.loadAsync(zipBuffer);
  let extractedCount = 0;

  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) {
      await fs.promises.mkdir(path.join(extractDir, relativePath), {recursive: true});
      continue;
    }

    const targetPath = path.join(extractDir, relativePath);
    const targetDir = path.dirname(targetPath);

    // Ensure parent directory exists
    await fs.promises.mkdir(targetDir, {recursive: true});

    // Write file
    const content = await zipEntry.async('nodebuffer');
    await fs.promises.writeFile(targetPath, content);
    extractedCount++;
  }

  logger.debug({extractDir, fileCount: extractedCount}, 'Extracted skills');

  // Write cache manifest
  const manifest: CachedArtifact = {
    version: actualVersion,
    path: extractDir,
    downloadedAt: new Date().toISOString(),
  };
  await fs.promises.writeFile(path.join(extractDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  return extractDir;
}

/**
 * Clear the skills cache.
 *
 * @param version - Optional specific version to clear (default: all)
 */
export async function clearCache(version?: string): Promise<void> {
  const cacheDir = getCacheDir();

  if (version) {
    const versionDir = path.join(cacheDir, version);
    if (fs.existsSync(versionDir)) {
      await fs.promises.rm(versionDir, {recursive: true});
    }
  } else if (fs.existsSync(cacheDir)) {
    await fs.promises.rm(cacheDir, {recursive: true});
  }
}
