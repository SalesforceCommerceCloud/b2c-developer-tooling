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
const GITHUB_DOWNLOAD_BASE = 'https://github.com';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';
const LATEST_VERSION_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Asset filename patterns for skill archives.
 */
const ASSET_NAMES: Record<SkillSet, string> = {
  b2c: 'b2c-skills.zip',
  'b2c-cli': 'b2c-cli-skills.zip',
};

/**
 * Build a direct CDN download URL for a release asset.
 * Assumes a concrete tag — call `resolveLatestVersion()` first if you have 'latest'.
 */
function buildDownloadUrl(tag: string, assetName: string): string {
  return `${GITHUB_DOWNLOAD_BASE}/${GITHUB_REPO}/releases/download/${tag}/${assetName}`;
}

/**
 * Tag name used for skill-only releases (matches publish.yml).
 */
function pluginsTag(version: string): string {
  const bare = version.replace(/^v/, '');
  return `b2c-agent-plugins@${bare}`;
}

/**
 * File path for the resolved-latest-version cache.
 */
function getLatestVersionCachePath(): string {
  return path.join(getCacheDir(), '.latest-version.json');
}

/**
 * Read a cached "latest" version if still fresh (1-hour TTL).
 */
function readLatestVersionCache(): string | null {
  try {
    const p = getLatestVersionCachePath();
    if (!fs.existsSync(p)) return null;
    const entry = JSON.parse(fs.readFileSync(p, 'utf-8')) as {version: string; resolvedAt: string};
    const age = Date.now() - new Date(entry.resolvedAt).getTime();
    if (age > LATEST_VERSION_CACHE_TTL_MS) return null;
    return entry.version;
  } catch {
    return null;
  }
}

function writeLatestVersionCache(version: string): void {
  try {
    const p = getLatestVersionCachePath();
    fs.mkdirSync(path.dirname(p), {recursive: true});
    fs.writeFileSync(p, JSON.stringify({version, resolvedAt: new Date().toISOString()}));
  } catch {
    // Caching is best-effort
  }
}

/**
 * Detect whether a fetch response is an unauthenticated GitHub rate-limit.
 */
function isRateLimited(response: Response): boolean {
  if (response.status !== 403 && response.status !== 429) return false;
  const remaining = response.headers.get('x-ratelimit-remaining');
  return remaining === '0' || response.status === 429;
}

/**
 * Resolve the version of the most recent skills release.
 *
 * Strategy:
 *   1. API primary — paginate /releases and return the first entry that has
 *      a skills asset attached.
 *   2. Rate-limit fallback — fetch skills/package.json from main via
 *      raw.githubusercontent.com. This is the version that will be tagged
 *      b2c-agent-plugins@<version> at release time.
 *
 * Caches the resolved version for 1 hour to avoid re-resolving on consecutive
 * calls within the same session. Always returns a bare version string like
 * "1.2.3" (no 'v' prefix, no tag format).
 */
async function resolveLatestVersion(): Promise<string> {
  const logger = getLogger();

  const cached = readLatestVersionCache();
  if (cached) {
    logger.debug({version: cached}, 'Using cached latest version');
    return cached;
  }

  // Primary — GitHub REST API with asset filtering
  try {
    const releases = await listReleases(30);
    if (releases.length > 0) {
      const version = releases[0].version;
      writeLatestVersionCache(version);
      return version;
    }
    logger.warn('GitHub API returned no releases with skills artifacts; falling back to main branch');
  } catch (err) {
    const isRateLimit = err instanceof Error && /rate.?limit|403|429/i.test(err.message);
    if (isRateLimit) {
      logger.warn(
        {err: (err as Error).message},
        'GitHub API rate-limited; falling back to main branch for version resolution',
      );
    } else {
      logger.warn(
        {err: (err as Error).message},
        'GitHub API unavailable; falling back to main branch for version resolution',
      );
    }
  }

  // Fallback — read skills/package.json from main via raw.githubusercontent.com
  const rawUrl = `${GITHUB_RAW_BASE}/${GITHUB_REPO}/main/skills/package.json`;
  logger.debug({url: rawUrl}, 'Fetching version from raw.githubusercontent.com');
  const response = await fetch(rawUrl, {headers: {'User-Agent': 'b2c-cli'}});
  if (!response.ok) {
    throw new Error(
      `Unable to resolve latest skills version: raw fetch failed with ${response.status} ${response.statusText}`,
    );
  }
  const data = (await response.json()) as {version?: string};
  if (!data.version) {
    throw new Error('Unable to resolve latest skills version: skills/package.json has no version field');
  }
  writeLatestVersionCache(data.version);
  return data.version;
}

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

  // For 'latest', resolve to a concrete tag via the skills-aware resolver.
  // This avoids GitHub's /releases/latest endpoint, which returns whichever
  // release GitHub flags as latest regardless of whether it contains skills.
  let tag: string;
  if (version === 'latest') {
    const resolved = await resolveLatestVersion();
    tag = pluginsTag(resolved);
  } else if (/^b2c-agent-plugins@/.test(version) || version.includes('@')) {
    // Caller passed an explicit tag (including other packages' tags, for tests/internal use).
    tag = version;
  } else {
    tag = pluginsTag(version);
  }

  const endpoint = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/releases/tags/${encodeURIComponent(tag)}`;
  logger.debug({endpoint}, 'Fetching release info');

  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'b2c-cli',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Release not found: ${tag}`);
    }
    if (isRateLimited(response)) {
      throw new Error(`GitHub API rate-limited while fetching release ${tag}`);
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
 * Uses direct download URLs to avoid GitHub API rate limits.
 *
 * @param skillSet - Which skill set to download ('b2c' or 'b2c-cli')
 * @param options - Download options
 * @returns Path to extracted skills directory
 * @throws Error if download fails or artifact not available
 */
export async function downloadSkillsArtifact(skillSet: SkillSet, options: DownloadSkillsOptions = {}): Promise<string> {
  const logger = getLogger();
  const {version = 'latest', forceDownload = false} = options;
  const assetName = ASSET_NAMES[skillSet];

  // Resolve 'latest' to a concrete version before any download or cache lookup.
  // This keeps the cache keyed to real version tags and avoids GitHub's opinionated
  // /releases/latest endpoint, which may point at a release that has no skills zips.
  const resolvedVersion = version === 'latest' ? await resolveLatestVersion() : version.replace(/^v/, '');
  const tag = pluginsTag(resolvedVersion);

  // Check cache for the resolved version
  if (!forceDownload) {
    const cached = getCachedArtifact(resolvedVersion, skillSet);
    if (cached && fs.existsSync(cached.path)) {
      logger.debug({version: resolvedVersion, skillSet, path: cached.path}, 'Using cached skills');
      return cached.path;
    }
  }

  // Download from the CDN — no API rate limit on this path.
  const downloadUrl = buildDownloadUrl(tag, assetName);
  logger.debug({url: downloadUrl, skillSet}, 'Downloading skills artifact');

  // Download artifact - GitHub will redirect to the actual file
  const response = await fetch(downloadUrl, {
    headers: {
      'User-Agent': 'b2c-cli',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Skills artifact '${assetName}' not found for release ${tag}`);
    }
    throw new Error(`Failed to download skills: ${response.status} ${response.statusText}`);
  }

  const zipBuffer = Buffer.from(await response.arrayBuffer());
  logger.debug({size: zipBuffer.length, version: resolvedVersion}, 'Downloaded skills archive');

  // Extract to cache directory
  const cacheDir = options.cacheDir || getCacheDir();
  const extractDir = path.join(cacheDir, resolvedVersion, skillSet);

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
    version: resolvedVersion,
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
