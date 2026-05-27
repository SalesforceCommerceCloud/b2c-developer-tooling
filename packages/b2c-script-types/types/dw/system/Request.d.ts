import Session = require('./Session');
import Cookies = require('../web/Cookies');
import Cookie = require('../web/Cookie');
import utilMap = require('../util/Map');
import URL = require('../web/URL');
import Geolocation = require('../util/Geolocation');
import CustomAttributes = require('../object/CustomAttributes');
import PageMetaData = require('../web/PageMetaData');
import HttpParameterMap = require('../web/HttpParameterMap');
import Form = require('../web/Form');
import FormAction = require('../web/FormAction');

/**
 * Represents a request in Commerce Cloud Digital. Each pipeline dictionary contains a CurrentRequest object, which is of
 * type dw.system.Request. Most requests are HTTP requests, so you can use this object to get information about the HTTP
 * request, such as the HTTP headers. You can also get a list of cookies, if any, associated with the request. If the
 * request is issued from a job, the request is not an HTTP request, so HTTP-related methods return null.
 */
declare class Request {
    /**
     * Returns whether the request originated in SCAPI.
     */
    readonly SCAPI: boolean;
    /**
     * Returns a map containing all path parameters of current SCAPI request in the following way:
     * 
     * - keys: path parameter names from path pattern
     * - values: corresponding path parameter values from current request
     * 
     * Returns null if isSCAPI returns false i.e. if the request is not a SCAPI request.
     * 
     * For example:
     * 
     * - Current request: `/product/shopper-products/v1/organizations/sfcc_org/products/apple-ipod-shuffle`
     * - Path pattern: `/product/shopper-products/v1/organizations/{organizationId}/products/{id}`
     * - Result: dw.util.Map with 2 key:value pairs: `organizationId:sfcc_org` and `id:apple-ipod-shuffle`.
     */
    readonly SCAPIPathParameters: utilMap<any, any> | null;
    /**
     * Returns the SCAPI path pattern in the following way:
     * 
     * - The first three segments `/api-family/api-name/version` with concrete values.
     * - The /organizations part with the path parameter name `organizationId` in curly brackets.
     * - The actual resource path additional path parameter names in curly brackets.
     * 
     * Returns null if isSCAPI returns false i.e. if the request is not a SCAPI request.
     * 
     * For example, in the context of a request to get a single product from shopper-products API, this method would
     * return `/product/shopper-products/v1/organizations/{organizationId}/products/{id}`
     */
    readonly SCAPIPathPattern: string | null;
    /**
     * Returns the client id of the current SCAPI or OCAPI request. If the request is not a SCAPI request or not an
     * OCAPI request 'null' is returned. For client ids owned by Commerce Cloud Digital an alias is returned.
     */
    readonly clientId: string | null;
    /**
     * Returns all of the custom attributes associated with the request. The attributes are stored for the life time of
     * the request.
     */
    readonly custom: CustomAttributes;
    /**
     * Returns the physical location for the current request, if available. The
     * location is calculated based on the IP address of the request. Note, if
     * the geolocation tracking feature is not enabled, this method always
     * returns null.
     */
    geolocation: Geolocation | null;
    /**
     * Returns the Cookies object, which can be used to read cookies sent by the client. Use the method
     * `Response.addHttpCookie()` to add a cookie to the outgoing response.
     */
    readonly httpCookies: Cookies | null;
    /**
     * Returns a Map containing all HTTP header values.
     */
    readonly httpHeaders: utilMap<any, any>;
    /**
     * Returns the host name or null if there is no host name.
     */
    readonly httpHost: string | null;
    /**
     * Returns the locale or null if there is no associated locale.
     */
    readonly httpLocale: string | null;
    /**
     * Returns the name of the HTTP method with which this request was made, for example, GET, POST, or PUT.
     */
    readonly httpMethod: string;
    /**
     * Returns the parameter map that contains the HTTP parameters for the current request.
     */
    readonly httpParameterMap: HttpParameterMap;
    /**
     * Returns a Map containing the raw HTTP parameters sent to the server. The Map contains name/value pairs. Each name
     * is a String and each value is a String array.
     */
    readonly httpParameters: utilMap<any, any>;
    /**
     * Returns the path.
     */
    readonly httpPath: string | null;
    /**
     * Returns the HTTP protocol used for this request. Possible values are "http" or "https". If the current activity
     * is not related to an HTTP request, for example, when the request is part of a job, this method returns null.
     */
    readonly httpProtocol: string | null;
    /**
     * Returns the query string or null if there is no query string.
     */
    readonly httpQueryString: string | null;
    /**
     * Returns the referer or null if there is no referer.
     */
    readonly httpReferer: string | null;
    /**
     * Returns the remote address or null if no remote address is found.
     */
    readonly httpRemoteAddress: string | null;
    /**
     * Identifies if this request is an HTTP request. The method returns true, if the current processing is related to a
     * HTTP request.
     * @deprecated Effectively always returns true.
     */
    readonly httpRequest: boolean;
    /**
     * Returns whether the HTTP communication is secure, which basically means that the communication happens via https.
     * If the current activity is not related to an HTTP request the method returns false.
     */
    readonly httpSecure: boolean;
    /**
     * Returns the complete URL of the request which was received at the server.
     * This URL does not include SEO optimizations.
     */
    readonly httpURL: URL;
    /**
     * Returns the HTTP user agent or null if there is no user agent.
     */
    readonly httpUserAgent: string | null;
    /**
     * Returns true if the request represents a request for a remote include, false if it is a top-level request.
     */
    readonly includeRequest: boolean;
    /**
     * Returns the locale of the current request. This locale is set by the system based on the information in the URL.
     * It may be different from the locale returned by getHttpLocale, which is the preferred locale sent by the user agent.
     */
    locale: string;
    /**
     * Returns the OCAPI version of the current request. If this is not
     * an OCAPI request, 'null' is returned.
     */
    readonly ocapiVersion: string;
    /**
     * Returns the page meta data that are associated with the current request.
     */
    readonly pageMetaData: PageMetaData;
    /**
     * Returns the unique identifier of the current request. The unique id is helpful for debugging purpose, e.g. relate
     * debug messages to a particular request.
     */
    readonly requestID: string;
    /**
     * Returns the session associated with this request.
     */
    readonly session: Session;
    /**
     * Returns the form that was submitted by the client if the request represents a form submission.
     */
    readonly triggeredForm: Form;
    /**
     * Returns the form action that was triggered by the client if the request represents a form submission.
     */
    readonly triggeredFormAction: FormAction;
    private constructor();
    /**
     * Adds the specified cookie to the outgoing response. This method can be called multiple times to set more than one
     * cookie. If a cookie with the same cookie name, domain and path is set multiple times for the same response, only
     * the last set cookie with this name is send to the client. This method can be used to set, update or delete
     * cookies at the client. If the cookie doesn't exist at the client, it is set initially. If a cookie with the same
     * name, domain and path already exists at the client, it is updated. A cookie can be deleted at the client by
     * submitting a cookie with the maxAge attribute set to 0 (see `Cookie.setMaxAge()
     * ` for more information).
     * @example
     * Example, how a cookie can be deleted at the client:
     * 
     * var cookie : Cookie = new Cookie("SomeName", "Simple Value");
     * 
     * cookie.setMaxAge(0);
     * 
     * request.addHttpCookie(cookie);
     * @deprecated Use dw.system.Response.addHttpCookie instead.
     */
    addHttpCookie(cookie: Cookie): void;
    /**
     * Returns the client id of the current SCAPI or OCAPI request. If the request is not a SCAPI request or not an
     * OCAPI request 'null' is returned. For client ids owned by Commerce Cloud Digital an alias is returned.
     */
    getClientId(): string | null;
    /**
     * Returns all of the custom attributes associated with the request. The attributes are stored for the life time of
     * the request.
     */
    getCustom(): CustomAttributes;
    /**
     * Returns the physical location for the current request, if available. The
     * location is calculated based on the IP address of the request. Note, if
     * the geolocation tracking feature is not enabled, this method always
     * returns null.
     */
    getGeolocation(): Geolocation | null;
    /**
     * Returns the Cookies object, which can be used to read cookies sent by the client. Use the method
     * `Response.addHttpCookie()` to add a cookie to the outgoing response.
     */
    getHttpCookies(): Cookies | null;
    /**
     * Returns a Map containing all HTTP header values.
     */
    getHttpHeaders(): utilMap<any, any>;
    /**
     * Returns the host name or null if there is no host name.
     */
    getHttpHost(): string | null;
    /**
     * Returns the locale or null if there is no associated locale.
     */
    getHttpLocale(): string | null;
    /**
     * Returns the name of the HTTP method with which this request was made, for example, GET, POST, or PUT.
     */
    getHttpMethod(): string;
    /**
     * Returns the parameter map that contains the HTTP parameters for the current request.
     */
    getHttpParameterMap(): HttpParameterMap;
    /**
     * Returns a Map containing the raw HTTP parameters sent to the server. The Map contains name/value pairs. Each name
     * is a String and each value is a String array.
     */
    getHttpParameters(): utilMap<any, any>;
    /**
     * Returns the path.
     */
    getHttpPath(): string | null;
    /**
     * Returns the HTTP protocol used for this request. Possible values are "http" or "https". If the current activity
     * is not related to an HTTP request, for example, when the request is part of a job, this method returns null.
     */
    getHttpProtocol(): string | null;
    /**
     * Returns the query string or null if there is no query string.
     */
    getHttpQueryString(): string | null;
    /**
     * Returns the referer or null if there is no referer.
     */
    getHttpReferer(): string | null;
    /**
     * Returns the remote address or null if no remote address is found.
     */
    getHttpRemoteAddress(): string | null;
    /**
     * Returns the complete URL of the request which was received at the server.
     * This URL does not include SEO optimizations.
     */
    getHttpURL(): URL;
    /**
     * Returns the HTTP user agent or null if there is no user agent.
     */
    getHttpUserAgent(): string | null;
    /**
     * Returns the locale of the current request. This locale is set by the system based on the information in the URL.
     * It may be different from the locale returned by getHttpLocale, which is the preferred locale sent by the user agent.
     */
    getLocale(): string;
    /**
     * Returns the OCAPI version of the current request. If this is not
     * an OCAPI request, 'null' is returned.
     */
    getOcapiVersion(): string;
    /**
     * Returns the page meta data that are associated with the current request.
     */
    getPageMetaData(): PageMetaData;
    /**
     * Returns the unique identifier of the current request. The unique id is helpful for debugging purpose, e.g. relate
     * debug messages to a particular request.
     */
    getRequestID(): string;
    /**
     * Returns a map containing all path parameters of current SCAPI request in the following way:
     * 
     * - keys: path parameter names from path pattern
     * - values: corresponding path parameter values from current request
     * 
     * Returns null if isSCAPI returns false i.e. if the request is not a SCAPI request.
     * 
     * For example:
     * 
     * - Current request: `/product/shopper-products/v1/organizations/sfcc_org/products/apple-ipod-shuffle`
     * - Path pattern: `/product/shopper-products/v1/organizations/{organizationId}/products/{id}`
     * - Result: dw.util.Map with 2 key:value pairs: `organizationId:sfcc_org` and `id:apple-ipod-shuffle`.
     */
    getSCAPIPathParameters(): utilMap<any, any> | null;
    /**
     * Returns the SCAPI path pattern in the following way:
     * 
     * - The first three segments `/api-family/api-name/version` with concrete values.
     * - The /organizations part with the path parameter name `organizationId` in curly brackets.
     * - The actual resource path additional path parameter names in curly brackets.
     * 
     * Returns null if isSCAPI returns false i.e. if the request is not a SCAPI request.
     * 
     * For example, in the context of a request to get a single product from shopper-products API, this method would
     * return `/product/shopper-products/v1/organizations/{organizationId}/products/{id}`
     */
    getSCAPIPathPattern(): string | null;
    /**
     * Returns the session associated with this request.
     */
    getSession(): Session;
    /**
     * Returns the form that was submitted by the client if the request represents a form submission.
     */
    getTriggeredForm(): Form;
    /**
     * Returns the form action that was triggered by the client if the request represents a form submission.
     */
    getTriggeredFormAction(): FormAction;
    /**
     * Identifies if this request is an HTTP request. The method returns true, if the current processing is related to a
     * HTTP request.
     * @deprecated Effectively always returns true.
     */
    isHttpRequest(): boolean;
    /**
     * Returns whether the HTTP communication is secure, which basically means that the communication happens via https.
     * If the current activity is not related to an HTTP request the method returns false.
     */
    isHttpSecure(): boolean;
    /**
     * Returns true if the request represents a request for a remote include, false if it is a top-level request.
     */
    isIncludeRequest(): boolean;
    /**
     * Returns whether the request originated in SCAPI.
     */
    isSCAPI(): boolean;
    /**
     * Sets the physical location for the current request and remembers the new
     * value for the duration of the user session. So any subsequent calls to
     * dw.system.Request.getGeolocation will return this value
     */
    setGeolocation(geoLocation: Geolocation): void;
    /**
     * Sets the given locale for the request. The locale is only set if it is valid, if it is active and if it is
     * allowed for the current site.
     */
    setLocale(localeID: string): boolean;
}

export = Request;
