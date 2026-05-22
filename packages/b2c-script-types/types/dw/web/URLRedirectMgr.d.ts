import URLRedirect = require('./URLRedirect');

/**
 * URLRedirect manager class. Methods in this class generate URLRedirects based on the
 * current configuration for Static, Dynamic and URLRedirect mappings in Commerce
 * Cloud Digital.
 * 
 * Information used to calculate URLRedirects are determined from the current HTTP
 * request. The URL which is used to find a redirect can be accessed with getRedirectOrigin.
 */
declare class URLRedirectMgr {
    /**
     * Returns an URLRedirect object, containing a location and status. The redirect is calculated
     * based on origin url of current request and the configured Static, Dynamic and URLRedirect mappings for
     * the requested site.
     */
    static readonly redirect: URLRedirect;
    /**
     * Returns the relative origin url (without protocol, port, hostname and site path information)
     * which will be used in getRedirect to calculate a redirect location for.
     */
    static readonly redirectOrigin: string;
    private constructor();
    /**
     * Returns an URLRedirect object, containing a location and status. The redirect is calculated
     * based on origin url of current request and the configured Static, Dynamic and URLRedirect mappings for
     * the requested site.
     */
    static getRedirect(): URLRedirect;
    /**
     * Returns the relative origin url (without protocol, port, hostname and site path information)
     * which will be used in getRedirect to calculate a redirect location for.
     */
    static getRedirectOrigin(): string;
}

export = URLRedirectMgr;
