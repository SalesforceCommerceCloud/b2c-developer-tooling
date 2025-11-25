/**
 * Redaction configuration for pino.
 */

const REDACT_FIELDS = [
  'password',
  'client_secret',
  'clientSecret',
  'access_token',
  'accessToken',
  'refresh_token',
  'refreshToken',
  'api_key',
  'apiKey',
  'token',
  'secret',
  'authorization',
];

export function isRedactionDisabled(): boolean {
  return process.env.SFCC_REDACT_SECRETS === 'false';
}

export function getRedactPaths(): string[] {
  return REDACT_FIELDS.flatMap((field) => [field, `*.${field}`]);
}
