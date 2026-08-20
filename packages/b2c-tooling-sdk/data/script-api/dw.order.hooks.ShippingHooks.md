<!-- prettier-ignore-start -->
# Class ShippingHooks

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.hooks.ShippingHooks](dw.order.hooks.ShippingHooks.md)

This interface represents shipping extension points for Commerce App shipping providers.


These hooks provide integration points for external shipping rate / delivery-estimate services installed via the
Commerce App framework.


**IMPORTANT:** These hooks should **only** be implemented and registered by Commerce Apps
(applications installed via the Commerce App framework with a CAP file). They are not intended for custom merchant
cartridges or storefront implementations. Merchants who want custom shipping calculation logic should use the legacy
`dw.order.calculateShipping` extension point instead.


Hook Registration A function must be defined inside a JavaScript source and must be exported. The script
with the exported hook function must be located inside a site cartridge. Inside the site cartridge a
`package.json` file with a 'hooks' entry must exist:


```
"hooks": "./hooks.json"
```



The hooks entry links to a JSON file, relative to the `package.json` file. This file lists all registered
hooks inside the hooks property:




```
"hooks": [
   {"name": "sfcc.app.shipping.quote", "script": "./quote.js"},
   {"name": "sfcc.app.shipping.calculate", "script": "./calculate.js"}
]
```



A hook entry has a `name` and a `script` property:



- The `name`contains the extension point name (the hook name).
- The `script`contains the script path relative to the hooks file, with the exported hook  function.



**Function Naming Convention:** The exported JavaScript function name must match the last segment of the
extension point name, for example, `quote` or `calculate`.


Hook Lifecycle Each hook fires at a specific surface and lifecycle stage:

- **quote**(checkout): Fires on every invocation of  `GET /baskets/{basket_id}/shipments/{shipment_id}/shipping_methods`. Lets the Commerce App override native  shipping prices and add delivery information for the methods it can quote.
- **calculate**(basket calculation): Fires during basket calculation on every basket operation that  recomputes shipping. Applies provider-supplied shipping rates to the selected `ShippingLineItem`and may  persist provider metadata on the shipment.

Hook Precedence

- When `sfcc.app.shipping.calculate`is registered and the `ShippingAppHooksEnabled`toggle  is on, it takes precedence over the legacy `dw.order.calculateShipping`hook.
- If the Commerce App hook is not registered (or the toggle is off), the platform falls back to  `dw.order.calculateShipping`(if registered).
- If neither hook is available, the platform uses the native default  (`ShippingMgr.applyShippingCost`).



## Constant Summary

| Constant | Description |
| --- | --- |
| [SHIPPING_DOMAIN](#shipping_domain): [String](TopLevel.String.md) = "shipping" | The shipping app domain segment used to compose extension-point names under the shared  `sfcc.app` prefix. |
| [extensionPointCalculate](#extensionpointcalculate): [String](TopLevel.String.md) = "sfcc.app.shipping.calculate" | The extension point name sfcc.app.shipping.calculate. |
| [extensionPointQuote](#extensionpointquote): [String](TopLevel.String.md) = "sfcc.app.shipping.quote" | The extension point name sfcc.app.shipping.quote. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [calculate](dw.order.hooks.ShippingHooks.md#calculatelineitemctnr)([LineItemCtnr](dw.order.LineItemCtnr.md)) | The function is called by extension point [extensionPointCalculate](dw.order.hooks.ShippingHooks.md#extensionpointcalculate) during basket calculation. |
| [quote](dw.order.hooks.ShippingHooks.md#quoteshipment-shippingmethodresultwo)([Shipment](dw.order.Shipment.md), ShippingMethodResultWO) | The function is called by extension point [extensionPointQuote](dw.order.hooks.ShippingHooks.md#extensionpointquote) on every invocation of  `GET /baskets/{basket_id}/shipments/{shipment_id}/shipping_methods`. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### SHIPPING_DOMAIN

- SHIPPING_DOMAIN: [String](TopLevel.String.md) = "shipping"
  - : The shipping app domain segment used to compose extension-point names under the shared
      `sfcc.app` prefix.



---

### extensionPointCalculate

- extensionPointCalculate: [String](TopLevel.String.md) = "sfcc.app.shipping.calculate"
  - : The extension point name sfcc.app.shipping.calculate.


---

### extensionPointQuote

- extensionPointQuote: [String](TopLevel.String.md) = "sfcc.app.shipping.quote"
  - : The extension point name sfcc.app.shipping.quote.


---

## Method Details

### calculate(LineItemCtnr)
- calculate(lineItemCtnr: [LineItemCtnr](dw.order.LineItemCtnr.md)): [Status](dw.system.Status.md)
  - : The function is called by extension point [extensionPointCalculate](dw.order.hooks.ShippingHooks.md#extensionpointcalculate) during basket calculation. It
      applies provider-supplied shipping rates to the selected `ShippingLineItem` and may persist
      provider metadata (for example, a rate id, carrier code, or delivery window) on the shipment via supported
      `custom.*` attributes. This hook fires on every basket operation that recomputes shipping, not only
      before order creation.
      
      
      The hook owns: native fallback (calling `ShippingMgr.applyShippingCost(lineItemCtnr)` if it wants to
      preserve product-level shipping, surcharges, cleanup, and tax-class setup), provider lookup / rate-cache reuse,
      selected-rate application onto the standard shipment shipping line item, and provider metadata persistence
      (custom attributes on the shipment, custom objects, etc.).
      
      
      
      
      **Note:** If the master `dw.order.calculate` hook (not the per-step
      `dw.order.calculateShipping`) is overridden, the entire basket calculation is replaced and the
      platform's automatic shipping hook selection is bypassed. You must manually invoke this hook from within your
      custom `dw.order.calculate` implementation if you want to use Commerce App shipping providers.
      
      
      
      
      **Error Handling:** Both returning a `Status.ERROR` and throwing an exception will
      prevent the basket calculation from completing successfully. The platform logs the error and halts the current
      basket operation. Since order creation requires a successful basket calculation, this also prevents orders from
      being created with incorrect shipping amounts.
      
      
      
      
      **Sample Implementation:**
      
      
      
      
      ```
      function calculate(lineItemCtnr) {
          var ShippingMgr = require('dw/order/ShippingMgr');
          var Status = require('dw/system/Status');
          var Transaction = require('dw/system/Transaction');
      
          // 1. Run native shipping defaults (product-level surcharges, tax classes)
          ShippingMgr.applyShippingCost(lineItemCtnr);
      
          // 2. Look up the provider rate that was selected on the shipment
          var shipment = lineItemCtnr.getDefaultShipment();
          var rateId = shipment.custom.providerRateId;
          if (!rateId) {
              return new Status(Status.OK);
          }
      
          // 3. Apply the provider rate to the shipping line item
          Transaction.wrap(function () {
              var sli = shipment.getStandardShippingLineItem();
              sli.setPriceValue(lookupRate(rateId).price);
          });
      
          return new Status(Status.OK);
      }
      
      exports.calculate = calculate;
      ```


    **Parameters:**
    - lineItemCtnr - the line item container (basket) for which shipping should be calculated.

    **Returns:**
    - `Status.OK` or `null` for success; `Status.ERROR` to block the basket
              calculation with details about the failure. Throwing an exception will also block the basket
              calculation.



---

### quote(Shipment, ShippingMethodResultWO)
- quote(shipment: [Shipment](dw.order.Shipment.md), result: ShippingMethodResultWO): [Status](dw.system.Status.md)
  - : The function is called by extension point [extensionPointQuote](dw.order.hooks.ShippingHooks.md#extensionpointquote) on every invocation of
      `GET /baskets/{basket_id}/shipments/{shipment_id}/shipping_methods`. ECOM pre-populates a
      `ShippingMethodResultWO` with the applicable shipping methods, each carrying its native price. The
      hook implementation may override prices and delivery information on any methods it can quote. Methods the hook
      does not touch keep their native price.
      
      
      **Error Handling:** To signal a failure, return `new Status(Status.ERROR)`. The platform
      logs that an error status was returned for this hook and the `GET shipping-methods` request fails.
      Uncaught exceptions thrown from the hook are also treated as failures.
      
      
      
      
      **SCAPI Behavior:** When `ScapiHookExecutionEnabled` is disabled, SCAPI requests bypass
      this hook and use native shipping pricing.
      
      
      
      
      **Sample Implementation:**
      
      
      
      
      ```
      function quote(shipment, result) {
          var Status = require('dw/system/Status');
      
          var methods = result.applicableShippingMethods;
          for (var i = 0; i < methods.length; i++) {
              var method = methods[i];
              // ... call provider for this method, set price ...
              method.setPrice(providerPrice);
          }
          return new Status(Status.OK);
      }
      
      exports.quote = quote;
      ```


    **Parameters:**
    - shipment - the shipment for which shipping methods are being displayed.
    - result - the pre-populated result with native prices on each method. Mutated in place by the hook.

    **Returns:**
    - `Status.OK` or `null` for success; `Status.ERROR` to block the request.


---

<!-- prettier-ignore-end -->
