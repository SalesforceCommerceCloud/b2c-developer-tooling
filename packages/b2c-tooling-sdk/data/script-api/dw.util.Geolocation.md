<!-- prettier-ignore-start -->
# Class Geolocation

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.Geolocation](dw.util.Geolocation.md)

Read-only class representing a position on the earth (latitude and longitude)
and information associated with that location (e.g. country, city, etc). The
Commerce Cloud Digital system can provide geolocation information for a Request
and this information can be used in customer group segmentation rules.


Note: This class is not related to the store locator API (i.e. the
GetNearestStores pipelet) which uses a static set of store locations loaded
into the system by the merchant.


This product includes GeoLite2 data created by MaxMind, available from
[http://www.maxmind.com](http://www.maxmind.com).



## Property Summary

| Property | Description |
| --- | --- |
| [available](#available): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns 'true' if a valid GeoLocation was found for the IP address  (meaning at least Latitude and Longitude were found), false otherwise. |
| [city](#city): [String](TopLevel.String.md) `(read-only)` | Get the city name in English associated with this location. |
| [countryCode](#countrycode): [String](TopLevel.String.md) `(read-only)` | Get the ISO country code associated with this location. |
| [countryName](#countryname): [String](TopLevel.String.md) `(read-only)` | Get the country name in English that the system associates with this location on the  earth. |
| [latitude](#latitude): [Number](TopLevel.Number.md) `(read-only)` | Get the latitude coordinate associated with this location which is a  number between -90.0 and +90.0. |
| [longitude](#longitude): [Number](TopLevel.Number.md) `(read-only)` | Get the longitude coordinate associated with this location which is a  number between -180.0 and +180.0. |
| [metroCode](#metrocode): [String](TopLevel.String.md) `(read-only)` | Get the metro code associated with this location. |
| [postalCode](#postalcode): [String](TopLevel.String.md) `(read-only)` | Get the postal code associated with this location. |
| [regionCode](#regioncode): [String](TopLevel.String.md) `(read-only)` | Get the region (e.g. |
| [regionName](#regionname): [String](TopLevel.String.md) `(read-only)` | Get the region (e.g. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Geolocation](#geolocationstring-string-string-string-string-string-string-number-number)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Constructor for a Geolocation object |

## Method Summary

| Method | Description |
| --- | --- |
| [getCity](dw.util.Geolocation.md#getcity)() | Get the city name in English associated with this location. |
| [getCountryCode](dw.util.Geolocation.md#getcountrycode)() | Get the ISO country code associated with this location. |
| [getCountryName](dw.util.Geolocation.md#getcountryname)() | Get the country name in English that the system associates with this location on the  earth. |
| [getLatitude](dw.util.Geolocation.md#getlatitude)() | Get the latitude coordinate associated with this location which is a  number between -90.0 and +90.0. |
| [getLongitude](dw.util.Geolocation.md#getlongitude)() | Get the longitude coordinate associated with this location which is a  number between -180.0 and +180.0. |
| [getMetroCode](dw.util.Geolocation.md#getmetrocode)() | Get the metro code associated with this location. |
| [getPostalCode](dw.util.Geolocation.md#getpostalcode)() | Get the postal code associated with this location. |
| [getRegionCode](dw.util.Geolocation.md#getregioncode)() | Get the region (e.g. |
| [getRegionName](dw.util.Geolocation.md#getregionname)() | Get the region (e.g. |
| [isAvailable](dw.util.Geolocation.md#isavailable)() | Returns 'true' if a valid GeoLocation was found for the IP address  (meaning at least Latitude and Longitude were found), false otherwise. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### available
- available: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns 'true' if a valid GeoLocation was found for the IP address
      (meaning at least Latitude and Longitude were found), false otherwise.



---

### city
- city: [String](TopLevel.String.md) `(read-only)`
  - : Get the city name in English associated with this location.


---

### countryCode
- countryCode: [String](TopLevel.String.md) `(read-only)`
  - : Get the ISO country code associated with this location.


---

### countryName
- countryName: [String](TopLevel.String.md) `(read-only)`
  - : Get the country name in English that the system associates with this location on the
      earth.



---

### latitude
- latitude: [Number](TopLevel.Number.md) `(read-only)`
  - : Get the latitude coordinate associated with this location which is a
      number between -90.0 and +90.0.



---

### longitude
- longitude: [Number](TopLevel.Number.md) `(read-only)`
  - : Get the longitude coordinate associated with this location which is a
      number between -180.0 and +180.0.



---

### metroCode
- metroCode: [String](TopLevel.String.md) `(read-only)`
  - : Get the metro code associated with this location.


---

### postalCode
- postalCode: [String](TopLevel.String.md) `(read-only)`
  - : Get the postal code associated with this location.


---

### regionCode
- regionCode: [String](TopLevel.String.md) `(read-only)`
  - : Get the region (e.g. province or state) code for this location.


---

### regionName
- regionName: [String](TopLevel.String.md) `(read-only)`
  - : Get the region (e.g. province in state) name in English that the system
      associates with this location.



---

## Constructor Details

### Geolocation(String, String, String, String, String, String, String, Number, Number)
- Geolocation(countryCode: [String](TopLevel.String.md), countryName: [String](TopLevel.String.md), regionCode: [String](TopLevel.String.md), regionName: [String](TopLevel.String.md), metroCode: [String](TopLevel.String.md), city: [String](TopLevel.String.md), postalCode: [String](TopLevel.String.md), latitude: [Number](TopLevel.Number.md), longitude: [Number](TopLevel.Number.md))
  - : Constructor for a Geolocation object

    **Parameters:**
    - countryCode - the ISO country code associated with this location.  The [two-character ISO          3166-1 alpha code](http://en.wikipedia.org/wiki/ISO\_3166-1) for the country.
    - countryName - the country name in English that the system associates with this location on the  earth.
    - regionCode - the region (e.g. province or state) code for this location.  This is a string up to three characters long containing the subdivision portion of the  [code](http://en.wikipedia.org/wiki/ISO\_3166-2).
    - regionName - the region (e.g. province in state) name in English that the system  associates with this location.
    - metroCode - the metro code associated with this location.  The metro code of the location if the location is in the US. See the  [  Google AdWords API](https://developers.google.com/adwords/api/docs/appendix/cities-DMAregions) for values
    - city - the city name in English associated with this location.
    - postalCode - the postal code associated with this location.
    - latitude - the latitude coordinate associated with this location which is a  number between -90.0 and +90.0.
    - longitude - the longitude coordinate associated with this location which is a  number between -180.0 and +180.0.


---

## Method Details

### getCity()
- getCity(): [String](TopLevel.String.md)
  - : Get the city name in English associated with this location.

    **Returns:**
    - the city that the system associates with this location on the
              earth.



---

### getCountryCode()
- getCountryCode(): [String](TopLevel.String.md)
  - : Get the ISO country code associated with this location.

    **Returns:**
    - The [two-character ISO
              3166-1 alpha code](http://en.wikipedia.org/wiki/ISO\_3166-1) for the country.



---

### getCountryName()
- getCountryName(): [String](TopLevel.String.md)
  - : Get the country name in English that the system associates with this location on the
      earth.


    **Returns:**
    - the country name that the system associates with this location on the
              earth.



---

### getLatitude()
- getLatitude(): [Number](TopLevel.Number.md)
  - : Get the latitude coordinate associated with this location which is a
      number between -90.0 and +90.0.


    **Returns:**
    - The latitude of the location as a floating point number.


---

### getLongitude()
- getLongitude(): [Number](TopLevel.Number.md)
  - : Get the longitude coordinate associated with this location which is a
      number between -180.0 and +180.0.


    **Returns:**
    - The longitude of the location as a floating point number.


---

### getMetroCode()
- getMetroCode(): [String](TopLevel.String.md)
  - : Get the metro code associated with this location.

    **Returns:**
    - The metro code of the location if the location is in the US. See
              the [Google AdWords API](https://developers.google.com/adwords/api/docs/appendix/cities-DMAregions) for returned values.



---

### getPostalCode()
- getPostalCode(): [String](TopLevel.String.md)
  - : Get the postal code associated with this location.

    **Returns:**
    - The postal code of the location. Postal codes are not available
              for all countries. In some countries, this will only contain part
              of the postal code.



---

### getRegionCode()
- getRegionCode(): [String](TopLevel.String.md)
  - : Get the region (e.g. province or state) code for this location.

    **Returns:**
    - This is a string up to three characters long containing the
              subdivision portion of the [code](http://en.wikipedia.org/wiki/ISO\_3166-2).



---

### getRegionName()
- getRegionName(): [String](TopLevel.String.md)
  - : Get the region (e.g. province in state) name in English that the system
      associates with this location.


    **Returns:**
    - the region name that the system associates with this location on
              the earth.



---

### isAvailable()
- isAvailable(): [Boolean](TopLevel.Boolean.md)
  - : Returns 'true' if a valid GeoLocation was found for the IP address
      (meaning at least Latitude and Longitude were found), false otherwise.


    **Returns:**
    - 'true' if a valid GeoLocation was found for the IP address
      (meaning at least Latitude and Longitude were found), false otherwise.



---

<!-- prettier-ignore-end -->
