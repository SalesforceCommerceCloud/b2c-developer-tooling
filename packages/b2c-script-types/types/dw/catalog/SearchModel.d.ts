import Collection = require('../util/Collection');
import SearchRefinementValue = require('./SearchRefinementValue');
import SearchStatus = require('../system/SearchStatus');
import URL = require('../web/URL');
import URLRedirect = require('../web/URLRedirect');

/**
 * Common search model base class.
 */
declare abstract class SearchModel {
    /**
     * URL Parameter for the Search Phrase
     */
    static readonly SEARCH_PHRASE_PARAMETER = "q";
    /**
     * Sorting parameter ASCENDING
     */
    static readonly SORT_DIRECTION_ASCENDING = 1;
    /**
     * Sorting parameter DESCENDING
     */
    static readonly SORT_DIRECTION_DESCENDING = 2;
    /**
     * Sorting parameter NO_SORT - will remove a sorting condition
     */
    static readonly SORT_DIRECTION_NONE = 0;
    /**
     * Returns the number of search results found by this search.
     */
    readonly count: number;
    /**
     * Identifies if the query is emtpy when no search term, search parameter or
     * refinement was specified for the search. In case also no result is
     * returned. This "empty" is different to a query with a specified query and
     * with an empty result.
     */
    readonly emptyQuery: boolean;
    /**
     * The method returns true, if this search is refined by at least one
     * attribute.
     */
    readonly refinedByAttribute: boolean;
    /**
     * Identifies if this was a refined search. A search is a refined search if
     * at least one refinement is part of the query.
     */
    readonly refinedSearch: boolean;
    /**
     * Returns the search phrase used in this search.
     */
    searchPhrase: string;
    /**
     * Returns an URLRedirect object for a search phrase.
     */
    static getSearchRedirect(searchPhrase: string): URLRedirect;
    /**
     * Adds a refinement. The method can be called to add an additional query
     * parameter specified as name-value pair. The values string may encode
     * multiple values delimited by the pipe symbol ('|').
     */
    addRefinementValues(attributeID: string, values: string): void;
    /**
     * Identifies if the search can be relaxed without creating a search for all
     * searchable items.
     */
    canRelax(): boolean;
    /**
     * Returns the number of search results found by this search.
     */
    getCount(): number;
    /**
     * Returns the maximum refinement value selected in the query for the specific
     * attribute, or null if there is no maximum refinement value or no refinement for that attribute.
     */
    getRefinementMaxValue(attributeID: string): string | null;
    /**
     * Returns the minimum refinement value selected in the query for the specific
     * attribute, or null if there is no minimum refinement value or no refinement for that attribute.
     */
    getRefinementMinValue(attributeID: string): string | null;
    /**
     * Returns the refinement value selected in the query for the specific
     * attribute, or null if there is no refinement for that attribute.
     * @deprecated Use getRefinementValues to get the
     * collection of refinement values.
     */
    getRefinementValue(attributeID: string): string | null;
    /**
     * Returns the list of selected refinement values for the given attribute as
     * used in the search.
     */
    getRefinementValues(attributeID: string): Collection<SearchRefinementValue>;
    /**
     * Returns the search phrase used in this search.
     */
    getSearchPhrase(): string;
    /**
     * Returns the sorting condition for a given attribute name. A value of 0
     * indicates that no sorting condition is set.
     */
    getSortingCondition(attributeID: string): number;
    /**
     * Identifies if the query is emtpy when no search term, search parameter or
     * refinement was specified for the search. In case also no result is
     * returned. This "empty" is different to a query with a specified query and
     * with an empty result.
     */
    isEmptyQuery(): boolean;
    /**
     * Identifies if this search has been refined on the given attribute.
     */
    isRefinedByAttribute(attributeID: string): boolean;
    /**
     * The method returns true, if this search is refined by at least one
     * attribute.
     */
    isRefinedByAttribute(): boolean;
    /**
     * Identifies if this search has been refined on the given attribute and
     * value.
     */
    isRefinedByAttributeValue(attributeID: string, value: string): boolean;
    /**
     * Identifies if this was a refined search. A search is a refined search if
     * at least one refinement is part of the query.
     */
    isRefinedSearch(): boolean;
    /**
     * Identifies if this search has been refined on the given attribute.
     */
    isRefinementByValueRange(attributeID: string): boolean;
    /**
     * Identifies if this search has been refined on the given attribute and range values.
     */
    isRefinementByValueRange(attributeID: string, minValue: string, maxValue: string): boolean;
    /**
     * Removes a refinement. The method can be called to remove previously added
     * refinement values. The values string may encode multiple values delimited
     * by the pipe symbol ('|').
     */
    removeRefinementValues(attributeID: string, values: string | null): void;
    /**
     * Execute the search.
     */
    search(): SearchStatus;
    /**
     * Sets a refinement value range for an attribute. The method can be called to set
     * an additional range query parameter specified as name-range-value pair. The values
     * string can contain only a range boundary.
     * Existing refinement values for the attribute will be removed.
     */
    setRefinementValueRange(attributeID: string, minValue: string | null, maxValue: string | null): void;
    /**
     * Sets refinement values for an attribute. The method can be called to set
     * an additional query parameter specified as name-value pair. The value
     * string may encode multiple values delimited by the pipe symbol ('|').
     * Existing refinement values for the attribute will be removed.
     */
    setRefinementValues(attributeID: string, values: string | null): void;
    /**
     * Sets the search phrase used in this search. The search query parser uses
     * the following operators:
     * 
     * - PHRASE operator (""), e.g. "cream cheese", "John Lennon"
     * - NOT operator (-), e.g. -cargo (will not return results containing
     * "cargo")
     * - WILDCARD operator (*), e.g. sho* (will return results containing
     * "shoulder", "shoes" and "shoot")
     */
    setSearchPhrase(phrase: string): void;
    /**
     * Sets or removes a sorting condition for the specified attribute. Specify
     * either SORT_DIRECTION_ASCENDING or SORT_DIRECTION_DESCENDING to set a
     * sorting condition. Specify SORT_DIRECTION_NONE to remove a sorting
     * condition from the attribute.
     */
    setSortingCondition(attributeID: string, direction: number): void;
    /**
     * Constructs an URL that you can use to re-execute the exact same query.
     * The provided parameter must be an action, e.g. 'Search-Show'.
     */
    url(action: string): URL;
    /**
     * Constructs an URL that you can use to re-execute the exact same query.
     * The search specific parameter are appended to the provided URL. The URL
     * is typically generated with one of the URLUtils methods.
     */
    url(url: URL): URL;
    /**
     * Constructs an URL that you can use to re-execute the query with a default
     * sorting. The provided parameter must be an action, e.g. 'Search-Show'.
     */
    urlDefaultSort(url: string): URL;
    /**
     * Constructs an URL that you can use to re-execute the query with a default
     * sorting. The search specific parameters are appended to the provided URL.
     * The URL is typically generated with one of the URLUtils methods.
     */
    urlDefaultSort(url: URL): URL;
    /**
     * Constructs an URL that you can use to re-execute the query with an
     * additional refinement.
     */
    urlRefineAttribute(action: string, attributeID: string, value: string): URL;
    /**
     * Constructs an URL that you can use to re-execute the query with an
     * additional refinement. The search specific parameters are appended to the
     * provided URL. The URL is typically generated with one of the URLUtils
     * methods.
     */
    urlRefineAttribute(url: URL, attributeID: string, value: string): URL;
    /**
     * Constructs an URL that you can use to re-execute the query with an
     * additional refinement value for a given refinement attribute. The
     * provided value will be added to the set of allowed values for the
     * refinement attribute. This basically broadens the search result.
     */
    urlRefineAttributeValue(action: string, attributeID: string, value: string): URL;
    /**
     * Constructs an URL that you can use to re-execute the query with an
     * additional refinement value for a given refinement attribute. The
     * provided value will be added to the set of allowed values for the
     * refinement attribute. This basically broadens the search result.
     * 
     * The search specific parameters are appended to the provided URL. The URL
     * is typically generated with one of the URLUtils methods.
     */
    urlRefineAttributeValue(url: URL, attributeID: string, value: string): URL;
    /**
     * Constructs an URL that you can use to re-execute the query with an additional refinement value range for a given refinement attribute. The
     * provided value range will be replace to the existing value range for the refinement attribute.
     * 
     * The search specific parameters are appended to the provided URL. The URL is typically generated with one of the URLUtils methods.
     */
    urlRefineAttributeValueRange(action: string, attributeID: string, minValue: string, maxValue: string): URL;
    /**
     * Constructs an URL that you can use to re-execute the query without the
     * specified refinement. The value for the action parameter must be a
     * pipeline action, e.g. 'Search-Show'.
     */
    urlRelaxAttribute(action: string, attributeID: string): URL;
    /**
     * Constructs an URL that you can use to re-execute the query without the
     * specified refinement. The search specific parameters are appended to the
     * provided URL. The URL is typically generated with one of the URLUtils
     * methods.
     */
    urlRelaxAttribute(url: URL, attributeID: string): URL;
    /**
     * Constructs an URL that you can use to re-execute the query without the
     * specified refinement. The value for the action parameter must be a
     * pipeline action, e.g. 'Search-Show'.
     */
    urlRelaxAttributeValue(action: string, attributeID: string, value: string): URL;
    /**
     * Constructs an URL that you can use to re-execute the query without the
     * specified refinement value. The search specific parameters are appended
     * to the provided URL. The URL is typically generated with one of the
     * URLUtils methods.
     */
    urlRelaxAttributeValue(url: URL, attributeID: string, value: string): URL;
    /**
     * Constructs an URL that you can use to re-execute the query with a
     * specific sorting criteria. This criteria will overwrite all previous sort
     * critiria. The provided parameter must be an action, e.g. 'Search-Show'.
     */
    urlSort(action: string, sortBy: string, sortDir: number): URL;
    /**
     * Constructs an URL that you can use to re-execute the query with a
     * specific sorting criteria. This criteria will overwrite all previous sort
     * critiria. The search specific parameters are appended to the provided
     * URL. The URL is typically generated with one of the URLUtils methods.
     */
    urlSort(url: URL, sortBy: string, sortDir: number): URL;
}

export = SearchModel;
