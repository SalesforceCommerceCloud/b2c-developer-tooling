<!-- prettier-ignore-start -->
# Class ClickStream

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.ClickStream](dw.web.ClickStream.md)

Represents the click stream in the session. A maximum number of 50 clicks is
recorded per session. After the maximum is reached, each time the customer
clicks on a new link, the oldest click stream entry is purged. The
ClickStream always remembers the first click.


The click stream is consulted when the GetLastVisitedProducts pipelet is
called to retrieve the products that the customer has recently visited.



## Property Summary

| Property | Description |
| --- | --- |
| [clicks](#clicks): [List](dw.util.List.md) `(read-only)` | Returns a collection with all clicks. |
| [enabled](#enabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the clickstream recording is enabled or not. |
| [first](#first): [ClickStreamEntry](dw.web.ClickStreamEntry.md) `(read-only)` | Returns the first click within this session. |
| [last](#last): [ClickStreamEntry](dw.web.ClickStreamEntry.md) `(read-only)` | Returns the last recorded click stream, which is also typically  the current click. |
| [partial](#partial): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this is only a partial click stream. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getClicks](dw.web.ClickStream.md#getclicks)() | Returns a collection with all clicks. |
| [getFirst](dw.web.ClickStream.md#getfirst)() | Returns the first click within this session. |
| [getLast](dw.web.ClickStream.md#getlast)() | Returns the last recorded click stream, which is also typically  the current click. |
| [isEnabled](dw.web.ClickStream.md#isenabled)() | Identifies if the clickstream recording is enabled or not. |
| [isPartial](dw.web.ClickStream.md#ispartial)() | Identifies if this is only a partial click stream. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### clicks
- clicks: [List](dw.util.List.md) `(read-only)`
  - : Returns a collection with all clicks. The first entry is the oldest
      entry. The last entry is the latest entry. The method returns a copy of
      the click stream, which makes it safe to work with the click stream,
      while it might be modified.



---

### enabled
- enabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the clickstream recording is enabled or not.
      It is considered enabled if either:
      - the method [Session.isTrackingAllowed()](dw.system.Session.md#istrackingallowed)returns true
      - or if the above method returns false but the preference 'ClickstreamHonorDNT' is set to false.
      
      When clickstream tracking is not enabled the [getFirst()](dw.web.ClickStream.md#getfirst) method still operates as expected
      but the rest of the clicks are not collected.



---

### first
- first: [ClickStreamEntry](dw.web.ClickStreamEntry.md) `(read-only)`
  - : Returns the first click within this session. This first click
      is stored independent of whether entries are purged.



---

### last
- last: [ClickStreamEntry](dw.web.ClickStreamEntry.md) `(read-only)`
  - : Returns the last recorded click stream, which is also typically
      the current click. In where rare cases (e.g. RedirectURL pipeline) this
      is not the current click, but instead the last recorded click.



---

### partial
- partial: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this is only a partial click stream. If the maximum number
      of clicks (50) is recorded, the oldest entry is automatically purged with
      each additional click. In this case, this flag indicates that the click
      stream is only partial.



---

## Method Details

### getClicks()
- getClicks(): [List](dw.util.List.md)
  - : Returns a collection with all clicks. The first entry is the oldest
      entry. The last entry is the latest entry. The method returns a copy of
      the click stream, which makes it safe to work with the click stream,
      while it might be modified.


    **Returns:**
    - a collection of ClickStreamEntry instances, sorted
              chronologically.



---

### getFirst()
- getFirst(): [ClickStreamEntry](dw.web.ClickStreamEntry.md)
  - : Returns the first click within this session. This first click
      is stored independent of whether entries are purged.


    **Returns:**
    - the first click within this session.


---

### getLast()
- getLast(): [ClickStreamEntry](dw.web.ClickStreamEntry.md)
  - : Returns the last recorded click stream, which is also typically
      the current click. In where rare cases (e.g. RedirectURL pipeline) this
      is not the current click, but instead the last recorded click.


    **Returns:**
    - the last recorded click stream, which is also typically
      the current click.



---

### isEnabled()
- isEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the clickstream recording is enabled or not.
      It is considered enabled if either:
      - the method [Session.isTrackingAllowed()](dw.system.Session.md#istrackingallowed)returns true
      - or if the above method returns false but the preference 'ClickstreamHonorDNT' is set to false.
      
      When clickstream tracking is not enabled the [getFirst()](dw.web.ClickStream.md#getfirst) method still operates as expected
      but the rest of the clicks are not collected.


    **Returns:**
    - whether clickstream tracking is enabled


---

### isPartial()
- isPartial(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this is only a partial click stream. If the maximum number
      of clicks (50) is recorded, the oldest entry is automatically purged with
      each additional click. In this case, this flag indicates that the click
      stream is only partial.


    **Returns:**
    - true if this click stream is partial, false otherwise.


---

<!-- prettier-ignore-end -->
