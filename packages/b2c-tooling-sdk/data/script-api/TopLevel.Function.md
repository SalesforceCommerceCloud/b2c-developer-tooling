<!-- prettier-ignore-start -->
# Class Function

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.Function](TopLevel.Function.md)

The Function class represent a JavaScript function.


## Property Summary

| Property | Description |
| --- | --- |
| [length](#length): [Number](TopLevel.Number.md) | The number of named arguments that were specified  when the function was declared. |
| [prototype](#prototype): [Object](TopLevel.Object.md) | An object that defines properties and methods  shared by all objects created with that  constructor function. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Function](#functionstring)([String...](TopLevel.String.md)) | Constructs the function with the specified arguments where the  last argument represents the function body and all preceeding arguments represent  the function parameters. |

## Method Summary

| Method | Description |
| --- | --- |
| [apply](TopLevel.Function.md#applyobject-array)([Object](TopLevel.Object.md), [Array](TopLevel.Array.md)) | Invokes this function as a method of the specified object  passing the specified Array of arguments. |
| [call](TopLevel.Function.md#callobject-object)([Object](TopLevel.Object.md), [Object...](TopLevel.Object.md)) | Invokes this function as a method of the specified object  passing the specified optional arguments. |
| [toString](TopLevel.Function.md#tostring)() | Returns a String representation of this function object. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### length
- length: [Number](TopLevel.Number.md)
  - : The number of named arguments that were specified
      when the function was declared.



---

### prototype
- prototype: [Object](TopLevel.Object.md)
  - : An object that defines properties and methods
      shared by all objects created with that
      constructor function.



---

## Constructor Details

### Function(String...)
- Function(args: [String...](TopLevel.String.md))
  - : Constructs the function with the specified arguments where the
      last argument represents the function body and all preceeding arguments represent
      the function parameters.


    **Parameters:**
    - args - one or more Strings where the last argument in the list  represents the function body and all preceeding arguments represent  the function parameters.


---

## Method Details

### apply(Object, Array)
- apply(thisobj: [Object](TopLevel.Object.md), args: [Array](TopLevel.Array.md)): [Object](TopLevel.Object.md)
  - : Invokes this function as a method of the specified object
      passing the specified Array of arguments.


    **Parameters:**
    - thisobj - the object to which the function is applied.
    - args - Array of values or an arguments object to be passed  as arguments to the function.

    **Returns:**
    - whatever value is returned by the invocation of the function.


---

### call(Object, Object...)
- call(thisobj: [Object](TopLevel.Object.md), args: [Object...](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Invokes this function as a method of the specified object
      passing the specified optional arguments.


    **Parameters:**
    - thisobj - the object to which the function is applied.
    - args - an optional list of one or more arguments values  that are passed as arguments  to the function.

    **Returns:**
    - whatever value is returned by the invocation of the function.


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns a String representation of this function object.

    **Returns:**
    - a String representation of this function object.


---

<!-- prettier-ignore-end -->
