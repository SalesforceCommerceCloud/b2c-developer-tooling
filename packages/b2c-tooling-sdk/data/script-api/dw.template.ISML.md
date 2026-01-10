<!-- prettier-ignore-start -->
# Class ISML

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.template.ISML](dw.template.ISML.md)

This class provides support for rendering ISML templates. For more details about the ISML syntax, refer to the
Commerce Cloud Digital developer documentation. Templates are stored as \*.isml files. They are located in a
locale-specific folder under the '/cartridge/templates' folder, with '/cartridge/template/default' being the default
locale. The template name arguments of the various render methods represent the template path (without file ending)
within this folder structure.


Example for rendering a template with arguments from JavaScript code:


```
let isml = require('dw/template/ISML');
isml.renderTemplate('helloworld', {
    Message: 'Hello, World!'
});
```


Example code for accessing the template arguments in the 'helloworld.isml' template from the above code snippet:


```
The message is: <isprint value="${pdict.Message}" />
```



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [renderTemplate](dw.template.ISML.md#rendertemplatestring---variant-1)([String](TopLevel.String.md)) | Renders an ISML template and writes the output to the current response. |
| static [renderTemplate](dw.template.ISML.md#rendertemplatestring-object---variant-1)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Renders an ISML template and writes the output to the current response. |
| static [renderTemplate](dw.template.ISML.md#rendertemplatestring---variant-2)([String](TopLevel.String.md)) | Renders an ISML template and writes the output to the current response. |
| static [renderTemplate](dw.template.ISML.md#rendertemplatestring-object---variant-2)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Renders an ISML template and writes the output to the current response. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### renderTemplate(String) - Variant 1
- static renderTemplate(template: [String](TopLevel.String.md)): void
  - : Renders an ISML template and writes the output to the current response. The template may contain ISML tags which
      control the character encoding, content type, caching behavior and so on of the response (see ISML
      documentation).


    **Parameters:**
    - template - the template path

    **API Version:**
:::note
No longer available as of version 17.7.
Puts template arguments into the global pipeline dictionary.
:::

---

### renderTemplate(String, Object) - Variant 1
- static renderTemplate(template: [String](TopLevel.String.md), templateArgs: [Object](TopLevel.Object.md)): void
  - : Renders an ISML template and writes the output to the current response. The template may contain ISML tags which
      control the character encoding, content type, caching behavior and so on of the response (see ISML
      documentation). This method takes an additional JavaScript object as argument. Its properties are accessible for
      script expressions in the template under the "pdict.\*" variable.


    **Parameters:**
    - template - the template path
    - templateArgs - the template arguments object

    **API Version:**
:::note
No longer available as of version 17.7.
Puts template arguments into the global pipeline dictionary.
:::

---

### renderTemplate(String) - Variant 2
- static renderTemplate(template: [String](TopLevel.String.md)): void
  - : Renders an ISML template and writes the output to the current response. The template may contain ISML tags which
      control the character encoding, content type, caching behavior and so on of the response (see ISML
      documentation).


    **Parameters:**
    - template - the template path

    **API Version:**
:::note
Available from version 17.7.
Keeps template arguments in a local pipeline dictionary scope. This avoids side-effects on other templates.
:::

---

### renderTemplate(String, Object) - Variant 2
- static renderTemplate(template: [String](TopLevel.String.md), templateArgs: [Object](TopLevel.Object.md)): void
  - : Renders an ISML template and writes the output to the current response. The template may contain ISML tags which
      control the character encoding, content type, caching behavior and so on of the response (see ISML
      documentation). This method takes an additional JavaScript object as argument. Its properties are accessible for
      script expressions in the template under the "pdict.\*" variable.


    **Parameters:**
    - template - the template path
    - templateArgs - the template arguments object

    **API Version:**
:::note
Available from version 17.7.
Keeps template arguments in a local pipeline dictionary scope. This avoids side-effects on other templates.
:::

---

<!-- prettier-ignore-end -->
