/**
 * The class is used to store information about a remote file.
 * 
 * Note: when this class is used with sensitive data, be careful in persisting sensitive information to disk.
 */
declare class SFTPFileInfo {
    /**
     * Identifies if the file is a directory.
     */
    readonly directory: boolean;
    /**
     * Returns the last modification time of the file/directory.
     */
    readonly modificationTime: Date;
    /**
     * Returns the name of the file/directory.
     */
    readonly name: string;
    /**
     * Returns the size of the file/directory.
     */
    readonly size: number;
    /**
     * Constructs the SFTPFileInfo instance.
     */
    constructor(name: string, size: number, directory: boolean, mtime: number);
    /**
     * Identifies if the file is a directory.
     */
    getDirectory(): boolean;
    /**
     * Returns the last modification time of the file/directory.
     */
    getModificationTime(): Date;
    /**
     * Returns the name of the file/directory.
     */
    getName(): string;
    /**
     * Returns the size of the file/directory.
     */
    getSize(): number;
}

export = SFTPFileInfo;
