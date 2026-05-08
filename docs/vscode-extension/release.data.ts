/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/*
 * VitePress build-time data loader for the latest published B2C DX VS Code
 * extension `.vsix` asset. Consumed by `installation.md` via `<script setup>`.
 *
 * The release pipeline (.github/workflows/publish.yml) creates a versioned
 * GitHub Release named `b2c-vs-extension@X.Y.Z` with `--latest=false` (so it
 * does not steal GitHub's "Latest release" pointer from the main CLI release)
 * and uploads the `.vsix` as an asset. It also force-updates a git tag
 * `b2c-vs-extension@latest` to that commit, but no GitHub Release is created
 * for the floating tag — so we list releases and pick the newest VSCE entry
 * by tag name + published_at.
 *
 * The loader is resilient: any failure (HTTP error, rate-limit, offline,
 * JSON parse error, or zero matching releases) returns `unavailable: true`
 * with a fallback URL pointing at the GitHub releases listing. The page
 * renders a "Browse releases" link in that case. Until the first VSCE
 * release ships, this fallback is the expected state.
 *
 * Cache: writes the resolved data to `docs/.vitepress/cache/release-vscode.json`
 * with a 24-hour TTL so repeat local builds don't re-hit the API but a
 * maintainer who cuts a release won't see a stale version on the very next
 * local build. CI runners have no persisted cache, so each CI build hits the
 * API once. Delete the cache file to force an immediate refresh.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export interface ReleaseData {
  unavailable: boolean;
  fallbackUrl: string;
  version?: string;
  vsixDownloadUrl?: string;
  vsixAssetName?: string;
  releasePageUrl?: string;
  publishedAt?: string;
}

interface CachedReleaseData extends ReleaseData {
  cachedAt: string;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const REPO = 'SalesforceCommerceCloud/b2c-developer-tooling';
const TAG_PREFIX = 'b2c-vs-extension@';
const SEMVER_TAG_RE = /^b2c-vs-extension@\d+\.\d+\.\d+$/;
const FALLBACK_URL = `https://github.com/${REPO}/releases?q=${encodeURIComponent(TAG_PREFIX)}`;

interface GitHubAsset {
  name: string;
  browser_download_url: string;
}
interface GitHubRelease {
  tag_name: string;
  html_url: string;
  published_at: string;
  assets: GitHubAsset[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.resolve(__dirname, '..', '.vitepress', 'cache', 'release-vscode.json');

function readCache(): ReleaseData | undefined {
  try {
    if (!fs.existsSync(CACHE_FILE)) return undefined;
    const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) as CachedReleaseData;
    if (!cached.cachedAt) return undefined;
    if (Date.now() - Date.parse(cached.cachedAt) > CACHE_TTL_MS) return undefined;
    const {cachedAt: _cachedAt, ...data} = cached;
    return data;
  } catch {
    return undefined;
  }
}

function writeCache(data: ReleaseData): void {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), {recursive: true});
    const payload: CachedReleaseData = {...data, cachedAt: new Date().toISOString()};
    fs.writeFileSync(CACHE_FILE, JSON.stringify(payload, null, 2));
  } catch {
    /* ignore */
  }
}

function fallback(): ReleaseData {
  return {unavailable: true, fallbackUrl: FALLBACK_URL};
}

async function fetchLatestVsixRelease(): Promise<ReleaseData> {
  const headers: Record<string, string> = {Accept: 'application/vnd.github+json'};
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, {headers});
  if (!res.ok) return fallback();

  const releases = (await res.json()) as GitHubRelease[];
  const matches = releases.filter((r) => SEMVER_TAG_RE.test(r.tag_name));
  if (matches.length === 0) return fallback();

  matches.sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
  const latest = matches[0];
  const vsix = latest.assets.find((a) => a.name.endsWith('.vsix'));
  if (!vsix) return fallback();

  return {
    unavailable: false,
    fallbackUrl: FALLBACK_URL,
    version: latest.tag_name.slice(TAG_PREFIX.length),
    vsixDownloadUrl: vsix.browser_download_url,
    vsixAssetName: vsix.name,
    releasePageUrl: latest.html_url,
    publishedAt: latest.published_at,
  };
}

export default {
  async load(): Promise<ReleaseData> {
    const cached = readCache();
    if (cached) return cached;
    try {
      const data = await fetchLatestVsixRelease();
      writeCache(data);
      return data;
    } catch {
      const fb = fallback();
      writeCache(fb);
      return fb;
    }
  },
};
