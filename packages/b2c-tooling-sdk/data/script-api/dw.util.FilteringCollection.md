<!-- prettier-ignore-start -->
# Class FilteringCollection

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.Collection](dw.util.Collection.md)
    - [dw.util.FilteringCollection](dw.util.FilteringCollection.md)

[FilteringCollection](dw.util.FilteringCollection.md) is an extension of
[Collection](dw.util.Collection.md) which provides possibilities to


- _filter_the elements to return a new  [FilteringCollection](dw.util.FilteringCollection.md)with a filtered set of elements
- _sort_the elements to return a new  [FilteringCollection](dw.util.FilteringCollection.md)with a defined sort order
- _transform_the elements to return a new  [FilteringCollection](dw.util.FilteringCollection.md)containing related elements
- _provide a map_of the elements against a predefined key




**Usage** - In the current version each
[FilteringCollection](dw.util.FilteringCollection.md) provides a set of predefined
_qualifier_ constants which can be passed into the
[select(Object)](dw.util.FilteringCollection.md#selectobject) method used to _filter_ the elements. Generally
_qualifiers_ have the prefix _QUALIFIER\__. A second method
[sort(Object)](dw.util.FilteringCollection.md#sortobject) is used to create a new instance with a different
element ordering, which takes an _orderB<_ constant. Generally
_orderBys_ have the prefix ORDERBY\_: examples are
[ShippingOrder.ORDERBY_ITEMID](dw.order.ShippingOrder.md#orderby_itemid),
[ShippingOrder.ORDERBY_ITEMPOSITION](dw.order.ShippingOrder.md#orderby_itemposition), and [ORDERBY_REVERSE](dw.util.FilteringCollection.md#orderby_reverse) can
be used to provide a [FilteringCollection](dw.util.FilteringCollection.md) with the reverse
ordering. An example with method [ShippingOrder.getItems()](dw.order.ShippingOrder.md#getitems):



`
 
var allItems     : FilteringCollection = shippingOrder.items;
 
var productItems : FilteringCollection = allItems.select(ShippingOrder.QUALIFIER_PRODUCTITEMS);
 
var serviceItems : FilteringCollection = allItems.select(ShippingOrder.QUALIFIER_SERVICEITEMS);
 
var byPosition   : FilteringCollection = productItems.sort(ShippingOrder.ORDERBY_ITEMPOSITION);
 
var revByPosition: FilteringCollection = byPosition.sort(FilteringCollection.ORDERBY_REVERSE);
 
var mapByItemID  : Map = allItems.asMap();
 `



## Constant Summary

| Constant | Description |
| --- | --- |
| [ORDERBY_REVERSE](#orderby_reverse): [Object](TopLevel.Object.md) | Pass this _orderBy_ with the [sort(Object)](dw.util.FilteringCollection.md#sortobject) method to  obtain a new [FilteringCollection](dw.util.FilteringCollection.md) with the reversed sort  order. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [asMap](dw.util.FilteringCollection.md#asmap)() | Returns a [Map](dw.util.Map.md) containing the elements of this  [FilteringCollection](dw.util.FilteringCollection.md) against a predefined key. |
| [select](dw.util.FilteringCollection.md#selectobject)([Object](TopLevel.Object.md)) | Select a new [FilteringCollection](dw.util.FilteringCollection.md) instance by passing a  predefined _qualifier_ as an argument to this method. |
| [sort](dw.util.FilteringCollection.md#sortobject)([Object](TopLevel.Object.md)) | Select a new [FilteringCollection](dw.util.FilteringCollection.md) instance by passing a  predefined _orderBy_ as an argument to this method. |

### Methods inherited from class Collection

[add](dw.util.Collection.md#addobject), [add1](dw.util.Collection.md#add1object), [addAll](dw.util.Collection.md#addallcollection), [clear](dw.util.Collection.md#clear), [contains](dw.util.Collection.md#containsobject), [containsAll](dw.util.Collection.md#containsallcollection), [getLength](dw.util.Collection.md#getlength), [isEmpty](dw.util.Collection.md#isempty), [iterator](dw.util.Collection.md#iterator), [remove](dw.util.Collection.md#removeobject), [removeAll](dw.util.Collection.md#removeallcollection), [retainAll](dw.util.Collection.md#retainallcollection), [size](dw.util.Collection.md#size), [toArray](dw.util.Collection.md#toarray), [toArray](dw.util.Collection.md#toarraynumber-number)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### ORDERBY_REVERSE

- ORDERBY_REVERSE: [Object](TopLevel.Object.md)
  - : Pass this _orderBy_ with the [sort(Object)](dw.util.FilteringCollection.md#sortobject) method to
      obtain a new [FilteringCollection](dw.util.FilteringCollection.md) with the reversed sort
      order. Only use on a [FilteringCollection](dw.util.FilteringCollection.md) which has been
      previously sorted.



---

## Method Details

### asMap()
- asMap(): [Map](dw.util.Map.md)
  - : Returns a [Map](dw.util.Map.md) containing the elements of this
      [FilteringCollection](dw.util.FilteringCollection.md) against a predefined key. The key
      used is documented in the method returning the
      [FilteringCollection](dw.util.FilteringCollection.md) and is typically the ItemID assigned
      to an element in the collection.


    **Returns:**
    - a [Map](dw.util.Map.md) containing the elements of this
              [FilteringCollection](dw.util.FilteringCollection.md) against a predefined key.



---

### select(Object)
- select(qualifier: [Object](TopLevel.Object.md)): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Select a new [FilteringCollection](dw.util.FilteringCollection.md) instance by passing a
      predefined _qualifier_ as an argument to this method. See
      [FilteringCollection](dw.util.FilteringCollection.md).


    **Parameters:**
    - qualifier - possible qualifiers are documented in the method returning the [FilteringCollection](dw.util.FilteringCollection.md)

    **Returns:**
    - a new [FilteringCollection](dw.util.FilteringCollection.md) instance


---

### sort(Object)
- sort(orderBy: [Object](TopLevel.Object.md)): [FilteringCollection](dw.util.FilteringCollection.md)
  - : Select a new [FilteringCollection](dw.util.FilteringCollection.md) instance by passing a
      predefined _orderBy_ as an argument to this method. See
      [FilteringCollection](dw.util.FilteringCollection.md).


    **Parameters:**
    - orderBy - possible orderBys are documented in the method returning the [FilteringCollection](dw.util.FilteringCollection.md)

    **Returns:**
    - a new [FilteringCollection](dw.util.FilteringCollection.md) instance


---

<!-- prettier-ignore-end -->
