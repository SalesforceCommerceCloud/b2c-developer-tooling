<!-- prettier-ignore-start -->
# Class Object

- [TopLevel.Object](TopLevel.Object.md)

The _Object_ object is the foundation of all native JavaScript objects. Also,
the _Object_ object can be used to generate items in your scripts with behaviors
that are defined by custom properties and/or methods. You generally start by creating
a blank object with the constructor function and then assign values to new properties
of that object.



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Object](#object)() | Object constructor. |

## Method Summary

| Method | Description |
| --- | --- |
| static [assign](TopLevel.Object.md#assignobject-object)([Object](TopLevel.Object.md), [Object...](TopLevel.Object.md)) | Copies the values of all of the enumerable own properties from one or more source objects to a target object. |
| static [create](TopLevel.Object.md#createobject)([Object](TopLevel.Object.md)) | Creates a new object based on a prototype object. |
| static [create](TopLevel.Object.md#createobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Creates a new object based on a prototype object and additional property definitions. |
| static [defineProperties](TopLevel.Object.md#definepropertiesobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Defines or modifies properties of the passed object. |
| static [defineProperty](TopLevel.Object.md#definepropertyobject-object-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Defines or modifies a single property of the passed object. |
| static [entries](TopLevel.Object.md#entriesobject)([Object](TopLevel.Object.md)) | Returns the enumerable property names and their values of the passed object. |
| static [freeze](TopLevel.Object.md#freezeobject)([Object](TopLevel.Object.md)) | Freezes the passed object. |
| static [fromEntries](TopLevel.Object.md#fromentriesiterable)([Iterable](TopLevel.Iterable.md)) | Creates a new object with defined properties. |
| static [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Returns the descriptor for a single property of the passed object. |
| static [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject)([Object](TopLevel.Object.md)) | Returns an arrays containing the names of all enumerable and non-enumerable properties owned by the passed object. |
| static [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject)([Object](TopLevel.Object.md)) | Returns an array containing the symbol of all symbol properties owned by the passed object. |
| static [getPrototypeOf](TopLevel.Object.md#getprototypeofobject)([Object](TopLevel.Object.md)) | Returns the prototype of the passed object. |
| [hasOwnProperty](TopLevel.Object.md#hasownpropertystring)([String](TopLevel.String.md)) | Returns Boolean true if at the time the current object's instance was created  its constructor (or literal assignment) contained a property with a name that  matches the parameter value. |
| static [is](TopLevel.Object.md#isobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Checks if the two values are equal in terms of being the same value. |
| static [isExtensible](TopLevel.Object.md#isextensibleobject)([Object](TopLevel.Object.md)) | Returns if new properties can be added to an object. |
| static [isFrozen](TopLevel.Object.md#isfrozenobject)([Object](TopLevel.Object.md)) | Returns if the object is frozen. |
| [isPrototypeOf](TopLevel.Object.md#isprototypeofobject)([Object](TopLevel.Object.md)) | Returns true if the current object and the object passed as a prameter conincide  at some point along each object's prototype inheritance chain. |
| static [isSealed](TopLevel.Object.md#issealedobject)([Object](TopLevel.Object.md)) | Returns if the object is sealed. |
| static [keys](TopLevel.Object.md#keysobject)([Object](TopLevel.Object.md)) | Returns the enumerable property names of the passed object. |
| static [preventExtensions](TopLevel.Object.md#preventextensionsobject)([Object](TopLevel.Object.md)) | Makes the passed object non-extensible. |
| [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring)([String](TopLevel.String.md)) | Return true if the specified property exposes itself to for/in property  inspection through the object. |
| static [seal](TopLevel.Object.md#sealobject)([Object](TopLevel.Object.md)) | Seals the passed object. |
| static [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Changes the prototype of the passed object. |
| [toLocaleString](TopLevel.Object.md#tolocalestring)() | Converts the object to a localized String. |
| [toString](TopLevel.Object.md#tostring)() | Converts the object to a String. |
| [valueOf](TopLevel.Object.md#valueof)() | Returns the object's value. |
| static [values](TopLevel.Object.md#valuesobject)([Object](TopLevel.Object.md)) | Returns the enumerable property values of the passed object. |

## Constructor Details

### Object()
- Object()
  - : Object constructor.


---

## Method Details

### assign(Object, Object...)
- static assign(target: [Object](TopLevel.Object.md), sources: [Object...](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Copies the values of all of the enumerable own properties from one or more source objects to a target object.

    **Parameters:**
    - target - The target object.
    - sources - The source objects.

    **Returns:**
    - The target object.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### create(Object)
- static create(prototype: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Creates a new object based on a prototype object.

    **Parameters:**
    - prototype - The prototype for the new object.

    **Returns:**
    - The newly created object.


---

### create(Object, Object)
- static create(prototype: [Object](TopLevel.Object.md), properties: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Creates a new object based on a prototype object and additional property definitions.
      The properties are given in the same format as described for [defineProperties(Object, Object)](TopLevel.Object.md#definepropertiesobject-object).


    **Parameters:**
    - prototype - The prototype for the new object.
    - properties - The property definitions.

    **Returns:**
    - The newly created object.


---

### defineProperties(Object, Object)
- static defineProperties(object: [Object](TopLevel.Object.md), properties: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Defines or modifies properties of the passed object.
      A descriptor for a property supports these properties: configurable, enumerable, value, writable, set and get.


    **Parameters:**
    - object - The object to change.
    - properties - The new property definitions.

    **Returns:**
    - The modified object.


---

### defineProperty(Object, Object, Object)
- static defineProperty(object: [Object](TopLevel.Object.md), propertyKey: [Object](TopLevel.Object.md), descriptor: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Defines or modifies a single property of the passed object.
      A descriptor for a property supports these properties: configurable, enumerable, value, writable, set and get.


    **Parameters:**
    - object - The object to change.
    - propertyKey - The property name.
    - descriptor - The property descriptor object.

    **Returns:**
    - The modified object.


---

### entries(Object)
- static entries(object: [Object](TopLevel.Object.md)): [Array](TopLevel.Array.md)
  - : Returns the enumerable property names and their values of the passed object.

    **Parameters:**
    - object - The object to get the enumerable property names from.

    **Returns:**
    - An array of key/value pairs ( as two element arrays ) that holds all the enumerable properties of the given object.

    **API Version:**
:::note
Available from version 22.7.
:::

---

### freeze(Object)
- static freeze(object: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Freezes the passed object. Properties can't be added or removed from the frozen object. Also, definitions of
      existing object properties can't be changed. Although property values are immutable, setters and getters can be
      called.


    **Parameters:**
    - object - The object to be frozen.

    **Returns:**
    - The frozen object.


---

### fromEntries(Iterable)
- static fromEntries(properties: [Iterable](TopLevel.Iterable.md)): [Object](TopLevel.Object.md)
  - : Creates a new object with defined properties. The properties are defined by an iterable that produces two element array like objects, which are the key-value pairs.
      Iterables are e.g. [Array](TopLevel.Array.md), [Map](TopLevel.Map.md) or any other [Iterable](TopLevel.Iterable.md).


    **Parameters:**
    - properties - The properties.

    **Returns:**
    - The newly created object.

    **API Version:**
:::note
Available from version 22.7.
:::

---

### getOwnPropertyDescriptor(Object, Object)
- static getOwnPropertyDescriptor(object: [Object](TopLevel.Object.md), propertyKey: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Returns the descriptor for a single property of the passed object.

    **Parameters:**
    - object - The property owning object.
    - propertyKey - The property to look for.

    **Returns:**
    - The descriptor object for the property or `undefined` if the property does not exist.


---

### getOwnPropertyNames(Object)
- static getOwnPropertyNames(object: [Object](TopLevel.Object.md)): [Array](TopLevel.Array.md)
  - : Returns an arrays containing the names of all enumerable and non-enumerable properties owned by the passed object.

    **Parameters:**
    - object - The object owning properties.

    **Returns:**
    - An array of strings that are the properties found directly in the passed object.


---

### getOwnPropertySymbols(Object)
- static getOwnPropertySymbols(object: [Object](TopLevel.Object.md)): [Array](TopLevel.Array.md)
  - : Returns an array containing the symbol of all symbol properties owned by the passed object.

    **Parameters:**
    - object - The object owning properties.

    **Returns:**
    - An array of symbol properties found directly in the passed object.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### getPrototypeOf(Object)
- static getPrototypeOf(object: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Returns the prototype of the passed object.

    **Parameters:**
    - object - The object to get the prototype from.

    **Returns:**
    - The prototype object or `null` if there is none.


---

### hasOwnProperty(String)
- hasOwnProperty(propName: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns Boolean true if at the time the current object's instance was created
      its constructor (or literal assignment) contained a property with a name that
      matches the parameter value.


    **Parameters:**
    - propName - the property name of the object's property.

    **Returns:**
    - true if at the object contains a property that matches the parameter,
      false otherwise.



---

### is(Object, Object)
- static is(value1: [Object](TopLevel.Object.md), value2: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Checks if the two values are equal in terms of being the same value. No coercion is performed, thus -0 and
      +0 is not equal and NaN is equal to NaN.


    **Parameters:**
    - value1 - The first value.
    - value2 - The second value.

    **Returns:**
    - `true` if both values are the same value else `false`.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### isExtensible(Object)
- static isExtensible(object: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns if new properties can be added to an object. By default new objects are extensible. The methods
      [freeze(Object)](TopLevel.Object.md#freezeobject), [seal(Object)](TopLevel.Object.md#sealobject) and [preventExtensions(Object)](TopLevel.Object.md#preventextensionsobject) make objects
      non-extensible.


    **Parameters:**
    - object - The object to check.

    **Returns:**
    - `true` if new properties can be added else `false`.


---

### isFrozen(Object)
- static isFrozen(object: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns if the object is frozen.

    **Parameters:**
    - object - The object to check.

    **Returns:**
    - `true` if the object is frozen else `false`.


---

### isPrototypeOf(Object)
- isPrototypeOf(prototype: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the current object and the object passed as a prameter conincide
      at some point along each object's prototype inheritance chain.


    **Parameters:**
    - prototype - the object to test.

    **Returns:**
    - true if the current object and the object passed as a prameter conincide
      at some point, false otherwise.



---

### isSealed(Object)
- static isSealed(object: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns if the object is sealed.

    **Parameters:**
    - object - The object to check.

    **Returns:**
    - `true` if the object is sealed else `false`.


---

### keys(Object)
- static keys(object: [Object](TopLevel.Object.md)): [Array](TopLevel.Array.md)
  - : Returns the enumerable property names of the passed object.

    **Parameters:**
    - object - The object to get the enumerable property names from.

    **Returns:**
    - An array of strings that holds all the enumerable properties of the given object.


---

### preventExtensions(Object)
- static preventExtensions(object: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Makes the passed object non-extensible. This means that no new properties can be added to this object.

    **Parameters:**
    - object - The object to make non-extensible.

    **Returns:**
    - The passed object.


---

### propertyIsEnumerable(String)
- propertyIsEnumerable(propName: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Return true if the specified property exposes itself to for/in property
      inspection through the object.


    **Parameters:**
    - propName - the property to test.

    **Returns:**
    - true if the specified property exposes itself to for/in property
      inspection through the object, false otherwise.



---

### seal(Object)
- static seal(object: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Seals the passed object. This means properties can't be added or removed. Also, property definitions of
      existing properties can't be changed.


    **Parameters:**
    - object - The object to be frozen.

    **Returns:**
    - The sealed object.


---

### setPrototypeOf(Object, Object)
- static setPrototypeOf(object: [Object](TopLevel.Object.md), prototype: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Changes the prototype of the passed object.

    **Parameters:**
    - object - The object whose prototype should change.
    - prototype - The object to set as the new prototype.

    **Returns:**
    - The object with the changed prototype.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### toLocaleString()
- toLocaleString(): [String](TopLevel.String.md)
  - : Converts the object to a localized String.

    **Returns:**
    - a localized version of the object.


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Converts the object to a String.

    **Returns:**
    - the String representation of the object.


---

### valueOf()
- valueOf(): [Object](TopLevel.Object.md)
  - : Returns the object's value.

    **Returns:**
    - the object's value.


---

### values(Object)
- static values(object: [Object](TopLevel.Object.md)): [Array](TopLevel.Array.md)
  - : Returns the enumerable property values of the passed object.

    **Parameters:**
    - object - The object to get the enumerable property values from.

    **Returns:**
    - An array of values that holds all the enumerable properties of the given object.

    **API Version:**
:::note
Available from version 22.7.
:::

---

<!-- prettier-ignore-end -->
