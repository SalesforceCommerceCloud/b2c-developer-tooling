<!-- prettier-ignore-start -->
# Class Velocity

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.template.Velocity](dw.template.Velocity.md)

This class renders an Apache Velocity template. For Velocity template syntax, see
[Velocity 1.7](https://velocity.apache.org/engine/releases/velocity-1.7/).


The render() methods identify the template to render from:

- a template file name, which is resolved in the Dynamic WebDAV file location for the current site.  Template file names must end with either '.vm' or '.vs'.
- a dw.io.File object, which can point to any file system location that is accessible from a script
- a string that holds the template content directly

**Note:** Files included from an ISML template (either via `#parse` or `#include`) are always resolved
in the Dynamic location, and it is not possible to provide an absolute path.



On the target side of rendering, by default the render() methods write to the current response writer. When needed,
a `dw.io.Writer` can be supplied as a target.


Parameters for rendering can be passed as a single object holding the parameters as properties.


To create a URL, pass the `URLUtils` class.


To access localized strings, pass the `Resource` class:

```
var urlUtil = require('dw/web/URLUtils');
velocity.render("$url.abs('Foo-Bar','cgid',$res.msg('key')", {'url' : urlUtil, 'res' : dw.web.Resource});
```

The complete set of [VelocityTools](https://velocity.apache.org/tools/releases/2.0/generic.html)
 are provided to the template. You can use the tools to escape dynamic data, format text, and for other common tasks.


Template files are cached for different amounts of time, depending on the instance type.



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [remoteInclude](dw.template.Velocity.md#remoteincludestring-string)([String](TopLevel.String.md), [String...](TopLevel.String.md)) | Includes the rendered content of the specified action URL, which usually is a pipeline or controller. |
| static [render](dw.template.Velocity.md#renderstring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Renders an inline template to the response writer. |
| static [render](dw.template.Velocity.md#renderstring-object-writer)([String](TopLevel.String.md), [Object](TopLevel.Object.md), [Writer](dw.io.Writer.md)) | Renders an inline template to the provided writer. |
| static [renderTemplate](dw.template.Velocity.md#rendertemplatefile-object)([File](dw.io.File.md), [Object](TopLevel.Object.md)) | Renders a template file to the response writer. |
| static [renderTemplate](dw.template.Velocity.md#rendertemplatefile-object-writer)([File](dw.io.File.md), [Object](TopLevel.Object.md), [Writer](dw.io.Writer.md)) | Renders a template file to the provided writer. |
| static [renderTemplate](dw.template.Velocity.md#rendertemplatestring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Renders a template file to the response writer. |
| static [renderTemplate](dw.template.Velocity.md#rendertemplatestring-object-writer)([String](TopLevel.String.md), [Object](TopLevel.Object.md), [Writer](dw.io.Writer.md)) | Renders a template file to the provided writer. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### remoteInclude(String, String...)
- static remoteInclude(action: [String](TopLevel.String.md), namesAndParams: [String...](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Includes the rendered content of the specified action URL, which usually is a pipeline or controller. Must only be used inside a Velocity
      template, such as `$velocity.remoteInclude('Product-Show','sku','42')`


    **Parameters:**
    - action - the URL (pipeline or controller) to be included
    - namesAndParams - several strings with name=value pairs , e.g.: 'pid', 'value1', 'cgid', value2'.

    **Returns:**
    - the string that needs to be added to the Velocity template to execute the remote include


---

### render(String, Object)
- static render(templateContent: [String](TopLevel.String.md), args: [Object](TopLevel.Object.md)): void
  - : Renders an inline template to the response writer.

    **Parameters:**
    - templateContent - the template content
    - args - the argument object


---

### render(String, Object, Writer)
- static render(templateContent: [String](TopLevel.String.md), args: [Object](TopLevel.Object.md), writer: [Writer](dw.io.Writer.md)): void
  - : Renders an inline template to the provided writer.

    **Parameters:**
    - templateContent - the template content
    - args - the argument object
    - writer - the target writer


---

### renderTemplate(File, Object)
- static renderTemplate(templateFile: [File](dw.io.File.md), args: [Object](TopLevel.Object.md)): void
  - : Renders a template file to the response writer.

    **Parameters:**
    - templateFile - the file object denoting the template
    - args - the argument object


---

### renderTemplate(File, Object, Writer)
- static renderTemplate(templateFile: [File](dw.io.File.md), args: [Object](TopLevel.Object.md), writer: [Writer](dw.io.Writer.md)): void
  - : Renders a template file to the provided writer.

    **Parameters:**
    - templateFile - the file object denoting the template
    - args - the argument object
    - writer - the target writer


---

### renderTemplate(String, Object)
- static renderTemplate(templateFileName: [String](TopLevel.String.md), args: [Object](TopLevel.Object.md)): void
  - : Renders a template file to the response writer.

    **Parameters:**
    - templateFileName - the file name of the template, relative to the current sites Dynamic file location.  For example, for a file at a location similar to:  
```
https://mydomain.com/on/demandware.servlet/webdav/Sites/Dynamic/SiteGenesis/myfile.vm
```
  render the file in this way:   
```
velocity.renderTemplate("myfile.vm", null);
```

    - args - the argument object


---

### renderTemplate(String, Object, Writer)
- static renderTemplate(templateFileName: [String](TopLevel.String.md), args: [Object](TopLevel.Object.md), writer: [Writer](dw.io.Writer.md)): void
  - : Renders a template file to the provided writer.

    **Parameters:**
    - templateFileName - the file name of the template, relative to the current sites Dynamic file location.  For example, for a file at a location similar to:  
```
https://mydomain.com/on/demandware.servlet/webdav/Sites/Dynamic/SiteGenesis/mydir/myfile.vm
```
  render the file in this way:   
```
velocity.renderTemplate("mydir/myfile.vm", null, result);
```

    - args - the argument object to pass to the template
    - writer - the target writer


---

<!-- prettier-ignore-end -->
