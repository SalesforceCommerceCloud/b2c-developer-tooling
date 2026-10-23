/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Code-version operations over WebDAV, for instances reached without an API
 * client (Basic auth or an Account Manager browser login).
 *
 * The instance records its code versions in `Cartridges/.version`, the same
 * file OCAPI and SCAPI report from. Each line is
 * `id/activationEpochMs/lastModifiedEpochMs`, most recently activated first;
 * the first line is the active version and the second the rollback version,
 * provided each has an activation time. Versions that were never activated
 * have an empty activation time or aren't listed, so the `Cartridges` folders
 * fill in the rest.
 *
 * Activation needs OCAPI or SCAPI and is not available here.
 *
 * @module operations/code/webdav-scripts-backend
 */
import type {B2CInstance} from '../../instance/index.js';
import type {CodeVersionActivationResult, CodeVersionInfo, ScriptsBackend} from './scripts-types.js';

const VERSION_FILE = '.version';
const END_MARKER = '# end of file marker';
const SUPPORTED_FILE_VERSION = '1';

/** A code version as recorded in `Cartridges/.version`. */
export interface CodeVersionFileEntry {
  id: string;
  active: boolean;
  rollback: boolean;
  /** ISO timestamp; absent for versions that were never activated. */
  activationTime?: string;
  /** ISO timestamp of the last change to the version. */
  lastModificationTime?: string;
}

function epochToIso(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const ms = Number(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : undefined;
}

/**
 * Parses the instance's `Cartridges/.version` file the way the server does.
 *
 * @returns The recorded code versions, or `undefined` when the file is
 *   incomplete (no end-of-file marker, for example while it is being rewritten)
 * @throws Error if the file declares an unsupported format version
 */
export function parseCodeVersionFile(content: string): CodeVersionFileEntry[] | undefined {
  const lines = content.split(/\r?\n/).map((line) => line.trim());
  if (!lines.includes(END_MARKER)) return undefined;

  const entries: CodeVersionFileEntry[] = [];
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    const [key, value] = line.split('=', 2);
    if (value !== undefined) {
      if (key === 'fileVersion' && value !== SUPPORTED_FILE_VERSION) {
        throw new Error(`Unsupported Cartridges/.version format (fileVersion=${value})`);
      }
      continue;
    }
    const [id, activation, lastModified] = line.split('/');
    if (!id) continue;
    const activationTime = epochToIso(activation);
    const position = entries.length + 1;
    entries.push({
      id,
      active: position === 1 && activationTime !== undefined,
      rollback: position === 2 && activationTime !== undefined,
      activationTime,
      lastModificationTime: epochToIso(lastModified),
    });
  }
  return entries;
}

/** Reads code versions from the `Cartridges` WebDAV folder; see the module docs. */
export class WebDavScriptsBackend implements ScriptsBackend {
  readonly name = 'webdav' as const;

  constructor(private instance: B2CInstance) {}

  async activateCodeVersion(codeVersionId: string): Promise<CodeVersionActivationResult> {
    throw new Error(
      `Activating code version "${codeVersionId}" needs an API client (OCAPI or SCAPI); ` +
        'it is not available with only WebDAV access. Configure client-id and client-secret, ' +
        'or activate it in Business Manager (Administration > Site Development > Code Deployment).',
    );
  }

  async createCodeVersion(codeVersionId: string): Promise<void> {
    await this.instance.webdav.mkcol(`Cartridges/${codeVersionId}`);
  }

  async deleteCodeVersion(codeVersionId: string): Promise<void> {
    // The server refuses to delete the active version (405).
    await this.instance.webdav.delete(`Cartridges/${codeVersionId}`);
  }

  async getActiveCodeVersion(): Promise<CodeVersionInfo | undefined> {
    return (await this.listCodeVersions()).find((v) => v.active);
  }

  async listCodeVersions(): Promise<CodeVersionInfo[]> {
    const entries = await this.instance.webdav.propfind('Cartridges', '1');
    const folders = new Map<string, Date | undefined>();
    let hasVersionFile = false;
    for (const entry of entries) {
      if (!entry.displayName || entry.displayName === 'Cartridges') continue;
      if (entry.isCollection) folders.set(entry.displayName, entry.lastModified);
      else if (entry.displayName === VERSION_FILE) hasVersionFile = true;
    }

    // An instance that never activated a version may have no file.
    const recorded = hasVersionFile ? await this.readVersionFile() : [];
    const versions: CodeVersionInfo[] = [];
    for (const entry of recorded) {
      // Skip versions whose folder is gone.
      if (!folders.has(entry.id)) continue;
      versions.push({...entry, webDavUrl: this.webDavUrl(entry.id)});
      folders.delete(entry.id);
    }
    for (const [id, lastModified] of folders) {
      versions.push({
        id,
        active: false,
        rollback: false,
        lastModificationTime: lastModified?.toISOString(),
        webDavUrl: this.webDavUrl(id),
      });
    }
    return versions.sort((a, b) => a.id.localeCompare(b.id));
  }

  private async readVersionFile(): Promise<CodeVersionFileEntry[]> {
    // The server rewrites the file under a lock; retry once if a read catches it mid-write.
    for (let attempt = 0; attempt < 2; attempt++) {
      const content = Buffer.from(await this.instance.webdav.get(`Cartridges/${VERSION_FILE}`)).toString('utf8');
      const parsed = parseCodeVersionFile(content);
      if (parsed) return parsed;
    }
    throw new Error('Cartridges/.version is incomplete; try again');
  }

  private webDavUrl(id: string): string {
    return `https://${this.instance.webdavHostname}/on/demandware.servlet/webdav/Sites/Cartridges/${encodeURIComponent(id)}`;
  }
}
