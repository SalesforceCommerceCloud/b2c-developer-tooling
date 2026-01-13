<!-- prettier-ignore-start -->
# Class Site

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.Site](dw.system.Site.md)

This class represents a site in Commerce Cloud Digital and provides access to
several site-level configuration values which are managed from within the
Business Manager. It is only possible to get a reference to the current site
as determined by the current request. The static method
[getCurrent()](dw.system.Site.md#getcurrent) returns a reference to the current site.



## Constant Summary

| Constant | Description |
| --- | --- |
| [SITE_STATUS_MAINTENANCE](#site_status_maintenance): [Number](TopLevel.Number.md) = 3 | Constant that represents the Site under maintenance/offline |
| [SITE_STATUS_ONLINE](#site_status_online): [Number](TopLevel.Number.md) = 1 | Constant that represents the Site is Online |
| [SITE_STATUS_PROTECTED](#site_status_protected): [Number](TopLevel.Number.md) = 5 | Constant that represents the Site is in preview mode or online/password (protected) |

## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the site. |
| ~~[OMSEnabled](#omsenabled): [Boolean](TopLevel.Boolean.md)~~ `(read-only)` | Whether oms is active in the current site. |
| [allSites](#allsites): [List](dw.util.List.md) `(read-only)` | Returns all sites. |
| [allowedCurrencies](#allowedcurrencies): [List](dw.util.List.md) `(read-only)` | Returns the allowed currencies of the current site as a collection of  currency codes. |
| [allowedLocales](#allowedlocales): [List](dw.util.List.md) `(read-only)` | Returns the allowed locales of the current site as a collection of  locale ID's. |
| [calendar](#calendar): [Calendar](dw.util.Calendar.md) `(read-only)` | Returns a new Calendar object in the time zone of the  current site. |
| ~~[currencyCode](#currencycode): [String](TopLevel.String.md)~~ `(read-only)` | Returns the default currency code for the current site. |
| [current](#current): [Site](dw.system.Site.md) `(read-only)` | Returns the current site. |
| [defaultCurrency](#defaultcurrency): [String](TopLevel.String.md) `(read-only)` | Returns the default currency code for the current site. |
| [defaultLocale](#defaultlocale): [String](TopLevel.String.md) `(read-only)` | Return default locale for the site. |
| [einsteinSiteID](#einsteinsiteid): [String](TopLevel.String.md) `(read-only)` | Returns the Einstein site Id. |
| [httpHostName](#httphostname): [String](TopLevel.String.md) `(read-only)` | Returns the configured HTTP host name. |
| [httpsHostName](#httpshostname): [String](TopLevel.String.md) `(read-only)` | Returns the configured HTTPS host name. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Returns a descriptive name for the site. |
| [pageMetaTags](#pagemetatags): [Array](TopLevel.Array.md) `(read-only)` | Returns all page meta tags, defined for this instance for which content can be generated. |
| [preferences](#preferences): [SitePreferences](dw.system.SitePreferences.md) `(read-only)` | This method returns a container of all site preferences of this site. |
| [status](#status): [Number](TopLevel.Number.md) `(read-only)` | Returns the status of this site. |
| [timezone](#timezone): [String](TopLevel.String.md) `(read-only)` | Returns the code for the time zone in which the storefront is  running. |
| [timezoneOffset](#timezoneoffset): [Number](TopLevel.Number.md) `(read-only)` | Returns time zone offset in which the storefront is running. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [getAllSites](dw.system.Site.md#getallsites)() | Returns all sites. |
| [getAllowedCurrencies](dw.system.Site.md#getallowedcurrencies)() | Returns the allowed currencies of the current site as a collection of  currency codes. |
| [getAllowedLocales](dw.system.Site.md#getallowedlocales)() | Returns the allowed locales of the current site as a collection of  locale ID's. |
| static [getCalendar](dw.system.Site.md#getcalendar)() | Returns a new Calendar object in the time zone of the  current site. |
| ~~[getCurrencyCode](dw.system.Site.md#getcurrencycode)()~~ | Returns the default currency code for the current site. |
| static [getCurrent](dw.system.Site.md#getcurrent)() | Returns the current site. |
| [getCustomPreferenceValue](dw.system.Site.md#getcustompreferencevaluestring)([String](TopLevel.String.md)) | Returns a custom preference value. |
| [getDefaultCurrency](dw.system.Site.md#getdefaultcurrency)() | Returns the default currency code for the current site. |
| [getDefaultLocale](dw.system.Site.md#getdefaultlocale)() | Return default locale for the site. |
| [getEinsteinSiteID](dw.system.Site.md#geteinsteinsiteid)() | Returns the Einstein site Id. |
| [getHttpHostName](dw.system.Site.md#gethttphostname)() | Returns the configured HTTP host name. |
| [getHttpsHostName](dw.system.Site.md#gethttpshostname)() | Returns the configured HTTPS host name. |
| [getID](dw.system.Site.md#getid)() | Returns the ID of the site. |
| [getName](dw.system.Site.md#getname)() | Returns a descriptive name for the site. |
| [getPageMetaTag](dw.system.Site.md#getpagemetatagstring)([String](TopLevel.String.md)) | Returns the page meta tag for the specified id. |
| [getPageMetaTags](dw.system.Site.md#getpagemetatags)() | Returns all page meta tags, defined for this instance for which content can be generated. |
| [getPreferences](dw.system.Site.md#getpreferences)() | This method returns a container of all site preferences of this site. |
| [getStatus](dw.system.Site.md#getstatus)() | Returns the status of this site. |
| [getTimezone](dw.system.Site.md#gettimezone)() | Returns the code for the time zone in which the storefront is  running. |
| [getTimezoneOffset](dw.system.Site.md#gettimezoneoffset)() | Returns time zone offset in which the storefront is running. |
| ~~[isOMSEnabled](dw.system.Site.md#isomsenabled)()~~ | Whether oms is active in the current site. |
| [setCustomPreferenceValue](dw.system.Site.md#setcustompreferencevaluestring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | The method sets a value for a custom preference. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### SITE_STATUS_MAINTENANCE

- SITE_STATUS_MAINTENANCE: [Number](TopLevel.Number.md) = 3
  - : Constant that represents the Site under maintenance/offline


---

### SITE_STATUS_ONLINE

- SITE_STATUS_ONLINE: [Number](TopLevel.Number.md) = 1
  - : Constant that represents the Site is Online


---

### SITE_STATUS_PROTECTED

- SITE_STATUS_PROTECTED: [Number](TopLevel.Number.md) = 5
  - : Constant that represents the Site is in preview mode or online/password (protected)


---

## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the site.


---

### OMSEnabled
- ~~OMSEnabled: [Boolean](TopLevel.Boolean.md)~~ `(read-only)`
  - : Whether oms is active in the current site. This depends on a general
      property which states whether oms is active for the server,
      and a site-dependent preference whether oms is available for the current site.



---

### allSites
- allSites: [List](dw.util.List.md) `(read-only)`
  - : Returns all sites.


---

### allowedCurrencies
- allowedCurrencies: [List](dw.util.List.md) `(read-only)`
  - : Returns the allowed currencies of the current site as a collection of
      currency codes.



---

### allowedLocales
- allowedLocales: [List](dw.util.List.md) `(read-only)`
  - : Returns the allowed locales of the current site as a collection of
      locale ID's.



---

### calendar
- calendar: [Calendar](dw.util.Calendar.md) `(read-only)`
  - : Returns a new Calendar object in the time zone of the
      current site.



---

### currencyCode
- ~~currencyCode: [String](TopLevel.String.md)~~ `(read-only)`
  - : Returns the default currency code for the current site.

    **Deprecated:**
:::warning
Use [getDefaultCurrency()](dw.system.Site.md#getdefaultcurrency) method instead,
:::

---

### current
- current: [Site](dw.system.Site.md) `(read-only)`
  - : Returns the current site.


---

### defaultCurrency
- defaultCurrency: [String](TopLevel.String.md) `(read-only)`
  - : Returns the default currency code for the current site.


---

### defaultLocale
- defaultLocale: [String](TopLevel.String.md) `(read-only)`
  - : Return default locale for the site.


---

### einsteinSiteID
- einsteinSiteID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the Einstein site Id. Typically this is a concatenation of the realm, underscore character and the site id.
      It can be overwritten by support users to help with realm moves to continue using the Einstein data from the old realm.
      Used when making calls to the Einstein APIs.



---

### httpHostName
- httpHostName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the configured HTTP host name. If no host name
      is configured the method returns the instance hostname.



---

### httpsHostName
- httpsHostName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the configured HTTPS host name. If no host name
      is configured the method returns the HTTP host name or the instance hostname, if
      that is not configured as well.



---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Returns a descriptive name for the site.


---

### pageMetaTags
- pageMetaTags: [Array](TopLevel.Array.md) `(read-only)`
  - : Returns all page meta tags, defined for this instance for which content can be generated.
      
      
      The meta tag content is generated based on the home page meta tag context and rules.
      The rules are obtained from the current repository domain.



---

### preferences
- preferences: [SitePreferences](dw.system.SitePreferences.md) `(read-only)`
  - : This method returns a container of all site preferences of this site.


---

### status
- status: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the status of this site.
      
      
      Possible values are [SITE_STATUS_ONLINE](dw.system.Site.md#site_status_online), [SITE_STATUS_MAINTENANCE](dw.system.Site.md#site_status_maintenance), [SITE_STATUS_PROTECTED](dw.system.Site.md#site_status_protected)



---

### timezone
- timezone: [String](TopLevel.String.md) `(read-only)`
  - : Returns the code for the time zone in which the storefront is
      running.



---

### timezoneOffset
- timezoneOffset: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns time zone offset in which the storefront is running.


---

## Method Details

### getAllSites()
- static getAllSites(): [List](dw.util.List.md)
  - : Returns all sites.

    **Returns:**
    - all sites for the current instance


---

### getAllowedCurrencies()
- getAllowedCurrencies(): [List](dw.util.List.md)
  - : Returns the allowed currencies of the current site as a collection of
      currency codes.


    **Returns:**
    - Collection of allowed site currencies


---

### getAllowedLocales()
- getAllowedLocales(): [List](dw.util.List.md)
  - : Returns the allowed locales of the current site as a collection of
      locale ID's.


    **Returns:**
    - Collection if allowed site locales


---

### getCalendar()
- static getCalendar(): [Calendar](dw.util.Calendar.md)
  - : Returns a new Calendar object in the time zone of the
      current site.


    **Returns:**
    - the Calendar object in the time zone of the
      current site.



---

### getCurrencyCode()
- ~~getCurrencyCode(): [String](TopLevel.String.md)~~
  - : Returns the default currency code for the current site.

    **Returns:**
    - the default currency code for the current site.

    **Deprecated:**
:::warning
Use [getDefaultCurrency()](dw.system.Site.md#getdefaultcurrency) method instead,
:::

---

### getCurrent()
- static getCurrent(): [Site](dw.system.Site.md)
  - : Returns the current site.

    **Returns:**
    - the current site.


---

### getCustomPreferenceValue(String)
- getCustomPreferenceValue(name: [String](TopLevel.String.md)): [Object](TopLevel.Object.md)
  - : Returns a custom preference value. If the preference does not exist the
      method returns null.  This method is simply a shortcut method for
      accessing the value for a custom attribute defined on the
      [SitePreferences](dw.system.SitePreferences.md) object.
      
      
      ```
      // Method #1
      var mySitePrefValue1 : String =  dw.system.Site.getCurrent().
          getCustomPreferenceValue("mySitePref");
      
      // Method #2
      var sitePrefs : SitePreferences = dw.system.Site.getCurrent().getPreferences();
      var mySitePrefValue2 : String = sitePrefs.getCustom()["mySitePref"];
      ```


    **Parameters:**
    - name - preference name.

    **Returns:**
    - the preference value, or null if there is no preference with the
              given name.



---

### getDefaultCurrency()
- getDefaultCurrency(): [String](TopLevel.String.md)
  - : Returns the default currency code for the current site.

    **Returns:**
    - the default currency code for the current site.


---

### getDefaultLocale()
- getDefaultLocale(): [String](TopLevel.String.md)
  - : Return default locale for the site.

    **Returns:**
    - default locale for the site.


---

### getEinsteinSiteID()
- getEinsteinSiteID(): [String](TopLevel.String.md)
  - : Returns the Einstein site Id. Typically this is a concatenation of the realm, underscore character and the site id.
      It can be overwritten by support users to help with realm moves to continue using the Einstein data from the old realm.
      Used when making calls to the Einstein APIs.


    **Returns:**
    - the Einstein site Id


---

### getHttpHostName()
- getHttpHostName(): [String](TopLevel.String.md)
  - : Returns the configured HTTP host name. If no host name
      is configured the method returns the instance hostname.


    **Returns:**
    - the configured HTTP host name or if it is not
              set the instance hostname.



---

### getHttpsHostName()
- getHttpsHostName(): [String](TopLevel.String.md)
  - : Returns the configured HTTPS host name. If no host name
      is configured the method returns the HTTP host name or the instance hostname, if
      that is not configured as well.


    **Returns:**
    - the configured HTTPS host name or HTTP host name or the instance hostname.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of the site.

    **Returns:**
    - the ID of the site.


---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns a descriptive name for the site.

    **Returns:**
    - a descriptive name for the site.


---

### getPageMetaTag(String)
- getPageMetaTag(id: [String](TopLevel.String.md)): [PageMetaTag](dw.web.PageMetaTag.md)
  - : Returns the page meta tag for the specified id.
      
      
      The meta tag content is generated based on the home page meta tag context and rule.
      The rule is obtained from the current repository domain.
      
      
      Null will be returned if the meta tag is undefined on the current instance, or if no rule can be found for the
      current context, or if the rule resolves to an empty string.


    **Parameters:**
    - id - the ID to get the page meta tag for

    **Returns:**
    - page meta tag containing content generated based on rules


---

### getPageMetaTags()
- getPageMetaTags(): [Array](TopLevel.Array.md)
  - : Returns all page meta tags, defined for this instance for which content can be generated.
      
      
      The meta tag content is generated based on the home page meta tag context and rules.
      The rules are obtained from the current repository domain.


    **Returns:**
    - page meta tags defined for this instance, containing content generated based on rules


---

### getPreferences()
- getPreferences(): [SitePreferences](dw.system.SitePreferences.md)
  - : This method returns a container of all site preferences of this site.

    **Returns:**
    - a preferences object containing all system and custom site
              preferences of this site



---

### getStatus()
- getStatus(): [Number](TopLevel.Number.md)
  - : Returns the status of this site.
      
      
      Possible values are [SITE_STATUS_ONLINE](dw.system.Site.md#site_status_online), [SITE_STATUS_MAINTENANCE](dw.system.Site.md#site_status_maintenance), [SITE_STATUS_PROTECTED](dw.system.Site.md#site_status_protected)


    **Returns:**
    - Status of the this site.


---

### getTimezone()
- getTimezone(): [String](TopLevel.String.md)
  - : Returns the code for the time zone in which the storefront is
      running.


    **Returns:**
    - time zone code in which the storefront is
      running.



---

### getTimezoneOffset()
- getTimezoneOffset(): [Number](TopLevel.Number.md)
  - : Returns time zone offset in which the storefront is running.

    **Returns:**
    - time zone offset in which the storefront is running.


---

### isOMSEnabled()
- ~~isOMSEnabled(): [Boolean](TopLevel.Boolean.md)~~
  - : Whether oms is active in the current site. This depends on a general
      property which states whether oms is active for the server,
      and a site-dependent preference whether oms is available for the current site.


    **Returns:**
    - whether oms is active in the site


---

### setCustomPreferenceValue(String, Object)
- setCustomPreferenceValue(name: [String](TopLevel.String.md), value: [Object](TopLevel.Object.md)): void
  - : The method sets a value for a custom preference. The type of the value
      must match with the declared type of the preference definition.


    **Parameters:**
    - name - name of the preference
    - value - new value for the preference


---

<!-- prettier-ignore-end -->
