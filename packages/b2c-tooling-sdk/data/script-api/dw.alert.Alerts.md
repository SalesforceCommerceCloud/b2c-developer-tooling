<!-- prettier-ignore-start -->
# Class Alerts

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.alert.Alerts](dw.alert.Alerts.md)


Allow creation, removal, re-validation and retrieval of alerts that might get visible to Business Manager users.


The alerts have to be registered by the 'alerts.json' descriptor file in a cartridge assigned to the Business Manager site.
The descriptor file itself has to be defined in 'package.json' of that cartridge using a property 'alerts' and providing its path
that is relative to the 'package.json'.
The 'alert.json' descriptor files contain the 'alert descriptions', which are referenced by their ID throughout the API.


For example, the 'alerts.json' file could have the following content:


```
{
  "alerts": [
    {
      "alert-id": "missing_org_config",
      "menu-action": "global-prefs_custom_prefs",
      "message-resource-id": "global.missing_org_config",
      "priority": "ACTION",
      "remediation": {
        "pipeline":"GlobalCustomPreferences",
        "start-node":"View"
      }
    },
    {
      "alert-id":"promo_in_past",
      "menu-action":"marketing_promotions",
      "context-object-type":"Promotion",
      "message-resource-id":"promotion.in_the_past",
      "priority":"WARN",
      "remediation": {
        "pipeline":"ViewApplication",
        "start-node":"BM",
        "parameter":"screen=Promotion"
      }
    }
  ]
}
```

The referenced menu actions can be found in the 'bm\_extensions.xml' file of a Business manager extension cartridge
(a sample file containing all current menu entries is provided when creating a new extension cartridge in Studio).



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [addAlert](dw.alert.Alerts.md#addalertstring-persistentobject-string)([String](TopLevel.String.md), [PersistentObject](dw.object.PersistentObject.md), [String\[\]](TopLevel.String.md)) | Creates a new alert for the given ID and context object. |
| static [addAlert](dw.alert.Alerts.md#addalertstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String\[\]](TopLevel.String.md)) | Creates a new alert for the given ID and ID of the context object. |
| static [addAlert](dw.alert.Alerts.md#addalertstring-string)([String](TopLevel.String.md), [String\[\]](TopLevel.String.md)) | Creates a new alert for the given ID. |
| static [getAlerts](dw.alert.Alerts.md#getalertsstring)([String...](TopLevel.String.md)) | Retrieves all alerts for a set of alert descriptor ID. |
| static [getAlertsForContextObject](dw.alert.Alerts.md#getalertsforcontextobjectpersistentobject-string)([PersistentObject](dw.object.PersistentObject.md), [String...](TopLevel.String.md)) | Retrieves all alerts for a set of alert descriptor ID and the given context object. |
| static [getAlertsForContextObject](dw.alert.Alerts.md#getalertsforcontextobjectstring-string)([String](TopLevel.String.md), [String...](TopLevel.String.md)) | Retrieves all alerts for a set of alert descriptor ID and the given context object ID. |
| static [removeAlert](dw.alert.Alerts.md#removealertstring)([String](TopLevel.String.md)) | Removes all alerts for the given alert descriptor ID. |
| static [removeAlert](dw.alert.Alerts.md#removealertstring-persistentobject)([String](TopLevel.String.md), [PersistentObject](dw.object.PersistentObject.md)) | Removes the alert for the given alert description and context object. |
| static [removeAlert](dw.alert.Alerts.md#removealertstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Removes the alert for the given alert description and context object ID. |
| static [revalidateAlert](dw.alert.Alerts.md#revalidatealertstring-function-string)([String](TopLevel.String.md), [Function](TopLevel.Function.md), [String\[\]](TopLevel.String.md)) | Re-evaluates the process function, and creates or removes the respective alert. |
| static [revalidateAlert](dw.alert.Alerts.md#revalidatealertstring-persistentobject-function-string)([String](TopLevel.String.md), [PersistentObject](dw.object.PersistentObject.md), [Function](TopLevel.Function.md), [String\[\]](TopLevel.String.md)) | Re-evaluates the process function, and creates or removes the respective alert. |
| static [revalidateAlert](dw.alert.Alerts.md#revalidatealertstring-object-string-function-string)([String](TopLevel.String.md), [Object](TopLevel.Object.md), [String](TopLevel.String.md), [Function](TopLevel.Function.md), [String\[\]](TopLevel.String.md)) | Re-evaluates the process function, and creates or removes the respective alert. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### addAlert(String, PersistentObject, String[])
- static addAlert(alertDescriptorID: [String](TopLevel.String.md), contextObject: [PersistentObject](dw.object.PersistentObject.md), params: [String\[\]](TopLevel.String.md)): void
  - : Creates a new alert for the given ID and context object.
      If such an alert already exists, no new one is created, and the existing one is not modified.
      Multiple alerts for the same alert descriptor ID may exist, as long as they reference different objects.
      To refer to the same alert afterwards (e.g. to remove the alert) the same object must be provided.


    **Parameters:**
    - alertDescriptorID - the ID of the referenced alert description
    - contextObject - the context object
    - params - parameters which may be shown in the alert message


---

### addAlert(String, String, String[])
- static addAlert(alertDescriptorID: [String](TopLevel.String.md), contextObjectID: [String](TopLevel.String.md), params: [String\[\]](TopLevel.String.md)): void
  - : Creates a new alert for the given ID and ID of the context object.
      If such an alert already exists, no new one is created, and the existing one is not modified.
      Multiple alerts for the same alert descriptor ID may exist, as long as they reference different objects.
      To refer to the same alert afterwards (e.g. to remove it) the same object ID must be provided.
      
      Use this method when the alerts refers to an object which is not a PersistentObject.


    **Parameters:**
    - alertDescriptorID - the ID of the referenced alert description
    - contextObjectID - the ID of the referenced object
    - params - parameters which may be shown in the alert message


---

### addAlert(String, String[])
- static addAlert(alertDescriptorID: [String](TopLevel.String.md), params: [String\[\]](TopLevel.String.md)): void
  - : Creates a new alert for the given ID.
      If such an alert already exists, no new one is created, and the existing one is not modified.


    **Parameters:**
    - alertDescriptorID - the ID of the referenced alert description
    - params - parameters which may be shown in the alert message


---

### getAlerts(String...)
- static getAlerts(alertDescriptorIDs: [String...](TopLevel.String.md)): [List](dw.util.List.md)
  - : Retrieves all alerts for a set of alert descriptor ID.

    **Parameters:**
    - alertDescriptorIDs - the IDs of the referenced alert descriptions

    **Returns:**
    - the list of alerts (of type Alert)


---

### getAlertsForContextObject(PersistentObject, String...)
- static getAlertsForContextObject(contextObject: [PersistentObject](dw.object.PersistentObject.md), alertDescriptorIDs: [String...](TopLevel.String.md)): [List](dw.util.List.md)
  - : Retrieves all alerts for a set of alert descriptor ID and the given context object.

    **Parameters:**
    - contextObject - the context object
    - alertDescriptorIDs - the IDs of the referenced alert descriptions

    **Returns:**
    - the list of alerts (of type Alert)


---

### getAlertsForContextObject(String, String...)
- static getAlertsForContextObject(contextObjectID: [String](TopLevel.String.md), alertDescriptorIDs: [String...](TopLevel.String.md)): [List](dw.util.List.md)
  - : Retrieves all alerts for a set of alert descriptor ID and the given context object ID.

    **Parameters:**
    - contextObjectID - the ID of the referenced object
    - alertDescriptorIDs - the IDs of the referenced alert descriptions

    **Returns:**
    - the list of alerts (of type Alert)


---

### removeAlert(String)
- static removeAlert(alertDescriptorID: [String](TopLevel.String.md)): void
  - : Removes all alerts for the given alert descriptor ID. This method will remove also alert referencing
      context objects, as long as they reference the same alert description.


    **Parameters:**
    - alertDescriptorID - the ID of the referenced alert description


---

### removeAlert(String, PersistentObject)
- static removeAlert(alertDescriptorID: [String](TopLevel.String.md), contextObject: [PersistentObject](dw.object.PersistentObject.md)): void
  - : Removes the alert for the given alert description and context object.

    **Parameters:**
    - alertDescriptorID - the ID of the referenced alert description
    - contextObject - the context object


---

### removeAlert(String, String)
- static removeAlert(alertDescriptorID: [String](TopLevel.String.md), contextObjectID: [String](TopLevel.String.md)): void
  - : Removes the alert for the given alert description and context object ID.

    **Parameters:**
    - alertDescriptorID - the ID of the referenced alert description
    - contextObjectID - the context object ID


---

### revalidateAlert(String, Function, String[])
- static revalidateAlert(alertDescriptorID: [String](TopLevel.String.md), processFunction: [Function](TopLevel.Function.md), params: [String\[\]](TopLevel.String.md)): void
  - : Re-evaluates the process function, and creates or removes the respective alert.
      The process function must return true when the alert should be created, and false when it should be removed.
      When the process function states that the alert should be created, but it already exists, it is not created again. Instead, the existing
      alert is updated with the supplied parameters.


    **Parameters:**
    - alertDescriptorID - the ID of the referenced alert description
    - processFunction - the validation function. Must return true when the alert needs to be created.
    - params - parameters which may be shown in the alert message


---

### revalidateAlert(String, PersistentObject, Function, String[])
- static revalidateAlert(alertDescriptorID: [String](TopLevel.String.md), contextObject: [PersistentObject](dw.object.PersistentObject.md), processFunction: [Function](TopLevel.Function.md), params: [String\[\]](TopLevel.String.md)): void
  - : Re-evaluates the process function, and creates or removes the respective alert. The context object is handed as the only parameter to the process function.
      The process function must return true when the alert should be created, and false when it should be removed.
      When the process function states that the alert should be created, but it already exists, it is not created again. Instead, the existing
      alert is updated with the supplied parameters.


    **Parameters:**
    - alertDescriptorID - the ID of the referenced alert description
    - contextObject - the context object for which the validation is done, might be null
    - processFunction - the validation function. Must return true when the alert needs to be created.
    - params - parameters which may be shown in the alert message


---

### revalidateAlert(String, Object, String, Function, String[])
- static revalidateAlert(alertDescriptorID: [String](TopLevel.String.md), contextObject: [Object](TopLevel.Object.md), contextObjectID: [String](TopLevel.String.md), processFunction: [Function](TopLevel.Function.md), params: [String\[\]](TopLevel.String.md)): void
  - : Re-evaluates the process function, and creates or removes the respective alert. When the optional
      context object is supplied, it is handed as the only parameter to the process function (if its not supplied,
      no parameter is given to the function).
      The process function must return true when the alert should be created, and false when it should be removed.
      When the process function states that the alert should be created, but it already exists, it is not created again. Instead, the existing
      alert is updated with the supplied parameters.
      Use this variant of the function when the context object is not a persistent object. In this case the ID to be assigned
      to the alert must be supplied as an additional parameter. (Either both the context object and the ID must be provided, or none of them)


    **Parameters:**
    - alertDescriptorID - the ID of the referenced alert description
    - contextObject - the context object for which the validation is done
    - contextObjectID - the id of the context object for which the validation is done (and which is used to add / remove the alert object)
    - processFunction - the validation function. Must return true when the alert needs to be created.
    - params - parameters which may be shown in the alert message


---

<!-- prettier-ignore-end -->
