import Service = require('./Service');
import KeyRef = require('../crypto/KeyRef');
import File = require('../io/File');
import HTTPClient = require('../net/HTTPClient');

/**
 * Represents an HTTP Service.
 * 
 * The HTTP Service will use the return value of the createRequest callback as the request body (if supported by the
 * HTTP method). If this is an array of non-null dw.net.HTTPRequestPart objects, then a multi-part request will
 * be formed. Otherwise the object is converted to a String and used.
 * 
 * See also TopLevel.XML.toXMLString and TopLevel.JSON.stringify, which must be
 * explicitly called if needed.
 */
declare class HTTPService extends Service {
    /**
     * Returns the authentication type.
     */
    authentication: string;
    /**
     * Returns the caching time to live value.
     * @see setCachingTTL
     */
    cachingTTL: number;
    /**
     * Returns the underlying HTTP client object.
     */
    readonly client: HTTPClient;
    /**
     * Returns the request body encoding to declare.
     */
    encoding: string;
    /**
     * Determines whether host name verification is enabled.
     */
    hostNameVerification: boolean;
    /**
     * Gets the identity used for mutual TLS (mTLS).
     */
    identity: KeyRef | null;
    /**
     * Returns the output file, or null if there is none.
     */
    outFile: File | null;
    /**
     * Returns the request method.
     */
    requestMethod: string;
    /**
     * Adds an HTTP Header.
     */
    addHeader(name: string, val: string): HTTPService;
    /**
     * Adds a query parameter that will be appended to the URL.
     */
    addParam(name: string, val: string): HTTPService;
    /**
     * Returns the authentication type.
     */
    getAuthentication(): string;
    /**
     * Returns the caching time to live value.
     * @see setCachingTTL
     */
    getCachingTTL(): number;
    /**
     * Returns the underlying HTTP client object.
     */
    getClient(): HTTPClient;
    /**
     * Returns the request body encoding to declare.
     */
    getEncoding(): string;
    /**
     * Determines whether host name verification is enabled.
     */
    getHostNameVerification(): boolean;
    /**
     * Gets the identity used for mutual TLS (mTLS).
     */
    getIdentity(): KeyRef | null;
    /**
     * Returns the output file, or null if there is none.
     */
    getOutFile(): File | null;
    /**
     * Returns the request method.
     */
    getRequestMethod(): string;
    /**
     * Sets the type of authentication. Valid values include "BASIC" and "NONE".
     * 
     * The default value is BASIC.
     */
    setAuthentication(authentication: string): HTTPService;
    /**
     * Enables caching for GET requests.
     * 
     * This only caches status codes 2xx with a content length and size of less than 50k that are not immediately
     * written to file. The URL and the user name are used as cache keys. The total size of cacheable content and the
     * number of cached items is limited and automatically managed by the system.
     * 
     * Cache control information sent by the remote server is ignored.
     * 
     * Caching HTTP responses should be done very carefully. It is important to ensure that the response really depends
     * only on the URL and doesn't contain any remote state information or time information which is independent of the
     * URL. It is also important to verify that the application sends exactly the same URL multiple times.
     * @see dw.net.HTTPClient.enableCaching
     */
    setCachingTTL(ttl: number): HTTPService;
    /**
     * Sets the encoding of the request body (if any).
     * 
     * The default value is UTF-8.
     */
    setEncoding(encoding: string): HTTPService;
    /**
     * Sets whether certificate host name verification is enabled.
     * The default value is true. Set it to false to disable host name verification.
     */
    setHostNameVerification(enable: boolean): HTTPService;
    /**
     * Sets the identity (private key) to use when mutual TLS (mTLS) is configured.
     * 
     * If this is not set and mTLS is used then the private key will be chosen from the key store based on the host
     * name.
     * If this is set to a reference named "__NONE__" then no private key will be used even if one is requested by the remote server.
     */
    setIdentity(keyRef: KeyRef): HTTPService;
    /**
     * Sets the output file in which to write the HTTP response body.
     * 
     * The default behavior is to not write a file.
     */
    setOutFile(outFile: File | null): HTTPService;
    /**
     * Sets the HTTP request method.
     * 
     * Valid values include GET, PUT, POST, and DELETE.
     * 
     * The default value is POST.
     */
    setRequestMethod(requestMethod: string): HTTPService;
}

export = HTTPService;
