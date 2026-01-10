<!-- prettier-ignore-start -->
# Class Pipeline

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.Pipeline](dw.system.Pipeline.md)

A helper for executing pipelines from JavaScript. The main purpose for this API is to invoke process pipelines from
JavaScript controllers, e.g. pipelines that return with an end node and that do not perform user interactions.
Pipelines that span across multiple requests (e.g. that contain Interaction-Continue-Nodes) are not supported and may
not work as expected. The pipeline will be executed within the current request and not by a remote call, so this API
works roughly like a Call node in a pipeline. The called pipeline will get its own local pipeline dictionary. The
dictionary can be populated with initial values from an argument object. Any results from the pipeline can be read
from the pipeline dictionary that is returned by the [execute(String)](dw.system.Pipeline.md#executestring) methods.


If an exception occurs during the pipeline processing, the Error-branch of the pipeline will be called. If no error
handling exists for the pipeline, the exception will be propagated and can be handled by the script code.


If the pipeline finishes with an End node, the name of the end node can be obtained from the returned pipeline
dictionary under the key 'EndNodeName'.


Example:


```
let Pipeline = require('dw/system/Pipeline');
let pdict = Pipeline.execute('MyPipeline-Start', {
    MyArgString:     'someStringValue',
    MyArgNumber:     12345,
    MyArgBoolean:    true
});
let result = pdict.MyReturnValue;
```


This feature requires an API version >=15.5.



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [execute](dw.system.Pipeline.md#executestring)([String](TopLevel.String.md)) | Executes a pipeline. |
| static [execute](dw.system.Pipeline.md#executestring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Executes a pipeline. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### execute(String)
- static execute(pipeline: [String](TopLevel.String.md)): [PipelineDictionary](dw.system.PipelineDictionary.md)
  - : Executes a pipeline.

    **Parameters:**
    - pipeline - the pipeline identifier, must consist of the pipeline name and the start node name, like             'PipelineName-StartNodeName'

    **Returns:**
    - the pipeline dictionary with the pipeline results

    **API Version:**
:::note
Available from version 15.5.
New convenience method for easier migration of pipeline-based systems to JavaScript controllers.
:::

---

### execute(String, Object)
- static execute(pipeline: [String](TopLevel.String.md), args: [Object](TopLevel.Object.md)): [PipelineDictionary](dw.system.PipelineDictionary.md)
  - : Executes a pipeline. The pipeline dictionary will be initialized with the provided arguments.

    **Parameters:**
    - pipeline - the pipeline identifier, must consist of a pipeline name and a start node name, like             'PipelineName-StartNodeName'
    - args - an object whose properties represent the initial values of the pipeline dictionary

    **Returns:**
    - the pipeline dictionary with the pipeline results

    **API Version:**
:::note
Available from version 15.5.
New convenience method for easier migration of pipeline-based systems to JavaScript controllers.
:::

---

<!-- prettier-ignore-end -->
