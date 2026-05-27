import SearchRefinements = require('../catalog/SearchRefinements');
import Collection = require('../util/Collection');
import Folder = require('./Folder');
import ContentSearchRefinementDefinition = require('./ContentSearchRefinementDefinition');
import SearchRefinementValue = require('../catalog/SearchRefinementValue');
import ContentSearchRefinementValue = require('./ContentSearchRefinementValue');

/**
 * This class provides an interface to refinement options for the content asset
 * search. In a typical usage, the client application UI displays the search
 * refinements along with the search results and allows customers to "refine"
 * the results (i.e. limit the results that are shown) by specifying additional
 * criteria, or "relax" (i.e. broaden) the results after previously refining.
 * The two types of content search refinements are:
 * 
 * - Refine By Folder: Limit the content assets to those assigned to
 * specific child/ancestor folder of the search folder.
 * - Refine By Attribute: Limit the content assets to those with
 * specific values for a given attribute. Values may be grouped into "buckets"
 * so that a given set of values are represented as a single refinement option.
 * 
 * Rendering a content search refinement UI typically begins with iterating the
 * refinement definitions for the search result. Call
 * dw.catalog.SearchRefinements.getRefinementDefinitions or
 * dw.catalog.SearchRefinements.getAllRefinementDefinitions to
 * retrieve the appropriate collection of refinement definitions. For each
 * definition, display the available refinement values by calling
 * getAllRefinementValues. Depending
 * on the type of the refinement definition, the application must use slightly
 * different logic to display the refinement widgets. For all 2 types, methods
 * in dw.content.ContentSearchModel are used to generate URLs to render
 * hyperlinks in the UI. When clicked, these links trigger a call to the Search
 * pipelet which in turn applies the appropriate filters to the native search
 * result.
 */
declare class ContentSearchRefinements extends SearchRefinements {
    /**
     * Returns the appropriate folder refinement definition based on the search
     * result. The folder refinement definition returned will be the first that
     * can be found traversing the folder tree upward starting at the deepest
     * common folder of the search result.
     */
    readonly folderRefinementDefinition: ContentSearchRefinementDefinition | null;
    /**
     * Returns a collection of matching folders.
     */
    readonly matchingFolders: Collection<Folder>;
    private constructor();
    getAllRefinementValues(attributeName: string): Collection<SearchRefinementValue> | null;
    getAllRefinementValues(attributeName: string, sortMode: number, sortDirection: number): Collection<SearchRefinementValue>;
    /**
     * Returns a sorted collection of refinement values for the given refinement
     * definition. The returned collection includes all refinement values for
     * which the hit count is greater than 0 within the search result when the
     * passed refinement definitions is excluded from filtering the search hits
     * but all other refinement filters are still applied. This is useful for
     * rendering broadening options for the refinement definitions that the
     * search is already refined by. It is important to note that this method
     * does NOT return refinement values independent of the search result.
     */
    getAllRefinementValues(definition: ContentSearchRefinementDefinition): Collection<SearchRefinementValue>;
    /**
     * Returns the number of search hits for the passed folder object.
     */
    getFolderHits(folder: Folder): number;
    /**
     * Returns the appropriate folder refinement definition based on the search
     * result. The folder refinement definition returned will be the first that
     * can be found traversing the folder tree upward starting at the deepest
     * common folder of the search result.
     */
    getFolderRefinementDefinition(): ContentSearchRefinementDefinition | null;
    /**
     * Returns a collection of matching folders.
     */
    getMatchingFolders(): Collection<Folder>;
    /**
     * Returns folder refinement values based on the current search result
     * filtered such that only folder refinements representing children of the
     * given folder are present. If no folder is given, the method uses the
     * library's root folder. The refinement value content counts represent all
     * hits contained in the library tree starting at the corresponding child
     * folder.
     */
    getNextLevelFolderRefinementValues(folder: Folder): Collection<SearchRefinementValue>;
    /**
     * Returns the refinement value (incl. content hit count) for the given
     * refinement definition and the given (selected) value.
     */
    getRefinementValue(definition: ContentSearchRefinementDefinition, value: string): ContentSearchRefinementValue;
    /**
     * Returns the refinement value (incl. content hit count) for the given
     * attribute refinement and the given (selected) value.
     */
    getRefinementValue(name: string, value: string): ContentSearchRefinementValue;
    getRefinementValues(attributeName: string, sortMode: number, sortDirection: number): Collection<SearchRefinementValue>;
    /**
     * Returns a collection of refinement values for the given refinement
     * definition. The returned refinement values only include those that are
     * part of the actual search result (i.e. hit count will always be > 0).
     */
    getRefinementValues(definition: ContentSearchRefinementDefinition): Collection<SearchRefinementValue>;
}

export = ContentSearchRefinements;
