import File = require('../io/File');
import FTPFileInfo = require('./FTPFileInfo');

/**
 * The FTPClient class supports the FTP commands CD, GET, PUT, DEL, MKDIR, RENAME, and LIST. The FTP connection is
 * established using passive transfer mode (PASV). The transfer of files can be text or binary.
 * 
 * Note: when this class is used with sensitive data, be careful in persisting sensitive information to disk.
 * 
 * An example usage is as follows:
 * 
 * ```
 * `
 * var ftp : FTPClient = new dw.net.FTPClient();
 * ftp.connect("my.ftp-server.com", "username", "password");
 * var data : String = ftp.get("simple.txt");
 * ftp.disconnect();
 * `
 * ```
 * 
 * The default connection timeout depends on the script context timeout and will be set to a maximum of 30 seconds
 * (default script context timeout is 10 seconds within storefront requests and 15 minutes within jobs).
 * 
 * IMPORTANT NOTE: Before you can make an outbound FTP connection, the FTP server IP address must be enabled for
 * outbound traffic at the Commerce Cloud Digital firewall for your POD. Please file a support request to request a new firewall
 * rule.
 * @deprecated The FTPClient is deprecated. Use SFTPClient for a secure alternative.
 */
declare class FTPClient {
    /**
     * The default size for `get()` returning a File is 5MB
     * @deprecated The default size is not supported anymore. The `get()` methods returning a file will
     * always try to return MAX_GET_FILE_SIZE bytes instead.
     */
    static readonly DEFAULT_GET_FILE_SIZE = 5242880;
    /**
     * The default size for `get()` returning a String is 2MB
     * @deprecated The default size is not supported anymore. The `get()` methods returning a String will
     * always try to return MAX_GET_STRING_SIZE bytes instead.
     */
    static readonly DEFAULT_GET_STRING_SIZE = 2097152;
    /**
     * The maximum size for `get()` returning a File is forty times the default size for getting a file. The
     * largest file allowed is 200MB.
     */
    static readonly MAX_GET_FILE_SIZE = 209715200;
    /**
     * The maximum size for `get()` returning a String is five times the default size for getting a String.
     * The largest String allowed is 10MB.
     */
    static readonly MAX_GET_STRING_SIZE = 10485760;
    /**
     * Identifies if the FTP client is currently connected to the FTP server.
     */
    readonly connected: boolean;
    /**
     * Returns the reply code from the last FTP action.
     */
    readonly replyCode: number;
    /**
     * Returns the string message from the last FTP action.
     */
    readonly replyMessage: string;
    /**
     * Returns the timeout for this client, in milliseconds.
     */
    timeout: number;
    /**
     * Constructs the FTPClient instance.
     */
    constructor();
    /**
     * Changes the current directory on the remote server to the given path.
     */
    cd(path: string): boolean;
    /**
     * Connects and logs on to an FTP Server as "anonymous" and returns a boolean indicating success or failure.
     */
    connect(host: string): boolean;
    /**
     * Connects and logs on to an FTP server and returns a boolean indicating success or failure.
     */
    connect(host: string, user: string, password: string): boolean;
    /**
     * Connects and logs on to an FTP Server as "anonymous" and returns a boolean indicating success or failure.
     */
    connect(host: string, port: number): boolean;
    /**
     * Connects and logs on to an FTP server and returns a boolean indicating success or failure.
     */
    connect(host: string, port: number, user: string, password: string): boolean;
    /**
     * Deletes the remote file on the server identified by the path parameter.
     */
    del(path: string): boolean;
    /**
     * The method first logs the current user out from the server and then disconnects from the server.
     */
    disconnect(): void;
    /**
     * Reads the content of a remote file and returns it as a string using "ISO-8859-1" encoding to read it. Read at
     * most MAX_GET_STRING_SIZE bytes.
     */
    get(path: string): string | null;
    /**
     * Reads the content of a remote file and returns it as string using the passed encoding. Read at most
     * MAX_GET_STRING_SIZE characters.
     */
    get(path: string, encoding: string): string | null;
    /**
     * Reads the content of a remote file and returns it as a string using "ISO-8859-1" encoding to read it. Read at
     * most maxGetSize characters.
     * @deprecated The maxGetSize attribute is not supported anymore. Use the method get instead.
     */
    get(path: string, maxGetSize: number): string | null;
    /**
     * Reads the content of a remote file and returns it as a string using the specified encoding. Returns at most
     * maxGetSize characters.
     * @deprecated The maxGetSize attribute is not supported anymore. Use the method get
     * instead.
     */
    get(path: string, encoding: string, maxGetSize: number): string | null;
    /**
     * Reads the content of a remote file and creates a local copy in the given file using the passed string encoding to
     * read the file content and using the system standard encoding "UTF-8" to write the file. Copies at most
     * MAX_GET_FILE_SIZE bytes.
     */
    get(path: string, encoding: string, file: File): boolean;
    /**
     * Reads the content of a remote file and creates a local copy in the given file using the passed string encoding to
     * read the file content and using the system standard encoding "UTF-8" to write the file. Copies at most maxGetSize
     * bytes.
     * @deprecated The maxGetSize attribute is not supported anymore. Use the method get
     * instead.
     */
    get(path: string, encoding: string, file: File, maxGetSize: number): boolean;
    /**
     * Reads the content of a remote file and creates a local copy in the given file. Copies at most MAX_GET_FILE_SIZE
     * bytes. The FTP transfer is done in Binary mode.
     */
    getBinary(path: string, file: File): boolean;
    /**
     * Reads the content of a remote file and creates a local copy in the given file. Copies at most maxGetSize bytes.
     * The FTP transfer is done in Binary mode.
     * @deprecated The maxGetSize attribute is not supported anymore. Use the method getBinary
     * instead.
     */
    getBinary(path: string, file: File, maxGetSize: number): boolean;
    /**
     * Identifies if the FTP client is currently connected to the FTP server.
     */
    getConnected(): boolean;
    /**
     * Returns the reply code from the last FTP action.
     */
    getReplyCode(): number;
    /**
     * Returns the string message from the last FTP action.
     */
    getReplyMessage(): string;
    /**
     * Returns the timeout for this client, in milliseconds.
     */
    getTimeout(): number;
    /**
     * Returns a list of FTPFileInfo objects containing information about the files in the current directory.
     */
    list(): FTPFileInfo[];
    /**
     * Returns a list of FTPFileInfo objects containing information about the files in the remote directory defined by
     * the given path.
     */
    list(path: string): FTPFileInfo[];
    /**
     * Creates a directory
     */
    mkdir(path: string): boolean;
    /**
     * Puts the specified content to the specified full path using "ISO-8859-1" encoding. The full path must include the
     * path and the file name. If the content of a local file is to be uploaded, please use method
     * putBinary instead.
     */
    put(path: string, content: string): boolean;
    /**
     * Put the given content to a file on the given full path on the FTP server. The full path must include the path and
     * the file name. The transformation from String into binary data is done via the encoding provided with the method
     * call. If the content of a local file is to be uploaded, please use method putBinary
     * instead.
     */
    put(path: string, content: string, encoding: string): boolean;
    /**
     * Put the content of the given file into a file on the remote FTP server with the given full path. The full path
     * must include the path and the file name.
     */
    putBinary(path: string, file: File): boolean;
    /**
     * Deletes the remote directory on the server identified by the path parameter. In order to delete the directory
     * successfully the directory needs to be empty, otherwise the removeDirectory() method will return false.
     */
    removeDirectory(path: string): boolean;
    /**
     * Renames an existing file.
     */
    rename(from: string, to: string): boolean;
    /**
     * Sets the timeout for connections made with the FTP client to the given number of milliseconds. If the given
     * timeout is less than or equal to zero, the timeout is set to the same value as the script context timeout but
     * will only be set to a maximum of 30 seconds.
     * 
     * The maximum and default timeout depend on the script context timeout. The maximum timeout is set to a maximum of
     * 2 minutes. The default timeout for a new client is set to a maximum of 30 seconds.
     * 
     * This method can be called at any time, and will affect the next connection made with this client. It is not
     * possible to set the timeout for an open connection.
     */
    setTimeout(timeoutMillis: number): void;
}

export = FTPClient;
