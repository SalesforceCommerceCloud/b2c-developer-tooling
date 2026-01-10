<!-- prettier-ignore-start -->
# Class ProductLineItem

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.order.LineItem](dw.order.LineItem.md)
        - [dw.order.ProductLineItem](dw.order.ProductLineItem.md)

Represents a specific product line item.


## Property Summary

| Property | Description |
| --- | --- |
| [adjustedGrossPrice](#adjustedgrossprice): [Money](dw.value.Money.md) `(read-only)` | Returns the gross price of the product line item after applying all product-level  adjustments. |
| [adjustedNetPrice](#adjustednetprice): [Money](dw.value.Money.md) `(read-only)` | Returns the net price of the product line item after applying all product-level  adjustments. |
| [adjustedPrice](#adjustedprice): [Money](dw.value.Money.md) `(read-only)` | Returns the price of the product line item after applying all product-level  adjustments. |
| [adjustedTax](#adjustedtax): [Money](dw.value.Money.md) `(read-only)` | Returns the tax of the unit after applying adjustments, in the purchase currency. |
| [bonusDiscountLineItem](#bonusdiscountlineitem): [BonusDiscountLineItem](dw.order.BonusDiscountLineItem.md) `(read-only)` | Returns the parent bonus discount line item of this line item. |
| [bonusProductLineItem](#bonusproductlineitem): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the product line item represents a bonus line item. |
| [bundledProductLineItem](#bundledproductlineitem): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the product line item represents a bundled line item. |
| [bundledProductLineItems](#bundledproductlineitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection containing the bundled product line items. |
| [catalogProduct](#catalogproduct): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if the product line item represents a catalog product. |
| [category](#category): [Category](dw.catalog.Category.md) | Returns the category the product line item is associated with. |
| [categoryID](#categoryid): [String](TopLevel.String.md) | Returns the ID of the category the product line item is associated with. |
| [externalLineItemStatus](#externallineitemstatus): [String](TopLevel.String.md) | Returns the value set for the external line item status  or null if no value set. |
| [externalLineItemText](#externallineitemtext): [String](TopLevel.String.md) | Returns the value set for the external line item text  or null if no value set. |
| [gift](#gift): [Boolean](TopLevel.Boolean.md) | Returns true if this line item represents a gift, false otherwise. |
| [giftMessage](#giftmessage): [String](TopLevel.String.md) | Returns the value set for gift message or null if no value set. |
| [manufacturerName](#manufacturername): [String](TopLevel.String.md) | Returns the name of the manfacturer of the product. |
| [manufacturerSKU](#manufacturersku): [String](TopLevel.String.md) | Returns the name of the manfacturer's SKU of this product line item. |
| [minOrderQuantity](#minorderquantity): [Quantity](dw.value.Quantity.md) `(read-only)` | Returns the minimal order quantity allowed for the product represented by the  ProductLineItem (copied from product on initialization). |
| [minOrderQuantityValue](#minorderquantityvalue): [Number](TopLevel.Number.md) | Return the value portion of getMinOrderQuantity(). |
| [optionID](#optionid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the product option this product line item  represents. |
| [optionModel](#optionmodel): [ProductOptionModel](dw.catalog.ProductOptionModel.md) `(read-only)` | Returns the product option model for a product line item representing an option product. |
| [optionProductLineItem](#optionproductlineitem): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the product line item represents an option line item. |
| [optionProductLineItems](#optionproductlineitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection containing option product line items. |
| [optionValueID](#optionvalueid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the product option value this product line item  represents. |
| [orderItem](#orderitem): [OrderItem](dw.order.OrderItem.md) `(read-only)` | Returns the [order-item extension](dw.order.OrderItem.md) for this item, or null. |
| [parent](#parent): [ProductLineItem](dw.order.ProductLineItem.md) `(read-only)` | Returns the parent line item of this line item or null if the line item  is independent. |
| [position](#position): [Number](TopLevel.Number.md) | Returns the position within the line item container assigned to the ProductLineItem upon its creation, may be  used as a sort-order. |
| [priceAdjustments](#priceadjustments): [Collection](dw.util.Collection.md) `(read-only)` | Returns an iterator of price adjustments that have been applied to this  product line item such as promotions on the purchase price  (i.e. |
| [product](#product): [Product](dw.catalog.Product.md) `(read-only)` | Returns the product associated with the product line item. |
| [productID](#productid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the related product. |
| [productInventoryList](#productinventorylist): [ProductInventoryList](dw.catalog.ProductInventoryList.md) | Returns the inventory list the product line item is associated with. |
| [productInventoryListID](#productinventorylistid): [String](TopLevel.String.md) | Returns the ID of the inventory list the product line item is associated with. |
| [productListItem](#productlistitem): [ProductListItem](dw.customer.ProductListItem.md) `(read-only)` | Returns the associated ProductListItem. |
| [productName](#productname): [String](TopLevel.String.md) | Returns the name of the product that was copied when  product was added to line item container. |
| [proratedPrice](#proratedprice): [Money](dw.value.Money.md) `(read-only)` | Returns the price of this product line item after considering all  dependent price adjustments and prorating all Buy-X-Get-Y  and order-level discounts, according to the scheme described in  [PriceAdjustment.getProratedPrices()](dw.order.PriceAdjustment.md#getproratedprices). |
| [proratedPriceAdjustmentPrices](#proratedpriceadjustmentprices): [Map](dw.util.Map.md) `(read-only)` | Returns a Map of PriceAdjustment to Money instances. |
| [qualifyingProductLineItemForBonusProduct](#qualifyingproductlineitemforbonusproduct): [ProductLineItem](dw.order.ProductLineItem.md) `(read-only)` | Returns the ProductLineItem that qualified the basket for this bonus product. |
| [quantity](#quantity): [Quantity](dw.value.Quantity.md) `(read-only)` | Returns the quantity of the product represented by this ProductLineItem. |
| [quantityValue](#quantityvalue): [Number](TopLevel.Number.md) | Returns the value of the quantity of this ProductLineItem. |
| [relatedBonusProductLineItems](#relatedbonusproductlineitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns all bonus product line items for which this line item is a  qualifying product line item. |
| [reserved](#reserved): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns if the product line item is reserved. |
| [shipment](#shipment): [Shipment](dw.order.Shipment.md) | Returns the associated Shipment. |
| [shippingLineItem](#shippinglineitem): [ProductShippingLineItem](dw.order.ProductShippingLineItem.md) `(read-only)` | Returns the dependent shipping line item of this line item. |
| [stepQuantity](#stepquantity): [Quantity](dw.value.Quantity.md) `(read-only)` | Returns step quantity allowed for the product represented by the ProductLineItem  (copied from product on initialization). |
| [stepQuantityValue](#stepquantityvalue): [Number](TopLevel.Number.md) | Return the value portion of getStepQuantity(). |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [createPriceAdjustment](dw.order.ProductLineItem.md#createpriceadjustmentstring)([String](TopLevel.String.md)) | Creates a product price adjustment. |
| [createPriceAdjustment](dw.order.ProductLineItem.md#createpriceadjustmentstring-discount)([String](TopLevel.String.md), [Discount](dw.campaign.Discount.md)) | Creates a product price adjustment representing a specific discount. |
| [createShippingLineItem](dw.order.ProductLineItem.md#createshippinglineitem)() | Creates the dependent shipping line item for this line item. |
| [getAdjustedGrossPrice](dw.order.ProductLineItem.md#getadjustedgrossprice)() | Returns the gross price of the product line item after applying all product-level  adjustments. |
| [getAdjustedNetPrice](dw.order.ProductLineItem.md#getadjustednetprice)() | Returns the net price of the product line item after applying all product-level  adjustments. |
| [getAdjustedPrice](dw.order.ProductLineItem.md#getadjustedprice)() | Returns the price of the product line item after applying all product-level  adjustments. |
| [getAdjustedPrice](dw.order.ProductLineItem.md#getadjustedpriceboolean)([Boolean](TopLevel.Boolean.md)) | Returns the price of this product line item after considering all  dependent price adjustments and optionally prorating all order-level  price adjustments. |
| [getAdjustedTax](dw.order.ProductLineItem.md#getadjustedtax)() | Returns the tax of the unit after applying adjustments, in the purchase currency. |
| [getBonusDiscountLineItem](dw.order.ProductLineItem.md#getbonusdiscountlineitem)() | Returns the parent bonus discount line item of this line item. |
| [getBundledProductLineItems](dw.order.ProductLineItem.md#getbundledproductlineitems)() | Returns a collection containing the bundled product line items. |
| [getCategory](dw.order.ProductLineItem.md#getcategory)() | Returns the category the product line item is associated with. |
| [getCategoryID](dw.order.ProductLineItem.md#getcategoryid)() | Returns the ID of the category the product line item is associated with. |
| [getExternalLineItemStatus](dw.order.ProductLineItem.md#getexternallineitemstatus)() | Returns the value set for the external line item status  or null if no value set. |
| [getExternalLineItemText](dw.order.ProductLineItem.md#getexternallineitemtext)() | Returns the value set for the external line item text  or null if no value set. |
| [getGiftMessage](dw.order.ProductLineItem.md#getgiftmessage)() | Returns the value set for gift message or null if no value set. |
| [getManufacturerName](dw.order.ProductLineItem.md#getmanufacturername)() | Returns the name of the manfacturer of the product. |
| [getManufacturerSKU](dw.order.ProductLineItem.md#getmanufacturersku)() | Returns the name of the manfacturer's SKU of this product line item. |
| [getMinOrderQuantity](dw.order.ProductLineItem.md#getminorderquantity)() | Returns the minimal order quantity allowed for the product represented by the  ProductLineItem (copied from product on initialization). |
| [getMinOrderQuantityValue](dw.order.ProductLineItem.md#getminorderquantityvalue)() | Return the value portion of getMinOrderQuantity(). |
| [getOptionID](dw.order.ProductLineItem.md#getoptionid)() | Returns the ID of the product option this product line item  represents. |
| [getOptionModel](dw.order.ProductLineItem.md#getoptionmodel)() | Returns the product option model for a product line item representing an option product. |
| [getOptionProductLineItems](dw.order.ProductLineItem.md#getoptionproductlineitems)() | Returns a collection containing option product line items. |
| [getOptionValueID](dw.order.ProductLineItem.md#getoptionvalueid)() | Returns the ID of the product option value this product line item  represents. |
| [getOrderItem](dw.order.ProductLineItem.md#getorderitem)() | Returns the [order-item extension](dw.order.OrderItem.md) for this item, or null. |
| [getParent](dw.order.ProductLineItem.md#getparent)() | Returns the parent line item of this line item or null if the line item  is independent. |
| [getPosition](dw.order.ProductLineItem.md#getposition)() | Returns the position within the line item container assigned to the ProductLineItem upon its creation, may be  used as a sort-order. |
| [getPriceAdjustmentByPromotionID](dw.order.ProductLineItem.md#getpriceadjustmentbypromotionidstring)([String](TopLevel.String.md)) | Returns the first price adjustment associated to the specified promotion ID. |
| [getPriceAdjustmentByPromotionIDAndCouponCode](dw.order.ProductLineItem.md#getpriceadjustmentbypromotionidandcouponcodestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns the price adjustment associated to the specified promotion ID and coupon code combination. |
| [getPriceAdjustments](dw.order.ProductLineItem.md#getpriceadjustments)() | Returns an iterator of price adjustments that have been applied to this  product line item such as promotions on the purchase price  (i.e. |
| [getPriceAdjustmentsByPromotionID](dw.order.ProductLineItem.md#getpriceadjustmentsbypromotionidstring)([String](TopLevel.String.md)) | Returns the collection of price adjustments associated to the specified promotion ID. |
| [getProduct](dw.order.ProductLineItem.md#getproduct)() | Returns the product associated with the product line item. |
| [getProductID](dw.order.ProductLineItem.md#getproductid)() | Returns the ID of the related product. |
| [getProductInventoryList](dw.order.ProductLineItem.md#getproductinventorylist)() | Returns the inventory list the product line item is associated with. |
| [getProductInventoryListID](dw.order.ProductLineItem.md#getproductinventorylistid)() | Returns the ID of the inventory list the product line item is associated with. |
| [getProductListItem](dw.order.ProductLineItem.md#getproductlistitem)() | Returns the associated ProductListItem. |
| [getProductName](dw.order.ProductLineItem.md#getproductname)() | Returns the name of the product that was copied when  product was added to line item container. |
| [getProratedPrice](dw.order.ProductLineItem.md#getproratedprice)() | Returns the price of this product line item after considering all  dependent price adjustments and prorating all Buy-X-Get-Y  and order-level discounts, according to the scheme described in  [PriceAdjustment.getProratedPrices()](dw.order.PriceAdjustment.md#getproratedprices). |
| [getProratedPriceAdjustmentPrices](dw.order.ProductLineItem.md#getproratedpriceadjustmentprices)() | Returns a Map of PriceAdjustment to Money instances. |
| [getQualifyingProductLineItemForBonusProduct](dw.order.ProductLineItem.md#getqualifyingproductlineitemforbonusproduct)() | Returns the ProductLineItem that qualified the basket for this bonus product. |
| [getQuantity](dw.order.ProductLineItem.md#getquantity)() | Returns the quantity of the product represented by this ProductLineItem. |
| [getQuantityValue](dw.order.ProductLineItem.md#getquantityvalue)() | Returns the value of the quantity of this ProductLineItem. |
| [getRelatedBonusProductLineItems](dw.order.ProductLineItem.md#getrelatedbonusproductlineitems)() | Returns all bonus product line items for which this line item is a  qualifying product line item. |
| [getShipment](dw.order.ProductLineItem.md#getshipment)() | Returns the associated Shipment. |
| [getShippingLineItem](dw.order.ProductLineItem.md#getshippinglineitem)() | Returns the dependent shipping line item of this line item. |
| [getStepQuantity](dw.order.ProductLineItem.md#getstepquantity)() | Returns step quantity allowed for the product represented by the ProductLineItem  (copied from product on initialization). |
| [getStepQuantityValue](dw.order.ProductLineItem.md#getstepquantityvalue)() | Return the value portion of getStepQuantity(). |
| [isBonusProductLineItem](dw.order.ProductLineItem.md#isbonusproductlineitem)() | Identifies if the product line item represents a bonus line item. |
| [isBundledProductLineItem](dw.order.ProductLineItem.md#isbundledproductlineitem)() | Identifies if the product line item represents a bundled line item. |
| [isCatalogProduct](dw.order.ProductLineItem.md#iscatalogproduct)() | Returns true if the product line item represents a catalog product. |
| [isGift](dw.order.ProductLineItem.md#isgift)() | Returns true if this line item represents a gift, false otherwise. |
| [isOptionProductLineItem](dw.order.ProductLineItem.md#isoptionproductlineitem)() | Identifies if the product line item represents an option line item. |
| [isReserved](dw.order.ProductLineItem.md#isreserved)() | Returns if the product line item is reserved. |
| [removePriceAdjustment](dw.order.ProductLineItem.md#removepriceadjustmentpriceadjustment)([PriceAdjustment](dw.order.PriceAdjustment.md)) | Removes the specified price adjustment from the product line item. |
| [removeShippingLineItem](dw.order.ProductLineItem.md#removeshippinglineitem)() | Removes the dependent shipping line item for this line item. |
| [replaceProduct](dw.order.ProductLineItem.md#replaceproductproduct)([Product](dw.catalog.Product.md)) | Replaces the current product of the product line item with the product specified in parameter _newProduct_. |
| [setCategory](dw.order.ProductLineItem.md#setcategorycategory)([Category](dw.catalog.Category.md)) | Sets the specified category as the product line item category context. |
| [setCategoryID](dw.order.ProductLineItem.md#setcategoryidstring)([String](TopLevel.String.md)) | Sets the ID of the category the product line item is associated with. |
| [setExternalLineItemStatus](dw.order.ProductLineItem.md#setexternallineitemstatusstring)([String](TopLevel.String.md)) | Sets the value to set for the external line item status. |
| [setExternalLineItemText](dw.order.ProductLineItem.md#setexternallineitemtextstring)([String](TopLevel.String.md)) | Sets the value to set for the external line item text. |
| [setGift](dw.order.ProductLineItem.md#setgiftboolean)([Boolean](TopLevel.Boolean.md)) | Controls if this line item is a gift or not. |
| [setGiftMessage](dw.order.ProductLineItem.md#setgiftmessagestring)([String](TopLevel.String.md)) | Sets the value to set for the gift message. |
| [setManufacturerName](dw.order.ProductLineItem.md#setmanufacturernamestring)([String](TopLevel.String.md)) | Sets the name of the manufacturer of this product. |
| [setManufacturerSKU](dw.order.ProductLineItem.md#setmanufacturerskustring)([String](TopLevel.String.md)) | Sets the SKU of the manufacturer of this product. |
| [setMinOrderQuantityValue](dw.order.ProductLineItem.md#setminorderquantityvaluenumber)([Number](TopLevel.Number.md)) | Set the minimum order quantity value for this object. |
| [setPosition](dw.order.ProductLineItem.md#setpositionnumber)([Number](TopLevel.Number.md)) | Sets the position within the line item container. |
| [setPriceValue](dw.order.ProductLineItem.md#setpricevaluenumber)([Number](TopLevel.Number.md)) | Sets price attributes of the line item based on the current  purchase currency, taxation policy and line item quantity. |
| [setProductInventoryList](dw.order.ProductLineItem.md#setproductinventorylistproductinventorylist)([ProductInventoryList](dw.catalog.ProductInventoryList.md)) | Sets the specified inventory list as the product line item inventory context. |
| [setProductInventoryListID](dw.order.ProductLineItem.md#setproductinventorylistidstring)([String](TopLevel.String.md)) | Sets the ID of the inventory list the product line item is associated with. |
| [setProductName](dw.order.ProductLineItem.md#setproductnamestring)([String](TopLevel.String.md)) | Sets the name of the product. |
| [setQuantityValue](dw.order.ProductLineItem.md#setquantityvaluenumber)([Number](TopLevel.Number.md)) | Updates the quantity value of the product line item. |
| [setShipment](dw.order.ProductLineItem.md#setshipmentshipment)([Shipment](dw.order.Shipment.md)) | Associates the specified product line item with the specified shipment. |
| [setStepQuantityValue](dw.order.ProductLineItem.md#setstepquantityvaluenumber)([Number](TopLevel.Number.md)) | Set the step quantity value for this object. |
| [updateOptionPrice](dw.order.ProductLineItem.md#updateoptionprice)() | Determines and sets the price of a option line item based on the selected option value this line item represents. |
| [updateOptionValue](dw.order.ProductLineItem.md#updateoptionvalueproductoptionvalue)([ProductOptionValue](dw.catalog.ProductOptionValue.md)) | Updates an option line item with a new option value. |
| ~~[updatePrice](dw.order.ProductLineItem.md#updatepricemoney)([Money](dw.value.Money.md))~~ | Updates the price attributes of the line item based  on the specified price. |
| ~~[updateQuantity](dw.order.ProductLineItem.md#updatequantitynumber)([Number](TopLevel.Number.md))~~ | Updates the quantity value of the product line item and all its dependent product line items. |

### Methods inherited from class LineItem

[getBasePrice](dw.order.LineItem.md#getbaseprice), [getGrossPrice](dw.order.LineItem.md#getgrossprice), [getLineItemCtnr](dw.order.LineItem.md#getlineitemctnr), [getLineItemText](dw.order.LineItem.md#getlineitemtext), [getNetPrice](dw.order.LineItem.md#getnetprice), [getPrice](dw.order.LineItem.md#getprice), [getPriceValue](dw.order.LineItem.md#getpricevalue), [getTax](dw.order.LineItem.md#gettax), [getTaxBasis](dw.order.LineItem.md#gettaxbasis), [getTaxClassID](dw.order.LineItem.md#gettaxclassid), [getTaxRate](dw.order.LineItem.md#gettaxrate), [setBasePrice](dw.order.LineItem.md#setbasepricemoney), [setGrossPrice](dw.order.LineItem.md#setgrosspricemoney), [setLineItemText](dw.order.LineItem.md#setlineitemtextstring), [setNetPrice](dw.order.LineItem.md#setnetpricemoney), [setPriceValue](dw.order.LineItem.md#setpricevaluenumber), [setTax](dw.order.LineItem.md#settaxmoney), [setTaxClassID](dw.order.LineItem.md#settaxclassidstring), [setTaxRate](dw.order.LineItem.md#settaxratenumber), [updatePrice](dw.order.LineItem.md#updatepricemoney), [updateTax](dw.order.LineItem.md#updatetaxnumber), [updateTax](dw.order.LineItem.md#updatetaxnumber-money), [updateTaxAmount](dw.order.LineItem.md#updatetaxamountmoney)
### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### adjustedGrossPrice
- adjustedGrossPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the gross price of the product line item after applying all product-level
      adjustments.


    **See Also:**
    - [getAdjustedNetPrice()](dw.order.ProductLineItem.md#getadjustednetprice)
    - [getAdjustedPrice()](dw.order.ProductLineItem.md#getadjustedprice)


---

### adjustedNetPrice
- adjustedNetPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the net price of the product line item after applying all product-level
      adjustments.


    **See Also:**
    - [getAdjustedGrossPrice()](dw.order.ProductLineItem.md#getadjustedgrossprice)
    - [getAdjustedPrice()](dw.order.ProductLineItem.md#getadjustedprice)


---

### adjustedPrice
- adjustedPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the price of the product line item after applying all product-level
      adjustments. For net pricing the adjusted net price is returned
      (see [getAdjustedNetPrice()](dw.order.ProductLineItem.md#getadjustednetprice)). For gross pricing, the adjusted
      gross price is returned (see [getAdjustedGrossPrice()](dw.order.ProductLineItem.md#getadjustedgrossprice)).


    **See Also:**
    - [getAdjustedGrossPrice()](dw.order.ProductLineItem.md#getadjustedgrossprice)
    - [getAdjustedNetPrice()](dw.order.ProductLineItem.md#getadjustednetprice)


---

### adjustedTax
- adjustedTax: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the tax of the unit after applying adjustments, in the purchase currency.


---

### bonusDiscountLineItem
- bonusDiscountLineItem: [BonusDiscountLineItem](dw.order.BonusDiscountLineItem.md) `(read-only)`
  - : Returns the parent bonus discount line item of this line item.  Only
      bonus product line items that have been selected by the customer as
      part of a BONUS\_CHOICE discount have one of these.



---

### bonusProductLineItem
- bonusProductLineItem: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the product line item represents a bonus line item.


---

### bundledProductLineItem
- bundledProductLineItem: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the product line item represents a bundled line item.


---

### bundledProductLineItems
- bundledProductLineItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection containing the bundled product line items.


---

### catalogProduct
- catalogProduct: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if the product line item represents a catalog product.
      
      
      That flag is determined during product line item creation with
      [LineItemCtnr.createProductLineItem(String, Shipment)](dw.order.LineItemCtnr.md#createproductlineitemstring-shipment), stored at the line item container and can
      be accessed as productLineItem.catalogProduct. It represents what can be evaluated with
      
      
      ```
      dw.catalog.ProductMgr.getProduct( productID ) != null
          && dw.catalog.ProductMgr.getProduct( productID ).isAssignedToSiteCatalog()
      ```
      
      
      If the product is not available during product line item creation it is considered a non catalog product line item without
      connection to a product.


    **See Also:**
    - [getProduct()](dw.order.ProductLineItem.md#getproduct)


---

### category
- category: [Category](dw.catalog.Category.md)
  - : Returns the category the product line item is associated with. If the
      line item is not associated with a category, or the category does not
      exist in the site catalog, the method returns null.



---

### categoryID
- categoryID: [String](TopLevel.String.md)
  - : Returns the ID of the category the product line item is associated with.


---

### externalLineItemStatus
- externalLineItemStatus: [String](TopLevel.String.md)
  - : Returns the value set for the external line item status
      or null if no value set.



---

### externalLineItemText
- externalLineItemText: [String](TopLevel.String.md)
  - : Returns the value set for the external line item text
      or null if no value set.



---

### gift
- gift: [Boolean](TopLevel.Boolean.md)
  - : Returns true if this line item represents a gift, false otherwise.


---

### giftMessage
- giftMessage: [String](TopLevel.String.md)
  - : Returns the value set for gift message or null if no value set.


---

### manufacturerName
- manufacturerName: [String](TopLevel.String.md)
  - : Returns the name of the manfacturer of the product.


---

### manufacturerSKU
- manufacturerSKU: [String](TopLevel.String.md)
  - : Returns the name of the manfacturer's SKU of this product line item.


---

### minOrderQuantity
- minOrderQuantity: [Quantity](dw.value.Quantity.md) `(read-only)`
  - : Returns the minimal order quantity allowed for the product represented by the
      ProductLineItem (copied from product on initialization).
      Note: the quantity of a ProductLineItem must obey the limits set by the
      ProductLineItem's attributes 'MinOrderQuantity' and 'StepQuantity', i.e.
      for a 'MinOrderQuantity' of 2.0 and a 'StepQuantity' of 2.5 then values
      2.0, 4.5, 7.0... are allowed values.



---

### minOrderQuantityValue
- minOrderQuantityValue: [Number](TopLevel.Number.md)
  - : Return the value portion of getMinOrderQuantity().


---

### optionID
- optionID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the product option this product line item
      represents. If the product line item does not represent an option,
      null is returned.



---

### optionModel
- optionModel: [ProductOptionModel](dw.catalog.ProductOptionModel.md) `(read-only)`
  - : Returns the product option model for a product line item representing an option product.
      
      
      The returned option model has preselected values based on the dependent option line items of this product line
      item. Null is returned if this line item does not represent an option product.



---

### optionProductLineItem
- optionProductLineItem: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the product line item represents an option line item.
      Option line items do not represent true products but rather options of
      products.  An option line item always has a parent product line item
      representing a true product.



---

### optionProductLineItems
- optionProductLineItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection containing option product line items.


---

### optionValueID
- optionValueID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the product option value this product line item
      represents. If the product line item does not represent an option,
      null is returned.



---

### orderItem
- orderItem: [OrderItem](dw.order.OrderItem.md) `(read-only)`
  - : Returns the [order-item extension](dw.order.OrderItem.md) for this item, or null. An order-item
      extension will only exist for a ProductLineItem which belongs to an [Order](dw.order.Order.md).
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.



---

### parent
- parent: [ProductLineItem](dw.order.ProductLineItem.md) `(read-only)`
  - : Returns the parent line item of this line item or null if the line item
      is independent.



---

### position
- position: [Number](TopLevel.Number.md)
  - : Returns the position within the line item container assigned to the ProductLineItem upon its creation, may be
      used as a sort-order.
      
      
      The position is updated in the following way:
      
      - When a ProductLineItem is added to the LineItemCtnr, it is assigned the next available position, based on the  current count
      - When a ProductLineItem is removed from the LineItemCtnr then LineItemCtnr method reassignPositions is called,  so that the 'gap' left by the removed line-item is refilled. This method is dependent on no 2 ProductLineItem  having the same position.
      - When a LineItemCtnr is copied (e.g. when a PlacedOrder is created from a Basket), no special position  handling is necessary as the ProductLineItems are added according to their current position ordering in the  source LineItemCtnr.



---

### priceAdjustments
- priceAdjustments: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns an iterator of price adjustments that have been applied to this
      product line item such as promotions on the purchase price
      (i.e. $10 Off or 10% Off).



---

### product
- product: [Product](dw.catalog.Product.md) `(read-only)`
  - : Returns the product associated with the product line item.
      
      
      The product line item might not be related to an actual catalog product, for example if it represents an option,
      or was not created from a catalog product, or if the product does not exist in the catalog anymore. In these
      cases, the method returns null.


    **See Also:**
    - [isCatalogProduct()](dw.order.ProductLineItem.md#iscatalogproduct)


---

### productID
- productID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the related product.
      
      
      Returns empty if no product is related.


    **See Also:**
    - [isCatalogProduct()](dw.order.ProductLineItem.md#iscatalogproduct)
    - [getProduct()](dw.order.ProductLineItem.md#getproduct)


---

### productInventoryList
- productInventoryList: [ProductInventoryList](dw.catalog.ProductInventoryList.md)
  - : Returns the inventory list the product line item is associated with. If the
      line item is not associated with a inventory list, or the inventory list does not
      exist, the method returns null.



---

### productInventoryListID
- productInventoryListID: [String](TopLevel.String.md)
  - : Returns the ID of the inventory list the product line item is associated with.


---

### productListItem
- productListItem: [ProductListItem](dw.customer.ProductListItem.md) `(read-only)`
  - : Returns the associated ProductListItem.


---

### productName
- productName: [String](TopLevel.String.md)
  - : Returns the name of the product that was copied when
      product was added to line item container.



---

### proratedPrice
- proratedPrice: [Money](dw.value.Money.md) `(read-only)`
  - : Returns the price of this product line item after considering all
      dependent price adjustments and prorating all Buy-X-Get-Y
      and order-level discounts, according to the scheme described in
      [PriceAdjustment.getProratedPrices()](dw.order.PriceAdjustment.md#getproratedprices). For net pricing the
      net price is returned. For gross pricing, the gross price is returned.



---

### proratedPriceAdjustmentPrices
- proratedPriceAdjustmentPrices: [Map](dw.util.Map.md) `(read-only)`
  - : Returns a Map of PriceAdjustment to Money instances. They keys to this
      map are the price adjustments that apply to this ProductLineItem either
      directly or indirectly when discounts are prorated according to the
      scheme described in [PriceAdjustment.getProratedPrices()](dw.order.PriceAdjustment.md#getproratedprices).
      The values in the map are the portion of the adjustment which applies to
      this particular product line item.



---

### qualifyingProductLineItemForBonusProduct
- qualifyingProductLineItemForBonusProduct: [ProductLineItem](dw.order.ProductLineItem.md) `(read-only)`
  - : Returns the ProductLineItem that qualified the basket for this bonus product.
      
      
      This method is only applicable if the product line item is a bonus product line item, and if the promotion is a
      product promotion with number of qualifying products granting a bonus-product discount. If these conditions
      aren't met, the method returns null. If there are multiple product line items that triggered this bonus product,
      this method returns the last one by position within the order.



---

### quantity
- quantity: [Quantity](dw.value.Quantity.md) `(read-only)`
  - : Returns the quantity of the product represented by this ProductLineItem.


---

### quantityValue
- quantityValue: [Number](TopLevel.Number.md)
  - : Returns the value of the quantity of this ProductLineItem.


---

### relatedBonusProductLineItems
- relatedBonusProductLineItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all bonus product line items for which this line item is a
      qualifying product line item. This method is usually called when
      rendering the cart so that bonus products can be shown next to the
      products that triggered their creation.



---

### reserved
- reserved: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns if the product line item is reserved.
      
      
      Reservations for the basket can be created with e.g. [Basket.reserveInventory(Number)](dw.order.Basket.md#reserveinventorynumber).
      
      
      Method must only be called for basket product line items. Exception is thrown if called for order product line
      item.



---

### shipment
- shipment: [Shipment](dw.order.Shipment.md)
  - : Returns the associated Shipment.


---

### shippingLineItem
- shippingLineItem: [ProductShippingLineItem](dw.order.ProductShippingLineItem.md) `(read-only)`
  - : Returns the dependent shipping line item of this line item.
      The shipping line item can define product-specific shipping
      costs for this product line item.



---

### stepQuantity
- stepQuantity: [Quantity](dw.value.Quantity.md) `(read-only)`
  - : Returns step quantity allowed for the product represented by the ProductLineItem
      (copied from product on initialization).
      Note: the quantity of a ProductLineItem must obey the limits set by the
      ProductLineItem's attributes 'MinOrderQuantity' and 'StepQuantity', i.e.
      for a 'MinOrderQuantity' of 2.0 and a 'StepQuantity' of 2.5 then values
      2.0, 4.5, 7.0... are allowed values.



---

### stepQuantityValue
- stepQuantityValue: [Number](TopLevel.Number.md)
  - : Return the value portion of getStepQuantity().


---

## Method Details

### createPriceAdjustment(String)
- createPriceAdjustment(promotionID: [String](TopLevel.String.md)): [PriceAdjustment](dw.order.PriceAdjustment.md)
  - : Creates a product price adjustment.
      
      
      The price adjustment line item is being initialized with the tax class code and tax rate of the product line
      item. The promotion ID is mandatory and must not be the ID of any actual promotion defined in B2C Commerce. If
      there already exists a price adjustment for the same promotionID, an exception is thrown.


    **Parameters:**
    - promotionID - Promotion ID

    **Returns:**
    - The new price adjustment


---

### createPriceAdjustment(String, Discount)
- createPriceAdjustment(promotionID: [String](TopLevel.String.md), discount: [Discount](dw.campaign.Discount.md)): [PriceAdjustment](dw.order.PriceAdjustment.md)
  - : Creates a product price adjustment representing a specific discount. The price adjustment line item is
      initialized with the tax class code and tax rate of the product line item.
      
      
      The promotion ID is mandatory and must not be the ID of any actual promotion defined in B2C Commerce. If a price
      adjustment already exists for the same promotionID, an exception is thrown.
      
      
      
      
      The possible discounts are [FixedPriceDiscount](dw.campaign.FixedPriceDiscount.md), [AmountDiscount](dw.campaign.AmountDiscount.md),
      [PercentageDiscount](dw.campaign.PercentageDiscount.md). Example:
      
      
      
      
      ```
      var myProductItem : dw.order.ProductLineItem; // assume known
      var paFixedUnitPrice100 : dw.order.PriceAdjustment = myProductItem.createPriceAdjustment("myPromotionID1", new FixedPriceDiscount(100.00));
      var paTenPercent : dw.order.PriceAdjustment = myProductItem.createPriceAdjustment("myPromotionID2", new PercentageDiscount(10));
      var paReduceBy20 : dw.order.PriceAdjustment = myProductItem.createPriceAdjustment("myPromotionID3", new AmountDiscount(20.00);
      ```


    **Parameters:**
    - promotionID - Unique custom promotion ID, not null
    - discount - The desired discount, not null

    **Returns:**
    - The new custom price adjustment


---

### createShippingLineItem()
- createShippingLineItem(): [ProductShippingLineItem](dw.order.ProductShippingLineItem.md)
  - : Creates the dependent shipping line item for this line item.
      The shipping line item can define product-specific shipping
      costs for this product line item.
      This method has replace semantics: If there is an existing
      shipping line item it will be replaced
      with a new shipping line item.


    **Returns:**
    - the created shipping line item


---

### getAdjustedGrossPrice()
- getAdjustedGrossPrice(): [Money](dw.value.Money.md)
  - : Returns the gross price of the product line item after applying all product-level
      adjustments.


    **Returns:**
    - gross price after applying product-level adjustments

    **See Also:**
    - [getAdjustedNetPrice()](dw.order.ProductLineItem.md#getadjustednetprice)
    - [getAdjustedPrice()](dw.order.ProductLineItem.md#getadjustedprice)


---

### getAdjustedNetPrice()
- getAdjustedNetPrice(): [Money](dw.value.Money.md)
  - : Returns the net price of the product line item after applying all product-level
      adjustments.


    **Returns:**
    - net price after applying product-level adjustments

    **See Also:**
    - [getAdjustedGrossPrice()](dw.order.ProductLineItem.md#getadjustedgrossprice)
    - [getAdjustedPrice()](dw.order.ProductLineItem.md#getadjustedprice)


---

### getAdjustedPrice()
- getAdjustedPrice(): [Money](dw.value.Money.md)
  - : Returns the price of the product line item after applying all product-level
      adjustments. For net pricing the adjusted net price is returned
      (see [getAdjustedNetPrice()](dw.order.ProductLineItem.md#getadjustednetprice)). For gross pricing, the adjusted
      gross price is returned (see [getAdjustedGrossPrice()](dw.order.ProductLineItem.md#getadjustedgrossprice)).


    **Returns:**
    - Adjusted net or gross price

    **See Also:**
    - [getAdjustedGrossPrice()](dw.order.ProductLineItem.md#getadjustedgrossprice)
    - [getAdjustedNetPrice()](dw.order.ProductLineItem.md#getadjustednetprice)


---

### getAdjustedPrice(Boolean)
- getAdjustedPrice(applyOrderLevelAdjustments: [Boolean](TopLevel.Boolean.md)): [Money](dw.value.Money.md)
  - : Returns the price of this product line item after considering all
      dependent price adjustments and optionally prorating all order-level
      price adjustments. For net pricing the net price is returned. For gross
      pricing, the gross price is returned.


    **Parameters:**
    - applyOrderLevelAdjustments - If true, order-level adjustments will             be applied to line item price.

    **Returns:**
    - Adjusted net or gross price

    **See Also:**
    - [getAdjustedPrice()](dw.order.ProductLineItem.md#getadjustedprice)


---

### getAdjustedTax()
- getAdjustedTax(): [Money](dw.value.Money.md)
  - : Returns the tax of the unit after applying adjustments, in the purchase currency.

    **Returns:**
    - the tax of the unit after applying adjustments, in the purchase currency.


---

### getBonusDiscountLineItem()
- getBonusDiscountLineItem(): [BonusDiscountLineItem](dw.order.BonusDiscountLineItem.md)
  - : Returns the parent bonus discount line item of this line item.  Only
      bonus product line items that have been selected by the customer as
      part of a BONUS\_CHOICE discount have one of these.


    **Returns:**
    - the bonus discount line item of this line item or null


---

### getBundledProductLineItems()
- getBundledProductLineItems(): [Collection](dw.util.Collection.md)
  - : Returns a collection containing the bundled product line items.

    **Returns:**
    - a collection containing the bundled product line items.


---

### getCategory()
- getCategory(): [Category](dw.catalog.Category.md)
  - : Returns the category the product line item is associated with. If the
      line item is not associated with a category, or the category does not
      exist in the site catalog, the method returns null.


    **Returns:**
    - Category or null


---

### getCategoryID()
- getCategoryID(): [String](TopLevel.String.md)
  - : Returns the ID of the category the product line item is associated with.

    **Returns:**
    - Category ID or null.


---

### getExternalLineItemStatus()
- getExternalLineItemStatus(): [String](TopLevel.String.md)
  - : Returns the value set for the external line item status
      or null if no value set.


    **Returns:**
    - the value set for the external line item status
      or null if no value set.



---

### getExternalLineItemText()
- getExternalLineItemText(): [String](TopLevel.String.md)
  - : Returns the value set for the external line item text
      or null if no value set.


    **Returns:**
    - the value set for the external line item text
      or null if no value set.



---

### getGiftMessage()
- getGiftMessage(): [String](TopLevel.String.md)
  - : Returns the value set for gift message or null if no value set.

    **Returns:**
    - the value set for gift message or null if no value set.


---

### getManufacturerName()
- getManufacturerName(): [String](TopLevel.String.md)
  - : Returns the name of the manfacturer of the product.

    **Returns:**
    - The name of the manfacturer of the product.


---

### getManufacturerSKU()
- getManufacturerSKU(): [String](TopLevel.String.md)
  - : Returns the name of the manfacturer's SKU of this product line item.

    **Returns:**
    - the name of the manfacturer's SKU of this product line item.


---

### getMinOrderQuantity()
- getMinOrderQuantity(): [Quantity](dw.value.Quantity.md)
  - : Returns the minimal order quantity allowed for the product represented by the
      ProductLineItem (copied from product on initialization).
      Note: the quantity of a ProductLineItem must obey the limits set by the
      ProductLineItem's attributes 'MinOrderQuantity' and 'StepQuantity', i.e.
      for a 'MinOrderQuantity' of 2.0 and a 'StepQuantity' of 2.5 then values
      2.0, 4.5, 7.0... are allowed values.


    **Returns:**
    - the minimal order quantity allowed for the product.


---

### getMinOrderQuantityValue()
- getMinOrderQuantityValue(): [Number](TopLevel.Number.md)
  - : Return the value portion of getMinOrderQuantity().

    **Returns:**
    - the minimal order quantity value allowed for the product.


---

### getOptionID()
- getOptionID(): [String](TopLevel.String.md)
  - : Returns the ID of the product option this product line item
      represents. If the product line item does not represent an option,
      null is returned.


    **Returns:**
    - the ID of the product option this product line item represents.


---

### getOptionModel()
- getOptionModel(): [ProductOptionModel](dw.catalog.ProductOptionModel.md)
  - : Returns the product option model for a product line item representing an option product.
      
      
      The returned option model has preselected values based on the dependent option line items of this product line
      item. Null is returned if this line item does not represent an option product.


    **Returns:**
    - the product option model for a product line item representing an option product.


---

### getOptionProductLineItems()
- getOptionProductLineItems(): [Collection](dw.util.Collection.md)
  - : Returns a collection containing option product line items.

    **Returns:**
    - a collection containing option product line items.


---

### getOptionValueID()
- getOptionValueID(): [String](TopLevel.String.md)
  - : Returns the ID of the product option value this product line item
      represents. If the product line item does not represent an option,
      null is returned.


    **Returns:**
    - the ID of the product option value this product line item represents.


---

### getOrderItem()
- getOrderItem(): [OrderItem](dw.order.OrderItem.md)
  - : Returns the [order-item extension](dw.order.OrderItem.md) for this item, or null. An order-item
      extension will only exist for a ProductLineItem which belongs to an [Order](dw.order.Order.md).
      
      
      Order post-processing APIs (gillian) are now inactive by default and will throw
      an exception if accessed. Activation needs preliminary approval by Product Management.
      Please contact support in this case. Existing customers using these APIs are not
      affected by this change and can use the APIs until further notice.


    **Returns:**
    - null or the order-item extension


---

### getParent()
- getParent(): [ProductLineItem](dw.order.ProductLineItem.md)
  - : Returns the parent line item of this line item or null if the line item
      is independent.


    **Returns:**
    - the parent line item of this line item or null if the line item
      is independent.



---

### getPosition()
- getPosition(): [Number](TopLevel.Number.md)
  - : Returns the position within the line item container assigned to the ProductLineItem upon its creation, may be
      used as a sort-order.
      
      
      The position is updated in the following way:
      
      - When a ProductLineItem is added to the LineItemCtnr, it is assigned the next available position, based on the  current count
      - When a ProductLineItem is removed from the LineItemCtnr then LineItemCtnr method reassignPositions is called,  so that the 'gap' left by the removed line-item is refilled. This method is dependent on no 2 ProductLineItem  having the same position.
      - When a LineItemCtnr is copied (e.g. when a PlacedOrder is created from a Basket), no special position  handling is necessary as the ProductLineItems are added according to their current position ordering in the  source LineItemCtnr.


    **Returns:**
    - the position within the line item container assigned to the ProductLineItem upon its creation.


---

### getPriceAdjustmentByPromotionID(String)
- getPriceAdjustmentByPromotionID(promotionID: [String](TopLevel.String.md)): [PriceAdjustment](dw.order.PriceAdjustment.md)
  - : Returns the first price adjustment associated to the specified promotion ID. It is highly recommended to use
      [getPriceAdjustmentsByPromotionID(String)](dw.order.ProductLineItem.md#getpriceadjustmentsbypromotionidstring) instead. If there are multiple price adjustments for the same
      promotion, this method will return the first found. Alternatively, to uniquely identify a price adjustment using
      its promotion id and coupon code, use [getPriceAdjustmentByPromotionIDAndCouponCode(String, String)](dw.order.ProductLineItem.md#getpriceadjustmentbypromotionidandcouponcodestring-string)


    **Parameters:**
    - promotionID - Promotion id

    **Returns:**
    - The price adjustment associated with the promotion ID or null


---

### getPriceAdjustmentByPromotionIDAndCouponCode(String, String)
- getPriceAdjustmentByPromotionIDAndCouponCode(promotionID: [String](TopLevel.String.md), couponCode: [String](TopLevel.String.md)): [PriceAdjustment](dw.order.PriceAdjustment.md)
  - : Returns the price adjustment associated to the specified promotion ID and coupon code combination.

    **Parameters:**
    - promotionID - Promotion id
    - couponCode - the code of the coupon used to apply the promotion, or null if the promotion is not coupon             based.

    **Returns:**
    - The price adjustment associated with the promotion ID and coupon code combination, or null


---

### getPriceAdjustments()
- getPriceAdjustments(): [Collection](dw.util.Collection.md)
  - : Returns an iterator of price adjustments that have been applied to this
      product line item such as promotions on the purchase price
      (i.e. $10 Off or 10% Off).


    **Returns:**
    - a collection of price adjustments that have been applied to this
      product line item.



---

### getPriceAdjustmentsByPromotionID(String)
- getPriceAdjustmentsByPromotionID(promotionID: [String](TopLevel.String.md)): [Collection](dw.util.Collection.md)
  - : Returns the collection of price adjustments associated to the specified promotion ID. If only one coupon code is
      allowed per order, then the collection should only ever have a single entry in it. The multiple coupon code
      feature can cause multiple price adjustments to be returned.


    **Parameters:**
    - promotionID - Promotion id

    **Returns:**
    - The collection of price adjustments associated with the promotion ID or null if the promotionID was null.
              If there are no price adjustments for the passed promotion, the collection will be empty.



---

### getProduct()
- getProduct(): [Product](dw.catalog.Product.md)
  - : Returns the product associated with the product line item.
      
      
      The product line item might not be related to an actual catalog product, for example if it represents an option,
      or was not created from a catalog product, or if the product does not exist in the catalog anymore. In these
      cases, the method returns null.


    **Returns:**
    - the product of the line item, or null

    **See Also:**
    - [isCatalogProduct()](dw.order.ProductLineItem.md#iscatalogproduct)


---

### getProductID()
- getProductID(): [String](TopLevel.String.md)
  - : Returns the ID of the related product.
      
      
      Returns empty if no product is related.


    **Returns:**
    - the ID of the related product.

    **See Also:**
    - [isCatalogProduct()](dw.order.ProductLineItem.md#iscatalogproduct)
    - [getProduct()](dw.order.ProductLineItem.md#getproduct)


---

### getProductInventoryList()
- getProductInventoryList(): [ProductInventoryList](dw.catalog.ProductInventoryList.md)
  - : Returns the inventory list the product line item is associated with. If the
      line item is not associated with a inventory list, or the inventory list does not
      exist, the method returns null.


    **Returns:**
    - ProductInventoryList or null


---

### getProductInventoryListID()
- getProductInventoryListID(): [String](TopLevel.String.md)
  - : Returns the ID of the inventory list the product line item is associated with.

    **Returns:**
    - ProductInventoryList ID or null.


---

### getProductListItem()
- getProductListItem(): [ProductListItem](dw.customer.ProductListItem.md)
  - : Returns the associated ProductListItem.

    **Returns:**
    - item or null.


---

### getProductName()
- getProductName(): [String](TopLevel.String.md)
  - : Returns the name of the product that was copied when
      product was added to line item container.


    **Returns:**
    - the name of the product.


---

### getProratedPrice()
- getProratedPrice(): [Money](dw.value.Money.md)
  - : Returns the price of this product line item after considering all
      dependent price adjustments and prorating all Buy-X-Get-Y
      and order-level discounts, according to the scheme described in
      [PriceAdjustment.getProratedPrices()](dw.order.PriceAdjustment.md#getproratedprices). For net pricing the
      net price is returned. For gross pricing, the gross price is returned.


    **Returns:**
    - Adjusted and prorated net or gross price


---

### getProratedPriceAdjustmentPrices()
- getProratedPriceAdjustmentPrices(): [Map](dw.util.Map.md)
  - : Returns a Map of PriceAdjustment to Money instances. They keys to this
      map are the price adjustments that apply to this ProductLineItem either
      directly or indirectly when discounts are prorated according to the
      scheme described in [PriceAdjustment.getProratedPrices()](dw.order.PriceAdjustment.md#getproratedprices).
      The values in the map are the portion of the adjustment which applies to
      this particular product line item.


    **Returns:**
    - Map of PriceAdjustment to Money instances, representing the
              prorated adjustments applied to this ProductLineItem.



---

### getQualifyingProductLineItemForBonusProduct()
- getQualifyingProductLineItemForBonusProduct(): [ProductLineItem](dw.order.ProductLineItem.md)
  - : Returns the ProductLineItem that qualified the basket for this bonus product.
      
      
      This method is only applicable if the product line item is a bonus product line item, and if the promotion is a
      product promotion with number of qualifying products granting a bonus-product discount. If these conditions
      aren't met, the method returns null. If there are multiple product line items that triggered this bonus product,
      this method returns the last one by position within the order.


    **Returns:**
    - the ProductLineItem that qualified the basket for this bonus product. Returns null if this is not a bonus
              product, or if there was no distinct qualifying product.



---

### getQuantity()
- getQuantity(): [Quantity](dw.value.Quantity.md)
  - : Returns the quantity of the product represented by this ProductLineItem.

    **Returns:**
    - the quantity of the product.


---

### getQuantityValue()
- getQuantityValue(): [Number](TopLevel.Number.md)
  - : Returns the value of the quantity of this ProductLineItem.

    **Returns:**
    - quantity value of product line item


---

### getRelatedBonusProductLineItems()
- getRelatedBonusProductLineItems(): [Collection](dw.util.Collection.md)
  - : Returns all bonus product line items for which this line item is a
      qualifying product line item. This method is usually called when
      rendering the cart so that bonus products can be shown next to the
      products that triggered their creation.


    **Returns:**
    - the bonus product line items triggered by the addition of this
              product to the cart.



---

### getShipment()
- getShipment(): [Shipment](dw.order.Shipment.md)
  - : Returns the associated Shipment.

    **Returns:**
    - The shipment of the product line item


---

### getShippingLineItem()
- getShippingLineItem(): [ProductShippingLineItem](dw.order.ProductShippingLineItem.md)
  - : Returns the dependent shipping line item of this line item.
      The shipping line item can define product-specific shipping
      costs for this product line item.


    **Returns:**
    - the shipping line item of this line item or null


---

### getStepQuantity()
- getStepQuantity(): [Quantity](dw.value.Quantity.md)
  - : Returns step quantity allowed for the product represented by the ProductLineItem
      (copied from product on initialization).
      Note: the quantity of a ProductLineItem must obey the limits set by the
      ProductLineItem's attributes 'MinOrderQuantity' and 'StepQuantity', i.e.
      for a 'MinOrderQuantity' of 2.0 and a 'StepQuantity' of 2.5 then values
      2.0, 4.5, 7.0... are allowed values.


    **Returns:**
    - step quantity allowed for the product.


---

### getStepQuantityValue()
- getStepQuantityValue(): [Number](TopLevel.Number.md)
  - : Return the value portion of getStepQuantity().

    **Returns:**
    - step quantity value allowed for the product.


---

### isBonusProductLineItem()
- isBonusProductLineItem(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the product line item represents a bonus line item.

    **Returns:**
    - true if the product line item represents a bonus
      line item, false otherwise.



---

### isBundledProductLineItem()
- isBundledProductLineItem(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the product line item represents a bundled line item.

    **Returns:**
    - true if the product line item represents a bundled line item.


---

### isCatalogProduct()
- isCatalogProduct(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the product line item represents a catalog product.
      
      
      That flag is determined during product line item creation with
      [LineItemCtnr.createProductLineItem(String, Shipment)](dw.order.LineItemCtnr.md#createproductlineitemstring-shipment), stored at the line item container and can
      be accessed as productLineItem.catalogProduct. It represents what can be evaluated with
      
      
      ```
      dw.catalog.ProductMgr.getProduct( productID ) != null
          && dw.catalog.ProductMgr.getProduct( productID ).isAssignedToSiteCatalog()
      ```
      
      
      If the product is not available during product line item creation it is considered a non catalog product line item without
      connection to a product.


    **Returns:**
    - true if product line item represents catalog product, otherwise false

    **See Also:**
    - [getProduct()](dw.order.ProductLineItem.md#getproduct)


---

### isGift()
- isGift(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if this line item represents a gift, false otherwise.

    **Returns:**
    - true if this line item represents a gift, false otherwise.


---

### isOptionProductLineItem()
- isOptionProductLineItem(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the product line item represents an option line item.
      Option line items do not represent true products but rather options of
      products.  An option line item always has a parent product line item
      representing a true product.


    **Returns:**
    - true if the product line item represents an option
      line item, false otherwise.



---

### isReserved()
- isReserved(): [Boolean](TopLevel.Boolean.md)
  - : Returns if the product line item is reserved.
      
      
      Reservations for the basket can be created with e.g. [Basket.reserveInventory(Number)](dw.order.Basket.md#reserveinventorynumber).
      
      
      Method must only be called for basket product line items. Exception is thrown if called for order product line
      item.


    **Returns:**
    - true if line item is reserved, false otherwise.


---

### removePriceAdjustment(PriceAdjustment)
- removePriceAdjustment(priceAdjustmentLineItem: [PriceAdjustment](dw.order.PriceAdjustment.md)): void
  - : Removes the specified price adjustment from the product line item.

    **Parameters:**
    - priceAdjustmentLineItem - The price adjustment to remove


---

### removeShippingLineItem()
- removeShippingLineItem(): void
  - : Removes the dependent shipping line item for this line item.


---

### replaceProduct(Product)
- replaceProduct(newProduct: [Product](dw.catalog.Product.md)): void
  - : Replaces the current product of the product line item with the product specified in parameter _newProduct_.
      
      
      The following rules apply:
      
      - Preserve line item attributes UUID, Quantity, CategoryID, ExternalLineItemStatus, ExternalLineItemText,  isGift, GiftMessage, Position, Parent, Shipment
      - Replace product-specific attributes ProductID, ProductName, MinOrderQuantity, StepQuantity, ManufacturerName,  ManufacturerSKU
      - Remove all price adjustments related to the product line item
      - Remove the shipping line item related to the product line item
      - Remove all bundled line items of current product, and add bundled line items if new product is a bundle
      - Remove all option line items of current product, and add option line items if new product is an option  product; use default option selections
      - Set all price attributes to N/A
      - Preserve all custom attributes of line item, but override order-required attributes with values from new  product
      
      
      
      
      
      The primary use is to replace one variation product with another, without having to both create a new line item
      for the replacement and remove the line item for the replaced product.


    **Parameters:**
    - newProduct - The new product of the product line item


---

### setCategory(Category)
- setCategory(category: [Category](dw.catalog.Category.md)): void
  - : Sets the specified category as the product line item category context.

    **Parameters:**
    - category - Category instance or null


---

### setCategoryID(String)
- setCategoryID(categoryID: [String](TopLevel.String.md)): void
  - : Sets the ID of the category the product line item is associated with.

    **Parameters:**
    - categoryID - the Category ID or null.


---

### setExternalLineItemStatus(String)
- setExternalLineItemStatus(status: [String](TopLevel.String.md)): void
  - : Sets the value to set for the external line item status.

    **Parameters:**
    - status - the value to set for the external line item status.


---

### setExternalLineItemText(String)
- setExternalLineItemText(text: [String](TopLevel.String.md)): void
  - : Sets the value to set for the external line item text.

    **Parameters:**
    - text - the value to set for the external line item text.


---

### setGift(Boolean)
- setGift(isGift: [Boolean](TopLevel.Boolean.md)): void
  - : Controls if this line item is a gift or not.

    **Parameters:**
    - isGift - set to true if you want this line item to  represent a gift.


---

### setGiftMessage(String)
- setGiftMessage(message: [String](TopLevel.String.md)): void
  - : Sets the value to set for the gift message.

    **Parameters:**
    - message - the value to set for the gift message.


---

### setManufacturerName(String)
- setManufacturerName(name: [String](TopLevel.String.md)): void
  - : Sets the name of the manufacturer of this product.

    **Parameters:**
    - name - The name of the manfacturer of this product


---

### setManufacturerSKU(String)
- setManufacturerSKU(sku: [String](TopLevel.String.md)): void
  - : Sets the SKU of the manufacturer of this product.

    **Parameters:**
    - sku - The SKU of the manfacturer of this product


---

### setMinOrderQuantityValue(Number)
- setMinOrderQuantityValue(quantityValue: [Number](TopLevel.Number.md)): void
  - : Set the minimum order quantity value for this object.
      
      
      This will be used to validate and adjust quantities when setQuantityValue() is called. For typical catalog
      product line items, it is usually desirable to have this value inherited from the product attributes, but for
      non-catalog products, it is sometimes desirable to set this value programmatically.
      
      
      
      
      Null is accepted and represents Quantity.NA. Otherwise, the quantity value must be > 0.


    **Parameters:**
    - quantityValue - The minimal order quantity allowed for the product or null.


---

### setPosition(Number)
- setPosition(aValue: [Number](TopLevel.Number.md)): void
  - : Sets the position within the line item container. This value may be used as a sort-order.
      
      
      The position is updated in the following way:
      
      - When a ProductLineItem is added to the LineItemCtnr, it is assigned the next available position, based on the  current count
      - When a ProductLineItem is removed from the LineItemCtnr then LineItemCtnr method reassignPositions is called,  so that the 'gap' left by the removed line-item is refilled. This method is dependent on no 2 ProductLineItem  having the same position.
      - When a LineItemCtnr is copied (e.g. when an Order is created from a Basket), no special position handling is  necessary as the ProductLineItems are added according to their current position ordering in the source  LineItemCtnr.


    **Parameters:**
    - aValue - the position within the line item container.


---

### setPriceValue(Number)
- setPriceValue(value: [Number](TopLevel.Number.md)): void
  - : Sets price attributes of the line item based on the current
      purchase currency, taxation policy and line item quantity.
      
      
      The method sets the 'basePrice' attribute of the line item.
      Additionally, it sets the 'netPrice' attribute of the line item
      if the current taxation policy is 'net', and the 'grossPrice'
      attribute, if the current taxation policy is 'gross'. The
      'netPrice'/'grossPrice' attributes are set by multiplying the
      specified price value with the line item quantity.
      
      
      
      
      If null is specified as value, the price attributes are reset to
      Money.NA.


    **Parameters:**
    - value - Price value or null


---

### setProductInventoryList(ProductInventoryList)
- setProductInventoryList(productInventoryList: [ProductInventoryList](dw.catalog.ProductInventoryList.md)): void
  - : Sets the specified inventory list as the product line item inventory context.

    **Parameters:**
    - productInventoryList - ProductInventoryList instance or null


---

### setProductInventoryListID(String)
- setProductInventoryListID(productInventoryListID: [String](TopLevel.String.md)): void
  - : Sets the ID of the inventory list the product line item is associated with.

    **Parameters:**
    - productInventoryListID - the ProductInventoryList ID or null.


---

### setProductName(String)
- setProductName(aValue: [String](TopLevel.String.md)): void
  - : Sets the name of the product.

    **Parameters:**
    - aValue - the name of the product.


---

### setQuantityValue(Number)
- setQuantityValue(quantityValue: [Number](TopLevel.Number.md)): void
  - : Updates the quantity value of the product line item.
      
      
      Validates the specified quantity value against the line item's min order and step quantity and adjusts it if
      necessary. In particular, if 0 is passed, then the value will be adjusted to the min order quantity, not removed
      from the line item container.
      
      
      
      
      Null values or values < 0.0 are not accepted.


    **Parameters:**
    - quantityValue - Quantity value.


---

### setShipment(Shipment)
- setShipment(shipment: [Shipment](dw.order.Shipment.md)): void
  - : Associates the specified product line item with the specified shipment.
      
      
      The method is only applicable for independent product line items. If called for any dependent line item (option
      or bundled line item), the method will throw an exception. The shipment for all dependent line items will be
      updated automatically by the method. Product line item and shipment must belong to the same line item ctnr.


    **Parameters:**
    - shipment - The new shipment of the product line item


---

### setStepQuantityValue(Number)
- setStepQuantityValue(quantityValue: [Number](TopLevel.Number.md)): void
  - : Set the step quantity value for this object.
      
      
      This will be used to validate and adjust quantities when updateQuantity() is called. For typical catalog product
      line items, it is usually desirable to have this value inherited from the product attributes, but for non-catalog
      products, it is sometimes desirable to set this value programmatically.
      
      
      
      
      Null is accepted and represents Quantity.NA. Otherwise, the quantity value must be > 0.


    **Parameters:**
    - quantityValue - The minimal order quantity allowed for the product or null.


---

### updateOptionPrice()
- updateOptionPrice(): void
  - : Determines and sets the price of a option line item based on the selected option value this line item represents.


---

### updateOptionValue(ProductOptionValue)
- updateOptionValue(optionValue: [ProductOptionValue](dw.catalog.ProductOptionValue.md)): void
  - : Updates an option line item with a new option value.
      
      This method will not do anything if the current line item is no
      option line item, if the specified value does not exist for the
      current option or if this value is already selected.
      
      Note, that this method will update the attributes optionValueID,
      productID, productName and lineItemText. It will not update the price
      attributes of the line item. To update the price of the line item you
      need to call [updateOptionPrice()](dw.order.ProductLineItem.md#updateoptionprice) in addition. This is
      usually done during calculation in the calculate hook.


    **Parameters:**
    - optionValue - The value to update the option line item with


---

### updatePrice(Money)
- ~~updatePrice(price: [Money](dw.value.Money.md)): void~~
  - : Updates the price attributes of the line item based
      on the specified price.  The base price is set to the specified
      value.  If the line item is based on net pricing then the net price
      attribute is set.  If the line item is based on  gross pricing then the
      gross price attribute is set.  Whether or not a line item is based
      on net or gross pricing is a site-wide configuration parameter.
      In either case, this price is equal to the product of the base price
      and the quantity of this line item in its container.


    **Parameters:**
    - price - The price to use when performing the update.  This price               must not be null and must either be equal to NOT\_AVAIALBLE               or must have a currency code equal to that of the parent               container.

    **Deprecated:**
:::warning
Use [setPriceValue(Number)](dw.order.ProductLineItem.md#setpricevaluenumber)
:::

---

### updateQuantity(Number)
- ~~updateQuantity(quantityValue: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)~~
  - : Updates the quantity value of the product line item and all its dependent product line items.
      
      
      Validates the specified quantity value against the line item's min order and step quantity and adjusts it if
      necessary. The adjusted quantity value is returned.
      
      
      
      
      In general, quantity values < 0.0 are not accepted.


    **Parameters:**
    - quantityValue - Numeric quantity value.

    **Returns:**
    - Adjusted quantity value

    **Deprecated:**
:::warning
Use [setQuantityValue(Number)](dw.order.ProductLineItem.md#setquantityvaluenumber) followed by [getQuantity()](dw.order.ProductLineItem.md#getquantity) instead.
:::

---

<!-- prettier-ignore-end -->
