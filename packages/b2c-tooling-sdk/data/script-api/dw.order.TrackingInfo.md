<!-- prettier-ignore-start -->
# Class TrackingInfo

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.Extensible](dw.object.Extensible.md)
    - [dw.order.TrackingInfo](dw.order.TrackingInfo.md)

Provides basic information about a tracking info. An instance is identified by an ID and can be referenced from n ShippingOrderItems
using [TrackingRef](dw.order.TrackingRef.md)s. This also allows one [ShippingOrderItem](dw.order.ShippingOrderItem.md) to be associated with n TrackingInfo.


**See Also:**
- [ShippingOrder.addTrackingInfo(String)](dw.order.ShippingOrder.md#addtrackinginfostring)
- [ShippingOrderItem.addTrackingRef(String, Quantity)](dw.order.ShippingOrderItem.md#addtrackingrefstring-quantity)


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Get the mandatory identifier for this tracking information. |
| [carrier](#carrier): [String](TopLevel.String.md) | Get the Carrier. |
| [carrierService](#carrierservice): [String](TopLevel.String.md) | Get the service(ship method) of the used carrier. |
| [shipDate](#shipdate): [Date](TopLevel.Date.md) | Get the ship date. |
| [shippingOrder](#shippingorder): [ShippingOrder](dw.order.ShippingOrder.md) `(read-only)` | Gets the shipping order. |
| [trackingNumber](#trackingnumber): [String](TopLevel.String.md) | Get the tracking number. |
| [trackingRefs](#trackingrefs): [Collection](dw.util.Collection.md) `(read-only)` | Gets the tracking refs (shipping order items) which are assigned to this tracking info. |
| [warehouseID](#warehouseid): [String](TopLevel.String.md) | Get the id of the shipping warehouse. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCarrier](dw.order.TrackingInfo.md#getcarrier)() | Get the Carrier. |
| [getCarrierService](dw.order.TrackingInfo.md#getcarrierservice)() | Get the service(ship method) of the used carrier. |
| [getID](dw.order.TrackingInfo.md#getid)() | Get the mandatory identifier for this tracking information. |
| [getShipDate](dw.order.TrackingInfo.md#getshipdate)() | Get the ship date. |
| [getShippingOrder](dw.order.TrackingInfo.md#getshippingorder)() | Gets the shipping order. |
| [getTrackingNumber](dw.order.TrackingInfo.md#gettrackingnumber)() | Get the tracking number. |
| [getTrackingRefs](dw.order.TrackingInfo.md#gettrackingrefs)() | Gets the tracking refs (shipping order items) which are assigned to this tracking info. |
| [getWarehouseID](dw.order.TrackingInfo.md#getwarehouseid)() | Get the id of the shipping warehouse. |
| [setCarrier](dw.order.TrackingInfo.md#setcarrierstring)([String](TopLevel.String.md)) | Set the Carrier. |
| [setCarrierService](dw.order.TrackingInfo.md#setcarrierservicestring)([String](TopLevel.String.md)) | Set the service(ship method) of the used carrier. |
| [setShipDate](dw.order.TrackingInfo.md#setshipdatedate)([Date](TopLevel.Date.md)) | Set the ship date. |
| [setTrackingNumber](dw.order.TrackingInfo.md#settrackingnumberstring)([String](TopLevel.String.md)) | Set the TrackingNumber. |
| [setWarehouseID](dw.order.TrackingInfo.md#setwarehouseidstring)([String](TopLevel.String.md)) | Set the id of the shipping warehouse. |

### Methods inherited from class Extensible

[describe](dw.object.Extensible.md#describe), [getCustom](dw.object.Extensible.md#getcustom)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Get the mandatory identifier for this tracking information. The id allows the tracking information to be referenced from
      [TrackingRef](dw.order.TrackingRef.md)s. To support short shipping a shipping-order-item can manage a list of
      TrackingRefs, each with an optional quantity value allowing individual items to ship in multiple
      parcels with known item quantity in each.


    **See Also:**
    - [ShippingOrder.addTrackingInfo(String)](dw.order.ShippingOrder.md#addtrackinginfostring)


---

### carrier
- carrier: [String](TopLevel.String.md)
  - : Get the Carrier.


---

### carrierService
- carrierService: [String](TopLevel.String.md)
  - : Get the service(ship method) of the used carrier.


---

### shipDate
- shipDate: [Date](TopLevel.Date.md)
  - : Get the ship date.


---

### shippingOrder
- shippingOrder: [ShippingOrder](dw.order.ShippingOrder.md) `(read-only)`
  - : Gets the shipping order.


---

### trackingNumber
- trackingNumber: [String](TopLevel.String.md)
  - : Get the tracking number.


---

### trackingRefs
- trackingRefs: [Collection](dw.util.Collection.md) `(read-only)`
  - : Gets the tracking refs (shipping order items) which are assigned to this tracking info.


---

### warehouseID
- warehouseID: [String](TopLevel.String.md)
  - : Get the id of the shipping warehouse.


---

## Method Details

### getCarrier()
- getCarrier(): [String](TopLevel.String.md)
  - : Get the Carrier.

    **Returns:**
    - the Carrier


---

### getCarrierService()
- getCarrierService(): [String](TopLevel.String.md)
  - : Get the service(ship method) of the used carrier.

    **Returns:**
    - the carrier service (ship method)


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Get the mandatory identifier for this tracking information. The id allows the tracking information to be referenced from
      [TrackingRef](dw.order.TrackingRef.md)s. To support short shipping a shipping-order-item can manage a list of
      TrackingRefs, each with an optional quantity value allowing individual items to ship in multiple
      parcels with known item quantity in each.


    **Returns:**
    - the id

    **See Also:**
    - [ShippingOrder.addTrackingInfo(String)](dw.order.ShippingOrder.md#addtrackinginfostring)


---

### getShipDate()
- getShipDate(): [Date](TopLevel.Date.md)
  - : Get the ship date.

    **Returns:**
    - the ship date


---

### getShippingOrder()
- getShippingOrder(): [ShippingOrder](dw.order.ShippingOrder.md)
  - : Gets the shipping order.

    **Returns:**
    - the shipping order


---

### getTrackingNumber()
- getTrackingNumber(): [String](TopLevel.String.md)
  - : Get the tracking number.

    **Returns:**
    - the TrackingNumber


---

### getTrackingRefs()
- getTrackingRefs(): [Collection](dw.util.Collection.md)
  - : Gets the tracking refs (shipping order items) which are assigned to this tracking info.

    **Returns:**
    - the tracking refs (shipping order items) which are assigned to this tracking info.


---

### getWarehouseID()
- getWarehouseID(): [String](TopLevel.String.md)
  - : Get the id of the shipping warehouse.

    **Returns:**
    - the id of the shipping warehouse


---

### setCarrier(String)
- setCarrier(carrier: [String](TopLevel.String.md)): void
  - : Set the Carrier.

    **Parameters:**
    - carrier - the Carrier


---

### setCarrierService(String)
- setCarrierService(carrierService: [String](TopLevel.String.md)): void
  - : Set the service(ship method) of the used carrier.

    **Parameters:**
    - carrierService - the carrier service, eg. the ship method


---

### setShipDate(Date)
- setShipDate(shipDate: [Date](TopLevel.Date.md)): void
  - : Set the ship date.

    **Parameters:**
    - shipDate - the ship date


---

### setTrackingNumber(String)
- setTrackingNumber(trackingNumber: [String](TopLevel.String.md)): void
  - : Set the TrackingNumber.

    **Parameters:**
    - trackingNumber - the TrackingNumber


---

### setWarehouseID(String)
- setWarehouseID(warehouseID: [String](TopLevel.String.md)): void
  - : Set the id of the shipping warehouse.

    **Parameters:**
    - warehouseID - the id of the shipping warehouse


---

<!-- prettier-ignore-end -->
