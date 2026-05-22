import Store = require('./Store');
import LinkedHashMap = require('../util/LinkedHashMap');
import StoreGroup = require('./StoreGroup');
import Collection = require('../util/Collection');

/**
 * Provides helper methods for getting stores based on id and querying for
 * stores based on geolocation.
 */
declare class StoreMgr {
    /**
     * Returns all the store groups of the current site.
     */
    static readonly allStoreGroups: Collection<StoreGroup>;
    /**
     * Get the store id associated with the current session. By default, the session store id is null.
     */
    static readonly storeIDFromSession: string | null;
    private constructor();
    /**
     * Returns all the store groups of the current site.
     */
    static getAllStoreGroups(): Collection<StoreGroup>;
    /**
     * Returns the store object with the specified id or null if store with this
     * id does not exist in the site.
     */
    static getStore(storeID: string): Store | null;
    /**
     * Returns the store group with the specified id or null if the store group with this id does not exist in the current site.
     */
    static getStoreGroup(storeGroupID: string): StoreGroup | null;
    /**
     * Get the store id associated with the current session. By default, the session store id is null.
     */
    static getStoreIDFromSession(): string | null;
    /**
     * Search for stores based on geo-coordinates. The method returns a list of
     * stores for the current site that are within a specified distance of a
     * location on the earth and which optionally satisfy additional filter
     * criteria. If no additional criteria are specified, then this method
     * behaves similar to GetNearestStores pipelet. The criteria are specified
     * as a querystring, using the same syntax as
     * dw.object.SystemObjectMgr.querySystemObjects
     * 
     * The stores and their distance from the specified location are returned as
     * a LinkedHashMap of Store objects to distances, sorting in ascending order
     * by distance. The distance is interpreted either in miles or kilometers
     * depending on the "distanceUnit" parameter.
     * 
     * The latitude and longitude of each store is determined by first looking
     * at dw.catalog.Store.getLatitude and
     * dw.catalog.Store.getLongitude. If these are not set, then the
     * system deduces the location of the store by looking for a configured
     * geolocation matching the store's postal and country codes.
     */
    static searchStoresByCoordinates(latitude: number, longitude: number, distanceUnit: string, maxDistance: number, queryString: string, ...args: any[]): LinkedHashMap<any, any>;
    /**
     * Convenience method.  Same as searchStoresByCoordinates(latitude, longitude, distanceUnit, maxDistance, null).
     */
    static searchStoresByCoordinates(latitude: number, longitude: number, distanceUnit: string, maxDistance: number): LinkedHashMap<any, any>;
    /**
     * Search for stores by country/postal code and optionally by additional
     * filter criteria. This method is analagous to
     * dw.catalog.StoreMgr.searchStoresByCoordinates
     * but identifies a location on the earth indirectly using country and
     * postal code. The method will look first in the saved geolocations of the
     * system to find a geolocation matching the passed country and postal code.
     * If none is found, this method will return an empty map. If one is found,
     * it will use the latitude/longitude of the found geolocation as the center
     * of the search.
     */
    static searchStoresByPostalCode(countryCode: string, postalCode: string, distanceUnit: string, maxDistance: number, queryString: string, ...args: any[]): LinkedHashMap<any, any>;
    /**
     * Convenience method.  Same as searchStoresByPostalCode(countryCode, postalCode, distanceUnit, maxDistance, null).
     */
    static searchStoresByPostalCode(countryCode: string, postalCode: string, distanceUnit: string, maxDistance: number): LinkedHashMap<any, any>;
    /**
     * Set the store id for the current session. The store id is also saved on the cookie with the cookie name
     * "dw_store" with no expiration time. Null is allowed to remove store id from session, when null is passed in, the
     * cookie will be removed when browser exits.
     */
    static setStoreIDToSession(storeID: string): void;
}

export = StoreMgr;
