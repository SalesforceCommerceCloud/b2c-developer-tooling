/**
 * Simple class representing a file on a remote WebDAV location.  The class
 * possesses only read-only attributes of the file and does not permit any
 * manipulation of the file itself.  Instances of this class are returned
 * by dw.net.WebDAVClient.propfind which is used to get a
 * listing of files in a WebDAV directory.
 * 
 * Note: when this class is used with sensitive data, be careful in persisting sensitive information to disk.
 */
declare class WebDAVFileInfo {
    /**
     * Returns the content type of the file.
     */
    readonly contentType: string;
    /**
     * Returns the creationDate of the file.
     */
    readonly creationDate: Date;
    /**
     * Identifies if the file is a directory.
     */
    readonly directory: boolean;
    /**
     * Returns the name of the file.
     */
    readonly name: string;
    /**
     * Returns the path of the file.
     */
    readonly path: string;
    /**
     * Returns the size of the file.
     */
    readonly size: number;
    private constructor();
    /**
     * Returns the content type of the file.
     */
    getContentType(): string;
    /**
     * Returns the creationDate of the file.
     */
    getCreationDate(): Date;
    /**
     * Returns the name of the file.
     */
    getName(): string;
    /**
     * Returns the path of the file.
     */
    getPath(): string;
    /**
     * Returns the size of the file.
     */
    getSize(): number;
    /**
     * Identifies if the file is a directory.
     */
    isDirectory(): boolean;
    /**
     * Returns the lastModified date of the file.
     */
    lastModified(): Date;
}

export = WebDAVFileInfo;
