<!-- prettier-ignore-start -->
# Class EnumValue

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.value.EnumValue](dw.value.EnumValue.md)

The class represents a single value for an Enumeration type. Enumeration
types can be configured through the business manager for custom attributes.
Some system attributes, e.g. the order status, are also of Enumeration types.


Each EnumValue has a base value and a display value.  The type of the base
value can be either String or Integer. Every EnumValue has a display value.



If the value of an Enumeration type object attribute is
`null`, when that attribute is accessed an EnumValue is returned
that has a base value of `null`, rather than `null`
itself.  This means that `empty(object.attribute)` would be
`false`, and `empty(object.attribute.value)` would be
`true`
.



## Property Summary

| Property | Description |
| --- | --- |
| [displayValue](#displayvalue): [String](TopLevel.String.md) `(read-only)` | Returns the display value of the enumeration value. |
| [value](#value): [Object](TopLevel.Object.md) `(read-only)` | Returns the value of the enumeration value. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getDisplayValue](dw.value.EnumValue.md#getdisplayvalue)() | Returns the display value of the enumeration value. |
| [getValue](dw.value.EnumValue.md#getvalue)() | Returns the value of the enumeration value. |
| [toString](dw.value.EnumValue.md#tostring)() | Same as getDisplayValue(). |
| [valueOf](dw.value.EnumValue.md#valueof)() | According the ECMA specification, this method returns the "natural"  primitive value of this object. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### displayValue
- displayValue: [String](TopLevel.String.md) `(read-only)`
  - : Returns the display value of the enumeration value. If no display value
      is configured the method return the string representation of the value.



---

### value
- value: [Object](TopLevel.Object.md) `(read-only)`
  - : Returns the value of the enumeration value. This is either an integer
      value or a string.



---

## Method Details

### getDisplayValue()
- getDisplayValue(): [String](TopLevel.String.md)
  - : Returns the display value of the enumeration value. If no display value
      is configured the method return the string representation of the value.



---

### getValue()
- getValue(): [Object](TopLevel.Object.md)
  - : Returns the value of the enumeration value. This is either an integer
      value or a string.



---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Same as getDisplayValue().


---

### valueOf()
- valueOf(): [Object](TopLevel.Object.md)
  - : According the ECMA specification, this method returns the "natural"
      primitive value of this object. Here it is equivalent to getValue().



---

<!-- prettier-ignore-end -->
