/**
 * The class represents a single value for an Enumeration type. Enumeration
 * types can be configured through the business manager for custom attributes.
 * Some system attributes, e.g. the order status, are also of Enumeration types.
 * 
 * Each EnumValue has a base value and a display value.  The type of the base
 * value can be either String or Integer. Every EnumValue has a display value.
 * 
 * If the value of an Enumeration type object attribute is
 * `null`, when that attribute is accessed an EnumValue is returned
 * that has a base value of `null`, rather than `null`
 * itself.  This means that `empty(object.attribute)` would be
 * `false`, and `empty(object.attribute.value)` would be
 * `true`
 * .
 */
declare class EnumValue {
    /**
     * Returns the display value of the enumeration value. If no display value
     * is configured the method return the string representation of the value.
     */
    readonly displayValue: string;
    /**
     * Returns the value of the enumeration value. This is either an integer
     * value or a string.
     */
    readonly value: any;
    private constructor();
    /**
     * Returns the display value of the enumeration value. If no display value
     * is configured the method return the string representation of the value.
     */
    getDisplayValue(): string;
    /**
     * Returns the value of the enumeration value. This is either an integer
     * value or a string.
     */
    getValue(): any;
    /**
     * Same as getDisplayValue().
     */
    toString(): string;
    /**
     * According the ECMA specification, this method returns the "natural"
     * primitive value of this object. Here it is equivalent to getValue().
     */
    valueOf(): any;
}

export = EnumValue;
