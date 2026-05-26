/**
 * The Assert class provides utility methods for assertion events.
 */
declare class Assert {
    private constructor();
    /**
     * Propagates an assertion
     * if the specified objects are not equal.
     */
    static areEqual(arg1: any, arg2: any): void;
    /**
     * Propagates an assertion using the specified message
     * if the specified objects are not equal.
     */
    static areEqual(arg1: any, arg2: any, msg: string): void;
    /**
     * Propagates an assertion
     * if the specified objects are equal.
     */
    static areNotEqual(arg1: any, arg2: any): void;
    /**
     * Propagates an assertion using the specified message
     * if the specified objects are equal.
     */
    static areNotEqual(arg1: any, arg2: any, msg: string): void;
    /**
     * Propagates an assertion
     * if the specified objects are not the same.
     */
    static areSame(arg1: any, arg2: any): void;
    /**
     * Propagates an assertion using the specified message
     * if the specified objects are not the same.
     */
    static areSame(arg1: any, arg2: any, msg: string): void;
    /**
     * Propagates a failure assertion.
     */
    static fail(): void;
    /**
     * Propagates a failure assertion using the
     * specified message.
     */
    static fail(msg: string): void;
    /**
     * Propagates an assertion
     * if the specified check does not evaluate to
     * an empty object.
     */
    static isEmpty(arg: any): void;
    /**
     * Propagates an assertion using the specified message
     * if the specified check does not evaluate to
     * an empty object.
     */
    static isEmpty(arg: any, msg: string): void;
    /**
     * Propagates an assertion if the
     * specified check does not evaluate to false.
     */
    static isFalse(check: boolean): void;
    /**
     * Propagates an assertion using the specified message
     * if the specified check does not evaluate to false.
     */
    static isFalse(check: boolean, msg: string): void;
    /**
     * Propagates an assertion if the specified object 'arg' is not an instance
     * of the specified class 'clazz'.
     * 
     * For example, the following call does not propagate an assertion:
     * 
     * ```
     * `
     * var test = new dw.util.HashMap();
     * dw.util.Assert.isInstanceOf(dw.util.HashMap, test);
     * `
     * ```
     * 
     * But the following call will propagate an assertion:
     * 
     * ```
     * `
     * var test = new dw.util.Set();
     * dw.util.Assert.isInstanceOf(dw.util.HashMap, test);
     * `
     * ```
     * 
     * Note that 'clazz' can only be a Demandware API Scripting class.
     */
    static isInstanceOf(clazz: any, arg: any): void;
    /**
     * Propagates an assertion using the specified message
     * if the specified object is not an instance of the specified class.
     * 
     * For example, the following call does not propagate an assertion:
     * 
     * ```
     * `
     * var test = new dw.util.HashMap();
     * dw.util.Assert.isInstanceOf(dw.util.HashMap, test);
     * `
     * ```
     * 
     * But the following call will propagate an assertion:
     * 
     * ```
     * `
     * var test = new dw.util.Set();
     * dw.util.Assert.isInstanceOf(dw.util.HashMap, test);
     * `
     * ```
     * 
     * Note that 'clazz' can only be a Demandware API Scripting class.
     */
    static isInstanceOf(clazz: any, arg: any, msg: string): void;
    /**
     * Propagates an assertion
     * if the specified object is empty.
     */
    static isNotEmpty(arg: any): void;
    /**
     * Propagates an assertion using the specified message
     * if the specified object is empty.
     */
    static isNotEmpty(arg: any, msg: string): void;
    /**
     * Propagates an assertion if the
     * specified object is null.
     */
    static isNotNull(arg: any): void;
    /**
     * Propagates an assertion using the specified message
     * if the specified object is null.
     */
    static isNotNull(arg: any, msg: string): void;
    /**
     * Propagates an assertion
     * if the specified object is not null.
     */
    static isNull(arg: any): void;
    /**
     * Propagates an assertion using the specified message
     * if the specified object is not null.
     */
    static isNull(arg: any, msg: string): void;
    /**
     * Propagates an assertion if the
     * specified check does not evaluate to true.
     */
    static isTrue(check: boolean): void;
    /**
     * Propagates an assertion using the specified message
     * if the specified check does not evaluate to true.
     */
    static isTrue(check: boolean, msg: string): void;
}

export = Assert;
