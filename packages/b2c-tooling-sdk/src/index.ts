/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
export {createLogger, configureLogger, getLogger, resetLogger, createSilentLogger} from './logging/index.js';
export type {Logger, LoggerOptions, LogLevel, LogContext} from './logging/index.js';

// i18n
export {t, setLanguage, getLanguage, getI18nInstance, registerTranslations, B2C_NAMESPACE} from './i18n/index.js';
export type {TOptions} from './i18n/index.js';

// Config
export {loadDwJson, findDwJson, resolveConfig, ConfigResolver, createConfigResolver} from './config/index.js';
export type {
  DwJsonConfig,
  DwJsonMultiConfig,
  LoadDwJsonOptions,
  NormalizedConfig,
  ResolvedB2CConfig,
  ConfigWarning,
  ConfigWarningCode,
  ConfigSourceInfo,
  ConfigSource,
  ResolveConfigOptions,
  CreateOAuthOptions,
} from './config/index.js';

// Auth Layer - Strategies and Resolution
export {
  BasicAuthStrategy,
  OAuthStrategy,
  ImplicitOAuthStrategy,
  ApiKeyStrategy,
  decodeJWT,
  resolveAuthStrategy,
  checkAvailableAuthMethods,
  ALL_AUTH_METHODS,
} from './auth/index.js';
export type {
  AuthStrategy,
  AccessTokenResponse,
  DecodedJWT,
  OAuthConfig,
  ImplicitOAuthConfig,
  AuthConfig,
  BasicAuthConfig,
  OAuthAuthConfig,
  ApiKeyAuthConfig,
  AuthMethod,
  AuthCredentials,
  ResolveAuthStrategyOptions,
  AvailableAuthMethods,
} from './auth/index.js';

// Context Layer - Instance
export {B2CInstance} from './instance/index.js';
export type {InstanceConfig} from './instance/index.js';

// Clients
export {
  WebDavClient,
  createOcapiClient,
  createAuthMiddleware,
  createExtraParamsMiddleware,
  createSlasClient,
  createOdsClient,
  createCustomApisClient,
  createAccountManagerUsersClient,
  createAccountManagerRolesClient,
  createAccountManagerApiClientsClient,
  createAccountManagerOrgsClient,
  createCdnZonesClient,
  toOrganizationId,
  toTenantId,
  buildTenantScope,
  getApiErrorMessage,
  isValidRoleTenantFilter,
  ORGANIZATION_ID_PREFIX,
  ROLE_TENANT_FILTER_PATTERN,
  SCAPI_TENANT_SCOPE_PREFIX,
  CUSTOM_APIS_DEFAULT_SCOPES,
  CDN_ZONES_READ_SCOPES,
  CDN_ZONES_RW_SCOPES,
} from './clients/index.js';
export type {
  PropfindEntry,
  ExtraParamsConfig,
  OcapiClient,
  OcapiError,
  OcapiResponse,
  OcapiPaths,
  OcapiComponents,
  SlasClient,
  SlasClientConfig,
  SlasError,
  SlasResponse,
  SlasPaths,
  SlasComponents,
  OdsClient,
  OdsClientConfig,
  OdsError,
  OdsResponse,
  OdsPaths,
  OdsComponents,
  CustomApisClient,
  CustomApisClientConfig,
  CustomApisError,
  CustomApisResponse,
  CustomApisPaths,
  CustomApisComponents,
  AccountManagerUsersClient,
  AccountManagerClientConfig,
  AccountManagerUser,
  AccountManagerResponse,
  AccountManagerError,
  UserCreate,
  UserUpdate,
  UserCollection,
  UserState,
  UserExpandOption,
  AccountManagerRolesClient,
  AccountManagerRole,
  AccountManagerRolesResponse,
  AccountManagerRolesError,
  RoleCollection,
  ListRolesOptions,
  AccountManagerApiClientsClient,
  AccountManagerApiClient,
  APIClientCreate,
  APIClientUpdate,
  APIClientCollection,
  ApiClientExpandOption,
  ListApiClientsOptions,
  AccountManagerOrgsClient,
  AccountManagerOrganization,
  OrganizationCollection,
  ListOrgsOptions,
  CdnZonesClient,
  CdnZonesClientConfig,
  CdnZonesClientOptions,
  CdnZonesError,
  CdnZonesResponse,
  Zone,
  ZonesEnvelope,
  CdnZonesPaths,
  CdnZonesComponents,
} from './clients/index.js';

// Operations - Code
export {
  findCartridges,
  listCodeVersions,
  getActiveCodeVersion,
  activateCodeVersion,
  reloadCodeVersion,
  deleteCodeVersion,
  createCodeVersion,
  findAndDeployCartridges,
  uploadCartridges,
  deleteCartridges,
  watchCartridges,
} from './operations/code/index.js';
export type {
  CartridgeMapping,
  FindCartridgesOptions,
  CodeVersion,
  CodeVersionResult,
  DeployOptions,
  DeployResult,
  WatchOptions,
  WatchResult,
} from './operations/code/index.js';

// Operations - Jobs
export {
  executeJob,
  getJobExecution,
  waitForJob,
  searchJobExecutions,
  findRunningJobExecution,
  getJobLog,
  getJobErrorMessage,
  JobExecutionError,
  siteArchiveImport,
  siteArchiveExport,
  siteArchiveExportToPath,
} from './operations/jobs/index.js';
export type {
  JobExecution,
  JobStepExecution,
  JobExecutionStatus,
  JobExecutionParameter,
  ExecuteJobOptions,
  WaitForJobOptions,
  SearchJobExecutionsOptions,
  JobExecutionSearchResult,
  SiteArchiveImportOptions,
  SiteArchiveImportResult,
  SiteArchiveExportOptions,
  SiteArchiveExportResult,
  ExportDataUnitsConfiguration,
  ExportSitesConfiguration,
  ExportGlobalDataConfiguration,
} from './operations/jobs/index.js';

// Docs - Documentation search
export {
  searchDocs,
  readDoc,
  readDocByQuery,
  listDocs,
  loadSearchIndex,
  listSchemas,
  readSchema,
  readSchemaByQuery,
  searchSchemas,
  downloadDocs,
} from './docs/index.js';
export type {
  DocEntry,
  SearchIndex,
  SearchResult,
  SchemaEntry,
  SchemaIndex,
  SchemaSearchResult,
  DownloadDocsOptions,
  DownloadDocsResult,
} from './docs/index.js';

// Operations - ODS
export {
  isUuid,
  isFriendlySandboxId,
  parseFriendlySandboxId,
  resolveSandboxId,
  SandboxNotFoundError,
  waitForSandbox,
  SandboxPollingTimeoutError,
  SandboxPollingError,
  SandboxTerminalStateError,
} from './operations/ods/index.js';

export type {SandboxState, WaitForSandboxOptions, WaitForSandboxPollInfo} from './operations/ods/index.js';

// Operations - Users
export {
  getUser,
  getUserByLogin,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  purgeUser,
  resetUser,
  grantRole,
  revokeRole,
} from './operations/users/index.js';

// Operations - Roles
export {getRole, listRoles} from './operations/roles/index.js';

// Operations - Organizations
export {getOrg, getOrgByName, listOrgs} from './operations/orgs/index.js';

// Defaults
export {DEFAULT_ACCOUNT_MANAGER_HOST, DEFAULT_ODS_HOST, DEFAULT_PUBLIC_CLIENT_ID} from './defaults.js';

// Version info
export {SDK_NAME, SDK_VERSION, SDK_USER_AGENT} from './version.js';
