<!-- prettier-ignore-start -->
# Class ShippingOrderHooks

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.hooks.ShippingOrderHooks](dw.order.hooks.ShippingOrderHooks.md)

This interface represents all script hooks that can be registered around
shipping order lifecycle. It contains the extension points (hook names), and
the functions that are called by each extension point. A function must be
defined inside a JavaScript source and must be exported. The script with the
exported hook function must be located inside a site cartridge. Inside the
site cartridge a 'package.json' file with a 'hooks' entry must exist.


"hooks": "./hooks.json"


The hooks entry links to a json file, relative to the 'package.json' file.
This file lists all registered hooks inside the hooks property:




```
"hooks": [
     {"name": "dw.order.shippingorder.updateShippingOrderItem", "script": "./shippingOrderUpdate.ds"},
]
```




A hook entry has a 'name' and a 'script' property.

- The 'name' contains the extension point, the hook name.
- The 'script' contains the script relative to the hooks file, with the  exported hook function.



Order post-processing APIs (gillian) are now inactive by default and will throw
an exception if accessed. Activation needs preliminary approval by Product Management.
Please contact support in this case. Existing customers using these APIs are not
affected by this change and can use the APIs until further notice.



## Constant Summary

| Constant | Description |
| --- | --- |
| [extensionPointAfterStatusChange](#extensionpointafterstatuschange): [String](TopLevel.String.md) = "dw.order.shippingorder.afterStatusChange" | The extension point name dw.order.shippingorder.afterStatusChange. |
| [extensionPointChangeStatus](#extensionpointchangestatus): [String](TopLevel.String.md) = "dw.order.shippingorder.changeStatus" | The extension point name dw.order.shippingorder.changeStatus. |
| [extensionPointCreateShippingOrders](#extensionpointcreateshippingorders): [String](TopLevel.String.md) = "dw.order.shippingorder.createShippingOrders" | The extension point name dw.order.shippingorder.createShippingOrders. |
| [extensionPointNotifyStatusChange](#extensionpointnotifystatuschange): [String](TopLevel.String.md) = "dw.order.shippingorder.notifyStatusChange" | The extension point name dw.order.shippingorder.notifyStatusChange. |
| [extensionPointPrepareCreateShippingOrders](#extensionpointpreparecreateshippingorders): [String](TopLevel.String.md) = "dw.order.shippingorder.prepareCreateShippingOrders" | The extension point name  dw.order.shippingorder.prepareCreateShippingOrders. |
| [extensionPointResolveShippingOrder](#extensionpointresolveshippingorder): [String](TopLevel.String.md) = "dw.order.shippingorder.resolveShippingOrder" | The extension point name dw.order.shippingorder.resolveShippingOrder . |
| [extensionPointShippingOrderCancelled](#extensionpointshippingordercancelled): [String](TopLevel.String.md) = "dw.order.shippingorder.setShippingOrderCancelled" | The extension point name dw.order.shippingorder.setShippingOrderCancelled. |
| [extensionPointShippingOrderShipped](#extensionpointshippingordershipped): [String](TopLevel.String.md) = "dw.order.shippingorder.setShippingOrderShipped" | The extension point name dw.order.shippingorder.setShippingOrderShipped. |
| [extensionPointShippingOrderWarehouse](#extensionpointshippingorderwarehouse): [String](TopLevel.String.md) = "dw.order.shippingorder.setShippingOrderWarehouse" | The extension point name dw.order.shippingorder.setShippingOrderWarehouse. |
| [extensionPointUpdateShippingOrderItem](#extensionpointupdateshippingorderitem): [String](TopLevel.String.md) = "dw.order.shippingorder.updateShippingOrderItem" | The extension point name dw.order.shippingorder.updateShippingOrderItem. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [afterStatusChange](dw.order.hooks.ShippingOrderHooks.md#afterstatuschangeshippingorder)([ShippingOrder](dw.order.ShippingOrder.md)) | After Status change hook. |
| [changeStatus](dw.order.hooks.ShippingOrderHooks.md#changestatusshippingorder-shippingorderwo)([ShippingOrder](dw.order.ShippingOrder.md), ShippingOrderWO) | Change the status of a shipping order. |
| [createShippingOrders](dw.order.hooks.ShippingOrderHooks.md#createshippingordersorder)([Order](dw.order.Order.md)) | Called during shipping order creation for an order. |
| [notifyStatusChange](dw.order.hooks.ShippingOrderHooks.md#notifystatuschangeshippingorder)([ShippingOrder](dw.order.ShippingOrder.md)) | Notify Status change hook. |
| [prepareCreateShippingOrders](dw.order.hooks.ShippingOrderHooks.md#preparecreateshippingordersorder)([Order](dw.order.Order.md)) | Called before shipping order creation for an order takes place. |
| [resolveShippingOrder](dw.order.hooks.ShippingOrderHooks.md#resolveshippingordershippingorderwo)(ShippingOrderWO) | Resolve the shipping order. |
| [setShippingOrderCancelled](dw.order.hooks.ShippingOrderHooks.md#setshippingordercancelledshippingorderwo)(ShippingOrderWO) | Change the status of a shipping order to cancelled. |
| [setShippingOrderShipped](dw.order.hooks.ShippingOrderHooks.md#setshippingordershippedshippingorderwo)(ShippingOrderWO) | Change the status of a shipping order to shipped. |
| [setShippingOrderWarehouse](dw.order.hooks.ShippingOrderHooks.md#setshippingorderwarehouseshippingorderwo)(ShippingOrderWO) | Change the status of a shipping order to warehouse. |
| [updateShippingOrderItem](dw.order.hooks.ShippingOrderHooks.md#updateshippingorderitemshippingorder-shippingorderitemwo)([ShippingOrder](dw.order.ShippingOrder.md), ShippingOrderItemWO) | Updates the status of a shipping order item. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### extensionPointAfterStatusChange

- extensionPointAfterStatusChange: [String](TopLevel.String.md) = "dw.order.shippingorder.afterStatusChange"
  - : The extension point name dw.order.shippingorder.afterStatusChange.


---

### extensionPointChangeStatus

- extensionPointChangeStatus: [String](TopLevel.String.md) = "dw.order.shippingorder.changeStatus"
  - : The extension point name dw.order.shippingorder.changeStatus.


---

### extensionPointCreateShippingOrders

- extensionPointCreateShippingOrders: [String](TopLevel.String.md) = "dw.order.shippingorder.createShippingOrders"
  - : The extension point name dw.order.shippingorder.createShippingOrders.


---

### extensionPointNotifyStatusChange

- extensionPointNotifyStatusChange: [String](TopLevel.String.md) = "dw.order.shippingorder.notifyStatusChange"
  - : The extension point name dw.order.shippingorder.notifyStatusChange.


---

### extensionPointPrepareCreateShippingOrders

- extensionPointPrepareCreateShippingOrders: [String](TopLevel.String.md) = "dw.order.shippingorder.prepareCreateShippingOrders"
  - : The extension point name
      dw.order.shippingorder.prepareCreateShippingOrders.



---

### extensionPointResolveShippingOrder

- extensionPointResolveShippingOrder: [String](TopLevel.String.md) = "dw.order.shippingorder.resolveShippingOrder"
  - : The extension point name dw.order.shippingorder.resolveShippingOrder .


---

### extensionPointShippingOrderCancelled

- extensionPointShippingOrderCancelled: [String](TopLevel.String.md) = "dw.order.shippingorder.setShippingOrderCancelled"
  - : The extension point name dw.order.shippingorder.setShippingOrderCancelled.


---

### extensionPointShippingOrderShipped

- extensionPointShippingOrderShipped: [String](TopLevel.String.md) = "dw.order.shippingorder.setShippingOrderShipped"
  - : The extension point name dw.order.shippingorder.setShippingOrderShipped.


---

### extensionPointShippingOrderWarehouse

- extensionPointShippingOrderWarehouse: [String](TopLevel.String.md) = "dw.order.shippingorder.setShippingOrderWarehouse"
  - : The extension point name dw.order.shippingorder.setShippingOrderWarehouse.


---

### extensionPointUpdateShippingOrderItem

- extensionPointUpdateShippingOrderItem: [String](TopLevel.String.md) = "dw.order.shippingorder.updateShippingOrderItem"
  - : The extension point name dw.order.shippingorder.updateShippingOrderItem.


---

## Method Details

### afterStatusChange(ShippingOrder)
- afterStatusChange(shippingOrder: [ShippingOrder](dw.order.ShippingOrder.md)): [Status](dw.system.Status.md)
  - : After Status change hook.
      
      
      The function is called by extension point
      [extensionPointAfterStatusChange](dw.order.hooks.ShippingOrderHooks.md#extensionpointafterstatuschange).
      
      The implementation of this hook is optional. If defined the hook is
      called after [extensionPointChangeStatus](dw.order.hooks.ShippingOrderHooks.md#extensionpointchangestatus) or respectively after
      [extensionPointShippingOrderShipped](dw.order.hooks.ShippingOrderHooks.md#extensionpointshippingordershipped),
      [extensionPointShippingOrderCancelled](dw.order.hooks.ShippingOrderHooks.md#extensionpointshippingordercancelled) or
      [extensionPointShippingOrderWarehouse](dw.order.hooks.ShippingOrderHooks.md#extensionpointshippingorderwarehouse)
      
      Runs inside of a transaction.


    **Parameters:**
    - shippingOrder - the shipping order to be updated

    **Returns:**
    - the resulting status


---

### changeStatus(ShippingOrder, ShippingOrderWO)
- changeStatus(shippingOrder: [ShippingOrder](dw.order.ShippingOrder.md), updateData: ShippingOrderWO): [Status](dw.system.Status.md)
  - : Change the status of a shipping order.
      
      
      The function is called by extension point
      [extensionPointChangeStatus](dw.order.hooks.ShippingOrderHooks.md#extensionpointchangestatus).
      
      Runs inside a transaction together with the hooks
      [extensionPointResolveShippingOrder](dw.order.hooks.ShippingOrderHooks.md#extensionpointresolveshippingorder)
      [extensionPointUpdateShippingOrderItem](dw.order.hooks.ShippingOrderHooks.md#extensionpointupdateshippingorderitem).
      
      
      Runs after the iteration over the input's items collection as the last
      step in this transaction. The implementation of this hook is mandatory.


    **Parameters:**
    - shippingOrder - the shipping order to be updated
    - updateData - the input data

    **Returns:**
    - the resulting status


---

### createShippingOrders(Order)
- createShippingOrders(order: [Order](dw.order.Order.md)): [Status](dw.system.Status.md)
  - : Called during shipping order creation for an order.
      
      
      The function is called by extension point
      [extensionPointCreateShippingOrders](dw.order.hooks.ShippingOrderHooks.md#extensionpointcreateshippingorders). It is responsible for
      creating shipping orders and its items for the order. Preparations for
      shipping order creation can be done before in hook
      [extensionPointPrepareCreateShippingOrders](dw.order.hooks.ShippingOrderHooks.md#extensionpointpreparecreateshippingorders).
      
      Runs inside of a transaction. The implementation of this hook is
      mandatory.


    **Parameters:**
    - order - the order to create shipping orders for

    **Returns:**
    - the resulting status


---

### notifyStatusChange(ShippingOrder)
- notifyStatusChange(shippingOrder: [ShippingOrder](dw.order.ShippingOrder.md)): [Status](dw.system.Status.md)
  - : Notify Status change hook.
      
      
      The function is called by extension point
      [extensionPointNotifyStatusChange](dw.order.hooks.ShippingOrderHooks.md#extensionpointnotifystatuschange).
      
      The implementation of this hook is optional. If defined the hook is
      called after [extensionPointAfterStatusChange](dw.order.hooks.ShippingOrderHooks.md#extensionpointafterstatuschange) as the last step
      in the shipping order update process.
      
      Runs outside of a transaction.


    **Parameters:**
    - shippingOrder - the shipping order to be updated

    **Returns:**
    - the resulting status


---

### prepareCreateShippingOrders(Order)
- prepareCreateShippingOrders(order: [Order](dw.order.Order.md)): [Status](dw.system.Status.md)
  - : Called before shipping order creation for an order takes place. Typically
      the hook is used to check the payment authorization status of the order.
      
      
      The function is called by extension point
      [extensionPointPrepareCreateShippingOrders](dw.order.hooks.ShippingOrderHooks.md#extensionpointpreparecreateshippingorders).
      
      Runs inside its own transaction. The value of the return status is used
      to control whether hook [createShippingOrders(Order)](dw.order.hooks.ShippingOrderHooks.md#createshippingordersorder) is called
      for the order or not. The implementation of this hook is mandatory.


    **Parameters:**
    - order - the order to create shipping orders for

    **Returns:**
    - 
      - Status.OK successful preparation - continue with shipping          order creation for this order.
      - Status.ERROR failed          preparation - skip shipping order creation for this order.



---

### resolveShippingOrder(ShippingOrderWO)
- resolveShippingOrder(updateData: ShippingOrderWO): [ShippingOrder](dw.order.ShippingOrder.md)
  - : Resolve the shipping order. Will be called as first step of the update.
      
      
      The function is called by extension point
      [extensionPointResolveShippingOrder](dw.order.hooks.ShippingOrderHooks.md#extensionpointresolveshippingorder).
      
      Runs inside a transaction together with the hooks
      
      [extensionPointUpdateShippingOrderItem](dw.order.hooks.ShippingOrderHooks.md#extensionpointupdateshippingorderitem)
      [extensionPointChangeStatus](dw.order.hooks.ShippingOrderHooks.md#extensionpointchangestatus). The implementation of this hook is
      mandatory.


    **Parameters:**
    - updateData - the input data

    **Returns:**
    - the shipping order to update


---

### setShippingOrderCancelled(ShippingOrderWO)
- setShippingOrderCancelled(updateData: ShippingOrderWO): [Order](dw.order.Order.md)
  - : Change the status of a shipping order to cancelled.
      
      
      The function is called by extension point
      [extensionPointShippingOrderCancelled](dw.order.hooks.ShippingOrderHooks.md#extensionpointshippingordercancelled).
      
      This is an optional hook that can be implemented to have full control
      over status change to destination status Cancelled. The following hooks
      will be skipped if an implementation for this hook is registered:
      [extensionPointResolveShippingOrder](dw.order.hooks.ShippingOrderHooks.md#extensionpointresolveshippingorder),
      [extensionPointUpdateShippingOrderItem](dw.order.hooks.ShippingOrderHooks.md#extensionpointupdateshippingorderitem),
      [extensionPointChangeStatus](dw.order.hooks.ShippingOrderHooks.md#extensionpointchangestatus).
      
      Runs inside of a transaction.


    **Parameters:**
    - updateData - the input data

    **Returns:**
    - the changed order or {code}null{code}


---

### setShippingOrderShipped(ShippingOrderWO)
- setShippingOrderShipped(updateData: ShippingOrderWO): [Order](dw.order.Order.md)
  - : Change the status of a shipping order to shipped.
      
      
      The function is called by extension point
      [extensionPointShippingOrderShipped](dw.order.hooks.ShippingOrderHooks.md#extensionpointshippingordershipped).
      
      This is an optional hook that can be implemented to have full control
      over status change to destination status Shipped. The following hooks
      will be skipped if an implementation for this hook is registered:
      [extensionPointResolveShippingOrder](dw.order.hooks.ShippingOrderHooks.md#extensionpointresolveshippingorder)
      [extensionPointUpdateShippingOrderItem](dw.order.hooks.ShippingOrderHooks.md#extensionpointupdateshippingorderitem),
      [extensionPointChangeStatus](dw.order.hooks.ShippingOrderHooks.md#extensionpointchangestatus).
      
      Runs inside of a transaction.


    **Parameters:**
    - updateData - the input data

    **Returns:**
    - the changed order or {code}null{code}


---

### setShippingOrderWarehouse(ShippingOrderWO)
- setShippingOrderWarehouse(updateData: ShippingOrderWO): [Order](dw.order.Order.md)
  - : Change the status of a shipping order to warehouse.
      
      
      The function is called by extension point
      [extensionPointShippingOrderWarehouse](dw.order.hooks.ShippingOrderHooks.md#extensionpointshippingorderwarehouse).
      
      This is an optional hook that can be implemented to have full control
      over status change to destination status Warehouse. The following hooks
      will be skipped if an implementation for this hook is registered:
      [extensionPointResolveShippingOrder](dw.order.hooks.ShippingOrderHooks.md#extensionpointresolveshippingorder),
      [extensionPointUpdateShippingOrderItem](dw.order.hooks.ShippingOrderHooks.md#extensionpointupdateshippingorderitem),
      [extensionPointChangeStatus](dw.order.hooks.ShippingOrderHooks.md#extensionpointchangestatus).
      
      Runs inside of a transaction.


    **Parameters:**
    - updateData - the input data

    **Returns:**
    - the changed order or {code}null{code}


---

### updateShippingOrderItem(ShippingOrder, ShippingOrderItemWO)
- updateShippingOrderItem(shippingOrder: [ShippingOrder](dw.order.ShippingOrder.md), updateItem: ShippingOrderItemWO): [Status](dw.system.Status.md)
  - : Updates the status of a shipping order item.
      
      
      The function is called by extension point
      [extensionPointUpdateShippingOrderItem](dw.order.hooks.ShippingOrderHooks.md#extensionpointupdateshippingorderitem).
      
      Runs inside a transaction together with the hooks
      
      [extensionPointResolveShippingOrder](dw.order.hooks.ShippingOrderHooks.md#extensionpointresolveshippingorder)
      [extensionPointChangeStatus](dw.order.hooks.ShippingOrderHooks.md#extensionpointchangestatus). The implementation of this hook is
      mandatory.


    **Parameters:**
    - shippingOrder - the shipping order
    - updateItem - the input data

    **Returns:**
    - the resulting status


---

<!-- prettier-ignore-end -->
