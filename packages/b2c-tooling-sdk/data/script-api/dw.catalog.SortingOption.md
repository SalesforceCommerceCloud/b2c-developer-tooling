<!-- prettier-ignore-start -->
# Class SortingOption

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.catalog.SortingOption](dw.catalog.SortingOption.md)

Represents an option for how to sort products in storefront search results.


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the sorting option. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Returns the description of the sorting option for the current locale. |
| [displayName](#displayname): [String](TopLevel.String.md) `(read-only)` | Returns the display name of the of the sorting option for the current locale. |
| [sortingRule](#sortingrule): [SortingRule](dw.catalog.SortingRule.md) `(read-only)` | Returns the sorting rule for this sorting option,  or `null` if there is no associated rule. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getDescription](dw.catalog.SortingOption.md#getdescription)() | Returns the description of the sorting option for the current locale. |
| [getDisplayName](dw.catalog.SortingOption.md#getdisplayname)() | Returns the display name of the of the sorting option for the current locale. |
| [getID](dw.catalog.SortingOption.md#getid)() | Returns the ID of the sorting option. |
| [getSortingRule](dw.catalog.SortingOption.md#getsortingrule)() | Returns the sorting rule for this sorting option,  or `null` if there is no associated rule. |

### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the sorting option.


---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Returns the description of the sorting option for the current locale.


---

### displayName
- displayName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the display name of the of the sorting option for the current locale.


---

### sortingRule
- sortingRule: [SortingRule](dw.catalog.SortingRule.md) `(read-only)`
  - : Returns the sorting rule for this sorting option,
      or `null` if there is no associated rule.



---

## Method Details

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the description of the sorting option for the current locale.

    **Returns:**
    - The value of the property for the current locale, or null if it
              wasn't found.



---

### getDisplayName()
- getDisplayName(): [String](TopLevel.String.md)
  - : Returns the display name of the of the sorting option for the current locale.

    **Returns:**
    - The value of the property for the current locale, or null if it
              wasn't found.



---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of the sorting option.

    **Returns:**
    - sorting option ID


---

### getSortingRule()
- getSortingRule(): [SortingRule](dw.catalog.SortingRule.md)
  - : Returns the sorting rule for this sorting option,
      or `null` if there is no associated rule.


    **Returns:**
    - a ProductSortingRule instance representing the rule
      for this option or null.



---

<!-- prettier-ignore-end -->
