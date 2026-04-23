/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {execFile} from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {promisify} from 'node:util';
import JSZip from 'jszip';
import type {CachedArtifact, DownloadSkillsOptions, ReleaseInfo, SkillSet, SkillSourceConfig} from './types.js';
import {getSkillSource} from './sources.js';
import {getLogger} from '../logging/logger.js';

const execFileAsync = promisify(execFile);

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_DOWNLOAD_BASE = 'https://github.com';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';
const LATEST_VERSION_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function buildDownloadUrl(repo: string, tag: string, assetName: string): string {
  return `${GITHUB_DOWNLOAD_BASE}/${repo}/releases/download/${tag}/${assetName}`;
}

function getLatestVersionCachePath(): string {
  return path.join(getCacheDir(), '.latest-version.json');
}

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

function clearLatestVersionCache(): void {
  try {
    const p = getLatestVersionCachePath();
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    // Best-effort
  }
}

function isRateLimited(response: Response): boolean {
  if (response.status !== 403 && response.status !== 429) return false;
  const remaining = response.headers.get('x-ratelimit-remaining');
  return remaining === '0' || response.status === 429;
}

/**
 * Resolve the version of the most recent skills release from the b2c-developer-tooling repo.
 */
async function resolveLatestVersion(source: SkillSourceConfig): Promise<string> {
  const logger = getLogger();

  const cached = readLatestVersionCache();
  if (cached) {
    logger.debug({version: cached}, 'Using cached latest version');
    return cached;
  }

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

  const rawUrl = `${GITHUB_RAW_BASE}/${source.repo}/main/skills/package.json`;
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
 */
export function getCacheDir(): string {
  const xdgCache = process.env.XDG_CACHE_HOME;
  const baseCache = xdgCache || path.join(os.homedir(), '.cache');
  return path.join(baseCache, 'b2c-cli', 'skills');
}

function parseRelease(release: {
  tag_name: string;
  published_at: string;
  assets: Array<{name: string; browser_download_url: string}>;
}): ReleaseInfo {
  const b2cSource = getSkillSource('b2c');
  const b2cCliSource = getSkillSource('b2c-cli');

  const b2cAsset = release.assets.find((a) => a.name === b2cSource.assetName);
  const b2cCliAsset = release.assets.find((a) => a.name === b2cCliSource.assetName);

  const versionMatch = release.tag_name.match(/@(\d+\.\d+\.\d+.*)$/);
  const version = versionMatch ? versionMatch[1] : release.tag_name.replace(/^v/, '');

  return {
    tagName: release.tag_name,
    version,
    publishedAt: release.published_at,
    b2cSkillsAssetUrl: b2cAsset?.browser_download_url ?? null,
    b2cCliSkillsAssetUrl: b2cCliAsset?.browser_download_url ?? null,
  };
}

/**
 * Fetch release information from GitHub API.
 */
export async function getRelease(version: string = 'latest'): Promise<ReleaseInfo> {
  const logger = getLogger();
  const source = getSkillSource('b2c');

  let tag: string;
  if (version === 'latest') {
    const resolved = await resolveLatestVersion(source);
    tag = source.tagPattern!(resolved);
  } else if (/^b2c-agent-plugins@/.test(version) || version.includes('@')) {
    tag = version;
  } else {
    tag = source.tagPattern!(version);
  }

  const endpoint = `${GITHUB_API_BASE}/repos/${source.repo}/releases/tags/${encodeURIComponent(tag)}`;
  logger.debug({endpoint}, 'Fetching release info');

  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'b2c-cli',
    },
  });

  if (!response.ok) {
    clearLatestVersionCache();
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
 */
export async function listReleases(limit: number = 10): Promise<ReleaseInfo[]> {
  const logger = getLogger();
  const source = getSkillSource('b2c');
  const endpoint = `${GITHUB_API_BASE}/repos/${source.repo}/releases?per_page=${limit}`;

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

  return data
    .filter((r) => r.tag_name.startsWith('b2c-agent-plugins@'))
    .map(parseRelease)
    .filter((r) => r.b2cSkillsAssetUrl || r.b2cCliSkillsAssetUrl);
}

/**
 * Get cached artifact metadata if available.
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
 * Download and extract a release-artifact skill set (b2c or b2c-cli).
 */
async function downloadReleaseArtifact(
  source: SkillSourceConfig,
  options: DownloadSkillsOptions = {},
): Promise<string> {
  const logger = getLogger();
  const {version = 'latest', forceDownload = false} = options;

  const resolvedVersion = version === 'latest' ? await resolveLatestVersion(source) : version.replace(/^v/, '');
  const tag = source.tagPattern!(resolvedVersion);

  if (!forceDownload) {
    const cached = getCachedArtifact(resolvedVersion, source.id);
    if (cached && fs.existsSync(cached.path)) {
      logger.debug({version: resolvedVersion, skillSet: source.id, path: cached.path}, 'Using cached skills');
      return cached.path;
    }
  }

  const downloadUrl = buildDownloadUrl(source.repo, tag, source.assetName!);
  logger.debug({url: downloadUrl, skillSet: source.id}, 'Downloading skills artifact');

  const response = await fetch(downloadUrl, {
    headers: {'User-Agent': 'b2c-cli'},
    redirect: 'follow',
  });

  if (!response.ok) {
    clearLatestVersionCache();
    if (response.status === 404) {
      throw new Error(`Skills artifact '${source.assetName}' not found for release ${tag}`);
    }
    throw new Error(`Failed to download skills: ${response.status} ${response.statusText}`);
  }

  const zipBuffer = Buffer.from(await response.arrayBuffer());
  logger.debug({size: zipBuffer.length, version: resolvedVersion}, 'Downloaded skills archive');

  const cacheDir = options.cacheDir || getCacheDir();
  const extractDir = path.join(cacheDir, resolvedVersion, source.id);

  if (fs.existsSync(extractDir)) {
    await fs.promises.rm(extractDir, {recursive: true});
  }

  await fs.promises.mkdir(extractDir, {recursive: true});

  const zip = await JSZip.loadAsync(zipBuffer);
  let extractedCount = 0;

  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) {
      await fs.promises.mkdir(path.join(extractDir, relativePath), {recursive: true});
      continue;
    }

    const targetPath = path.join(extractDir, relativePath);
    const targetDir = path.dirname(targetPath);
    await fs.promises.mkdir(targetDir, {recursive: true});

    const content = await zipEntry.async('nodebuffer');
    await fs.promises.writeFile(targetPath, content);
    extractedCount++;
  }

  logger.debug({extractDir, fileCount: extractedCount}, 'Extracted skills');

  const manifest: CachedArtifact = {
    version: resolvedVersion,
    path: extractDir,
    downloadedAt: new Date().toISOString(),
  };
  await fs.promises.writeFile(path.join(extractDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  return extractDir;
}

/**
 * Resolve a git ref to a commit SHA via the GitHub API.
 */
async function resolveCommitSha(repo: string, ref: string): Promise<string> {
  const response = await fetch(`${GITHUB_API_BASE}/repos/${repo}/commits/${encodeURIComponent(ref)}`, {
    headers: {'User-Agent': 'b2c-cli', Accept: 'application/vnd.github.v3.sha'},
  });
  if (!response.ok) {
    throw new Error(`Failed to resolve ref '${ref}' for ${repo}: ${response.status} ${response.statusText}`);
  }
  return (await response.text()).trim();
}

interface GitHubContentsEntry {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
}

/**
 * Recursively fetch directory contents from the GitHub Contents API and write to disk.
 */
async function fetchContentsRecursive(repo: string, repoPath: string, ref: string, destDir: string): Promise<number> {
  const logger = getLogger();
  const endpoint = `${GITHUB_API_BASE}/repos/${repo}/contents/${encodeURIComponent(repoPath)}?ref=${encodeURIComponent(ref)}`;

  const response = await fetch(endpoint, {
    headers: {Accept: 'application/vnd.github.v3+json', 'User-Agent': 'b2c-cli'},
  });

  if (!response.ok) {
    if (isRateLimited(response)) {
      throw Object.assign(new Error('GitHub API rate-limited'), {rateLimited: true});
    }
    throw new Error(`GitHub Contents API error for ${repoPath}: ${response.status} ${response.statusText}`);
  }

  const entries = (await response.json()) as GitHubContentsEntry[];
  let fileCount = 0;

  await fs.promises.mkdir(destDir, {recursive: true});

  for (const entry of entries) {
    const targetPath = path.join(destDir, entry.name);

    if (entry.type === 'dir') {
      fileCount += await fetchContentsRecursive(repo, entry.path, ref, targetPath);
    } else if (entry.type === 'file' && entry.download_url) {
      const fileResponse = await fetch(entry.download_url, {headers: {'User-Agent': 'b2c-cli'}});
      if (!fileResponse.ok) {
        logger.warn({path: entry.path}, 'Failed to download file, skipping');
        continue;
      }
      const content = Buffer.from(await fileResponse.arrayBuffer());
      await fs.promises.writeFile(targetPath, content);
      fileCount++;
    }
  }

  return fileCount;
}

/**
 * Recursively copy a directory tree.
 */
async function copyDirRecursive(src: string, dest: string): Promise<void> {
  await fs.promises.mkdir(dest, {recursive: true});
  const entries = await fs.promises.readdir(src, {withFileTypes: true});
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Fallback: use sparse git checkout to fetch only the skills subtree.
 */
async function fetchViaSparseCheckout(repo: string, ref: string, skillsPath: string, destDir: string): Promise<void> {
  const logger = getLogger();
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'b2c-skills-'));

  try {
    const repoUrl = `${GITHUB_DOWNLOAD_BASE}/${repo}.git`;
    logger.debug({repoUrl, skillsPath}, 'Falling back to sparse git checkout');

    await execFileAsync('git', [
      'clone',
      '--no-checkout',
      '--depth',
      '1',
      '--filter=blob:none',
      '--sparse',
      repoUrl,
      tmpDir,
    ]);
    await execFileAsync('git', ['-C', tmpDir, 'sparse-checkout', 'set', skillsPath]);
    await execFileAsync('git', ['-C', tmpDir, 'checkout']);

    const skillsSrc = path.join(tmpDir, skillsPath);
    if (!fs.existsSync(skillsSrc)) {
      throw new Error(`Skills path '${skillsPath}' not found in repo ${repo}`);
    }

    await copyDirRecursive(skillsSrc, destDir);
  } finally {
    await fs.promises.rm(tmpDir, {recursive: true, force: true});
  }
}

/**
 * Download skills from a repo-contents source (e.g., commerce-apps).
 * Primary: GitHub Contents API. Fallback: sparse git checkout.
 */
async function downloadRepoContents(source: SkillSourceConfig, options: DownloadSkillsOptions = {}): Promise<string> {
  const logger = getLogger();
  const ref = options.version || source.ref || 'main';
  const forceDownload = options.forceDownload ?? false;
  const skillsPath = source.skillsPath || '.claude/skills';

  const commitSha = await resolveCommitSha(source.repo, ref);
  const cacheKey = `${ref}-${commitSha.slice(0, 8)}`;

  if (!forceDownload) {
    const cached = getCachedArtifact(cacheKey, source.id);
    if (cached && fs.existsSync(cached.path)) {
      logger.debug({cacheKey, skillSet: source.id, path: cached.path}, 'Using cached skills');
      return cached.path;
    }
  }

  const cacheDir = options.cacheDir || getCacheDir();
  const extractDir = path.join(cacheDir, cacheKey, source.id);
  const skillsDestDir = path.join(extractDir, 'skills');

  if (fs.existsSync(extractDir)) {
    await fs.promises.rm(extractDir, {recursive: true});
  }

  await fs.promises.mkdir(skillsDestDir, {recursive: true});

  try {
    logger.debug({repo: source.repo, skillsPath, ref}, 'Fetching skills via Contents API');
    const fileCount = await fetchContentsRecursive(source.repo, skillsPath, ref, skillsDestDir);
    logger.debug({extractDir, fileCount}, 'Fetched skills via Contents API');
  } catch (err) {
    const isRateLimit = err instanceof Error && 'rateLimited' in err;
    if (isRateLimit) {
      logger.warn('Contents API rate-limited; falling back to sparse git checkout');
    } else {
      logger.warn({err: (err as Error).message}, 'Contents API failed; falling back to sparse git checkout');
    }

    if (fs.existsSync(skillsDestDir)) {
      await fs.promises.rm(skillsDestDir, {recursive: true});
    }
    await fs.promises.mkdir(skillsDestDir, {recursive: true});

    await fetchViaSparseCheckout(source.repo, ref, skillsPath, skillsDestDir);
  }

  const manifest: CachedArtifact = {
    version: cacheKey,
    path: extractDir,
    downloadedAt: new Date().toISOString(),
    commitSha,
  };
  await fs.promises.writeFile(path.join(extractDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  return extractDir;
}

/**
 * Download and extract skills artifact.
 * Dispatches to the appropriate download strategy based on the skill source type.
 *
 * @param skillSet - Which skill set to download
 * @param options - Download options
 * @returns Path to extracted skills directory
 */
export async function downloadSkillsArtifact(skillSet: SkillSet, options: DownloadSkillsOptions = {}): Promise<string> {
  const source = getSkillSource(skillSet);

  if (source.type === 'release-artifact') {
    return downloadReleaseArtifact(source, options);
  }

  return downloadRepoContents(source, options);
}

/**
 * Clear the skills cache.
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
