import KeyRef = require('../crypto/KeyRef');
import File = require('../io/File');
import SFTPFileInfo = require('./SFTPFileInfo');

/**
 * The SFTPClient class supports the SFTP commands GET, PUT, DEL, MKDIR, RENAME, and LIST. The transfer of files can be
 * text or binary.
 * 
 * Note: when this class is used with sensitive data, be careful in persisting sensitive information.
 * 
 * An example usage is as follows:
 * 
 * ```
 * `
 * var sftp : SFTPClient = new dw.net.SFTPClient();
 * sftp.connect("my.sftp-server.com", "username", "password");
 * var data : String = sftp.get("simple.txt");
 * sftp.disconnect();
 * `
 * ```
 * 
 * The default connection timeout depends on the script context timeout and will be set to a maximum of 30 seconds
 * (default script context timeout is 10 seconds within storefront requests and 15 minutes within jobs).
 * 
 * IMPORTANT NOTE: Before you can make an outbound SFTP connection to a port other than 22, the SFTP server IP address must be enabled
 * for outbound traffic at the Commerce Cloud Digital firewall for your POD. Please file a support request to request a new firewall
 * rule.
 * 
 * SSH Version 2 is supported with the following algorithms:
 * 
 * Type  Algorithms
 * Host Key  ssh-ed25519, ecdsa-sha2-nistp256, ecdsa-sha2-nistp384, ecdsa-sha2-nistp521,
 * rsa-sha2-512, rsa-sha2-256, ssh-rsa, ssh-dss
 * Key Exchange (KEX)  curve25519-sha256, curve25519-sha256@libssh.org, ecdh-sha2-nistp256,
 * ecdh-sha2-nistp384, ecdh-sha2-nistp521, diffie-hellman-group-exchange-sha256,
 * diffie-hellman-group16-sha512, diffie-hellman-group18-sha512, diffie-hellman-group14-sha256,
 * diffie-hellman-group14-sha1, diffie-hellman-group-exchange-sha1, diffie-hellman-group1-sha1
 * Cipher  aes128-ctr, aes192-ctr, aes256-ctr, aes128-gcm@openssh.com,
 * aes256-gcm@openssh.com, aes128-cbc, 3des-ctr, 3des-cbc, blowfish-cbc, aes192-cbc,
 * aes256-cbc
 * Message Authentication Code (MAC)  hmac-sha2-256-etm@openssh.com, hmac-sha2-512-etm@openssh.com,
 * hmac-sha1-etm@openssh.com, hmac-sha2-256, hmac-sha2-512, hmac-sha1, hmac-md5, hmac-sha1-96,
 * hmac-md5-96
 * Public Key Authentication  rsa-sha2-512, rsa-sha2-256, ssh-rsa
 */
declare class SFTPClient {
    /**
     * The maximum size for get() methods returning a File is 200 MB.
     */
    static readonly MAX_GET_FILE_SIZE = 209715200;
    /**
     * The maximum size for get() methods returning a String is 10 MB.
     */
    static readonly MAX_GET_STRING_SIZE = 10485760;
    /**
     * Identifies if the SFTP client is currently connected to the SFTP server.
     */
    readonly connected: boolean;
    /**
     * Returns the error message from the last SFTP action.
     */
    readonly errorMessage: string;
    /**
     * Gets the identity (private key) used for the connection.
     * 
     * The key is only associated to this instance of the SFTP client.
     */
    identity: KeyRef | null;
    /**
     * Returns the timeout for this client, in milliseconds.
     */
    timeout: number;
    /**
     * Constructor.
     */
    constructor();
    /**
     * Adds a known public host key for the next connection attempt.
     * 
     * This method associates the key to the host used in the subsequent connect method, and must be called prior to connect.
     * The key is not persisted, and is only associated to this instance of the SFTP client.
     * 
     * Multiple keys may be added, and the validation will succeed if the remote host matches any of them.
     * 
     * The default behavior is to persist and trust an unknown host key if there are no known host keys available.
     * If addKnownHostKey is later used to trust specific a specific key or keys, then any previously persisted keys
     * will be ignored.
     */
    addKnownHostKey(type: string, key: string): void;
    /**
     * Changes the current directory on the remote server to the given path.
     */
    cd(path: string): boolean;
    /**
     * Connects and logs on to a SFTP server and returns a boolean indicating success or failure.
     */
    connect(host: string, user: string, password: string): boolean;
    /**
     * Connects and logs on to a SFTP server and returns a boolean indicating success or failure.
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
     * Reads the content of a remote file and returns it as a string using "ISO-8859-1" encoding to read it. Files with
     * at most MAX_GET_STRING_SIZE bytes are read.
     */
    get(path: string): string | null;
    /**
     * Reads the content of a remote file and returns it as a string using the specified encoding. Files with at most
     * MAX_GET_STRING_SIZE bytes are read.
     */
    get(path: string, encoding: string): string | null;
    /**
     * Reads the content of a remote file and creates a local copy in the given file using the passed string encoding to
     * read the file content and using the system standard encoding "UTF-8" to write the file. Copies at most
     * MAX_GET_FILE_SIZE bytes.
     */
    get(path: string, encoding: string, file: File): boolean;
    /**
     * Reads the content of a remote file and creates a local copy in the given file. Copies at most MAX_GET_FILE_SIZE
     * bytes. The SFTP transfer is done in binary mode.
     */
    getBinary(path: string, file: File): boolean;
    /**
     * Identifies if the SFTP client is currently connected to the SFTP server.
     */
    getConnected(): boolean;
    /**
     * Returns the error message from the last SFTP action.
     */
    getErrorMessage(): string;
    /**
     * Returns a SFTPFileInfo objects containing information about the given file/directory path.
     */
    getFileInfo(path: string): SFTPFileInfo | null;
    /**
     * Gets the identity (private key) used for the connection.
     * 
     * The key is only associated to this instance of the SFTP client.
     */
    getIdentity(): KeyRef | null;
    /**
     * Returns the timeout for this client, in milliseconds.
     */
    getTimeout(): number;
    /**
     * Returns a list of SFTPFileInfo objects containing information about the files in the current directory.
     */
    list(): SFTPFileInfo[] | null;
    /**
     * Returns a list of SFTPFileInfo objects containing information about the files in the remote directory defined by
     * the given path.
     */
    list(path: string): SFTPFileInfo[] | null;
    /**
     * Creates a directory
     */
    mkdir(path: string): boolean;
    /**
     * Puts the specified content to the specified path using "ISO-8859-1" encoding. If the content of a local file is
     * to be uploaded, please use method putBinary(String,File) instead.
     * 
     * NOTE: If the remote file already exists, it is overwritten.
     */
    put(path: string, content: string): boolean;
    /**
     * Put the given content to a file on the given path on the SFTP server. The transformation from String into binary
     * data is done via the encoding provided with the method call. If the content of a local file is to be uploaded,
     * please use method putBinary(String,File) instead.
     * 
     * NOTE: If the remote file already exists, it is overwritten.
     */
    put(path: string, content: string, encoding: string): boolean;
    /**
     * Put the content of the given file into a file on the remote SFTP server with the given absolute path. NOTE: If
     * the remote file already exists, it is overwritten.
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
     * Sets the identity (private key) to use for the next connection attempt.
     * 
     * The key is only associated to this instance of the SFTP client.
     */
    setIdentity(keyRef: KeyRef): void;
    /**
     * Sets the timeout for connections made with the SFTP client to the given number of milliseconds. If the given
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

export = SFTPClient;
