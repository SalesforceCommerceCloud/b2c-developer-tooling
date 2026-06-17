import Decimal = require('../util/Decimal');

/**
 * Represents the quantity of an item.
 */
declare class Quantity {
    /**
     * Identifies if the instance contains settings for value and unit.
     */
    readonly available: boolean;
    /**
     * Returns the quantity as dw.util.Decimal, `null` is returned when the quantity is not available.
     */
    readonly decimalValue: Decimal | null;
    /**
     * Returns the value for unit which identifies the
     * unit of measure for the quantity. Examples of unit
     * are 'inches' or 'pounds'.
     */
    readonly unit: string;
    /**
     * Returns the quantity value.
     * @see getDecimalValue
     */
    readonly value: number;
    /**
     * Creates a new quantity instance with the specified value and unit.
     */
    constructor(value: number, unit: string);
    /**
     * Add Quantity object to the current object. Only objects representing the same unit can be added.
     */
    add(value: Quantity): Quantity;
    /**
     * Compares two Quantity values. An exception is thrown if the two Quantities values
     * are of different unit. If one of the Quantity values represents the N/A value
     * it is treated as 0.0.
     */
    compareTo(other: Quantity): number;
    /**
     * Divide Quantity object by specified divisor.
     */
    divide(divisor: number): Quantity;
    /**
     * Compares two decimal values whether they are equivalent.
     */
    equals(other: any): boolean;
    /**
     * Returns the quantity as dw.util.Decimal, `null` is returned when the quantity is not available.
     */
    getDecimalValue(): Decimal | null;
    /**
     * Returns the value for unit which identifies the
     * unit of measure for the quantity. Examples of unit
     * are 'inches' or 'pounds'.
     */
    getUnit(): string;
    /**
     * Returns the quantity value.
     * @see getDecimalValue
     */
    getValue(): number;
    /**
     * Calculates the hash code for a decimal.
     */
    hashCode(): number;
    /**
     * Identifies if the instance contains settings for value and unit.
     */
    isAvailable(): boolean;
    /**
     * Identifies if two Quantities have the same unit.
     */
    isOfSameUnit(value: Quantity): boolean;
    /**
     * Multiply Quantity object by specified factor.
     */
    multiply(factor: number): Quantity;
    /**
     * Method returns a new instance of Quantity with the same unit but
     * different value. An N/A instance is returned if value is null.
     */
    newQuantity(value: Decimal): Quantity;
    /**
     * Rounds the Quantity value to the number of specified decimal digits.
     */
    round(precision: number): Quantity;
    /**
     * Subtract Quantity object from the current object. Only objects representing the same unit can be subtracted.
     */
    subtract(value: Quantity): Quantity;
    /**
     * Returns a string representation of this quantity object.
     */
    toString(): string;
    /**
     * According to the ECMA spec returns the "natural" primitive value. Here
     * the value portion of the Quantity is returned.
     */
    valueOf(): any;
}

export = Quantity;
