<!-- prettier-ignore-start -->
# Class Alert

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.alert.Alert](dw.alert.Alert.md)

This class represents a single system alert to be shown to a Business Manager user.


## Constant Summary

| Constant | Description |
| --- | --- |
| [PRIORITY_ACTION](#priority_action): [String](TopLevel.String.md) = "ACTION" | String constant to denote the 'action required' priority. |
| [PRIORITY_INFO](#priority_info): [String](TopLevel.String.md) = "INFO" | String constant to denote the 'informational' priority. |
| [PRIORITY_WARN](#priority_warn): [String](TopLevel.String.md) = "WARN" | String constant to denote the 'warning' priority. |

## Property Summary

| Property | Description |
| --- | --- |
| [alertDescriptorID](#alertdescriptorid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the referenced alert description. |
| [contextObjectID](#contextobjectid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the referenced context object (or null, if no context object is assigned to this alert). |
| [displayMessage](#displaymessage): [String](TopLevel.String.md) `(read-only)` | Resolves the display message to be shown. |
| [priority](#priority): [String](TopLevel.String.md) `(read-only)` | Returns the priority assigned to the message. |
| [remediationURL](#remediationurl): [String](TopLevel.String.md) `(read-only)` | The URL of the page where the user can resolve the alert, as provided in the  'alerts.json' descriptor file. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAlertDescriptorID](dw.alert.Alert.md#getalertdescriptorid)() | Returns the ID of the referenced alert description. |
| [getContextObjectID](dw.alert.Alert.md#getcontextobjectid)() | Returns the ID of the referenced context object (or null, if no context object is assigned to this alert). |
| [getDisplayMessage](dw.alert.Alert.md#getdisplaymessage)() | Resolves the display message to be shown. |
| [getPriority](dw.alert.Alert.md#getpriority)() | Returns the priority assigned to the message. |
| [getRemediationURL](dw.alert.Alert.md#getremediationurl)() | The URL of the page where the user can resolve the alert, as provided in the  'alerts.json' descriptor file. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### PRIORITY_ACTION

- PRIORITY_ACTION: [String](TopLevel.String.md) = "ACTION"
  - : String constant to denote the 'action required' priority.


---

### PRIORITY_INFO

- PRIORITY_INFO: [String](TopLevel.String.md) = "INFO"
  - : String constant to denote the 'informational' priority.


---

### PRIORITY_WARN

- PRIORITY_WARN: [String](TopLevel.String.md) = "WARN"
  - : String constant to denote the 'warning' priority.


---

## Property Details

### alertDescriptorID
- alertDescriptorID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the referenced alert description.


---

### contextObjectID
- contextObjectID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the referenced context object (or null, if no context object is assigned to this alert).


---

### displayMessage
- displayMessage: [String](TopLevel.String.md) `(read-only)`
  - : Resolves the display message to be shown.
      It refers to the message resource ID specified in the alert descriptor file ("message-resource-id") and the message provided
      by the 'alerts.properties' resource bundle.
      When the referenced message contains parameter placeholders (such as '{0}' and '{1}') they are replaced by the parameters stored with the alert.



---

### priority
- priority: [String](TopLevel.String.md) `(read-only)`
  - : Returns the priority assigned to the message.
      One of the string constants defined in this class (PRIORITY\_INFO, PRIORITY\_WARN, PRIORITY\_ACTION).



---

### remediationURL
- remediationURL: [String](TopLevel.String.md) `(read-only)`
  - : The URL of the page where the user can resolve the alert, as provided in the
      'alerts.json' descriptor file.



---

## Method Details

### getAlertDescriptorID()
- getAlertDescriptorID(): [String](TopLevel.String.md)
  - : Returns the ID of the referenced alert description.

    **Returns:**
    - the ID of the referenced alert description


---

### getContextObjectID()
- getContextObjectID(): [String](TopLevel.String.md)
  - : Returns the ID of the referenced context object (or null, if no context object is assigned to this alert).

    **Returns:**
    - the ID of the referenced context object


---

### getDisplayMessage()
- getDisplayMessage(): [String](TopLevel.String.md)
  - : Resolves the display message to be shown.
      It refers to the message resource ID specified in the alert descriptor file ("message-resource-id") and the message provided
      by the 'alerts.properties' resource bundle.
      When the referenced message contains parameter placeholders (such as '{0}' and '{1}') they are replaced by the parameters stored with the alert.


    **Returns:**
    - the display message


---

### getPriority()
- getPriority(): [String](TopLevel.String.md)
  - : Returns the priority assigned to the message.
      One of the string constants defined in this class (PRIORITY\_INFO, PRIORITY\_WARN, PRIORITY\_ACTION).


    **Returns:**
    - the priority


---

### getRemediationURL()
- getRemediationURL(): [String](TopLevel.String.md)
  - : The URL of the page where the user can resolve the alert, as provided in the
      'alerts.json' descriptor file.


    **Returns:**
    - the remediation URL


---

<!-- prettier-ignore-end -->
