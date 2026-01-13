<!-- prettier-ignore-start -->
# Class LoopIterator

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.Iterator](dw.util.Iterator.md)
    - [dw.web.LoopIterator](dw.web.LoopIterator.md)

Iterator used in <ISLOOP> implementation. It defines properties used to determine loop status.
LoopIterator object is assigned to variable declared in "status" attribute of the <ISLOOP> tag.



## Property Summary

| Property | Description |
| --- | --- |
| [begin](#begin): [Number](TopLevel.Number.md) `(read-only)` | Return begin iteration index. |
| [count](#count): [Number](TopLevel.Number.md) `(read-only)` | Return iteration count, starting with 1. |
| [end](#end): [Number](TopLevel.Number.md) `(read-only)` | Return end iteration index. |
| [even](#even): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if count is an even value. |
| [first](#first): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the iterator is positioned at first iteratable item. |
| [index](#index): [Number](TopLevel.Number.md) `(read-only)` | Return iteration index, which is the position of the iterator in the underlying iteratable object. |
| [last](#last): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the iterator is positioned at last iteratable item. |
| [length](#length): [Number](TopLevel.Number.md) `(read-only)` | Return the length of the object. |
| [odd](#odd): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if count is an odd value. |
| [step](#step): [Number](TopLevel.Number.md) `(read-only)` | Return iterator step. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getBegin](dw.web.LoopIterator.md#getbegin)() | Return begin iteration index. |
| [getCount](dw.web.LoopIterator.md#getcount)() | Return iteration count, starting with 1. |
| [getEnd](dw.web.LoopIterator.md#getend)() | Return end iteration index. |
| [getIndex](dw.web.LoopIterator.md#getindex)() | Return iteration index, which is the position of the iterator in the underlying iteratable object. |
| [getLength](dw.web.LoopIterator.md#getlength)() | Return the length of the object. |
| [getStep](dw.web.LoopIterator.md#getstep)() | Return iterator step. |
| [isEven](dw.web.LoopIterator.md#iseven)() | Identifies if count is an even value. |
| [isFirst](dw.web.LoopIterator.md#isfirst)() | Identifies if the iterator is positioned at first iteratable item. |
| [isLast](dw.web.LoopIterator.md#islast)() | Identifies if the iterator is positioned at last iteratable item. |
| [isOdd](dw.web.LoopIterator.md#isodd)() | Identifies if count is an odd value. |

### Methods inherited from class Iterator

[asList](dw.util.Iterator.md#aslist), [asList](dw.util.Iterator.md#aslistnumber-number), [hasNext](dw.util.Iterator.md#hasnext), [next](dw.util.Iterator.md#next)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### begin
- begin: [Number](TopLevel.Number.md) `(read-only)`
  - : Return begin iteration index. By default begin index is 0.


---

### count
- count: [Number](TopLevel.Number.md) `(read-only)`
  - : Return iteration count, starting with 1.


---

### end
- end: [Number](TopLevel.Number.md) `(read-only)`
  - : Return end iteration index. By default end index equals 'length - 1', provided that length is determined.
      If length cannot be determined end index is -1.



---

### even
- even: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if count is an even value.


---

### first
- first: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the iterator is positioned at first iteratable item.


---

### index
- index: [Number](TopLevel.Number.md) `(read-only)`
  - : Return iteration index, which is the position of the iterator in the underlying iteratable object.
      Index is 0-based and is calculated according the following formula: Index = (Count - 1) \* Step.



---

### last
- last: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the iterator is positioned at last iteratable item.


---

### length
- length: [Number](TopLevel.Number.md) `(read-only)`
  - : Return the length of the object. If length cannot be determined, -1 is returned.


---

### odd
- odd: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if count is an odd value.


---

### step
- step: [Number](TopLevel.Number.md) `(read-only)`
  - : Return iterator step.


---

## Method Details

### getBegin()
- getBegin(): [Number](TopLevel.Number.md)
  - : Return begin iteration index. By default begin index is 0.

    **Returns:**
    - the begin iteration index.


---

### getCount()
- getCount(): [Number](TopLevel.Number.md)
  - : Return iteration count, starting with 1.

    **Returns:**
    - the iteration count.


---

### getEnd()
- getEnd(): [Number](TopLevel.Number.md)
  - : Return end iteration index. By default end index equals 'length - 1', provided that length is determined.
      If length cannot be determined end index is -1.



---

### getIndex()
- getIndex(): [Number](TopLevel.Number.md)
  - : Return iteration index, which is the position of the iterator in the underlying iteratable object.
      Index is 0-based and is calculated according the following formula: Index = (Count - 1) \* Step.


    **Returns:**
    - the iteration index.


---

### getLength()
- getLength(): [Number](TopLevel.Number.md)
  - : Return the length of the object. If length cannot be determined, -1 is returned.

    **Returns:**
    - the length of the object


---

### getStep()
- getStep(): [Number](TopLevel.Number.md)
  - : Return iterator step.

    **Returns:**
    - the iterator step.


---

### isEven()
- isEven(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if count is an even value.

    **Returns:**
    - true if count is even, false otherwise.


---

### isFirst()
- isFirst(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the iterator is positioned at first iteratable item.

    **Returns:**
    - true if the iterator is at first item, false otherwise.


---

### isLast()
- isLast(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the iterator is positioned at last iteratable item.

    **Returns:**
    - true if iterator is at last item, false otherwise.


---

### isOdd()
- isOdd(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if count is an odd value.

    **Returns:**
    - true if count is odd, false otherwise.


---

<!-- prettier-ignore-end -->
