<!-- prettier-ignore-start -->
# Class ConnectionHealthCheckHooks

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.commerceapps.hooks.ConnectionHealthCheckHooks](dw.commerceapps.hooks.ConnectionHealthCheckHooks.md)

This interface represents the optional connection health check extension point for Commerce App providers. It lets a
Commerce App report whether its external service is reachable and operating correctly so Business Manager can surface
health on the app's installation details. Implementing this hook is not required &mdash; apps that do not depend on
an external connection may omit it entirely. When omitted, Business Manager does not display health status on the
app's tile.


A function must be defined inside a JavaScript source and must be exported. The script with the exported hook
function must be located inside a site cartridge. Inside the site cartridge a 'package.json' file with a 'hooks'
entry must exist.


```
"hooks": "./hooks.json"
```


The hooks entry links to a json file, relative to the 'package.json' file. This file lists all registered hooks
inside the hooks property:


```
"hooks": [
     {"name": "sfcc.app.tax.checkConnectionHealth", "script": "./checkConnectionHealth.js"}
]
```


A hook entry has a 'name' and a 'script' property.

- The 'name' contains the extension point, the hook name.
- The 'script' contains the script relative to the hooks file, with the exported hook function.



The hook is registered **per app domain** using the {@code sfcc.app.<domain>.checkConnectionHealth}
convention &mdash; for example, {@code sfcc.app.tax.checkConnectionHealth} for a tax app.


**IMPORTANT:** This hook should only be implemented and registered by Commerce Apps (applications
installed via the Commerce App framework with a CAP file). It is not intended for custom merchant cartridges or
storefront implementations.



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [checkConnectionHealth](dw.commerceapps.hooks.ConnectionHealthCheckHooks.md#checkconnectionhealth)() | Reports the current health of the Commerce App's connection to its external service. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### checkConnectionHealth()
- checkConnectionHealth(): [Status](dw.system.Status.md)
  - : Reports the current health of the Commerce App's connection to its external service. The platform applies a CPU
      timeout, so implementations should be lightweight and time-bounded.
      
      
      The Business Manager connection-health endpoint that invokes this hook reports {@code unknown} when the hook
      times out, throws, or returns {@code null}. {@code dw.system.HookMgr#callHook} itself rethrows any exception
      raised by the hook script &mdash; the {@code unknown} translation is applied by the BM endpoint dispatcher, not
      by {@code HookMgr}.
      
      
      The BM endpoint interprets the returned [Status](dw.system.Status.md) as follows: {@code Status.OK} &rarr; healthy;
      {@code Status.ERROR} with code [DEGRADED](dw.commerceapps.ConnectionHealthStatusCodes.md#status_code_degraded)
      &rarr; degraded; {@code Status.ERROR} with code
      [UNHEALTHY](dw.commerceapps.ConnectionHealthStatusCodes.md#status_code_unhealthy) (or any other ERROR code)
      &rarr; unhealthy. A {@code null} return is treated as {@code unknown}.
      
      
      Use [Status.addDetail(String, Object)](dw.system.Status.md#adddetailstring-object) with keys
      [ConnectionHealthStatusCodes.DETAIL_MESSAGE](dw.commerceapps.ConnectionHealthStatusCodes.md#detail_message) and
      [ConnectionHealthStatusCodes.DETAIL_REMEDIATION](dw.commerceapps.ConnectionHealthStatusCodes.md#detail_remediation) to provide structured information for the
      BM UI. [DETAIL\_REMEDIATION](dw.commerceapps.ConnectionHealthStatusCodes.md#detail_remediation) should describe
      actionable steps the merchant can take when the connection is degraded or unhealthy.
      
      
      Both detail values are surfaced verbatim in Business Manager. To localize them for the BM admin's language, look
      up the strings via {@code dw.web.Resource} from the cartridge's resource bundles (e.g. files under
      {@code cartridge/templates/resources/}) instead of hard-coding English. The BM endpoint dispatcher invokes the
      hook in the BM session locale, so {@code Resource.msg(...)} resolves against the admin's language.
      
      
      ```
      var Resource = require('dw/web/Resource');
      var Status = require('dw/system/Status');
      
      exports.checkConnectionHealth = function () {
          var status = new Status(Status.ERROR, 'DEGRADED');
          status.addDetail('message', Resource.msg('healthcheck.degraded.message', 'taxapp', null));
          status.addDetail('remediation',
              Resource.msgf('healthcheck.degraded.remediation', 'taxapp', null, providerName));
          return status;
      };
      ```


    **Returns:**
    - the connection health status. A {@code null} return is treated as {@code unknown} by the BM endpoint.


---

<!-- prettier-ignore-end -->
