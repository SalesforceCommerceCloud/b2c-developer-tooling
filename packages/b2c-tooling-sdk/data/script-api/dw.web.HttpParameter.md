<!-- prettier-ignore-start -->
# Class HttpParameter

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.HttpParameter](dw.web.HttpParameter.md)

Represents an HTTP parameter.


## Property Summary

| Property | Description |
| --- | --- |
| [booleanValue](#booleanvalue): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns the value of the current HttpParameter attribute as a boolean. |
| [dateValue](#datevalue): [Date](TopLevel.Date.md) `(read-only)` | Returns the value of the current HttpParameter attribute as a date. |
| [doubleValue](#doublevalue): [Number](TopLevel.Number.md) `(read-only)` | Returns the value of the current HttpParameter attribute as a number. |
| [empty](#empty): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if there is a value for the http parameter attribute  and whether the value is empty. |
| [intValue](#intvalue): [Number](TopLevel.Number.md) `(read-only)` | Returns the value of the current HttpParameter attribute as int. |
| [rawValue](#rawvalue): [String](TopLevel.String.md) `(read-only)` | Returns the raw value for this HttpParameter instance. |
| [rawValues](#rawvalues): [Collection](dw.util.Collection.md) `(read-only)` | Returns a Collection of all raw values for this HTTP parameter. |
| [stringValue](#stringvalue): [String](TopLevel.String.md) `(read-only)` | Returns the value of the current HttpParameter attribute. |
| [stringValues](#stringvalues): [Collection](dw.util.Collection.md) `(read-only)` | Returns a Collection of all defined values for this HTTP parameter. |
| [submitted](#submitted): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the parameter was submitted. |
| [value](#value): [String](TopLevel.String.md) `(read-only)` | Returns the value of the current HttpParameter attribute. |
| [values](#values): [Collection](dw.util.Collection.md) `(read-only)` | Returns a Collection of all defined values for this current HTTP parameter. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [containsStringValue](dw.web.HttpParameter.md#containsstringvaluestring)([String](TopLevel.String.md)) | Identifies if the given value is part of the actual values. |
| [getBooleanValue](dw.web.HttpParameter.md#getbooleanvalue)() | Returns the value of the current HttpParameter attribute as a boolean. |
| [getBooleanValue](dw.web.HttpParameter.md#getbooleanvalueboolean)([Boolean](TopLevel.Boolean.md)) | Returns the value of the current HttpParameter attribute as a boolean. |
| [getDateValue](dw.web.HttpParameter.md#getdatevalue)() | Returns the value of the current HttpParameter attribute as a date. |
| [getDateValue](dw.web.HttpParameter.md#getdatevaluedate)([Date](TopLevel.Date.md)) | Returns the value of the current HttpParameter attribute as a date. |
| [getDoubleValue](dw.web.HttpParameter.md#getdoublevalue)() | Returns the value of the current HttpParameter attribute as a number. |
| [getDoubleValue](dw.web.HttpParameter.md#getdoublevaluenumber)([Number](TopLevel.Number.md)) | Returns the value of the current HttpParameter attribute as a number. |
| [getIntValue](dw.web.HttpParameter.md#getintvalue)() | Returns the value of the current HttpParameter attribute as int. |
| [getIntValue](dw.web.HttpParameter.md#getintvaluenumber)([Number](TopLevel.Number.md)) | Returns the value of the current HttpParameter attribute as an integer. |
| [getRawValue](dw.web.HttpParameter.md#getrawvalue)() | Returns the raw value for this HttpParameter instance. |
| [getRawValues](dw.web.HttpParameter.md#getrawvalues)() | Returns a Collection of all raw values for this HTTP parameter. |
| [getStringValue](dw.web.HttpParameter.md#getstringvalue)() | Returns the value of the current HttpParameter attribute. |
| [getStringValue](dw.web.HttpParameter.md#getstringvaluestring)([String](TopLevel.String.md)) | Returns the value of the current HttpParameter attribute. |
| [getStringValues](dw.web.HttpParameter.md#getstringvalues)() | Returns a Collection of all defined values for this HTTP parameter. |
| [getValue](dw.web.HttpParameter.md#getvalue)() | Returns the value of the current HttpParameter attribute. |
| [getValues](dw.web.HttpParameter.md#getvalues)() | Returns a Collection of all defined values for this current HTTP parameter. |
| [isChecked](dw.web.HttpParameter.md#ischeckedstring)([String](TopLevel.String.md)) | Identifies if the given String is an actual value of this http parameter. |
| [isEmpty](dw.web.HttpParameter.md#isempty)() | Identifies if there is a value for the http parameter attribute  and whether the value is empty. |
| [isSubmitted](dw.web.HttpParameter.md#issubmitted)() | Identifies if the parameter was submitted. |
| [toString](dw.web.HttpParameter.md#tostring)() | Returns the value of the current HttpParameter attribute. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### booleanValue
- booleanValue: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns the value of the current HttpParameter attribute as a boolean. If
      there is more than one value defined, only the first one is returned. For an
      undefined attribute it returns null.



---

### dateValue
- dateValue: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the value of the current HttpParameter attribute as a date. If
      there is more than one value defined, only the first one is returned. For
      an undefined attribute and if attribute is not a date it return null.



---

### doubleValue
- doubleValue: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the value of the current HttpParameter attribute as a number. If
      there is more than one value defined, only the first one is returned. For
      an undefined attribute it returns 0.0.



---

### empty
- empty: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if there is a value for the http parameter attribute
      and whether the value is empty.
      A value is treated as empty if it's not blank.



---

### intValue
- intValue: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the value of the current HttpParameter attribute as int. If there
      is more than one value defined, only the first one is returned. For an
      undefined attribute it returns null.



---

### rawValue
- rawValue: [String](TopLevel.String.md) `(read-only)`
  - : Returns the raw value for this HttpParameter instance.
      The raw value is the not trimmed String value of this HTTP parameter.
      If there is more than one value defined, only the first one is returned. For an
      undefined attribute the method returns a null.


    **See Also:**
    - [getStringValue()](dw.web.HttpParameter.md#getstringvalue)


---

### rawValues
- rawValues: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a Collection of all raw values for this HTTP parameter.
      The raw value is the not trimmed String value of this HTTP parameter.


    **See Also:**
    - [getStringValues()](dw.web.HttpParameter.md#getstringvalues)


---

### stringValue
- stringValue: [String](TopLevel.String.md) `(read-only)`
  - : Returns the value of the current HttpParameter attribute. If there is
      more than one value defined, only the first one is returned. For an
      undefined attribute the method returns a null.



---

### stringValues
- stringValues: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a Collection of all defined values for this HTTP parameter.


---

### submitted
- submitted: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the parameter was submitted. This is equivalent to the
      check, whether the parameter has a value.



---

### value
- value: [String](TopLevel.String.md) `(read-only)`
  - : Returns the value of the current HttpParameter attribute. If there is
      more than one value defined, only the first one is returned. For an
      undefined attribute the method returns null.



---

### values
- values: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a Collection of all defined values for this current HTTP parameter.

    **See Also:**
    - [getStringValues()](dw.web.HttpParameter.md#getstringvalues)


---

## Method Details

### containsStringValue(String)
- containsStringValue(value: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the given value is part of the actual values.

    **Parameters:**
    - value - the value to check.

    **Returns:**
    - true if the value is among the actual values, false otherwise.


---

### getBooleanValue()
- getBooleanValue(): [Boolean](TopLevel.Boolean.md)
  - : Returns the value of the current HttpParameter attribute as a boolean. If
      there is more than one value defined, only the first one is returned. For an
      undefined attribute it returns null.


    **Returns:**
    - the actual value as a boolean or null of no value is available.


---

### getBooleanValue(Boolean)
- getBooleanValue(defaultValue: [Boolean](TopLevel.Boolean.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns the value of the current HttpParameter attribute as a boolean. If there
      is more than one value defined, only the first one is returned. For an
      undefined attribute it returns the given default value.


    **Parameters:**
    - defaultValue - the default value to use.

    **Returns:**
    - the value of the parameter or the default value if empty.


---

### getDateValue()
- getDateValue(): [Date](TopLevel.Date.md)
  - : Returns the value of the current HttpParameter attribute as a date. If
      there is more than one value defined, only the first one is returned. For
      an undefined attribute and if attribute is not a date it return null.


    **Returns:**
    - the actual value as date or null if empty.


---

### getDateValue(Date)
- getDateValue(defaultValue: [Date](TopLevel.Date.md)): [Date](TopLevel.Date.md)
  - : Returns the value of the current HttpParameter attribute as a date. If
      there is more than one value defined, only the first one is returned. For
      an undefined attribute it returns the given default value and if
      the attributes is not a date it returns null.


    **Parameters:**
    - defaultValue - the default value to use.

    **Returns:**
    - the data value of the attribute or the default value if empty


---

### getDoubleValue()
- getDoubleValue(): [Number](TopLevel.Number.md)
  - : Returns the value of the current HttpParameter attribute as a number. If
      there is more than one value defined, only the first one is returned. For
      an undefined attribute it returns 0.0.


    **Returns:**
    - the actual value as double or null if the parameter has no value.


---

### getDoubleValue(Number)
- getDoubleValue(defaultValue: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the value of the current HttpParameter attribute as a number. If
      there is more than one value defined, only the first one is returned. For
      an undefined attribute it returns the given default value.


    **Parameters:**
    - defaultValue - the default value to use.

    **Returns:**
    - the actual value as double or the default value if empty.


---

### getIntValue()
- getIntValue(): [Number](TopLevel.Number.md)
  - : Returns the value of the current HttpParameter attribute as int. If there
      is more than one value defined, only the first one is returned. For an
      undefined attribute it returns null.


    **Returns:**
    - the actual value as an integer or null of no value is available.


---

### getIntValue(Number)
- getIntValue(defaultValue: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the value of the current HttpParameter attribute as an integer. If there
      is more than one value defined, only the first one is returned. For an
      undefined attribute it returns the given default value.


    **Parameters:**
    - defaultValue - the default value to use.

    **Returns:**
    - the value of the parameter or the default value if empty.


---

### getRawValue()
- getRawValue(): [String](TopLevel.String.md)
  - : Returns the raw value for this HttpParameter instance.
      The raw value is the not trimmed String value of this HTTP parameter.
      If there is more than one value defined, only the first one is returned. For an
      undefined attribute the method returns a null.


    **Returns:**
    - the actual value or null.

    **See Also:**
    - [getStringValue()](dw.web.HttpParameter.md#getstringvalue)


---

### getRawValues()
- getRawValues(): [Collection](dw.util.Collection.md)
  - : Returns a Collection of all raw values for this HTTP parameter.
      The raw value is the not trimmed String value of this HTTP parameter.


    **Returns:**
    - the raw values as a Collection of String, might be empty

    **See Also:**
    - [getStringValues()](dw.web.HttpParameter.md#getstringvalues)


---

### getStringValue()
- getStringValue(): [String](TopLevel.String.md)
  - : Returns the value of the current HttpParameter attribute. If there is
      more than one value defined, only the first one is returned. For an
      undefined attribute the method returns a null.


    **Returns:**
    - the actual value or null.


---

### getStringValue(String)
- getStringValue(defaultValue: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns the value of the current HttpParameter attribute. If there is
      more than one value defined, only the first one is returned. For an
      undefined attribute the method returns the given default value.


    **Parameters:**
    - defaultValue - the default value to use.

    **Returns:**
    - the actual value or the default value.


---

### getStringValues()
- getStringValues(): [Collection](dw.util.Collection.md)
  - : Returns a Collection of all defined values for this HTTP parameter.

    **Returns:**
    - the actual values as Collection.


---

### getValue()
- getValue(): [String](TopLevel.String.md)
  - : Returns the value of the current HttpParameter attribute. If there is
      more than one value defined, only the first one is returned. For an
      undefined attribute the method returns null.


    **Returns:**
    - the actual value or null.


---

### getValues()
- getValues(): [Collection](dw.util.Collection.md)
  - : Returns a Collection of all defined values for this current HTTP parameter.

    **Returns:**
    - the actual values as Collection.

    **See Also:**
    - [getStringValues()](dw.web.HttpParameter.md#getstringvalues)


---

### isChecked(String)
- isChecked(value: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the given String is an actual value of this http parameter.

    **Parameters:**
    - value - the value to check.

    **Returns:**
    - true if the value is among the actual values, false otherwise.


---

### isEmpty()
- isEmpty(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if there is a value for the http parameter attribute
      and whether the value is empty.
      A value is treated as empty if it's not blank.


    **Returns:**
    - true if a value is empty, false otherwise.


---

### isSubmitted()
- isSubmitted(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the parameter was submitted. This is equivalent to the
      check, whether the parameter has a value.


    **Returns:**
    - true if a value is there, false otherwise.


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns the value of the current HttpParameter attribute. If there is
      more than one value defined, only the first one is returned. For an
      undefined attribute the method returns an empty string.


    **Returns:**
    - the actual value or an empty String.


---

<!-- prettier-ignore-end -->
