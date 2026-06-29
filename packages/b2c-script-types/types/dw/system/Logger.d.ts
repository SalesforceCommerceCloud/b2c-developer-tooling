import Log = require('./Log');

/**
 * The Logger class provides logging utility methods.
 */
declare class Logger {
    /**
     * This method returns true if debug logging is enabled.
     */
    static readonly debugEnabled: boolean;
    /**
     * This method returns true if error logging is enabled.
     */
    static readonly errorEnabled: boolean;
    /**
     * This method returns true if info logging is enabled.
     */
    static readonly infoEnabled: boolean;
    /**
     * Returns the root logger object.
     */
    static readonly rootLogger: Log;
    /**
     * This method returns true if warning logging is enabled.
     */
    static readonly warnEnabled: boolean;
    private constructor();
    /**
     * The method reports an debug level message. Arguments can be embedded
     * into the message, e.g. like "Failure {0} in {1}". The method implements
     * the Java MessageFormat.format() syntax.
     */
    static debug(msg: string, ...args: any[]): void;
    /**
     * The method reports an error level message. Arguments can be embedded
     * into the message, e.g. like "Failure {0} in {1}". The method implements
     * the Java MessageFormat.format() syntax.
     */
    static error(msg: string, ...args: any[]): void;
    /**
     * Returns the logger object for the given category.
     */
    static getLogger(category: string): Log;
    /**
     * Returns the logger object for the given file name prefix and category.
     * Throws an exception if maximum number of custom log files per day has already been obtained.
     */
    static getLogger(fileNamePrefix: string | null, category: string): Log;
    /**
     * Returns the root logger object.
     */
    static getRootLogger(): Log;
    /**
     * The method reports an information level message. Arguments can be embedded
     * into the message, e.g. like "Failure {0} in {1}". The method implements
     * the Java MessageFormat.format() syntax.
     */
    static info(msg: string, ...args: any[]): void;
    /**
     * This method returns true if debug logging is enabled.
     */
    static isDebugEnabled(): boolean;
    /**
     * This method returns true if error logging is enabled.
     */
    static isErrorEnabled(): boolean;
    /**
     * This method returns true if info logging is enabled.
     */
    static isInfoEnabled(): boolean;
    /**
     * This method returns true if warning logging is enabled.
     */
    static isWarnEnabled(): boolean;
    /**
     * The method reports an warning level message. Arguments can be embedded
     * into the message, e.g. like "Failure {0} in {1}". The method implements
     * the Java MessageFormat.format() syntax.
     */
    static warn(msg: string, ...args: any[]): void;
}

export = Logger;
