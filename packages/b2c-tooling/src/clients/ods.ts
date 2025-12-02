/**
 * ODS (On-Demand Sandbox) API client for B2C Commerce.
 *
 * Provides a fully typed client for the Developer Sandbox REST API using
 * openapi-fetch with OAuth authentication middleware. Used for managing
 * developer sandboxes including creation, deletion, start/stop operations,
 * and retrieving realm and system information.
 *
 * @module clients/ods
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './ods.generated.js';
import {createAuthMiddleware, createLoggingMiddleware, createExtraParamsMiddleware} from './middleware.js';
import type {ExtraParamsConfig} from './middleware.js';

/**
 * Default ODS API host for US region.
 */
const DEFAULT_ODS_HOST = 'admin.dx.commercecloud.salesforce.com';

/**
 * Re-export generated types for external use.
 */
export type {paths, components};

/**
 * The typed ODS client - this is the openapi-fetch Client with full type safety.
 *
 * @see {@link createOdsClient} for instantiation
 */
export type OdsClient = Client<paths>;

/**
 * Helper type to extract response data from an operation.
 */
export type OdsResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;

/**
 * ODS error response type from the generated schema.
 *
 * @example
 * ```typescript
 * const { data, error } = await client.GET('/sandboxes/{sandboxId}', {
 *   params: { path: { sandboxId: 'invalid-id' } }
 * });
 * if (error) {
 *   // Access the structured error message
 *   console.error(error.error?.message);
 * }
 * ```
 */
export type OdsError = components['schemas']['ErrorResponse'];

/**
 * Configuration for creating an ODS client.
 */
export interface OdsClientConfig {
  /**
   * The ODS API host.
   * Defaults to Unified region: admin.dx.commercecloud.salesforce.com
   *
   * @example "admin.dx.commercecloud.salesforce.com"
   */
  host?: string;

  /**
   * Extra parameters to add to all requests.
   * Useful for internal/power-user scenarios where you need to pass
   * parameters that aren't in the typed OpenAPI schema.
   */
  extraParams?: ExtraParamsConfig;
}

/**
 * Creates a typed ODS (On-Demand Sandbox) API client.
 *
 * Returns the openapi-fetch client directly, with authentication
 * handled via middleware. This gives full access to all openapi-fetch
 * features with type-safe paths, parameters, and responses.
 *
 * @param config - ODS client configuration
 * @param auth - Authentication strategy (typically OAuth)
 * @returns Typed openapi-fetch client
 *
 * @example
 * // Create ODS client with OAuth auth
 * const oauthStrategy = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * const client = createOdsClient({}, oauthStrategy);
 *
 * // Get user info
 * const { data, error } = await client.GET('/me', {});
 * if (data) {
 *   console.log('User:', data.data?.user?.name);
 *   console.log('Realms:', data.data?.realms);
 * }
 *
 * @example
 * // Get system info
 * const { data, error } = await client.GET('/system', {});
 * if (data) {
 *   console.log('Region:', data.data?.region);
 *   console.log('Sandbox IPs:', data.data?.sandboxIps);
 * }
 *
 * @example
 * // List all sandboxes
 * const { data, error } = await client.GET('/sandboxes', {});
 * if (data) {
 *   for (const sandbox of data.data ?? []) {
 *     console.log(`${sandbox.id}: ${sandbox.state}`);
 *   }
 * }
 *
 * @example
 * // Create a new sandbox
 * const { data, error } = await client.POST('/sandboxes', {
 *   body: {
 *     realm: 'abcd',
 *     ttl: 24,
 *     resourceProfile: 'medium',
 *   }
 * });
 *
 * @example
 * // Start a sandbox
 * const { data, error } = await client.POST('/sandboxes/{sandboxId}/operations', {
 *   params: { path: { sandboxId: 'sandbox-uuid' } },
 *   body: { operation: 'start' }
 * });
 */
export function createOdsClient(config: OdsClientConfig, auth: AuthStrategy): OdsClient {
  const host = config.host ?? DEFAULT_ODS_HOST;

  const client = createClient<paths>({
    baseUrl: `https://${host}/api/v1`,
  });

  // Middleware order: extraParams → auth → logging
  // This ensures logging sees the fully modified request (with auth headers and extra params)
  if (config.extraParams) {
    client.use(createExtraParamsMiddleware(config.extraParams));
  }
  client.use(createAuthMiddleware(auth));
  client.use(createLoggingMiddleware('ODS'));

  return client;
}
