<!-- prettier-ignore-start -->
# Class Symbol

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.Symbol](TopLevel.Symbol.md)

Symbol is a primitive data type that can serve as object properties.
Symbol instance can be created explicitly or via a global registry, see [for(String)](TopLevel.Symbol.md#forstring---variant-1).


**API Version:**
:::note
Available from version 21.2.
:::

## Constant Summary

| Constant | Description |
| --- | --- |
| [hasInstance](#hasinstance): [Symbol](TopLevel.Symbol.md) | The symbol used by `instanceof`. |
| [isConcatSpreadable](#isconcatspreadable): [Symbol](TopLevel.Symbol.md) | The symbol used by [Array.concat(Object...)](TopLevel.Array.md#concatobject). |
| [iterator](#iterator): [Symbol](TopLevel.Symbol.md) | The symbol used by `for...of`. |
| [match](#match): [Symbol](TopLevel.Symbol.md) | The symbol used by [String.match(RegExp)](TopLevel.String.md#matchregexp). |
| [replace](#replace): [Symbol](TopLevel.Symbol.md) | The symbol used by `String.replace()`. |
| [search](#search): [Symbol](TopLevel.Symbol.md) | The symbol used by [String.search(RegExp)](TopLevel.String.md#searchregexp). |
| [species](#species): [Symbol](TopLevel.Symbol.md) | The symbol used to create derived objects. |
| [split](#split): [Symbol](TopLevel.Symbol.md) | The symbol used by `String.split()`. |
| [toPrimitive](#toprimitive): [Symbol](TopLevel.Symbol.md) | The symbol used to convert an object to a primitive value. |
| [toStringTag](#tostringtag): [Symbol](TopLevel.Symbol.md) | The symbol used by [Object.toString()](TopLevel.Object.md#tostring). |
| [unscopables](#unscopables): [Symbol](TopLevel.Symbol.md) | The symbol used by `with`. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Symbol](#symbol)() | Creates a new symbol. |
| [Symbol](#symbolstring)([String](TopLevel.String.md)) | Creates a new symbol. |

## Method Summary

| Method | Description |
| --- | --- |
| static [for](TopLevel.Symbol.md#forstring---variant-1)([String](TopLevel.String.md)) | Obtains a symbol from the global registry. |
| static [keyFor](TopLevel.Symbol.md#keyforsymbol)([Symbol](TopLevel.Symbol.md)) | Returns the key within the global symbol registry under which the given symbol is stored. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### hasInstance

- hasInstance: [Symbol](TopLevel.Symbol.md)
  - : The symbol used by `instanceof`.


---

### isConcatSpreadable

- isConcatSpreadable: [Symbol](TopLevel.Symbol.md)
  - : The symbol used by [Array.concat(Object...)](TopLevel.Array.md#concatobject).


---

### iterator

- iterator: [Symbol](TopLevel.Symbol.md)
  - : The symbol used by `for...of`.


---

### match

- match: [Symbol](TopLevel.Symbol.md)
  - : The symbol used by [String.match(RegExp)](TopLevel.String.md#matchregexp).


---

### replace

- replace: [Symbol](TopLevel.Symbol.md)
  - : The symbol used by `String.replace()`.


---

### search

- search: [Symbol](TopLevel.Symbol.md)
  - : The symbol used by [String.search(RegExp)](TopLevel.String.md#searchregexp).


---

### species

- species: [Symbol](TopLevel.Symbol.md)
  - : The symbol used to create derived objects.


---

### split

- split: [Symbol](TopLevel.Symbol.md)
  - : The symbol used by `String.split()`.


---

### toPrimitive

- toPrimitive: [Symbol](TopLevel.Symbol.md)
  - : The symbol used to convert an object to a primitive value.


---

### toStringTag

- toStringTag: [Symbol](TopLevel.Symbol.md)
  - : The symbol used by [Object.toString()](TopLevel.Object.md#tostring).


---

### unscopables

- unscopables: [Symbol](TopLevel.Symbol.md)
  - : The symbol used by `with`.


---

## Constructor Details

### Symbol()
- Symbol()
  - : Creates a new symbol. Note that it must be called without `new`.
      Symbols created via this method are always distinct.



---

### Symbol(String)
- Symbol(description: [String](TopLevel.String.md))
  - : Creates a new symbol. Note that it must be called without `new`.
      Symbols created via this method are always distinct.


    **Parameters:**
    - description - A description for this symbol.


---

## Method Details

### for(String) - Variant 1
- static for(key: [String](TopLevel.String.md)): [Symbol](TopLevel.Symbol.md)
  - : Obtains a symbol from the global registry. If no symbol exists for the key within the registry a new symbol is
      created and stored in the global registry.


    **Parameters:**
    - key - The key for a symbol within the global registry.

    **Returns:**
    - The found or newly created symbol.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### keyFor(Symbol)
- static keyFor(symbol: [Symbol](TopLevel.Symbol.md)): [String](TopLevel.String.md)
  - : Returns the key within the global symbol registry under which the given symbol is stored.

    **Parameters:**
    - symbol - The symbol to look for.

    **Returns:**
    - The key for the given symbol if the symbol is known to the global registry, else return `undefined`.


---

<!-- prettier-ignore-end -->
