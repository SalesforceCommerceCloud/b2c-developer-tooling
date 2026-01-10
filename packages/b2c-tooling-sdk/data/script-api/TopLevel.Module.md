<!-- prettier-ignore-start -->
# Class Module

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.Module](TopLevel.Module.md)

CommonJS modules are JavaScript files that are loaded using the [require(String)](TopLevel.global.md#requirestring)
function. This function returns a module object, which wraps the script code from the file. Within a module
implementation, the module object can be accessed via the [module](TopLevel.global.md#module) variable.


A module has a unique absolute id. The same module may be resolved by [require(String)](TopLevel.global.md#requirestring)
for different path arguments, like relative paths (starting with "./" or "../"), or absolute paths. See the
documentation of require for more details about the lookup procedure.


Every module object has an [exports](TopLevel.Module.md#exports) property which can be used by the module implementation to expose its
public functions or properties. Only functions and properties that are explicitly exported are accessible from other
modules, all others are private and not visible. For convenience, the global [exports](TopLevel.global.md#exports) variable
is by default also initialized with the [module.exports](TopLevel.Module.md#exports) property of the current module.
In the most simple case, module elements can be exposed by adding them to the exports object, like:


```
// Greeting.js
exports.sayHello = function() {
    return 'Hello World!';
};
```


This is equivalent to:


```
// Greeting.js
module.exports.sayHello = function() {
    return 'Hello World!';
};
```


With the above implementation, a caller (for example another module in the same directory) could call the module
function like this:


```
var message = require('./Greeting').sayHello();
```


It is also possible to replace the whole module exports object with a completely different value, for example with a
function:


```
// Greeting.js
module.exports = function sayHello() {
    return 'Hi!';
}
```


Now the result of require would be a function, which can be invoked directly like:


```
var message = require('./Greeting')();
```


This construction can be used for exporting constructor functions, so that a module becomes something like a class:


```
// Greeting.js
function Greeting()
{
    this.message = 'Hi!';
}

Greeting.prototype.getMessage = function() {
    return this.message;
}

module.exports = Greeting;
```


which would be used like:


```
var Greeting = require('./Greeting');
var m = new Greeting().getMessage();
```



## Property Summary

| Property | Description |
| --- | --- |
| [cartridge](#cartridge): [String](TopLevel.String.md) | The name of the cartridge which contains the module. |
| [exports](#exports): [Object](TopLevel.Object.md) | The exports of the module. |
| [id](#id): [String](TopLevel.String.md) | The absolute, normalized id of the module, which uniquely identifies it. |
| [superModule](#supermodule): [Module](TopLevel.Module.md) | The module (if exists) that is overridden by this module. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### cartridge
- cartridge: [String](TopLevel.String.md)
  - : The name of the cartridge which contains the module.


---

### exports
- exports: [Object](TopLevel.Object.md)
  - : The exports of the module.


---

### id
- id: [String](TopLevel.String.md)
  - : The absolute, normalized id of the module, which uniquely identifies it. A call to the
      [global.require(String)](TopLevel.global.md#requirestring) function with this id would resolve this module.



---

### superModule
- superModule: [Module](TopLevel.Module.md)
  - : The module (if exists) that is overridden by this module. The super module would have the same path as the
      current module but its code location would be checked later in the lookup sequence. This property is useful to
      reuse functionality implemented in overridden modules.



---

<!-- prettier-ignore-end -->
