<!-- prettier-ignore-start -->
# Class ReturnHooks

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.hooks.ReturnHooks](dw.order.hooks.ReturnHooks.md)

This interface represents all script hooks that can be registered to
customizing the order center return resource. It contains the extension
points (hook names), and the functions that are called by each extension
point. A function must be defined inside a JavaScript source and must be
exported. The script with the exported hook function must be located inside a
site cartridge. Inside the site cartridge a 'package.json' file with a
'hooks' entry must exist.


"hooks": "./hooks.json"


The hooks entry links to a json file, relative to the 'package.json' file.
This file lists all registered hooks inside the hooks property:




```
"hooks": [
   {"name": "dw.order.return.createReturn",           "script": "./returns.ds"},
   {"name": "dw.order.return.addReturnItem",          "script": "./returns.ds"},
   {"name": "dw.order.return.changeStatus",           "script": "./returns.ds"},
]
```




A hook entry has a 'name' and a 'script' property.

- The 'name' contains the extension point, the hook name.
- The 'script' contains the script relative to the hooks file, with the  exported hook function.


Overview Return Functionality Business objects 
[ReturnCase](dw.order.ReturnCase.md) All returns exist in the context of a
[ReturnCase](dw.order.ReturnCase.md), each [Order](dw.order.Order.md) can have any number
of [ReturnCase](dw.order.ReturnCase.md)s. 

A [ReturnCase](dw.order.ReturnCase.md) has [ReturnCaseItem](dw.order.ReturnCaseItem.md)s, each of
which is associated with an [OrderItem](dw.order.OrderItem.md) (an extension to
either a [ProductLineItem](dw.order.ProductLineItem.md) or a
[ShippingLineItem](dw.order.ShippingLineItem.md)). 

Each [ReturnCaseItem](dw.order.ReturnCaseItem.md) defines an
[ReturnCaseItem.getAuthorizedQuantity()](dw.order.ReturnCaseItem.md#getauthorizedquantity) representing the
maximum quantity expected to be returned. A [ReturnCaseItem](dw.order.ReturnCaseItem.md)
may be associated with 0..n [ReturnItem](dw.order.ReturnItem.md)s -
[ReturnItem](dw.order.ReturnItem.md)s are added to the [ReturnCaseItem](dw.order.ReturnCaseItem.md)
when [Return](dw.order.Return.md)s are created.


_Either_ - a [ReturnCase](dw.order.ReturnCase.md) may be used as an RMA, in which
case they are created when a customer first shows a wish to return item(s).
The customer then includes the RMA number with the returned item(s). The
[Return](dw.order.Return.md) created as a result is then associated with the
existing [ReturnCase](dw.order.ReturnCase.md). 

_Or_ - a [ReturnCase](dw.order.ReturnCase.md) is automatically created as part of
the return creation, i.e. the customer returns some item(s) leading to a
creation of both a [Return](dw.order.Return.md) and an associated
[ReturnCase](dw.order.ReturnCase.md).




The scripting api allows access to the [ReturnCase](dw.order.ReturnCase.md)s, whether
the [ReturnCase](dw.order.ReturnCase.md) is an RMA or not, and the
[ReturnCase](dw.order.ReturnCase.md) status. Both the [ReturnCaseItem](dw.order.ReturnCaseItem.md)s
and any [Return](dw.order.Return.md)s associated with the
[ReturnCase](dw.order.ReturnCase.md) can be accessed.


A [ReturnCase](dw.order.ReturnCase.md) has one of these status values:

- New - the [ReturnCase](dw.order.ReturnCase.md)has been created and can be edited  previous to its authorization
- CONFIRMED - the [ReturnCase](dw.order.ReturnCase.md)is CONFIRMED, can no longer  be edited, no [Return](dw.order.Return.md)s have been associated with it. Only an  New- [ReturnCase](dw.order.ReturnCase.md)can be CONFIRMED
- PARTIAL\_RETURNED - the [ReturnCase](dw.order.ReturnCase.md)has been associated  with at least one [Return](dw.order.Return.md), but is not yet complete. Only an  CONFIRMED- [ReturnCase](dw.order.ReturnCase.md)can be set to PARTIAL\_RETURNED
- RETURNED - the [ReturnCase](dw.order.ReturnCase.md)has been associated with  [Return](dw.order.Return.md)s which match the expected authorized quantity. Only  an CONFIRMED- or PARTIAL\_RETURNED- return-case can be set to RETURNED
- Cancelled - the [ReturnCase](dw.order.ReturnCase.md)has been cancelled (only a  New- or CONFIRMED- [ReturnCase](dw.order.ReturnCase.md)can be cancelled)


[Return](dw.order.Return.md)
A [Return](dw.order.Return.md) represents a physical customer return, and contains
1..n [ReturnItem](dw.order.ReturnItem.md)s. A [Return](dw.order.Return.md) is associated
with one [ReturnCase](dw.order.ReturnCase.md), and each [ReturnItem](dw.order.ReturnItem.md) is
associated with one [ReturnCaseItem](dw.order.ReturnCaseItem.md) and (via the
[ReturnCaseItem](dw.order.ReturnCaseItem.md)) a single [OrderItem](dw.order.OrderItem.md) usually
representing an [Order](dw.order.Order.md) [ProductLineItem](dw.order.ProductLineItem.md). 

A [ReturnItem](dw.order.ReturnItem.md) records the quantity returned. 

A [Return](dw.order.Return.md) can have one of these status values:

- NEW - the [Return](dw.order.Return.md)is new, i.e. needs to undergo a check  before it can be marked as COMPLETED
- COMPLETED - the return is complete, this is a precondition for refunding  the customer for a return.

Credit Invoice
As a result of making a [Return](dw.order.Return.md), the customer may be
refunded. The refund amount is held in a credit [Invoice](dw.order.Invoice.md)
which may be associated _either_ with one [Return](dw.order.Return.md)
_or_ with one [ReturnCase](dw.order.ReturnCase.md). The [Invoice](dw.order.Invoice.md)
is passed to the _refund_ payment hook allowing custom code to handle
the payment refund.

Process overview
Create [ReturnCase](dw.order.ReturnCase.md)
The creation of [ReturnCase](dw.order.ReturnCase.md)s is supported using the data-api.
The api supports, within the context of an [Order](dw.order.Order.md), the
specification of an (optional) RMA-number and addition of
[ReturnCaseItem](dw.order.ReturnCaseItem.md)s for a given order-item and quantity.
Authorize [ReturnCase](dw.order.ReturnCase.md)
Following its creation, a [ReturnCase](dw.order.ReturnCase.md) needs to be CONFIRMED -
an CONFIRMED [ReturnCase](dw.order.ReturnCase.md) cannot be modified.
Cancel [ReturnCase](dw.order.ReturnCase.md)
Following its creation or authorization, a [ReturnCase](dw.order.ReturnCase.md) may be
cancelled.
Create [Return](dw.order.Return.md)
[Return](dw.order.Return.md)s may be imported or created via the data-api. These
apis specify an (optional) RMA allowing a [Return](dw.order.Return.md) to be
associated with a [ReturnCase](dw.order.ReturnCase.md), and
[ReturnItem](dw.order.ReturnItem.md)s with a quantity and a key allowing them to be
associated with an order-item. The process is delegated to custom scripts
which control the creation of the [Return](dw.order.Return.md) and the addition of
the [ReturnItem](dw.order.ReturnItem.md)s:

Hook [extensionPointCreateReturn](dw.order.hooks.ReturnHooks.md#extensionpointcreatereturn)
The creation of the new [Return](dw.order.Return.md) is delegated to the custom
script when this hook is called, passing the order, and details of the
[Return](dw.order.Return.md) to be created to the script. Typically the script
accesses the [ReturnCase](dw.order.ReturnCase.md) from the order and creates the
return with the provided return-number. It may also update the
[Order](dw.order.Order.md), [ReturnCase](dw.order.ReturnCase.md) or
[Return](dw.order.Return.md) using custom values passed in the
[Return](dw.order.Return.md) details. 

`
   
exports.createReturn = function (order:Order, returnDetails) {
   
  var returnNumber=returnDetails.returnNumber;
   
  var returnCase = order.getReturnCase(returnDetails.returnCaseNumber);
   
  var newReturn = returnCase.createReturn(returnNumber);
   
 return newReturn;
   
}`

Hook [extensionPointAddReturnItem](dw.order.hooks.ReturnHooks.md#extensionpointaddreturnitem)
This call delegates the creation of individual [ReturnItem](dw.order.ReturnItem.md)s
to a custom script, passing the [Order](dw.order.Order.md), returnNumber,
returnCaseItemId and return-item-details. Typically the script will access
the [ReturnCaseItem](dw.order.ReturnCaseItem.md) from the order and create a new
[ReturnItem](dw.order.ReturnItem.md) for it. 

`exports.addReturnItem = function (retrn:Return, returnItemDetails) {
   
 var returnCaseItem = order.getReturnCaseItem(returnCaseItemId);
   
 var item = returnCaseItem.createReturnItem(returnNr);
   
`

Hook [extensionPointChangeStatus](dw.order.hooks.ReturnHooks.md#extensionpointchangestatus)
This call delegates the update of the return-status to a custom script,
passing the [Order](dw.order.Order.md), returnNumber and new status. The custom
script is responsible for setting the status and taking any other actions
necessary, including the possibility of creating a credit invoice: 

`changeStatus = function (retrn:Return, status) {
   
 retrn.status=status;
   
`

Hook [extensionPointAfterStatusChange](dw.order.hooks.ReturnHooks.md#extensionpointafterstatuschange)
This call delegates the update of the return-status to a custom script,
passing the [Order](dw.order.Order.md), returnNumber and new status. The custom
script is responsible for setting the status and taking any other actions
necessary, including the possibility of creating a credit invoice: 

`changeStatus = function (retrn:Return, status) {
   
 retrn.status=status;
   
`


Order post-processing APIs (gillian) are now inactive by default and will throw
an exception if accessed. Activation needs preliminary approval by Product Management.
Please contact support in this case. Existing customers using these APIs are not
affected by this change and can use the APIs until further notice.



## Constant Summary

| Constant | Description |
| --- | --- |
| [extensionPointAddReturnItem](#extensionpointaddreturnitem): [String](TopLevel.String.md) = "dw.order.return.addReturnItem" | The extension point name dw.order.return.addReturnItem. |
| [extensionPointAfterStatusChange](#extensionpointafterstatuschange): [String](TopLevel.String.md) = "dw.order.return.afterStatusChange" | The extension point name dw.order.return.afterStatusChange. |
| [extensionPointChangeStatus](#extensionpointchangestatus): [String](TopLevel.String.md) = "dw.order.return.changeStatus" | The extension point name dw.order.return.changeStatus. |
| [extensionPointCreateReturn](#extensionpointcreatereturn): [String](TopLevel.String.md) = "dw.order.return.createReturn" | The extension point name dw.order.return.createReturn. |
| [extensionPointNotifyStatusChange](#extensionpointnotifystatuschange): [String](TopLevel.String.md) = "dw.order.return.notifyStatusChange" | The extension point name dw.order.return.notifyStatusChange. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [addReturnItem](dw.order.hooks.ReturnHooks.md#addreturnitemreturn-returnitemwo)([Return](dw.order.Return.md), ReturnItemWO) | The hook provides customization in the process of assigning the returned  amount, quantity etc. |
| [afterStatusChange](dw.order.hooks.ReturnHooks.md#afterstatuschangereturn)([Return](dw.order.Return.md)) | Called after method [changeStatus(Return, ReturnWO)](dw.order.hooks.ReturnHooks.md#changestatusreturn-returnwo) returns  Status.OK. |
| [changeStatus](dw.order.hooks.ReturnHooks.md#changestatusreturn-returnwo)([Return](dw.order.Return.md), ReturnWO) | Responsible to change the status of a [Return](dw.order.Return.md): the custom  script is responsible for setting the new status using  [Return.setStatus(String)](dw.order.Return.md#setstatusstring). |
| [createReturn](dw.order.hooks.ReturnHooks.md#createreturnreturnwo)(ReturnWO) | This hook is responsible for creating a new [Return](dw.order.Return.md),  based on a [ReturnCase](dw.order.ReturnCase.md). |
| [notifyStatusChange](dw.order.hooks.ReturnHooks.md#notifystatuschangereturn)([Return](dw.order.Return.md)) | Called after method [changeStatus(Return, ReturnWO)](dw.order.hooks.ReturnHooks.md#changestatusreturn-returnwo) returns  Status.OK (and after method [afterStatusChange(Return)](dw.order.hooks.ReturnHooks.md#afterstatuschangereturn))  to inform of a successful status change. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### extensionPointAddReturnItem

- extensionPointAddReturnItem: [String](TopLevel.String.md) = "dw.order.return.addReturnItem"
  - : The extension point name dw.order.return.addReturnItem.


---

### extensionPointAfterStatusChange

- extensionPointAfterStatusChange: [String](TopLevel.String.md) = "dw.order.return.afterStatusChange"
  - : The extension point name dw.order.return.afterStatusChange.


---

### extensionPointChangeStatus

- extensionPointChangeStatus: [String](TopLevel.String.md) = "dw.order.return.changeStatus"
  - : The extension point name dw.order.return.changeStatus.


---

### extensionPointCreateReturn

- extensionPointCreateReturn: [String](TopLevel.String.md) = "dw.order.return.createReturn"
  - : The extension point name dw.order.return.createReturn.


---

### extensionPointNotifyStatusChange

- extensionPointNotifyStatusChange: [String](TopLevel.String.md) = "dw.order.return.notifyStatusChange"
  - : The extension point name dw.order.return.notifyStatusChange.


---

## Method Details

### addReturnItem(Return, ReturnItemWO)
- addReturnItem(retrn: [Return](dw.order.Return.md), inputData: ReturnItemWO): [Status](dw.system.Status.md)
  - : The hook provides customization in the process of assigning the returned
      amount, quantity etc. Here it is possible to refund differently based on
      the return reason code for example. Also one could correct the inventory
      based on the return information. Utilize
      [ReturnCaseItem.createReturnItem(String)](dw.order.ReturnCaseItem.md#createreturnitemstring) to create a new
      [ReturnItem](dw.order.ReturnItem.md).


    **Parameters:**
    - retrn - the return for which an return item should be created
    - returnCaseItemID - the return case item ID
    - inputData - the return item

    **Returns:**
    - 
      - Status.OK return item is successfully added
      - Status.ERROR return item addition failed.



---

### afterStatusChange(Return)
- afterStatusChange(retrn: [Return](dw.order.Return.md)): [Status](dw.system.Status.md)
  - : Called after method [changeStatus(Return, ReturnWO)](dw.order.hooks.ReturnHooks.md#changestatusreturn-returnwo) returns
      Status.OK. The call is made in a separate database transaction allowing
      the script implementation to make an independent remote call if desired.


    **Parameters:**
    - retrn - the return
    - fromStatus - status from which was changed. The new status can be accessed             from retrn directly

    **Returns:**
    - 
      - Status.OK status successful
      - Status.ERROR on failure



---

### changeStatus(Return, ReturnWO)
- changeStatus(retrn: [Return](dw.order.Return.md), inputData: ReturnWO): [Status](dw.system.Status.md)
  - : Responsible to change the status of a [Return](dw.order.Return.md): the custom
      script is responsible for setting the new status using
      [Return.setStatus(String)](dw.order.Return.md#setstatusstring).
      
      
      
      The invoice handling should be implemented here using
      [Return.createInvoice(String)](dw.order.Return.md#createinvoicestring) or
      [ReturnCase.createInvoice(String)](dw.order.ReturnCase.md#createinvoicestring). For example create an
      [Invoice](dw.order.Invoice.md) for a [Return](dw.order.Return.md) moving to status
      [Return.STATUS_COMPLETED](dw.order.Return.md#status_completed).


    **Parameters:**
    - retrn - the return which status should change
    - inputData - the data in which the new status is included

    **Returns:**
    - 
      - Status.OK status successfully changed
      - Status.ERROR          status not changed.



---

### createReturn(ReturnWO)
- createReturn(inputData: ReturnWO): [Return](dw.order.Return.md)
  - : This hook is responsible for creating a new [Return](dw.order.Return.md),
      based on a [ReturnCase](dw.order.ReturnCase.md). 2 basic workflows are supported:
      
      - On-the-fly return: create the parent [ReturnCase](dw.order.ReturnCase.md)using  [Order.createReturnCase(String, Boolean)](dw.order.Order.md#createreturncasestring-boolean).
      - Return-merchandise-authorization (RMA) workflow: resolve an existing  [ReturnCase](dw.order.ReturnCase.md)using  [Order.getReturnCase(String)](dw.order.Order.md#getreturncasestring).
      
      In both cases use [this  method](dw.order.ReturnCase.md#createreturnstring) to create the [Return](dw.order.Return.md) based on the inputData.
      
      
      Additional functionality like creating history entry, handling the return
      fees or the shipping cost credit can be implemented in the hook after the
      [Return](dw.order.Return.md) is created.


    **Parameters:**
    - inputData - the return

    **Returns:**
    - the created return


---

### notifyStatusChange(Return)
- notifyStatusChange(retrn: [Return](dw.order.Return.md)): [Status](dw.system.Status.md)
  - : Called after method [changeStatus(Return, ReturnWO)](dw.order.hooks.ReturnHooks.md#changestatusreturn-returnwo) returns
      Status.OK (and after method [afterStatusChange(Return)](dw.order.hooks.ReturnHooks.md#afterstatuschangereturn))
      to inform of a successful status change. The call is made outside any
      database transaction. This is the best hook in which to send customer
      notifications as the status change has already been successfully written
      to the database


    **Parameters:**
    - retrn - the return
    - fromStatus - status from which was changed. The new status can be accessed             from retrn directly

    **Returns:**
    - 
      - Status.OK status successful
      - Status.ERROR on failure



---

<!-- prettier-ignore-end -->
