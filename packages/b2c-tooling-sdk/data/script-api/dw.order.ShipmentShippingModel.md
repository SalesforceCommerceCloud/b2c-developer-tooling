<!-- prettier-ignore-start -->
# Class ShipmentShippingModel

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.ShipmentShippingModel](dw.order.ShipmentShippingModel.md)

Instances of ShipmentShippingModel provide access to shipment-level
shipping information, such as applicable and inapplicable shipping methods
and shipping cost. 


Use [ShippingMgr.getShipmentShippingModel(Shipment)](dw.order.ShippingMgr.md#getshipmentshippingmodelshipment) to get
the shipping model for a specific shipment.



## Property Summary

| Property | Description |
| --- | --- |
| [applicableShippingMethods](#applicableshippingmethods): [Collection](dw.util.Collection.md) `(read-only)` | Returns the active applicable shipping methods for the shipment related  to this shipping model. |
| [inapplicableShippingMethods](#inapplicableshippingmethods): [Collection](dw.util.Collection.md) `(read-only)` | Returns the active inapplicable shipping methods for the shipment related  to this shipping model. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getApplicableShippingMethods](dw.order.ShipmentShippingModel.md#getapplicableshippingmethods)() | Returns the active applicable shipping methods for the shipment related  to this shipping model. |
| [getApplicableShippingMethods](dw.order.ShipmentShippingModel.md#getapplicableshippingmethodsobject)([Object](TopLevel.Object.md)) | Returns the active applicable shipping methods for the shipment related  to this shipping model and the specified shipping address. |
| [getInapplicableShippingMethods](dw.order.ShipmentShippingModel.md#getinapplicableshippingmethods)() | Returns the active inapplicable shipping methods for the shipment related  to this shipping model. |
| [getInapplicableShippingMethods](dw.order.ShipmentShippingModel.md#getinapplicableshippingmethodsobject)([Object](TopLevel.Object.md)) | Returns the active inapplicable shipping methods for the shipment related  to this shipping model and the specified shipping address. |
| [getShippingCost](dw.order.ShipmentShippingModel.md#getshippingcostshippingmethod)([ShippingMethod](dw.order.ShippingMethod.md)) | Returns the shipping cost object for the related shipment and  the specified shipping method. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### applicableShippingMethods
- applicableShippingMethods: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the active applicable shipping methods for the shipment related
      to this shipping model. A shipping method is applicable for a shipment
      if it does not exclude any of the products in the shipment, and does
      not exclude the shipment's shipping address, if this is set. Also checks
      that the the shipment customer belongs to an assigned customer group of the shipment
      (if any are assigned).



---

### inapplicableShippingMethods
- inapplicableShippingMethods: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the active inapplicable shipping methods for the shipment related
      to this shipping model. A shipping method is inapplicable for a shipment
      if it is inapplicable for at least one product contained in the
      shipment, or the shipping address is excluded by the shipping method, or the
      shipping method is restricted to customer groups that the shipment customer
      is not a part of.



---

## Method Details

### getApplicableShippingMethods()
- getApplicableShippingMethods(): [Collection](dw.util.Collection.md)
  - : Returns the active applicable shipping methods for the shipment related
      to this shipping model. A shipping method is applicable for a shipment
      if it does not exclude any of the products in the shipment, and does
      not exclude the shipment's shipping address, if this is set. Also checks
      that the the shipment customer belongs to an assigned customer group of the shipment
      (if any are assigned).


    **Returns:**
    - Applicable shipping methods for the shipment


---

### getApplicableShippingMethods(Object)
- getApplicableShippingMethods(shippingAddressObj: [Object](TopLevel.Object.md)): [Collection](dw.util.Collection.md)
  - : Returns the active applicable shipping methods for the shipment related
      to this shipping model and the specified shipping address. A shipping
      method is applicable if it does not exclude any of the products in the
      shipment, it does not exclude the specified shipping address, and the
      shipment customer belongs to an assigned customer group for the shipment (if
      any are assigned).
      
      
      The parameter shippingAddressObj must be a JavaScript literal with the
      same properties as an OrderAddress object, or alternatively a Map.
      For example:
      
      
      
      
      ```
      model.getApplicableShippingMethods (
         { countryCode: "US",
           stateCode: "MA,
           custom { POBox : true }
         }
      )
      ```
      
      
      This method is useful when it is needed to retrieve the list of
      applicable shipping methods for an address before the address is saved to
      the shipment.


    **Parameters:**
    - shippingAddressObj - A JavaScript object representing an order             address, must not be null.

    **Returns:**
    - Applicable shipping methods for the shipment


---

### getInapplicableShippingMethods()
- getInapplicableShippingMethods(): [Collection](dw.util.Collection.md)
  - : Returns the active inapplicable shipping methods for the shipment related
      to this shipping model. A shipping method is inapplicable for a shipment
      if it is inapplicable for at least one product contained in the
      shipment, or the shipping address is excluded by the shipping method, or the
      shipping method is restricted to customer groups that the shipment customer
      is not a part of.


    **Returns:**
    - Inapplicable shipping methods for the shipment


---

### getInapplicableShippingMethods(Object)
- getInapplicableShippingMethods(shippingAddressObj: [Object](TopLevel.Object.md)): [Collection](dw.util.Collection.md)
  - : Returns the active inapplicable shipping methods for the shipment related
      to this shipping model and the specified shipping address. A shipping
      method is inapplicable if it is inapplicable for at least one product
      contained in the shipment, or the specified shipping address is excluded
      by the shipping method, or the shipping method is restricted to customer
      groups that the shipment customer is not a part of.
      
      
      The parameter shippingAddressObj must be a JavaScript literal with the
      same properties as an OrderAddress object, or alternatively a Map.
      For example:
      
      
      
      
      ```
      model.getApplicableShippingMethods (
         { countryCode: "US",
           stateCode: "MA,
           custom { POBox : true }
         }
      )
      ```
      
      
      This method is useful when it is needed to retrieve the list of
      applicable shipping methods for an address before the address is saved to
      the shipment.


    **Parameters:**
    - shippingAddressObj - A JavaScript object representing an order             address.

    **Returns:**
    - Inapplicable shipping methods for the shipment


---

### getShippingCost(ShippingMethod)
- getShippingCost(shippingMethod: [ShippingMethod](dw.order.ShippingMethod.md)): [ShipmentShippingCost](dw.order.ShipmentShippingCost.md)
  - : Returns the shipping cost object for the related shipment and
      the specified shipping method. Shipping cost for shipments
      depended on the merchandise total of the shipment. The method
      uses the adjusted merchandise total after product and order discounts,
      and excluding products with product-level fixed-price shipping
      cost.


    **Parameters:**
    - shippingMethod - the shipping method to use.

    **Returns:**
    - Product shipping cost


---

<!-- prettier-ignore-end -->
