<!-- prettier-ignore-start -->
# Class PrintWriter

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.io.Writer](dw.io.Writer.md)
    - [dw.io.PrintWriter](dw.io.PrintWriter.md)

Template output stream writer.

Printwriter is available in the template scripting context and is used
to write data into the template output stream. You cannot instantiate this class
directly. Instead, the system assigns the object to variable named 'out' in the script context
to be used by the template scripts.


**Note:** when this class is used with sensitive data, be careful in persisting sensitive information to disk.



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [print](dw.io.PrintWriter.md#printstring)([String](TopLevel.String.md)) | Prints the given string into the output stream. |
| [println](dw.io.PrintWriter.md#println)() | Prints a line break into the output stream. |
| [println](dw.io.PrintWriter.md#printlnstring)([String](TopLevel.String.md)) | Print the given string followed by a line break into the output stream. |

### Methods inherited from class Writer

[close](dw.io.Writer.md#close), [flush](dw.io.Writer.md#flush), [write](dw.io.Writer.md#writestring), [write](dw.io.Writer.md#writestring-number-number)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### print(String)
- print(str: [String](TopLevel.String.md)): void
  - : Prints the given string into the output stream.

    **Parameters:**
    - str - the String object


---

### println()
- println(): void
  - : Prints a line break into the output stream.


---

### println(String)
- println(str: [String](TopLevel.String.md)): void
  - : Print the given string followed by a line break into the output stream.

    **Parameters:**
    - str - the String object


---

<!-- prettier-ignore-end -->
