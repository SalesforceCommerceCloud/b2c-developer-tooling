<!-- prettier-ignore-start -->
# Class ES6Iterator

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.ES6Iterator](TopLevel.ES6Iterator.md)

This isn't a built-in type. It describes the properties an object must have in order
to work as an iterator since ECMAScript 2015.


**API Version:**
:::note
Available from version 21.2.
:::

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [next](TopLevel.ES6Iterator.md#next)() | Returns an iterator result object. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### next()
- next(): [Object](TopLevel.Object.md)
  - : Returns an iterator result object.
      
      
      An iterator result object can have two properties: _done_ and _value_.
      If _done_ is `false` or `undefined`, then the _value_ property contains an iterator value.
      The _value_ property may not be present if the value would be `undefined`.
      
      
      After a call that returns a result where _done_ equals
      `true`, all subsequent calls must also return _done_ as `true`.



---

<!-- prettier-ignore-end -->
