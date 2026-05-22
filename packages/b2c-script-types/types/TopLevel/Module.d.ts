/**
 * CommonJS modules are JavaScript files that are loaded using the global.require
 * function. This function returns a module object, which wraps the script code from the file. Within a module
 * implementation, the module object can be accessed via the global.module module variable.
 * 
 * A module has a unique absolute id. The same module may be resolved by global.require
 * for different path arguments, like relative paths (starting with "./" or "../"), or absolute paths. See the
 * documentation of require for more details about the lookup procedure.
 * 
 * Every module object has an exports property which can be used by the module implementation to expose its
 * public functions or properties. Only functions and properties that are explicitly exported are accessible from other
 * modules, all others are private and not visible. For convenience, the global global.exports exports variable
 * is by default also initialized with the exports module.exports property of the current module.
 * In the most simple case, module elements can be exposed by adding them to the exports object, like:
 * 
 * ```
 * // Greeting.js
 * exports.sayHello = function() {
 * return 'Hello World!';
 * };
 * ```
 * 
 * This is equivalent to:
 * 
 * ```
 * // Greeting.js
 * module.exports.sayHello = function() {
 * return 'Hello World!';
 * };
 * ```
 * 
 * With the above implementation, a caller (for example another module in the same directory) could call the module
 * function like this:
 * 
 * ```
 * var message = require('./Greeting').sayHello();
 * ```
 * 
 * It is also possible to replace the whole module exports object with a completely different value, for example with a
 * function:
 * 
 * ```
 * // Greeting.js
 * module.exports = function sayHello() {
 * return 'Hi!';
 * }
 * ```
 * 
 * Now the result of require would be a function, which can be invoked directly like:
 * 
 * ```
 * var message = require('./Greeting')();
 * ```
 * 
 * This construction can be used for exporting constructor functions, so that a module becomes something like a class:
 * 
 * ```
 * // Greeting.js
 * function Greeting()
 * {
 * this.message = 'Hi!';
 * }
 * 
 * Greeting.prototype.getMessage = function() {
 * return this.message;
 * }
 * 
 * module.exports = Greeting;
 * ```
 * 
 * which would be used like:
 * @example
 * var Greeting = require('./Greeting');
 * var m = new Greeting().getMessage();
 */
declare class Module {
    /**
     * The name of the cartridge which contains the module.
     */
    cartridge: string;
    /**
     * The exports of the module.
     */
    exports: any;
    /**
     * The absolute, normalized id of the module, which uniquely identifies it. A call to the
     * global.require function with this id would resolve this module.
     */
    id: string;
    /**
     * The module (if exists) that is overridden by this module. The super module would have the same path as the
     * current module but its code location would be checked later in the lookup sequence. This property is useful to
     * reuse functionality implemented in overridden modules.
     */
    superModule: Module;
    private constructor();
}

export = Module;
