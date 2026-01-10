<!-- prettier-ignore-start -->
# Class JobStepExecution

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.job.JobStepExecution](dw.job.JobStepExecution.md)

Represents an execution of a step that belongs to a job. The job execution this step execution belongs to can be
accessed via [getJobExecution()](dw.job.JobStepExecution.md#getjobexecution). If a pipeline is used to implement a step this step execution is available
in the pipeline dictionary under the key 'JobStepExecution'. If a script module is used to implement a step this step
execution is available as the second parameter of the module's function that is used to execute the step, e.g.:


```
...
exports.execute( parameters, stepExecution)
{
     ...
     var jobExecution = stepExecution.getJobExecution();
     ...
}
...
```



## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of this step execution. |
| [jobExecution](#jobexecution): [JobExecution](dw.job.JobExecution.md) `(read-only)` | Returns the job execution this step execution belongs to. |
| [stepID](#stepid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the step this step execution belongs to. |
| [stepTypeID](#steptypeid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the step type of the step this step execution belongs to. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getID](dw.job.JobStepExecution.md#getid)() | Returns the ID of this step execution. |
| [getJobExecution](dw.job.JobStepExecution.md#getjobexecution)() | Returns the job execution this step execution belongs to. |
| [getParameterValue](dw.job.JobStepExecution.md#getparametervaluestring)([String](TopLevel.String.md)) | Returns the value of the parameter of the step this step execution belongs to. |
| [getStepID](dw.job.JobStepExecution.md#getstepid)() | Returns the ID of the step this step execution belongs to. |
| [getStepTypeID](dw.job.JobStepExecution.md#getsteptypeid)() | Returns the ID of the step type of the step this step execution belongs to. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of this step execution.


---

### jobExecution
- jobExecution: [JobExecution](dw.job.JobExecution.md) `(read-only)`
  - : Returns the job execution this step execution belongs to.


---

### stepID
- stepID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the step this step execution belongs to.


---

### stepTypeID
- stepTypeID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the step type of the step this step execution belongs to.


---

## Method Details

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of this step execution.

    **Returns:**
    - the ID of this step execution.


---

### getJobExecution()
- getJobExecution(): [JobExecution](dw.job.JobExecution.md)
  - : Returns the job execution this step execution belongs to.

    **Returns:**
    - the job execution this step execution belongs to.


---

### getParameterValue(String)
- getParameterValue(name: [String](TopLevel.String.md)): [Object](TopLevel.Object.md)
  - : Returns the value of the parameter of the step this step execution belongs to.

    **Parameters:**
    - name - The name of the parameter.

    **Returns:**
    - the value of the parameter of the step this step execution belongs to.


---

### getStepID()
- getStepID(): [String](TopLevel.String.md)
  - : Returns the ID of the step this step execution belongs to.

    **Returns:**
    - the ID of the step this step execution belongs to.


---

### getStepTypeID()
- getStepTypeID(): [String](TopLevel.String.md)
  - : Returns the ID of the step type of the step this step execution belongs to.

    **Returns:**
    - the ID of the step type of the step this step execution belongs to.


---

<!-- prettier-ignore-end -->
