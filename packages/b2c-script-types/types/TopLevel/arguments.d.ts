/**
 * The arguments of a function.
 * @see TopLevel.Function
 */
declare class arguments {
    /**
     * A reference to the function that is currently executing.
     */
    callee: any;
    /**
     * The number of arguments passed to the function.
     */
    length: number;
    private constructor();
}

export = arguments;
