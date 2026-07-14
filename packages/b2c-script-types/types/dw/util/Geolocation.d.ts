/**
 * Read-only class representing a position on the earth (latitude and longitude)
 * and information associated with that location (e.g. country, city, etc). The
 * Commerce Cloud Digital system can provide geolocation information for a Request
 * and this information can be used in customer group segmentation rules.
 * 
 * Note: This class is not related to the store locator API (i.e. the
 * GetNearestStores pipelet) which uses a static set of store locations loaded
 * into the system by the merchant.
 * 
 * This product includes GeoLite2 data created by MaxMind, available from
 * http://www.maxmind.com.
 */
declare class Geolocation {
    /**
     * Returns 'true' if a valid GeoLocation was found for the IP address
     * (meaning at least Latitude and Longitude were found), false otherwise.
     */
    readonly available: boolean;
    /**
     * Get the city name in English associated with this location.
     */
    readonly city: string;
    /**
     * Get the ISO country code associated with this location.
     */
    readonly countryCode: string;
    /**
     * Get the country name in English that the system associates with this location on the
     * earth.
     */
    readonly countryName: string;
    /**
     * Get the latitude coordinate associated with this location which is a
     * number between -90.0 and +90.0.
     */
    readonly latitude: number;
    /**
     * Get the longitude coordinate associated with this location which is a
     * number between -180.0 and +180.0.
     */
    readonly longitude: number;
    /**
     * Get the metro code associated with this location.
     */
    readonly metroCode: string;
    /**
     * Get the postal code associated with this location.
     */
    readonly postalCode: string;
    /**
     * Get the region (e.g. province or state) code for this location.
     */
    readonly regionCode: string;
    /**
     * Get the region (e.g. province in state) name in English that the system
     * associates with this location.
     */
    readonly regionName: string;
    /**
     * Constructor for a Geolocation object
     */
    constructor(countryCode: string, countryName: string, regionCode: string, regionName: string, metroCode: string, city: string, postalCode: string, latitude: number, longitude: number);
    /**
     * Get the city name in English associated with this location.
     */
    getCity(): string;
    /**
     * Get the ISO country code associated with this location.
     */
    getCountryCode(): string;
    /**
     * Get the country name in English that the system associates with this location on the
     * earth.
     */
    getCountryName(): string;
    /**
     * Get the latitude coordinate associated with this location which is a
     * number between -90.0 and +90.0.
     */
    getLatitude(): number;
    /**
     * Get the longitude coordinate associated with this location which is a
     * number between -180.0 and +180.0.
     */
    getLongitude(): number;
    /**
     * Get the metro code associated with this location.
     */
    getMetroCode(): string;
    /**
     * Get the postal code associated with this location.
     */
    getPostalCode(): string;
    /**
     * Get the region (e.g. province or state) code for this location.
     */
    getRegionCode(): string;
    /**
     * Get the region (e.g. province in state) name in English that the system
     * associates with this location.
     */
    getRegionName(): string;
    /**
     * Returns 'true' if a valid GeoLocation was found for the IP address
     * (meaning at least Latitude and Longitude were found), false otherwise.
     */
    isAvailable(): boolean;
}

export = Geolocation;
