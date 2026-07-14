import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Collection = require('../util/Collection');
import Content = require('./Content');

declare global {
    module ICustomAttributes {
        interface Folder extends CustomAttributes {
        }
    }
}

/**
 * Class representing a folder for organizing content assets in Commerce Cloud Digital.
 */
declare class Folder extends ExtensibleObject<ICustomAttributes.Folder> {
    /**
     * Returns the ID of the folder. The ID can be used to uniquely
     * identify a folder within any given library. This folder ID provides
     * an alternative lookup mechanism for folders frequently used in
     * the storefront.
     */
    readonly ID: string;
    /**
     * Returns the content objects for this folder, sorted by position.
     */
    readonly content: Collection<Content>;
    /**
     * Returns the description for the folder as known in the current
     * locale or null if it cannot be found.
     */
    readonly description: string | null;
    /**
     * Returns the display name for the folder as known in the current
     * locale or null if it cannot be found.
     */
    readonly displayName: string | null;
    /**
     * Indicates if the folder is set online or
     * offline. Initially, all folders are set online.
     */
    readonly online: boolean;
    /**
     * Returns the online content objects for this folder, sorted by position.
     */
    readonly onlineContent: Collection<Content>;
    /**
     * Returns the online subfolders of this folder, sorted by position.
     */
    readonly onlineSubFolders: Collection<Folder>;
    /**
     * Returns the page description for this folder using the value in
     * the current locale, or returns null if no value was found.
     */
    readonly pageDescription: string | null;
    /**
     * Returns the page keywords for this folder using the value in
     * the current locale, or returns null if no value was found.
     */
    readonly pageKeywords: string | null;
    /**
     * Returns the page title for this folder using the value in
     * the current locale, or returns null if no value was found.
     */
    readonly pageTitle: string | null;
    /**
     * Returns the page URL for this folder using the value in
     * the current locale, or returns null if no value was found.
     */
    readonly pageURL: string | null;
    /**
     * Returns the parent folder of this folder.
     */
    readonly parent: Folder;
    /**
     * Indicates if this is the root folder.
     */
    readonly root: boolean;
    /**
     * Returns the folder's sitemap change frequency.
     */
    readonly siteMapChangeFrequency: string;
    /**
     * Returns the folder's sitemap inclusion.
     */
    readonly siteMapIncluded: number;
    /**
     * Returns the folder's sitemap priority.
     */
    readonly siteMapPriority: number;
    /**
     * Returns the subfolders of this folder, sorted by position.
     */
    readonly subFolders: Collection<Folder>;
    /**
     * Returns the name of the template used to render the folder
     * in the store front.
     */
    readonly template: string;
    private constructor();
    /**
     * Returns the content objects for this folder, sorted by position.
     */
    getContent(): Collection<Content>;
    /**
     * Returns the description for the folder as known in the current
     * locale or null if it cannot be found.
     */
    getDescription(): string | null;
    /**
     * Returns the display name for the folder as known in the current
     * locale or null if it cannot be found.
     */
    getDisplayName(): string | null;
    /**
     * Returns the ID of the folder. The ID can be used to uniquely
     * identify a folder within any given library. This folder ID provides
     * an alternative lookup mechanism for folders frequently used in
     * the storefront.
     */
    getID(): string;
    /**
     * Returns the online content objects for this folder, sorted by position.
     */
    getOnlineContent(): Collection<Content>;
    /**
     * Returns the online subfolders of this folder, sorted by position.
     */
    getOnlineSubFolders(): Collection<Folder>;
    /**
     * Returns the page description for this folder using the value in
     * the current locale, or returns null if no value was found.
     */
    getPageDescription(): string | null;
    /**
     * Returns the page keywords for this folder using the value in
     * the current locale, or returns null if no value was found.
     */
    getPageKeywords(): string | null;
    /**
     * Returns the page title for this folder using the value in
     * the current locale, or returns null if no value was found.
     */
    getPageTitle(): string | null;
    /**
     * Returns the page URL for this folder using the value in
     * the current locale, or returns null if no value was found.
     */
    getPageURL(): string | null;
    /**
     * Returns the parent folder of this folder.
     */
    getParent(): Folder;
    /**
     * Returns the folder's sitemap change frequency.
     */
    getSiteMapChangeFrequency(): string;
    /**
     * Returns the folder's sitemap inclusion.
     */
    getSiteMapIncluded(): number;
    /**
     * Returns the folder's sitemap priority.
     */
    getSiteMapPriority(): number;
    /**
     * Returns the subfolders of this folder, sorted by position.
     */
    getSubFolders(): Collection<Folder>;
    /**
     * Returns the name of the template used to render the folder
     * in the store front.
     */
    getTemplate(): string;
    /**
     * Indicates if the folder is set online or
     * offline. Initially, all folders are set online.
     */
    isOnline(): boolean;
    /**
     * Indicates if this is the root folder.
     */
    isRoot(): boolean;
}

export = Folder;
