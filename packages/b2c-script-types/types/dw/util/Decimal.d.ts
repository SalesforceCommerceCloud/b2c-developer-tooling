/**
 * The Decimal class is a helper class to perform decimal arithmetic in
 * scripts and to represent a decimal number with arbitrary length. The decimal
 * class avoids arithmetic errors, which are typical for calculating with
 * floating numbers, that are based on a binary mantissa.
 * 
 * The class is designed in a way that it can be used very similar to a
 * desktop calculator.
 * 
 * ```
 * var d = new Decimal( 10.0 );
 * var result = d.add( 2.0 ).sub( 3.0 ).get();
 * ```
 * 
 * The above code will return 9 as result.
 */
declare class Decimal {
    /**
     * Constructs a new Decimal with the value 0.
     */
    constructor();
    /**
     * Constructs a new decimal using the specified Number value.
     */
    constructor(value: number);
    /**
     * Constructs a new decimal using the specified BigInt value.
     * @since 22.7
     */
    constructor(value: bigint);
    /**
     * Constructs a new Decimal using the specified string representation of
     * a number.
     */
    constructor(value: string);
    /**
     * Returns a new Decimal with the absolute value of this Decimal.
     */
    abs(): Decimal;
    /**
     * Adds a Number value to this Decimal and returns the new Decimal.
     */
    add(value: number): Decimal;
    /**
     * Adds a Decimal value to this Decimal and returns the new Decimal.
     */
    add(value: Decimal): Decimal;
    /**
     * Adds a percentage value to the current value of the
     * decimal. For example a value of 10 represent 10% or a value of
     * 85 represents 85%.
     */
    addPercent(value: number): Decimal;
    /**
     * Adds a percentage value to the current value of the
     * decimal. For example a value of 10 represent 10% or a value of
     * 85 represents 85%.
     */
    addPercent(value: Decimal): Decimal;
    /**
     * Divides the specified Number value with this decimal and returns the new
     * decimal.
     * 
     * When performing the division, 34 digits precision and a rounding mode of
     * HALF_EVEN is used to prevent quotients with nonterminating decimal
     * expansions.
     */
    divide(value: number): Decimal;
    /**
     * Divides the specified Decimal value with this decimal and returns the new
     * decimal.
     * 
     * When performing the division, 34 digits precision and a rounding mode of
     * HALF_EVEN is used to prevent quotients with nonterminating decimal
     * expansions.
     */
    divide(value: Decimal): Decimal;
    /**
     * Compares two decimal values whether they are equivalent.
     */
    equals(other: any): boolean;
    /**
     * Returns the value of the Decimal as a Number.
     */
    get(): number;
    /**
     * Calculates the hash code for this decimal;
     */
    hashCode(): number;
    /**
     * Multiples the specified Number value with this Decimal and returns the new Decimal.
     */
    multiply(value: number): Decimal;
    /**
     * Multiples the specified Decimal value with this Decimal and returns the new Decimal.
     */
    multiply(value: Decimal): Decimal;
    /**
     * Returns a new Decimal with the negated value of this Decimal.
     */
    negate(): Decimal;
    /**
     * Rounds the current value of the decimal using the specified
     * number of decimals. The parameter
     * specifies the number of digest after the decimal point.
     */
    round(decimals: number): Decimal;
    /**
     * Subtracts the specified Number value from this Decimal and returns the new Decimal.
     */
    subtract(value: number): Decimal;
    /**
     * Subtracts the specified Decimal value from this Decimal and returns the new Decimal.
     */
    subtract(value: Decimal): Decimal;
    /**
     * Subtracts a percentage value from the current value of the
     * decimal. For example a value of 10 represent 10% or a value of
     * 85 represents 85%.
     */
    subtractPercent(value: number): Decimal;
    /**
     * Subtracts a percentage value from the current value of the
     * decimal. For example a value of 10 represent 10% or a value of
     * 85 represents 85%.
     */
    subtractPercent(value: Decimal): Decimal;
    /**
     * Returns a string representation of this object.
     */
    toString(): string;
    /**
     * The valueOf() method is called by the ECMAScript interpret to return
     * the "natural" value of an object. The Decimal object returns its
     * current value as number. With this behavior script snippets can
     * be written like:
     * 
     * `
     * var d = new Decimal( 10.0 );
     * var x = 1.0 + d.add( 2.0 );
     * `
     * 
     * where x will be at the end 13.0.
     */
    valueOf(): any;
}

export = Decimal;
