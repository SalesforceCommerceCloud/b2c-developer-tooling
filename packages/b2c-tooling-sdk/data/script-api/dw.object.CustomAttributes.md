<!-- prettier-ignore-start -->
# Class CustomAttributes

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.CustomAttributes](dw.object.CustomAttributes.md)

This class is used together with other classes that contain custom attributes
and is used to read and write these attributes. The actual attributes are
accessible as ECMA properties. The syntax for setting and retrieving the
value of a custom attribute depends upon the type of the attribute. If the
wrong syntax is used to set an individual attribute than an exception will be
thrown.




The following script examples demonstrate how to work with custom attributes.
Suppose we have an ExtensibleObject named "eo" possessing attributes of all
the different types supported by the Commerce Cloud Digital metadata system. The
following script snippet shows that setting single-valued attributes is
simply a matter of using the assignment operator and standard ECMA primitives
and built-in types:





```
// attribute of value type 'Boolean'
eo.custom.bvalue = true;
var b : Boolean = eo.custom.bvalue;

// attribute of value type 'Integer'
eo.custom.ivalue = 10;
var i : Number = eo.custom.ivalue;

// attribute of value type 'Number'
eo.custom.dvalue = 99.99;
var d : Number = eo.custom.dvalue;

// attribute of value type 'String'
eo.custom.svalue = "String1";
var s : String = eo.custom.svalue;

// attribute of value type 'Email'
eo.custom.emailvalue = "email@demandware.com";
var e : String = eo.custom.emailvalue;

// attribute of value type 'Text'
eo.custom.tvalue = "laaaaaaaaaaaarge text";
var t : String = eo.custom.tvalue;

// attribute of value type 'Date'
eo.custom.dtvalue = new Date;
var date : Date = eo.custom.dtvalue;
```





Setting and retrieving the values for multi-value attributes is also
straightforward and uses ECMA arrays to represent the multiple values. Set-of
attributes and enum-of attributes are handled in a very similar manner. The
chief difference is that enum-of attributes are limited to a prescribed set
of value definitions whereas set-of attributes are open-ended. Furthermore,
each value in an enum-of attribute has a value and a display name which
affects the retrieval logic.

Multi-value attributes are returned as an array. This array is read-only and
can't be used to update the multi-value attribute. To update the multi-value
attribute an array with new values must be assigned to the attribute.





```
// attribute of value type 'Set of String'
// set the attribute value only if it hasn't been already set
if( !('setofstringvalue' in eo.custom) )
{
    eo.custom.setofstringvalue = new Array("abc","def","ghi");
}

// returns an Array of String instances
var setofstring : Array = eo.custom.setofstringvalue;
var s1 : String = setofstring[0];
var s2 : String = setofstring[1];
var s3 : String = setofstring[2];

// attribute of value type 'Enum of Integer' with multi-value handling
eo.custom.enumofintmultivalue = new Array(1, 2, 3);

// returns an Array of EnumValue instances
var enumofintmulti : Array = eo.custom.enumofintmultivalue;
var value1 : Number = enumofintmulti[0].getValue();
var displayvalue1 : String = enumofintmulti[0].getDisplayValue();
var value2 : Number = enumofintmulti[1].getValue();
var displayvalue2 : String = enumofintmulti[1].getDisplayValue();
var value3 : Number = enumofintmulti[2].getValue();
var displayvalue3 : String = enumofintmulti[2].getDisplayValue();
```





For further details on the Commerce Cloud Digital attribute system, see the core
Commerce Cloud Digital documentation.



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
<!-- prettier-ignore-end -->
