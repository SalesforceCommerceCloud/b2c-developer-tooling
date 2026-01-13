<!-- prettier-ignore-start -->
# Class Generator

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.Generator](TopLevel.Generator.md)

A generator is a special type of function that works as a factory for
iterators and it allows you to define an iterative algorithm by writing a
single function which can maintain its own state. A function becomes a
generator if it contains one or more **yield** statements.


When a generator function is called, the body of the function does not
execute straight away; instead, it returns a generator-iterator object.
Each call to the generator-iterator's next() method will execute the
body of the function up to the next **yield** statement and return its result.
When either the end of the function or a return statement is reached,
a StopIteration exception is thrown.


For example, the following fib() function is a Fibonacci number generator,
that returns the generator when it encounters the **yield** statement:

```
function fib() {
   var fibNum = 0, j = 1;
   while (true) {
      **_yield_** fibNum;
      var t = fibNum;
      fibNum = j;
      j += t;
   }
}
```


To use the generator, simply call the next() method to access the values
returned by the function:

```
 var gen = fib();
 for (var i = 0; i < 10; i++) {
   document.write(**_gen.next()_** " ");
 }
```


**See Also:**
- [Iterator](TopLevel.Iterator.md)
- [StopIteration](TopLevel.StopIteration.md)


## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Generator](#generator)() |  |

## Method Summary

| Method | Description |
| --- | --- |
| [close](TopLevel.Generator.md#close)() | Closes the iteration of the generator. |
| [next](TopLevel.Generator.md#next)() | Resumes the iteration of the generator by continuing the function  at the statement after the **yield** statement. |
| [send](TopLevel.Generator.md#sendobject)([Object](TopLevel.Object.md)) | Allows you to control the resumption of the iterative algorithm. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### Generator()
- Generator()
  - : 


---

## Method Details

### close()
- close(): void
  - : Closes the iteration of the generator. Any finally clauses active in
      the generator function are run. If a finally clause throws any
      exception other than StopIteration, the exception is propagated to
      the caller of the close() method.



---

### next()
- next(): [Object](TopLevel.Object.md)
  - : Resumes the iteration of the generator by continuing the function
      at the statement after the **yield** statement. This function throws a
      StopIterator exception when there are no additional iterative steps.


    **Returns:**
    - the result of resuming the iterative algorithm or a StopIterator
      exception if the sequence is exhausted.


    **See Also:**
    - [StopIteration](TopLevel.StopIteration.md)


---

### send(Object)
- send(value: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Allows you to control the resumption of the iterative algorithm. Once a
      generator has been started by calling its next() method, you can use
      send() and pass a specific value that will be treated as the result
      of the last **yield**. The generator will then return the operand of the
      subsequent **yield**.
      
      
      You can't start a generator at an arbitrary point; you must start
      it with next() before you can send() it a specific value. Note that
      calling send(undefined) is equivalent to calling next(). However,
      starting a newborn generator with any value other than 'undefined' when
      calling send() will result in a TypeError exception.


    **Parameters:**
    - value - the value to use.


---

<!-- prettier-ignore-end -->
