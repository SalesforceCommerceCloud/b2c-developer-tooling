import utilMap = require('../util/Map');
import SitemapFile = require('./SitemapFile');
import File = require('../io/File');

/**
 * dw.sitemap.SitemapMgr is used to access and modify custom sitemap files.
 * 
 * To access custom sitemap files, use methods getCustomSitemapFiles.
 * 
 * To delete custom sitemap files, use methods deleteCustomSitemapFile,
 * deleteCustomSitemapFiles and deleteCustomSitemapFiles.
 * 
 * To add custom sitemap files, use methods addCustomSitemapFile. The file will be copied from
 * WebDAV (dw.io.File represent a file in WebDAV) to the appservers shared file system.
 * 
 * Please note that all provided methods are operating in appservers shared file system. These modifications are visible
 * via "Custom Sitemaps" tab under Merchant Tools => SEO => Sitemaps - Custom Sitemaps in
 * Business Manager. To publish all changes, execute job under Merchant Tools => SEO => Sitemaps => Job.
 */
declare class SitemapMgr {
    /**
     * Reads all existing custom sitemap files from files system of the appservers custom sitemap directory into memory
     * and returns them in a Map containing mappings like
     * 
     * - Hostname 1 => [SitemapFile hostname1_sitemapfile1, SitemapFile hostname1_sitemapfile2]
     * - Hostname 2 => [SitemapFile hostname2_sitemapfile1]
     */
    static readonly customSitemapFiles: utilMap<any, any>;
    private constructor();
    /**
     * Adds the given dw.io.File to the appservers custom sitemap directory. All content of the appservers
     * custom sitemap directory is considered by the system job "Create Sitemap Schedule".
     * 
     * The files are added to the directory which is accessible via "Custom Sitemaps" tab under Merchant Tools =>
     * SEO => Sitemaps - Custom Sitemaps in Business Manager. To publish that change, execute job under Merchant Tools => SEO => Sitemaps => Job.
     * @throws Exception
     */
    static addCustomSitemapFile(hostName: string, file: File): void;
    /**
     * Deletes the given custom sitemap file from the appservers shared file system.
     * 
     * The file is deleted from the directory which is accessible via "Custom Sitemaps" tab under Merchant Tools
     * => SEO => Sitemaps - Custom Sitemaps in Business Manager. To publish that change, execute job under Merchant Tools => SEO => Sitemaps => Job.
     */
    static deleteCustomSitemapFile(sitemapFile: SitemapFile): void;
    /**
     * Deletes all custom sitemap files for the given hostname from the appservers shared file system.
     * 
     * The files are deleted from the directory which is accessible via "Custom Sitemaps" tab under Merchant
     * Tools => SEO => Sitemaps - Custom Sitemaps in Business Manager. To publish that change, execute job under Merchant Tools => SEO => Sitemaps => Job.
     */
    static deleteCustomSitemapFiles(hostName: string): void;
    /**
     * Deletes all custom sitemap files for all hostnames from the appservers shared file system.
     * 
     * The files are deleted from the directory which is accessible via "Custom Sitemaps" tab under Merchant
     * Tools => SEO => Sitemaps - Custom Sitemaps in Business Manager. To publish that change, execute job under Merchant Tools => SEO => Sitemaps => Job.
     */
    static deleteCustomSitemapFiles(): void;
    /**
     * Reads all existing custom sitemap files from files system of the appservers custom sitemap directory into memory
     * and returns them in a Map containing mappings like
     * 
     * - Hostname 1 => [SitemapFile hostname1_sitemapfile1, SitemapFile hostname1_sitemapfile2]
     * - Hostname 2 => [SitemapFile hostname2_sitemapfile1]
     */
    static getCustomSitemapFiles(): utilMap<any, any>;
}

export = SitemapMgr;
