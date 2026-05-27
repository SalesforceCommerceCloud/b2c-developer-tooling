import utilIterator = require('../util/Iterator');
import Collection = require('../util/Collection');
import URL = require('./URL');

/**
 * A page model is a helper class to apply a pages to a collection of
 * elements or an iterator of elements and supports creating URLs for
 * continued paging through the elements.
 * 
 * The page model is intended to be initialized with the collection or
 * iterator, than the paging position is applyed and than the elements are
 * extracted with getPageElements().
 * 
 * In case the page model is initialized with a collection the page model
 * can be reused multiple times.
 */
declare class PagingModel {
    /**
     * The default page size.
     */
    static readonly DEFAULT_PAGE_SIZE = 10;
    /**
     * The maximum supported page size.
     */
    static readonly MAX_PAGE_SIZE = 2000;
    /**
     * The URL Parameter used for the page size.
     */
    static readonly PAGING_SIZE_PARAMETER = "sz";
    /**
     * The URL parameter used for the start position.
     */
    static readonly PAGING_START_PARAMETER = "start";
    /**
     * Returns the count of the number of items in the model.
     */
    readonly count: number;
    /**
     * Returns the index number of the current page. The page
     * counting starts with 0. The method also works with a miss-aligned
     * start. In that case the start is always treated as the start of
     * a page.
     */
    readonly currentPage: number;
    /**
     * Identifies if the model is empty.
     */
    readonly empty: boolean;
    /**
     * Returns the index of the last element on the current page.
     */
    readonly end: number;
    /**
     * Returns the maximum possible page number. Counting for pages starts
     * with 0.  The method also works with a miss-aligned start. In that case
     * the returned number might be higher than ((count-1) / pageSize).
     */
    readonly maxPage: number;
    /**
     * Returns the total page count. The method also works
     * with a miss-aligned start. In that case the returned number might
     * be higher than (count / pageSize).
     */
    readonly pageCount: number;
    /**
     * Returns an iterator that can be used to iterate through the elements of
     * the current page.
     * 
     * In case of a collection as the page models source, the method can be
     * called multiple times. Each time a fresh iterator is returned.
     * 
     * In case of an iterator as the page models source, the method must be
     * called only once. The method will always return the same iterator,
     * which means the method amy return an exhausted iterator.
     */
    readonly pageElements: utilIterator<any>;
    /**
     * Returns the size of the page.
     */
    pageSize: number;
    /**
     * Returns the current start position from which iteration will start.
     */
    start: number;
    /**
     * Constructs the PagingModel using the specified iterator and count value.
     * Count must not be negative.
     * 
     * Note: A valid count must be provided. The PageModel class can not be used
     * if the number of elements is unknown. Without knowning the number of
     * elements it still would be possible to return the elements of a particular
     * page, but it would be not possible to calculate data like the total number
     * of pages or to construct an URL to jump to a particular page.
     */
    constructor(elements: utilIterator<any>, count: number);
    /**
     * Constructs the PagingModel using the specified collection.
     */
    constructor(elements: Collection<any>);
    /**
     * Returns an URL containing the page size parameter appended to the
     * specified url. The name of the page size parameter is 'sz' (see
     * PAGE_SIZE_PARAMETER). The start position parameter is not appended to the
     * returned URL.
     */
    static appendPageSize(url: URL, pageSize: number): URL;
    /**
     * Returns an URL by appending the current page start position and the
     * current page size to the URL.
     */
    appendPaging(url: URL): URL;
    /**
     * Returns an URL by appending the paging parameters for a desired
     * page start position and the current page size to the specified url. The name of
     * the page start position parameter is 'start' (see PAGING_START_PARAMETER)
     * and the page size parameter is 'sz' (see PAGE_SIZE_PARAMETER).
     */
    appendPaging(url: URL, position: number): URL;
    /**
     * Returns the count of the number of items in the model.
     */
    getCount(): number;
    /**
     * Returns the index number of the current page. The page
     * counting starts with 0. The method also works with a miss-aligned
     * start. In that case the start is always treated as the start of
     * a page.
     */
    getCurrentPage(): number;
    /**
     * Returns the index of the last element on the current page.
     */
    getEnd(): number;
    /**
     * Returns the maximum possible page number. Counting for pages starts
     * with 0.  The method also works with a miss-aligned start. In that case
     * the returned number might be higher than ((count-1) / pageSize).
     */
    getMaxPage(): number;
    /**
     * Returns the total page count. The method also works
     * with a miss-aligned start. In that case the returned number might
     * be higher than (count / pageSize).
     */
    getPageCount(): number;
    /**
     * Returns an iterator that can be used to iterate through the elements of
     * the current page.
     * 
     * In case of a collection as the page models source, the method can be
     * called multiple times. Each time a fresh iterator is returned.
     * 
     * In case of an iterator as the page models source, the method must be
     * called only once. The method will always return the same iterator,
     * which means the method amy return an exhausted iterator.
     */
    getPageElements(): utilIterator<any>;
    /**
     * Returns the size of the page.
     */
    getPageSize(): number;
    /**
     * Returns the current start position from which iteration will start.
     */
    getStart(): number;
    /**
     * Identifies if the model is empty.
     */
    isEmpty(): boolean;
    /**
     * Sets the size of the page. The page size must be greater or
     * equal to 1.
     */
    setPageSize(pageSize: number): void;
    /**
     * Sets the current start position from which iteration will start.
     */
    setStart(start: number): void;
}

export = PagingModel;
