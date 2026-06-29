import SearchModel = require('../catalog/SearchModel');
import URL = require('../web/URL');
import SearchStatus = require('../system/SearchStatus');
import utilIterator = require('../util/Iterator');
import Folder = require('./Folder');
import ContentSearchRefinements = require('./ContentSearchRefinements');
import PageMetaTag = require('../web/PageMetaTag');

/**
 * The class is the central interface to a content search result and a content
 * search refinement. It also provides utility methods to generate a search URL.
 */
declare class ContentSearchModel extends SearchModel {
    /**
     * URL Parameter for the content ID
     */
    static readonly CONTENTID_PARAMETER = "cid";
    /**
     * URL Parameter for the folder ID
     */
    static readonly FOLDERID_PARAMETER = "fdid";
    /**
     * Returns an Iterator containing all Content Assets that are the result of the
     * search.
     */
    readonly content: utilIterator<any>;
    /**
     * Returns the content ID against which the search results apply.
     */
    contentID: string;
    /**
     * Returns the deepest common folder of all content assets in the search result.
     */
    readonly deepestCommonFolder: Folder;
    /**
     * The method returns true, if the content search result is filtered by the folder and it is not subsequently
     * possible to search for content assets that belong to no folder (e.g. those for Page Designer).
     */
    filteredByFolder: boolean;
    /**
     * Returns the folder against which the search results apply.
     */
    readonly folder: Folder;
    /**
     * Returns the folder ID against which the search results apply.
     */
    folderID: string;
    /**
     * The method returns true, if this is a pure search for a folder. The
     * method checks, that a folder ID is specified and no search phrase is
     * specified.
     */
    readonly folderSearch: boolean;
    /**
     * Returns all page meta tags, defined for this instance for which content can be generated.
     * 
     * The meta tag content is generated based on the content listing page meta tag context and rules.
     * The rules are obtained from the current folder context or inherited from the parent folder,
     * up to the root folder.
     */
    readonly pageMetaTags: Array<PageMetaTag>;
    /**
     * Get the flag that determines if the folder search will
     * be recursive.
     */
    recursiveFolderSearch: boolean;
    /**
     * The method returns true, if the search is refined by a folder.
     * The method checks, that a folder ID is specified.
     */
    readonly refinedByFolder: boolean;
    /**
     * Identifies if this is a folder search and is refined with further
     * criteria, like a name refinement or an attribute refinement.
     */
    readonly refinedFolderSearch: boolean;
    /**
     * Returns the set of search refinements used in this search.
     */
    readonly refinements: ContentSearchRefinements;
    /**
     * Constructs a new ContentSearchModel.
     */
    constructor();
    /**
     * Returns an URL that you can use to execute a query for a specific
     * Content. The passed action is used to build an initial url. All search
     * specific attributes are appended.
     */
    static urlForContent(action: string, cid: string): URL;
    /**
     * Returns an URL that you can use to execute a query for a specific
     * Content. The passed url can be either a full url or just the name for a
     * pipeline. In the later case a relative URL is created.
     */
    static urlForContent(url: URL, cid: string): URL;
    /**
     * Returns an URL that you can use to execute a query for a specific
     * Folder.
     */
    static urlForFolder(action: string, fid: string): URL;
    /**
     * Returns an URL that you can use to execute a query for a specific
     * Folder.
     */
    static urlForFolder(url: URL, fid: string): URL;
    /**
     * Returns an URL that you can use to execute a query for a specific
     * attribute name-value pair.
     */
    static urlForRefine(action: string, name: string, value: string): URL;
    /**
     * Returns an URL that you can use to execute a query for a specific
     * attribute name-value pair.
     */
    static urlForRefine(url: URL, name: string, value: string): URL;
    /**
     * Returns an Iterator containing all Content Assets that are the result of the
     * search.
     */
    getContent(): utilIterator<any>;
    /**
     * Returns the content ID against which the search results apply.
     */
    getContentID(): string;
    /**
     * Returns the deepest common folder of all content assets in the search result.
     */
    getDeepestCommonFolder(): Folder;
    /**
     * Returns the folder against which the search results apply.
     */
    getFolder(): Folder;
    /**
     * Returns the folder ID against which the search results apply.
     */
    getFolderID(): string;
    /**
     * Returns the page meta tag for the specified id.
     * 
     * The meta tag content is generated based on the content listing page meta tag context and rule.
     * The rule is obtained from the current folder context or inherited from the parent folder,
     * up to the root folder.
     * 
     * Null will be returned if the meta tag is undefined on the current instance, or if no rule can be found for the
     * current context, or if the rule resolves to an empty string.
     */
    getPageMetaTag(id: string): PageMetaTag | null;
    /**
     * Returns all page meta tags, defined for this instance for which content can be generated.
     * 
     * The meta tag content is generated based on the content listing page meta tag context and rules.
     * The rules are obtained from the current folder context or inherited from the parent folder,
     * up to the root folder.
     */
    getPageMetaTags(): Array<PageMetaTag>;
    /**
     * Returns the set of search refinements used in this search.
     */
    getRefinements(): ContentSearchRefinements;
    /**
     * The method returns true, if the content search result is filtered by the folder and it is not subsequently
     * possible to search for content assets that belong to no folder (e.g. those for Page Designer).
     */
    isFilteredByFolder(): boolean;
    /**
     * The method returns true, if this is a pure search for a folder. The
     * method checks, that a folder ID is specified and no search phrase is
     * specified.
     */
    isFolderSearch(): boolean;
    /**
     * Get the flag that determines if the folder search will
     * be recursive.
     */
    isRecursiveFolderSearch(): boolean;
    /**
     * The method returns true, if the search is refined by a folder.
     * The method checks, that a folder ID is specified.
     */
    isRefinedByFolder(): boolean;
    /**
     * Identifies if this is a folder search and is refined with further
     * criteria, like a name refinement or an attribute refinement.
     */
    isRefinedFolderSearch(): boolean;
    /**
     * Execute the search.
     */
    search(): SearchStatus;
    /**
     * Sets the contentID used in this search.
     */
    setContentID(contentID: string): void;
    /**
     * Set a flag to indicate if the search is filtered by the folder. Must be set to false to return content assets that
     * do not belong to any folder.
     */
    setFilteredByFolder(filteredByFolder: boolean): void;
    /**
     * Sets the folderID used in this search.
     */
    setFolderID(folderID: string): void;
    /**
     * Set a flag to indicate if the search in folder should be recursive.
     */
    setRecursiveFolderSearch(recurse: boolean): void;
    /**
     * Returns an URL that you can use to re-execute the query using the
     * specified pipeline action and folder refinement.
     */
    urlRefineFolder(action: string, refineFolderID: string): URL;
    /**
     * Returns an URL that you can use to re-execute the query using the
     * specified URL and folder refinement.
     */
    urlRefineFolder(url: URL, refineFolderID: string): URL;
    /**
     * Returns an URL that you can use to re-execute the query with no folder
     * refinement.
     */
    urlRelaxFolder(action: string): URL;
    /**
     * Returns an URL that you can use to re-execute the query with no folder
     * refinement.
     */
    urlRelaxFolder(url: URL): URL;
}

export = ContentSearchModel;
