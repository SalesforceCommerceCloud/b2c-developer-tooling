<!-- prettier-ignore-start -->
# Class ProductListItem

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.customer.ProductListItem](dw.customer.ProductListItem.md)

An item in a product list.  Types of items are:


- An item that references a product via the product's SKU.
- An item that represents a gift certificate.



## Constant Summary

| Constant | Description |
| --- | --- |
| [TYPE_GIFT_CERTIFICATE](#type_gift_certificate): [Number](TopLevel.Number.md) = 2 | Constant representing a gift certificate list item type. |
| [TYPE_PRODUCT](#type_product): [Number](TopLevel.Number.md) = 1 | Constant representing a product list item type. |

## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the unique system generated ID of the object. |
| [list](#list): [ProductList](dw.customer.ProductList.md) `(read-only)` | Returns the product list that this item belongs to. |
| [priority](#priority): [Number](TopLevel.Number.md) | Specify the priority level for the item. |
| [product](#product): [Product](dw.catalog.Product.md) | Returns the referenced product for this item. |
| [productID](#productid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the product referenced by this item. |
| [productOptionModel](#productoptionmodel): [ProductOptionModel](dw.catalog.ProductOptionModel.md) | Returns the ProductOptionModel for the product associated with this item,  or null if there is no valid product associated with this item. |
| [public](#public): [Boolean](TopLevel.Boolean.md) | A flag, typically used to determine whether the item should display  in a customer's view of the list (as opposed to the list owner's view). |
| [purchasedQuantity](#purchasedquantity): [Quantity](dw.value.Quantity.md) `(read-only)` | Returns the sum of the quantities of all the individual purchase records  for this item. |
| [purchasedQuantityValue](#purchasedquantityvalue): [Number](TopLevel.Number.md) `(read-only)` | Returns the value part of the underlying purchased quantity object, as distinct  from the unit. |
| [purchases](#purchases): [Collection](dw.util.Collection.md) `(read-only)` | Returns all purchases made for this item. |
| [quantity](#quantity): [Quantity](dw.value.Quantity.md) | Returns the quantity of the item. |
| [quantityValue](#quantityvalue): [Number](TopLevel.Number.md) | Returns the value part of the underlying quantity object, as distinct  from the unit. |
| [type](#type): [Number](TopLevel.Number.md) `(read-only)` | Returns the type of this product list item. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [createPurchase](dw.customer.ProductListItem.md#createpurchasenumber-string)([Number](TopLevel.Number.md), [String](TopLevel.String.md)) | Create a purchase record for this item. |
| [getID](dw.customer.ProductListItem.md#getid)() | Returns the unique system generated ID of the object. |
| [getList](dw.customer.ProductListItem.md#getlist)() | Returns the product list that this item belongs to. |
| [getPriority](dw.customer.ProductListItem.md#getpriority)() | Specify the priority level for the item. |
| [getProduct](dw.customer.ProductListItem.md#getproduct)() | Returns the referenced product for this item. |
| [getProductID](dw.customer.ProductListItem.md#getproductid)() | Returns the ID of the product referenced by this item. |
| [getProductOptionModel](dw.customer.ProductListItem.md#getproductoptionmodel)() | Returns the ProductOptionModel for the product associated with this item,  or null if there is no valid product associated with this item. |
| [getPurchasedQuantity](dw.customer.ProductListItem.md#getpurchasedquantity)() | Returns the sum of the quantities of all the individual purchase records  for this item. |
| [getPurchasedQuantityValue](dw.customer.ProductListItem.md#getpurchasedquantityvalue)() | Returns the value part of the underlying purchased quantity object, as distinct  from the unit. |
| [getPurchases](dw.customer.ProductListItem.md#getpurchases)() | Returns all purchases made for this item. |
| [getQuantity](dw.customer.ProductListItem.md#getquantity)() | Returns the quantity of the item. |
| [getQuantityValue](dw.customer.ProductListItem.md#getquantityvalue)() | Returns the value part of the underlying quantity object, as distinct  from the unit. |
| [getType](dw.customer.ProductListItem.md#gettype)() | Returns the type of this product list item. |
| [isPublic](dw.customer.ProductListItem.md#ispublic)() | A flag, typically used to determine whether the item should display  in a customer's view of the list (as opposed to the list owner's view). |
| [setPriority](dw.customer.ProductListItem.md#setprioritynumber)([Number](TopLevel.Number.md)) | Specify the priority level for the item. |
| ~~[setProduct](dw.customer.ProductListItem.md#setproductproduct)([Product](dw.catalog.Product.md))~~ | Sets the referenced product for this item by storing the product's id. |
| [setProductOptionModel](dw.customer.ProductListItem.md#setproductoptionmodelproductoptionmodel)([ProductOptionModel](dw.catalog.ProductOptionModel.md)) | Store a product option model with this object. |
| [setPublic](dw.customer.ProductListItem.md#setpublicboolean)([Boolean](TopLevel.Boolean.md)) | Typically used to determine if the item is visible to other customers. |
| ~~[setQuantity](dw.customer.ProductListItem.md#setquantityquantity)([Quantity](dw.value.Quantity.md))~~ | Sets the quantity of the item. |
| [setQuantityValue](dw.customer.ProductListItem.md#setquantityvaluenumber)([Number](TopLevel.Number.md)) | Set the value part of the underlying quantity object, as distinct from  the unit. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### TYPE_GIFT_CERTIFICATE

- TYPE_GIFT_CERTIFICATE: [Number](TopLevel.Number.md) = 2
  - : Constant representing a gift certificate list item type.


---

### TYPE_PRODUCT

- TYPE_PRODUCT: [Number](TopLevel.Number.md) = 1
  - : Constant representing a product list item type.


---

## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the unique system generated ID of the object.


---

### list
- list: [ProductList](dw.customer.ProductList.md) `(read-only)`
  - : Returns the product list that this item belongs to.


---

### priority
- priority: [Number](TopLevel.Number.md)
  - : Specify the priority level for the item.  Typically the lower the
      number, the higher the priority. This can be used by the owner of the product list
      to express which items he/she likes to get purchased first.



---

### product
- product: [Product](dw.catalog.Product.md)
  - : Returns the referenced product for this item.  The reference is made
      via the product ID attribute.  This method returns null if there is
      no such product in the system or if the product exists but is not
      assigned to the site catalog.



---

### productID
- productID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the product referenced by this item.
      This attribute is set when a product is assigned via setProduct().
      It is possible for the ID to reference a product that doesn't exist
      anymore.  In this case getProduct() would return null.



---

### productOptionModel
- productOptionModel: [ProductOptionModel](dw.catalog.ProductOptionModel.md)
  - : Returns the ProductOptionModel for the product associated with this item,
      or null if there is no valid product associated with this item.



---

### public
- public: [Boolean](TopLevel.Boolean.md)
  - : A flag, typically used to determine whether the item should display
      in a customer's view of the list (as opposed to the list owner's view).



---

### purchasedQuantity
- purchasedQuantity: [Quantity](dw.value.Quantity.md) `(read-only)`
  - : Returns the sum of the quantities of all the individual purchase records
      for this item.



---

### purchasedQuantityValue
- purchasedQuantityValue: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the value part of the underlying purchased quantity object, as distinct
      from the unit.



---

### purchases
- purchases: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all purchases made for this item.


---

### quantity
- quantity: [Quantity](dw.value.Quantity.md)
  - : Returns the quantity of the item.
      The quantity is the number of products or gift certificates
      that get shipped when purchasing this product list item.



---

### quantityValue
- quantityValue: [Number](TopLevel.Number.md)
  - : Returns the value part of the underlying quantity object, as distinct
      from the unit.



---

### type
- type: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the type of this product list item.


---

## Method Details

### createPurchase(Number, String)
- createPurchase(quantity: [Number](TopLevel.Number.md), purchaserName: [String](TopLevel.String.md)): [ProductListItemPurchase](dw.customer.ProductListItemPurchase.md)
  - : Create a purchase record for this item.

    **Parameters:**
    - quantity - The number of items purchased.
    - purchaserName - The name of the purchaser.

    **Returns:**
    - the purchase record.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the unique system generated ID of the object.

    **Returns:**
    - the ID of object.


---

### getList()
- getList(): [ProductList](dw.customer.ProductList.md)
  - : Returns the product list that this item belongs to.

    **Returns:**
    - the list.


---

### getPriority()
- getPriority(): [Number](TopLevel.Number.md)
  - : Specify the priority level for the item.  Typically the lower the
      number, the higher the priority. This can be used by the owner of the product list
      to express which items he/she likes to get purchased first.


    **Returns:**
    - the specified priority level.


---

### getProduct()
- getProduct(): [Product](dw.catalog.Product.md)
  - : Returns the referenced product for this item.  The reference is made
      via the product ID attribute.  This method returns null if there is
      no such product in the system or if the product exists but is not
      assigned to the site catalog.


    **Returns:**
    - the product referenced by this item, or null.


---

### getProductID()
- getProductID(): [String](TopLevel.String.md)
  - : Returns the ID of the product referenced by this item.
      This attribute is set when a product is assigned via setProduct().
      It is possible for the ID to reference a product that doesn't exist
      anymore.  In this case getProduct() would return null.


    **Returns:**
    - the product ID, or null if none exists.


---

### getProductOptionModel()
- getProductOptionModel(): [ProductOptionModel](dw.catalog.ProductOptionModel.md)
  - : Returns the ProductOptionModel for the product associated with this item,
      or null if there is no valid product associated with this item.


    **Returns:**
    - the associated ProductOptionModel or null.


---

### getPurchasedQuantity()
- getPurchasedQuantity(): [Quantity](dw.value.Quantity.md)
  - : Returns the sum of the quantities of all the individual purchase records
      for this item.


    **Returns:**
    - the sum of the quantities of all the individual purchase records
      for this item.



---

### getPurchasedQuantityValue()
- getPurchasedQuantityValue(): [Number](TopLevel.Number.md)
  - : Returns the value part of the underlying purchased quantity object, as distinct
      from the unit.


    **Returns:**
    - the value part of the underlying purchased quantity object, as distinct
      from the unit.



---

### getPurchases()
- getPurchases(): [Collection](dw.util.Collection.md)
  - : Returns all purchases made for this item.

    **Returns:**
    - the collection of purchase records for this item. Returns an empty list
      if this item has not been purchased yet.



---

### getQuantity()
- getQuantity(): [Quantity](dw.value.Quantity.md)
  - : Returns the quantity of the item.
      The quantity is the number of products or gift certificates
      that get shipped when purchasing this product list item.


    **Returns:**
    - the quantity of the item.


---

### getQuantityValue()
- getQuantityValue(): [Number](TopLevel.Number.md)
  - : Returns the value part of the underlying quantity object, as distinct
      from the unit.


    **Returns:**
    - the value part of the underlying quantity object, as distinct
      from the unit.



---

### getType()
- getType(): [Number](TopLevel.Number.md)
  - : Returns the type of this product list item.

    **Returns:**
    - a code that specifies the type of item (i.e. product or gift certificate).


---

### isPublic()
- isPublic(): [Boolean](TopLevel.Boolean.md)
  - : A flag, typically used to determine whether the item should display
      in a customer's view of the list (as opposed to the list owner's view).


    **Returns:**
    - true if the item is public.


---

### setPriority(Number)
- setPriority(priority: [Number](TopLevel.Number.md)): void
  - : Specify the priority level for the item.  Typically the lower the
      number, the higher the priority. This can be used by the owner of the product list
      to express which items he/she likes to get purchased first.


    **Parameters:**
    - priority - The new priority level.


---

### setProduct(Product)
- ~~setProduct(product: [Product](dw.catalog.Product.md)): void~~
  - : Sets the referenced product for this item by storing the product's id.
      If null is specified, then the id is set to null.


    **Parameters:**
    - product - The referenced product for this item.

    **Deprecated:**
:::warning
Use [ProductList.createProductItem(Product)](dw.customer.ProductList.md#createproductitemproduct) instead.
:::

---

### setProductOptionModel(ProductOptionModel)
- setProductOptionModel(productOptionModel: [ProductOptionModel](dw.catalog.ProductOptionModel.md)): void
  - : Store a product option model with this object.  This stores a copy
      of the specified model, rather than an assocation to the same instance.


    **Parameters:**
    - productOptionModel - The object to store.


---

### setPublic(Boolean)
- setPublic(flag: [Boolean](TopLevel.Boolean.md)): void
  - : Typically used to determine if the item is visible to other customers.

    **Parameters:**
    - flag - If true, this product list becomes visible to other customers.  If false, this product list can only be seen by the owner of the product list.


---

### setQuantity(Quantity)
- ~~setQuantity(value: [Quantity](dw.value.Quantity.md)): void~~
  - : Sets the quantity of the item.

    **Parameters:**
    - value - the new quantity of the item.

    **Deprecated:**
:::warning
Use [setQuantityValue(Number)](dw.customer.ProductListItem.md#setquantityvaluenumber) instead.
:::

---

### setQuantityValue(Number)
- setQuantityValue(value: [Number](TopLevel.Number.md)): void
  - : Set the value part of the underlying quantity object, as distinct from
      the unit.


    **Parameters:**
    - value - the value to use.


---

<!-- prettier-ignore-end -->
