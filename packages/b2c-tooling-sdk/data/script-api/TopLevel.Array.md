<!-- prettier-ignore-start -->
# Class Array

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.Array](TopLevel.Array.md)

An Array of items.


## Property Summary

| Property | Description |
| --- | --- |
| [length](#length): [Number](TopLevel.Number.md) | The length of the Array. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Array](#array)() | Constructs an Array. |
| [Array](#arraynumber)([Number](TopLevel.Number.md)) | Constructs an Array of the specified  length. |
| [Array](#arrayobject)([Object...](TopLevel.Object.md)) | Constructs an Array using the specified values. |

## Method Summary

| Method | Description |
| --- | --- |
| [concat](TopLevel.Array.md#concatobject)([Object...](TopLevel.Object.md)) | Constructs an Array by concatenating multiple values. |
| [copyWithin](TopLevel.Array.md#copywithinnumber-number-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Copies elements within this array. |
| [entries](TopLevel.Array.md#entries)() | Returns an iterator containing all index/value pairs of this array. |
| [every](TopLevel.Array.md#everyfunction)([Function](TopLevel.Function.md)) | Returns true if every element in this array satisfies the test  performed in the callback function. |
| [every](TopLevel.Array.md#everyfunction-object)([Function](TopLevel.Function.md), [Object](TopLevel.Object.md)) | Returns true if every element in the thisObject argument satisfies the  test performed in the callback function, false otherwise. |
| [fill](TopLevel.Array.md#fillobject-number-number)([Object](TopLevel.Object.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Sets multiple entries of this array to specific value. |
| [filter](TopLevel.Array.md#filterfunction)([Function](TopLevel.Function.md)) | Returns a new Array with all of the elements that pass the test  implemented by the callback function. |
| [filter](TopLevel.Array.md#filterfunction-object)([Function](TopLevel.Function.md), [Object](TopLevel.Object.md)) | Returns a new Array with all of the elements that pass the test  implemented by the callback function that is run against the  specified Array, thisObject. |
| [find](TopLevel.Array.md#findfunction-object)([Function](TopLevel.Function.md), [Object](TopLevel.Object.md)) | Returns the first value within the array that satisfies the test  defined in the callback function. |
| [findIndex](TopLevel.Array.md#findindexfunction-object)([Function](TopLevel.Function.md), [Object](TopLevel.Object.md)) | Returns the index of the first value within the array that satisfies the test  defined in the callback function. |
| [forEach](TopLevel.Array.md#foreachfunction)([Function](TopLevel.Function.md)) | Runs the provided callback function once for each element present in  the Array. |
| [forEach](TopLevel.Array.md#foreachfunction-object)([Function](TopLevel.Function.md), [Object](TopLevel.Object.md)) | Runs the provided callback function once for each element present in  the specified Array, thisObject. |
| static [from](TopLevel.Array.md#fromobject-function-object)([Object](TopLevel.Object.md), [Function](TopLevel.Function.md), [Object](TopLevel.Object.md)) | Creates a new array from an array-like object or an [Iterable](TopLevel.Iterable.md). |
| [includes](TopLevel.Array.md#includesobject-number)([Object](TopLevel.Object.md), [Number](TopLevel.Number.md)) | Returns if the array contains a specific value. |
| [indexOf](TopLevel.Array.md#indexofobject)([Object](TopLevel.Object.md)) | Returns the first index at which a given element can be found in the  array, or -1 if it is not present. |
| [indexOf](TopLevel.Array.md#indexofobject-number)([Object](TopLevel.Object.md), [Number](TopLevel.Number.md)) | Returns the first index at which a given element can be found in the  array starting at fromIndex, or -1 if it is not present. |
| static [isArray](TopLevel.Array.md#isarrayobject)([Object](TopLevel.Object.md)) | Checks if the passed object is an array. |
| [join](TopLevel.Array.md#join)() | Converts all Array elements to Strings and concatenates them. |
| [join](TopLevel.Array.md#joinstring)([String](TopLevel.String.md)) | Converts all array elements to Strings and concatenates them. |
| [keys](TopLevel.Array.md#keys)() | Returns an iterator containing all indexes of this array. |
| [lastIndexOf](TopLevel.Array.md#lastindexofobject)([Object](TopLevel.Object.md)) | Returns the last index at which a given element can be found in the  array, or -1 if it is not present. |
| [lastIndexOf](TopLevel.Array.md#lastindexofobject-number)([Object](TopLevel.Object.md), [Number](TopLevel.Number.md)) | Returns the last index at which a given element can be found in the  array starting at fromIndex, or -1 if it is not present. |
| [map](TopLevel.Array.md#mapfunction)([Function](TopLevel.Function.md)) | Creates a new Array with the results of calling the specified function  on every element in this Array. |
| [map](TopLevel.Array.md#mapfunction-object)([Function](TopLevel.Function.md), [Object](TopLevel.Object.md)) | Creates a new Array with the results of calling the specified function  on every element in the specified Array. |
| static [of](TopLevel.Array.md#ofobject)([Object...](TopLevel.Object.md)) | Creates a new array from a variable list of elements. |
| [pop](TopLevel.Array.md#pop)() | Removes and returns the last element of the Array. |
| [push](TopLevel.Array.md#pushobject)([Object...](TopLevel.Object.md)) | Appends elements to the Array. |
| [reverse](TopLevel.Array.md#reverse)() | Reverses the order of the elements in the Array. |
| [shift](TopLevel.Array.md#shift)() | Shifts elements down in the Array and returns the  former first element. |
| [slice](TopLevel.Array.md#slicenumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Returns a new Array containing a portion of the  Array using the specified start and end positions. |
| [some](TopLevel.Array.md#somefunction)([Function](TopLevel.Function.md)) | Returns true if any of the elements in the Array pass the test  defined in the callback function, false otherwise. |
| [some](TopLevel.Array.md#somefunction-object)([Function](TopLevel.Function.md), [Object](TopLevel.Object.md)) | Returns true if any of the elements in the specified Array pass the test  defined in the callback function, false otherwise. |
| [sort](TopLevel.Array.md#sort)() | Sorts the elements of the Array in alphabetical order based on character encoding. |
| [sort](TopLevel.Array.md#sortfunction)([Function](TopLevel.Function.md)) | Sorts the elements of the Array in alphabetical  order based on character encoding. |
| [splice](TopLevel.Array.md#splicenumber-number-object)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [Object...](TopLevel.Object.md)) | Deletes the specified number of elements from the Array at the specified position,  and then inserts values into the Array at that location. |
| [toLocaleString](TopLevel.Array.md#tolocalestring)() | Converts the Array to a localized String. |
| [toString](TopLevel.Array.md#tostring)() | Converts the Array to a String. |
| [unshift](TopLevel.Array.md#unshiftobject)([Object...](TopLevel.Object.md)) | Inserts elements at the beginning of the Array. |
| [values](TopLevel.Array.md#values)() | Returns an iterator containing all values of this array. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### length
- length: [Number](TopLevel.Number.md)
  - : The length of the Array.


---

## Constructor Details

### Array()
- Array()
  - : Constructs an Array.


---

### Array(Number)
- Array(length: [Number](TopLevel.Number.md))
  - : Constructs an Array of the specified
      length.


    **Parameters:**
    - length - the length of the Array.


---

### Array(Object...)
- Array(values: [Object...](TopLevel.Object.md))
  - : Constructs an Array using the specified values.

    **Parameters:**
    - values - zero or more values that are stored in the Array.


---

## Method Details

### concat(Object...)
- concat(values: [Object...](TopLevel.Object.md)): [Array](TopLevel.Array.md)
  - : Constructs an Array by concatenating multiple values.

    **Parameters:**
    - values - one or more Array values.

    **Returns:**
    - a new Array containing the concatenated values.


---

### copyWithin(Number, Number, Number)
- copyWithin(target: [Number](TopLevel.Number.md), start: [Number](TopLevel.Number.md), end: [Number](TopLevel.Number.md)): [Array](TopLevel.Array.md)
  - : Copies elements within this array. The array length is not changed.

    **Parameters:**
    - target - The target of the first element to copy.
    - start - Optional. The first index to copy. Default is 0.
    - end - Optional. The index of the end. This element is not included. Default is copy all to the array end.

    **Returns:**
    - This array.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### entries()
- entries(): [ES6Iterator](TopLevel.ES6Iterator.md)
  - : Returns an iterator containing all index/value pairs of this array.
      The iterator produces a series of two-element arrays with the first element as the index and the second element as the value.


    **API Version:**
:::note
Available from version 21.2.
:::

---

### every(Function)
- every(callback: [Function](TopLevel.Function.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if every element in this array satisfies the test
      performed in the callback function.  The callback function is
      invoked with three arguments: the value of the element,
      the index of the element, and the Array object being traversed.


    **Parameters:**
    - callback - the function to call to determine if every element  in this array satisfies the test defined by the function.  The callback function is  invoked with three arguments: the value of the element,  the index of the element, and the Array object being traversed.

    **Returns:**
    - true if every element in this array satisfies the test
      performed in the callback function.


    **See Also:**
    - [Function](TopLevel.Function.md)


---

### every(Function, Object)
- every(callback: [Function](TopLevel.Function.md), thisObject: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if every element in the thisObject argument satisfies the
      test performed in the callback function, false otherwise.
      The callback function is invoked with three arguments: the value of the
      element, the index of the element, and the Array object being traversed.


    **Parameters:**
    - callback - the function to call to determine if every element  in this array satisfies the test defined by the function. The callback  function is invoked with three arguments: the value of the element,  the index of the element, and the Array object being traversed.
    - thisObject - the Object to use as 'this' when executing callback.

    **Returns:**
    - true if every element in thisObject satisfies the test
      performed in the callback function, false otherwise.


    **See Also:**
    - [Function](TopLevel.Function.md)


---

### fill(Object, Number, Number)
- fill(value: [Object](TopLevel.Object.md), start: [Number](TopLevel.Number.md), end: [Number](TopLevel.Number.md)): [Array](TopLevel.Array.md)
  - : Sets multiple entries of this array to specific value.

    **Parameters:**
    - value - The value to set.
    - start - Optional. The first index to copy. Default is 0.
    - end - Optional. The index of the end. This element is not included. Default is copy all to the array end.

    **Returns:**
    - This array.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### filter(Function)
- filter(callback: [Function](TopLevel.Function.md)): [Array](TopLevel.Array.md)
  - : Returns a new Array with all of the elements that pass the test
      implemented by the callback function. The callback function is
      invoked with three arguments: the value of the element,
      the index of the element, and the Array object being traversed.


    **Parameters:**
    - callback - the function that is called on this Array and  which returns a new Array containing the elements that satisfy the  function's test. The callback function is  invoked with three arguments: the value of the element,  the index of the element, and the Array object being traversed.

    **Returns:**
    - a new Array containing the elements that satisfy the
      function's test.



---

### filter(Function, Object)
- filter(callback: [Function](TopLevel.Function.md), thisObject: [Object](TopLevel.Object.md)): [Array](TopLevel.Array.md)
  - : Returns a new Array with all of the elements that pass the test
      implemented by the callback function that is run against the
      specified Array, thisObject. The callback function is
      invoked with three arguments: the value of the element,
      the index of the element, and the Array object being traversed.


    **Parameters:**
    - callback - the function that is called on the thisObject Array and  which returns a new Array containing the elements that satisfy the  function's test. The callback function is  invoked with three arguments: the value of the element,  the index of the element, and the Array object being traversed.
    - thisObject - the Object to use as 'this' when executing callback.

    **Returns:**
    - a new Array containing the elements that satisfy the
      function's test.



---

### find(Function, Object)
- find(callback: [Function](TopLevel.Function.md), thisObject: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Returns the first value within the array that satisfies the test
      defined in the callback function.


    **Parameters:**
    - callback - The function to call, which is invoked with three  arguments: the value of the element, the index of the element, and the  Array object being traversed.
    - thisObject - The object to use as 'this' when executing callback.

    **Returns:**
    - The first value within the array that satisfies the test
      defined in the callback function, `undefined` if no matching value was found.


    **API Version:**
:::note
Available from version 21.2.
:::

---

### findIndex(Function, Object)
- findIndex(callback: [Function](TopLevel.Function.md), thisObject: [Object](TopLevel.Object.md)): [Number](TopLevel.Number.md)
  - : Returns the index of the first value within the array that satisfies the test
      defined in the callback function.


    **Parameters:**
    - callback - The function to call, which is invoked with three  arguments: the value of the element, the index of the element, and the  Array object being traversed.
    - thisObject - The object to use as 'this' when executing callback.

    **Returns:**
    - The index of the first value within the array that satisfies the test
      defined in the callback function, `-1` if no matching value was found.


    **API Version:**
:::note
Available from version 21.2.
:::

---

### forEach(Function)
- forEach(callback: [Function](TopLevel.Function.md)): void
  - : Runs the provided callback function once for each element present in
      the Array. The callback function is invoked only for indexes of the
      Array which have assigned values; it is not invoked for indexes which
      have been deleted or which have never been assigned a value.


    **Parameters:**
    - callback - the function to call, which is invoked with three  arguments: the value of the element, the index of the element, and the  Array object being traversed.


---

### forEach(Function, Object)
- forEach(callback: [Function](TopLevel.Function.md), thisObject: [Object](TopLevel.Object.md)): void
  - : Runs the provided callback function once for each element present in
      the specified Array, thisObject. The callback function is invoked only
      for indexes of the Array which have assigned values; it is not invoked
      for indexes which have been deleted or which have never been assigned
      a value.


    **Parameters:**
    - callback - the function to call, which is invoked with three  arguments: the value of the element, the index of the element, and the  Array object being traversed.
    - thisObject - the Object to use as 'this' when executing callback.


---

### from(Object, Function, Object)
- static from(arrayLike: [Object](TopLevel.Object.md), mapFn: [Function](TopLevel.Function.md), thisObject: [Object](TopLevel.Object.md)): [Array](TopLevel.Array.md)
  - : Creates a new array from an array-like object or an [Iterable](TopLevel.Iterable.md).

    **Parameters:**
    - arrayLike - An array-like object or an iterable that provides the elements for the new array.
    - mapFn - Optional. A function that maps the input elements into the value for the new array.
    - thisObject - Optional. The Object to use as 'this' when executing mapFn.

    **Returns:**
    - The newly created array.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### includes(Object, Number)
- includes(valueToFind: [Object](TopLevel.Object.md), fromIndex: [Number](TopLevel.Number.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns if the array contains a specific value.

    **Parameters:**
    - valueToFind - The value to look for.
    - fromIndex - Optional. The index to start from.

    **Returns:**
    - `true` if the value is found in the array else `false`.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### indexOf(Object)
- indexOf(elementToLocate: [Object](TopLevel.Object.md)): [Number](TopLevel.Number.md)
  - : Returns the first index at which a given element can be found in the
      array, or -1 if it is not present.


    **Parameters:**
    - elementToLocate - the element to locate in the Array.

    **Returns:**
    - the index of the element or -1 if it is no preset.


---

### indexOf(Object, Number)
- indexOf(elementToLocate: [Object](TopLevel.Object.md), fromIndex: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the first index at which a given element can be found in the
      array starting at fromIndex, or -1 if it is not present.


    **Parameters:**
    - elementToLocate - the element to locate in the Array.
    - fromIndex - the index from which to start looking for the element.

    **Returns:**
    - the index of the element or -1 if it is no preset.


---

### isArray(Object)
- static isArray(object: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Checks if the passed object is an array.

    **Parameters:**
    - object - The object to ckeck.

    **Returns:**
    - `true` if the passed object is an array else `false`.


---

### join()
- join(): [String](TopLevel.String.md)
  - : Converts all Array elements to Strings and concatenates them.

    **Returns:**
    - a concatenated list of all Array elements as a String.


---

### join(String)
- join(separator: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Converts all array elements to Strings and concatenates them.

    **Parameters:**
    - separator - an optional character or string used to separate one element  of the Array from the next element in the return String.

    **Returns:**
    - a concatenated list of all Array elements as a String where the
      specified delimiter is used to separate elements.



---

### keys()
- keys(): [ES6Iterator](TopLevel.ES6Iterator.md)
  - : Returns an iterator containing all indexes of this array.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### lastIndexOf(Object)
- lastIndexOf(elementToLocate: [Object](TopLevel.Object.md)): [Number](TopLevel.Number.md)
  - : Returns the last index at which a given element can be found in the
      array, or -1 if it is not present. The array is searched backwards.


    **Parameters:**
    - elementToLocate - the element to locate in the Array.

    **Returns:**
    - the index of the element or -1 if it is no preset.


---

### lastIndexOf(Object, Number)
- lastIndexOf(elementToLocate: [Object](TopLevel.Object.md), fromIndex: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the last index at which a given element can be found in the
      array starting at fromIndex, or -1 if it is not present.
      The array is searched backwards.


    **Parameters:**
    - elementToLocate - the element to locate in the Array.
    - fromIndex - the index from which to start looking for the element.  The array is searched backwards.

    **Returns:**
    - the index of the element or -1 if it is no present.


---

### map(Function)
- map(callback: [Function](TopLevel.Function.md)): [Array](TopLevel.Array.md)
  - : Creates a new Array with the results of calling the specified function
      on every element in this Array. The callback function is invoked only
      for indexes of the Array which have assigned values; it is not invoked
      for indexes which have been deleted or which have never been assigned
      values.


    **Parameters:**
    - callback - the function to call, which is invoked with three  arguments: the value of the element, the index of the element, and the  Array object being traversed.

    **Returns:**
    - a new Array with the results of calling the specified function
      on every element in this Array.



---

### map(Function, Object)
- map(callback: [Function](TopLevel.Function.md), thisObject: [Object](TopLevel.Object.md)): [Array](TopLevel.Array.md)
  - : Creates a new Array with the results of calling the specified function
      on every element in the specified Array. The callback function is invoked only
      for indexes of the Array which have assigned values; it is not invoked
      for indexes which have been deleted or which have never been assigned
      values.


    **Parameters:**
    - callback - the function to call, which is invoked with three  arguments: the value of the element, the index of the element, and the  Array object being traversed.
    - thisObject - the Object to use as 'this' when executing callback.

    **Returns:**
    - a new Array with the results of calling the specified function
      on every element in this Array.



---

### of(Object...)
- static of(values: [Object...](TopLevel.Object.md)): [Array](TopLevel.Array.md)
  - : Creates a new array from a variable list of elements.

    **Parameters:**
    - values - The array values.

    **Returns:**
    - The newly created array.

    **API Version:**
:::note
Available from version 21.2.
:::

---

### pop()
- pop(): [Object](TopLevel.Object.md)
  - : Removes and returns the last element of the Array.

    **Returns:**
    - the last element of the Array.


---

### push(Object...)
- push(values: [Object...](TopLevel.Object.md)): [Number](TopLevel.Number.md)
  - : Appends elements to the Array.

    **Parameters:**
    - values - one or more values that will be appended to the Array.

    **Returns:**
    - the new length of the Array.


---

### reverse()
- reverse(): void
  - : Reverses the order of the elements in the Array.


---

### shift()
- shift(): [Object](TopLevel.Object.md)
  - : Shifts elements down in the Array and returns the
      former first element.


    **Returns:**
    - the former first element.


---

### slice(Number, Number)
- slice(start: [Number](TopLevel.Number.md), end: [Number](TopLevel.Number.md)): [Array](TopLevel.Array.md)
  - : Returns a new Array containing a portion of the
      Array using the specified start and end positions.


    **Parameters:**
    - start - the location in the Array to start the slice  operation.
    - end - the location in the Array to stop the slice  operation.

    **Returns:**
    - a new Array containing the members bound by
      start and end.



---

### some(Function)
- some(callback: [Function](TopLevel.Function.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if any of the elements in the Array pass the test
      defined in the callback function, false otherwise.


    **Parameters:**
    - callback - the function to call, which is invoked with three  arguments: the value of the element, the index of the element, and the  Array object being traversed.

    **Returns:**
    - true if any of the elements in the Array pass the test
      defined in the callback function, false otherwise.



---

### some(Function, Object)
- some(callback: [Function](TopLevel.Function.md), thisObject: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if any of the elements in the specified Array pass the test
      defined in the callback function, false otherwise.


    **Parameters:**
    - callback - the function to call, which is invoked with three  arguments: the value of the element, the index of the element, and the  Array object being traversed.
    - thisObject - the Object to use as 'this' when executing callback.

    **Returns:**
    - true if any of the elements in the Array pass the test
      defined in the callback function, false otherwise.



---

### sort()
- sort(): [Array](TopLevel.Array.md)
  - : Sorts the elements of the Array in alphabetical order based on character encoding.
      
      
      This sort is guaranteed to be _stable_: equal elements will not be reordered as a result of the sort.


    **Returns:**
    - a reference to the Array.


---

### sort(Function)
- sort(function: [Function](TopLevel.Function.md)): [Array](TopLevel.Array.md)
  - : Sorts the elements of the Array in alphabetical
      order based on character encoding.
      
      
      
      This sort is guaranteed to be _stable_: equal elements will not be reordered as a result of the sort.


    **Parameters:**
    - function - a Function used to specify the sorting  order.

    **Returns:**
    - a reference to the Array.

    **See Also:**
    - [Function](TopLevel.Function.md)


---

### splice(Number, Number, Object...)
- splice(start: [Number](TopLevel.Number.md), deleteCount: [Number](TopLevel.Number.md), values: [Object...](TopLevel.Object.md)): [Array](TopLevel.Array.md)
  - : Deletes the specified number of elements from the Array at the specified position,
      and then inserts values into the Array at that location.


    **Parameters:**
    - start - the start location.
    - deleteCount - the number of items to delete.
    - values - zero or more values to be inserted into the Array.


---

### toLocaleString()
- toLocaleString(): [String](TopLevel.String.md)
  - : Converts the Array to a localized String.

    **Returns:**
    - a localized String representing the Array.


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Converts the Array to a String.

    **Returns:**
    - a String representation of the Array.


---

### unshift(Object...)
- unshift(values: [Object...](TopLevel.Object.md)): [Number](TopLevel.Number.md)
  - : Inserts elements at the beginning of the Array.

    **Parameters:**
    - values - one or more vales that will be inserted  into the beginning of the Array.

    **Returns:**
    - the new length of the Array.


---

### values()
- values(): [ES6Iterator](TopLevel.ES6Iterator.md)
  - : Returns an iterator containing all values of this array.

    **API Version:**
:::note
Available from version 21.2.
:::

---

<!-- prettier-ignore-end -->
