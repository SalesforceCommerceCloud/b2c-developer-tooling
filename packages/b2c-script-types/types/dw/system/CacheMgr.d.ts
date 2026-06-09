import Cache = require('./Cache');

/**
 * The CacheMgr class is the entry point for using custom caches.
 * 
 * The CacheMgr can manage multiple custom caches that share one storage space. Each individual cache has a unique ID
 * and an optional expiration time that specifies the maximum time (in seconds) an entry is stored in the cache. For
 * registering caches inside the cartridge root folder, a 'package.json' file with a 'caches' entry must exist. The
 * registration of caches is independent of any site context.
 * 
 * ```
 * "caches": "./caches.json"
 * ```
 * 
 * The caches entry links to a JSON file, with a path relative to the 'package.json' file. This file lists all
 * registered caches inside the caches property:
 * @example
 * {
 * "caches": [
 * {
 * "id": "UnlimitedTestCache"
 * },
 * {
 * "id": "TestCacheWithExpiration",
 * "expireAfterSeconds": 10
 * }
 * ]
 * }
 */
declare class CacheMgr {
    private constructor();
    /**
     * Returns the defined cache instance for the given ID. Throws an exception when the requested cache has not been
     * defined in any caches.json descriptor.
     */
    static getCache(cacheID: string): Cache;
}

export = CacheMgr;
