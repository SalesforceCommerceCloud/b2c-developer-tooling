import File = require('../io/File');
import WebDAVFileInfo = require('./WebDAVFileInfo');
import HashMap = require('../util/HashMap');

/**
 * The WebDAVClient class supports the WebDAV methods GET, PUT, MKCOL, MOVE,
 * COPY, PROPFIND,OPTIONS and DELETE.
 * 
 * Note: when this class is used with sensitive data, be careful in persisting sensitive information to disk.
 * The client can be used as shown in the following example:
 * 
 * ```
 * var webdavClient : WebDAVClient = new WebDAVClient("http://mywebdav.server.com","myusername", "mypassword");
 * var getString : String = webdavClient.get("myData.xml","UTF-8");
 * var message : String;
 * 
 * if (webdavClient.succeeded())
 * {
 * message = webDavClient.statusText;
 * }
 * else
 * {
 * // error handling
 * message="An error occurred with status code "+webdavClient.statusCode;
 * }
 * 
 * var data : XML = new XML(getString);
 * ```
 * 
 * The WebDAV client supports the following authentication schemes:
 * 
 * - Basic authentication
 * - Digest authentication
 * 
 * The methods of this class do not generally throw exceptions if the underlying
 * WebDAV operation do not succeed.The result of a WebDAV operation can be
 * checked using the methods succeeded(), getStatusCode(), and getStatusText().
 * 
 * Important note: This WebDAV client cannot be used to access the Commerce Cloud Digital
 * server via WebDAV protocol.
 */
declare class WebDAVClient {
    /**
     * The default encoding character set.
     */
    static readonly DEFAULT_ENCODING = "UTF-8";
    /**
     * The default size for `get()` returning a File is 5MB.
     */
    static readonly DEFAULT_GET_FILE_SIZE: number;
    /**
     * The default size for `get()` returning a String is 2MB.
     */
    static readonly DEFAULT_GET_STRING_SIZE: number;
    /**
     * The depth of searching a WebDAV destination using the PROPFIND method -
     * if that depth is given to the PROPFIND method as an input parameter the
     * destination will be searched only on the level of the given path and a
     * list of all containing files on that level will be returned [is not
     * supported by every server].
     */
    static readonly DEPTH_0 = 0;
    /**
     * The depth of searching a WebDAV destination using the PROPFIND method -
     * if that depth is given to the PROPFIND method as an input parameter the
     * destination will be searched until one level under the given path and a
     * list of all containing files in that two levels [/path and one level
     * underneath] will be returned [is not supported by every server].
     */
    static readonly DEPTH_1 = 1;
    /**
     * The depth of searching a WebDAV destination using the PROPFIND method -
     * if that depth is given to the PROPFIND method as an input parameter the
     * destination will be fully searched and a list of all containing files
     * will be returned [is not supported by every server].
     */
    static readonly DEPTH_INIFINITY = 2147483647;
    /**
     * The maximum size for `get()` returning a File is forty times
     * the default size for getting a file. The largest file allowed is 200MB.
     */
    static readonly MAX_GET_FILE_SIZE: number;
    /**
     * The maximum size for `get()` returning a String is five
     * times the default size for getting a String. The largest String allowed
     * is 10MB.
     */
    static readonly MAX_GET_STRING_SIZE: number;
    /**
     * Returns a dw.util.HashMap of all response headers.
     */
    readonly allResponseHeaders: HashMap<any, any>;
    /**
     * Returns the status code after the execution of a method.
     */
    readonly statusCode: number;
    /**
     * Returns the status text after the execution of a method.
     */
    readonly statusText: string;
    /**
     * Creates a new client for the use at a server which requires
     * authentication.
     * The client supports the following authentication schemes:
     * - Basic authentication scheme
     * - Digest authentication scheme
     */
    constructor(rootUrl: string, username: string, password: string);
    /**
     * Creates a new client for the use at a server which does not require
     * authentication.
     */
    constructor(rootUrl: string);
    /**
     * Adds a request header to the next WebDAV call.
     */
    addRequestHeader(headerName: string, headerValue: string): void;
    /**
     * Closes the current connection to the server.
     */
    close(): void;
    /**
     * Copies a file on the server from one place `rootUrl`/`origin`
     * to the other `rootUrl`/`destination`. If
     * `destination` already exists it gets overwritten. Returns
     * true if succeeded, otherwise false.
     */
    copy(origin: string, destination: string): boolean;
    /**
     * Copies a file on the server from one place `rootUrl`/`origin`
     * to the other `rootUrl`/`destination`. If
     * the passed parameter `overwrite` is true and
     * `destination` already exists it gets overwritten. Returns
     * true if succeeded, otherwise false.
     */
    copy(origin: string, destination: string, overwrite: boolean): boolean;
    /**
     * Copies a file on the server from one place `rootUrl`/`origin`
     * to the other `rootUrl`/`destination`. If
     * the passed parameter `overwrite` is true and
     * `destination` already exists it gets overwritten. If the
     * passed parameter `shallow` is true a flat copy mechanism is
     * used.
     * 
     * Returns true if succeeded, otherwise false.
     */
    copy(origin: string, destination: string, overwrite: boolean, shallow: boolean): boolean;
    /**
     * Deletes a file or directory from the remote server that can be found
     * under `rootUrl`/`path`. Returns true if
     * succeeded, otherwise false.
     */
    del(path: string): boolean;
    /**
     * Reads the content of a remote file or directory that can be found under
     * `rootUrl`/`path` and returns a string
     * representation of the data found in the DEFAULT_ENCODING encoding. If the
     * remote location is a directory the result depends on the server
     * configuration, some return an HTML formatted directory listing. Returns
     * at most DEFAULT_GET_STRING_SIZE bytes.
     */
    get(path: string): string;
    /**
     * Reads the content of a remote file or directory that can be found under
     * `rootUrl`/`path` and returns a string
     * representation of the data found in the given `encoding`. If
     * the remote location is a directory the result depends on the server
     * configuration, some return an HTML formatted directory listing. Returns
     * at most DEFAULT_GET_STRING_SIZE bytes.
     */
    get(path: string, encoding: string): string;
    /**
     * Reads the content of a remote file or directory that can be found under
     * `rootUrl`/`path` and returns a string
     * representation of the data found in the given `encoding`. If
     * the remote location is a directory the result depends on the server
     * configuration, some return an HTML formatted directory listing. Returns
     * at most maxGetSize bytes.
     */
    get(path: string, encoding: string, maxGetSize: number): string;
    /**
     * Reads the content of a remote file or directory that can be found under
     * `rootUrl`/`path` in DEFAULT_ENCODING
     * encoding and writes a dw.io.File in the system's standard
     * encoding, which is "UTF-8". If the remote location is a directory the
     * result depends on the server configuration, some return an HTML formatted
     * directory listing. Receives at most DEFAULT_GET_FILE_SIZE bytes which
     * determines the file size of the local file. Returns true if succeeded
     * otherwise false.
     */
    get(path: string, file: File): boolean;
    /**
     * Reads the content of a remote file or directory that can be found under
     * `rootUrl`/`path` in DEFAULT_ENCODING
     * encoding and writes a dw.io.File in the system's standard
     * encoding, which is "UTF-8". If the remote location is a directory the
     * result depends on the server configuration, some return an HTML formatted
     * directory listing. Receives at most maxFileSize bytes which determines
     * the file size of the local file. Returns true if succeeded, otherwise
     * false.
     */
    get(path: string, file: File, maxFileSize: number): boolean;
    /**
     * Reads the content of a remote file or directory that can be found under
     * `rootUrl`/`path` in the passed encoding and
     * writes a dw.io.File in the system standard encoding, which is
     * "UTF-8". If the remote location is a directory the result depends on the
     * server configuration, some return an HTML formatted directory listing.
     * Receives at most maxFileSize bytes which determines the file size of the
     * local file. Returns true if succeeded, otherwise false.
     */
    get(path: string, file: File, encoding: string, maxFileSize: number): boolean;
    /**
     * Returns a dw.util.HashMap of all response headers.
     */
    getAllResponseHeaders(): HashMap<any, any>;
    /**
     * Reads the content of a remote binary file that can be found under
     * `rootUrl`/`path` and creates a local copy
     * in dw.io.File. If the remote location is a directory the result
     * depends on the server configuration, some return an HTML formatted
     * directory listing. Copies at most DEFAULT_GET_FILE_SIZE bytes. Returns
     * true if succeeded, otherwise false.
     */
    getBinary(path: string, file: File): boolean;
    /**
     * Reads the content of a remote binary file that can be found under
     * `rootUrl`/`path` and creates a local copy
     * in dw.io.File. If the remote location is a directory the result
     * depends on the server configuration, some return an HTML formatted
     * directory listing. Copies at most maxFileSize bytes. Returns true if
     * succeeded, otherwise false.
     */
    getBinary(path: string, file: File, maxFileSize: number): boolean;
    /**
     * Returns a specified response header - multiple headers are separated by
     * CRLF.
     */
    getResponseHeader(header: string): string;
    /**
     * Returns the status code after the execution of a method.
     */
    getStatusCode(): number;
    /**
     * Returns the status text after the execution of a method.
     */
    getStatusText(): string;
    /**
     * Creates a directory on the remote server on the location
     * `rootUrl`/`path`.
     */
    mkcol(path: string): boolean;
    /**
     * Moves a file on the server from one place `rootUrl` + "/" +`origin`
     * to the other `rootUrl`/`destination`. If
     * `destination` already exists it gets overwritten. Can also
     * be used to rename a remote file. Returns true if succeeded, otherwise
     * false.
     */
    move(origin: string, destination: string): boolean;
    /**
     * Moves a file on the server from one place `rootUrl`/`origin`
     * to the other `rootUrl`/`destination` Can
     * also be used to rename a remote file. If `overwrite` is true
     * and `destination` already exists it gets overwritten.
     * Returns true if succeeded, otherwise false.
     */
    move(origin: string, destination: string, overwrite: boolean): boolean;
    /**
     * Returns a list of methods which can be executed on the server location
     * `rootUrl`/`path`.
     */
    options(path: string): string[];
    /**
     * Get file listing of a remote location.
     * 
     * Returns a list of dw.net.WebDAVFileInfo objects which contain
     * information about the files and directories located on
     * `rootUrl`/`path` and DEPTH_1 (1) level
     * underneath.
     */
    propfind(path: string): WebDAVFileInfo[];
    /**
     * Get file listing of a remote location.
     * 
     * Returns a list of dw.net.WebDAVFileInfo objects which contain
     * information about the files and directories located on
     * `rootUrl`/`path` and the passed depth
     * underneath.
     */
    propfind(path: string, depth: number): WebDAVFileInfo[];
    /**
     * Puts content encoded with DEFAULT_ENCODING into a remote located file at
     * `rootUrl`/`path`. Returns true if
     * succeeded, otherwise false.
     * 
     * If the content of a local file is to be uploaded, please use method
     * put instead.
     */
    put(path: string, content: string): boolean;
    /**
     * Puts content encoded with the passed encoding into a remote located file
     * at `rootUrl`/`path`. Returns true if
     * succeeded, otherwise false.
     * 
     * If the content of a local file is to be uploaded, please use method
     * put instead.
     */
    put(path: string, content: string, encoding: string): boolean;
    /**
     * Puts content out of a passed local file into a remote located file
     * at `rootUrl`/`path`. This method performs
     * a binary file transfer. Returns true if succeeded, otherwise false.
     */
    put(path: string, file: File): boolean;
    /**
     * Returns true if the last executed WebDAV method was executed successfully - otherwise false.
     * See the code snippet above for an example how to use the succeed() method.
     * @see dw.net.WebDAVClient
     */
    succeeded(): boolean;
}

export = WebDAVClient;
