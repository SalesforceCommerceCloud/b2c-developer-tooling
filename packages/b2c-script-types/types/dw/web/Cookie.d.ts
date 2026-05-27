/**
 * Represents an HTTP cookie used for storing information on a client browser. Cookies are passed along in the HTTP
 * request and can be retrieved by calling dw.system.Request.getHttpCookies().
 * 
 * Cookies must comply with RFC6265. We recommend you use only printable ASCII characters without separators, such as a
 * comma or equal sign. If JSON is used as a cookie value, it must be encoded.
 * 
 * Note: this class allows access to sensitive security-related data. Pay special attention to PCI DSS v3.
 * requirements 2, 4, and 12.
 * 
 * See dw.system.Request.getHttpCookies.
 */
declare class Cookie {
    /**
     * Default name for cookies with empty strings.
     */
    static readonly EMPTYNAME = "dw_emptyname__";
    /**
     * Returns the comment that was previously set for this cookie, or null if no comment was set. Note that comments
     * are no longer supported in RFC 6265 and will not be sent to clients. This method is maintained for backward
     * compatibility only.
     * @deprecated This method is maintained for backward compatibility only. Cookie comments were removed in RFC 6265
     * and are no longer sent to clients. The returned value only reflects what was previously set using
     * setComment.
     */
    comment: string | null;
    /**
     * Returns the domain associated with the cookie.
     */
    domain: string;
    /**
     * Identifies if the cookie is http-only.
     */
    httpOnly: boolean;
    /**
     * Returns the maximum age of the cookie, specified in seconds.
     * By default, -1 indicating the cookie will persist until client shutdown.
     */
    maxAge: number;
    /**
     * Returns the cookie's name.
     */
    readonly name: string;
    /**
     * Returns the path for the cookie.
     */
    path: string;
    /**
     * Identifies if the cookie is secure.
     */
    secure: boolean;
    /**
     * Returns the cookie's value.
     */
    value: string;
    /**
     * Returns the version that was previously set for this cookie. Note that the version is no longer used for
     * determining cookie compliance as the system now uses RFC 6265 by default. The returned value only reflects what
     * was previously set using setVersion.
     * @deprecated This method is maintained for backward compatibility only. The version property is no longer used as
     * the system now uses RFC 6265 compliance by default. The returned value has no effect on cookie
     * behavior.
     */
    version: number;
    /**
     * Constructs a new cookie using the specified name and value.
     */
    constructor(name: string, value: string);
    /**
     * Returns the comment that was previously set for this cookie, or null if no comment was set. Note that comments
     * are no longer supported in RFC 6265 and will not be sent to clients. This method is maintained for backward
     * compatibility only.
     * @deprecated This method is maintained for backward compatibility only. Cookie comments were removed in RFC 6265
     * and are no longer sent to clients. The returned value only reflects what was previously set using
     * setComment.
     */
    getComment(): string | null;
    /**
     * Returns the domain associated with the cookie.
     */
    getDomain(): string;
    /**
     * Returns the maximum age of the cookie, specified in seconds.
     * By default, -1 indicating the cookie will persist until client shutdown.
     */
    getMaxAge(): number;
    /**
     * Returns the cookie's name.
     */
    getName(): string;
    /**
     * Returns the path for the cookie.
     */
    getPath(): string;
    /**
     * Identifies if the cookie is secure.
     */
    getSecure(): boolean;
    /**
     * Returns the cookie's value.
     */
    getValue(): string;
    /**
     * Returns the version that was previously set for this cookie. Note that the version is no longer used for
     * determining cookie compliance as the system now uses RFC 6265 by default. The returned value only reflects what
     * was previously set using setVersion.
     * @deprecated This method is maintained for backward compatibility only. The version property is no longer used as
     * the system now uses RFC 6265 compliance by default. The returned value has no effect on cookie
     * behavior.
     */
    getVersion(): number;
    /**
     * Identifies if the cookie is http-only.
     */
    isHttpOnly(): boolean;
    /**
     * Sets a comment associated with this cookie. Note that comments are no longer sent to clients as they were removed
     * in RFC 6265. This method is maintained for backward compatibility but has no effect on the cookie's behavior.
     * @deprecated This method is maintained for backward compatibility only. Cookie comments were removed in RFC 6265
     * and will not be sent to clients. The value will be stored but has no effect on cookie behavior.
     */
    setComment(comment: string): void;
    /**
     * Sets the domain associated with the cookie.
     */
    setDomain(domain: string): void;
    /**
     * Sets the http-only state for the cookie.
     */
    setHttpOnly(httpOnly: boolean): void;
    /**
     * Sets the maximum age of the cookie in seconds.
     * 
     * A positive value indicates that the cookie will expire after that many
     * seconds have passed. Note that the value is the maximum age when the
     * cookie will expire, not the cookie's current age.
     * 
     * A negative value means that the cookie is not stored persistently and
     * will be deleted when the client exits. A zero value causes the
     * cookie to be deleted.
     */
    setMaxAge(age: number): void;
    /**
     * Sets the path for the cookie.
     */
    setPath(path: string): void;
    /**
     * Sets the secure state for the cookie.
     */
    setSecure(secure: boolean): void;
    /**
     * Sets the cookie's value.
     */
    setValue(value: string): void;
    /**
     * Returns the version that was previously set for this cookie. Note that the version is no longer used for
     * determining cookie compliance as the system now uses RFC 6265 by default. The returned value only reflects what
     * was previously set using setVersion.
     * @deprecated This method is maintained for backward compatibility only. The version property is no longer used as
     * the system now uses RFC 6265 compliance by default. The returned value has no effect on cookie
     * behavior.
     */
    setVersion(version: number): void;
}

export = Cookie;
