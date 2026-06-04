/**
 * This class provides functionality to call hooks. A hook is an extension point in the business logic,
 * where you can register scripts to customize functionality.
 */
declare class HookMgr {
    private constructor();
    /**
     * Calls a hook on base of the specified extensionPoint and function. If a hook throws an exception, then
     * this method will also throw an exception. If no hook and no system default implementation is provided,
     * then this method will return undefined.
     * 
     * Sample:
     * @example
     * dw.system.HookMgr.callHook( "dw.order.calculate", "calculate", basket );
     */
    static callHook(extensionPoint: string, function_: string, ...args: any[]): any;
    /**
     * Checks whether a hook is registered or a system default implementation exists for this extension point.
     * 
     * extensionPoint refers to the same name used to register a script as implementation. With this method it's only
     * possible to check for a whole script registered but it is not possible to check, whether an individual function
     * is implemented.
     * 
     * Sample:
     * @example
     * dw.system.HookMgr.hasHook( "dw.order.calculate" );
     */
    static hasHook(extensionPoint: string): boolean;
}

export = HookMgr;
