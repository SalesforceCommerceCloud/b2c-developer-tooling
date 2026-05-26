import Collection = require('../util/Collection');
import SearchRefinementDefinition = require('./SearchRefinementDefinition');
import SearchRefinementValue = require('./SearchRefinementValue');

/**
 * Common search refinements base class.
 */
declare abstract class SearchRefinements {
    /**
     * Flag for an ascending sort.
     */
    static readonly ASCENDING: number;
    /**
     * Flag for a descending sort.
     */
    static readonly DESCENDING: number;
    /**
     * Flag for sorting on value count.
     */
    static readonly SORT_VALUE_COUNT: number;
    /**
     * Flag for sorting on value name.
     */
    static readonly SORT_VALUE_NAME: number;
    /**
     * Returns a sorted list of refinement definitions that are appropriate for
     * the deepest common category (or deepest common folder) of the search
     * result. The method concatenates the sorted refinement definitions per
     * category starting at the root category until reaching the deepest common
     * category.
     * 
     * The method does not filter out refinement definitions that do
     * not provide values for the current search result and can therefore also
     * be used on empty search results.
     */
    readonly allRefinementDefinitions: Collection<SearchRefinementDefinition<any>>;
    /**
     * Returns a sorted list of refinement definitions that are appropriate for
     * the deepest common category (or deepest common folder) of the search
     * result. The method concatenates the sorted refinement definitions per category
     * starting at the root category until reaching the deepest common category.
     * 
     * The method also filters out refinement definitions that do not provide
     * any values for the current search result.
     */
    readonly refinementDefinitions: Collection<SearchRefinementDefinition<any>>;
    /**
     * Returns a sorted list of refinement definitions that are appropriate for
     * the deepest common category (or deepest common folder) of the search
     * result. The method concatenates the sorted refinement definitions per
     * category starting at the root category until reaching the deepest common
     * category.
     * 
     * The method does not filter out refinement definitions that do
     * not provide values for the current search result and can therefore also
     * be used on empty search results.
     */
    getAllRefinementDefinitions(): Collection<SearchRefinementDefinition<any>>;
    /**
     * Returns a sorted collection of refinement values for the given refinement
     * attribute. The returned collection includes all refinement values for
     * which the hit count is greater than 0 within the search result when the
     * passed attribute is excluded from filtering the search hits but all other
     * refinement filters are still applied. This method is useful for rendering
     * broadening options for attributes that the search is currently refined
     * by. This method does NOT return refinement values independent of the
     * search result.
     * 
     * For product search refinements, this method may return slightly different
     * results based on the "value set" property of the refinement definition.
     * See
     * dw.catalog.ProductSearchRefinements.getAllRefinementValues
     * for details.
     */
    getAllRefinementValues(attributeName: string): Collection<SearchRefinementValue> | null;
    /**
     * Returns a sorted collection of refinement values for the given refinement
     * attribute. In general, the returned collection includes all refinement
     * values for which hit count is greater than 0 within the search result
     * assuming that:
     * 
     * - The passed refinement attribute is NOT used to filter the search
     * hits.
     * - All other refinements are still applied.
     * 
     * This is useful for rendering broadening options for the refinement
     * definitions that the search is already refined by. It is important to
     * note that this method does NOT return refinement values independent of
     * the search result.
     * 
     * For product search refinements, this method may return slightly different
     * results based on the "value set" of the refinement definition. See
     * dw.catalog.ProductSearchRefinements.getAllRefinementValues
     * for details.
     */
    getAllRefinementValues(attributeName: string, sortMode: number, sortDirection: number): Collection<SearchRefinementValue>;
    /**
     * Returns a sorted list of refinement definitions that are appropriate for
     * the deepest common category (or deepest common folder) of the search
     * result. The method concatenates the sorted refinement definitions per category
     * starting at the root category until reaching the deepest common category.
     * 
     * The method also filters out refinement definitions that do not provide
     * any values for the current search result.
     */
    getRefinementDefinitions(): Collection<SearchRefinementDefinition<any>>;
    /**
     * Returns a collection of refinement values for the given refinement
     * attribute, sorting mode and sorting direction.
     */
    getRefinementValues(attributeName: string, sortMode: number, sortDirection: number): Collection<SearchRefinementValue>;
}

export = SearchRefinements;
