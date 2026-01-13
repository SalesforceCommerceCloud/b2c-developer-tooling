<!-- prettier-ignore-start -->
# Class JobExecution

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.job.JobExecution](dw.job.JobExecution.md)

Represents an execution of a job. The job execution can be accessed from a [JobStepExecution](dw.job.JobStepExecution.md) via
[JobStepExecution.getJobExecution()](dw.job.JobStepExecution.md#getjobexecution). If a pipeline is used to implement a step the step execution is available
in the pipeline dictionary under the key 'JobStepExecution'. If a script module is used to implement a step the step
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
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of this job execution. |
| [context](#context): [Map](dw.util.Map.md) `(read-only)` | Returns the job context which can be used to share data between steps. |
| [jobID](#jobid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the job this job execution belongs to. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getContext](dw.job.JobExecution.md#getcontext)() | Returns the job context which can be used to share data between steps. |
| [getID](dw.job.JobExecution.md#getid)() | Returns the ID of this job execution. |
| [getJobID](dw.job.JobExecution.md#getjobid)() | Returns the ID of the job this job execution belongs to. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of this job execution.


---

### context
- context: [Map](dw.util.Map.md) `(read-only)`
  - : Returns the job context which can be used to share data between steps. NOTE: Steps should be self-contained, the
      job context should only be used when necessary and with caution. If two steps which are running in parallel in
      the same job store data in the job context using the same key the result is undefined. Don't add any complex data
      to the job context since only simple data types are supported (for example, String and Integer).



---

### jobID
- jobID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the job this job execution belongs to.


---

## Method Details

### getContext()
- getContext(): [Map](dw.util.Map.md)
  - : Returns the job context which can be used to share data between steps. NOTE: Steps should be self-contained, the
      job context should only be used when necessary and with caution. If two steps which are running in parallel in
      the same job store data in the job context using the same key the result is undefined. Don't add any complex data
      to the job context since only simple data types are supported (for example, String and Integer).


    **Returns:**
    - the map that represents the job context.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of this job execution.

    **Returns:**
    - the ID of this job execution.


---

### getJobID()
- getJobID(): [String](TopLevel.String.md)
  - : Returns the ID of the job this job execution belongs to.

    **Returns:**
    - the ID of the job this job execution belongs to.


---

<!-- prettier-ignore-end -->
