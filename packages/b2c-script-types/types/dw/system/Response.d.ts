import Cookie = require('../web/Cookie');
import URL = require('../web/URL');
import URLRedirect = require('../web/URLRedirect');
import PrintWriter = require('../io/PrintWriter');

/**
 * Represents an HTTP response in Commerce Cloud Digital. An instance of this class is implicitly available within
 * Digital script under the variable "response". The Response object can be used to set cookies and specific HTTP
 * headers, for directly accessing the output stream or for sending redirects.
 */
declare class Response {
    /**
     * An allowed header name constant for Access-Control-Allow-Credentials
     */
    static readonly ACCESS_CONTROL_ALLOW_CREDENTIALS = "Access-Control-Allow-Credentials";
    /**
     * An allowed header name constant for Access-Control-Allow-Headers
     */
    static readonly ACCESS_CONTROL_ALLOW_HEADERS = "Access-Control-Allow-Headers";
    /**
     * An allowed header name constant for Access-Control-Allow-Methods
     */
    static readonly ACCESS_CONTROL_ALLOW_METHODS = "Access-Control-Allow-Methods";
    /**
     * An allowed header name constant for Access-Control-Allow-Origin
     */
    static readonly ACCESS_CONTROL_ALLOW_ORIGIN = "Access-Control-Allow-Origin";
    /**
     * An allowed header name constant for Access-Control-Expose-Headers
     */
    static readonly ACCESS_CONTROL_EXPOSE_HEADERS = "Access-Control-Expose-Headers";
    /**
     * An allowed header name constant for Allow
     */
    static readonly ALLOW = "Allow";
    /**
     * An allowed header name constant for Content-Disposition
     */
    static readonly CONTENT_DISPOSITION = "Content-Disposition";
    /**
     * An allowed header name constant for Content-Language
     */
    static readonly CONTENT_LANGUAGE = "Content-Language";
    /**
     * An allowed header name constant for Content-Location
     */
    static readonly CONTENT_LOCATION = "Content-Location";
    /**
     * An allowed header name constant for Content-MD5
     */
    static readonly CONTENT_MD5 = "Content-MD5";
    /**
     * An allowed header name constant for Content-Security-Policy.
     * 
     * Note: The Commerce Cloud platform can override this header for tools like the Storefront Toolkit.
     */
    static readonly CONTENT_SECURITY_POLICY = "Content-Security-Policy";
    /**
     * An allowed header name constant for Content-Security-Policy-Report-Only.
     * 
     * You can set this response header only for storefront requests. Report recipient can't be a B2C Commerce system.
     */
    static readonly CONTENT_SECURITY_POLICY_REPORT_ONLY = "Content-Security-Policy-Report-Only";
    /**
     * An allowed header name constant for Content-Type
     */
    static readonly CONTENT_TYPE = "Content-Type";
    /**
     * An allowed header name constant for Cross-Origin-Embedder-Policy
     */
    static readonly CROSS_ORIGIN_EMBEDDER_POLICY = "Cross-Origin-Embedder-Policy";
    /**
     * An allowed header name constant for Cross-Origin-Embedder-Policy-Report-Only.
     * 
     * You can set this response header only for storefront requests. Report recipient can't be a B2C Commerce system.
     */
    static readonly CROSS_ORIGIN_EMBEDDER_POLICY_REPORT_ONLY = "Cross-Origin-Embedder-Policy-Report-Only";
    /**
     * An allowed header name constant for Cross-Origin-Opener-Policy
     */
    static readonly CROSS_ORIGIN_OPENER_POLICY = "Cross-Origin-Opener-Policy";
    /**
     * An allowed header name constant for Cross-Origin-Opener-Policy-Report-Only.
     * 
     * You can set this response header only for storefront requests. Report recipient can't be a B2C Commerce system.
     */
    static readonly CROSS_ORIGIN_OPENER_POLICY_REPORT_ONLY = "Cross-Origin-Opener-Policy-Report-Only";
    /**
     * An allowed header name constant for Cross-Origin-Resource-Policy
     */
    static readonly CROSS_ORIGIN_RESOURCE_POLICY = "Cross-Origin-Resource-Policy";
    /**
     * An allowed header name constant for Link
     */
    static readonly LINK = "Link";
    /**
     * An allowed header name constant for Location
     */
    static readonly LOCATION = "Location";
    /**
     * An allowed header name constant for Permissions-Policy
     */
    static readonly PERMISSIONS_POLICY = "Permissions-Policy";
    /**
     * An allowed header name constant for Platform for Privacy Preferences Project
     */
    static readonly PLATFORM_FOR_PRIVACY_PREFERENCES_PROJECT = "P3P";
    /**
     * An allowed header name constant for Referrer-Policy
     */
    static readonly REFERRER_POLICY = "Referrer-Policy";
    /**
     * An allowed header name constant for Refresh
     */
    static readonly REFRESH = "Refresh";
    /**
     * An allowed header name constant for Retry-After
     */
    static readonly RETRY_AFTER = "Retry-After";
    /**
     * An allowed header name constant for service-worker-allowed
     */
    static readonly SERVICE_WORKER_ALLOWED = "service-worker-allowed";
    /**
     * An allowed header name constant for Vary
     */
    static readonly VARY = "Vary";
    /**
     * An allowed header name constant for X-Content-Type-Options
     */
    static readonly X_CONTENT_TYPE_OPTIONS = "X-Content-Type-Options";
    /**
     * An allowed header name constant for X-FRAME-OPTIONS.
     * 
     * Note: The Commerce Cloud platform can override this header for tools like the Storefront Toolkit.
     */
    static readonly X_FRAME_OPTIONS = "X-FRAME-OPTIONS";
    /**
     * An allowed value ALLOW-FROM for X-FRAME-OPTIONS
     */
    static readonly X_FRAME_OPTIONS_ALLOW_FROM = "ALLOW-FROM";
    /**
     * An allowed value DENY for X-FRAME-OPTIONS
     */
    static readonly X_FRAME_OPTIONS_DENY_VALUE = "DENY";
    /**
     * An allowed value SAME-ORIGIN value for X-FRAME-OPTIONS
     */
    static readonly X_FRAME_OPTIONS_SAMEORIGIN_VALUE = "SAMEORIGIN";
    /**
     * An allowed header name constant for X-Robots-Tag
     */
    static readonly X_ROBOTS_TAG = "X-Robots-Tag";
    /**
     * An allowed header name constant for X-XSS-Protection
     */
    static readonly X_XSS_PROTECTION = "X-XSS-Protection";
    /**
     * Returns a print writer which can be used to print content directly to the response.
     */
    readonly writer: PrintWriter;
    private constructor();
    /**
     * Adds the specified cookie to the outgoing response. This method can be called multiple times to set more than one
     * cookie. If a cookie with the same cookie name, domain and path is set multiple times for the same response, only
     * the last set cookie with this name is sent to the client. This method can be used to set, update or delete
     * cookies at the client. If the cookie doesn't exist at the client, it is set initially. If a cookie with the same
     * name, domain and path already exists at the client, it is updated. A cookie can be deleted at the client by
     * submitting a cookie with the maxAge attribute set to 0 (see `Cookie.setMaxAge()
     * ` for more information).
     * 
     * ```
     * Example, how a cookie can be deleted at the client:
     * 
     * var cookie : Cookie = new Cookie("SomeName", "Simple Value");
     * 
     * cookie.setMaxAge(0);
     * 
     * response.addHttpCookie(cookie);
     * 
     * ```
     * 
     * You can't set a cookie's SameSite attribute using the API. The server sets SameSite to None if either the
     * developer sets the cookie's Secure flag or the global security preference Enforce HTTPS is enabled, in which case
     * the Secure flag is also set. Otherwise, the server doesn't set the SameSite attribute and the browser uses its
     * own default SameSite setting. The SameSite attribute is not sent with a cookie if the server detects that the
     * client doesn't correctly interpret the attribute.
     */
    addHttpCookie(cookie: Cookie): void;
    /**
     * Adds a response header with the given name and value. This method allows response headers to have multiple
     * values.
     * 
     * For public headers, only the names listed in the "Constants" section are allowed. Custom header names must begin
     * with the prefix "X-SF-CC-" and can contain only alphanumeric characters, dash, and underscore.
     */
    addHttpHeader(name: string, value: string): void;
    /**
     * Checks whether the response message header has a field with the specified name.
     */
    containsHttpHeader(name: string): boolean;
    /**
     * Returns a print writer which can be used to print content directly to the response.
     */
    getWriter(): PrintWriter;
    /**
     * Sends a temporary redirect response (HTTP status 302) to the client for the specified redirect location URL.
     */
    redirect(url: URL): void;
    /**
     * Sends a redirect response with the given status to the client for the specified redirect location URL.
     */
    redirect(url: URL, status: number): void;
    /**
     * Sends a temporary redirect response (HTTP status 302) to the client for the specified redirect location URL. The
     * target location must be a relative or an absolute URL.
     */
    redirect(location: string): void;
    /**
     * Sends a redirect response with the given status to the client for the specified redirect location URL.
     */
    redirect(location: string, status: number): void;
    /**
     * Sends a redirect response with the given status to the client for the specified redirect location URL.
     */
    redirect(redirect: URLRedirect): void;
    /**
     * Sets whether the output should be buffered or streamed directly to the client. By default, buffering is enabled.
     * The mode can only be changed before anything has been written to the response. Switching buffering off and using
     * streaming mode is recommended for sending large responses.
     */
    setBuffered(buffered: boolean): void;
    /**
     * Sets the content type for this response. This method may only be called before any output is written to the
     * response.
     */
    setContentType(contentType: string): void;
    /**
     * Sets the cache expiration time for the response. The response will only be cached if caching was not disabled
     * previously. By default, responses are not cached. This method can be called multiple times during request
     * processing. If caching is enabled, the lowest expiration time, resulting from the invocations of the method
     * becomes the cache expiration time. This is only used for HTTP requests. Streamed responses cannot be cached. This
     * method is an alternative for setting the cache time using the <iscache> tag in ISML templates.
     */
    setExpires(expires: number): void;
    /**
     * Convenience method for setExpires which takes a Date object.
     */
    setExpires(expires: Date): void;
    /**
     * Adds a response header with the given name and value. If one or more value(s) have already been set, the new
     * value overwrites the previous one. The containsHttpHeader method can be used to test for the
     * presence of a header before setting its value.
     * 
     * For public headers, only the names listed in the "Constants" section are allowed. Custom header names must begin
     * with the prefix "X-SF-CC-" and can contain only alphanumeric characters, dash, and underscore.
     */
    setHttpHeader(name: string, value: string): void;
    /**
     * Sets the HTTP response code.
     */
    setStatus(status: number): void;
    /**
     * Marks the response as personalized with the given variant identifier. Commerce Cloud Digital identifies unique
     * pages based on a combination of pricebook, promotion, sorting rule and A/B test segments, caches the different
     * variants of the page, and then delivers the correct version to the user. If a page is personalized by means other
     * than pricebook, promotion, sorting rule and A/B test, the page must not be cached, because the wrong variants of
     * the page would be delivered to the user. For performance reasons, a page should only be marked as personalized if
     * it really is. Otherwise, the performance can unnecessarily degrade.
     * 
     * This method has the same effect as using <iscache varyby="price_promotion" /> tag in an ISML template. Once
     * the vary-by value was set, either using this method or by the <iscache> tag in a template, the entire
     * response is treated as personalized.
     */
    setVaryBy(varyBy: string): void;
}

export = Response;
