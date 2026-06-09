/**
 * The Cache class represents a custom cache.
 * 
 * A cache stores data over multiple requests. Each cartridge can define its own
 * caches for different business requirements. To limit the
 * visibility of cache entries by scope, for example, by site, catalog, or
 * external system, include the scope reference when constructing the
 * key. For example:
 * 
 * ```
 * var cache = CacheMgr.getCache( 'SiteConfigurations' );
 * cache.get( Site.current.ID + "config", function loadSiteConfiguration() {return loadCfg( Site.current );} );
 * ```
 * 
 * Do not build the cache key using personal user data, since the key might be
 * visible in log messages.
 * 
 * There is never a guarantee that a stored object can be retrieved from the
 * cache. The storage allocated for entries is limited and clearing or
 * invalidation might occur at any time. To maintain the cache size limits, the
 * cache evicts entries that are less likely to be used again. For example, the
 * cache might evict an entry because it hasn't been used recently or very
 * often. Cache entries aren't synchronized between different application
 * servers.
 * 
 * The cache returns immutable copies of the original objects put into the
 * cache. Lists are converted to arrays during this process. Only JavaScript
 * primitive values and tree-like object structures can be stored as entries.
 * Object structures can consist of arrays, lists, and basic JavaScript
 * objects. Script API classes are not supported, except dw.util.List
 * and its subclasses. `null` can be stored as a value.
 * `undefined` can't be stored.
 * 
 * See CacheMgr for details about how to configure a custom cache.
 */
declare class Cache {
    private constructor();
    /**
     * Returns the value associated with key in this cache, or invokes the loader function to generate the entry if
     * there is no entry found. The generated entry is stored for future retrieval. If the loader function returns
     * `undefined`, this value is not stored in the cache.
     */
    get(key: string, loader: Function): any;
    /**
     * Returns the value associated with key in this cache. If there is no entry in the cache then
     * `undefined` is returned.
     */
    get(key: string): any;
    /**
     * Removes the cache entry for key (if one exists) manually before the cache's eviction strategy goes into effect.
     */
    invalidate(key: string): void;
    /**
     * Stores the specified entry directly into the cache, replacing any previously cached entry for key if one exists.
     * Storing `undefined` as value has the same effect as calling invalidate for that key.
     */
    put(key: string, value: any): void;
}

export = Cache;
