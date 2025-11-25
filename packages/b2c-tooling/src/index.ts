// Logging
export {createLogger, configureLogger, getLogger, resetLogger, createSilentLogger} from './logging/index.js';
export type {Logger, LoggerOptions, LogLevel, LogContext} from './logging/index.js';

// Legacy logger exports (deprecated - use logging module instead)
export {noopLogger, consoleLogger, setLogger, getLogger as getLegacyLogger} from './logger.js';
export type {Logger as LegacyLogger} from './logger.js';

// i18n
export {t, setLanguage, getLanguage, getI18nInstance, registerTranslations, B2C_NAMESPACE} from './i18n/index.js';
export type {TOptions} from './i18n/index.js';

// Auth Layer - Strategies
export {
  AuthStrategy,
  AccessTokenResponse,
  DecodedJWT,
  BasicAuthStrategy,
  OAuthStrategy,
  OAuthConfig,
  ApiKeyStrategy,
  decodeJWT,
} from './auth/index.js';

// Context Layer - Instance
export {B2CInstance, InstanceConfig} from './instance/index.js';

// Context Layer - Platform
export {MrtClient, MrtProject, OdsClient, OdsConfig} from './platform/index.js';

// Operations - Code
export {uploadCartridges, activateCodeVersion} from './operations/code/index.js';

// Operations - Jobs
export {runJob, getJobStatus, JobExecutionResult} from './operations/jobs/index.js';

// Operations - Sites
export {listSites, getSite, Site} from './operations/sites/index.js';
