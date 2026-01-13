<!-- prettier-ignore-start -->
# Class Locale

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.Locale](dw.util.Locale.md)

Represents a Locale supported by the system.


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the String representation of the localeID. |
| [ISO3Country](#iso3country): [String](TopLevel.String.md) `(read-only)` | Returns the uppercase ISO 3166 3-letter country/region code for this Locale. |
| [ISO3Language](#iso3language): [String](TopLevel.String.md) `(read-only)` | Returns the 3-letter ISO 639 language code for this Locale. |
| [country](#country): [String](TopLevel.String.md) `(read-only)` | Returns the uppercase ISO 3166 2-letter country/region code for this Locale. |
| [displayCountry](#displaycountry): [String](TopLevel.String.md) `(read-only)` | Returns the display name of this Locale's country, in this Locale's language,  not in the session locale's language. |
| [displayLanguage](#displaylanguage): [String](TopLevel.String.md) `(read-only)` | Returns the display name of this Locale's language, in this Locale's language,  not in the session locale's language. |
| [displayName](#displayname): [String](TopLevel.String.md) `(read-only)` | Returns the display name of this Locale, in this Locale's language,  not in the session locale's language. |
| [language](#language): [String](TopLevel.String.md) `(read-only)` | Returns the lowercase ISO 639 language code for this Locale. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCountry](dw.util.Locale.md#getcountry)() | Returns the uppercase ISO 3166 2-letter country/region code for this Locale. |
| [getDisplayCountry](dw.util.Locale.md#getdisplaycountry)() | Returns the display name of this Locale's country, in this Locale's language,  not in the session locale's language. |
| [getDisplayLanguage](dw.util.Locale.md#getdisplaylanguage)() | Returns the display name of this Locale's language, in this Locale's language,  not in the session locale's language. |
| [getDisplayName](dw.util.Locale.md#getdisplayname)() | Returns the display name of this Locale, in this Locale's language,  not in the session locale's language. |
| [getID](dw.util.Locale.md#getid)() | Returns the String representation of the localeID. |
| [getISO3Country](dw.util.Locale.md#getiso3country)() | Returns the uppercase ISO 3166 3-letter country/region code for this Locale. |
| [getISO3Language](dw.util.Locale.md#getiso3language)() | Returns the 3-letter ISO 639 language code for this Locale. |
| [getLanguage](dw.util.Locale.md#getlanguage)() | Returns the lowercase ISO 639 language code for this Locale. |
| static [getLocale](dw.util.Locale.md#getlocalestring)([String](TopLevel.String.md)) | Returns a Locale instance for the given localeId, or  `null` if no such Locale could be found. |
| [toString](dw.util.Locale.md#tostring)() | Returns the String representation of the localeID. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the String representation of the localeID.
      
      
      Combines the language and the country key, concatenated with "\_". 
      For example: "en\_US". This attribute is the primary key of the class.



---

### ISO3Country
- ISO3Country: [String](TopLevel.String.md) `(read-only)`
  - : Returns the uppercase ISO 3166 3-letter country/region code for this Locale.
      If no country has been specified for this Locale, this value is an empty string.



---

### ISO3Language
- ISO3Language: [String](TopLevel.String.md) `(read-only)`
  - : Returns the 3-letter ISO 639 language code for this Locale.
      If no language has been specified for this Locale, this value is an empty string.



---

### country
- country: [String](TopLevel.String.md) `(read-only)`
  - : Returns the uppercase ISO 3166 2-letter country/region code for this Locale.
      If no country has been specified for this Locale, this value is an empty string.



---

### displayCountry
- displayCountry: [String](TopLevel.String.md) `(read-only)`
  - : Returns the display name of this Locale's country, in this Locale's language,
      not in the session locale's language.
      If no country has been specified for this Locale, this value is an empty string.



---

### displayLanguage
- displayLanguage: [String](TopLevel.String.md) `(read-only)`
  - : Returns the display name of this Locale's language, in this Locale's language,
      not in the session locale's language.
      If no country has been specified for this Locale, this value is an empty string.



---

### displayName
- displayName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the display name of this Locale, in this Locale's language,
      not in the session locale's language.
      If no display name has been specified for this Locale, this value is an empty string.



---

### language
- language: [String](TopLevel.String.md) `(read-only)`
  - : Returns the lowercase ISO 639 language code for this Locale.
      If no language has been specified for this Locale, this value is an empty string.



---

## Method Details

### getCountry()
- getCountry(): [String](TopLevel.String.md)
  - : Returns the uppercase ISO 3166 2-letter country/region code for this Locale.
      If no country has been specified for this Locale, this value is an empty string.


    **Returns:**
    - the uppercase ISO 3166 2-letter country/region code for this Locale.
              If no country has been specified for this Locale, this value is an empty string.



---

### getDisplayCountry()
- getDisplayCountry(): [String](TopLevel.String.md)
  - : Returns the display name of this Locale's country, in this Locale's language,
      not in the session locale's language.
      If no country has been specified for this Locale, this value is an empty string.


    **Returns:**
    - the display name of this Locale's country, in this Locale's language.
              If no country has been specified for this Locale, this value is an empty string.



---

### getDisplayLanguage()
- getDisplayLanguage(): [String](TopLevel.String.md)
  - : Returns the display name of this Locale's language, in this Locale's language,
      not in the session locale's language.
      If no country has been specified for this Locale, this value is an empty string.


    **Returns:**
    - the display name of this Locale's language, in this Locale's language.
              If no language has been specified for this Locale, this value is an empty string.



---

### getDisplayName()
- getDisplayName(): [String](TopLevel.String.md)
  - : Returns the display name of this Locale, in this Locale's language,
      not in the session locale's language.
      If no display name has been specified for this Locale, this value is an empty string.


    **Returns:**
    - the display name of this Locale, in this Locale's language.
              If no display name has been specified for this Locale, this value is an empty string.



---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the String representation of the localeID.
      
      
      Combines the language and the country key, concatenated with "\_". 
      For example: "en\_US". This attribute is the primary key of the class.


    **Returns:**
    - the String representation of the localeID.


---

### getISO3Country()
- getISO3Country(): [String](TopLevel.String.md)
  - : Returns the uppercase ISO 3166 3-letter country/region code for this Locale.
      If no country has been specified for this Locale, this value is an empty string.


    **Returns:**
    - the uppercase ISO 3166 3-letter country/region code for this Locale.
              If no country has been specified for this Locale, this value is an empty string.



---

### getISO3Language()
- getISO3Language(): [String](TopLevel.String.md)
  - : Returns the 3-letter ISO 639 language code for this Locale.
      If no language has been specified for this Locale, this value is an empty string.


    **Returns:**
    - the 3-letter ISO 639 language code for this Locale.
              If no language has been specified for this Locale, this value is an empty string.



---

### getLanguage()
- getLanguage(): [String](TopLevel.String.md)
  - : Returns the lowercase ISO 639 language code for this Locale.
      If no language has been specified for this Locale, this value is an empty string.


    **Returns:**
    - the lowercase ISO 639 language code for this Locale.
              If no language has been specified for this Locale, this value is an empty string.



---

### getLocale(String)
- static getLocale(localeId: [String](TopLevel.String.md)): [Locale](dw.util.Locale.md)
  - : Returns a Locale instance for the given localeId, or
      `null` if no such Locale could be found.


    **Parameters:**
    - localeId - the localeID of the desired Locale

    **Returns:**
    - the Locale instance for the given localeId, or
              `null` if no such Locale could be found.



---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns the String representation of the localeID.
      
      
      Combines the language and the country key, concatenated with "\_". 
      For example: "en\_US". This attribute is the primary key of the class.


    **Returns:**
    - the String representation of the localeID.


---

<!-- prettier-ignore-end -->
