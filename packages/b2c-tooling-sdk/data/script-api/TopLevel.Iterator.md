<!-- prettier-ignore-start -->
# Class Iterator

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.Iterator](TopLevel.Iterator.md)

An Iterator is a special object that lets you access items from a 
collection one at a time, while keeping track of its current position 
within that sequence.



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Iterator](#iteratorobject)([Object](TopLevel.Object.md)) | Creates an Iterator instance for the specified object. |
| [Iterator](#iteratorobject-boolean)([Object](TopLevel.Object.md), [Boolean](TopLevel.Boolean.md)) | Creates an Iterator instance for the specified object's keys. |

## Method Summary

| Method | Description |
| --- | --- |
| [next](TopLevel.Iterator.md#next)() | Returns the next item in the iterator. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### Iterator(Object)
- Iterator(object: [Object](TopLevel.Object.md))
  - : Creates an Iterator instance for the specified object.
      The Iterator for the object is created by calling the 
      object's \_\_iterator\_\_ method. If there is no \_\_iterator\_\_ method, 
      a default iterator is created. The default iterator provides access to 
      the object's properties, according to the usual for...in and for 
      each...in model. 
      
      If you want to provide a custom iterator, you should override 
      the \_\_iterator\_\_ method to return an instance of your custom iterator.


    **Parameters:**
    - object - the object whose values will be accessible via the   Iterator.


---

### Iterator(Object, Boolean)
- Iterator(object: [Object](TopLevel.Object.md), keysOnly: [Boolean](TopLevel.Boolean.md))
  - : Creates an Iterator instance for the specified object's keys.
      The Iterator for the object is created by calling the 
      object's \_\_iterator\_\_ method. If there is no \_\_iterator\_\_ method, 
      a default iterator is created. The default iterator provides access to 
      the object's properties, according to the usual for...in and for 
      each...in model. 
      
      If you want to provide a custom iterator, you should override 
      the \_\_iterator\_\_ method to return an instance of your custom iterator.


    **Parameters:**
    - object - the object whose keys or values will be accessible   via the Iterator.
    - keysOnly - if true, provides access to the object's keys. If false,   provides access to the object's values.


---

## Method Details

### next()
- next(): [Object](TopLevel.Object.md)
  - : Returns the next item in the iterator. If there are no items left, 
      the StopIteration exception is thrown. You should generally use this method 
      in the context of a try...catch block to handle the StopIteration case.
      There is no guaranteed ordering of the data.


    **Returns:**
    - the next item in the iterator.

    **See Also:**
    - [StopIteration](TopLevel.StopIteration.md)


---

<!-- prettier-ignore-end -->
