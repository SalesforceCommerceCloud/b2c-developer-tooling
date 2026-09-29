/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import * as fs from 'node:fs';
import path from 'node:path';
import {normalizeTenantId, type CdnZonesClient} from '@salesforce/b2c-tooling-sdk/clients';
import {
  createCodeUploadCertificate,
  generateCaCertificate,
  issueClientCertificate,
  type MtlsCertificate,
} from '@salesforce/b2c-tooling-sdk/operations/mtls';

/** Paths of the files written when generating code upload certificates. */
export interface CodeUploadCertificateFiles {
  /** CA certificate (PEM) — uploaded to eCDN */
  caCertificate: string;
  /** CA private key (PEM) — needed to issue more client certificates */
  caPrivateKey: string;
  /** Client certificate bundle (PKCS12) — used for WebDAV code upload */
  clientCertificate: string;
}

/** Options for {@link generateAndUploadCodeUploadCertificate}. */
export interface GenerateAndUploadOptions {
  caCommonName?: string;
  caValidityDays?: number;
  client: CdnZonesClient;
  clientName: string;
  clientValidityDays?: number;
  force?: boolean;
  name: string;
  onProgress?: (message: string) => void;
  organizationId: string;
  outDir: string;
  passphrase?: string;
}

/** Result of {@link generateAndUploadCodeUploadCertificate}. */
export interface GenerateAndUploadResult {
  /** Expiry of the generated CA (ISO 8601) */
  caExpiresOn: string;
  certificate: MtlsCertificate;
  clientPassphrase: string;
  files: CodeUploadCertificateFiles;
}

/**
 * Converts a name into a safe file name stem.
 */
export function toFileStem(name: string): string {
  return (
    name
      .trim()
      .replaceAll(/[^\w.-]+/g, '-')
      .replaceAll(/^-+|-+$/g, '') || 'client'
  );
}

/**
 * Throws if any of the given files exist and `force` is not set.
 */
export function assertFilesWritable(files: string[], force = false): void {
  if (force) return;
  const existing = files.filter((f) => fs.existsSync(f));
  if (existing.length > 0) {
    throw new Error(`Refusing to overwrite existing file(s): ${existing.join(', ')}. Use --force to overwrite.`);
  }
}

/**
 * Writes a file readable only by the current user, creating parent directories.
 */
export function writePrivateFile(file: string, data: Buffer | string): void {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, data, {mode: 0o600});
  // writeFileSync only applies mode to new files
  fs.chmodSync(file, 0o600);
}

/**
 * Writes a `.gitignore` ignoring everything in a directory of generated secrets,
 * unless the directory already has one.
 */
export function ensureGitIgnored(dir: string): void {
  const gitignore = path.resolve(dir, '.gitignore');
  if (fs.existsSync(gitignore)) return;
  fs.mkdirSync(path.dirname(gitignore), {recursive: true});
  fs.writeFileSync(gitignore, '# Generated mTLS certificates and keys: never commit these\n*\n');
}

/**
 * Resolves the default CA common name. Salesforce recommends the staging
 * Business Manager hostname (`staging-<realm>-<customer>.demandware.net`).
 */
export function defaultCaCommonName(name: string, hostname?: string): string {
  return hostname?.startsWith('staging-') ? hostname : `${name} CA`;
}

/**
 * Returns a warning if the organization is not a staging organization;
 * eCDN only accepts code upload certificates for `_stg` organizations.
 */
export function stagingOrganizationWarning(organizationId: string): string | undefined {
  if (organizationId.endsWith('_stg')) return undefined;
  return `Code upload certificates are only supported for staging organizations (tenant ID ending in "_stg"); "${organizationId}" may be rejected.`;
}

/**
 * Human-readable security guidance for a generated CA private key.
 */
export function caKeySecurityNotice(caPrivateKey: string, caExpiresOn?: string): string {
  const lines = [
    ux.colorize('yellow', 'IMPORTANT: protect the CA private key'),
    `  ${caPrivateKey}`,
    '  Anyone with this key can issue client certificates that are trusted for code upload',
    '  to your staging instance. Treat it like a password:',
    '    - Move it (and ca.pem) to a secure location such as a password manager or secrets vault.',
    '      It is only needed to issue new client certificates ("b2c ecdn mtls issue").',
    '    - Never commit it to a source repository or share it. The output directory',
    '      contains a .gitignore to help prevent this.',
    '    - Give each user or pipeline its own client certificate (.p12) instead of sharing the CA.',
  ];
  if (caExpiresOn) {
    lines.push(
      '',
      `  The CA expires on ${caExpiresOn}. The CA certificate bundle is allowed a maximum expiry`,
      '  of 1 year; renew it before it expires to avoid disruption with code uploads. Create a',
      '  new CA, re-issue client certificates from it, verify uploads, then delete the old CA.',
    );
  }
  return lines.join('\n');
}

/**
 * Human-readable guidance for an issued client certificate.
 */
export function clientCertificateNotice(options: {file: string; hostname?: string; passphrase: string}): string {
  // On Hyperforce the code upload hostname is the standard staging hostname, so a
  // separate webdav-hostname isn't needed.
  const config: Record<string, string> = {};
  if (options.hostname) config.hostname = options.hostname;
  config.certificate = options.file;
  config['certificate-passphrase'] = options.passphrase;
  const snippet = JSON.stringify(config, null, 2)
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n');
  return [
    'Client certificate (use this for code upload, not the CA):',
    `  File:        ${options.file}`,
    `  Passphrase:  ${options.passphrase}`,
    '  The .p12 and its passphrase are credentials: store them securely, keep the',
    '  passphrase separate from the file, and never commit either to a repository.',
    '',
    '  To upload code, add these settings to your instance in dw.json',
    '  (or use --server, --certificate and --passphrase):',
    snippet,
  ].join('\n');
}

/**
 * Generates a CA, uploads it to eCDN, and issues a first client certificate.
 *
 * CA files are written before the upload so the CA key is never lost: if the
 * upload fails, the files can be uploaded later with `--certificate-file` and
 * `--private-key-file`.
 */
export async function generateAndUploadCodeUploadCertificate(
  options: GenerateAndUploadOptions,
): Promise<GenerateAndUploadResult> {
  const progress = options.onProgress ?? (() => {});
  const files: CodeUploadCertificateFiles = {
    caCertificate: path.resolve(options.outDir, 'ca.pem'),
    caPrivateKey: path.resolve(options.outDir, 'ca.key'),
    clientCertificate: path.resolve(options.outDir, `${toFileStem(options.clientName)}.p12`),
  };
  assertFilesWritable(Object.values(files), options.force);

  ensureGitIgnored(options.outDir);
  progress(`Generating CA certificate for tenant ${normalizeTenantId(options.organizationId)}...`);
  const ca = generateCaCertificate({
    commonName: options.caCommonName ?? `${options.name} CA`,
    validityDays: options.caValidityDays,
  });
  writePrivateFile(files.caCertificate, ca.certificatePem);
  writePrivateFile(files.caPrivateKey, ca.privateKeyPem);

  progress('Uploading CA certificate to eCDN...');
  let certificate: MtlsCertificate;
  try {
    certificate = await createCodeUploadCertificate(options.client, options.organizationId, {
      name: options.name,
      certificatePem: ca.certificatePem,
      privateKeyPem: ca.privateKeyPem,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `${message}\nThe generated CA was saved to ${files.caCertificate} and ${files.caPrivateKey}; ` +
        'retry the upload with --certificate-file and --private-key-file.',
      {cause: error},
    );
  }

  progress(`Issuing client certificate "${options.clientName}" signed by the CA...`);
  const clientCert = issueClientCertificate({
    ca,
    commonName: options.clientName,
    validityDays: options.clientValidityDays,
    passphrase: options.passphrase,
  });
  writePrivateFile(files.clientCertificate, clientCert.pkcs12);

  return {caExpiresOn: ca.notAfter.toISOString(), certificate, clientPassphrase: clientCert.passphrase, files};
}
