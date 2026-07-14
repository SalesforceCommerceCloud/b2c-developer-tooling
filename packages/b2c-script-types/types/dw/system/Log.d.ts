import LogNDC = require('./LogNDC');

/**
 * A log4j like logger instance. To obtain such an instance, use the dw.system.Logger.getRootLogger or
 * dw.system.Logger.getLogger or dw.system.Logger.getLogger methods.
 */
declare class Log {
    /**
     * Returns the Nested Diagnostic Context for this script call.
     */
    static readonly NDC: LogNDC;
    /**
     * This method returns true if debug logging is enabled for this logging instance.
     */
    readonly debugEnabled: boolean;
    /**
     * This method returns true if error logging is enabled for this logging instance.
     */
    readonly errorEnabled: boolean;
    /**
     * This method returns true if information logging is enabled for this logging instance.
     */
    readonly infoEnabled: boolean;
    /**
     * This method returns true if warning logging is enabled for this logging instance.
     */
    readonly warnEnabled: boolean;
    private constructor();
    /**
     * Returns the Nested Diagnostic Context for this script call.
     */
    static getNDC(): LogNDC;
    /**
     * The method reports an debug level message. Arguments can be embedded into the message, e.g. like "Failure {0} in
     * {1}". The method implements the Java MessageFormat.format() syntax.
     */
    debug(msg: string, ...args: any[]): void;
    /**
     * The method reports an error level message. Arguments can be embedded into the message, e.g. like "Failure {0} in
     * {1}". The method implements the Java MessageFormat.format() syntax.
     */
    error(msg: string, ...args: any[]): void;
    /**
     * The method reports an warning level message. Arguments can be embedded into the message, e.g. like "Failure {0}
     * in {1}". The method implements the Java MessageFormat.format() syntax. Note: Fatal log messages are always
     * enabled and optionally send via E-Mail.
     */
    fatal(msg: string, ...args: any[]): void;
    /**
     * The method reports an information level message. Arguments can be embedded into the message, e.g. like "Failure
     * {0} in {1}". The method implements the Java MessageFormat.format() syntax.
     */
    info(msg: string, ...args: any[]): void;
    /**
     * This method returns true if debug logging is enabled for this logging instance.
     */
    isDebugEnabled(): boolean;
    /**
     * This method returns true if error logging is enabled for this logging instance.
     */
    isErrorEnabled(): boolean;
    /**
     * This method returns true if information logging is enabled for this logging instance.
     */
    isInfoEnabled(): boolean;
    /**
     * This method returns true if warning logging is enabled for this logging instance.
     */
    isWarnEnabled(): boolean;
    /**
     * The method reports an warning level message. Arguments can be embedded into the message, e.g. like "Failure {0}
     * in {1}". The method implements the Java MessageFormat.format() syntax.
     */
    warn(msg: string, ...args: any[]): void;
}

export = Log;
