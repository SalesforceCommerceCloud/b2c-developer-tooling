/**
 * The class is used to store information about a remote file.
 * 
 * Note: when this class is used with sensitive data, be careful in persisting sensitive information to disk.
 * @deprecated The FTPClient is deprecated. Use SFTPClient for a secure alternative.
 */
declare class FTPFileInfo {
    /**
     * Identifies if the file is a directory.
     */
    readonly directory: boolean;
    /**
     * Returns the name of the file.
     */
    readonly name: string;
    /**
     * Returns the size of the file.
     */
    readonly size: number;
    /**
     * Returns the timestamp of the file.
     */
    readonly timestamp: Date;
    /**
     * Constructs the FTPFileInfo instance.
     */
    constructor(name: string, size: number, directory: boolean, timestamp: Date);
    /**
     * Identifies if the file is a directory.
     */
    getDirectory(): boolean;
    /**
     * Returns the name of the file.
     */
    getName(): string;
    /**
     * Returns the size of the file.
     */
    getSize(): number;
    /**
     * Returns the timestamp of the file.
     */
    getTimestamp(): Date;
}

export = FTPFileInfo;
