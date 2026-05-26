/**
 * Script API for configuring HTTP client logging and sensitive data redaction.
 * 
 * This class provides a customer-facing interface for configuring HTTP client logging behavior, including
 * enabling/disabling logging, setting log levels, and defining sensitive fields that should be redacted from HTTP
 * request and response bodies.
 * 
 * Security Note: This class handles sensitive security-related data and logging
 * configuration. Pay special attention to PCI DSS requirements when configuring sensitive field redaction to ensure
 * proper data protection.
 * Sensitive Fields of appropriate types MUST be set else logging will be skipped.
 * 
 * Usage Example:
 * 
 * ```
 * var config = new dw.net.HTTPClientLoggingConfig();
 * // Enable logging and set level
 * config.setEnabled(true);
 * config.setLevel("INFO");
 * // Configure sensitive JSON fields
 * config.setSensitiveJsonFields(["password", "creditCard", "ssn"]);
 * // Configure sensitive XML fields
 * config.setSensitiveXmlFields(["password", "creditCard", "ssn"]);
 * // Configure sensitive headers
 * config.setSensitiveHeaders(["authorization", "x-api-key", "cookie"]);
 * // Configure sensitive body fields (for form data)
 * config.setSensitiveBodyFields(["password", "creditCard", "ssn"]);
 * // Configure text patterns for plain text/HTML content
 * config.setSensitiveTextPatterns([["password\\s*=\\s*[^\\s&]+"]]);
 * ```
 * 
 * Content Type Support:
 * 
 * - JSON: Use setSensitiveJsonFields() to specify field names to redact
 * - XML: Use setSensitiveXmlFields() to specify element/attribute names to redact
 * - Form Data: Use setSensitiveBodyFields() to specify parameter names to redact
 * - Plain Text/HTML: Use setSensitiveTextPatterns() to specify regex patterns
 * - Binary/Multipart: Entire body is automatically treated as sensitive
 */
declare class HTTPClientLoggingConfig {
    /**
     * Gets whether HTTP client logging is enabled.
     */
    enabled: boolean;
    /**
     * Gets the current log level for HTTP client logging.
     */
    level: string;
    /**
     * Gets the sensitive body fields configured for form data redaction.
     */
    sensitiveBodyFields: string[];
    /**
     * Gets the sensitive headers configured for redaction.
     */
    sensitiveHeaders: string[];
    /**
     * Gets the sensitive JSON fields configured for redaction.
     */
    sensitiveJsonFields: string[];
    /**
     * Gets the sensitive XML fields configured for redaction.
     */
    sensitiveXmlFields: string[];
    /**
     * Creates a new HTTPClientLoggingConfig instance.
     * 
     * The public constructor should only be called from JavaScript, but cfgAPI uses this constructor for creating the
     * Service instance -> so fill the factory here
     */
    constructor();
    /**
     * Gets the current log level for HTTP client logging.
     */
    getLevel(): string;
    /**
     * Gets the sensitive body fields configured for form data redaction.
     */
    getSensitiveBodyFields(): string[];
    /**
     * Gets the sensitive headers configured for redaction.
     */
    getSensitiveHeaders(): string[];
    /**
     * Gets the sensitive JSON fields configured for redaction.
     */
    getSensitiveJsonFields(): string[];
    /**
     * Gets the sensitive XML fields configured for redaction.
     */
    getSensitiveXmlFields(): string[];
    /**
     * Gets whether HTTP client logging is enabled.
     */
    isEnabled(): boolean;
    /**
     * Sets whether HTTP client logging is enabled.
     * 
     * When enabled, HTTP requests and responses will be logged according to the configured log level and sensitive
     * field redaction settings. When disabled, no HTTP logging will occur.
     */
    setEnabled(enabled: boolean): void;
    /**
     * Sets the log level for HTTP client logging.
     * 
     * The log level determines the verbosity of HTTP logging output. Available levels:
     * 
     * - DEBUG: Most verbose, includes detailed request/response information
     * - INFO: Standard level, includes basic request/response details
     * - WARN: Only logs warnings and errors
     * - ERROR: Only logs errors
     */
    setLevel(level: string): void;
    /**
     * Sets the sensitive body fields that should be redacted from HTTP form data.
     * 
     * When HTTP requests or responses contain form data (application/x-www-form-urlencoded), any parameters matching
     * the specified field names will be redacted with "****FILTERED****" in the logs.
     * Sensitive Field MUST be set else logging will be skipped for form body type
     * Setting with empty array will use default values ["name", "email", "email_address", "ssn", "first_name", "last_name"]
     * 
     * Example:
     * @example
     * config.setSensitiveBodyFields(["fname", "creditCard", "ssn_last_4"]);
     */
    setSensitiveBodyFields(fields: string[]): void;
    /**
     * Sets the sensitive headers that should be redacted from HTTP requests/responses.
     * 
     * Any HTTP headers matching the specified names will be redacted with "****FILTERED****" in the logs. This is useful for
     * protecting sensitive authentication tokens, API keys, and session information.
     * Sensitive Headers MUST be set else logging will be skipped for headers
     * Setting the sensitive headers with empty array will use default values ["authorization", "cookie"]
     * 
     * Example:
     * @example
     * config.setSensitiveHeaders([ "x-api-key", "x-auth-token"]);
     * config.setSensiviteHeaders([]);
     */
    setSensitiveHeaders(headers: string[]): void;
    /**
     * Sets the sensitive JSON fields that should be redacted from HTTP request/response bodies.
     * 
     * When HTTP requests or responses contain JSON content, any fields matching the specified names will be redacted
     * with "****FILTERED****" in the logs.
     * Sensitive Field MUST be set else logging will be skipped for JSON body type
     * Setting with empty array will use default values ["name", "email", "email_address", "ssn", "first_name", "last_name", "password"]
     * 
     * Example:
     * @example
     * config.setSensitiveJsonFields(["password", "creditCard", "ssn"]);
     */
    setSensitiveJsonFields(fields: string[]): void;
    /**
     * Sets the sensitive text patterns that should be redacted from HTTP request/response bodies.
     * 
     * When HTTP requests or responses contain text content, any text matching the specified regex patterns will be
     * redacted with "****FILTERED****" in the logs.
     * 
     * Example:
     * @example
     * config.setSensitiveTextPatterns(["password", "credit.*card", "\\d{3}-\\d{2}-\\d{4}"]);
     */
    setSensitiveTextPatterns(patterns: string[]): void;
    /**
     * Sets the sensitive XML fields that should be redacted from HTTP request/response bodies.
     * 
     * When HTTP requests or responses contain XML content, any elements or attributes matching the specified names will
     * be redacted with "****FILTERED****" in the logs.
     * Sensitive Field MUST be set else logging will be skipped for XML body type
     * Setting with empty array will use default values ["name", "email", "email_address", "ssn", "first_name", "last_name", "password"]
     * 
     * Example:
     * @example
     * config.setSensitiveXmlFields(["password", "creditCard", "ssn"]);
     */
    setSensitiveXmlFields(fields: string[]): void;
}

export = HTTPClientLoggingConfig;
