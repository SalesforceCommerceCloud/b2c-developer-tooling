<!-- prettier-ignore-start -->
# Class PropertyComparator

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.PropertyComparator](dw.util.PropertyComparator.md)

This comparator can be used for the List sort() methods and for the SortSet
and SortedMap classes. The comparator can be used to make a comparison based
on a property of the contained objects. The Comparison is done based on the
natural order of the values. It is guaranteed to work for Numbers, Strings,
Dates, Money and Quantity values.



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [PropertyComparator](#propertycomparatorstring-string)([String](TopLevel.String.md), [String...](TopLevel.String.md)) | Constructs the comparator from the variable length argument list. |
| [PropertyComparator](#propertycomparatorstring-boolean)([String](TopLevel.String.md), [Boolean](TopLevel.Boolean.md)) | Constructs the comparator. |
| [PropertyComparator](#propertycomparatorstring-boolean-boolean)([String](TopLevel.String.md), [Boolean](TopLevel.Boolean.md), [Boolean](TopLevel.Boolean.md)) | Constructs the comparator. |

## Method Summary

| Method | Description |
| --- | --- |
| [compare](dw.util.PropertyComparator.md#compareobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Compares its two arguments for order. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### PropertyComparator(String, String...)
- PropertyComparator(property: [String](TopLevel.String.md), otherProperties: [String...](TopLevel.String.md))
  - : Constructs the comparator from the variable length argument list. The
      parameters are property names that are to be used for the comparison.
      When comparing two objects, the comparator first compares them by the
      first property. If the two objects have equal values for the first
      property, the comparator then compares them by the second property,
      etc, until one object is determined to be less than the other or they are
      equal. Each parameter must be either a simple name like "totalSum" or can
      be a reference to a custom attribute like "custom.mytotal". Each
      parameter may also be prefixed with an optional '+' or '-' character to
      indicate that the objects should be sorted ascending or descending
      respectively by that property. If not specified for a given property then
      '+' (ascending sort) is assumed.
      
      For example: new PropertyComparator("+prop1", "-prop2", "prop3")
      constructs a Comparator which sorts by prop1 ascending, prop2 descending,
      and finally prop3 ascending.
      
      The comparator created with this constructor treats null values as
      greater than any other value.


    **Parameters:**
    - property - The property name to compare by first.
    - otherProperties - Additional property names to sort by if two             objects have the same values for the first property.


---

### PropertyComparator(String, Boolean)
- PropertyComparator(propertyName: [String](TopLevel.String.md), sortOrder: [Boolean](TopLevel.Boolean.md))
  - : Constructs the comparator. The specified parameter is the name of the
      property that is used for the comparison. The parameter must be either a
      simple name like "totalSum" or can be a reference to a custom attribute
      like "custom.mytotal".
      
      The comparator created with this constructor is setup with ascending or
      descending sort order depending on value of sortOrder and null values
      being greater than any other value.


    **Parameters:**
    - propertyName - the name of the property that is used for the             comparison.
    - sortOrder - the sort order to use where true means ascending and             false means descending.


---

### PropertyComparator(String, Boolean, Boolean)
- PropertyComparator(propertyName: [String](TopLevel.String.md), sortOrder: [Boolean](TopLevel.Boolean.md), nullGreater: [Boolean](TopLevel.Boolean.md))
  - : Constructs the comparator. The specified parameter is the name of the
      property that is used for the comparison. The parameter must be either a
      simple name like "totalSum" or can be a reference to a custom attribute
      like "custom.mytotal".


    **Parameters:**
    - propertyName - the name of the property that is used for the             comparison.
    - sortOrder - the sort order to use where true means ascending and             false means descending.
    - nullGreater - true means null is greater than any other value


---

## Method Details

### compare(Object, Object)
- compare(arg1: [Object](TopLevel.Object.md), arg2: [Object](TopLevel.Object.md)): [Number](TopLevel.Number.md)
  - : Compares its two arguments for order. Returns a negative integer, zero,
      or a positive integer as the first argument is less than, equal to, or
      greater than the second. By default a null value is treated always
      greater than any other value. In the constructor of a PropertyComparator
      this default behavior can be changed.


    **Parameters:**
    - arg1 - the first object to compare.
    - arg2 - the second object to compare.

    **Returns:**
    - a negative integer, zero, or a positive integer as the first
              argument is less than, equal to, or greater than the second.



---

<!-- prettier-ignore-end -->
