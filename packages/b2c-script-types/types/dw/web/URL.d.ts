/**
 * Represents a URL in Commerce Cloud Digital.
 */
declare class URL {
    private constructor();
    /**
     * Makes the URL absolute and ensures that the protocol of the request is used
     * or http in a mail context.
     * Note: This method is not applicable for static content or image transformation
     * URLs. In this case a runtime exception is thrown.
     */
    abs(): URL;
    /**
     * Append a request parameter to this URL.
     */
    append(name: string, value: string): URL;
    /**
     * 
     * Appends, if applicable, a CSRF protection token to this URL. The CSRF token will only be appended under the following conditions:
     * 
     * - the URL is a pipeline URL
     * - the URL is for Business Manager
     * 
     * If a CSRF token already exists in the URL, it will be replaced with a newly generated one.
     */
    appendCSRFTokenBM(): URL;
    /**
     * Updates the URL with the specified host name
     * Note: This method is not applicable for static content or image transformation
     * URLs. In this case a runtime exception is thrown.
     */
    host(host: string): URL;
    /**
     * Makes the URL absolute and ensures that the protocol http is used.
     * Note: This method is not applicable for static content or image transformation
     * URLs. In this case a runtime exception is thrown.
     */
    http(): URL;
    /**
     * Makes the URL absolute and ensures that the protocol https is used.
     * Note: This method is not applicable for static content or image transformation
     * URLs. In this case a runtime exception is thrown.
     */
    https(): URL;
    /**
     * Makes the URL relative.
     * Note: This method is not applicable for static content or image transformation
     * URLs. In this case a runtime exception is thrown.
     */
    relative(): URL;
    /**
     * Remove a request parameter from this URL. If the parameter is not part
     * of the URL, nothing is done.
     */
    remove(name: string): URL;
    /**
     * Updates the URL with the site host name
     * Note: This method is not applicable for static content or image transformation
     * URLs. In this case a runtime exception is thrown.
     */
    siteHost(): URL;
    /**
     * Return String representation of the URL.
     */
    toString(): string;
}

export = URL;
