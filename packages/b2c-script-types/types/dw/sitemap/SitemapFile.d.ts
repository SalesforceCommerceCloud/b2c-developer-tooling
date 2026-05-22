/**
 * Instances of this class represent sitemap files located in the appservers shared file system. Methods are used to get
 * details of a sitemap file, such as the hostname it is associated with.
 */
declare class SitemapFile {
    /**
     * Returns the name of the file e.g. sitemap_index.xml
     */
    readonly fileName: string;
    /**
     * Returns the size of the file in bytes.
     */
    readonly fileSize: number;
    /**
     * Returns the URL used to access this file in a storefront request.
     */
    readonly fileURL: string;
    /**
     * Returns the host name this file is associated with.
     */
    readonly hostName: string;
    /**
     * Checks if this instance of sitemap file is valid. Examples for invalid files are:
     * 
     * - file size > 10mb
     * 
     * Additional violations might be added later.
     */
    readonly valid: boolean;
    private constructor();
    /**
     * Returns the name of the file e.g. sitemap_index.xml
     */
    getFileName(): string;
    /**
     * Returns the size of the file in bytes.
     */
    getFileSize(): number;
    /**
     * Returns the URL used to access this file in a storefront request.
     */
    getFileURL(): string;
    /**
     * Returns the host name this file is associated with.
     */
    getHostName(): string;
    /**
     * Checks if this instance of sitemap file is valid. Examples for invalid files are:
     * 
     * - file size > 10mb
     * 
     * Additional violations might be added later.
     */
    isValid(): boolean;
}

export = SitemapFile;
