import Collection = require('../util/Collection');

/**
 * Represents an HTTP parameter.
 */
declare class HttpParameter {
    /**
     * Returns the value of the current HttpParameter attribute as a boolean. If
     * there is more than one value defined, only the first one is returned. For an
     * undefined attribute it returns null.
     */
    readonly booleanValue: boolean;
    /**
     * Returns the value of the current HttpParameter attribute as a date. If
     * there is more than one value defined, only the first one is returned. For
     * an undefined attribute and if attribute is not a date it return null.
     */
    readonly dateValue: Date | null;
    /**
     * Returns the value of the current HttpParameter attribute as a number. If
     * there is more than one value defined, only the first one is returned. For
     * an undefined attribute it returns 0.0.
     */
    readonly doubleValue: number;
    /**
     * Identifies if there is a value for the http parameter attribute
     * and whether the value is empty.
     * A value is treated as empty if it's not blank.
     */
    readonly empty: boolean;
    /**
     * Returns the value of the current HttpParameter attribute as int. If there
     * is more than one value defined, only the first one is returned. For an
     * undefined attribute it returns null.
     */
    readonly intValue: number;
    /**
     * Returns the raw value for this HttpParameter instance.
     * The raw value is the not trimmed String value of this HTTP parameter.
     * If there is more than one value defined, only the first one is returned. For an
     * undefined attribute the method returns a null.
     * @see getStringValue
     */
    readonly rawValue: string | null;
    /**
     * Returns a Collection of all raw values for this HTTP parameter.
     * The raw value is the not trimmed String value of this HTTP parameter.
     * @see getStringValues
     */
    readonly rawValues: Collection<string>;
    /**
     * Returns the value of the current HttpParameter attribute. If there is
     * more than one value defined, only the first one is returned. For an
     * undefined attribute the method returns a null.
     */
    readonly stringValue: string | null;
    /**
     * Returns a Collection of all defined values for this HTTP parameter.
     */
    readonly stringValues: Collection<string>;
    /**
     * Identifies if the parameter was submitted. This is equivalent to the
     * check, whether the parameter has a value.
     */
    readonly submitted: boolean;
    /**
     * Returns the value of the current HttpParameter attribute. If there is
     * more than one value defined, only the first one is returned. For an
     * undefined attribute the method returns null.
     */
    readonly value: string | null;
    /**
     * Returns a Collection of all defined values for this current HTTP parameter.
     * @see getStringValues
     */
    readonly values: Collection<string>;
    private constructor();
    /**
     * Identifies if the given value is part of the actual values.
     */
    containsStringValue(value: string): boolean;
    /**
     * Returns the value of the current HttpParameter attribute as a boolean. If
     * there is more than one value defined, only the first one is returned. For an
     * undefined attribute it returns null.
     */
    getBooleanValue(): boolean;
    /**
     * Returns the value of the current HttpParameter attribute as a boolean. If there
     * is more than one value defined, only the first one is returned. For an
     * undefined attribute it returns the given default value.
     */
    getBooleanValue(defaultValue: boolean): boolean;
    /**
     * Returns the value of the current HttpParameter attribute as a date. If
     * there is more than one value defined, only the first one is returned. For
     * an undefined attribute and if attribute is not a date it return null.
     */
    getDateValue(): Date | null;
    /**
     * Returns the value of the current HttpParameter attribute as a date. If
     * there is more than one value defined, only the first one is returned. For
     * an undefined attribute it returns the given default value and if
     * the attributes is not a date it returns null.
     */
    getDateValue(defaultValue: Date): Date;
    /**
     * Returns the value of the current HttpParameter attribute as a number. If
     * there is more than one value defined, only the first one is returned. For
     * an undefined attribute it returns 0.0.
     */
    getDoubleValue(): number;
    /**
     * Returns the value of the current HttpParameter attribute as a number. If
     * there is more than one value defined, only the first one is returned. For
     * an undefined attribute it returns the given default value.
     */
    getDoubleValue(defaultValue: number): number;
    /**
     * Returns the value of the current HttpParameter attribute as int. If there
     * is more than one value defined, only the first one is returned. For an
     * undefined attribute it returns null.
     */
    getIntValue(): number;
    /**
     * Returns the value of the current HttpParameter attribute as an integer. If there
     * is more than one value defined, only the first one is returned. For an
     * undefined attribute it returns the given default value.
     */
    getIntValue(defaultValue: number): number;
    /**
     * Returns the raw value for this HttpParameter instance.
     * The raw value is the not trimmed String value of this HTTP parameter.
     * If there is more than one value defined, only the first one is returned. For an
     * undefined attribute the method returns a null.
     * @see getStringValue
     */
    getRawValue(): string | null;
    /**
     * Returns a Collection of all raw values for this HTTP parameter.
     * The raw value is the not trimmed String value of this HTTP parameter.
     * @see getStringValues
     */
    getRawValues(): Collection<string>;
    /**
     * Returns the value of the current HttpParameter attribute. If there is
     * more than one value defined, only the first one is returned. For an
     * undefined attribute the method returns a null.
     */
    getStringValue(): string | null;
    /**
     * Returns the value of the current HttpParameter attribute. If there is
     * more than one value defined, only the first one is returned. For an
     * undefined attribute the method returns the given default value.
     */
    getStringValue(defaultValue: string): string;
    /**
     * Returns a Collection of all defined values for this HTTP parameter.
     */
    getStringValues(): Collection<string>;
    /**
     * Returns the value of the current HttpParameter attribute. If there is
     * more than one value defined, only the first one is returned. For an
     * undefined attribute the method returns null.
     */
    getValue(): string | null;
    /**
     * Returns a Collection of all defined values for this current HTTP parameter.
     * @see getStringValues
     */
    getValues(): Collection<string>;
    /**
     * Identifies if the given String is an actual value of this http parameter.
     */
    isChecked(value: string): boolean;
    /**
     * Identifies if there is a value for the http parameter attribute
     * and whether the value is empty.
     * A value is treated as empty if it's not blank.
     */
    isEmpty(): boolean;
    /**
     * Identifies if the parameter was submitted. This is equivalent to the
     * check, whether the parameter has a value.
     */
    isSubmitted(): boolean;
    /**
     * Returns the value of the current HttpParameter attribute. If there is
     * more than one value defined, only the first one is returned. For an
     * undefined attribute the method returns an empty string.
     */
    toString(): string;
}

export = HttpParameter;
