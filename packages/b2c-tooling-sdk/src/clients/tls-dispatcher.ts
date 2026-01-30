/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * TLS/mTLS dispatcher utilities for client certificate authentication.
 *
 * This module provides utilities for creating undici Agents with custom
 * TLS options, enabling two-factor authentication via client certificates.
 *
 * @module clients/tls-dispatcher
 */
import {Agent} from 'undici';
import * as fs from 'node:fs';
import * as tls from 'node:tls';
import {getLogger} from '../logging/logger.js';

/**
 * TLS options for creating a dispatcher.
 */
export interface TlsOptions {
  /** Path to PKCS12 (.p12/.pfx) certificate file */
  certificate?: string;
  /** Passphrase for the certificate */
  passphrase?: string;
  /** Whether to reject unauthorized (invalid/self-signed) certificates */
  rejectUnauthorized?: boolean;
}

/**
 * Validates a PKCS12 certificate file by attempting to create a secure context.
 * This catches errors like missing/wrong passphrase early with a clear message.
 *
 * @param pfxData - The raw PKCS12 file data
 * @param passphrase - Optional passphrase for the certificate
 * @param certificatePath - Path to the certificate (for error messages)
 * @throws Error with a user-friendly message if validation fails
 */
function validatePkcs12(pfxData: Buffer, passphrase: string | undefined, certificatePath: string): void {
  try {
    tls.createSecureContext({
      pfx: pfxData,
      passphrase: passphrase,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Detect common PKCS12 errors and provide helpful messages
    if (message.includes('mac verify failure') || message.includes('bad decrypt')) {
      if (passphrase) {
        throw new Error(
          `Invalid passphrase for certificate "${certificatePath}". ` + `The provided passphrase is incorrect.`,
        );
      } else {
        throw new Error(
          `Certificate "${certificatePath}" requires a passphrase. ` +
            `Use --passphrase to provide it, or set SFCC_CERTIFICATE_PASSPHRASE.`,
        );
      }
    }

    if (message.includes('not enough data') || message.includes('wrong tag')) {
      throw new Error(
        `Invalid certificate file "${certificatePath}". ` +
          `The file does not appear to be a valid PKCS12 (.p12/.pfx) certificate.`,
      );
    }

    // Re-throw with context for other errors
    throw new Error(`Failed to load certificate "${certificatePath}": ${message}`);
  }
}

/**
 * Creates an undici Agent with custom TLS options for mTLS/self-signed cert support.
 *
 * Returns undefined if no TLS options are needed (default fetch behavior).
 *
 * @param options - TLS configuration options
 * @returns An undici Agent configured for TLS, or undefined if not needed
 *
 * @example
 * // Client certificate authentication
 * const dispatcher = createTlsDispatcher({
 *   certificate: './my-cert.p12',
 *   passphrase: 'secret',
 * });
 *
 * @example
 * // Self-signed certificate support
 * const dispatcher = createTlsDispatcher({
 *   rejectUnauthorized: false,
 * });
 */
export function createTlsDispatcher(options: TlsOptions): Agent | undefined {
  const logger = getLogger();
  const {certificate, passphrase, rejectUnauthorized} = options;

  // If no TLS customization needed, return undefined to use default fetch
  if (!certificate && rejectUnauthorized !== false) {
    return undefined;
  }

  const connect: Record<string, unknown> = {};

  if (rejectUnauthorized === false) {
    logger.debug('[TLS] Disabling SSL certificate verification (self-signed mode)');
    connect.rejectUnauthorized = false;
  }

  if (certificate) {
    logger.debug({certificate}, `[TLS] Loading client certificate from: ${certificate}`);

    // Read the certificate file
    let pfxData: Buffer;
    try {
      pfxData = fs.readFileSync(certificate);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read certificate file "${certificate}": ${message}`);
    }

    // Validate the certificate upfront to catch passphrase issues early
    validatePkcs12(pfxData, passphrase, certificate);

    connect.pfx = pfxData;
    if (passphrase) {
      connect.passphrase = passphrase;
    }
  }

  return new Agent({connect});
}
