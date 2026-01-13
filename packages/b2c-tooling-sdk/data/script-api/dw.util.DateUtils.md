<!-- prettier-ignore-start -->
# Class DateUtils

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.DateUtils](dw.util.DateUtils.md)

A class with several utility methods for Date objects.

**Deprecated:**
:::warning
See each method for additional information.
:::

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| ~~static [nowForInstance](dw.util.DateUtils.md#nowforinstance)()~~ | Returns the current time stamp in the time zone of the  instance. |
| ~~static [nowForSite](dw.util.DateUtils.md#nowforsite)()~~ | Returns the current timestamp in the time zone of the   current site. |
| ~~static [nowInUTC](dw.util.DateUtils.md#nowinutc)()~~ | Returns the current time stamp in UTC. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### nowForInstance()
- ~~static nowForInstance(): [Date](TopLevel.Date.md)~~
  - : Returns the current time stamp in the time zone of the
      instance.


    **Returns:**
    - the current time stamp in the time zone of the
      instance.


    **Deprecated:**
:::warning
Use [System.getCalendar()](dw.system.System.md#getcalendar) instead.
:::

---

### nowForSite()
- ~~static nowForSite(): [Date](TopLevel.Date.md)~~
  - : Returns the current timestamp in the time zone of the 
      current site.


    **Returns:**
    - the current timestamp in the time zone of the
      current site.


    **Deprecated:**
:::warning
Use [Site.getCalendar()](dw.system.Site.md#getcalendar) instead.
:::

---

### nowInUTC()
- ~~static nowInUTC(): [Date](TopLevel.Date.md)~~
  - : Returns the current time stamp in UTC.

    **Returns:**
    - the current time stamp in UTC.

    **Deprecated:**
:::warning
Create a new [Calendar](dw.util.Calendar.md) object and set
            the time zone "UTC" instead.

:::

---

<!-- prettier-ignore-end -->
