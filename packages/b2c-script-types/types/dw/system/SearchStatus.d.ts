/**
 * A SearchStatus is used for communicating a Search API status back to a client. A status consists of status code and
 * description. More information about search API call can be fetched by using SearchStatus class method getStatusCode
 * and getDescription, which can be used by clients to perform different operations.
 */
declare class SearchStatus {
    /**
     * EMPTY_QUERY search result status code 6, this indicates that search has been made with empty query.
     */
    static readonly EMPTY_QUERY: number;
    /**
     * ERROR search result status code 9, this indicates that internal server error has been occurred.
     */
    static readonly ERROR: number;
    /**
     * LIMITED search result status code 2, this indicates that limitations on search result have been applied and
     * full search result is not returned.
     */
    static readonly LIMITED: number;
    /**
     * NOT_EXECUTED search result status code 0, this indicates that search API call has not been made on SearchModel.
     */
    static readonly NOT_EXECUTED: number;
    /**
     * NO_CATALOG search result status code 4, this indicates that there is no catalog associated for search query.
     */
    static readonly NO_CATALOG: number;
    /**
     * NO_CATEGORY search result status code 5, this indicates that there is no category associated for search query.
     */
    static readonly NO_CATEGORY: number;
    /**
     * NO_INDEX search result status code 8, this indicates that there is no active search index available.
     */
    static readonly NO_INDEX: number;
    /**
     * OFFLINE_CATEGORY search result status code 7, this indicates that the category associated with search query
     * is offline.
     */
    static readonly OFFLINE_CATEGORY: number;
    /**
     * ROOT_SEARCH search result status code 3, this indicates that search result is returned for ROOT search.
     */
    static readonly ROOT_SEARCH: number;
    /**
     * SUCCESSFUL search result status code 1, this indicates that search API call is executed without any issue.
     */
    static readonly SUCCESSFUL: number;
    /**
     * Returns status code description of search result, it provides more details about search API call status.
     */
    readonly description: string;
    /**
     * Returns status code of search result, by default it will return 0 which means that search has not been executed
     * on SearchModel.
     */
    readonly statusCode: number;
    private constructor();
    /**
     * Returns status code description of search result, it provides more details about search API call status.
     */
    getDescription(): string;
    /**
     * Returns status code of search result, by default it will return 0 which means that search has not been executed
     * on SearchModel.
     */
    getStatusCode(): number;
    /**
     * Returns string values of status code and description.
     */
    toString(): string;
}

export = SearchStatus;
