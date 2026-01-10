<!-- prettier-ignore-start -->
# Class HttpParameterMap

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.HttpParameterMap](dw.web.HttpParameterMap.md)

A map of HTTP parameters.


## Property Summary

| Property | Description |
| --- | --- |
| [parameterCount](#parametercount): [Number](TopLevel.Number.md) `(read-only)` | Returns the number of paramters in this http parameter map. |
| [parameterNames](#parameternames): [Set](dw.util.Set.md) `(read-only)` | Returns a collection of all parameter names. |
| [requestBodyAsString](#requestbodyasstring): [String](TopLevel.String.md) `(read-only)` | Returns the HTTP request body as string (e.g. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [get](dw.web.HttpParameterMap.md#getobject)([Object](TopLevel.Object.md)) | Returns the http parameter for the given key or an empty http parameter,  if no parameter is defined for that key. |
| [getParameterCount](dw.web.HttpParameterMap.md#getparametercount)() | Returns the number of paramters in this http parameter map. |
| [getParameterMap](dw.web.HttpParameterMap.md#getparametermapstring)([String](TopLevel.String.md)) | Returns a sub-map containing all parameters that start with the given  prefix. |
| [getParameterNames](dw.web.HttpParameterMap.md#getparameternames)() | Returns a collection of all parameter names. |
| [getRequestBodyAsString](dw.web.HttpParameterMap.md#getrequestbodyasstring)() | Returns the HTTP request body as string (e.g. |
| [isParameterSubmitted](dw.web.HttpParameterMap.md#isparametersubmittedstring)([String](TopLevel.String.md)) | Identifies if the parameter has been submitted. |
| [processMultipart](dw.web.HttpParameterMap.md#processmultipartfunction)([Function](TopLevel.Function.md)) | This method can be called to process a form submission for an HTML form  with encoding type "multipart/form-data". |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### parameterCount
- parameterCount: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the number of paramters in this http parameter map.


---

### parameterNames
- parameterNames: [Set](dw.util.Set.md) `(read-only)`
  - : Returns a collection of all parameter names.


---

### requestBodyAsString
- requestBodyAsString: [String](TopLevel.String.md) `(read-only)`
  - : Returns the HTTP request body as string (e.g. useful for XML posts). A body
      is only returned if the request is a POST or PUT request and was not send
      with "application/x-www-form-urlencoded" encoding. If the request was send
      with that encoding it is interpreted as form data and the body will be empty.



---

## Method Details

### get(Object)
- get(name: [Object](TopLevel.Object.md)): [HttpParameter](dw.web.HttpParameter.md)
  - : Returns the http parameter for the given key or an empty http parameter,
      if no parameter is defined for that key. An empty parameter returns
      false for the method isDefined().


    **Parameters:**
    - name - the key whose associated http parameter is to be returned.

    **Returns:**
    - the http parameter or an empty http parameter.


---

### getParameterCount()
- getParameterCount(): [Number](TopLevel.Number.md)
  - : Returns the number of paramters in this http parameter map.

    **Returns:**
    - the number parameters.


---

### getParameterMap(String)
- getParameterMap(prefix: [String](TopLevel.String.md)): [HttpParameterMap](dw.web.HttpParameterMap.md)
  - : Returns a sub-map containing all parameters that start with the given
      prefix. The prefix will be removed from the parameter names in the returned
      sub-map. For example with the parameters "pre\_P1" and "pre\_p2" a call with
      "pre\_" as parameter will return a HttpParameterMap containing "P1" and "P2".


    **Parameters:**
    - prefix - the prefix to use when creating the sub-map.

    **Returns:**
    - the sub-map containing the target parameters.


---

### getParameterNames()
- getParameterNames(): [Set](dw.util.Set.md)
  - : Returns a collection of all parameter names.

    **Returns:**
    - a set of all parameter names


---

### getRequestBodyAsString()
- getRequestBodyAsString(): [String](TopLevel.String.md)
  - : Returns the HTTP request body as string (e.g. useful for XML posts). A body
      is only returned if the request is a POST or PUT request and was not send
      with "application/x-www-form-urlencoded" encoding. If the request was send
      with that encoding it is interpreted as form data and the body will be empty.


    **Returns:**
    - the http request body


---

### isParameterSubmitted(String)
- isParameterSubmitted(key: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the parameter has been submitted.

    **Parameters:**
    - key - the parameter to check.

    **Returns:**
    - true if the parameter has been submitted, false otherwise.


---

### processMultipart(Function)
- processMultipart(callback: [Function](TopLevel.Function.md)): [LinkedHashMap](dw.util.LinkedHashMap.md)
  - : This method can be called to process a form submission for an HTML form
      with encoding type "multipart/form-data". Such a form can have a mixture
      of "regular" HTML form fields and also file uploads.
      
      
      Form fields are available via [get(Object)](dw.web.HttpParameterMap.md#getobject) without calling this method.
      Uploaded files still need to be processed via the passed callback function.
      
      
      This callback function is called for each file upload part in the request.
      The parameters are the field name, the content type and the original file
      name. The function can return either a null, which means that the upload
      of this part should be skipped, or return a dw.io.File instance. If the
      file is an existing directory the system will automatically generate a
      unique file name. If the file is not an existing directory the uploaded
      content will be directly stored into that file. An existing file with the
      same name will be deleted. If the file can't be deleted for whatever reason,
      the upload is stored with a generated unique file name in the indicated directory.
      
      
      An automatically generated file name consists of the the prefix "upload",
      a time stamp, a unique id and the extension tmp. For example:
      "upload\_20070114221535\_bc7H1aOadI9qYaaacovPd3lqna.tmp".
      
      
      ```
      var params : HttpParameterMap = pdict.CurrentHttpParameterMap;
      
      // Get the file name from the first field. This is works because the
      // parameter map is updated before the file part is parsed.
      var files : LinkedHashMap = params.processMultipart( (function( field, ct, oname ){
          return new File( File.IMPEX + "/" + params.firstField );
      }) );
      ```


    **Parameters:**
    - callback - a callback function, which takes the field name, content type and             original file name as input

    **Returns:**
    - a LinkedHashMap where the keys are the actual file names and the values are references to the [File](dw.io.File.md),
              _or_ `null` if this is not a multipart request



---

<!-- prettier-ignore-end -->
