/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * mTLS code upload certificate operations for B2C Commerce.
 *
 * Two-factor (mTLS) code upload to staging via eCDN works with a private
 * certificate authority (CA):
 *
 * 1. Generate a CA certificate and key ({@link generateCaCertificate}).
 * 2. Upload the CA to eCDN ({@link createCodeUploadCertificate}). The response
 *    includes the code upload hostname associated with the staging zone.
 * 3. Issue one or more client certificates signed by the CA, bundled as PKCS12
 *    (`.p12`) files ({@link issueClientCertificate}). Each user (named after their
 *    Business Manager username) or CI pipeline (named after its API client ID)
 *    gets its own client certificate for WebDAV uploads; the CA itself is never
 *    used as a client certificate.
 *
 * The CA certificate may be valid for at most {@link MAX_CODE_UPLOAD_CA_VALIDITY_DAYS}
 * days. To rotate, upload a new CA before the old one expires, re-issue client
 * certificates from it, then delete the old CA.
 *
 * ## Usage
 *
 * ```typescript
 * import {createCdnZonesClient} from '@salesforce/b2c-tooling-sdk/clients';
 * import {
 *   createCodeUploadCertificate,
 *   generateCaCertificate,
 *   issueClientCertificate,
 * } from '@salesforce/b2c-tooling-sdk/operations/mtls';
 *
 * const ca = generateCaCertificate({commonName: 'My Code Upload CA'});
 * const client = createCdnZonesClient({shortCode, tenantId}, auth, {readWrite: true});
 * const uploaded = await createCodeUploadCertificate(client, organizationId, {
 *   name: 'code-upload',
 *   certificatePem: ca.certificatePem,
 *   privateKeyPem: ca.privateKeyPem,
 * });
 *
 * const clientCert = issueClientCertificate({ca, commonName: 'build-server'});
 * await fs.writeFile('build-server.p12', clientCert.pkcs12);
 * // clientCert.passphrase protects the .p12; uploaded.mtlsAssociatedCodeUploadHostname
 * // is the WebDAV hostname to use with it.
 * ```
 *
 * @module operations/mtls
 */
import {generateKeyPairSync, randomBytes, X509Certificate} from 'node:crypto';
import forge from 'node-forge';
import type {CdnZonesClient, CdnZonesComponents} from '../../clients/index.js';
import {getApiErrorMessage} from '../../clients/error-utils.js';
import {getLogger} from '../../logging/logger.js';

/** eCDN mTLS certificate as returned by the CDN Zones API. */
export type MtlsCertificate = CdnZonesComponents['schemas']['MtlsCertificateResponse'];

/**
 * Maximum validity eCDN accepts for an uploaded code upload CA certificate.
 * Also the default validity for {@link generateCaCertificate}.
 */
export const MAX_CODE_UPLOAD_CA_VALIDITY_DAYS = 365;

/** Default validity for a generated CA certificate. */
export const DEFAULT_CA_VALIDITY_DAYS = MAX_CODE_UPLOAD_CA_VALIDITY_DAYS;

/** Default validity for an issued client certificate (1 year). */
export const DEFAULT_CLIENT_VALIDITY_DAYS = 365;

/** Default RSA key size in bits. */
export const DEFAULT_KEY_SIZE = 2048;

/** A PEM-encoded certificate and its private key. */
export interface CertificateKeyPair {
  /** PEM-encoded X.509 certificate */
  certificatePem: string;
  /** PEM-encoded private key */
  privateKeyPem: string;
}

/** A generated certificate with metadata. */
export interface GeneratedCertificate extends CertificateKeyPair {
  /** Hex-encoded serial number */
  serialNumber: string;
  /** Certificate subject distinguished name (e.g. `CN=My CA`) */
  subject: string;
  /** Start of validity */
  notBefore: Date;
  /** End of validity */
  notAfter: Date;
}

/** Options for {@link generateCaCertificate}. */
export interface GenerateCaCertificateOptions {
  /**
   * Subject common name. Salesforce recommends the staging Business Manager
   * hostname (`staging-<realm>-<customer>.demandware.net`).
   * Default: `B2C Commerce Code Upload CA`
   */
  commonName?: string;
  /** Optional subject organization (O) */
  organization?: string;
  /**
   * Validity in days. Default: {@link DEFAULT_CA_VALIDITY_DAYS}. eCDN rejects CA
   * certificates valid for more than {@link MAX_CODE_UPLOAD_CA_VALIDITY_DAYS} days.
   */
  validityDays?: number;
  /** RSA key size in bits. Default: {@link DEFAULT_KEY_SIZE} */
  keySize?: number;
}

/** Options for {@link issueClientCertificate}. */
export interface IssueClientCertificateOptions {
  /** CA certificate and private key used to sign the client certificate */
  ca: CertificateKeyPair;
  /** Subject common name identifying the client; Salesforce recommends the Business Manager username or API client ID */
  commonName: string;
  /** Optional subject organization (O) */
  organization?: string;
  /** Validity in days. Default: {@link DEFAULT_CLIENT_VALIDITY_DAYS}; capped at the CA's expiry */
  validityDays?: number;
  /** RSA key size in bits. Default: {@link DEFAULT_KEY_SIZE} */
  keySize?: number;
  /** Passphrase protecting the PKCS12 bundle. Default: a random passphrase */
  passphrase?: string;
}

/** An issued client certificate, including the PKCS12 bundle. */
export interface IssuedClientCertificate extends GeneratedCertificate {
  /** PKCS12 (`.p12`) bundle containing the client key, certificate, and CA certificate */
  pkcs12: Buffer;
  /** Passphrase protecting {@link pkcs12} */
  passphrase: string;
}

/** Options for {@link createCodeUploadCertificate}. */
export interface CreateCodeUploadCertificateOptions {
  /** Certificate name for identification */
  name: string;
  /** PEM-encoded CA certificate */
  certificatePem: string;
  /** PEM-encoded CA private key */
  privateKeyPem: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Generates a random passphrase suitable for protecting a PKCS12 bundle.
 *
 * @returns A 32-character URL-safe random string
 */
export function generatePassphrase(): string {
  return randomBytes(24).toString('base64url');
}

// Backdate the start of validity slightly to tolerate clock skew between machines.
function backdatedNow(): Date {
  return new Date(Date.now() - 5 * 60 * 1000);
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer, got ${value}`);
  }
}

// Node's native key generation is much faster than node-forge's pure JS implementation.
function generateRsaKeyPair(keySize: number): forge.pki.rsa.KeyPair {
  assertPositiveInteger(keySize, 'keySize');
  const {privateKey} = generateKeyPairSync('rsa', {
    modulusLength: keySize,
    privateKeyEncoding: {type: 'pkcs1', format: 'pem'},
    publicKeyEncoding: {type: 'spki', format: 'pem'},
  });
  const forgeKey = forge.pki.privateKeyFromPem(privateKey) as forge.pki.rsa.PrivateKey;
  return {privateKey: forgeKey, publicKey: forge.pki.setRsaPublicKey(forgeKey.n, forgeKey.e)};
}

// Positive 128-bit serial (RFC 5280 requires a positive integer of at most 20 octets).
function randomSerialNumber(): string {
  const bytes = randomBytes(16);
  bytes[0] &= 0x7f;
  bytes[0] |= 0x10;
  return bytes.toString('hex');
}

function buildSubject(commonName: string, organization?: string): forge.pki.CertificateField[] {
  const attrs: forge.pki.CertificateField[] = [{name: 'commonName', value: commonName}];
  if (organization) {
    attrs.push({name: 'organizationName', value: organization});
  }
  return attrs;
}

function formatSubject(cert: forge.pki.Certificate): string {
  return cert.subject.attributes.map((a) => `${a.shortName ?? a.name}=${String(a.value)}`).join(', ');
}

function toGenerated(cert: forge.pki.Certificate, privateKey: forge.pki.PrivateKey): GeneratedCertificate {
  return {
    certificatePem: forge.pki.certificateToPem(cert),
    privateKeyPem: forge.pki.privateKeyToPem(privateKey),
    serialNumber: cert.serialNumber,
    subject: formatSubject(cert),
    notBefore: cert.validity.notBefore,
    notAfter: cert.validity.notAfter,
  };
}

/**
 * Generates a self-signed CA certificate for mTLS code upload.
 *
 * The CA is uploaded to eCDN with {@link createCodeUploadCertificate} and used
 * to sign client certificates with {@link issueClientCertificate}. Keep the CA
 * private key secret: anyone holding it can issue trusted client certificates.
 *
 * @param options - Subject, validity, and key size options
 * @returns The CA certificate and private key as PEM strings
 */
export function generateCaCertificate(options: GenerateCaCertificateOptions = {}): GeneratedCertificate {
  const validityDays = options.validityDays ?? DEFAULT_CA_VALIDITY_DAYS;
  assertPositiveInteger(validityDays, 'validityDays');
  if (validityDays > MAX_CODE_UPLOAD_CA_VALIDITY_DAYS) {
    throw new RangeError(
      `validityDays must be at most ${MAX_CODE_UPLOAD_CA_VALIDITY_DAYS}; eCDN allows a maximum CA expiry of 1 year`,
    );
  }
  const keys = generateRsaKeyPair(options.keySize ?? DEFAULT_KEY_SIZE);

  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = randomSerialNumber();
  cert.validity.notBefore = backdatedNow();
  cert.validity.notAfter = new Date(cert.validity.notBefore.getTime() + validityDays * MS_PER_DAY);

  const subject = buildSubject(options.commonName ?? 'B2C Commerce Code Upload CA', options.organization);
  cert.setSubject(subject);
  cert.setIssuer(subject);
  cert.setExtensions([
    {name: 'basicConstraints', cA: true, critical: true},
    {name: 'keyUsage', keyCertSign: true, cRLSign: true, critical: true},
    {name: 'subjectKeyIdentifier'},
  ]);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  getLogger().debug({subject: formatSubject(cert), notAfter: cert.validity.notAfter}, 'Generated mTLS CA certificate');
  return toGenerated(cert, keys.privateKey);
}

/**
 * Issues a client certificate signed by the given CA and bundles it as PKCS12.
 *
 * The resulting `.p12` is what the CLI, IDE extension, and other WebDAV clients
 * use for two-factor code upload (`certificate` / `certificate-passphrase` in
 * dw.json). This runs entirely locally; no API call is made.
 *
 * @param options - CA, subject, validity, and passphrase options
 * @returns The client certificate, private key, and PKCS12 bundle
 * @throws Error if the CA certificate/key are invalid, don't match, or the CA has expired
 */
export function issueClientCertificate(options: IssueClientCertificateOptions): IssuedClientCertificate {
  const caCert = forge.pki.certificateFromPem(options.ca.certificatePem);
  const caKey = forge.pki.privateKeyFromPem(options.ca.privateKeyPem) as forge.pki.rsa.PrivateKey;
  const caPublicKey = caCert.publicKey as forge.pki.rsa.PublicKey;
  if (caPublicKey.n.compareTo(caKey.n) !== 0) {
    throw new Error('CA private key does not match the CA certificate');
  }

  const now = new Date();
  if (caCert.validity.notAfter <= now) {
    throw new Error(`CA certificate expired on ${caCert.validity.notAfter.toISOString()}`);
  }

  const validityDays = options.validityDays ?? DEFAULT_CLIENT_VALIDITY_DAYS;
  assertPositiveInteger(validityDays, 'validityDays');
  const keys = generateRsaKeyPair(options.keySize ?? DEFAULT_KEY_SIZE);

  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = randomSerialNumber();
  cert.validity.notBefore = backdatedNow();
  const requestedNotAfter = new Date(cert.validity.notBefore.getTime() + validityDays * MS_PER_DAY);
  cert.validity.notAfter = requestedNotAfter < caCert.validity.notAfter ? requestedNotAfter : caCert.validity.notAfter;

  cert.setSubject(buildSubject(options.commonName, options.organization));
  cert.setIssuer(caCert.subject.attributes);
  cert.setExtensions([
    {name: 'basicConstraints', cA: false, critical: true},
    {name: 'keyUsage', digitalSignature: true, keyEncipherment: true, critical: true},
    {name: 'extKeyUsage', clientAuth: true},
    {name: 'subjectKeyIdentifier'},
    {name: 'authorityKeyIdentifier', keyIdentifier: caCert.generateSubjectKeyIdentifier().getBytes()},
  ]);
  cert.sign(caKey, forge.md.sha256.create());

  const passphrase = options.passphrase ?? generatePassphrase();
  // 3DES matches `openssl pkcs12 -export -legacy`, which Salesforce recommends so the
  // bundle can be imported into macOS Keychain and other tools that lack AES PBES2 support.
  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert, caCert], passphrase, {
    algorithm: '3des',
    friendlyName: options.commonName,
  });
  const pkcs12 = Buffer.from(forge.asn1.toDer(p12Asn1).getBytes(), 'binary');

  getLogger().debug({subject: formatSubject(cert), notAfter: cert.validity.notAfter}, 'Issued mTLS client certificate');
  return {...toGenerated(cert, keys.privateKey), pkcs12, passphrase};
}

/**
 * Validates that a PEM certificate can be uploaded as a code upload CA.
 *
 * The CA certificate bundle is allowed a maximum expiry of 1 year
 * ({@link MAX_CODE_UPLOAD_CA_VALIDITY_DAYS} days); before it expires it must be
 * renewed to avoid disruption with code uploads.
 *
 * @param certificatePem - PEM-encoded CA certificate
 * @throws Error if the certificate can't be parsed, isn't a CA, is expired, or is valid for more than 1 year
 */
export function validateCodeUploadCaCertificate(certificatePem: string): void {
  let cert: X509Certificate;
  try {
    cert = new X509Certificate(certificatePem);
  } catch (error) {
    throw new Error(`Invalid CA certificate: ${error instanceof Error ? error.message : String(error)}`, {
      cause: error,
    });
  }
  if (!cert.ca) {
    throw new Error(
      'Certificate is not a CA certificate. Upload the CA that signs your client certificates, not a client certificate. ' +
        'If you generated it with OpenSSL, add -addext "basicConstraints=critical,CA:TRUE" -addext "keyUsage=critical,keyCertSign,cRLSign" ' +
        '(the macOS default OpenSSL configuration omits them).',
    );
  }
  const notBefore = new Date(cert.validFrom);
  const notAfter = new Date(cert.validTo);
  if (notAfter.getTime() <= Date.now()) {
    throw new Error(`CA certificate expired on ${notAfter.toISOString()}`);
  }
  const validityDays = (notAfter.getTime() - notBefore.getTime()) / MS_PER_DAY;
  if (validityDays > MAX_CODE_UPLOAD_CA_VALIDITY_DAYS) {
    throw new Error(
      `CA certificate is valid for ${Math.floor(validityDays)} days; eCDN allows a maximum CA expiry of 1 year (${MAX_CODE_UPLOAD_CA_VALIDITY_DAYS} days).`,
    );
  }
}

/**
 * Uploads a CA certificate to eCDN for two-factor (mTLS) code upload.
 *
 * Requires a read-write CDN Zones client (`sfcc.cdn-zones.rw` scope) for a
 * staging organization. The certificate is checked locally first with
 * {@link validateCodeUploadCaCertificate}.
 *
 * @param client - Read-write CDN Zones client
 * @param organizationId - Organization ID (`f_ecom_<tenant>`)
 * @param options - Certificate name and PEM contents
 * @returns The created certificate, including `mtlsAssociatedCodeUploadHostname`
 * @throws Error if the certificate is invalid or the API request fails
 */
export async function createCodeUploadCertificate(
  client: CdnZonesClient,
  organizationId: string,
  options: CreateCodeUploadCertificateOptions,
): Promise<MtlsCertificate> {
  validateCodeUploadCaCertificate(options.certificatePem);
  const {data, error, response} = await client.POST('/organizations/{organizationId}/mtls/code-upload-certificates', {
    params: {path: {organizationId}},
    body: {name: options.name, certificate: options.certificatePem, privateKey: options.privateKeyPem},
  });

  if (error) {
    throw new Error(`Failed to create mTLS certificate: ${getApiErrorMessage(error, response)}`, {cause: error});
  }
  if (!data?.data) {
    throw new Error('No certificate data returned from API');
  }
  return data.data;
}
