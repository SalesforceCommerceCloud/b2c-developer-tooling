<!-- prettier-ignore-start -->
# Class StoreMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.StoreMgr](dw.catalog.StoreMgr.md)

Provides helper methods for getting stores based on id and querying for
stores based on geolocation.



## Property Summary

| Property | Description |
| --- | --- |
| [allStoreGroups](#allstoregroups): [Collection](dw.util.Collection.md) `(read-only)` | Returns all the store groups of the current site. |
| [storeIDFromSession](#storeidfromsession): [String](TopLevel.String.md) `(read-only)` | Get the store id associated with the current session. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [getAllStoreGroups](dw.catalog.StoreMgr.md#getallstoregroups)() | Returns all the store groups of the current site. |
| static [getStore](dw.catalog.StoreMgr.md#getstorestring)([String](TopLevel.String.md)) | Returns the store object with the specified id or null if store with this  id does not exist in the site. |
| static [getStoreGroup](dw.catalog.StoreMgr.md#getstoregroupstring)([String](TopLevel.String.md)) | Returns the store group with the specified id or null if the store group with this id does not exist in the current site. |
| static [getStoreIDFromSession](dw.catalog.StoreMgr.md#getstoreidfromsession)() | Get the store id associated with the current session. |
| static [searchStoresByCoordinates](dw.catalog.StoreMgr.md#searchstoresbycoordinatesnumber-number-string-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Convenience method. |
| static [searchStoresByCoordinates](dw.catalog.StoreMgr.md#searchstoresbycoordinatesnumber-number-string-number-string-object)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md), [String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | Search for stores based on geo-coordinates. |
| static [searchStoresByPostalCode](dw.catalog.StoreMgr.md#searchstoresbypostalcodestring-string-string-number)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Convenience method. |
| static [searchStoresByPostalCode](dw.catalog.StoreMgr.md#searchstoresbypostalcodestring-string-string-number-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md), [String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | Search for stores by country/postal code and optionally by additional  filter criteria. |
| static [setStoreIDToSession](dw.catalog.StoreMgr.md#setstoreidtosessionstring)([String](TopLevel.String.md)) | Set the store id for the current session. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### allStoreGroups
- allStoreGroups: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all the store groups of the current site.


---

### storeIDFromSession
- storeIDFromSession: [String](TopLevel.String.md) `(read-only)`
  - : Get the store id associated with the current session. By default, the session store id is null.


---

## Method Details

### getAllStoreGroups()
- static getAllStoreGroups(): [Collection](dw.util.Collection.md)
  - : Returns all the store groups of the current site.

    **Returns:**
    - The store groups of the current site.


---

### getStore(String)
- static getStore(storeID: [String](TopLevel.String.md)): [Store](dw.catalog.Store.md)
  - : Returns the store object with the specified id or null if store with this
      id does not exist in the site.


    **Parameters:**
    - storeID - the store identifier.

    **Returns:**
    - Store for specified id or null.


---

### getStoreGroup(String)
- static getStoreGroup(storeGroupID: [String](TopLevel.String.md)): [StoreGroup](dw.catalog.StoreGroup.md)
  - : Returns the store group with the specified id or null if the store group with this id does not exist in the current site.

    **Parameters:**
    - storeGroupID - the store group identifier.

    **Returns:**
    - The store group for specified id or null.


---

### getStoreIDFromSession()
- static getStoreIDFromSession(): [String](TopLevel.String.md)
  - : Get the store id associated with the current session. By default, the session store id is null.

    **Returns:**
    - store id, null is returned and means no store id is set on session


---

### searchStoresByCoordinates(Number, Number, String, Number)
- static searchStoresByCoordinates(latitude: [Number](TopLevel.Number.md), longitude: [Number](TopLevel.Number.md), distanceUnit: [String](TopLevel.String.md), maxDistance: [Number](TopLevel.Number.md)): [LinkedHashMap](dw.util.LinkedHashMap.md)
  - : Convenience method.  Same as searchStoresByCoordinates(latitude, longitude, distanceUnit, maxDistance, null).

    **Parameters:**
    - latitude - Latitude coordinate which is the center of the search             area. Must not be null or an exception is thrown.
    - longitude - Longitude coordinate which is the center of the search             area. Must not be null or an exception is thrown.
    - distanceUnit - The distance unit to be used for the calculation.             Supported values are 'mi' and 'km' (for miles and kilometers             respectively). If an invalid value is passed then 'km' will be             used.
    - maxDistance - Area (radius) in DistanceUnit where Stores will be             searched for. If null is passed, a system default is used.

    **Returns:**
    - The stores and their distance from the specified location, sorted
              in ascending order by distance.



---

### searchStoresByCoordinates(Number, Number, String, Number, String, Object...)
- static searchStoresByCoordinates(latitude: [Number](TopLevel.Number.md), longitude: [Number](TopLevel.Number.md), distanceUnit: [String](TopLevel.String.md), maxDistance: [Number](TopLevel.Number.md), queryString: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): [LinkedHashMap](dw.util.LinkedHashMap.md)
  - : Search for stores based on geo-coordinates. The method returns a list of
      stores for the current site that are within a specified distance of a
      location on the earth and which optionally satisfy additional filter
      criteria. If no additional criteria are specified, then this method
      behaves similar to GetNearestStores pipelet. The criteria are specified
      as a querystring, using the same syntax as
      [SystemObjectMgr.querySystemObjects(String, String, String, Object...)](dw.object.SystemObjectMgr.md#querysystemobjectsstring-string-string-object)
      
      
      The stores and their distance from the specified location are returned as
      a LinkedHashMap of Store objects to distances, sorting in ascending order
      by distance. The distance is interpreted either in miles or kilometers
      depending on the "distanceUnit" parameter.
      
      
      The latitude and longitude of each store is determined by first looking
      at [Store.getLatitude()](dw.catalog.Store.md#getlatitude) and
      [Store.getLongitude()](dw.catalog.Store.md#getlongitude). If these are not set, then the
      system deduces the location of the store by looking for a configured
      geolocation matching the store's postal and country codes.


    **Parameters:**
    - latitude - Latitude coordinate which is the center of the search             area. Must not be null or an exception is thrown.
    - longitude - Longitude coordinate which is the center of the search             area. Must not be null or an exception is thrown.
    - distanceUnit - The distance unit to be used for the calculation.             Supported values are 'mi' and 'km' (for miles and kilometers             respectively). If an invalid value is passed then 'km' will be             used.
    - maxDistance - Area (radius) in DistanceUnit where Stores will be             searched for. If null is passed, a system default is used.
    - queryString - optional filter criteria specified as querystring.
    - args - the arguments to fill in the values in the querystring.

    **Returns:**
    - The stores and their distance from the specified location, sorted
              in ascending order by distance.



---

### searchStoresByPostalCode(String, String, String, Number)
- static searchStoresByPostalCode(countryCode: [String](TopLevel.String.md), postalCode: [String](TopLevel.String.md), distanceUnit: [String](TopLevel.String.md), maxDistance: [Number](TopLevel.Number.md)): [LinkedHashMap](dw.util.LinkedHashMap.md)
  - : Convenience method.  Same as searchStoresByPostalCode(countryCode, postalCode, distanceUnit, maxDistance, null).

    **Parameters:**
    - countryCode - The country code for the search area, must not be null.
    - postalCode - The postal code for the center of the search area, must             not be null.
    - distanceUnit - The distance unit to be used for the calculation.             Supported values are 'mi' and 'km' (for miles and kilometers             respectively). If an invalid value is passed then 'km' will be             used.
    - maxDistance - Area (radius) in DistanceUnit where Stores will be             searched for. If null is passed, a system default is used.

    **Returns:**
    - The stores and their distance from the specified location, sorted
              in ascending order by distance.



---

### searchStoresByPostalCode(String, String, String, Number, String, Object...)
- static searchStoresByPostalCode(countryCode: [String](TopLevel.String.md), postalCode: [String](TopLevel.String.md), distanceUnit: [String](TopLevel.String.md), maxDistance: [Number](TopLevel.Number.md), queryString: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): [LinkedHashMap](dw.util.LinkedHashMap.md)
  - : Search for stores by country/postal code and optionally by additional
      filter criteria. This method is analagous to
      [searchStoresByCoordinates(Number, Number, String, Number, String, Object...)](dw.catalog.StoreMgr.md#searchstoresbycoordinatesnumber-number-string-number-string-object)
      but identifies a location on the earth indirectly using country and
      postal code. The method will look first in the saved geolocations of the
      system to find a geolocation matching the passed country and postal code.
      If none is found, this method will return an empty map. If one is found,
      it will use the latitude/longitude of the found geolocation as the center
      of the search.


    **Parameters:**
    - countryCode - The country code for the search area, must not be null.
    - postalCode - The postal code for the center of the search area, must             not be null.
    - distanceUnit - The distance unit to be used for the calculation.             Supported values are 'mi' and 'km' (for miles and kilometers             respectively). If an invalid value is passed then 'km' will be             used.
    - maxDistance - Area (radius) in DistanceUnit where Stores will be             searched for. If null is passed, a system default is used.
    - queryString - An optional search querystring which provides             additional criteria to filter stores by.
    - args - The arguments providing the dynamic values to the             querystring.

    **Returns:**
    - The stores and their distance from the specified location, sorted
              in ascending order by distance.



---

### setStoreIDToSession(String)
- static setStoreIDToSession(storeID: [String](TopLevel.String.md)): void
  - : Set the store id for the current session. The store id is also saved on the cookie with the cookie name
      "dw\_store" with no expiration time. Null is allowed to remove store id from session, when null is passed in, the
      cookie will be removed when browser exits.


    **Parameters:**
    - storeID - the id of the store. The leading and trailing white spaces are removed by system from storeID


---

<!-- prettier-ignore-end -->
