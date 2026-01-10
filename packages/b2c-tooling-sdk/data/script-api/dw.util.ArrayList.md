<!-- prettier-ignore-start -->
# Class ArrayList

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.Collection](dw.util.Collection.md)
    - [dw.util.List](dw.util.List.md)
      - [dw.util.ArrayList](dw.util.ArrayList.md)

The ArrayList class is a container for a list of objects.


## Constructor Summary

| Constructor | Description |
| --- | --- |
| [ArrayList](#arraylist)() | Constructor for a new ArrayList. |
| [ArrayList](#arraylistcollection)([Collection](dw.util.Collection.md)) | Constructor for a new ArrayList. |
| [ArrayList](#arraylistiterator)([Iterator](dw.util.Iterator.md)) | Constructor for a new ArrayList. |
| [ArrayList](#arraylistobject)([Object...](TopLevel.Object.md)) | Constructor for a new ArrayList. |

## Method Summary

| Method | Description |
| --- | --- |
| [clone](dw.util.ArrayList.md#clone)() | Returns a shallow copy of this array list. |

### Methods inherited from class List

[addAt](dw.util.List.md#addatnumber-object), [concat](dw.util.List.md#concatobject), [fill](dw.util.List.md#fillobject), [get](dw.util.List.md#getnumber), [indexOf](dw.util.List.md#indexofobject), [join](dw.util.List.md#join), [join](dw.util.List.md#joinstring), [lastIndexOf](dw.util.List.md#lastindexofobject), [pop](dw.util.List.md#pop), [push](dw.util.List.md#pushobject), [removeAt](dw.util.List.md#removeatnumber), [replaceAll](dw.util.List.md#replaceallobject-object), [reverse](dw.util.List.md#reverse), [rotate](dw.util.List.md#rotatenumber), [set](dw.util.List.md#setnumber-object), [shift](dw.util.List.md#shift), [shuffle](dw.util.List.md#shuffle), [size](dw.util.List.md#size), [slice](dw.util.List.md#slicenumber), [slice](dw.util.List.md#slicenumber-number), [sort](dw.util.List.md#sort), [sort](dw.util.List.md#sortobject), [subList](dw.util.List.md#sublistnumber-number), [swap](dw.util.List.md#swapnumber-number), [unshift](dw.util.List.md#unshiftobject)
### Methods inherited from class Collection

[add](dw.util.Collection.md#addobject), [add1](dw.util.Collection.md#add1object), [addAll](dw.util.Collection.md#addallcollection), [clear](dw.util.Collection.md#clear), [contains](dw.util.Collection.md#containsobject), [containsAll](dw.util.Collection.md#containsallcollection), [getLength](dw.util.Collection.md#getlength), [isEmpty](dw.util.Collection.md#isempty), [iterator](dw.util.Collection.md#iterator), [remove](dw.util.Collection.md#removeobject), [removeAll](dw.util.Collection.md#removeallcollection), [retainAll](dw.util.Collection.md#retainallcollection), [size](dw.util.Collection.md#size), [toArray](dw.util.Collection.md#toarray), [toArray](dw.util.Collection.md#toarraynumber-number)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### ArrayList()
- ArrayList()
  - : Constructor for a new ArrayList.


---

### ArrayList(Collection)
- ArrayList(collection: [Collection](dw.util.Collection.md))
  - : Constructor for a new ArrayList. The constructor initializes the
      ArrayList with the elements of the given collection.


    **Parameters:**
    - collection - the elements to insert into the list.


---

### ArrayList(Iterator)
- ArrayList(iterator: [Iterator](dw.util.Iterator.md))
  - : Constructor for a new ArrayList. The constructor initializes the
      ArrayList with the elements of the given iterator.


    **Parameters:**
    - iterator - the iterator that provides access to the elements to insert             into the list.


---

### ArrayList(Object...)
- ArrayList(values: [Object...](TopLevel.Object.md))
  - : Constructor for a new ArrayList. The constructor initializes the
      ArrayList with the arguments given as constructor parameters. The method
      can also be called with an ECMA array as argument.
      
      If called with a single ECMA array as argument the individual elements of
      that array are used to initialize the ArrayList. To create an ArrayList
      with a single array as element, create an empty ArrayList and then call
      the method add1() on it.


    **Parameters:**
    - values - the set of objects to insert into the list.


---

## Method Details

### clone()
- clone(): [ArrayList](dw.util.ArrayList.md)
  - : Returns a shallow copy of this array list.

    **Returns:**
    - a shallow copy of this array list.


---

<!-- prettier-ignore-end -->
