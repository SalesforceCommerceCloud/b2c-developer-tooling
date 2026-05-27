import SourceCodeGroup = require('./SourceCodeGroup');
import URLRedirect = require('../web/URLRedirect');

/**
 * Class representing a code (i.e. a "source code") that has been applied to a
 * customer's session. Source codes can qualify customers for different
 * campaigns, promotions, and other site experiences from those that the typical
 * customer sees. Codes are organized into source code groups.
 * 
 * Typically, a code is applied to a customer's session automatically by
 * Commerce Cloud Digital when a customer accesses a Digital URL with a well
 * known request parameter in the querystring.  A code may also be explicitly
 * applied to a customer session using the `SetSourceCode`
 * pipelet.
 */
declare class SourceCodeInfo {
    /**
     * The literal source-code is found and currently active.
     */
    static readonly STATUS_ACTIVE = 2;
    /**
     * The literal source-code is found but not active.
     */
    static readonly STATUS_INACTIVE = 1;
    /**
     * The literal source-code is not found in the system.
     */
    static readonly STATUS_INVALID = 0;
    /**
     * The literal source-code.
     */
    readonly code: string;
    /**
     * The associated source-code group.
     */
    readonly group: SourceCodeGroup;
    /**
     * Retrieves the redirect information from the last processed SourceCodeGroup (active or inactive). If none exists,
     * then the redirect information is retrieved from the source-code preferences, based on the active/inactive status
     * of the SourceCodeGroup. The redirect information is then resolved to the output URL. If the redirect information
     * cannot be resolved to a URL, or there is an error retrieving the preferences, then null is returned.
     */
    readonly redirect: URLRedirect | null;
    /**
     * The status of the source-code.  One of the following:
     * STATUS_INVALID - The source code is not found in the system.
     * STATUS_INACTIVE - The source code is found but not active.
     * STATUS_INACTIVE - The source code is found and active.
     */
    readonly status: number;
    private constructor();
    /**
     * The literal source-code.
     */
    getCode(): string;
    /**
     * The associated source-code group.
     */
    getGroup(): SourceCodeGroup;
    /**
     * Retrieves the redirect information from the last processed SourceCodeGroup (active or inactive). If none exists,
     * then the redirect information is retrieved from the source-code preferences, based on the active/inactive status
     * of the SourceCodeGroup. The redirect information is then resolved to the output URL. If the redirect information
     * cannot be resolved to a URL, or there is an error retrieving the preferences, then null is returned.
     */
    getRedirect(): URLRedirect | null;
    /**
     * The status of the source-code.  One of the following:
     * STATUS_INVALID - The source code is not found in the system.
     * STATUS_INACTIVE - The source code is found but not active.
     * STATUS_INACTIVE - The source code is found and active.
     */
    getStatus(): number;
}

export = SourceCodeInfo;
