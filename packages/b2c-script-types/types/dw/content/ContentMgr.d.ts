import Folder = require('./Folder');
import Library = require('./Library');
import Content = require('./Content');

/**
 * Provides helper methods for getting content assets, library folders and the
 * content library of the current site.
 */
declare class ContentMgr {
    /**
     * The input string to identify that the library is a private site library when invoking getLibrary.
     */
    static readonly PRIVATE_LIBRARY = "PrivateLibrary";
    /**
     * Returns the content library of the current site.
     */
    static readonly siteLibrary: Library | null;
    private constructor();
    /**
     * Returns the content with the corresponding identifier within the current
     * site's site library.
     */
    static getContent(id: string): Content | null;
    /**
     * Returns the content with the corresponding identifier within the specified library.
     */
    static getContent(library: Library, id: string): Content | null;
    /**
     * Returns the folder identified by the specified id within the current
     * site's site library.
     */
    static getFolder(id: string): Folder | null;
    /**
     * Returns the folder identified by the specified id within the specified library.
     */
    static getFolder(library: Library, id: string): Folder | null;
    /**
     * Returns the content library specified by the given id. If PRIVATE_LIBRARY is used, then the current
     * site's private library will be returned.
     */
    static getLibrary(libraryId: string): Library | null;
    /**
     * Returns the content library of the current site.
     */
    static getSiteLibrary(): Library | null;
}

export = ContentMgr;
