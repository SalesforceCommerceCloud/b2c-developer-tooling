import KeyRef = require('../crypto/KeyRef');
import Bytes = require('../util/Bytes');
import HashMap = require('../util/HashMap');
import List = require('../util/List');
import utilMap = require('../util/Map');
import File = require('../io/File');
import HTTPRequestPart = require('./HTTPRequestPart');
import HTTPClientLoggingConfig = require('./HTTPClientLoggingConfig');

/**
 * The HTTPClient class supports the HTTP methods GET, POST, HEAD, PUT, PATCH, OPTIONS, and DELETE.
 * If a secure connection via HTTPS is
 * established the used server certificate or the signing CAs certificate needs to be imported into the customer key
 * store via Business Manager. Note: when this class is used with sensitive data, be careful in persisting
 * sensitive information.
 * 
 * Key selection for mutual TLS:
 * 
 * - Check if there is an explicit identity requested dw.net.HTTPClient.setIdentity
 * - Else, Check if there is a mapping for hostname in the keystore
 * - Deprecated: Select an arbitrary private key from the keystore
 * @example
 * `
 * var httpClient = new HTTPClient();
 * var message;
 * httpClient.open('GET', 'http://www.myinstance.com/feed.xml');
 * httpClient.setTimeout(3000);
 * httpClient.send();
 * if (httpClient.statusCode == 200)
 * {
 * message = httpClient.text;
 * }
 * else
 * {
 * // error handling
 * message = "An error occurred with status code "+httpClient.statusCode;
 * }
 * `
 */
declare class HTTPClient {
    /**
     * The default size for `sendAndReceiveToFile()` returning a File is 5MB deprecated in favor of
     * MAX_GET_FILE_SIZE
     * @deprecated Use MAX_GET_FILE_SIZE instead.
     */
    static readonly DEFAULT_GET_FILE_SIZE: number;
    /**
     * The maximum permitted size (in bytes) of an HTTP response when calling operations which write the response to
     * file. (200MB)
     */
    static readonly MAX_GET_FILE_SIZE: number;
    /**
     * The maximum permitted size (in bytes) of an HTTP response when calling operations which store the response in
     * memory. (10MB)
     */
    static readonly MAX_GET_MEM_SIZE: number;
    /**
     * Returns all response headers as a map containing the name and value of the response header.
     * @deprecated Use getResponseHeaders instead.
     */
    readonly allResponseHeaders: HashMap<any, any>;
    /**
     * Determines whether redirect handling is enabled.
     */
    allowRedirect: boolean;
    /**
     * Returns the bytes in the message body for HTTP status codes between 200 and 299.
     */
    readonly bytes: Bytes;
    /**
     * Returns the returned message body as bytes for HTTP status code greater or equal to 400. Error messages are not
     * written to the response file.
     */
    readonly errorBytes: Bytes;
    /**
     * Returns the returned message body as text for HTTP status code greater or equal to 400. Error messages are not
     * written to the response file.
     */
    readonly errorText: string;
    /**
     * Determines whether host name verification is enabled.
     */
    hostNameVerification: boolean;
    /**
     * Gets the identity used for mutual TLS (mTLS).
     */
    identity: KeyRef | null;
    /**
     * Gets the logging configuration for this HTTP client.
     */
    loggingConfig: HTTPClientLoggingConfig;
    /**
     * Returns all response headers as a map in which each entry represents an individual header. The key of the entry
     * holds the header name and the entry value holds a list of all header values.
     */
    readonly responseHeaders: utilMap<any, any>;
    /**
     * Returns the status code of the last HTTP operation.
     */
    readonly statusCode: number;
    /**
     * Returns the message text of the last HTTP operation.
     */
    readonly statusMessage: string;
    /**
     * Returns the returned message body as text for HTTP status codes between 200 and 299.
     */
    readonly text: string;
    /**
     * Returns the timeout for this client, in milliseconds.
     */
    timeout: number;
    /**
     * Constructs the HTTPClient instance with the default configuration.
     */
    constructor();
    /**
     * Constructs the HTTPClient instance with the given configuration.
     * 
     * There is one supported configuration option. Unknown options are ignored.
     * 
     * Supported configuration
     * 
     * Name
     * Type
     * Description
     * 
     * `allowHTTP2`
     * `boolean`
     * Allow connections over HTTP/2. This will still allow HTTP/1.1 if that is what the remote server
     * supports. It will also cause all request and response headers to be case-insensitive.
     * The default value is `false`.
     * 
     * Sample usage:
     * @example
     * var httpClient = new HTTPClient( { allowHTTP2: true } )
     */
    constructor(configMap: Object);
    /**
     * Calling this method enables caching for GET requests.
     * 
     * It basically means that a response is cached, and before making a request the HTTP client looks into the cache to
     * determine whether the response is already available. Only responses with a status code of 2xx, with a content
     * length, with a size less than 50k, and which are not intended to be immediately written to a file are cached.
     * 
     * The provided parameter defines the TTL (time to live) for the cached content. A value of 0 disables caching. The
     * URL and the username are used as cache keys. The total size of the cacheable content and the number of cached
     * items is limited and automatically managed by the system. Cache control information send by the remote server is
     * ignored. Caching HTTP responses should be done very carefully. It is important to ensure that the response really
     * depends only on the URL and doesn't contain any remote state information or time information which is independent
     * of the URL. It is also important to verify that the application sends exactly the same URL multiple times.
     */
    enableCaching(ttl: number): void;
    /**
     * Returns all response headers as a map containing the name and value of the response header.
     * @deprecated Use getResponseHeaders instead.
     */
    getAllResponseHeaders(): HashMap<any, any>;
    /**
     * Determines whether redirect handling is enabled.
     */
    getAllowRedirect(): boolean;
    /**
     * Returns the bytes in the message body for HTTP status codes between 200 and 299.
     */
    getBytes(): Bytes;
    /**
     * Returns the returned message body as bytes for HTTP status code greater or equal to 400. Error messages are not
     * written to the response file.
     */
    getErrorBytes(): Bytes;
    /**
     * Returns the returned message body as text for HTTP status code greater or equal to 400. Error messages are not
     * written to the response file.
     */
    getErrorText(): string;
    /**
     * Determines whether host name verification is enabled.
     */
    getHostNameVerification(): boolean;
    /**
     * Gets the identity used for mutual TLS (mTLS).
     */
    getIdentity(): KeyRef | null;
    /**
     * Gets the logging configuration for this HTTP client.
     */
    getLoggingConfig(): HTTPClientLoggingConfig;
    /**
     * Returns a specific response header from the last HTTP operation. The method returns null if the specific header
     * was not returned.
     */
    getResponseHeader(header: string): string | null;
    /**
     * Returns all the values of a response header from the last HTTP operation as a list of strings. This reflects the
     * fact that a specific header, e.g. `"Set-Cookie"`, may be set multiple times. In case there is no such
     * header, the method returns an empty list.
     */
    getResponseHeaders(name: string): List<string>;
    /**
     * Returns all response headers as a map in which each entry represents an individual header. The key of the entry
     * holds the header name and the entry value holds a list of all header values.
     */
    getResponseHeaders(): utilMap<any, any>;
    /**
     * Returns the status code of the last HTTP operation.
     */
    getStatusCode(): number;
    /**
     * Returns the message text of the last HTTP operation.
     */
    getStatusMessage(): string;
    /**
     * Returns the returned message body as text for HTTP status codes between 200 and 299.
     */
    getText(): string;
    /**
     * Returns the returned message body as text for HTTP status codes between 200 and 299.
     */
    getText(encoding: string): string;
    /**
     * Returns the timeout for this client, in milliseconds.
     */
    getTimeout(): number;
    /**
     * Opens the specified URL using the specified method. The following methods are supported: GET, POST, HEAD, PUT,
     * PATCH, OPTIONS, and DELETE
     */
    open(method: string, url: string): void;
    /**
     * Deprecated method.
     * @deprecated Use open instead.
     */
    open(method: string, url: string, async: boolean, user: string, password: string): void;
    /**
     * Opens the specified URL with the in parameter method specified Http method with given credentials [user,
     * password] using HTTP basic authentication. The following methods are supported: GET, POST, HEAD, PUT,
     * PATCH, OPTIONS, and DELETE
     */
    open(method: string, url: string, user: string, password: string): void;
    /**
     * Sends an HTTP request.
     */
    send(): void;
    /**
     * This method performs the actual HTTP communication. The text is sent as a request body. If the text is null no
     * data will be sent to the HTTP server.
     */
    send(text: string): void;
    /**
     * This method performs the actual HTTP communication. The text is sent as a request body. If the text is null no
     * data will be sent to the HTTP server.
     */
    send(text: string, encoding: string): void;
    /**
     * This method performs the actual HTTP communication. Sends the file to the HTTP server. The file content is sent
     * as a request body and is sent "as-is" (text or binary).
     */
    send(file: File): void;
    /**
     * This method performs the actual HTTP communication. If the file is null no data will be sent to the HTTP server.
     * If this method is used with a GET then the file parameter will contain the contents retrieved. When using this
     * method with a PUT/POST then the contents of the file parameter will be sent to the server.
     */
    sendAndReceiveToFile(file: File): boolean;
    /**
     * This method performs the actual HTTP communication. If the text is null no data will be sent to the HTTP server.
     */
    sendAndReceiveToFile(text: string, outFile: File): boolean;
    /**
     * This method performs the actual HTTP communication. If the text is null no data will be sent to the HTTP server.
     */
    sendAndReceiveToFile(text: string, encoding: string, outFile: File): boolean;
    /**
     * This method performs the actual HTTP communication. The bytes are sent as a request body. If the bytes are null no
     * data will be sent to the HTTP server.
     */
    sendBytes(body: Bytes): void;
    /**
     * This method performs the actual HTTP communication. If the body is null no data will be sent to the HTTP server.
     * @throws IOException
     */
    sendBytesAndReceiveToFile(body: Bytes, outFile: File): boolean;
    /**
     * Sends a multipart HTTP request. This method should only be called if the connection to the remote URL was opened
     * with a POST or PATCH method. All other methods will result in an exception being thrown. The request is constructed
     * from the passed array of parts.
     */
    sendMultiPart(parts: HTTPRequestPart[]): boolean;
    /**
     * Sets whether automatic HTTP redirect handling is enabled.
     * The default value is true. Set it to false to disable all redirects.
     */
    setAllowRedirect(allowRedirect: boolean): void;
    /**
     * Sets whether certificate host name verification is enabled.
     * The default value is true. Set it to false to disable host name verification.
     */
    setHostNameVerification(enable: boolean): void;
    /**
     * Sets the identity (private key) to use when mutual TLS (mTLS) is configured.
     * 
     * If this is not set and mTLS is used then the private key will be chosen from the key store based on the host
     * name.
     * If this is set to a reference named "__NONE__" then no private key will be used even if one is requested by the remote server.
     */
    setIdentity(keyRef: KeyRef): void;
    /**
     * Sets the logging configuration for this HTTP client.
     */
    setLoggingConfig(config: HTTPClientLoggingConfig): void;
    /**
     * Sets a request header for the next HTTP operation.
     */
    setRequestHeader(key: string, value: string): void;
    /**
     * Sets the timeout for connections made with this client to the given number of milliseconds. If the given timeout
     * is less than or equal to zero, the timeout is set to a maximum value of 2 or 15 minutes, depending on the
     * context.
     * 
     * This timeout value controls both the "connection timeout" (how long it takes to connect to the remote host) and
     * the "socket timeout" (how long, after connecting, it will wait without any data being read). Therefore, in the
     * worst case scenario, the total time of inactivity could be twice as long as the specified value.
     * 
     * The maximum timeout is 15 minutes when the client is used in a job, and 2 minutes otherwise. The default timeout
     * for a new client is the maximum timeout value.
     * 
     * This method can be called at any time, and will affect the next connection made with this client. It is not
     * possible to set the timeout for an open connection.
     * 
     * You should always set a reasonable timeout (e.g., a few seconds). Allowing connections to run long can result
     * in thread exhaustion.
     */
    setTimeout(timeoutMillis: number): void;
}

export = HTTPClient;
