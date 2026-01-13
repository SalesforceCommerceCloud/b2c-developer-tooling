<!-- prettier-ignore-start -->
# Class Template

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.Template](dw.util.Template.md)

Reads an ISML template from the file system and renders it into a
[MimeEncodedText](dw.value.MimeEncodedText.md) object. Optional substitution values can be
passed to the isml template via the [render(Map)](dw.util.Template.md#rendermap)
method. Substitution parameters can be accessed within the template through


```
    <isprint value="${param.parameter}">
```


or for backward compatibility through


```
    <isprint value="${pdict.parameter}">
```


The access through pdict only gives access to the parameter map provided at
rendering time and doesn't offer access to the system PipelineDictionary. The
pdict access to the property map is only considered to ease the transition
from SendMail pipelet API based templates. If the PipelineDictionary or
properties of the PipelineDictionary are needed, they need to be included in
the Property map passed to the render method.



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Template](#templatestring)([String](TopLevel.String.md)) | Creates a new template. |
| [Template](#templatestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Creates a new template with the locale being set to the given localeID. |

## Method Summary

| Method | Description |
| --- | --- |
| [render](dw.util.Template.md#render)() | Renders the template specified at instantiation time, without any  substitution parameters. |
| [render](dw.util.Template.md#rendermap)([Map](dw.util.Map.md)) | Renders the template specified at instantiation time with the given  substitution parameters. |
| [setLocale](dw.util.Template.md#setlocalestring)([String](TopLevel.String.md)) | Sets an optional localeID which is used instead of the current requests  localeID. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### Template(String)
- Template(templateName: [String](TopLevel.String.md))
  - : Creates a new template. Doesn't render the template until
      [render()](dw.util.Template.md#render) or [render(Map)](dw.util.Template.md#rendermap)
      is invoked. The current request localeID will be used for Rendering.


    **Parameters:**
    - templateName - file system path to the ISML template


---

### Template(String, String)
- Template(templateName: [String](TopLevel.String.md), localeID: [String](TopLevel.String.md))
  - : Creates a new template with the locale being set to the given localeID.
      Rendering doesn't happen until [render()](dw.util.Template.md#render) or
      [render(Map)](dw.util.Template.md#rendermap) is invoked.


    **Parameters:**
    - templateName - file system path to the ISML template
    - localeID - localeID to be used for Rendering


---

## Method Details

### render()
- render(): [MimeEncodedText](dw.value.MimeEncodedText.md)
  - : Renders the template specified at instantiation time, without any
      substitution parameters. Any isprint tags referring to param/pdict will
      be unresolved and will be replaced with empty strings. If there's an
      explicit localeID set through [setLocale(String)](dw.util.Template.md#setlocalestring),
      it takes precedence over the localeID associated with the current
      request.


    **Returns:**
    - MimeEncodedText with isprint tags referring to param/pdict
              replaced with an empty String



---

### render(Map)
- render(params: [Map](dw.util.Map.md)): [MimeEncodedText](dw.value.MimeEncodedText.md)
  - : Renders the template specified at instantiation time with the given
      substitution parameters. These parameters are available to ISML templates
      through variables named 'param' and 'pdict'. Note that in this context,
      pdict is not referring to the system PipelineDictionary, as the System
      Pipeline Dictionary is not accessible from this script API. If there's an
      explicit localeID set through [setLocale(String)](dw.util.Template.md#setlocalestring),
      it takes precedence over the localeID associated with the current
      request.


    **Parameters:**
    - params - Map of substitution parameters which are specified within the             ISML template. Access is available from within the ISML             template through named variables param or pdict.

    **Returns:**
    - MimeEncodedText containing the rendered template. Variables in
              the template referring to param/pdict are replaced with the value
              from the params map or empty if the value isn't found in the map



---

### setLocale(String)
- setLocale(localeID: [String](TopLevel.String.md)): [Template](dw.util.Template.md)
  - : Sets an optional localeID which is used instead of the current requests
      localeID.


    **Parameters:**
    - localeID - to be used for processing this template. Throws an exception             if localeID is blank

    **Returns:**
    - this Template object


---

<!-- prettier-ignore-end -->
