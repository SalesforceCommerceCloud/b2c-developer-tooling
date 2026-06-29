/**
 * The BigInteger class is a helper class to represent an arbitrary long integer number.
 * The Demandware framework doesn't use this class, but in some special cases
 * web services that declare an XML element with "xsd:integer", which is by definition
 * an arbitrary long integer number, require the use of this class.
 * 
 * The class is designed in a way that it can be used very similar to a
 * desktop calculator. For example:
 * 
 * ```
 * var i = new BigInteger( 10 );
 * var result = d.add( 2 ).sub( 3 ).get();
 * ```
 * 
 * The above code will return 9 as result.
 * @deprecated Replaced by TopLevel.BigInt.
 */
declare class BigInteger {
    /**
     * Constructs a new BigInteger with the value 0.
     */
    constructor();
    /**
     * Constructs a new BigInteger using the specified Number value.
     */
    constructor(value: number);
    /**
     * Constructs a new BigInteger using the specified string representation of
     * a number.
     */
    constructor(value: string);
    /**
     * Returns a new BigInteger with the absolute value of this BigInteger.
     */
    abs(): BigInteger;
    /**
     * Adds a Number value to this BigInteger and returns the new BigInteger.
     */
    add(value: number): BigInteger;
    /**
     * Adds an BigInteger value to this BigInteger and returns the new BigInteger.
     */
    add(value: BigInteger): BigInteger;
    /**
     * Divides this BigInteger by the specified BigInteger and returns the new BigInteger.
     */
    divide(value: number): BigInteger;
    /**
     * Divides this BigInteger by the specified BigInteger and returns the new BigInteger.
     */
    divide(value: BigInteger): BigInteger;
    /**
     * Compares two BigInteger values whether they are equivalent.
     */
    equals(other: any): boolean;
    /**
     * Returns the value of the BigInteger as a Number.
     */
    get(): number;
    /**
     * Calculates the hash code for this BigInteger;
     */
    hashCode(): number;
    /**
     * Multiples the specified Number value with this BigInteger and returns the new BigInteger.
     */
    multiply(value: number): BigInteger;
    /**
     * Multiples the specified BigInteger value with this BigInteger and returns the new BigInteger.
     */
    multiply(value: BigInteger): BigInteger;
    /**
     * Returns a new BigInteger with the negated value of this BigInteger.
     */
    negate(): BigInteger;
    /**
     * Subtracts the specified Number value from this BigInteger and returns the new BigInteger.
     */
    subtract(value: number): BigInteger;
    /**
     * Subtracts the specified BigInteger value from this BigInteger and returns the new BigInteger.
     */
    subtract(value: BigInteger): BigInteger;
    /**
     * Returns a string representation of this object.
     */
    toString(): string;
    /**
     * The valueOf() method is called by the ECMAScript interpret to return
     * the "natural" value of an object. The BigInteger object returns its
     * current value as number. With this behavior script snippets can
     * be written like:
     * 
     * ```
     * var i = new BigInteger( 10 );
     * var x = 1 + d.add( 2 );
     * ```
     * 
     * where x will be at the end 13.
     */
    valueOf(): any;
}

export = BigInteger;
