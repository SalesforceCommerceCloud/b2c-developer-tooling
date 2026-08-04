<!-- prettier-ignore-start -->
# Class ConnectionHealthStatusCodes

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.commerceapps.ConnectionHealthStatusCodes](dw.commerceapps.ConnectionHealthStatusCodes.md)

Status codes and detail keys returned by the
[ConnectionHealthCheckHooks.checkConnectionHealth()](dw.commerceapps.hooks.ConnectionHealthCheckHooks.md#checkconnectionhealth) hook. The BM connection-health
endpoint translates the returned [Status](dw.system.Status.md) into a health payload using these values.


**See Also:**
- [ConnectionHealthCheckHooks](dw.commerceapps.hooks.ConnectionHealthCheckHooks.md)


## Constant Summary

| Constant | Description |
| --- | --- |
| [DETAIL_MESSAGE](#detail_message): [String](TopLevel.String.md) = "message" | [Status](dw.system.Status.md) detail key for the human-readable status message. |
| [DETAIL_REMEDIATION](#detail_remediation): [String](TopLevel.String.md) = "remediation" | [Status](dw.system.Status.md) detail key for the merchant-facing remediation hint. |
| [STATUS_CODE_DEGRADED](#status_code_degraded): [String](TopLevel.String.md) = "DEGRADED" | Status code that indicates a degraded connection (partial functionality available). |
| [STATUS_CODE_UNHEALTHY](#status_code_unhealthy): [String](TopLevel.String.md) = "UNHEALTHY" | Status code that indicates the connection is unhealthy. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [ConnectionHealthStatusCodes](#connectionhealthstatuscodes)() |  |

## Method Summary

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### DETAIL_MESSAGE

- DETAIL_MESSAGE: [String](TopLevel.String.md) = "message"
  - : [Status](dw.system.Status.md) detail key for the human-readable status message.


---

### DETAIL_REMEDIATION

- DETAIL_REMEDIATION: [String](TopLevel.String.md) = "remediation"
  - : [Status](dw.system.Status.md) detail key for the merchant-facing remediation hint.


---

### STATUS_CODE_DEGRADED

- STATUS_CODE_DEGRADED: [String](TopLevel.String.md) = "DEGRADED"
  - : Status code that indicates a degraded connection (partial functionality available).


---

### STATUS_CODE_UNHEALTHY

- STATUS_CODE_UNHEALTHY: [String](TopLevel.String.md) = "UNHEALTHY"
  - : Status code that indicates the connection is unhealthy.


---

## Constructor Details

### ConnectionHealthStatusCodes()
- ConnectionHealthStatusCodes()
  - : 


---

<!-- prettier-ignore-end -->
