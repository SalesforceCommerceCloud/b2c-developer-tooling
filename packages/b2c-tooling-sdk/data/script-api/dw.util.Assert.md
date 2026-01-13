<!-- prettier-ignore-start -->
# Class Assert

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.Assert](dw.util.Assert.md)

The Assert class provides utility methods for assertion events.


## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [areEqual](dw.util.Assert.md#areequalobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Propagates an assertion  if the specified objects are not equal. |
| static [areEqual](dw.util.Assert.md#areequalobject-object-string)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md), [String](TopLevel.String.md)) | Propagates an assertion using the specified message  if the specified objects are not equal. |
| static [areSame](dw.util.Assert.md#aresameobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Propagates an assertion  if the specified objects are not the same. |
| static [areSame](dw.util.Assert.md#aresameobject-object-string)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md), [String](TopLevel.String.md)) | Propagates an assertion using the specified message  if the specified objects are not the same. |
| static [fail](dw.util.Assert.md#fail)() | Propagates a failure assertion. |
| static [fail](dw.util.Assert.md#failstring)([String](TopLevel.String.md)) | Propagates a failure assertion using the  specified message. |
| static [isEmpty](dw.util.Assert.md#isemptyobject)([Object](TopLevel.Object.md)) | Propagates an assertion  if the specified check does not evaluate to  an empty object. |
| static [isEmpty](dw.util.Assert.md#isemptyobject-string)([Object](TopLevel.Object.md), [String](TopLevel.String.md)) | Propagates an assertion using the specified message  if the specified check does not evaluate to  an empty object. |
| static [isFalse](dw.util.Assert.md#isfalseboolean)([Boolean](TopLevel.Boolean.md)) | Propagates an assertion if the  specified check does not evaluate to false. |
| static [isFalse](dw.util.Assert.md#isfalseboolean-string)([Boolean](TopLevel.Boolean.md), [String](TopLevel.String.md)) | Propagates an assertion using the specified message  if the specified check does not evaluate to false. |
| static [isInstanceOf](dw.util.Assert.md#isinstanceofobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Propagates an assertion if the specified object 'arg' is not an instance  of the specified class 'clazz'. |
| static [isInstanceOf](dw.util.Assert.md#isinstanceofobject-object-string)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md), [String](TopLevel.String.md)) | Propagates an assertion using the specified message  if the specified object is not an instance of the specified class. |
| static [isNotEmpty](dw.util.Assert.md#isnotemptyobject)([Object](TopLevel.Object.md)) | Propagates an assertion  if the specified object is empty. |
| static [isNotEmpty](dw.util.Assert.md#isnotemptyobject-string)([Object](TopLevel.Object.md), [String](TopLevel.String.md)) | Propagates an assertion using the specified message  if the specified object is empty. |
| static [isNotNull](dw.util.Assert.md#isnotnullobject)([Object](TopLevel.Object.md)) | Propagates an assertion if the  specified object is null. |
| static [isNotNull](dw.util.Assert.md#isnotnullobject-string)([Object](TopLevel.Object.md), [String](TopLevel.String.md)) | Propagates an assertion using the specified message  if the specified object is null. |
| static [isNull](dw.util.Assert.md#isnullobject)([Object](TopLevel.Object.md)) | Propagates an assertion  if the specified object is not null. |
| static [isNull](dw.util.Assert.md#isnullobject-string)([Object](TopLevel.Object.md), [String](TopLevel.String.md)) | Propagates an assertion using the specified message  if the specified object is not null. |
| static [isTrue](dw.util.Assert.md#istrueboolean)([Boolean](TopLevel.Boolean.md)) | Propagates an assertion if the  specified check does not evaluate to true. |
| static [isTrue](dw.util.Assert.md#istrueboolean-string)([Boolean](TopLevel.Boolean.md), [String](TopLevel.String.md)) | Propagates an assertion using the specified message  if the specified check does not evaluate to true. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### areEqual(Object, Object)
- static areEqual(arg1: [Object](TopLevel.Object.md), arg2: [Object](TopLevel.Object.md)): void
  - : Propagates an assertion
      if the specified objects are not equal.


    **Parameters:**
    - arg1 - the first object to check.
    - arg2 - the second object to check.


---

### areEqual(Object, Object, String)
- static areEqual(arg1: [Object](TopLevel.Object.md), arg2: [Object](TopLevel.Object.md), msg: [String](TopLevel.String.md)): void
  - : Propagates an assertion using the specified message
      if the specified objects are not equal.


    **Parameters:**
    - arg1 - the first object to check.
    - arg2 - the second object to check.
    - msg - the assertion message.


---

### areSame(Object, Object)
- static areSame(arg1: [Object](TopLevel.Object.md), arg2: [Object](TopLevel.Object.md)): void
  - : Propagates an assertion
      if the specified objects are not the same.


    **Parameters:**
    - arg1 - the first object to check.
    - arg2 - the second object to check.


---

### areSame(Object, Object, String)
- static areSame(arg1: [Object](TopLevel.Object.md), arg2: [Object](TopLevel.Object.md), msg: [String](TopLevel.String.md)): void
  - : Propagates an assertion using the specified message
      if the specified objects are not the same.


    **Parameters:**
    - arg1 - the first object to check.
    - arg2 - the second object to check.
    - msg - the assertion message.


---

### fail()
- static fail(): void
  - : Propagates a failure assertion.


---

### fail(String)
- static fail(msg: [String](TopLevel.String.md)): void
  - : Propagates a failure assertion using the
      specified message.


    **Parameters:**
    - msg - the assertion message.


---

### isEmpty(Object)
- static isEmpty(arg: [Object](TopLevel.Object.md)): void
  - : Propagates an assertion
      if the specified check does not evaluate to
      an empty object.


    **Parameters:**
    - arg - the object to check.


---

### isEmpty(Object, String)
- static isEmpty(arg: [Object](TopLevel.Object.md), msg: [String](TopLevel.String.md)): void
  - : Propagates an assertion using the specified message
      if the specified check does not evaluate to
      an empty object.


    **Parameters:**
    - arg - the object to check.
    - msg - the assertion message.


---

### isFalse(Boolean)
- static isFalse(check: [Boolean](TopLevel.Boolean.md)): void
  - : Propagates an assertion if the
      specified check does not evaluate to false.


    **Parameters:**
    - check - the condition to check.


---

### isFalse(Boolean, String)
- static isFalse(check: [Boolean](TopLevel.Boolean.md), msg: [String](TopLevel.String.md)): void
  - : Propagates an assertion using the specified message
      if the specified check does not evaluate to false.


    **Parameters:**
    - check - the condition to check.
    - msg - the assertion message.


---

### isInstanceOf(Object, Object)
- static isInstanceOf(clazz: [Object](TopLevel.Object.md), arg: [Object](TopLevel.Object.md)): void
  - : Propagates an assertion if the specified object 'arg' is not an instance
      of the specified class 'clazz'.
      
      
      For example, the following call does not propagate an assertion:
      
      ```
      
          var test = new dw.util.HashMap();
          dw.util.Assert.isInstanceOf(dw.util.HashMap, test);
      ```
      
      
      
      But the following call will propagate an assertion:
      
      ```
      
          var test = new dw.util.Set();
          dw.util.Assert.isInstanceOf(dw.util.HashMap, test);
      ```
      
      
      
      Note that 'clazz' can only be a Demandware API Scripting class.


    **Parameters:**
    - clazz - the scripting class to use to check the object.
    - arg - the object to check.


---

### isInstanceOf(Object, Object, String)
- static isInstanceOf(clazz: [Object](TopLevel.Object.md), arg: [Object](TopLevel.Object.md), msg: [String](TopLevel.String.md)): void
  - : Propagates an assertion using the specified message
      if the specified object is not an instance of the specified class.
      
      
      For example, the following call does not propagate an assertion:
      
      ```
      
          var test = new dw.util.HashMap();
          dw.util.Assert.isInstanceOf(dw.util.HashMap, test);
      ```
      
      
      
      But the following call will propagate an assertion:
      
      ```
      
          var test = new dw.util.Set();
          dw.util.Assert.isInstanceOf(dw.util.HashMap, test);
      ```
      
      
      
      Note that 'clazz' can only be a Demandware API Scripting class.


    **Parameters:**
    - clazz - the scripting class to use to check the object.
    - arg - the object to check.
    - msg - the assertion message.


---

### isNotEmpty(Object)
- static isNotEmpty(arg: [Object](TopLevel.Object.md)): void
  - : Propagates an assertion
      if the specified object is empty.


    **Parameters:**
    - arg - the object to check.


---

### isNotEmpty(Object, String)
- static isNotEmpty(arg: [Object](TopLevel.Object.md), msg: [String](TopLevel.String.md)): void
  - : Propagates an assertion using the specified message
      if the specified object is empty.


    **Parameters:**
    - arg - the object to check.
    - msg - the assertion message.


---

### isNotNull(Object)
- static isNotNull(arg: [Object](TopLevel.Object.md)): void
  - : Propagates an assertion if the
      specified object is null.


    **Parameters:**
    - arg - the object to check.


---

### isNotNull(Object, String)
- static isNotNull(arg: [Object](TopLevel.Object.md), msg: [String](TopLevel.String.md)): void
  - : Propagates an assertion using the specified message
      if the specified object is null.


    **Parameters:**
    - arg - the object to check.
    - msg - the assertion message.


---

### isNull(Object)
- static isNull(arg: [Object](TopLevel.Object.md)): void
  - : Propagates an assertion
      if the specified object is not null.


    **Parameters:**
    - arg - the object to check.


---

### isNull(Object, String)
- static isNull(arg: [Object](TopLevel.Object.md), msg: [String](TopLevel.String.md)): void
  - : Propagates an assertion using the specified message
      if the specified object is not null.


    **Parameters:**
    - arg - the object to check.
    - msg - the assertion message.


---

### isTrue(Boolean)
- static isTrue(check: [Boolean](TopLevel.Boolean.md)): void
  - : Propagates an assertion if the
      specified check does not evaluate to true.


    **Parameters:**
    - check - the condition to check.


---

### isTrue(Boolean, String)
- static isTrue(check: [Boolean](TopLevel.Boolean.md), msg: [String](TopLevel.String.md)): void
  - : Propagates an assertion using the specified message
      if the specified check does not evaluate to true.


    **Parameters:**
    - check - the condition to check.
    - msg - the assertion message.


---

<!-- prettier-ignore-end -->
