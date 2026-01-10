<!-- prettier-ignore-start -->
# Class System

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.System](dw.system.System.md)

Represents the Commerce Cloud Digital server instance. An application server instance is configured to be of one of three types,
"development system", "staging system" or "production system".



## Constant Summary

| Constant | Description |
| --- | --- |
| [DEVELOPMENT_SYSTEM](#development_system): [Number](TopLevel.Number.md) = 0 | Represents the development system. |
| [PRODUCTION_SYSTEM](#production_system): [Number](TopLevel.Number.md) = 2 | Represents the production system. |
| [STAGING_SYSTEM](#staging_system): [Number](TopLevel.Number.md) = 1 | Represents the staging system. |

## Property Summary

| Property | Description |
| --- | --- |
| [calendar](#calendar): [Calendar](dw.util.Calendar.md) `(read-only)` | Returns a new Calendar object in the time zone of the  current instance. |
| [compatibilityMode](#compatibilitymode): [Number](TopLevel.Number.md) `(read-only)` | Returns the compatibility mode of the custom code version that is currently active. |
| [instanceHostname](#instancehostname): [String](TopLevel.String.md) `(read-only)` | Returns instance hostname. |
| [instanceTimeZone](#instancetimezone): [String](TopLevel.String.md) `(read-only)` | Returns the instance time zone. |
| [instanceType](#instancetype): [Number](TopLevel.Number.md) `(read-only)` | Returns the type of the instance. |
| [preferences](#preferences): [OrganizationPreferences](dw.system.OrganizationPreferences.md) `(read-only)` | This method returns a container of all global preferences of this  organization (instance). |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [getCalendar](dw.system.System.md#getcalendar)() | Returns a new Calendar object in the time zone of the  current instance. |
| static [getCompatibilityMode](dw.system.System.md#getcompatibilitymode)() | Returns the compatibility mode of the custom code version that is currently active. |
| static [getInstanceHostname](dw.system.System.md#getinstancehostname)() | Returns instance hostname. |
| static [getInstanceTimeZone](dw.system.System.md#getinstancetimezone)() | Returns the instance time zone. |
| static [getInstanceType](dw.system.System.md#getinstancetype)() | Returns the type of the instance. |
| static [getPreferences](dw.system.System.md#getpreferences)() | This method returns a container of all global preferences of this  organization (instance). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### DEVELOPMENT_SYSTEM

- DEVELOPMENT_SYSTEM: [Number](TopLevel.Number.md) = 0
  - : Represents the development system.


---

### PRODUCTION_SYSTEM

- PRODUCTION_SYSTEM: [Number](TopLevel.Number.md) = 2
  - : Represents the production system.


---

### STAGING_SYSTEM

- STAGING_SYSTEM: [Number](TopLevel.Number.md) = 1
  - : Represents the staging system.


---

## Property Details

### calendar
- calendar: [Calendar](dw.util.Calendar.md) `(read-only)`
  - : Returns a new Calendar object in the time zone of the
      current instance.



---

### compatibilityMode
- compatibilityMode: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the compatibility mode of the custom code version that is currently active. The compatibility mode is
      returned as a number, e.g. compatibility mode "15.5" is returned as 1505.



---

### instanceHostname
- instanceHostname: [String](TopLevel.String.md) `(read-only)`
  - : Returns instance hostname.


---

### instanceTimeZone
- instanceTimeZone: [String](TopLevel.String.md) `(read-only)`
  - : Returns the instance time zone. The instance time zone is the time zone in which global actions like jobs or
      reporting are specified in the system. Keep in mind that the instance time zone is cached at the current session.
      Changes will affect only new sessions.



---

### instanceType
- instanceType: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the type of the instance. An application server instance is configured to be of one of three types,
      "development system", "staging system" or "production system".
      
      This method returns a constant representing the instance type of **this**
      application server.


    **See Also:**
    - [DEVELOPMENT_SYSTEM](dw.system.System.md#development_system)
    - [PRODUCTION_SYSTEM](dw.system.System.md#production_system)
    - [STAGING_SYSTEM](dw.system.System.md#staging_system)


---

### preferences
- preferences: [OrganizationPreferences](dw.system.OrganizationPreferences.md) `(read-only)`
  - : This method returns a container of all global preferences of this
      organization (instance).



---

## Method Details

### getCalendar()
- static getCalendar(): [Calendar](dw.util.Calendar.md)
  - : Returns a new Calendar object in the time zone of the
      current instance.


    **Returns:**
    - a Calendar object in the time zone of the
              instance.



---

### getCompatibilityMode()
- static getCompatibilityMode(): [Number](TopLevel.Number.md)
  - : Returns the compatibility mode of the custom code version that is currently active. The compatibility mode is
      returned as a number, e.g. compatibility mode "15.5" is returned as 1505.


    **Returns:**
    - The currently active compatibility mode.


---

### getInstanceHostname()
- static getInstanceHostname(): [String](TopLevel.String.md)
  - : Returns instance hostname.

    **Returns:**
    - instance hostname.


---

### getInstanceTimeZone()
- static getInstanceTimeZone(): [String](TopLevel.String.md)
  - : Returns the instance time zone. The instance time zone is the time zone in which global actions like jobs or
      reporting are specified in the system. Keep in mind that the instance time zone is cached at the current session.
      Changes will affect only new sessions.


    **Returns:**
    - the instance time zone.


---

### getInstanceType()
- static getInstanceType(): [Number](TopLevel.Number.md)
  - : Returns the type of the instance. An application server instance is configured to be of one of three types,
      "development system", "staging system" or "production system".
      
      This method returns a constant representing the instance type of **this**
      application server.


    **Returns:**
    - the instance type of the application server where this method was
              called.


    **See Also:**
    - [DEVELOPMENT_SYSTEM](dw.system.System.md#development_system)
    - [PRODUCTION_SYSTEM](dw.system.System.md#production_system)
    - [STAGING_SYSTEM](dw.system.System.md#staging_system)


---

### getPreferences()
- static getPreferences(): [OrganizationPreferences](dw.system.OrganizationPreferences.md)
  - : This method returns a container of all global preferences of this
      organization (instance).


    **Returns:**
    - a preferences object containing all global system and custom
              preferences of this instance



---

<!-- prettier-ignore-end -->
