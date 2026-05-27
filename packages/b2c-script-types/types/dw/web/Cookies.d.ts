/**
 * The class provides an index and associative array like access to the Cookies
 * of the current request. Cookies can be retrieved by calling
 * dw.system.Request.getHttpCookies().
 * 
 * Note: this class allows access to sensitive security-related data.
 * Pay special attention to PCI DSS v3. requirements 2, 4, and 12.
 * 
 * See dw.system.Request.getHttpCookies.
 */
declare class Cookies {
    /**
     * Returns the number of known cookies.
     */
    readonly cookieCount: number;
    private constructor();
    /**
     * Returns the number of known cookies.
     */
    getCookieCount(): number;
}

export = Cookies;
