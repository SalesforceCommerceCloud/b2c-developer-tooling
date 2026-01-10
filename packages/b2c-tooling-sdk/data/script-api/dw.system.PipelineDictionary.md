<!-- prettier-ignore-start -->
# Class PipelineDictionary

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.PipelineDictionary](dw.system.PipelineDictionary.md)

The class provides access to the values in the pipeline dictionary. You use
dynamic properties to access values, such as pdict.myvalue or
pdict\['myvalue'\];


The class is used in two different contexts, one where access is limited to
the declared input/output values and second to a context with full access.
Inside scripts, the PipelineDictionary allows you to access declared in/out
values (regardless of the alias used in the pipeline and the actual key under
which the value is stored). In templates and pipelines, all values can be
accessed. In templates the pipeline dictionary is exposed as variable pdict
(e.g. ${pdict.Product.ID}).


There are several values that are automatically stored in the
PipelineDictionary with each request. These include but are not limited to:


- CurrentSession
- CurrentRequest
- CurrentHttpParameterMap
- CurrentForms
- CurrentCustomer
- etc.



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
<!-- prettier-ignore-end -->
