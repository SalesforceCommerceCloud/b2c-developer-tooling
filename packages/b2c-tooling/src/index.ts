// Logging
export {createLogger, configureLogger, getLogger, resetLogger, createSilentLogger} from './logging/index.js';
export type {Logger, LoggerOptions, LogLevel, LogContext} from './logging/index.js';

// Legacy logger exports (deprecated - use logging module instead)
export {noopLogger, consoleLogger, setLogger, getLogger as getLegacyLogger} from './logger.js';
export type {Logger as LegacyLogger} from './logger.js';

// i18n
export {t, setLanguage, getLanguage, getI18nInstance, registerTranslations, B2C_NAMESPACE} from './i18n/index.js';
export type {TOptions} from './i18n/index.js';

// Config
export {loadDwJson, findDwJson} from './config/index.js';
export type {DwJsonConfig, DwJsonMultiConfig, LoadDwJsonOptions} from './config/index.js';

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
export type {InstanceConfig, FromDwJsonOptions, B2CInstanceOptions} from './instance/index.js';

// Clients
export {
  WebDavClient,
  createOcapiClient,
  createAuthMiddleware,
  createExtraParamsMiddleware,
  createSlasClient,
  createOdsClient,
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
  OdsClient as OdsApiClient,
  OdsClientConfig,
  OdsError,
  OdsResponse,
  OdsPaths,
  OdsComponents,
} from './clients/index.js';

// Context Layer - Platform
export {MrtClient, OdsClient} from './platform/index.js';
export type {MrtProject, OdsConfig} from './platform/index.js';

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
export {runJob, getJobStatus} from './operations/jobs/index.js';
export type {JobExecutionResult} from './operations/jobs/index.js';

// Operations - Sites
export {listSites, getSite} from './operations/sites/index.js';
export type {Site} from './operations/sites/index.js';

// Defaults
export {DEFAULT_ACCOUNT_MANAGER_HOST, DEFAULT_ODS_HOST} from './defaults.js';
