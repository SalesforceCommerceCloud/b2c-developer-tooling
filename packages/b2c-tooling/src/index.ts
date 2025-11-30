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

// Auth Layer - Strategies
export {BasicAuthStrategy, OAuthStrategy, ApiKeyStrategy, decodeJWT} from './auth/index.js';
export type {
  AuthStrategy,
  AccessTokenResponse,
  DecodedJWT,
  OAuthConfig,
  AuthConfig,
  BasicAuthConfig,
  OAuthAuthConfig,
  ApiKeyAuthConfig,
} from './auth/index.js';

// Context Layer - Instance
export {B2CInstance} from './instance/index.js';
export type {InstanceConfig, FromDwJsonOptions, B2CInstanceOptions} from './instance/index.js';

// Clients
export {WebDavClient, createOcapiClient, createAuthMiddleware, createSlasClient} from './clients/index.js';
export type {
  PropfindEntry,
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
} from './clients/index.js';

// Context Layer - Platform
export {MrtClient, OdsClient} from './platform/index.js';
export type {MrtProject, OdsConfig} from './platform/index.js';

// Operations - Code
export {uploadCartridges, activateCodeVersion} from './operations/code/index.js';

// Operations - Jobs
export {runJob, getJobStatus} from './operations/jobs/index.js';
export type {JobExecutionResult} from './operations/jobs/index.js';

// Operations - Sites
export {listSites, getSite} from './operations/sites/index.js';
export type {Site} from './operations/sites/index.js';
